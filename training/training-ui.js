/* V1.3: 16-day course pathway. Uses independent storage; does not touch base progress. */
const TR_STORE = 'ai_training_16day_v1';
let trSaved = {completed:{},best:{},stats:{}};
try {const v=JSON.parse(localStorage.getItem(TR_STORE)||'null');if(v&&typeof v==='object')for(const k of ['completed','best','stats'])if(v[k]&&typeof v[k]==='object'&&!Array.isArray(v[k]))trSaved[k]=v[k];}catch(e){}
const trQuestions = new Map(TRAINING_PLAN.flatMap(day=>day.questions.map(q=>[q.id,{...q,day:day.day}])));
const trState={day:1,mode:'lesson',type:'day',ids:[],index:0,selected:null,checked:false,answers:[],finished:false};
const trEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const trSave=()=>{try{localStorage.setItem(TR_STORE,JSON.stringify(trSaved));}catch(e){console.warn('培训课程进度保存失败',e);}};
const trPending=()=>[...trQuestions.keys()].filter(id=>trSaved.stats[id]?.needsReview);
const trCompleted=d=>trSaved.completed[`${d}-0`]&&trSaved.completed[`${d}-1`]&&Number(trSaved.best[d]||0)>=3;
function renderTraining(){
 const d=TRAINING_PLAN[trState.day-1],halfCount=Object.values(trSaved.completed).filter(Boolean).length,passDays=TRAINING_PLAN.filter(x=>Number(trSaved.best[x.day]||0)>=3).length,completedDays=TRAINING_PLAN.filter(x=>trCompleted(x.day)).length;
 const header=`<div class="tr-lead"><div><div class="eyebrow">TRAINING TRACK · 按实际培训大纲</div><h3>16 天培训实战</h3><p>课程、实操成果及配套练习按照提供的大纲安排；不取代既有六章基础课程。</p></div><span aria-hidden="true">🗓️</span></div>
 <div class="tr-stats"><div><b>${halfCount}<small> / 32</small></b><span>实操时段已确认</span></div><div><b>${passDays}<small> / 16</small></b><span>每日练习达标</span></div><div><b>${completedDays}<small> / 16</small></b><span>完整完成天数</span></div><div><b>${trPending().length}</b><span>待复练错题</span></div></div>
 <div class="tr-toolbar"><button data-action="tr-lessons">📖 每日课程</button><button data-action="tr-wrong">📝 错题复练 (${trPending().length})</button><small>独立浏览器记录 · 与原六章互不覆盖</small></div>
 <div class="tr-days">${TRAINING_PLAN.map(x=>`<button data-action="tr-day" data-day="${x.day}" class="${trState.day===x.day?'active':''}" aria-pressed="${trState.day===x.day}"><strong>${String(x.day).padStart(2,'0')}</strong><small>${trCompleted(x.day)?'✓ 已完成':trSaved.best[x.day]>=3?'练习达标':'待学习'}</small></button>`).join('')}</div>`;
 if(trState.mode==='quiz')return header+trQuizView();
 if(trState.mode==='wrong')return header+trWrongView();
 return header+`<div class="tr-day-heading"><div><small>DAY ${String(d.day).padStart(2,'0')} / 16</small><h3>第 ${d.day} 天 · ${trEsc(d.title)}</h3><p>每个单元：先理解，再实操，按成果要求自检。</p></div><span>${trCompleted(d.day)?'✓ 已完成':'进行中'}</span></div>
 <div class="tr-sessions">${d.sessions.map((s,i)=>`<article><div class="tr-session-heading"><span>${trEsc(s.slot)}</span><div><h4>${trEsc(s.topic)}</h4><small>${trEsc(s.module||'续前一模块')}</small></div></div><section><b>🧩 概念与理解</b><p>${trEsc(s.guide)}</p></section><details open><summary>📒 课程操作任务</summary><div>${trEsc(s.description)}${s.focus?`<p class="tr-muted">教学重点：${trEsc(s.focus)}</p>`:''}</div></details><section class="tr-outcome"><b>🎯 成果要求</b><p>${trEsc(s.deliverable)}</p></section><button class="tr-done ${trSaved.completed[`${d.day}-${i}`]?'yes':''}" data-action="tr-done" data-day="${d.day}" data-half="${i}" aria-pressed="${Boolean(trSaved.completed[`${d.day}-${i}`])}">${trSaved.completed[`${d.day}-${i}`]?'✓ 我已完成本时段实操 · 点击撤销':'□ 我已经实际完成本时段实操'}</button></article>`).join('')}</div>
 <div class="tr-call"><div><b>📋 当日专项练习：4 道题</b><p>逐题讲解、自动保存错题；3/4 正确即记为本日练习达标（非官方考核标准）。</p></div><button class="btn" data-action="tr-start">${trSaved.best[d.day]!==undefined?'再次练习':'开始练习'} →</button></div><div class="tr-bottom"><small>本日最好成绩：${trSaved.best[d.day]!==undefined?`${trSaved.best[d.day]} / 4`:'尚未练习'}</small><div><button data-action="tr-prev" ${d.day===1?'disabled':''}>← 前一天</button><button data-action="tr-next" ${d.day===16?'disabled':''}>后一天 →</button></div></div>`;
}
function trQuizView(){
 if(trState.finished){
  const good=trState.ids.filter((id,i)=>trState.answers[i]===trQuestions.get(id).a).length,total=trState.ids.length;
  return `<div class="tr-result"><div class="tr-score">${good}<small> / ${total}</small></div><h3>${good/total>=.75?'🎉 本次达标':'继续巩固'}</h3><p>本次正确率 ${Math.round(100*good/total)}%。答对的旧错题已移出待复练队列。</p><div><button class="btn" data-action="tr-start">再练本日</button><button data-action="tr-lessons">返回课程</button><button data-action="tr-wrong">查看错题</button></div><div class="tr-review">${trState.ids.map((id,i)=>{const q=trQuestions.get(id);return `<section><b>${i+1}. ${trEsc(q.q)}</b><p>${trState.answers[i]===q.a?'✓':'✕'} 正确答案：${trEsc(q.o[q.a])}</p><small>${trEsc(q.why)}</small></section>`;}).join('')}</div></div>`;
 }
 const q=trQuestions.get(trState.ids[trState.index]);
 if(!q)return '<p>练习状态异常，请重新打开课程。</p>';
 return `<div class="tr-quiz"><div class="tr-quiz-top"><span>${trState.type==='wrong'?'错题强化':`第 ${trState.day} 天专项练习`} · ${trEsc(TRAINING_PLAN[q.day-1].title)}</span><b>${trState.index+1} / ${trState.ids.length}</b></div><div class="tr-line"><span style="width:${100*trState.index/trState.ids.length}%"></span></div><h3>${trEsc(q.q)}</h3><div class="tr-options">${q.o.map((v,i)=>`<button data-action="tr-choice" data-index="${i}" class="${trState.selected===i?'selected':''} ${trState.checked&&i===q.a?'correct':''} ${trState.checked&&i===trState.selected&&i!==q.a?'incorrect':''}" ${trState.checked?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${trEsc(v)}</button>`).join('')}</div>${trState.checked?`<div class="tr-feedback ${trState.selected===q.a?'good':'bad'}"><b>${trState.selected===q.a?'✓ 回答正确':'✕ 回答错误 · 已加入错题本'}</b><p>${trEsc(q.why)}</p></div>`:''}<div class="tr-answer-controls"><small>${trState.checked?'核对解释后进入下一题':'请先选择一个答案'}</small><button class="btn" data-action="${trState.checked?'tr-forward':'tr-confirm'}" ${!trState.checked&&trState.selected===null?'disabled':''}>${trState.checked?trState.index===trState.ids.length-1?'查看成绩 →':'下一题 →':'确认答案'}</button></div></div>`;
}
function trWrongView(){const ids=trPending();if(!ids.length)return `<div class="tr-empty"><span>🌿</span><h3>目前没有待复练的培训错题</h3><p>答错后自动记录，答对后自动移出待复练列表。</p><button class="btn" data-action="tr-lessons">继续学习 →</button></div>`;
 return `<div class="tr-wrong-head"><div><h3>待复练 ${ids.length} 道题</h3><p>历史错误仍保留统计，待复练列表只包含尚未重新答对的题。</p></div><button class="btn" data-action="tr-startwrong">开始复练 →</button></div><div class="tr-wrong-list">${ids.map(id=>{const q=trQuestions.get(id);return `<article><small>第 ${q.day} 天 · 答错 ${trSaved.stats[id].wrong} 次</small><h4>${trEsc(q.q)}</h4><details><summary>查看正确答案与解析</summary><p>${trEsc(q.o[q.a])}</p><p>${trEsc(q.why)}</p></details><button data-action="tr-day" data-day="${q.day}">复习第 ${q.day} 天课程 →</button></article>`;}).join('')}</div>`;
}
function trDay(day){if(!Number.isInteger(day)||day<1||day>16)return;trState.day=day;trState.mode='lesson';trState.ids=[];ui.tab='training';render();}
function trStart(type){const ids=type==='wrong'?trPending().slice(0,16):TRAINING_PLAN[trState.day-1].questions.map(x=>x.id);if(!ids.length){trState.mode='wrong';render();return;}Object.assign(trState,{mode:'quiz',type,ids,index:0,selected:null,checked:false,answers:[],finished:false});render();}
function trRecord(q,a){const st=trSaved.stats[q.id]||{attempts:0,correct:0,wrong:0,needsReview:false};st.attempts++;if(a===q.a){st.correct++;st.needsReview=false;}else{st.wrong++;st.needsReview=true;}st.lastAttempt=Date.now();trSaved.stats[q.id]=st;trSave();}
document.addEventListener('click',event=>{const node=event.target.closest('[data-action^="tr-"]');if(!node)return;const action=node.dataset.action,day=Number(node.dataset.day),half=Number(node.dataset.half),i=Number(node.dataset.index);
 switch(action){
 case 'tr-day':trDay(day);break;case 'tr-prev':trDay(trState.day-1);break;case 'tr-next':trDay(trState.day+1);break;
 case 'tr-lessons':trState.mode='lesson';render();break;case 'tr-wrong':trState.mode='wrong';render();break;
 case 'tr-done':{if(day<1||day>16||![0,1].includes(half))break;const key=`${day}-${half}`;if(trSaved.completed[key])delete trSaved.completed[key];else trSaved.completed[key]=Date.now();trSave();render();break;}
 case 'tr-start':trStart('day');break;case 'tr-startwrong':trStart('wrong');break;
 case 'tr-choice':if(!trState.checked&&i>=0&&i<4){trState.selected=i;render();}break;
 case 'tr-confirm':{if(trState.checked||trState.selected===null)break;const q=trQuestions.get(trState.ids[trState.index]);if(!q)break;trState.answers[trState.index]=trState.selected;trState.checked=true;trRecord(q,trState.selected);render();break;}
 case 'tr-forward':{if(!trState.checked)break;if(trState.index===trState.ids.length-1){trState.finished=true;if(trState.type==='day'){const n=trState.ids.filter((id,j)=>trState.answers[j]===trQuestions.get(id).a).length;trSaved.best[trState.day]=Math.max(Number(trSaved.best[trState.day]||0),n);trSave();}}else{trState.index++;trState.selected=null;trState.checked=false;}render();break;}
 }
});
