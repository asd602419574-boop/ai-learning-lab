'use strict';
const assert=require('node:assert/strict');
const C=require('../learning/current-core.js'),P=require('../learning/current-physics.js');
const clone=x=>JSON.parse(JSON.stringify(x));
let count=0;const test=(name,fn)=>{fn();console.log('PASS '+name);count++;};
function record(s,params){s.simulation.params={...C.DEFAULT_PARAMS,...params};C.observe(s);}
function complete(s,id){s.activeTask=id;const t=s.tasks[id];t.prediction='电压和电阻共同决定电流';t.reason='按照恒温欧姆电阻关系预测';C.startRound(s);
  if(id==='voltage'){record(s,{voltage:3});record(s,{voltage:6});}
  if(id==='resistance'){record(s,{resistance:10});record(s,{resistance:20});}
  if(id==='transfer')record(s,{topology:'parallel'});
  t.explanation='对照预测：固定条件后用 I=U/R 核对；并联支路电流相加。';t.revision='保留其他条件重新核对。';
}
test('physical invariants: open/zero/reversal/series/parallel/wire area',()=>{
  const p=x=>P.calculate({...C.DEFAULT_PARAMS,...x});
  assert.equal(p({}).current,.6);assert.equal(p({closed:false}).u1,0);assert.equal(p({voltage:0}).current,0);
  assert.equal(p({voltage:-6}).current,-.6);assert.equal(p({voltage:-6}).power,3.5999999999999996);
  const series=p({topology:'series'}),parallel=p({topology:'parallel'});
  assert(Math.abs(series.u1+series.u2-6)<1e-10);assert(Math.abs(parallel.i1+parallel.i2-parallel.current)<1e-10);
  const a=p({mode:'wire'}),b=p({mode:'wire',area:.04});assert.equal(b.current,a.current*2);assert.equal(b.drift,a.drift);
});
test('prediction precedes observation; variable control and transfer evidence are checked',()=>{
  const s=C.empty();assert.throws(()=>C.observe(s),/预测/);assert.throws(()=>C.startRound(s),/预测/);
  complete(s,'voltage');assert(C.checkTask(s,'voltage').ready);
  s.tasks.voltage.rounds.at(-1).observations[1].params.resistance=20;
  assert(!C.checkTask(s,'voltage').ready,'mixed variables cannot pass');
  const fresh=C.empty();for(const id of C.TASKS)complete(fresh,id);assert(C.check(fresh).ready);
  C.startRound(fresh);assert(!C.check(fresh).ready,'retry needs fresh observations');
});
test('snapshots are detached, revisions invalidate current submission, restore roundtrips',()=>{
  const s=C.empty();for(const id of C.TASKS)complete(s,id);
  assert(C.submit(s).ready);assert(C.current(s));const original=clone(s.submissions[0]);
  s.tasks.voltage.explanation='修订';assert(!C.current(s));assert.deepEqual(s.submissions[0],original);
  assert.deepEqual(C.parse(JSON.stringify(s)),s);
  const forged=clone(s);forged.tasks.voltage.rounds[0].observations[0].result.current=99;
  assert.throws(()=>C.parse(JSON.stringify(forged)),/读数|计算/);
  assert.throws(()=>C.parse(JSON.stringify({...s,version:2})),/版本/);
  assert.throws(()=>C.parse('{'),/JSON/);
  assert.throws(()=>C.params({...C.DEFAULT_PARAMS,material:'__proto__'}),/材料|模型/);
  assert.throws(()=>C.params(JSON.parse(JSON.stringify(C.DEFAULT_PARAMS).replace('"voltage"','"__proto__":{},"voltage"'))),/参数/);
  const empty=C.empty(),fake={at:new Date().toISOString(),tasks:clone(empty.tasks),simulation:clone(empty.simulation)};
  fake.signature=JSON.stringify({tasks:fake.tasks,simulation:fake.simulation});empty.submissions.push(fake);
  assert(!C.current(empty));assert.throws(()=>C.parse(JSON.stringify(empty)),/任务证据/);
});
test('protected raw data, failed writes/readback, and explicit recovery keep old keys intact',()=>{
  const old={'ai_lab_change_v1':'old-change','ai_training_16day_v1':'old-training'};
  const data=new Map(Object.entries(old));let silent=false,fail=false;
  const storage={getItem:k=>data.get(k)??null,setItem(k,v){if(fail)throw Error('QuotaExceededError');if(!silent)data.set(k,v);}};
  let st=C.createStore(storage),s=st.read();s.tasks.voltage.prediction='保留输入';assert(st.write(s).ok);
  assert.equal(C.createStore(storage).read().tasks.voltage.prediction,'保留输入');const before=data.get(C.KEY);
  fail=true;s.tasks.voltage.reason='未保存也应可导出';assert(!st.write(s).ok);assert.equal(data.get(C.KEY),before);C.parse(JSON.stringify(s));fail=false;
  silent=true;assert(!st.write(s).ok,'silent discarded writes cannot report success');silent=false;
  for(const raw of ['{broken',JSON.stringify({...C.empty(),version:99})]){
    data.set(C.KEY,raw);st=C.createStore(storage);st.read();assert(st.getError());assert(!st.write(C.empty()).ok);assert.equal(data.get(C.KEY),raw);
    assert(st.write(C.empty(),{restore:true}).ok);
  }
  for(const [k,v] of Object.entries(old))assert.equal(data.get(k),v);
  assert(require('../learning/storage.js').KEYS.includes(C.KEY));
  const core=require('../learning/core.js'),backupMap=new Map([[C.KEY,data.get(C.KEY)]]);
  const backupStorage={getItem:k=>backupMap.get(k)??null,setItem:(k,v)=>backupMap.set(k,v),removeItem:k=>backupMap.delete(k)};
  const backup=core.exportBackup(backupStorage,core.emptyState());
  assert(!Object.hasOwn(JSON.parse(backup).records,C.KEY),'nine-key global backup stays unchanged');
  assert(core.importBackup(backupStorage,backup).ok);assert.equal(C.createStore(backupStorage).read().version,1);
});
test('large Chinese backups roundtrip and over-capacity submissions leave exportable draft intact',()=>{
  const s=C.empty();
  for(const id of C.TASKS){
    complete(s,id);
    for(let round=0;round<3;round++){C.startRound(s);for(let i=0;i<38;i++)record(s,id==='transfer'?{topology:'parallel'}:{});}
    // Last round must contain the task's necessary conditions.
    if(id==='voltage'){record(s,{voltage:3});record(s,{voltage:6});}
    if(id==='resistance'){record(s,{resistance:10});record(s,{resistance:20});}
  }
  assert(C.check(s).ready,JSON.stringify(C.check(s)));
  let rejected=false;
  for(let i=0;i<10;i++){
    s.tasks.voltage.revision='中文修订'+i;
    const before=JSON.stringify(s);
    try{C.submit(s);}catch(e){assert.match(e.message,/容量|导出/);assert.equal(JSON.stringify(s),before);rejected=true;break;}
  }
  assert(rejected,'oversized snapshot must be refused before mutation');
  const raw=C.serialize(s);assert.deepEqual(C.parse(raw),s);
  assert(Buffer.byteLength(raw,'utf8')<=C.MAX_FILE_BYTES);
  assert.deepEqual(C.parse(JSON.stringify(s,null,2)),s,'formatted own data can also be restored');
});
console.log(count+' current experiment checks passed');
