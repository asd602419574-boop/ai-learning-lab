/* One independently stored artifact; legacy keys are untouched. Author: Lliftime. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.ChangeCore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const KEY='ai_lab_change_v1';
const FIELDS=['impact','flow','data','contract','compatibility','acceptance','changes','reflection'];
const BASIC=['service','legacy','old-client','urgent-create','persist-read','validation','database-constraint','approved','rejected','withdrawn','role-boundary','restart'];
const REQUIRED=[...BASIC,'independent-variant','variant-database'];
const labels={impact:'需求与影响分析',flow:'流程变化与保持的边界',data:'字段、数据与约束',contract:'API契约及错误',compatibility:'旧数据兼容与恢复',acceptance:'验收输入与观察点',changes:'修改/交付记录（业务路线写实施安排）',reflection:'复盘、依据与未验证项'};
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const sameKeys=(x,keys)=>object(x)&&Object.keys(x).sort().join('|')===keys.slice().sort().join('|');
const copy=x=>JSON.parse(JSON.stringify(x));
function empty(){return {format:'approval-change-artifact',version:1,track:'business',design:Object.fromEntries(FIELDS.map(k=>[k,''])),report:null,submissions:[]};}
function validateReport(r){
 if(!object(r)||r.format!=='approval-change-evidence'||r.version!==1||typeof r.passed!=='boolean'||typeof r.variant!=='boolean'||!Array.isArray(r.checks)||!r.checks.length||r.checks.length>60||!object(r.source_hashes)||!Array.isArray(r.requests)||r.requests.length>150||!Array.isArray(r.sql)||r.sql.length>30)throw Error('不是有效的本地变更验收报告。请导入check命令生成的JSON。');
 if(JSON.stringify(r).length>900000)throw Error('验收报告过大，请保留本任务的单次报告。');
 const ids=new Set();for(const c of r.checks){if(!object(c)||typeof c.id!=='string'||typeof c.passed!=='boolean'||typeof c.feedback!=='string'||c.feedback.length>5000||ids.has(c.id))throw Error('报告检查项格式错误或重复。');ids.add(c.id);}
 if(!r.passed&&r.checks.every(c=>c.passed))throw Error('失败报告没有失败检查项，结果不一致。');
 if(r.passed&&(!r.checks.every(c=>c.passed)||(r.variant?REQUIRED:BASIC).some(id=>!ids.has(id))))throw Error('报告声称通过但缺少必要检查或包含失败项。');
 return r;
}
function signature(s){return JSON.stringify({track:s.track,design:s.design,report:s.track==='engineering'&&s.report?{created_at:s.report.created_at,passed:s.report.passed,variant:s.report.variant,source_hashes:s.report.source_hashes,frontend_sha256:s.report.frontend_sha256,checks:s.report.checks}:null});}
function check(s){const issues=[];for(const key of FIELDS)if(!s.design[key].trim())issues.push({field:key,message:'补充“'+labels[key]+'”：说明你的决定、依据和观察点，不按字数打分。'});
 if(s.track==='engineering'){
  if(!s.report)issues.push({field:'report',message:'尚未导入当前代码的真实check报告。'});
  else {if(!s.report.passed)for(const item of s.report.checks.filter(c=>!c.passed))issues.push({field:'report',message:item.id+'：'+item.feedback});if(!s.report.variant)issues.push({field:'report',message:'当前仅基础示范报告；请独立实现12字符规则并运行check --variant。'});}
 }
 return {ready:!issues.length,issues,scope:'只检查材料结构与报告中的固定规则；报告来源自报，未独立复核；不判断专业掌握。'};
}
function current(s){return !!s.submissions.length&&s.submissions.at(-1).signature===signature(s);}
function submit(s){const result=check(s);if(!result.ready)return result;s.submissions.push({at:new Date().toISOString(),track:s.track,design:copy(s.design),signature:signature(s)});s.submissions=s.submissions.slice(-10);return result;}
function attach(s,r){validateReport(r);s.report=copy(r);}
function parse(text){if(typeof text!=='string'||text.length>2000000)throw Error('作品文件超过容量或不是文字。');const s=JSON.parse(text);
 if(!sameKeys(s,['format','version','track','design','report','submissions'])||s.format!=='approval-change-artifact'||s.version!==1||!['business','engineering'].includes(s.track)||!sameKeys(s.design,FIELDS)||FIELDS.some(k=>typeof s.design[k]!=='string'||s.design[k].length>6000)||!Array.isArray(s.submissions)||s.submissions.length>10)throw Error('作品格式/版本不支持；当前内容未覆盖。');
 if(s.report!==null)validateReport(s.report);
 for(const v of s.submissions)if(!sameKeys(v,['at','track','design','signature'])||!Number.isFinite(Date.parse(v.at))||!['business','engineering'].includes(v.track)||!sameKeys(v.design,FIELDS)||FIELDS.some(k=>typeof v.design[k]!=='string'||v.design[k].length>6000)||typeof v.signature!=='string'||v.signature.length>100000)throw Error('历史提交格式不支持。');
 return s;
}
function createStore(storage){
 let current=empty(),expected=null,protectedRaw=false,error='';
 try{expected=storage.getItem(KEY);if(expected!==null)current=parse(expected);}
 catch(e){protectedRaw=true;error='无法读取本机设计稿，原始记录未覆盖；自动保存已暂停。请保留原始值，或预览确认恢复可信JSON。'+e.message;}
 return {read:()=>copy(current),getError:()=>error,hasSaved:()=>expected!==null&&!protectedRaw,write(next,{restore=false}={}){
  if(protectedRaw&&!restore)return {ok:false,error};
  try{
   const raw=JSON.stringify(next),validated=parse(raw);
   if(storage.getItem(KEY)!==expected)throw Error('记录已被其他页面改变，请先导出本页材料并重新载入。');
   storage.setItem(KEY,raw);
   if(storage.getItem(KEY)!==raw)throw Error('写入后读回不一致，请导出当前材料。');
   current=validated;expected=raw;protectedRaw=false;error='';return {ok:true,error:''};
  }catch(e){error='本机保存失败：'+e.message;return {ok:false,error};}
 }};
}
return {KEY,FIELDS,REQUIRED,labels,empty,check,current,submit,attach,parse,createStore};
});
