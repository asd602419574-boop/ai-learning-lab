'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
assert.ok(fs.existsSync(require.resolve('../learning/core.js').replace(/core\.js$/,'process-core.js')),'流程规则核心尚未实现');
const C=require('../learning/process-core.js');
const memory=(initial={})=>{const m=new Map(Object.entries(initial));return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const copy=x=>JSON.parse(JSON.stringify(x));
const model=C.exampleModel();
assert.equal(C.checkModel(model,'main').passed,true,'示范方案应满足教学结构约定');
for(const [mutate,code] of [
 [m=>m.nodes.push(copy(m.nodes[0])),'duplicate-node'],
 [m=>m.edges.push({id:'bad',from:'missing',to:'end',condition:'always'}),'dangling-edge'],
 [m=>m.edges=m.edges.filter(e=>e.condition!=='rejected'),'branch-approve'],
 [m=>m.nodes.push({id:'island',type:'task',label:'孤立活动',role:'员工',action:'other',condition:''}),'unreachable'],
 [m=>m.nodes.find(n=>n.type==='end').condition='','end-condition'],
 [m=>m.edges=m.edges.filter(e=>e.to!=='end'),'no-end-path']
]){const bad=copy(model);mutate(bad);assert(C.checkModel(bad,'main').issues.some(x=>x.code===code),code);}
for(const [context,action] of [[{complete:false},'return'],[{outcome:'rejected'},'reject'],[{withdraw:true},'withdraw'],[{timeout:true},'escalate'],[{ownerChanged:true},'reassign'],[{amount:8000},'approve']]){
 const r=C.trace(model,context);assert.equal(r.completed,true,JSON.stringify(r));assert(r.actions.includes(action));
}
assert.notDeepEqual(C.trace(model,{amount:8000}).nodes,C.trace(model,{amount:20}).nodes,'金额改变应真实改变路径');
const cycle=copy(model);cycle.edges=cycle.edges.filter(e=>e.from!=='archive');cycle.edges.push({id:'cycle',from:'archive',to:'notify',condition:'always'});assert.equal(C.checkModel(cycle).passed,false);
assert.equal(C.checkModel(C.emptyModel('transfer'),'transfer').passed,false);
const s=C.emptyState();s.tasks.main.model=model;
const sub=C.submit(s,'main');assert.equal(sub.ok,true);assert.equal(C.status(sub.state,'main').rulesPassed,true);assert.equal(C.status(sub.state,'main').mastery,'unknown');
const edited=C.edit(sub.state,'main',m=>{m.nodes[0].label='改变后的触发';});assert.equal(C.status(edited,'main').submitted,false);assert.equal(C.status(edited,'main').rulesPassed,false);
const saved=C.saveVersion(sub.state,'main');assert.equal(saved.ok,true);const changed=C.edit(saved.state,'main',m=>{m.title='改动';});const restored=C.restoreVersion(changed,'main',saved.state.tasks.main.versions[0].id);assert.equal(restored.ok,true);assert.equal(restored.state.tasks.main.model.title,model.title);assert.equal(C.status(restored.state,'main').rulesPassed,false,'恢复也是新修订，不沿用历史通过');
const raw=memory({legacy:'keep'}),store=C.createStore(raw);assert.equal(store.write(saved.state).ok,true);assert.deepEqual(C.createStore(raw).read(),saved.state);assert.equal(raw.getItem('legacy'),'keep');
const broken=memory({[C.KEY]:'broken'});assert.equal(C.createStore(broken).write(s).ok,false);assert.equal(broken.getItem(C.KEY),'broken');
const future=memory({[C.KEY]:JSON.stringify({...s,schemaVersion:99})});assert.equal(C.createStore(future).write(s).ok,false);
const store2=C.createStore(raw);raw.setItem(C.KEY,JSON.stringify(s));assert.equal(store2.write(saved.state).ok,false);
assert.match(C.exportMarkdown(saved.state,'main'),/知识掌握.*无法判断/);
assert.throws(()=>C.parseRecord('{"schemaVersion":1}'));

// Copying the main case must not pass the changed independent task.
const copied=C.exampleModel();
for(const [id,action] of [['repair','repair'],['confirm','confirm']]){
 copied.nodes.push({id,type:'task',label:id,role:'维修人员',action,condition:''});
 copied.raci.push({activity:id,responsible:'维修人员',accountable:'设备负责人',consulted:'',informed:'员工'});
 copied.mapping.push({nodeId:id,module:'维修模块',state:'repairing',object:'RepairTask',api:'POST /repairs/'+id});
}
copied.edges.filter(e=>e.condition==='approved').forEach(e=>e.to='repair');
copied.edges.push({id:'repair-confirm',from:'repair',to:'confirm',condition:'always'},{id:'confirm-notify',from:'confirm',to:'notify',condition:'always'});
assert(C.checkModel(copied,'transfer').issues.some(x=>x.code==='transfer-rules'),'迁移应拒绝示范阈值和时限');
copied.rules.threshold=2000;copied.rules.slaHours=8;copied.nodes.find(n=>n.id==='manager').role='班组长';copied.nodes.find(n=>n.id==='senior').role='设备负责人';
assert.equal(C.checkModel(copied,'transfer').passed,true);
const wrongOrder=copy(copied);wrongOrder.edges.find(e=>e.from==='repair').to='notify';wrongOrder.edges.find(e=>e.from==='notify').to='confirm';wrongOrder.edges.find(e=>e.from==='confirm').to='archive';
assert(C.checkModel(wrongOrder,'transfer').issues.some(x=>x.code==='transfer-order'),'先通知再确认维修应被拒绝');
const highSkipsClose=copy(model);highSkipsClose.edges.find(e=>e.from==='senior'&&e.condition==='approved').to='end';assert.equal(C.checkModel(highSkipsClose).passed,false,'高额也必须通知与归档');
const highRejectLoop=copy(model);highRejectLoop.edges.find(e=>e.from==='senior'&&e.condition==='rejected').to='senior';assert.equal(C.checkModel(highRejectLoop).passed,false,'高额拒绝死循环必须被发现');
for(const context of [{amount:5001,timeout:true},{amount:5001,ownerChanged:true}]){
 const flow=C.trace(C.exampleModel(),context);assert.equal(flow.completed,true);const approvals=flow.nodes.map(id=>model.nodes.find(n=>n.id===id)).filter(n=>n?.action==='approve');assert(approvals.every(n=>n.role==='部门负责人'),'高额超时和转派后不能降为低额岗位');
}

console.log('PASS process core: graph/termination, 12 high-low case variants, transfer requirements, revision invalidation, versions and protected records');
