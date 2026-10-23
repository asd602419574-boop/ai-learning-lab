/* Author: Lliftime. One course's editable learning artifact; no business execution or semantic grading. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ProcessCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEY='ai_lab_process_v1',TASKS=['main','transfer'],MAX=1800000;
  const ANALYSIS=['purpose','trigger','input','output','roles','boundary','suppliers','customers','asis','bottleneck','optimization','evidence'];
  const ACTIONS=['submit','validate','assign','route','approve','return','reject','withdraw','escalate','reassign','notify','archive','repair','confirm','other'];
  const CONDITIONS=['always','complete','incomplete','low','high','approved','rejected','withdraw','timeout','changed'];
  const clone=x=>JSON.parse(JSON.stringify(x)),object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&(Object.getPrototypeOf(x)===Object.prototype||Object.getPrototypeOf(x)===null);
  const exact=(x,keys)=>object(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
  const text=x=>typeof x==='string',filled=x=>text(x)&&!!x.trim();
  const time=()=>new Date().toISOString(),date=x=>text(x)&&Number.isFinite(Date.parse(x));
  function safe(x,d=0,b={n:0}){
    if(++b.n>60000||d>20)throw Error('流程记录过大或过深');
    if(x===null||typeof x==='boolean')return;
    if(text(x)){if(x.length>20000)throw Error('单段文字过长');return;}
    if(typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=Number.MAX_SAFE_INTEGER)return;
    if(!object(x)&&!Array.isArray(x))throw Error('仅接受普通JSON');
    if(Array.isArray(x)&&x.length>300)throw Error('数组条目超过300');
    for(const k of Object.keys(x)){if(['__proto__','constructor','prototype'].includes(k)||k.length>100)throw Error('不安全字段');const p=Object.getOwnPropertyDescriptor(x,k);if(!p||!('value'in p))throw Error('不接受动态属性');safe(p.value,d+1,b);}
  }
  function emptyModel(task='main'){
    return {title:task==='transfer'?'设备维修申请流程':'企业任务与审批流程',analysis:Object.fromEntries(ANALYSIS.map(k=>[k,''])),nodes:[],edges:[],rules:{slaHours:24,threshold:5000,timeoutTarget:'',ownerChange:'',withdrawPolicy:''},raci:[],metrics:{beforeMinutes:0,afterMinutes:0,total:0,rework:0},mapping:[],explanation:'',reflection:''};
  }
  function taskState(task){return {model:emptyModel(task),revision:0,read:[],submissions:[],lastCheck:null,versions:[]};}
  function emptyState(){return {schemaVersion:1,chapter:1,task:'main',tasks:{main:taskState('main'),transfer:taskState('transfer')},updatedAt:null};}
  function exampleModel(){
    const m=emptyModel();
    m.analysis={purpose:'员工提交通用资源申请后，在有权限的人审查后通知结果，并保留可追溯记录。',trigger:'员工点击提交，形成唯一申请编号。',input:'申请人、部门、资源名称、金额、用途和附件。',output:'可查阅的批准、拒绝或撤回记录；待补正是本次处理结束，申请未关闭。',roles:'员工、系统、主管、部门负责人、流程管理员',boundary:'从一次提交开始，到归档关闭或待补正通知结束；不包含采购付款。',suppliers:'员工、部门人员目录',customers:'申请人、审计人员',asis:'邮件提交→人工查附件→群里找主管→邮件审批→手工登记；退回时重复填表。',bottleneck:'等待负责人占用大部分周期，缺少编号导致重复查找。',optimization:'复用原申请编号，提交时校验必填，按金额路由；审批保留人工决策。',evidence:'教学样本：10件同类申请，前后周期80与50分钟；需真实试点复核，不代表部署收益。'};
    const add=(id,type,label,role,action='other',condition='')=>m.nodes.push({id,type,label,role,action,condition});
    add('start','start','收到本次提交','员工');add('submit','task','登记申请','员工','submit');add('validate','gateway','材料完整？','系统','validate');add('return','task','说明缺项并通知补正','系统','return');add('needsInfo','end','本次处理结束，等待再次提交','系统','other','待补正通知已记录，不表示业务关闭');
    add('assign','task','分配处理任务','系统','assign');add('route','gateway','金额超过阈值？','系统','route');add('manager','gateway','主管处理审批','主管','approve');add('senior','gateway','部门负责人处理审批','部门负责人','approve');
    add('reject','task','记录拒绝原因','主管','reject');add('withdraw','task','撤回并取消待办','员工','withdraw');add('escalate','task','记录超时并升级','流程管理员','escalate');add('reassign','task','转派并保留历史','流程管理员','reassign');add('notify','task','发送结果通知','系统','notify');add('archive','task','归档关闭申请','系统','archive');add('end','end','本次申请关闭','系统','other','批准/拒绝/撤回结果已通知且归档');
    const edge=(from,to,condition='always')=>m.edges.push({id:'e'+(m.edges.length+1),from,to,condition});
    edge('start','submit');edge('submit','validate');edge('validate','assign','complete');edge('validate','return','incomplete');edge('return','needsInfo');edge('assign','route');edge('route','manager','low');edge('route','senior','high');
    for(const id of ['manager','senior'])for(const [condition,to] of [['approved','notify'],['rejected','reject'],['withdraw','withdraw'],['timeout','escalate'],['changed','reassign']])edge(id,to,condition);
    edge('reject','notify');edge('withdraw','notify');edge('escalate','route');edge('reassign','route');edge('notify','archive');edge('archive','end');
    m.rules={slaHours:24,threshold:5000,timeoutTarget:'流程管理员；升级后重新指定有权限的审批人，不能自动批准。',ownerChange:'转派并保留原审批人、当前审批人、原因、时间；旧待办失效。',withdrawPolicy:'审批决定前允许撤回；决定后拒绝撤回并告知状态冲突。'};
    m.raci=m.nodes.filter(n=>n.type!=='start'&&n.type!=='end').map(n=>({activity:n.id,responsible:n.role,accountable:n.action==='approve'?n.role:'流程管理员',consulted:n.action==='approve'?'申请人':'',informed:'申请人'}));
    m.mapping=m.nodes.filter(n=>['submit','validate','assign','approve','notify','archive'].includes(n.action)).map(n=>({nodeId:n.id,module:n.action==='approve'?'审批服务':'申请服务',state:n.action==='archive'?'closed':n.action==='approve'?'pending':'submitted',object:'Application / Task / AuditEvent',api:n.action==='approve'?'POST /applications/{id}/decisions':'POST /applications/{id}/'+n.action}));
    m.metrics={beforeMinutes:80,afterMinutes:50,total:10,rework:2};m.explanation='把缺项退回与业务拒绝分开；金额边界5000归低额路径；超时和换人后回到授权审批而非自动通过。';m.reflection='这张图是结构化教学模型；并发撤回、权限与重试仍需系统设计和人员复核。';return m;
  }
  function validateModel(m){
    safe(m);
    if(!exact(m,['title','analysis','nodes','edges','rules','raci','metrics','mapping','explanation','reflection'])||!text(m.title)||!text(m.explanation)||!text(m.reflection)||!exact(m.analysis,ANALYSIS)||!Object.values(m.analysis).every(text))throw Error('流程文字结构无效');
    if(!Array.isArray(m.nodes)||m.nodes.length>80||!Array.isArray(m.edges)||m.edges.length>160||!Array.isArray(m.raci)||!Array.isArray(m.mapping))throw Error('节点、连接或表格结构无效');
    if(m.nodes.some(n=>!exact(n,['id','type','label','role','action','condition'])||!Object.values(n).every(text)||!['start','task','gateway','end'].includes(n.type)||!ACTIONS.includes(n.action)||!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(n.id)))throw Error('节点格式无效（ID使用英文开头的字母、数字、短横线）');
    if(m.edges.some(e=>!exact(e,['id','from','to','condition'])||!Object.values(e).every(text)||!CONDITIONS.includes(e.condition)))throw Error('连接格式无效');
    if(!exact(m.rules,['slaHours','threshold','timeoutTarget','ownerChange','withdrawPolicy'])||!['slaHours','threshold'].every(k=>typeof m.rules[k]==='number'&&Number.isFinite(m.rules[k]))||!['timeoutTarget','ownerChange','withdrawPolicy'].every(k=>text(m.rules[k])))throw Error('业务规则格式无效');
    if(!exact(m.metrics,['beforeMinutes','afterMinutes','total','rework'])||!Object.values(m.metrics).every(x=>typeof x==='number'&&Number.isFinite(x)&&x>=0))throw Error('指标格式无效');
    if(m.raci.some(r=>!exact(r,['activity','responsible','accountable','consulted','informed'])||!Object.values(r).every(text)))throw Error('RACI格式无效');
    if(m.mapping.some(r=>!exact(r,['nodeId','module','state','object','api'])||!Object.values(r).every(text)))throw Error('系统需求格式无效');
    return m;
  }
  const branchSets={validate:['complete','incomplete'],route:['low','high'],approve:['approved','rejected','withdraw','timeout','changed']};
  function trace(model,context={}){
    const result={completed:false,nodes:[],actions:[],reason:''};
    try{validateModel(model);}catch(e){result.reason=e.message;return result;}
    let node=model.nodes.find(n=>n.type==='start');const byId=new Map(model.nodes.map(n=>[n.id,n])),used=new Set();
    for(let i=0;i<120&&node;i++){
      result.nodes.push(node.id);result.actions.push(node.action);
      if(node.type==='end'){result.completed=filled(node.condition);result.reason=result.completed?'抵达已定义的结束条件':'结束条件为空';return result;}
      let condition='always';
      if(node.type==='gateway'){
        if(node.action==='validate')condition=context.complete===false?'incomplete':'complete';
        else if(node.action==='route')condition=Number(context.amount||0)>model.rules.threshold?'high':'low';
        else if(node.action==='approve'){
          condition=context.withdraw&&!used.has('withdraw')?'withdraw':context.timeout&&!used.has('timeout')?'timeout':context.ownerChanged&&!used.has('changed')?'changed':context.outcome==='rejected'?'rejected':'approved';
          used.add(condition);
        }else{result.reason='网关没有可执行的教学规则';return result;}
      }
      const edges=model.edges.filter(e=>e.from===node.id&&e.condition===condition);
      if(edges.length!==1){result.reason=node.id+' 的 '+condition+' 分支应恰好连接一次';return result;}
      node=byId.get(edges[0].to);
    }
    result.reason=node?'超过120步，可能存在不能结束的循环':'连接指向不存在的节点';return result;
  }
  function checkModel(model,task='main'){
    const issues=[],add=(code,message,nodeId='')=>issues.push({code,message,nodeId});
    try{validateModel(model);}catch(e){add('invalid-model',e.message);return {passed:false,issues,traces:[],scope:'教学结构与固定情境，非专业评审'};}
    const m=model,ids=new Set(),byId=new Map(m.nodes.map(n=>[n.id,n]));
    for(const n of m.nodes){if(ids.has(n.id))add('duplicate-node','节点ID重复：'+n.id,n.id);ids.add(n.id);if(!filled(n.label)||!filled(n.role))add('node-description','补齐节点名称与负责角色：'+n.id,n.id);}
    if(new Set(m.edges.map(e=>e.id)).size!==m.edges.length)add('duplicate-edge','连接ID重复');
    if(m.nodes.filter(n=>n.type==='start').length!==1)add('start-count','应有且仅有一个开始节点');
    if(!m.nodes.some(n=>n.type==='end'))add('end-count','缺少结束节点');
    for(const action of ['submit','validate','assign','route','approve','notify','archive','return','reject','withdraw','escalate','reassign',...(task==='transfer'?['repair','confirm']:[])])if(!m.nodes.some(n=>n.action===action))add('required-action','缺少必要活动：'+action);
    for(const e of m.edges)if(!ids.has(e.from)||!ids.has(e.to))add('dangling-edge','连接 '+e.id+' 的起点或终点不存在');
    for(const n of m.nodes){
      const out=m.edges.filter(e=>e.from===n.id),incoming=m.edges.filter(e=>e.to===n.id);
      if(n.type==='start'&&incoming.length)add('start-incoming','开始节点不能有进入连接',n.id);
      if(n.type==='end'){if(out.length)add('end-outgoing','结束节点不能再连出',n.id);if(!filled(n.condition))add('end-condition','结束节点必须说明可验证的结束条件',n.id);}
      else if(n.type==='gateway'){
        const required=branchSets[n.action];
        if(!required)add('gateway-rule','网关仅支持材料校验、金额路由、审批三类教学规则',n.id);
        else if(required.some(k=>out.filter(e=>e.condition===k).length!==1)||out.some(e=>!required.includes(e.condition)))add('branch-'+n.action,n.id+' 分支须各连接一次：'+required.join(' / '),n.id);
      }else if(out.length!==1||out[0]?.condition!=='always')add('task-outgoing',n.id+' 应有一条“总是”连接；条件判断放在网关',n.id);
      if(['validate','route','approve'].includes(n.action)&&n.type!=='gateway')add('action-type',n.id+' 的判断活动应使用网关',n.id);
    }
    const walk=(initial,reverse=false)=>{const reached=new Set(initial),queue=[...initial];while(queue.length){const id=queue.shift();for(const e of m.edges){const from=reverse?e.to:e.from,to=reverse?e.from:e.to;if(from===id&&ids.has(to)&&!reached.has(to)){reached.add(to);queue.push(to);}}}return reached;};
    const reached=walk(m.nodes.filter(n=>n.type==='start').map(n=>n.id)),endable=walk(m.nodes.filter(n=>n.type==='end').map(n=>n.id),true);
    for(const n of m.nodes){if(!reached.has(n.id))add('unreachable','节点不能从开始抵达：'+n.id,n.id);if(!endable.has(n.id))add('no-end-path','节点没有通向结束的路径：'+n.id,n.id);}
    for(const k of ANALYSIS)if(!filled(m.analysis[k]))add('analysis','补齐分析：'+k);
    if(m.rules.slaHours<=0||m.rules.threshold<0)add('numeric-rule','SLA须大于0，金额阈值须非负');
    for(const k of ['timeoutTarget','ownerChange','withdrawPolicy'])if(!filled(m.rules[k]))add('governance','补齐治理规则：'+k);
    for(const n of m.nodes.filter(n=>n.type==='task'||n.type==='gateway')){
      const row=m.raci.find(r=>r.activity===n.id);
      if(!row||!filled(row.responsible)||!filled(row.accountable)||/[、,，;；]/.test(row.accountable))add('raci','节点 '+n.id+' 须有执行R和单一最终负责A；C/I可为空',n.id);
    }
    for(const row of m.raci)if(!ids.has(row.activity))add('raci-reference','RACI引用不存在的节点：'+row.activity);
    for(const n of m.nodes.filter(n=>['submit','validate','assign','approve','notify','archive',...(task==='transfer'?['repair','confirm']:[])].includes(n.action))){const row=m.mapping.find(r=>r.nodeId===n.id);if(!row||!['module','state','object','api'].every(k=>filled(row[k])))add('mapping','为 '+n.id+' 补齐模块、状态、数据对象与接口需求',n.id);}
    for(const row of m.mapping)if(!ids.has(row.nodeId))add('mapping-reference','系统需求引用不存在的节点：'+row.nodeId);
    if(m.metrics.beforeMinutes<=0||m.metrics.afterMinutes<=0||!Number.isInteger(m.metrics.total)||!Number.isInteger(m.metrics.rework)||m.metrics.total<=0||m.metrics.rework>m.metrics.total)add('metrics','周期须大于0；样本数与返工数为整数且0≤返工≤样本');
    if(!filled(m.explanation)||!filled(m.reflection))add('explanation','请记录方案取舍与复盘；这里只检查提交存在，不判断语义正确');
    const normal=['submit','validate','assign','route','approve','notify','archive'];
    const cases=[['完整低额',{amount:m.rules.threshold},[...normal]],['完整高额',{amount:m.rules.threshold+1},[...normal]]];
    for(const [label,event,actions] of [['缺项',{complete:false},['submit','validate','return']],['拒绝',{outcome:'rejected'},[...normal,'reject']],['撤回',{withdraw:true},[...normal,'withdraw']],['超时',{timeout:true},[...normal,'escalate']],['换人',{ownerChanged:true},[...normal,'reassign']]]){
      for(const [level,amount] of [['低额',m.rules.threshold],['高额',m.rules.threshold+1]])cases.push([level+label,{...event,amount},actions]);
    }
    if(task==='transfer'){cases[0][2].push('repair','confirm');cases[1][2].push('repair','confirm');}
    const low=trace(m,{amount:m.rules.threshold}),high=trace(m,{amount:m.rules.threshold+1});
    const expectedRole=path=>path.nodes.map(id=>byId.get(id)).find(n=>n?.action==='approve')?.role;
    const traces=cases.map(([label,context,required])=>{
      const result=trace(m,context),role=expectedRole(context.amount>m.rules.threshold?high:low);
      const roleOK=context.complete===false||result.nodes.map(id=>byId.get(id)).filter(n=>n?.action==='approve').every(n=>n.role===role);
      const passed=result.completed&&required.every(a=>result.actions.includes(a))&&roleOK;
      if(!passed)add('scenario','情境“'+label+'”未满足必要活动、岗位与结束条件：'+(roleOK?result.reason:'异常处理后改变了金额路径所需的审批岗位'));
      return {label,passed,...result};
    });
    if(JSON.stringify(low.nodes)===JSON.stringify(high.nodes))add('conditional-route','金额阈值两侧必须走不同的审批路径');
    if(task==='transfer'){
      if(m.rules.threshold!==2000||m.rules.slaHours!==8)add('transfer-rules','维修任务约定：阈值2000，审批SLA为8自然小时，不能沿用示范值');
      const approvalRole=path=>path.nodes.map(id=>byId.get(id)).filter(n=>n?.action==='approve').map(n=>n.role.trim());
      if(!approvalRole(low).includes('班组长')||!approvalRole(high).includes('设备负责人'))add('transfer-role','维修任务低额由班组长审批，高额由设备负责人审批');
      for(const path of [low,high]){
        const order=['approve','repair','confirm','notify','archive'].map(action=>path.actions.indexOf(action));
        if(order.some((v,i)=>v<0||(i>0&&v<=order[i-1])))add('transfer-order','获批维修须按审批→派修→确认结果→通知→归档顺序执行');
      }
    }
    return {passed:!issues.length,issues,traces,scope:'图结构、字段存在与7类情境的12个高低额变式；开放设计需对照量规，知识掌握程度无法判断'};
  }
  function metrics(m){return {cycleChange:m.beforeMinutes>0?(m.beforeMinutes-m.afterMinutes)/m.beforeMinutes:null,reworkRate:m.total>0?m.rework/m.total:null};}
  function validateState(s){
    safe(s);
    if(!exact(s,['schemaVersion','chapter','task','tasks','updatedAt'])||s.schemaVersion!==1||!Number.isInteger(s.chapter)||s.chapter<1||s.chapter>6||!TASKS.includes(s.task)||!exact(s.tasks,TASKS)||(s.updatedAt!==null&&!date(s.updatedAt)))throw Error('流程记录结构或版本不支持，原始值保留');
    for(const key of TASKS){const t=s.tasks[key];if(!exact(t,['model','revision','read','submissions','lastCheck','versions'])||!Number.isInteger(t.revision)||t.revision<0)throw Error('任务记录无效');validateModel(t.model);
      if(!Array.isArray(t.read)||t.read.some(n=>!Number.isInteger(n)||n<1||n>6)||new Set(t.read).size!==t.read.length||!Array.isArray(t.submissions)||!Array.isArray(t.versions)||t.versions.length>20||t.submissions.length>200)throw Error('阅读或版本记录无效');
      for(const a of t.submissions)if(!exact(a,['revision','at','rulePassed'])||!Number.isInteger(a.revision)||a.revision<0||a.revision>t.revision||!date(a.at)||typeof a.rulePassed!=='boolean')throw Error('提交记录无效');
      if(t.lastCheck!==null&&(!exact(t.lastCheck,['revision','at'])||!Number.isInteger(t.lastCheck.revision)||t.lastCheck.revision!==t.revision||!date(t.lastCheck.at)))throw Error('检查记录无效');
      for(const v of t.versions){if(!exact(v,['id','revision','at','model'])||!filled(v.id)||!Number.isInteger(v.revision)||v.revision<0||v.revision>t.revision||!date(v.at))throw Error('作品版本无效');validateModel(v.model);}
    }
    if(JSON.stringify(s).length>MAX)throw Error('流程记录接近容量上限，请先导出');return s;
  }
  function parseRecord(raw){if(!text(raw)||raw.length>MAX)throw Error('流程文件过大或格式无效');return clone(validateState(JSON.parse(raw)));}
  function edit(state,task,change){const next=clone(state);change(next.tasks[task].model);validateModel(next.tasks[task].model);next.tasks[task].revision++;next.tasks[task].lastCheck=null;next.updatedAt=time();return next;}
  function status(state,task){const t=state.tasks[task],submitted=t.submissions.some(x=>x.revision===t.revision),rulesPassed=!!t.lastCheck&&t.lastCheck.revision===t.revision&&checkModel(t.model,task).passed;return {readingComplete:t.read.length===6,submitted,rulesPassed,necessaryAcceptance:task==='transfer'&&submitted&&rulesPassed,mastery:'unknown'};}
  function submit(state,task){const next=clone(state),t=next.tasks[task];if(t.submissions.length>=200)return {ok:false,error:'提交次数达到本机记录上限，请导出备份'};const check=checkModel(t.model,task);t.lastCheck={revision:t.revision,at:time()};t.submissions.push({revision:t.revision,at:time(),rulePassed:check.passed});next.updatedAt=time();return {ok:true,state:next,check};}
  function saveVersion(state,task){const next=clone(state),t=next.tasks[task];if(t.versions.length>=20)return {ok:false,error:'已保存20个版本，请先导出；当前草稿仍保留'};t.versions.push({id:'v'+(t.versions.length+1),revision:t.revision,at:time(),model:clone(t.model)});next.updatedAt=time();return {ok:true,state:next};}
  function restoreVersion(state,task,id){const v=state.tasks[task].versions.find(v=>v.id===id);if(!v)return {ok:false,error:'未找到该版本'};const next=edit(state,task,m=>Object.assign(m,clone(v.model)));return {ok:true,state:next};}
  function createStore(storage){let current=emptyState(),expected=null,protectedRaw=false,error='';try{expected=storage.getItem(KEY);if(expected!==null)current=parseRecord(expected);}catch(e){protectedRaw=true;error='无法读取流程记录，原始值未覆盖。请保留原始值并显式恢复可信备份。'+e.message;}
    return {read:()=>clone(current),getError:()=>error,write(s){if(protectedRaw)return {ok:false,error};try{validateState(s);if(storage.getItem(KEY)!==expected)throw Error('记录已被其他页面改变，请导出当前输入后重新载入');const raw=JSON.stringify(s);storage.setItem(KEY,raw);expected=raw;current=clone(s);error='';return {ok:true,error:''};}catch(e){error='流程保存失败：'+e.message;return {ok:false,error};}}};
  }
  function importRecord(storage,raw){try{const data=parseRecord(raw);storage.setItem(KEY,JSON.stringify(data));return {ok:true,state:data};}catch(e){return {ok:false,error:'恢复失败，未写入无效记录：'+e.message};}}
  function exportMarkdown(state,task){const t=state.tasks[task],m=t.model,r=checkModel(m,task),v=status(state,task),q=metrics(m.metrics);return '# '+m.title+'\n\nAuthor: Lliftime\n\n任务：'+(task==='main'?'贯穿示范项目':'独立迁移项目')+'；修订 '+t.revision+'\n\n阅读完成：'+v.readingComplete+'；当前提交：'+v.submitted+'；规则检查：'+(r.passed?'通过':'待修订')+'；独立任务必要验收：'+v.necessaryAcceptance+'\n\n知识掌握程度无法判断。规则通过仅覆盖结构、字段存在和固定情境，开放解释未做语义评分。\n\n## 业务分析\n'+Object.entries(m.analysis).map(([k,x])=>'### '+k+'\n'+x).join('\n\n')+'\n\n## 节点与连接\n```json\n'+JSON.stringify({nodes:m.nodes,edges:m.edges,rules:m.rules},null,2)+'\n```\n\n## RACI\n```json\n'+JSON.stringify(m.raci,null,2)+'\n```\n\n## 系统需求\n```json\n'+JSON.stringify(m.mapping,null,2)+'\n```\n\n## 真实输入的教学指标\n'+JSON.stringify(m.metrics)+'\n周期相对变化：'+(q.cycleChange===null?'无法计算':(q.cycleChange*100).toFixed(1)+'%')+'；返工率：'+(q.reworkRate===null?'无法计算':(q.reworkRate*100).toFixed(1)+'%')+'。非真实企业优化效果。\n\n## 检查反馈\n'+(r.issues.map(i=>'- '+i.message).join('\n')||'教学规则通过')+'\n\n'+r.traces.map(x=>'- '+x.label+'：'+(x.passed?'符合必要路径':'待修订')+' '+x.nodes.join(' → ')).join('\n')+'\n\n## 方案取舍与复盘\n'+m.explanation+'\n\n'+m.reflection+'\n\n历史版本：'+t.versions.length+'。JSON备份包含两个任务、检查提交和版本快照；Markdown用于阅读，不能恢复。\n';}
  return {KEY,ANALYSIS,ACTIONS,CONDITIONS,emptyModel,emptyState,exampleModel,validateState,parseRecord,checkModel,trace,metrics,edit,status,submit,saveVersion,restoreVersion,createStore,importRecord,exportMarkdown};
});
