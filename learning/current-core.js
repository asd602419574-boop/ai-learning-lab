/* One physics activity. Fixed checks establish evidence, never certify mastery. */
(function(root,factory){
  const api=factory(typeof module==='object'&&module.exports?require('./current-physics.js'):root.CurrentPhysics);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CurrentCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(P){
  'use strict';
  const KEY='ai_lab_sim_current_v1',TASKS=Object.freeze(['voltage','resistance','transfer']);
  const DEFAULT_PARAMS=Object.freeze({voltage:6,resistance:10,closed:true,mode:'ideal',material:'copper',length:10,area:.02,temperature:20,topology:'single',r2:20});
  const clone=x=>JSON.parse(JSON.stringify(x)),object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const now=()=>new Date().toISOString(),MAX_FILE_BYTES=2000000;
  const fail=message=>{throw Error(message);};
  function serialize(value){const raw=JSON.stringify(value);if(new TextEncoder().encode(raw).length>MAX_FILE_BYTES)fail('实验记录达到2MB容量上限，本次添加未应用；请先导出保留。');return raw;}
  function append(s,list,value){list.push(value);try{serialize(s);}catch(e){list.pop();throw e;}}
  function setNote(s,key,value){
    if(!['prediction','reason','explanation','revision'].includes(key))fail('未知文字字段');text(value);
    const task=s.tasks[s.activeTask],before=task[key];task[key]=value;
    try{serialize(s);}catch(e){task[key]=before;throw e;}
  }
  function setSimulation(s,value){
    simulation(value);const before=s.simulation;s.simulation=value;
    try{serialize(s);}catch(e){s.simulation=before;throw e;}
  }
  function empty(){return {format:'current-experiment',version:1,activityId:'physics-current',activeTask:'voltage',simulation:{params:{...DEFAULT_PARAMS},points:[]},tasks:Object.fromEntries(TASKS.map(id=>[id,{prediction:'',reason:'',explanation:'',revision:'',rounds:[]}])),submissions:[],updatedAt:null};}
  function params(p){
    if(!object(p)||Object.keys(DEFAULT_PARAMS).some(k=>!Object.hasOwn(p,k))||Object.keys(p).some(k=>!Object.hasOwn(DEFAULT_PARAMS,k)))fail('实验参数结构不完整');
    if(typeof p.closed!=='boolean')fail('开关状态无效');
    if(!['copper','aluminum','nichrome'].includes(p.material)||!['ideal','wire'].includes(p.mode)||!['single','series','parallel'].includes(p.topology))fail('材料或实验模型无效');
    P.calculate(p);
    const ranges={voltage:[-12,12],resistance:[1,100],length:[1,20],area:[.01,.1],temperature:[20,100],r2:[1,100]};
    for(const [k,[a,b]] of Object.entries(ranges))if(p[k]<a||p[k]>b)fail('参数超出实验范围：'+k);
    return p;
  }
  function startRound(s){
    const t=s.tasks[s.activeTask];
    if(!t.prediction.trim()||!t.reason.trim())fail('请先填写预测及理由，再开始本轮记录。');
    if(t.rounds.length>=10)fail('本任务已保存10轮，请导出保留；仍可完善当前一轮。');
    append(s,t.rounds,{at:now(),prediction:t.prediction,reason:t.reason,observations:[]});s.updatedAt=now();
  }
  function observe(s){
    const t=s.tasks[s.activeTask],r=t.rounds.at(-1);
    if(!r)fail('先填写预测并点击“锁定预测，开始本轮”。');
    if(r.prediction!==t.prediction||r.reason!==t.reason)fail('预测已修改，请开始新一轮，保留原预测和观察。');
    if(r.observations.length>=40)fail('本轮已记录40组，请导出或开始新一轮。');
    const p=clone(params(s.simulation.params));append(s,r.observations,{at:now(),params:p,result:P.calculate(p)});s.updatedAt=now();
  }
  function checkTask(s,id){
    const t=s.tasks[id],r=t.rounds.at(-1),issues=[];
    if(!r||r.prediction!==t.prediction||r.reason!==t.reason)issues.push('先锁定当前预测及理由，再记录本轮观察。');
    const observations=r?.observations||[];
    const base=p=>p.closed&&p.mode==='ideal'&&p.material==='copper'&&p.temperature===20;
    if(id==='voltage'&&!([3,6].every(u=>observations.some(o=>base(o.params)&&o.params.topology==='single'&&o.params.resistance===10&&o.params.voltage===u))))issues.push('固定单电阻10 Ω与闭合开关，分别记录3 V和6 V，核对0.3 A与0.6 A。');
    if(id==='resistance'&&!([10,20].every(r=>observations.some(o=>base(o.params)&&o.params.topology==='single'&&o.params.voltage===6&&o.params.resistance===r))))issues.push('固定电压6 V与闭合开关，分别记录10 Ω和20 Ω，核对0.6 A与0.3 A。');
    if(id==='transfer'&&!observations.some(o=>base(o.params)&&o.params.topology==='parallel'&&o.params.voltage===6&&o.params.resistance===10&&o.params.r2===20))issues.push('迁移需记录6 V、10 Ω与20 Ω并联的模拟结果；区别支路电流与总电流。');
    if(!t.explanation.trim())issues.push('请写下预测与结果是否一致，并解释依据；开放解释仅作自评。');
    return {ready:issues.length===0,issues};
  }
  function check(s){const tasks=Object.fromEntries(TASKS.map(id=>[id,checkTask(s,id)]));return {ready:TASKS.every(id=>tasks[id].ready),tasks};}
  const signature=s=>JSON.stringify({tasks:s.tasks,simulation:s.simulation});
  function current(s){return !!s.submissions.length&&s.submissions.at(-1).signature===signature(s)&&check(s).ready;}
  function submit(s){
    const result=check(s);if(!result.ready)return result;
    if(current(s))return {...result,duplicate:true};
    if(s.submissions.length>=10)fail('已保留10个提交版本，请先导出；当前稿仍可保存和导出。');
    append(s,s.submissions,{at:now(),tasks:clone(s.tasks),simulation:clone(s.simulation),signature:signature(s)});s.updatedAt=now();return result;
  }
  function text(value){if(typeof value!=='string'||value.length>6000)fail('文字字段无效或超过6000字');}
  function timestamp(value){if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value)))fail('时间字段无效');}
  function array(value,max){if(!Array.isArray(value)||value.length>max)fail('记录数组无效或超过容量');}
  function simulation(value){
    if(!object(value))fail('模拟数据无效');params(value.params);array(value.points,12);
    for(const point of value.points){
      if(!object(point)||!['u','i','r'].every(k=>Number.isFinite(point[k]))||Math.abs(point.u)>12||point.r<=0||Math.abs(point.i)>1000)fail('曲线记录点无效');
      text(point.label);
    }
  }
  function tasks(value){
    if(!object(value)||Object.keys(value).length!==3||TASKS.some(id=>!object(value[id])))fail('任务记录结构不完整');
    for(const id of TASKS){
      const t=value[id];for(const k of ['prediction','reason','explanation','revision'])text(t[k]);array(t.rounds,10);
      for(const r of t.rounds){timestamp(r.at);text(r.prediction);text(r.reason);array(r.observations,40);
        if(!r.prediction.trim()||!r.reason.trim())fail('观察缺少预测依据');
        for(const o of r.observations){
          timestamp(o.at);params(o.params);const expected=P.calculate(o.params);
          if(!object(o.result)||Object.keys(expected).some(k=>o.result[k]!==expected[k]))fail('模拟读数与参数计算不一致');
        }
      }
    }
  }
  function parse(raw){
    if(typeof raw!=='string'||raw.length>8000000)fail('实验JSON超过容量或不是文本');
    let value;try{value=JSON.parse(raw);}catch{fail('实验JSON无法读取');}
    if(!object(value)||value.format!=='current-experiment'||value.activityId!=='physics-current')fail('不是本实验的JSON文件');
    if(value.version!==1)fail('实验记录版本不支持，原数据保留');
    if(!TASKS.includes(value.activeTask))fail('任务标识无效');
    simulation(value.simulation);tasks(value.tasks);array(value.submissions,10);
    if(value.updatedAt!==null)timestamp(value.updatedAt);
    for(const v of value.submissions){timestamp(v.at);tasks(v.tasks);simulation(v.simulation);if(v.signature!==signature(v)||!check(v).ready)fail('提交版本与快照或任务证据不一致');}
    serialize(value);
    return value;
  }
  function createStore(storage){
    let blocked=false,error='',last;
    function read(){
      try{last=storage.getItem(KEY);if(last===null)return empty();return parse(last);}
      catch(e){blocked=true;error='原记录不可读取，已保护：'+e.message+'。请先导出原始记录，再显式导入有效备份。';return empty();}
    }
    function write(state,{restore=false}={}){
      try{
        if(blocked&&!restore)fail(error);
        const raw=serialize(state);parse(raw);
        if(storage.getItem(KEY)!==last)fail('其他页面已改变实验记录，请导出本页后重新载入。');
        storage.setItem(KEY,raw);
        if(storage.getItem(KEY)!==raw)fail('写入后读回不一致，未确认保存。');
        last=raw;blocked=false;error='';return {ok:true};
      }catch(e){error=e.message;return {ok:false,error};}
    }
    return {read,write,getError:()=>error,raw:()=>last};
  }
  return {KEY,TASKS,DEFAULT_PARAMS,MAX_FILE_BYTES,serialize,setNote,setSimulation,empty,params,startRound,observe,checkTask,check,submit,current,parse,createStore};
});
