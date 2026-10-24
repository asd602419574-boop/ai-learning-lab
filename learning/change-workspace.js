/* File-based V2.3 dossier; imported reports are data, never executed. */
(() => {
'use strict';
const C=window.ChangeCore,D=window.ChangeContent;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host,state=C.empty(),chapter=1,view='reading',pending=null,message='',result=null;
const link=(ch=chapter,v=view)=>'#change?chapter='+ch+(v==='practice'?'&view=practice':'');
function reportView(){const r=state.report;if(!r)return '<p>还没有工程报告；业务路线不要求运行代码。</p>';
return '<p><strong>本地报告自报，未独立复核来源。</strong> '+(r.passed?'报告声明固定规则通过':'报告包含失败项')+' · '+(r.variant?'独立变式':'基础示范')+'</p><details><summary>查看检查反馈、源码摘要与真实请求/SQL记录</summary><pre>'+esc(JSON.stringify(r,null,2))+'</pre></details>';}
function feedback(){
const panel=host?.querySelector('[data-change-feedback]');if(!panel)return;
panel.innerHTML='<p role="status">'+esc(message)+'</p><p><strong>'+(C.current(state)?(state.track==='business'?'设计已提交，材料结构齐全，设计语义待复核。':'工程材料已提交；所导入报告固定规则通过，来源未独立复核。'):'当前修订尚未提交。编辑、换路线或更换报告后需重新检查。')+'</strong></p><p>知识掌握未知；检查不按字数或自评评分。</p>'+(result?'<ul>'+result.issues.map(i=>'<li><a href="#change-field-'+esc(i.field)+'" data-change-focus="'+esc(i.field)+'">'+esc(i.message)+'</a></li>').join('')+'</ul><p>'+esc(result.scope)+'</p>':'');
const report=host.querySelector('[data-change-report]');if(report)report.innerHTML=reportView();
const preview=host.querySelector('[data-change-preview]');if(preview)preview.innerHTML=pending?'<p>待恢复：'+esc(pending.name)+'；路线 '+esc(pending.state.track)+'；'+pending.state.submissions.length+' 次历史提交。确认将替换本任务当前内存材料，请先导出需要保留的内容。</p><button class="btn" data-change-action="restore">确认恢复此作品</button> <button class="btn btn-secondary" data-change-action="cancel">取消</button>':'';
const history=host.querySelector('[data-change-history]');if(history)history.innerHTML=state.submissions.slice().reverse().map(v=>'<details><summary>'+esc(v.at)+' · '+esc(v.track)+' · 提交快照</summary><pre>'+esc(JSON.stringify(v.design,null,2))+'</pre></details>').join('')||'<p>暂无提交快照。</p>';
}
function workbench(){return '<div class="arch-workbench" data-change-workspace><aside class="arch-mode"><strong>当前设计与笔记仅在本页内存。离开或刷新前先导出；下次可预览确认恢复。</strong><p>本任务不写旧学习键，不运行导入代码，也不自动上传资料。代码修改在本机独立实验目录进行。</p></aside><label class="arch-field">学习深度<select data-change-track><option value="business"'+(state.track==='business'?' selected':'')+'>业务/架构路线：分析、设计与验收方案</option><option value="engineering"'+(state.track==='engineering'?' selected':'')+'>工程实践路线：设计 + 真实修改与独立变式</option></select></label>'+C.FIELDS.map(k=>'<label class="arch-field" id="change-field-'+k+'">'+esc(C.labels[k])+'<textarea rows="5" maxlength="6000" data-change-field="'+k+'">'+esc(state.design[k])+'</textarea></label>').join('')+'<section class="arch-card" id="change-field-report"><h2>工程报告与代码修改记录</h2><p>工程路线需先在本机运行check，修复失败，再运行check --variant。选择生成的evidence/check-*.json；此处只校验报告材料，不能独立证明代码或来源。</p><label class="arch-field">导入本地HTTP/SQLite验收报告<input type="file" accept="application/json,.json" data-change-report-file></label><div data-change-report></div><p>源码diff、数据库与额外边界结果仍保留在本地目录；请在上方修改记录写明文件、命令与证据位置，勿提交真实业务资料。</p></section><div class="arch-actions"><button class="btn btn-secondary" data-change-action="check">检查材料与反馈</button><button class="btn" data-change-action="submit">提交当前修订</button><button class="btn btn-secondary" data-change-action="export">导出设计与证据</button></div><section class="arch-card" data-change-feedback aria-live="polite"></section><section class="arch-card"><h2>恢复自己的作品文件</h2><label class="arch-field">选择之前导出的作品JSON（不是check报告）<input type="file" accept="application/json,.json" data-change-artifact-file></label><div data-change-preview></div></section><section class="arch-card"><h2>最近提交快照（最多10次）</h2><div data-change-history></div></section></div>';}
function paint(){const ch=D.chapters[chapter-1];
host.innerHTML='<div class="architecture-course '+(view==='reading'?'architecture-reading':'architecture-practice')+'"><article class="system-paper arch-paper"><header><p class="system-kicker">独立需求变更 · 同一个企业审批系统</p><p class="arch-course-name">'+esc(D.title)+'</p><h1>第'+chapter+'阶段：'+esc(ch.title)+'</h1><p class="system-lead">'+esc(ch.objective)+'</p></header><nav class="system-view-tabs" aria-label="变更任务阅读与成果"><a href="'+link(chapter,'reading')+'"'+(view==='reading'?' aria-current="page"':'')+'>学习与操作指导</a><a href="'+link(chapter,'practice')+'"'+(view==='practice'?' aria-current="page"':'')+'>双路线成果工作区</a><a href="#architecture">回看V2.2原系统</a></nav>'+(view==='reading'?'<div class="system-reading" data-change-reading>'+ch.sections.map(s=>'<section><h2>'+esc(s.title)+'</h2>'+s.html+'</section>').join('')+'</div><a class="btn" href="'+link(chapter,'practice')+'">记录自己的设计与变更证据 →</a>':workbench())+'<nav class="system-footer" aria-label="相邻变更阶段">'+(chapter>1?'<a href="'+link(chapter-1)+'">← '+esc(D.chapters[chapter-2].title)+'</a>':'<a href="#architecture">回到原系统架构课程</a>')+(chapter<5?'<a href="'+link(chapter+1)+'">'+esc(D.chapters[chapter].title)+' →</a>':'<a href="'+link(5,'practice')+'">提交与导出 →</a>')+'</nav></article></div>';feedback();}
function click(event){const focus=event.target.closest('[data-change-focus]');if(focus){event.preventDefault();host.querySelector('[data-change-field="'+focus.dataset.changeFocus+'"]')?.focus();return;}
const target=event.target.closest('[data-change-action]');if(!target)return;
try{const action=target.dataset.changeAction;
if(action==='check'){result=C.check(state);message=result.ready?'必要材料已填写；这只是结构检查，设计正确性和专业能力尚未判断。':'请按下方具体反馈补充或修正。';feedback();}
else if(action==='submit'){result=C.submit(state);message=result.ready?'已保存当前修订的提交快照，请导出文件保留。':'当前材料尚不满足本路线必要检查；没有记为通过。';feedback();}
else if(action==='export'){const text=JSON.stringify(state,null,2);C.parse(text);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='approval-change-artifact.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='作品已发起下载；确认文件保留后再离开。';feedback();}
else if(action==='restore'&&pending){state=pending.state;pending=null;result=null;message='已恢复本任务作品；未改写其他课程记录。';paint();}
else if(action==='cancel'){pending=null;message='已取消恢复，当前材料保留。';feedback();}
}catch(error){message=error.message;feedback();}}
async function change(event){const target=event.target;
if(target.hasAttribute('data-change-track')){state.track=target.value==='engineering'?'engineering':'business';result=null;message='已切换路线；已有分析保留，需按当前路线重新提交。';feedback();return;}
const report=target.hasAttribute('data-change-report-file'),artifact=target.hasAttribute('data-change-artifact-file');if(!report&&!artifact)return;
const file=target.files?.[0];if(!file)return;
try{if(file.size>4000000)throw Error('文件超过4MB，请使用本任务导出的单个JSON。');const text=await file.text();
if(report){C.attach(state,JSON.parse(text));result=C.check(state);message='报告已导入；仅核对格式与固定规则，来源未经独立复核。';}
else {pending={name:file.name,state:C.parse(text)};message='作品已读取，请预览并确认恢复；当前内容尚未覆盖。';}
}catch(error){message='文件未应用：'+error.message;}
target.value='';feedback();}
function render(root,ch=1,v='reading'){host=root;chapter=Math.max(1,Math.min(5,Number(ch)||1));view=v==='practice'?'practice':'reading';host.onclick=click;host.onchange=change;host.oninput=event=>{const k=event.target.dataset.changeField;if(C.FIELDS.includes(k)){state.design[k]=event.target.value;result=null;message='当前材料已修改；旧提交保留为快照，需重新检查并提交。';feedback();}};paint();}
window.ChangeWorkspace={render};
})();
