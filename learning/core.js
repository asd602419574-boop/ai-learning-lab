/* Local learning rules and explicit whole-site backup. No network or semantic grading. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LearningCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const KEY = 'ai_lab_learning_v2';
  const PATHWAY_KEY = 'ai_lab_pathway_v1';
  const LESSON_IDS = Object.freeze(['ai-basics','clear-task','reliable-ai','evaluate-results']);
  // Source-proven keys: index.html, content/reader.js, training/training-ui.js, projects/app.js.
  const KEYS = ['ai_foundations_learning_v1', 'ai_lab_textbook_v1', 'ai_training_16day_v1', 'ai_lab_projects_v1', 'ai_training_practice_v1', KEY, PATHWAY_KEY];
  const MAX = 2000000;
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x) && (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
  const clone = x => JSON.parse(JSON.stringify(x));
  function emptyState() { return {schemaVersion:1,step:0,drafts:{practice:{},transfer:{}},prediction:{},explanations:{practice:'',transfer:''},reflection:'',selfReview:{},hints:0,attempts:[],artifacts:[],updatedAt:null}; }
  function safe(value, depth = 0, budget = {nodes:0}) {
    if (++budget.nodes > 50000 || depth > 20) throw Error('数据结构过大或过深');
    if (value === null || typeof value === 'boolean') return;
    if (typeof value === 'string') { if(value.length > 20000) throw Error('输入文字超过20000字符上限'); return; }
    if (typeof value === 'number') { if(!Number.isFinite(value) || Math.abs(value)>Number.MAX_SAFE_INTEGER)throw Error('数字无效');return; }
    if (!object(value) && !Array.isArray(value)) throw Error('仅接受JSON数据');
    if(Array.isArray(value) && value.length>1000)throw Error('记录数量超过1000上限');
    for(const k of Object.keys(value)) {
      if(['__proto__','constructor','prototype'].includes(k) || k.length>200)throw Error('数据包含不安全字段');
      const d=Object.getOwnPropertyDescriptor(value,k);if(!d || !own(d,'value'))throw Error('不接受动态属性');
      safe(d.value,depth+1,budget);
    }
  }
  const date = x => typeof x==='string' && Number.isFinite(Date.parse(x));
  const stringMap = x => object(x) && Object.values(x).every(v=>typeof v==='string');
  const review = x => object(x) && Object.values(x).every(v=>typeof v==='boolean');
  const scenario = x => x==='practice'||x==='transfer';
  function resultCheck(r) {
    if(!object(r)||typeof r.passed!=='boolean'||typeof r.summary!=='string'||!Number.isInteger(r.correct)||r.correct<0||r.total!==6||r.correct>r.total||!Array.isArray(r.items)||r.items.length!==r.total) return false;
    return r.items.every(i=>object(i)&&typeof i.ok==='boolean'&&['id','label','expected','actual','feedback','evidence'].every(k=>typeof i[k]==='string')) && new Set(r.items.map(i=>i.id)).size===r.total && r.items.filter(i=>i.ok).length===r.correct && r.passed===(r.correct===r.total);
  }
  function attemptCheck(a) {
    return object(a)&&typeof a.id==='string'&&a.id.length>0&&scenario(a.scenarioId)&&Number.isInteger(a.phase)&&a.phase>=0&&a.phase<=5&&stringMap(a.answers)&&resultCheck(a.result)&&typeof a.explanation==='string'&&date(a.createdAt);
  }
  function artifactCheck(a) {
    return object(a)&&['id','title','lessonId'].every(k=>typeof a[k]==='string'&&a[k].length>0)&&scenario(a.scenarioId)&&['draft','passed'].includes(a.status)&&stringMap(a.answers)&&typeof a.explanation==='string'&&typeof a.reflection==='string'&&review(a.selfReview)&&Array.isArray(a.attemptIds)&&a.attemptIds.every(x=>typeof x==='string')&&date(a.createdAt)&&date(a.updatedAt);
  }
  function stateCheck(s) {
    safe(s);
    const base=emptyState();
    if(!object(s) || Object.keys(s).length!==Object.keys(base).length || Object.keys(base).some(k=>!own(s,k)))throw Error('学习记录形状无效');
    if(s.schemaVersion!==1)throw Error('学习记录版本不支持，原始数据已保留');
    if(!Number.isInteger(s.step)||s.step<0||s.step>5||!Number.isInteger(s.hints)||s.hints<0||s.hints>100000)throw Error('学习步骤或提示次数无效');
    if(!object(s.drafts)||Object.keys(s.drafts).length!==2||!object(s.drafts.practice)||!object(s.drafts.transfer)||!object(s.prediction)||!object(s.selfReview))throw Error('学习输入结构无效');
    if(!object(s.explanations)||Object.keys(s.explanations).length!==2||typeof s.explanations.practice!=='string'||typeof s.explanations.transfer!=='string'||typeof s.reflection!=='string')throw Error('解释或复盘结构无效');
    if(!Array.isArray(s.attempts)||!Array.isArray(s.artifacts)||s.attempts.some(x=>!attemptCheck(x))||s.artifacts.some(x=>!artifactCheck(x)))throw Error('尝试或作品记录无效');
    if(s.updatedAt!==null && (typeof s.updatedAt!=='string'||!Number.isFinite(Date.parse(s.updatedAt))))throw Error('更新时间无效');
    if(JSON.stringify(s).length>MAX)throw Error('学习记录尺寸过大');
    return s;
  }
  function normalize(x) { return typeof x==='string'?x.normalize('NFKC').replace(/\s+/gu,'').toLowerCase():''; }
  function lessonIdCheck(id) {
    if(!LESSON_IDS.includes(id))throw Error('不支持的课程标识');
  }
  function pathwayCheck(value) {
    safe(value);
    if(!object(value)||Object.keys(value).length!==2||value.schemaVersion!==1||!object(value.lessons))throw Error('课程记录结构或版本不支持，原始数据已保留');
    for(const id of Object.keys(value.lessons)) {
      lessonIdCheck(id);
      if(id==='reliable-ai')throw Error('可靠使用AI课程应保留在原有记录中');
      const state=stateCheck(value.lessons[id]);
      if(state.artifacts.some(a=>a.lessonId!==id))throw Error('作品不属于当前课程');
    }
    if(JSON.stringify(value).length>MAX)throw Error('课程记录尺寸过大');
    return value;
  }
  function readPathway(storage) {
    const raw=storage.getItem(PATHWAY_KEY);
    if(raw===null)return {schemaVersion:1,lessons:{}};
    if(typeof raw!=='string'||raw.length>MAX)throw Error('课程记录尺寸过大');
    return pathwayCheck(JSON.parse(raw));
  }
  function checkFields(scenario, answers) {
    if(!scenario || !Array.isArray(scenario.fields)||!scenario.fields.length)throw Error('题目缺少字段规则');
    const input=object(answers)?answers:{};
    const items=scenario.fields.map(f=>{
      const actual=own(input,f.id)&&typeof input[f.id]==='string'?input[f.id]:'';
      const allowed=[f.expected].concat(Array.isArray(f.accepted)?f.accepted:[]).filter(x=>typeof x==='string'&&normalize(x));
      const ok=Boolean(normalize(actual))&&allowed.some(x=>normalize(x)===normalize(actual));
      return {id:f.id,label:f.label,ok,expected:f.expected,actual,feedback:ok?'正确：'+(f.explanation||'与原文规则一致。'):(actual.trim()?'请核对原文：':'尚未填写：')+(f.explanation||'只填写材料中能够确认的信息。'),evidence:f.evidence};
    });
    const correct=items.filter(x=>x.ok).length,total=items.length;
    return {passed:correct===total,correct,total,items,summary:'字段规则检查：'+correct+'/'+total+' 项正确；自由文字解释需自行对照量规，不作语义评分。'};
  }
  function createStore(storage) {
    let current=emptyState(), error='', protectedRaw=false,expectedRaw=null;
    try {const raw=storage.getItem(KEY);expectedRaw=raw;if(raw!==null){if(typeof raw!=='string'||raw.length>MAX)throw Error('记录尺寸过大');current=clone(stateCheck(JSON.parse(raw)));}}
    catch(e){protectedRaw=true;error='读取学习记录失败，原始数据已保留；请保留浏览器中的原始值，再显式恢复可信备份；普通导出只包含当前可用状态。'+e.message;}
    return {read:()=>clone(current),getError:()=>error,write(s){
      if(protectedRaw)return {ok:false,error};
      try{stateCheck(s);if(storage.getItem(KEY)!==expectedRaw)throw Error('记录已被其他页面改变，请备份本页内容后重新载入');const next=clone(s),raw=JSON.stringify(next);storage.setItem(KEY,raw);expectedRaw=raw;current=next;error='';return {ok:true,error:''};}
      catch(e){error='保存失败：'+e.message;return {ok:false,error};}
    }};
  }
  function recordCheck(key,value) {
    if(!KEYS.includes(key))throw Error('备份包含不允许的存储键：'+key);
    if(!object(value))throw Error('备份学习记录必须是对象');
    safe(value);
    if(key===KEY)stateCheck(value);
    if(key===PATHWAY_KEY)pathwayCheck(value);
    // These legacy records predate this module; preserve their actual JSON shape.
    if(key==='ai_lab_projects_v1' && own(value,'version') && value.version!==1)throw Error('项目记录版本不支持');
  }
  function createLessonStore(storage,lessonId) {
    lessonIdCheck(lessonId);
    if(lessonId==='reliable-ai')return createStore(storage);
    let current=emptyState(),error='',protectedRaw=false,expectedLesson=null;
    try{const all=readPathway(storage);if(own(all.lessons,lessonId)){current=clone(all.lessons[lessonId]);expectedLesson=JSON.stringify(current);}}
    catch(e){protectedRaw=true;error='读取课程记录失败，原始数据已保留；请保留原始值并显式恢复可信备份。'+e.message;}
    return {read:()=>clone(current),getError:()=>error,write(s){
      if(protectedRaw)return {ok:false,error};
      try{
        // Read again before each write so stores opened on different lessons preserve siblings.
        const all=readPathway(storage),next=clone(stateCheck(s));
        if((own(all.lessons,lessonId)?JSON.stringify(all.lessons[lessonId]):null)!==expectedLesson)throw Error('课程记录已被其他页面改变，请备份本页内容后重新载入');
        all.lessons[lessonId]=next;pathwayCheck(all);
        storage.setItem(PATHWAY_KEY,JSON.stringify(all));current=next;expectedLesson=JSON.stringify(next);error='';return {ok:true,error:''};
      }catch(e){error='保存失败：'+e.message;return {ok:false,error};}
    }};
  }
  function exportBackup(storage,currentState,lessonId='reliable-ai') {
    try {
      lessonIdCheck(lessonId);stateCheck(currentState);const records={};
      for(const key of KEYS){
        if(key===KEY&&lessonId==='reliable-ai'){records[key]=clone(currentState);continue;}
        if(key===PATHWAY_KEY&&lessonId!=='reliable-ai'){
          const value=readPathway(storage);value.lessons[lessonId]=clone(currentState);pathwayCheck(value);records[key]=value;continue;
        }
        const raw=storage.getItem(key);if(raw!==null){if(raw.length>MAX)throw Error('记录尺寸过大');const value=JSON.parse(raw);recordCheck(key,value);records[key]=value;}
      }
      const raw=JSON.stringify({format:'ai-learning-backup',version:1,exportedAt:new Date().toISOString(),records});if(raw.length>MAX)throw Error('备份尺寸超过上限');return raw;
    } catch(e){throw Error('备份导出失败，未修改任何记录：'+e.message);}
  }
  function previewImport(raw) {
    const summary={keys:0,artifacts:0,attempts:0};
    try {
      if(typeof raw!=='string'||raw.length>MAX)throw Error('备份尺寸无效或超过2000000字符');
      const data=JSON.parse(raw);safe(data);
      if(!object(data)||data.format!=='ai-learning-backup'||data.version!==1)throw Error('备份格式或版本不支持');
      if(Object.keys(data).some(k=>!['format','version','exportedAt','records'].includes(k))||typeof data.exportedAt!=='string'||!Number.isFinite(Date.parse(data.exportedAt))||!object(data.records)||!Object.keys(data.records).length)throw Error('备份结构无效');
      for(const key of Object.keys(data.records)){recordCheck(key,data.records[key]);summary.keys++;}
      if(own(data.records,KEY)){summary.artifacts=data.records[KEY].artifacts.length;summary.attempts=data.records[KEY].attempts.length;}
      if(own(data.records,PATHWAY_KEY))for(const state of Object.values(data.records[PATHWAY_KEY].lessons)){summary.artifacts+=state.artifacts.length;summary.attempts+=state.attempts.length;}
      return {ok:true,error:'',summary,data:clone(data)};
    }catch(e){return {ok:false,error:'无法导入：'+e.message,summary:{keys:0,artifacts:0,attempts:0}};}
  }
  function importBackup(storage,raw) {
    const preview=previewImport(raw);if(!preview.ok)return {ok:false,error:preview.error};
    const previous=new Map(), touched=[];
    try {
      for(const key of Object.keys(preview.data.records))previous.set(key,storage.getItem(key));
      for(const [key] of previous){touched.push(key);storage.setItem(key,JSON.stringify(preview.data.records[key]));}
      return {ok:true,error:''};
    } catch(e) {
      const failures=[];
      for(const key of touched.reverse())try {const old=previous.get(key);if(old===null)storage.removeItem(key);else storage.setItem(key,old);}catch(restore){failures.push(key);}
      return {ok:false,error:'导入失败：'+e.message+(failures.length?'；恢复失败：'+failures.join('、')+'。部分记录可能已经改变，请保留备份并检查。':'；已恢复本次涉及的旧值。')};
    }
  }
  return {KEY,PATHWAY_KEY,LESSON_IDS,emptyState,checkFields,createStore,createLessonStore,exportBackup,previewImport,importBackup};
});
