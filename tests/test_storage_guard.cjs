'use strict';
const assert=require('node:assert/strict');
const {KEYS,createGuard}=require('../learning/storage.js');
const C=require('../learning/core.js');
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
const raw=memory(),a=createGuard(raw),b=createGuard(raw);
assert.deepEqual(KEYS,['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1','ai_lab_system_v1','ai_lab_process_v1','ai_lab_change_v1']);
for(const key of KEYS){
  const record=memory(),first=createGuard(record),stale=createGuard(record);
  first.setItem(key,'{"revision":1}');
  assert.throws(()=>stale.setItem(key,'{"revision":0}'),/其他页面|其他标签|已改变|冲突/);
  assert.equal(record.getItem(key),'{"revision":1}');
}
a.setItem(KEYS[0],'{"first":1}');
assert.throws(()=>b.setItem(KEYS[0],'{"second":2}'),/其他页面|其他标签|已改变|冲突/);
assert.equal(raw.getItem(KEYS[0]),'{"first":1}');
a.setItem(KEYS[0],'{"first":2}');
a.removeItem(KEYS[0]);assert.equal(raw.getItem(KEYS[0]),null);
raw.setItem(KEYS[1],'{}');assert.throws(()=>b.removeItem(KEYS[1]),/其他页面|其他标签|已改变|冲突/);
const x=C.createStore(raw),y=C.createStore(raw),sx=x.read(),sy=y.read();
sx.prediction.first='yes';sy.prediction.second='no';
assert.equal(x.write(sx).ok,true);assert.equal(y.write(sy).ok,false);
assert.equal(JSON.parse(raw.getItem(C.KEY)).prediction.first,'yes');
const one=C.createLessonStore(raw,'ai-basics'),two=C.createLessonStore(raw,'ai-basics');
assert.equal(one.write({...one.read(),reflection:'first'}).ok,true);
assert.equal(two.write({...two.read(),reflection:'stale'}).ok,false);
const sibling=C.createLessonStore(raw,'clear-task');assert.equal(sibling.write(sibling.read()).ok,true);
assert.equal(JSON.parse(raw.getItem(C.PATHWAY_KEY)).lessons['ai-basics'].reflection,'first');
console.log('PASS storage guards: stale writes/removals rejected, own writes accepted, same lesson protected and sibling lessons preserved');
