/* V1.7 student-owned, locally computed project exercises. No remote inference or tool execution. */
(function(root,factory){const lib=factory();if(typeof module==='object'&&module.exports)module.exports=lib;root.ProjectLogic=lib;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
'use strict';
const LABELS=['日程','知识','技术'];
const LABEL_ROWS=[
['下周三上午安排一次小组讨论。','日程'],['明天下午三点举行公开讲座。','日程'],['请提醒我周五参加读书会。','日程'],['想预约周二的学习辅导。','日程'],
['图书馆的借阅期限是多少天？','知识'],['解释一下光合作用的基本过程。','知识'],['什么是精确率和召回率？','知识'],['火星与地球有哪些区别？','知识'],
['运行脚本提示模块不存在。','技术'],['网页打开后显示空白页面。','技术'],['Python 环境找不到安装包。','技术'],['编译时出现语法错误。','技术']
].map(([text,gold],i)=>({id:'L'+String(i+1).padStart(2,'0'),text,gold}));
const MAIL_TRAIN=[
['会议纪要今天已上传','正常'],['本周图书借阅提醒','正常'],['课程资料请查收','正常'],['周五项目讨论安排','正常'],['下月公共讲座通知','正常'],['感谢参与科学活动','正常'],['明日的学习计划','正常'],['工作坊报名成功','正常'],['活动议程正式发布','正常'],['同学分享公开资料','正常'],
['限时领取现金奖励立即点击','垃圾'],['中奖通知立刻领取奖金','垃圾'],['独家优惠不要错过','垃圾'],['免费礼品点击链接','垃圾'],['立即参与高额返利','垃圾'],['账户抽中大奖速领','垃圾'],['专属奖金只限今天','垃圾'],['推广赠品点击领取','垃圾']
].map(([text,label],i)=>({id:'T'+i,text,label}));
const MAIL_TEST=[
['新一期课程活动安排','正常'],['公开讨论的会议时间','正常'],['资料分享与讲座提醒','正常'],['明日读书活动报名','正常'],
['今天开奖快领现金','垃圾'],['限时优惠点击领取','垃圾'],['高额奖金立即到账','垃圾'],['领取免费礼品礼包','垃圾']
].map(([text,label],i)=>({id:'E'+i,text,label}));
const DOCS=[
{id:'LIB',title:'市民图书馆借阅办法',text:'每位读者每次最多借阅五本图书。普通图书借期为二十一天。若图书未被预约，可续借一次，额外延长十四天。逾期请先办理归还。'},
{id:'OPEN',title:'市民图书馆开放时间',text:'图书馆周二至周日开放。上午九点开馆，下午五点闭馆。每周一固定闭馆。法定节假日安排以当日公告为准。'},
{id:'EVENT',title:'公开科普活动安排',text:'十一月八日下午两点在二楼多功能室举办天文科普讲座。讲座面向公众，免费参加。参加者需要提前完成在线报名。'},
{id:'WORK',title:'工作坊参与须知',text:'周六上午十点开展基础编程工作坊。参加者自带笔记本电脑。参加人数限制为二十人，报名后以确认邮件为准。'},
{id:'POLICY',title:'学习平台隐私说明',text:'学习进度默认保存在当前浏览器本地。清除浏览器站点数据可能导致记录丢失。平台不会自动把学习进度发送给管理员。'},
{id:'PLAN',title:'学习计划建议',text:'建议每周分三次进行专项练习，每次二十五分钟。首次学习阅读教材，然后手动复现实验，最后记录反思与问题。'}
];
const QUERY_SET=[{q:'普通图书最多可以借几本？',want:'LIB'},{q:'图书馆周一是否开放？',want:'OPEN'},{q:'科普讲座在哪里举行？',want:'EVENT'},{q:'编程工作坊需要自带什么？',want:'WORK'},{q:'学习记录默认保存在哪里？',want:'POLICY'},{q:'每周建议练习几次？',want:'PLAN'}];
function tokens(text){const s=String(text||'').toLowerCase();const zh=(s.match(/[\u3400-\u9fff]+/g)||[]).flatMap(part=>part.length===1?[part]:Array.from({length:part.length-1},(_,i)=>part.slice(i,i+2)));const en=s.match(/[a-z0-9]+/g)||[];return [...zh,...en]}
function confusion(labels,truth,pred){const matrix=Object.fromEntries(labels.map(l=>[l,Object.fromEntries(labels.map(k=>[k,0]))]));let used=0;for(let i=0;i<truth.length;i++){if(!labels.includes(pred[i])||!labels.includes(truth[i]))continue;matrix[truth[i]][pred[i]]++;used++}const matches=labels.reduce((n,l)=>n+matrix[l][l],0);const metrics=labels.map(l=>{const tp=matrix[l][l],support=labels.reduce((n,k)=>n+matrix[l][k],0),predicted=labels.reduce((n,k)=>n+matrix[k][l],0);const precision=predicted?tp/predicted:0,recall=support?tp/support:0;return {label:l,tp,support,predicted,precision,recall,f1:precision+recall?2*precision*recall/(precision+recall):0}});let pe=0;for(const m of metrics)pe+=(m.support/Math.max(1,used))*(m.predicted/Math.max(1,used));const po=used?matches/used:0;return {matrix,used,total:truth.length,accuracy:po,kappa:used&&pe!==1?(po-pe)/(1-pe):0,metrics,macroF1:metrics.reduce((s,m)=>s+m.f1,0)/labels.length}}
function naiveBayes(train,labels=['正常','垃圾'],alpha=1){const counts={},classDocs={},totals={},vocab=new Set();for(const l of labels){counts[l]={};classDocs[l]=0;totals[l]=0}for(const row of train){if(!labels.includes(row.label))continue;classDocs[row.label]++;for(const w of tokens(row.text)){counts[row.label][w]=(counts[row.label][w]||0)+1;totals[row.label]++;vocab.add(w)}}const n=labels.reduce((s,l)=>s+classDocs[l],0);return {labels:[...labels],count:vocab.size,trainSize:n,predict(text){const words=tokens(text);const scores=labels.map(l=>({label:l,score:Math.log((classDocs[l]+alpha)/(n+alpha*labels.length))+words.reduce((a,w)=>a+Math.log(((counts[l][w]||0)+alpha)/(totals[l]+alpha*Math.max(1,vocab.size))),0)}));scores.sort((a,b)=>b.score-a.score);return {label:scores[0].label,scores,words,matched:words.filter(w=>vocab.has(w)).length}}}}
function splitDoc(text,size=65,overlap=12){const plain=String(text||'').replace(/\s+/g,' ').trim();size=Math.min(200,Math.max(30,Number(size)||65));overlap=Math.min(size-1,Math.max(0,Number(overlap)||0));const step=size-overlap;const out=[];for(let start=0;start<plain.length;start+=step){const piece=plain.slice(start,start+size);if(piece)out.push(piece);if(start+size>=plain.length)break}return out}
function buildIndex(docs=DOCS,size=65){const chunks=docs.flatMap(d=>splitDoc(d.text,size,Math.min(12,Math.floor(size/4))).map((text,i)=>({key:d.id+'-'+i,docId:d.id,title:d.title,text,words:tokens(d.title+' '+text)})));const freq={};for(const c of chunks)for(const w of new Set(c.words))freq[w]=(freq[w]||0)+1;return {chunks,freq,n:chunks.length}}
function searchIndex(index,query,k=3){const q=[...new Set(tokens(query))];const results=index.chunks.map(c=>{const counts={};for(const w of c.words)counts[w]=(counts[w]||0)+1;let score=0;for(const w of q){const tf=counts[w]||0;if(tf)score+=(1+Math.log(tf))*Math.log(1+(index.n-index.freq[w]+0.5)/(index.freq[w]+0.5))}return {...c,score}}).filter(c=>c.score>0).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));const unique=[],seen=new Set();for(const c of results){if(!seen.has(c.docId)){unique.push(c);seen.add(c.docId)}if(unique.length>=k)break}return unique}
function evaluateRetrieval(docs,size,k,queries=QUERY_SET){const idx=buildIndex(docs,size);let hit=0,mrr=0;const rows=queries.map(v=>{const results=searchIndex(idx,v.q,k);const rank=results.findIndex(r=>r.docId===v.want)+1;if(rank){hit++;mrr+=1/rank}return {...v,rank,found:results.map(r=>r.docId)}});return {hit,denom:queries.length,recall:hit/queries.length,mrr:mrr/queries.length,rows,index:idx}}
const BASE_CALENDAR=[{id:'existing-a',day:'周二',time:'10:00',title:'已安排：阅读研讨'},{id:'existing-b',day:'周四',time:'15:00',title:'已安排：工作坊'}];
const DAYS=['周一','周二','周三','周四','周五'];const HOURS=['10:00','15:00'];
function scheduleCheck(calendar,day,time,title,approved){if(!DAYS.includes(day)||!HOURS.includes(time))return {ok:false,why:'超出允许的工作日与时段'};if(!title||String(title).length>40)return {ok:false,why:'会议名称需要 1–40 字'};if(calendar.some(e=>e.day===day&&e.time===time))return {ok:false,why:'时间冲突：已有日历事件占用此时段'};if(!approved)return {ok:false,why:'缺少用户明确确认，禁止写入日历'};return {ok:true,why:'时间空闲，用户已授权，可写入本地沙箱日历'}}
return {LABELS,LABEL_ROWS,MAIL_TRAIN,MAIL_TEST,DOCS,QUERY_SET,BASE_CALENDAR,DAYS,HOURS,tokens,confusion,naiveBayes,splitDoc,buildIndex,searchIndex,evaluateRetrieval,scheduleCheck};
});
