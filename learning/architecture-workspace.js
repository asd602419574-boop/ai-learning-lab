/* Same-origin HTTP teaching client. No replay, DB emulation, tokens, or browser record writes. */
(() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const pretty = value => JSON.stringify(value, null, 2);
  const statusNames = {pending:'待审批',approved:'已批准',rejected:'已驳回',withdrawn:'已撤回'};
  let host, chapter = 1, view = 'reading', identifier = 0, identity = 'alice', generation = 0;
  let online = false, serviceInfo = null, application = null, evidence = null, last = null, notice = '', active = 0;
  let routeChanged = () => {}, requests = [], notes = '';
  const draft = {title:'共享投影设备',purpose:'虚构教学工作坊使用',amount:'2300.00',cost_center:'TRAINING-A',reason:'已核对教学材料与用途',expected_version:1};
  const http = {method:'POST',path:'/api/teaching/applications',body:pretty({title:'自主资源申请',purpose:'填写自己的虚构用途',amount_cents:230000,cost_center:'TRAINING'})};
  const data = () => window.ArchitectureContent;
  const href = (ch = chapter, targetView = view) => '#architecture?chapter=' + ch + (targetView === 'practice' ? '&view=practice' : '') + (identifier ? '&id=' + identifier : '') + '&user=' + encodeURIComponent(identity);
  const button = (action, label, main = false) => '<button type="button" class="btn ' + (main ? '' : 'btn-secondary') + '" data-arch-action="' + action + '">' + label + '</button>';
  const field = (name, label, value, type = 'text') => '<label class="arch-field">' + esc(label) + '<input data-arch-field="' + name + '" type="' + type + '" value="' + esc(value) + '"' + (type === 'number' ? ' min="0" step="' + (name === 'amount' ? '0.01' : '1') + '"' : ' maxlength="120"') + '></label>';

  function syncRoute() {
    routeChanged({id:identifier,user:identity});
    if (!host) return;
    host.querySelectorAll('[data-arch-link]').forEach(link => link.href = href(Number(link.dataset.archLink), link.dataset.archView || view));
  }
  function controlState() {
    if (!host) return;
    host.querySelectorAll('[data-arch-action]').forEach(control => {
      control.disabled = active > 0 || (!online && !['health','export'].includes(control.dataset.archAction));
    });
    host.querySelectorAll('[data-architecture-workspace] input,[data-architecture-workspace] textarea,[data-architecture-workspace] select').forEach(control => control.disabled = active > 0);
    const status = host.querySelector('[data-arch-service]');
    if (status) {
      status.dataset.archOnline = String(online);
      status.textContent = online ? '已连接真实本机教学服务 · SQLite · 当前新申请阈值 ' + (serviceInfo.threshold_cents / 100).toFixed(2) + ' 元 · 实例 ' + serviceInfo.instance_id.slice(0,8)
        : '教学API未连接。课程可阅读；请启动 teaching_server，并从其本地地址打开。普通静态服务不能执行审批，本页不会回放成功结果。';
    }
    const message = host.querySelector('[data-arch-notice]');
    if (message) message.textContent = active ? '正在等待真实HTTP响应…' : notice;
  }
  function resultPanels() {
    if (!host) return;
    const current = host.querySelector('[data-arch-current]');
    if (current) current.innerHTML = application ? '<h3>申请 #' + application.id + ' · ' + esc(statusNames[application.status] || application.status) + ' <code>' + esc(application.status) + '</code></h3><p>服务端岗位：<strong>' + esc(application.required_role) + '</strong> · 版本 ' + application.version + ' · 金额 ' + (application.amount_cents / 100).toFixed(2) + ' 元（' + application.amount_cents + ' 分）</p><pre>' + esc(pretty(application)) + '</pre>' : '<p>当前还没有成功查询的申请。身份切换或查询失败后，不显示旧成功结果。</p>';
    const response = host.querySelector('[data-arch-response]');
    if (response) response.innerHTML = last ? '<h3>' + (last.source === 'HTTP' ? '实际 HTTP ' + last.status : '未收到HTTP响应') + ' · ' + esc(last.method + ' ' + last.path) + '</h3><p>教学身份：' + esc(last.identity) + ' · ' + last.elapsed_ms + ' ms · ' + esc(last.at) + '</p><h4>本次请求正文</h4><pre>' + esc(pretty(last.request)) + '</pre><h4>实际响应</h4><pre>' + esc(pretty(last.response)) + '</pre>' : '<p>发送请求后显示实际HTTP状态与正文，不预填成功响应。</p>';
    const evidencePanel = host.querySelector('[data-arch-evidence]');
    if (evidencePanel) evidencePanel.innerHTML = evidence ? '<p>' + esc(evidence.isolation) + '。以下行来自本次HTTP请求的SQLite查询。</p>' + evidence.queries.map(query => '<details open><summary>' + esc(query.label) + ' · ' + query.rows.length + ' 行</summary><pre>' + esc(query.sql) + '\n参数：' + esc(pretty(query.parameters)) + '</pre>' + rowsTable(query.rows) + '</details>').join('') : '<p>请选择申请并点击“查询SQLite证据”；不会把当前表单当作数据库结果。</p>';
    const count = host.querySelector('[data-arch-log-count]');
    if (count) count.textContent = requests.length + ' 条本页真实请求记录（最多最近50条，刷新会清空）';
    const log = host.querySelector('[data-arch-log]');
    if (log) log.innerHTML = requests.slice().reverse().map(entry => '<details><summary>' + esc(entry.method + ' ' + entry.path) + ' · ' + (entry.status || '连接失败') + '</summary><p>身份 ' + esc(entry.identity) + ' · ' + esc(entry.at) + '</p><pre>' + esc(pretty(entry)) + '</pre></details>').join('');
    const idField = host.querySelector('[data-arch-field="id"]');
    if (idField && document.activeElement !== idField) idField.value = identifier || '';
    const version = host.querySelector('[data-arch-field="expected_version"]');
    if (version && document.activeElement !== version) version.value = draft.expected_version;
    controlState();
  }
  function rowsTable(rows) {
    if (!rows.length) return '<p>本次查询返回0行。</p>';
    const columns = Object.keys(rows[0]);
    return '<div class="arch-table-scroll" tabindex="0"><table><thead><tr>' + columns.map(c => '<th>' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(row => '<tr>' + columns.map(c => '<td>' + esc(row[c]) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  }
  function validPath(path) {
    const url = new URL(path, location.origin);
    return path.startsWith('/api/teaching/') && !path.includes('..') && url.origin === location.origin && url.pathname.startsWith('/api/teaching/');
  }
  async function send(method, path, body, options = {}) {
    if (!validPath(path)) { notice = '请求台只允许当前来源的/api/teaching/路径。'; controlState(); return null; }
    const epoch = generation, actor = identity, started = performance.now(), controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    active++; controlState();
    let entry;
    try {
      const headers = {'X-Lab-User':actor};
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      const response = await fetch(path, {method,headers,body:body === undefined ? undefined : JSON.stringify(body),cache:'no-store',credentials:'omit',signal:controller.signal});
      const text = await response.text();
      let value;
      try { value = JSON.parse(text); } catch { value = {error:{message:'收到非JSON响应；可能是静态预览或错误地址。'},body_preview:text.slice(0,1200)}; }
      entry = {source:'HTTP',method,path,identity:actor,request:body ?? null,response:value,status:response.status,request_id:response.headers.get('X-Request-ID') || value.request_id || null,elapsed_ms:Math.round(performance.now()-started),at:new Date().toISOString()};
      if (epoch === generation && actor === identity) {
        last = entry;
        if (path === '/api/teaching/health') {
          online = response.ok && value.service === 'approval-teaching' && value.database === 'SQLite';
          serviceInfo = online ? value : null;
        }
        if (response.ok && value.application) {
          application = value.application; identifier = application.id; draft.expected_version = application.version; evidence = null; syncRoute();
        } else if (response.ok && value.queries) evidence = value;
        else if (!response.ok && /\/applications\/\d+(?:\?|$)/.test(path) && method === 'GET') { application = null; evidence = null; }
        notice = response.ok ? '已收到真实HTTP ' + response.status + '；请对照响应与SQLite读回。' : 'HTTP ' + response.status + '：' + (value.error?.message || '请查看实际响应。');
      }
    } catch (error) {
      entry = {source:'network',method,path,identity:actor,request:body ?? null,response:{error:error.name === 'AbortError' ? '15秒未完成，实际结果未知；先查询申请，不要盲目重复提交。' : '连接失败：'+error.message},status:0,request_id:null,elapsed_ms:Math.round(performance.now()-started),at:new Date().toISOString()};
      if (epoch === generation) { last = entry; notice = entry.response.error; if (path.endsWith('/health')) online = false; }
    } finally {
      clearTimeout(timer); active--; if (entry) { requests.push(entry); if (requests.length > 50) requests.shift(); }
      if (epoch === generation) resultPanels(); else controlState();
    }
    return entry;
  }
  async function queryCurrent() {
    if (!Number.isSafeInteger(identifier) || identifier < 1) { notice = '请填写有效的申请号。'; controlState(); return; }
    const item = await send('GET','/api/teaching/applications/'+identifier);
    if (item?.status === 200) await send('GET','/api/teaching/applications/'+identifier+'/evidence');
  }
  function cents(text) {
    if (!/^\d{1,7}(?:\.\d{1,2})?$/.test(String(text))) throw Error('金额请使用元，最多两位小数；请求台则用整数分。');
    const [whole,fraction=''] = String(text).split('.');
    return Number(whole)*100+Number(fraction.padEnd(2,'0'));
  }
  function workbench() {
    return '<div class="arch-workbench" data-architecture-workspace><aside class="arch-mode"><strong>真实HTTP + SQLite；固定教学身份，不是生产登录</strong><p>只使用虚构数据。此服务仅本机运行；切换人物用于理解权限，不能证明真实身份。数据库申请与事件会保存，本页日志与笔记需另行导出。</p></aside><details class="arch-task"><summary>本主题实验与独立变式：' + esc(data().chapters[chapter-1].title) + '</summary>' + data().chapters[chapter-1].sections.at(-1).html + '</details><div class="arch-toolbar"><label>当前教学身份<select data-arch-identity>' + Object.entries(data().identities).map(([key,label]) => '<option value="'+key+'"'+(key===identity?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>'+button('health','检查教学服务')+'</div><p data-arch-notice role="status" aria-live="polite"></p><div class="arch-columns"><section class="arch-card"><h2>1. 提交自己的申请</h2><p>页面使用元输入，发送JSON时转换为整数分；申请人与审批岗位由后端决定。</p>'+field('title','资源标题',draft.title)+'<label class="arch-field">用途<textarea data-arch-field="purpose" rows="3" maxlength="2000">'+esc(draft.purpose)+'</textarea></label><div class="arch-form-grid">'+field('amount','金额（元）',draft.amount,'number')+field('cost_center','成本中心（可修改字段）',draft.cost_center)+'</div>'+button('submit','通过HTTP提交申请',true)+'</section><section class="arch-card"><h2>2. 查询与作出决定</h2><div class="arch-form-grid">'+field('id','申请号',identifier||'','number')+field('expected_version','操作预期版本',draft.expected_version,'number')+'</div><div class="arch-actions">'+button('query','重新HTTP查询')+button('evidence','查询SQLite证据')+'</div><label class="arch-field">操作原因<textarea data-arch-field="reason" rows="3" maxlength="2000">'+esc(draft.reason)+'</textarea></label><div class="arch-actions">'+button('approve','批准',true)+button('reject','驳回')+button('withdraw','申请人撤回')+'</div><p class="arch-note">非法操作也会实际发到服务端，便于观察403/409。切换身份后应重新查询；处理结果以响应及读回为准。</p></section></div><section class="arch-card"><h2>当前申请：服务端返回</h2><div data-arch-current></div><details><summary>查询申请列表 / 成本中心筛选</summary><div class="arch-actions"><label>成本中心（空为不筛选）<input data-arch-list-filter maxlength="40"></label>'+button('list','查询申请列表')+'</div><div data-arch-list></div></details></section><section class="arch-card"><h2>3. 可编辑HTTP请求台</h2><p>先预测，再编辑契约字段和金额；失败请求同样保留实际状态，不按填写字数判定掌握。</p><div class="arch-http-line"><label>方法<select data-arch-http-method><option'+(http.method==='GET'?' selected':'')+'>GET</option><option'+(http.method==='POST'?' selected':'')+'>POST</option></select></label><label>同源教学路径<input data-arch-http-path value="'+esc(http.path)+'"></label></div><label class="arch-field">JSON正文（GET忽略）<textarea rows="7" data-arch-http-body spellcheck="false">'+esc(http.body)+'</textarea></label>'+button('send-http','发送当前请求',true)+'<div class="arch-response" data-arch-response aria-live="polite"></div></section><section class="arch-card"><h2>4. SQLite参数化查询证据</h2><div data-arch-evidence></div></section><section class="arch-card"><h2>5. 解释与可导出的工程证据</h2><label class="arch-field">我的分析：上下文/模块、数据与状态、预期与实际、限制<textarea rows="5" data-arch-notes>'+esc(notes)+'</textarea></label><p>开放解释不做语义自动评分。成功执行、规则拒绝与专业知识掌握是不同结论。</p><p data-arch-log-count></p>'+button('export','导出本页HTTP证据与笔记')+'<details><summary>查看最近请求记录</summary><div data-arch-log></div></details></section></div>';
  }
  function paint() {
    const lesson = data().chapters[chapter-1];
    host.innerHTML = '<div class="architecture-course '+(view==='reading'?'architecture-reading':'architecture-practice')+'"><article class="system-paper arch-paper"><header><p class="system-kicker">连续架构课程 · 同一个企业审批案例</p><p class="arch-course-name">'+esc(data().title)+'</p><h1>第'+chapter+'章：'+esc(lesson.title)+'</h1><p class="system-lead">'+esc(lesson.objective)+'</p></header><nav class="system-view-tabs" aria-label="架构课程资料与实践"><a data-arch-link="'+chapter+'" data-arch-view="reading" href="'+href(chapter,'reading')+'"'+(view==='reading'?' aria-current="page"':'')+'>学习资料</a><a data-arch-link="'+chapter+'" data-arch-view="practice" href="'+href(chapter,'practice')+'"'+(view==='practice'?' aria-current="page"':'')+'>真实系统实验</a><a href="#process?chapter=6">回看V2.1流程方案</a></nav><p class="arch-service" data-arch-service role="status"></p>'+(view==='reading'?'<div class="system-reading" data-arch-reading>'+lesson.sections.map((s,i)=>'<section id="architecture-section-'+i+'"><h2>'+esc(s.title)+'</h2>'+s.html+'</section>').join('')+'</div><a class="btn" data-arch-link="'+chapter+'" data-arch-view="practice" href="'+href(chapter,'practice')+'">进入本主题真实实验 →</a><details class="system-references"><summary>依据、实现与进一步阅读</summary><ul>'+data().resources.map(r=>'<li><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(r.title)+'</a><p>'+esc(r.note)+'</p></li>').join('')+'</ul></details>':workbench())+'<nav class="system-footer" aria-label="相邻架构主题">'+(chapter>1?'<a data-arch-link="'+(chapter-1)+'" href="'+href(chapter-1)+'">← '+esc(data().chapters[chapter-2].title)+'</a>':'<a href="#process">回到流程深度课</a>')+(chapter<6?'<a data-arch-link="'+(chapter+1)+'" href="'+href(chapter+1)+'">'+esc(data().chapters[chapter].title)+' →</a>':'<a href="#architecture?chapter=6&view=practice">独立完成并导出工程证据 →</a>')+'</nav></article></div>';
    resultPanels();
  }
  async function click(event) {
    const control = event.target.closest('[data-arch-action]'); if (!control) return;
    const action = control.dataset.archAction;
    if (active && action !== 'export') return;
    try {
      if (action === 'health') await send('GET','/api/teaching/health');
      else if (action === 'submit') await send('POST','/api/teaching/applications',{title:draft.title,purpose:draft.purpose,amount_cents:cents(draft.amount),cost_center:draft.cost_center});
      else if (action === 'query') await queryCurrent();
      else if (action === 'evidence') {
        if (!identifier) throw Error('请先填写申请号。');
        await send('GET','/api/teaching/applications/'+identifier+'/evidence');
      } else if (['approve','reject','withdraw'].includes(action)) {
        if (!identifier) throw Error('请先提交或查询一张申请。');
        const body = {reason:draft.reason,expected_version:Number(draft.expected_version)};
        if (action !== 'withdraw') body.decision = action === 'approve' ? 'approved' : 'rejected';
        await send('POST','/api/teaching/applications/'+identifier+(action==='withdraw'?'/withdraw':'/decisions'),body);
      } else if (action === 'send-http') {
        const body = http.method === 'GET' ? undefined : JSON.parse(http.body);
        await send(http.method,http.path,body);
      } else if (action === 'list') {
        const filter = host.querySelector('[data-arch-list-filter]').value;
        const entry = await send('GET','/api/teaching/applications'+(filter?'?cost_center='+encodeURIComponent(filter):''));
        if (entry?.status === 200) host.querySelector('[data-arch-list]').innerHTML = rowsTable(entry.response.applications)+'<p>最多显示最近50张可读取申请；按表中id查询完整记录。</p>';
      } else if (action === 'export') {
        const artifact = {format:'ai-learning-http-evidence',version:1,exported_at:new Date().toISOString(),scope:'本页最近50次实际请求及笔记；不是数据库备份，不代表知识掌握',application_id:identifier,notes,requests};
        const url = URL.createObjectURL(new Blob([pretty(artifact)],{type:'application/json'})), link = document.createElement('a'); link.href=url;link.download='approval-http-evidence.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
      }
    } catch (error) { notice='未发送：'+error.message; controlState(); }
  }
  function input(event) {
    const el=event.target;
    if (el.dataset.archField) {
      if (el.dataset.archField==='id') { identifier=Number(el.value);application=null;evidence=null;syncRoute(); }
      else draft[el.dataset.archField]=el.value;
    } else if (el.hasAttribute('data-arch-http-body')) http.body=el.value;
    else if (el.hasAttribute('data-arch-http-path')) http.path=el.value;
    else if (el.hasAttribute('data-arch-notes')) notes=el.value;
  }
  function change(event) {
    const el=event.target;
    if (el.hasAttribute('data-arch-identity')) {
      identity=Object.hasOwn(data().identities,el.value)?el.value:'alice';application=null;evidence=null;last=null;notice='已切换教学人物，请重新HTTP查询；此操作不是登录认证。';syncRoute();resultPanels();
    } else if (el.hasAttribute('data-arch-http-method')) http.method=el.value;
  }
  function render(root,ch=1,targetView='reading',id=0,user='alice',onLocation=()=>{}) {
    host=root;generation++;chapter=Number.isInteger(Number(ch))&&Number(ch)>=1&&Number(ch)<=6?Number(ch):1;view=targetView==='practice'?'practice':'reading';identifier=Number.isSafeInteger(Number(id))&&Number(id)>0?Number(id):0;identity=Object.hasOwn(data().identities,user)?user:'alice';routeChanged=onLocation;application=null;evidence=null;last=null;notice='';
    host.oninput=input;host.onchange=change;host.onclick=click;paint();
    const epoch=generation;
    send('GET','/api/teaching/health').then(async result=>{if(epoch===generation&&result?.status===200&&online&&view==='practice'&&identifier)await queryCurrent();});
  }
  window.ArchitectureWorkspace={render,href};
})();
