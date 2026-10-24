/* Locally autosaved V2.3 dossier with explicit file backup; imports are never executed. */
(() => {
'use strict';
const C=window.ChangeCore,D=window.ChangeContent;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let host,state=C.empty(),chapter=1,view='reading',pending=null,message='',result=null,store=null,saveNotice='';
function ensure(){if(store)return;const storage=window.LearningStorage?.storage||{getItem(){throw Error('学习存储保护未加载。');},setItem(){throw Error('学习存储保护未加载。');}};store=C.createStore(storage);state=store.read();saveNotice=store.getError()||(store.hasSaved()?'已自动恢复本机设计稿、路线、报告与提交快照。':'尚无本机设计稿；编辑后会立即自动保存。');}
function persist(restore=false){ensure();const saved=store.write(state,{restore});saveNotice=saved.ok?'已自动保存在本机 · '+new Date().toLocaleTimeString()+'；刷新可恢复。':'未保存：'+saved.error+' 本页材料仍在内存，请导出JSON保留。';return saved.ok;}
const link=(ch=chapter,v=view)=>'#change?chapter='+ch+(v==='practice'?'&view=practice':'');
function reportView(){const r=state.report;if(!r)return '<p>还没有工程报告；业务路线不要求运行代码。</p>';
return '<p><strong>本地报告自报，未独立复核来源。</strong> '+(r.passed?'报告声明固定规则通过':'报告包含失败项')+' · '+(r.variant?'独立变式':'基础示范')+'</p><details><summary>查看检查反馈、源码摘要与真实请求/SQL记录</summary><pre>'+esc(JSON.stringify(r,null,2))+'</pre></details>';}
function feedback(){
const saved=host?.querySelector('[data-change-save]');if(saved)saved.textContent=(window.LearningStorage?.role!=='writer'?'本页当前只读，不会写入设计稿；可导出当前材料。 ':'')+saveNotice;
const panel=host?.querySelector('[data-change-feedback]');if(!panel)return;
panel.innerHTML='<p role="status">'+esc(message)+'</p><p><strong>'+(C.current(state)?(state.track==='business'?'设计已提交，材料结构齐全，设计语义待复核。':'工程材料已提交；所导入报告固定规则通过，来源未独立复核。'):'当前修订尚未提交。编辑、换路线或更换报告后需重新检查。')+'</strong></p><p>知识掌握未知；检查不按字数或自评评分。</p>'+(result?'<ul>'+result.issues.map(i=>'<li><a href="#change-field-'+esc(i.field)+'" data-change-focus="'+esc(i.field)+'">'+esc(i.message)+'</a></li>').join('')+'</ul><p>'+esc(result.scope)+'</p>':'');
const report=host.querySelector('[data-change-report]');if(report)report.innerHTML=reportView();
const preview=host.querySelector('[data-change-preview]');if(preview)preview.innerHTML=pending?'<p>待恢复：'+esc(pending.name)+'；路线 '+esc(pending.state.track)+'；'+pending.state.submissions.length+' 次历史提交。确认将替换本任务当前内存材料，请先导出需要保留的内容。</p><button class="btn" data-change-action="restore">确认恢复此作品</button> <button class="btn btn-secondary" data-change-action="cancel">取消</button>':'';
const history=host.querySelector('[data-change-history]');if(history)history.innerHTML=state.submissions.slice().reverse().map(v=>'<details><summary>'+esc(v.at)+' · '+esc(v.track)+' · 提交快照</summary><pre>'+esc(JSON.stringify(v.design,null,2))+'</pre></details>').join('')||'<p>暂无提交快照。</p>';
}
function workbench(){return '<div class="arch-workbench" data-change-workspace><aside class="arch-mode"><strong>设计稿会自动保存在当前浏览器与地址，刷新可恢复；重要版本仍请导出JSON备份。</strong><p>本任务使用独立键，原九个学习键与全站备份不变；V2.3请单独导出。换浏览器/端口或清理存储不会自动迁移。代码修改仍在本机副本中进行。</p></aside><p class="arch-service" data-change-save role="status" aria-live="polite"></p><label class="arch-field">学习深度<select data-change-track><option value="business"'+(state.track==='business'?' selected':'')+'>业务/架构路线：分析、设计与验收方案</option><option value="engineering"'+(state.track==='engineering'?' selected':'')+'>工程实践路线：设计 + 真实修改与独立变式</option></select></label>'+C.FIELDS.map(k=>'<label class="arch-field" id="change-field-'+k+'">'+esc(C.labels[k])+'<textarea rows="5" maxlength="6000" data-change-field="'+k+'">'+esc(state.design[k])+'</textarea></label>').join('')+'<section class="arch-card" id="change-field-report"><h2>工程报告与代码修改记录</h2><p>工程路线需先在本机运行check，修复失败，再运行check --variant。选择生成的evidence/check-*.json；此处只校验报告材料，不能独立证明代码或来源。</p><label class="arch-field">导入本地HTTP/SQLite验收报告<input type="file" accept="application/json,.json" data-change-report-file></label><div data-change-report></div><p>源码diff、数据库与额外边界结果仍保留在本地目录；请在上方修改记录写明文件、命令与证据位置，勿提交真实业务资料。</p></section><div class="arch-actions"><button class="btn btn-secondary" data-change-action="check">检查材料与反馈</button><button class="btn" data-change-action="submit">提交当前修订</button><button class="btn btn-secondary" data-change-action="export">导出设计与证据</button></div><section class="arch-card" data-change-feedback aria-live="polite"></section><section class="arch-card"><h2>恢复自己的作品文件</h2><label class="arch-field">选择之前导出的作品JSON（不是check报告）<input type="file" accept="application/json,.json" data-change-artifact-file></label><div data-change-preview></div></section><section class="arch-card"><h2>最近提交快照（最多10次）</h2><div data-change-history></div></section></div>';}
function paint(){const ch=D.chapters[chapter-1];
host.innerHTML='<div class="architecture-course '+(view==='reading'?'architecture-reading':'architecture-practice')+'"><article class="system-paper arch-paper"><header><p class="system-kicker">独立需求变更 · 同一个企业审批系统</p><p class="arch-course-name">'+esc(D.title)+'</p><h1>第'+chapter+'阶段：'+esc(ch.title)+'</h1><p class="system-lead">'+esc(ch.objective)+'</p></header><nav class="system-view-tabs" aria-label="变更任务阅读与成果"><a href="'+link(chapter,'reading')+'"'+(view==='reading'?' aria-current="page"':'')+'>学习与操作指导</a><a href="'+link(chapter,'practice')+'"'+(view==='practice'?' aria-current="page"':'')+'>双路线成果工作区</a><a href="#architecture">回看V2.2原系统</a></nav>'+(view==='reading'?'<div class="system-reading" data-change-reading>'+ch.sections.map(s=>'<section><h2>'+esc(s.title)+'</h2>'+s.html+'</section>').join('')+'</div><a class="btn" href="'+link(chapter,'practice')+'">记录自己的设计与变更证据 →</a>':workbench())+'<nav class="system-footer" aria-label="相邻变更阶段">'+(chapter>1?'<a href="'+link(chapter-1)+'">← '+esc(D.chapters[chapter-2].title)+'</a>':'<a href="#architecture">回到原系统架构课程</a>')+(chapter<5?'<a href="'+link(chapter+1)+'">'+esc(D.chapters[chapter].title)+' →</a>':'<a href="'+link(5,'practice')+'">提交与导出 →</a>')+'</nav></article></div>';feedback();}
function click(event){const focus=event.target.closest('[data-change-focus]');if(focus){event.preventDefault();host.querySelector('[data-change-field="'+focus.dataset.changeFocus+'"]')?.focus();return;}
const target=event.target.closest('[data-change-action]');if(!target)return;
try{const action=target.dataset.changeAction;
if(action==='check'){result=C.check(state);message=result.ready?'必要材料已填写；这只是结构检查，设计正确性和专业能力尚未判断。':'请按下方具体反馈补充或修正。';feedback();}
else if(action==='submit'){result=C.submit(state);if(result.ready)persist();message=result.ready?'已创建当前修订的提交快照；本机保存结果见上方状态，仍可导出备份。':'当前材料尚不满足本路线必要检查；没有记为通过。';feedback();}
else if(action==='export'){const text=JSON.stringify(state,null,2);C.parse(text);const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='approval-change-artifact.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);message='作品已发起下载；请确认文件已保留。';feedback();}
else if(action==='restore'&&pending){state=pending.state;pending=null;result=null;persist(true);message='已确认恢复本任务作品；自动保存结果见上方状态，未改写其他课程记录。';paint();}
else if(action==='cancel'){pending=null;message='已取消恢复，当前材料保留。';feedback();}
}catch(error){message=error.message;feedback();}}
async function change(event){const target=event.target;
if(target.hasAttribute('data-change-track')){state.track=target.value==='engineering'?'engineering':'business';result=null;persist();message='已切换路线；已有分析保留，需按当前路线重新提交。';feedback();return;}
const report=target.hasAttribute('data-change-report-file'),artifact=target.hasAttribute('data-change-artifact-file');if(!report&&!artifact)return;
const file=target.files?.[0];if(!file)return;
try{if(file.size>4000000)throw Error('文件超过4MB，请使用本任务导出的单个JSON。');const text=await file.text();
if(report){C.attach(state,JSON.parse(text));persist();result=C.check(state);message='报告已导入；仅核对格式与固定规则，来源未经独立复核。';}
else {pending={name:file.name,state:C.parse(text)};message='作品已读取，请预览并确认恢复；当前内容尚未覆盖。';}
}catch(error){message='文件未应用：'+error.message;}
target.value='';feedback();}
function render(root,ch=1,v='reading'){host=root;chapter=Math.max(1,Math.min(5,Number(ch)||1));view=v==='practice'?'practice':'reading';ensure();host.onclick=click;host.onchange=change;host.oninput=event=>{const k=event.target.dataset.changeField;if(C.FIELDS.includes(k)){state.design[k]=event.target.value;result=null;persist();message='当前材料已修改；旧提交保留为快照，需重新检查并提交。';feedback();}};paint();}
window.addEventListener('storage',event=>{if(event.key===C.KEY||event.key===null)feedback();});
window.ChangeWorkspace={render};
})();
