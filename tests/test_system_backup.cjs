const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const C=require('../learning/core.js');
const S=require('../learning/system-core.js');
const Guard=require('../learning/storage.js');
function storage(initial={}){const values=new Map(Object.entries(initial)),writes=[];return {values,writes,getItem:k=>values.has(k)?values.get(k):null,setItem(k,v){writes.push(k);values.set(k,String(v));},removeItem:k=>values.delete(k)};}
const envelope=records=>JSON.stringify({format:'ai-learning-backup',version:1,exportedAt:'2026-10-22T00:00:00Z',records});
const legacy={ai_foundations_learning_v1:{},ai_lab_textbook_v1:{},ai_training_16day_v1:{},ai_lab_projects_v1:{version:1,data:{}},ai_training_practice_v1:{},[C.KEY]:C.emptyState()};
const system=S.emptyState();
const source=storage(Object.fromEntries(Object.entries({...legacy,[C.PATHWAY_KEY]:{schemaVersion:1,lessons:{}},[S.KEY]:system}).map(([k,v])=>[k,JSON.stringify(v)])));
const raw=C.exportBackup(source,C.emptyState());
assert.equal(C.previewImport(raw).summary.keys,8);
assert.deepEqual(JSON.parse(raw).records[S.KEY],system);
const restored=storage();assert.equal(C.importBackup(restored,raw).ok,true);assert.deepEqual(JSON.parse(restored.getItem(S.KEY)),system);
for(const old of [legacy,{...legacy,[C.PATHWAY_KEY]:{schemaVersion:1,lessons:{}}}]){
 assert.equal(C.previewImport(envelope(old)).ok,true);
 const before=restored.getItem(S.KEY);assert.equal(C.importBackup(restored,envelope(old)).ok,true);assert.equal(restored.getItem(S.KEY),before);
}
for(const bad of [{},{...system,schemaVersion:2},{...system,unexpected:true}]){
 const target=storage({[S.KEY]:JSON.stringify(system)});const before=target.getItem(S.KEY);
 assert.equal(C.importBackup(target,envelope({[S.KEY]:bad})).ok,false);assert.equal(target.writes.length,0);assert.equal(target.getItem(S.KEY),before);
 assert.throws(()=>C.exportBackup(storage({[S.KEY]:JSON.stringify(bad)}),C.emptyState()),/备份导出失败/);
}
assert.equal(C.previewImport(envelope({unrelated:{}})).ok,false);
assert.ok(Guard.KEYS.includes(S.KEY));
const guardedRaw=storage({[S.KEY]:JSON.stringify(system)}),guard=Guard.createGuard(guardedRaw);
guardedRaw.values.set(S.KEY,'external');assert.throws(()=>guard.setItem(S.KEY,JSON.stringify(system)),/其他页面/);assert.equal(guardedRaw.getItem(S.KEY),'external');
// A missing browser module must reject system records rather than skip validation.
const context={};vm.runInNewContext(fs.readFileSync(require.resolve('../learning/core.js'),'utf8'),context);
assert.equal(context.LearningCore.previewImport(envelope({[S.KEY]:system})).ok,false);
assert.match(context.LearningCore.previewImport(envelope({[S.KEY]:system})).error,/校验模块未加载/);
console.log('PASS system backup: eight-key round trip, old six/seven-key compatibility, invalid/future records, unrelated keys, stale writes and missing-validator protection');
