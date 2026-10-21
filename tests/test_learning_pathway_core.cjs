const assert=require('node:assert/strict');
const C=require('../learning/core.js');
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
function storage(initial={},fail=()=>false){const values=new Map(Object.entries(initial)),writes=[];return {values,writes,getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){writes.push(k);if(fail(k,v))throw Error('quota');values.set(k,String(v));},removeItem:k=>values.delete(k)};}
const state=text=>({...C.emptyState(),reflection:text});
const envelope=records=>JSON.stringify({format:'ai-learning-backup',version:1,exportedAt:'2026-10-21T00:00:00Z',records});
test('new lesson stores are isolated and preserve the original P1 raw record',()=>{
 const original=JSON.stringify(state('P1'));const s=storage({[C.KEY]:original});
 const a=C.createLessonStore(s,'ai-basics'),b=C.createLessonStore(s,'clear-task');
 assert.equal(a.write(state('基础')).ok,true);assert.equal(b.write(state('提示')).ok,true);
 assert.equal(C.createLessonStore(s,'ai-basics').read().reflection,'基础');
 assert.equal(C.createLessonStore(s,'clear-task').read().reflection,'提示');
 assert.equal(s.getItem(C.KEY),original);assert.equal(C.createLessonStore(s,'reliable-ai').read().reflection,'P1');
 assert.deepEqual(C.LESSON_IDS,['ai-basics','clear-task','reliable-ai','evaluate-results']);
 assert.throws(()=>C.createLessonStore(s,'unknown'),/课程/);
});
test('stale stores merge current sibling lessons and report failed writes',()=>{
 const s=storage(),a=C.createLessonStore(s,'ai-basics'),b=C.createLessonStore(s,'clear-task');
 assert.equal(a.write(state('a')).ok,true);assert.equal(b.write(state('b')).ok,true);assert.equal(a.write(state('a2')).ok,true);
 assert.equal(C.createLessonStore(s,'clear-task').read().reflection,'b');
 const q=C.createLessonStore(storage({},()=>true),'ai-basics');assert.equal(q.write(state('lost')).ok,false);assert.equal(q.read().reflection,'');assert.match(q.getError(),/保存/);
});
test('corrupt future and unsafe pathway records cannot be overwritten',()=>{
 for(const raw of ['{bad',JSON.stringify({schemaVersion:2,lessons:{}}),JSON.stringify({schemaVersion:1,lessons:{unknown:C.emptyState()}}),JSON.stringify({schemaVersion:1,lessons:{'reliable-ai':C.emptyState()}})]){
  const s=storage({[C.PATHWAY_KEY]:raw});const st=C.createLessonStore(s,'ai-basics');assert.ok(st.getError());assert.equal(st.write(C.emptyState()).ok,false);assert.equal(s.getItem(C.PATHWAY_KEY),raw);assert.equal(s.writes.length,0);
 }
 const s=storage(),st=C.createLessonStore(s,'ai-basics');s.values.set(C.PATHWAY_KEY,'{late-corruption');assert.equal(st.write(C.emptyState()).ok,false);assert.equal(s.getItem(C.PATHWAY_KEY),'{late-corruption');
});
test('backup combines unsaved active lesson with all saved lessons and original P1',()=>{
 const s=storage({[C.KEY]:JSON.stringify(state('P1')),'ai_lab_textbook_v1':'{"read":{}}'});
 C.createLessonStore(s,'ai-basics').write(state('saved'));C.createLessonStore(s,'clear-task').write(state('sibling'));
 const raw=C.exportBackup(s,state('unsaved'),'ai-basics'),p=C.previewImport(raw);assert.equal(p.ok,true);assert.equal(p.summary.keys,3);
 const t=storage();assert.equal(C.importBackup(t,raw).ok,true);assert.equal(C.createLessonStore(t,'ai-basics').read().reflection,'unsaved');assert.equal(C.createLessonStore(t,'clear-task').read().reflection,'sibling');assert.equal(C.createStore(t).read().reflection,'P1');assert.equal(C.createLessonStore(s,'ai-basics').read().reflection,'saved');
 const old=C.exportBackup(storage(),C.emptyState());assert.equal(C.importBackup(t,old).ok,true);assert.equal(C.createLessonStore(t,'clear-task').read().reflection,'sibling');
});
test('pathway backups validate lesson ownership and nested attempts without changing legacy rules',()=>{
 const artifact={id:'p',title:'作品',lessonId:'ai-basics',scenarioId:'practice',status:'draft',answers:{},explanation:'',reflection:'',selfReview:{},attemptIds:[],createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-21T00:00:00Z'};
 const s=state('');s.artifacts.push(artifact);const st=storage();assert.equal(C.createLessonStore(st,'ai-basics').write(s).ok,true);
 const raw=C.exportBackup(st,s,'ai-basics');assert.equal(C.previewImport(raw).summary.artifacts,1);
 for(const bad of [{...s,artifacts:[{...artifact,lessonId:'clear-task'}]},{...s,attempts:[{}]}]){
  const target=storage(),r=C.importBackup(target,envelope({[C.PATHWAY_KEY]:{schemaVersion:1,lessons:{'ai-basics':bad}}}));assert.equal(r.ok,false);assert.equal(target.writes.length,0);
 }
 assert.equal(C.createLessonStore(st,'clear-task').write(s).ok,false);
 const legacy=state('');legacy.artifacts.push({...artifact,lessonId:'older-original-id'});assert.equal(C.createStore(storage()).write(legacy).ok,true);
});
test('backup counts all lessons and validates the complete nested check result',()=>{
 const fields=Array.from({length:6},(_,i)=>({id:'field'+i,label:'字段'+i,expected:'正确',evidence:'材料',explanation:'核对原文'}));
 const attempt={id:'a',scenarioId:'practice',phase:1,answers:{},result:C.checkFields({fields},{}),explanation:'',createdAt:'2026-10-21T00:00:00Z'};
 const original=state('原课'),first=state('第一课'),second=state('第二课');original.attempts=[attempt];first.attempts=[attempt];second.attempts=[attempt];
 const s=storage({[C.KEY]:JSON.stringify(original)});C.createLessonStore(s,'ai-basics').write(first);C.createLessonStore(s,'clear-task').write(second);
 const raw=C.exportBackup(s,first,'ai-basics');assert.equal(C.previewImport(raw).summary.attempts,3);
 const malformed=JSON.parse(raw);malformed.records[C.PATHWAY_KEY].lessons['clear-task'].attempts[0].result.items[0].ok=true;
 const t=storage();assert.equal(C.importBackup(t,JSON.stringify(malformed)).ok,false);assert.deepEqual(t.writes,[]);
 const polluted=raw.replace('"prediction":{}','"prediction":{"__proto__":{}}');assert.equal(C.previewImport(polluted).ok,false);
});
test('explicit restore recovers protected pathway data and refuses unsupported export ids',()=>{
 const s=storage({[C.PATHWAY_KEY]:'{bad'}),before=C.createLessonStore(s,'ai-basics');assert.equal(before.write(state('')).ok,false);
 const raw=C.exportBackup(storage(),state('已恢复'),'ai-basics');assert.equal(C.importBackup(s,raw).ok,true);assert.equal(C.createLessonStore(s,'ai-basics').read().reflection,'已恢复');
 assert.throws(()=>C.exportBackup(s,C.emptyState(),'unknown'),/课程/);
 assert.throws(()=>C.exportBackup(storage({[C.PATHWAY_KEY]:'{bad'}),C.emptyState()),/备份/);
});
console.log(count+' pathway core tests passed');
