const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const corePath = path.join(__dirname, '../learning/core.js');
assert.ok(fs.existsSync(corePath), 'LearningCore must provide the new learning state and safe backup API');
const C = require(corePath);
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
function storage(initial = {}, fail = () => false) { const values = new Map(Object.entries(initial)); const writes = []; return {values,writes,getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){writes.push(k);if(fail(k,v))throw Error('quota');values.set(k,String(v));},removeItem(k){if(fail(k,null))throw Error('remove denied');values.delete(k);}}; }
const fixture = { fields: [
{id:'date',label:'时间',expected:'10月21日',accepted:['10/21'],evidence:'第一段',explanation:'按原文日期'},
{id:'time',label:'时刻',expected:'14:00',accepted:[],evidence:'第二段',explanation:'按时刻'},
{id:'place',label:'地点',expected:'图书馆',accepted:['校图书馆'],evidence:'第三段',explanation:'按地点'},
{id:'fee',label:'费用',expected:'免费',accepted:[],evidence:'第四段',explanation:'按费用'},
{id:'limit',label:'名额',expected:'未知',accepted:['原文未提供'],evidence:'全文',explanation:'不可猜测'},
{id:'contact',label:'联系人',expected:'未知',accepted:['原文未提供'],evidence:'全文',explanation:'不可猜测'}]};
test('exact initial contract and detached store reads',()=>{ const s=C.emptyState();assert.deepEqual(s,{schemaVersion:1,step:0,drafts:{practice:{},transfer:{}},prediction:{},explanations:{practice:'',transfer:''},reflection:'',selfReview:{},hints:0,attempts:[],artifacts:[],updatedAt:null});const st=C.createStore(storage());st.read().drafts.practice.x='mutated';assert.deepEqual(st.read(),s);assert.equal(C.KEY,'ai_lab_learning_v2'); });
test('six independent fields normalize full width, whitespace and explicit synonyms only',()=>{const r=C.checkFields(fixture,{date:' 10 / 21 ',time:'１４：００',place:'校图书馆',fee:'免费',limit:'50人'});assert.equal(r.correct,4);assert.equal(r.total,6);assert.equal(r.passed,false);assert.equal(r.items.length,6);assert.equal(r.items[4].ok,false);assert.equal(r.items[5].ok,false);assert.equal(r.items[0].evidence,'第一段');assert.ok(r.items.every(x=>x.feedback));assert.equal(C.checkFields(fixture,{date:'10月21日',time:'14:00',place:'图书馆',fee:'免费',limit:'未知',contact:'原文未提供'}).passed,true);});
test('writes only new key and reports quota without success',()=>{const s=storage({'ai_foundations_learning_v1':'{"old":true}'});const st=C.createStore(s);assert.equal(st.write(C.emptyState()).ok,true);assert.deepEqual(s.writes,[C.KEY]);const q=C.createStore(storage({},()=>true));assert.equal(q.write(C.emptyState()).ok,false);assert.match(q.getError(),/保存/);});
test('corrupt and future records remain raw and cannot be silently overwritten',()=>{for(const raw of ['{bad',JSON.stringify({...C.emptyState(),schemaVersion:99})]){const s=storage({[C.KEY]:raw});const st=C.createStore(s);assert.ok(st.getError());assert.equal(st.write(C.emptyState()).ok,false);assert.equal(s.getItem(C.KEY),raw);assert.deepEqual(s.writes,[]);}});
test('rejects malformed state, unsafe keys, limits and nonfinite numbers',()=>{for(const bad of [{...C.emptyState(),step:-1},{...C.emptyState(),step:6},{...C.emptyState(),hints:Infinity},{...C.emptyState(),reflection:'x'.repeat(20001)},{...C.emptyState(),attempts:{}},JSON.parse(JSON.stringify(C.emptyState()).replace('"prediction":{}','"prediction":{"__proto__":{}}'))])assert.equal(C.createStore(storage()).write(bad).ok,false);});
test('whole-site backup roundtrips only source-proven learning keys',()=>{const legacy={'ai_foundations_learning_v1':{completed:['a']},'ai_lab_textbook_v1':{read:{}},'ai_training_16day_v1':{best:{}},'ai_lab_projects_v1':{version:1,data:{}},'ai_training_practice_v1':{'3':123}};const s=storage(Object.fromEntries(Object.entries(legacy).map(([k,v])=>[k,JSON.stringify(v)])));s.values.set('private_key','secret');const state=C.emptyState();state.reflection='我的复盘';const raw=C.exportBackup(s,state);const p=C.previewImport(raw);assert.equal(p.ok,true);assert.equal(p.summary.keys,6);assert.equal(raw.includes('private_key'),false);const target=storage();assert.equal(C.importBackup(target,raw).ok,true);assert.equal(JSON.parse(target.getItem(C.KEY)).reflection,'我的复盘');for(const k in legacy)assert.deepEqual(JSON.parse(target.getItem(k)),legacy[k]);});
test('invalid import is side effect free for unknown keys, future versions and polluted payload',()=>{const valid=JSON.parse(C.exportBackup(storage(),C.emptyState()));for(const x of [{...valid,version:2},{...valid,records:{evil:{}}},{...valid,records:{[C.KEY]:{...C.emptyState(),schemaVersion:2}}},JSON.parse('{"format":"ai-learning-backup","version":1,"records":{"__proto__":{}}}')]){const s=storage();assert.equal(C.importBackup(s,JSON.stringify(x)).ok,false);assert.deepEqual(s.writes,[]);}assert.equal(C.previewImport('x'.repeat(2000001)).ok,false);});
test('failed import restores previous raw values and reports rollback failure honestly',()=>{const raw=C.exportBackup(storage({'ai_foundations_learning_v1':'{"new":1}'}),C.emptyState());const s=storage({'ai_foundations_learning_v1':'{"old":1}'},k=>k===C.KEY);const r=C.importBackup(s,raw);assert.equal(r.ok,false);assert.equal(s.getItem('ai_foundations_learning_v1'),'{"old":1}');let calls=0;const broken=storage({'ai_foundations_learning_v1':'{"old":1}'},()=>++calls>1);const failed=C.importBackup(broken,raw);assert.equal(failed.ok,false);assert.match(failed.error,/恢复失败/);});
test('export refuses corrupt legacy snapshot rather than quietly omitting it',()=>{assert.throws(()=>C.exportBackup(storage({'ai_lab_textbook_v1':'{bad'}),C.emptyState()),/备份/);});

const vm = require('node:vm');
test('browser global exposes the same API without CommonJS',()=>{const context={};vm.runInNewContext(fs.readFileSync(corePath,'utf8'),context);assert.equal(context.LearningCore.KEY,C.KEY);assert.equal(typeof context.LearningCore.importBackup,'function');});
test('explicit import can recover protected raw data',()=>{const s=storage({[C.KEY]:'{damaged'});const before=C.createStore(s);assert.equal(before.write(C.emptyState()).ok,false);const raw=C.exportBackup(storage(),C.emptyState());assert.equal(C.importBackup(s,raw).ok,true);assert.equal(C.createStore(s).getError(),'');});


test('rejects incomplete nested attempts and unknown artifact scenarios before writing',()=>{
 const result={passed:false,correct:0,total:6,summary:'0/6',items:fixture.fields.map(f=>({id:f.id,label:f.label,ok:false,expected:f.expected,actual:'',feedback:'核对材料',evidence:f.evidence}))};
 const attempt={id:'a-1',scenarioId:'practice',phase:1,answers:{},result,explanation:'',createdAt:'2026-10-21T00:00:00Z'};
 const artifact={id:'p-1',title:'练习',lessonId:'reliable-ai',status:'draft',scenarioId:'practice',answers:{},explanation:'',reflection:'',selfReview:{},attemptIds:['a-1'],createdAt:'2026-10-21T00:00:00Z',updatedAt:'2026-10-21T00:00:00Z'};
 const state={...C.emptyState(),attempts:[attempt],artifacts:[artifact]};
 assert.equal(C.createStore(storage()).write(state).ok,true);
 for(const bad of [{...state,attempts:[{}]},{...state,attempts:[{...attempt,result:{}}]},{...state,artifacts:[{...artifact,scenarioId:'unavailable'}]},{...state,artifacts:[{...artifact,selfReview:null}]},{...state,attempts:[{...attempt,answers:{date:4}}]}]){
  const target=storage();const raw=JSON.stringify({format:'ai-learning-backup',version:1,exportedAt:'2026-10-21T00:00:00Z',records:{[C.KEY]:bad}});
  assert.equal(C.importBackup(target,raw).ok,false);assert.deepEqual(target.writes,[]);
 }
});

console.log(`${count} LearningCore tests passed`);
