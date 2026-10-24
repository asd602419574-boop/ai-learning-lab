"""One local urgency-change exercise. Author: Lliftime.
No original database is opened: every attempt starts with fixed fictitious v1 data.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import socket
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid

ROOT=Path(__file__).resolve().parents[1]
LABS=ROOT/'.change-labs'
TABLES=('lab_users','applications','application_events')


def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_hashes(directory):
    return {str(p.relative_to(directory)):digest(p) for p in sorted(Path(directory).rglob('*'))
            if p.is_file() and p.suffix in ('.py','.sql') and '__pycache__' not in p.parts}


def location(name,labs=LABS):
    if not re.fullmatch(r'[a-zA-Z0-9][a-zA-Z0-9_-]{0,39}',name):
        raise ValueError('实验名只允许1–40位字母、数字、下划线或连字符。')
    base=Path(labs).resolve(); result=base/name
    if result.is_symlink() or result.resolve().parent!=base: raise ValueError('拒绝符号链接或目录穿越。')
    return result


def snapshot(source,target):
    with sqlite3.connect(source.as_uri()+'?mode=ro',uri=True) as src, sqlite3.connect(target) as dest:
        src.backup(dest)


def rows(database,sql,args=()):
    with sqlite3.connect(database.as_uri()+'?mode=ro',uri=True) as conn:
        conn.row_factory=sqlite3.Row
        return [dict(r) for r in conn.execute(sql,args)]


def prepare(name,labs=LABS,baseline_from=None):
    target=location(name,labs)
    if target.exists(): raise ValueError('该目录已经存在；换一个名字保留原尝试，禁止覆盖。')
    source=checked(baseline_from,labs)[0]/'baseline' if baseline_from else None
    if source and not (source/'manifest.json').is_file(): raise ValueError('找不到可恢复的原始基线。')
    target.parent.mkdir(parents=True,exist_ok=True)
    target.mkdir()
    try:
        for folder in ('learning','content','projects','training','feedback'):
            if (ROOT/folder).is_dir(): shutil.copytree(ROOT/folder,target/folder)
        for name in ('index.html','desktop.css'): shutil.copy2(ROOT/name,target/name)
        shutil.copytree(source/'teaching_server' if source else ROOT/'teaching_server',target/'teaching_server',ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
        (target/'baseline').mkdir(); (target/'instance').mkdir()
        if source: shutil.copy2(source/'architecture-workspace.js',target/'learning/architecture-workspace.js')
        shutil.copy2(target/'learning/architecture-workspace.js',target/'baseline/architecture-workspace.js')
        shutil.copytree(target/'teaching_server',target/'baseline/teaching_server')
        database=target/'baseline/approval.sqlite3'
        if source: snapshot(source/'approval.sqlite3',database)
        else:
            # Seed only fictitious legacy rows, never the learner's original teaching database.
            code='''from teaching_server import db,service
import sys
p=sys.argv[1]; db.initialize(p)
with db.connect(p) as c:
 u=dict(c.execute("SELECT * FROM lab_users WHERE id='alice'").fetchone())
 for n in range(3):
  service.submit(c,u,{'title':'旧教学申请'+str(n),'purpose':'虚构的迁移前样本','amount_cents':230000,'cost_center':'LEGACY'},500000,'legacy-'+str(n))
'''
            run=subprocess.run([sys.executable,'-c',code,str(database)],cwd=target,env=clean_env(),capture_output=True,text=True)
            if run.returncode: raise ValueError('创建旧库失败：'+run.stderr[-1600:])
        snapshot(database,target/'instance/approval.sqlite3')
        manifest={'format':'approval-change-baseline','version':1,'source_base':'5929b05',
                  'source_hashes':source_hashes(target/'teaching_server'),'database_sha256':digest(database),
                  'frontend_sha256':digest(target/'baseline/architecture-workspace.js'),
                  'legacy':{t:rows(database,'SELECT * FROM '+t+' ORDER BY id') for t in TABLES}}
        (target/'baseline/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
        (target/'ATTEMPT.md').write_text('本目录可修改teaching_server与learning；baseline用于重做，不要修改。\n原数据库不在此目录；固定虚构旧申请用于兼容验收。\n从主仓运行change_lab.py check生成证据；重做用prepare 新名 --from-baseline 当前名，不覆盖原尝试。\n',encoding='utf-8')
        return target
    except Exception:
        # Keep partial output for diagnosis; never recursively remove a learner directory.
        raise


def clean_env():
    env=os.environ.copy();env.pop('PYTHONPATH',None);env.pop('PYTHONHOME',None)
    env['PYTHONDONTWRITEBYTECODE']='1'
    return env


def checked(name,labs=LABS):
    path=location(name,labs)
    if not (path/'baseline/manifest.json').is_file(): raise ValueError('请先prepare创建独立实验。')
    manifest=json.loads((path/'baseline/manifest.json').read_text('utf-8'))
    if source_hashes(path/'baseline/teaching_server')!=manifest['source_hashes'] or digest(path/'baseline/approval.sqlite3')!=manifest['database_sha256'] or digest(path/'baseline/architecture-workspace.js')!=manifest['frontend_sha256']:
        raise ValueError('原始基线副本已被改变，不能据此证明兼容或恢复；请新建实验。')
    return path,manifest


def apply_reference(name,labs=LABS):
    path,manifest=checked(name,labs)
    if source_hashes(path/'teaching_server')!=manifest['source_hashes'] or digest(path/'learning/architecture-workspace.js')!=manifest['frontend_sha256']:
        raise ValueError('代码已有修改，拒绝覆盖；请另建示范副本。')
    patch=(ROOT/'practice/urgency/reference.patch').read_text('utf-8').splitlines(keepends=True)
    outputs={};i=0
    while i<len(patch):
        if not patch[i].startswith('--- '): i+=1;continue
        old=patch[i][4:].strip();new=patch[i+1][4:].strip();i+=2
        relative=new.removeprefix('b/')
        if not relative.startswith(('teaching_server/','learning/')) or '..' in Path(relative).parts:
            raise ValueError('参考补丁路径非法。')
        file=path/relative
        if file.is_symlink(): raise ValueError('拒绝符号链接。')
        original=[] if old=='/dev/null' else file.read_text('utf-8').splitlines(keepends=True)
        output=[];cursor=0
        while i<len(patch) and patch[i].startswith('@@'):
            match=re.match(r'@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@',patch[i])
            if not match: raise ValueError('参考补丁区块错误。')
            start=max(0,int(match[1])-1); output.extend(original[cursor:start]);cursor=start;i+=1
            while i<len(patch) and patch[i][:1] in (' ','+','-') and not patch[i].startswith('--- '):
                line=patch[i];i+=1
                if line[0] in (' ','-'):
                    if cursor>=len(original) or original[cursor]!=line[1:]: raise ValueError('补丁与当前文件不匹配；未写入。')
                    cursor+=1
                if line[0] in (' ','+'): output.append(line[1:])
        output.extend(original[cursor:]);outputs[file]=''.join(output)
    if not outputs: raise ValueError('参考补丁为空。')
    for file,content in outputs.items(): file.write_text(content,encoding='utf-8')
    return path


def check(name,labs=LABS,variant=False):
    path,manifest=checked(name,labs)
    report={'format':'approval-change-evidence','version':1,'lab':path.name,'variant':variant,
            'created_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'source_hashes':source_hashes(path/'teaching_server'),
            'tested_database_sha256':digest(path/'instance/approval.sqlite3'),
            'frontend_sha256':digest(path/'learning/architecture-workspace.js'),
            'scope':'真实本机HTTP与SQLite固定验收；在临时副本执行，不证明独立完成或专业掌握；源码修改后须重验',
            'checks':[],'requests':[],'sql':[]}
    def mark(key,ok,feedback): report['checks'].append({'id':key,'passed':bool(ok),'feedback':feedback})
    with tempfile.TemporaryDirectory(prefix='approval-change-check-') as temp:
        temp=Path(temp)
        shutil.copytree(path/'teaching_server',temp/'teaching_server',ignore=shutil.ignore_patterns('__pycache__','*.pyc'))
        database=temp/'approval.sqlite3';snapshot(path/'instance/approval.sqlite3',database)
        with socket.socket() as probe: probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
        base=f'http://127.0.0.1:{port}'
        log=temp/'server.log'
        with log.open('w',encoding='utf-8') as output:
            child=subprocess.Popen([sys.executable,'-m','teaching_server','--port',str(port),'--database',str(database)],cwd=temp,env=clean_env(),stdout=output,stderr=output)
            opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
            def call(method,suffix,body=None,user='alice',record=True):
                headers={'X-Lab-User':user,'Origin':base}
                if body is not None: headers['Content-Type']='application/json'
                req=urllib.request.Request(base+'/api/teaching'+suffix,data=None if body is None else json.dumps(body,ensure_ascii=False).encode(),method=method,headers=headers)
                try: response=opener.open(req,timeout=5)
                except urllib.error.HTTPError as error: response=error
                with response:
                    raw=response.read().decode('utf-8'); value=json.loads(raw)
                    entry={'method':method,'path':suffix,'identity':user,'request':body,'status':response.status,'response':value}
                if record: report['requests'].append(entry)
                return entry['status'],value
            try:
                ready=False
                for _ in range(100):
                    if child.poll() is not None: break
                    try:
                        if call('GET','/health',record=False)[0]==200: ready=True;break
                    except (OSError,ValueError): pass
                    time.sleep(.05)
                if not ready: raise ValueError('服务启动失败；检查迁移、导入和依赖。'+log.read_text('utf-8')[-1600:])
                mark('service',True,'修改后的副本已通过真实HTTP启动。')
                # Legacy columns/rows/events must remain byte-for-value identical after migration.
                legacy_ok=True
                for table,old_rows in manifest['legacy'].items():
                    for old in old_rows:
                        found=rows(database,'SELECT * FROM '+table+' WHERE id=?',(old['id'],))
                        legacy_ok &= bool(found) and all(found[0].get(k)==v for k,v in old.items())
                old_read=call('GET','/applications/1')[1].get('application',{})
                mark('legacy',legacy_ok and old_read.get('urgency')=='normal' and old_read.get('urgent_reason')=='','旧字段/事件保留，旧申请HTTP读回须默认normal、原因为空。')
                body={'title':'独立验收设备','purpose':'虚构变更实验','amount_cents':230000,'cost_center':'CHANGE'}
                code,normal=call('POST','/applications',body)
                mark('old-client',code==201 and normal.get('application',{}).get('urgency')=='normal','不带新字段的旧请求仍须201并默认normal。')
                urgent={**body,'urgency':'urgent','urgent_reason':'现场设备故障导致教学无法继续'}
                code,value=call('POST','/applications',urgent)
                app=value.get('application',{});identifier=app.get('id')
                mark('urgent-create',code==201 and app.get('urgency')=='urgent' and app.get('urgent_reason')==urgent['urgent_reason'],'新字段应在201响应中真实返回。')
                if identifier:
                    code,read=call('GET',f'/applications/{identifier}')
                    stored=rows(database,'SELECT urgency,urgent_reason FROM applications WHERE id=?',(identifier,))
                    report['sql'].append({'query':'SELECT urgency,urgent_reason FROM applications WHERE id=?','parameters':[identifier],'rows':stored})
                    mark('persist-read',code==200 and read.get('application',{}).get('urgency')=='urgent' and stored==[{'urgency':'urgent','urgent_reason':urgent['urgent_reason']}],'HTTP查询与独立SQLite行必须一致。')
                invalid=[{'urgency':'fast'},{'urgency':None},{'urgency':2},{'urgency':''},{'urgency':'urgent'},{'urgency':'urgent','urgent_reason':'  '},{'urgency':'urgent','urgent_reason':None},{'urgency':'urgent','urgent_reason':12},{'urgency':'urgent','urgent_reason':'x'*501}]
                count=rows(database,'SELECT COUNT(*) AS n FROM applications')[0]['n']
                codes=[call('POST','/applications',{**body,**extra})[0] for extra in invalid]
                mark('validation',all(c==422 for c in codes) and count==rows(database,'SELECT COUNT(*) AS n FROM applications')[0]['n'],'未知/空/null/类型/缺原因/超长原因必须422且不插入。')
                try:
                    with sqlite3.connect(database) as conn:
                        conn.execute("UPDATE applications SET urgency='fast' WHERE id=1")
                    constraints=False
                except sqlite3.IntegrityError: constraints=True
                try:
                    with sqlite3.connect(database) as conn:
                        conn.execute("UPDATE applications SET urgency='urgent',urgent_reason='' WHERE id=1")
                    constraints=False
                except sqlite3.IntegrityError: pass
                mark('database-constraint',constraints,'数据库本身也须拒绝未知等级和urgent空原因（不是只校验表单）。')
                # Always exercise unchanged decisions with new-field requests, plus terminal conflicts.
                for action in ('approved','rejected','withdrawn'):
                    code,created=call('POST','/applications',urgent)
                    item=created.get('application',{});itemid=item.get('id')
                    if not itemid: mark(action,False,'先实现新字段创建，才能验证原状态链。');continue
                    payload={'expected_version':1,'reason':'固定回归验收'}
                    suffix=f'/applications/{itemid}/withdraw' if action=='withdrawn' else f'/applications/{itemid}/decisions'
                    if action!='withdrawn': payload['decision']=action
                    code,result=call('POST',suffix,payload,user='alice' if action=='withdrawn' else 'manager')
                    repeat=call('POST',f'/applications/{itemid}/decisions',{'expected_version':1,'reason':'重复决定','decision':'approved'},user='manager')[0]
                    events=rows(database,'SELECT action,version FROM application_events WHERE application_id=? ORDER BY version',(itemid,))
                    mark(action,code==200 and result.get('application',{}).get('status')==action and repeat==409 and len(events)==2,'合法'+action+'应200，终态再审批409且只有两条事件。')
                code,high=call('POST','/applications',{**urgent,'amount_cents':500001})
                item=high.get('application',{});itemid=item.get('id')
                forbidden=call('POST',f'/applications/{itemid}/decisions',{'expected_version':1,'reason':'紧急也不越权','decision':'approved'},user='manager')[0] if itemid else 0
                allowed=call('POST',f'/applications/{itemid}/decisions',{'expected_version':1,'reason':'授权岗位核对','decision':'approved'},user='director')[0] if itemid else 0
                mark('role-boundary',code==201 and item.get('required_role')=='director' and forbidden==403 and allowed==200,'紧急高额仍由负责人审批，主管403。')
                if variant:
                    code,_=call('POST','/applications',{**urgent,'urgent_reason':'很急'})
                    mark('independent-variant',code==422,'独立变式：紧急原因去首尾空格后少于12字符应422；示范补丁故意不满足此项。')
                    try:
                        with sqlite3.connect(database) as conn:
                            conn.execute("UPDATE applications SET urgency='urgent',urgent_reason='很急' WHERE id=1")
                        variant_constraint=False
                    except sqlite3.IntegrityError: variant_constraint=True
                    mark('variant-database',variant_constraint,'独立变式：直接SQL写入短紧急原因也应被数据库拒绝。')
                # Restart the real service on the same migrated file, then read the inserted row.
                child.terminate();child.wait(timeout=5)
                child=subprocess.Popen([sys.executable,'-m','teaching_server','--port',str(port),'--database',str(database)],cwd=temp,env=clean_env(),stdout=output,stderr=output)
                restarted=False
                for _ in range(100):
                    if child.poll() is not None: break
                    try:
                        code,r=call('GET',f'/applications/{identifier or 1}',record=False)
                        if code==200: restarted=True;break
                    except (OSError,ValueError): pass
                    time.sleep(.05)
                mark('restart',restarted and (not identifier or r.get('application',{}).get('urgency')=='urgent'),'重启同一文件库应幂等迁移并读回紧急字段。')
            except Exception as error:
                mark('execution',False,str(error)+'；按反馈修正代码后重跑，失败不是掌握结论。')
            finally:
                if child.poll() is None: child.terminate()
                try: child.wait(timeout=5)
                except subprocess.TimeoutExpired: child.kill();child.wait()
    report['passed']=bool(report['checks']) and all(c['passed'] for c in report['checks'])
    folder=path/'evidence';folder.mkdir(exist_ok=True)
    destination=folder/('check-'+uuid.uuid4().hex[:10]+'.json')
    report['evidence_file']=str(destination)
    destination.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    return report


def main():
    parser=argparse.ArgumentParser(description='V2.3单个需求变更实验；仅虚构数据的本机副本。')
    parser.add_argument('command',choices=['prepare','demo','check','serve'])
    parser.add_argument('name');parser.add_argument('--from-baseline');parser.add_argument('--variant',action='store_true');parser.add_argument('--port',type=int,default=8878)
    args=parser.parse_args()
    try:
        if args.command in ('prepare','demo'):
            path=prepare(args.name,baseline_from=args.from_baseline)
            if args.command=='demo': apply_reference(args.name)
            print('已创建独立'+('参考示范' if args.command=='demo' else '未完成练习')+'：'+str(path))
            print('修改副本代码后运行：python scripts/change_lab.py check '+args.name)
        elif args.command=='check':
            report=check(args.name,variant=args.variant)
            for item in report['checks']: print(('PASS' if item['passed'] else 'FAIL')+' '+item['id']+'：'+item['feedback'])
            print('证据：'+report['evidence_file']);raise SystemExit(0 if report['passed'] else 1)
        else:
            path,_=checked(args.name)
            if not 1024<=args.port<=65535: raise ValueError('端口须为1024–65535。')
            raise SystemExit(subprocess.call([sys.executable,'-m','teaching_server','--port',str(args.port),'--database',str(path/'instance/approval.sqlite3')],cwd=path,env=clean_env()))
    except (ValueError,OSError,subprocess.SubprocessError) as error:
        parser.exit(2,str(error)+'\n')


if __name__=='__main__': main()
