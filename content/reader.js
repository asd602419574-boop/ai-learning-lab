/* Textbook: authored lessons, isolated progress and genuinely computed local labs. */
const Textbook = (() => {
  'use strict';
  const KEY = 'ai_lab_textbook_v1';
  const recordStorage = typeof LearningStorage!=='undefined'?LearningStorage.storage:localStorage;
  const BASE = './content/';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let manifest = null, active = null, articleHtml = '', articleCache = {}, loading = null, renderVersion = 0, step = 0, rate = 0.1, weight = 0, quizChoice = {}, quizChecked = {}, lastError = '';
  let bias = 0, targetIntercept = 1, hidden = {x:2,w1:1,b1:0,w2:2,y:6};
  let attentionDraft = {q:'[1,0]',k:'[[1,0],[0,1],[-1,0]]',v:'[[10,0],[0,10],[-10,5]]'}, labEvidence = null;
  const docs = [
    { id: 'A', name: '开放时间', text: '图书馆周二到周日开放，时间是上午九点至下午五点；每周一闭馆。' },
    { id: 'B', name: '借阅政策', text: '每位读者一次最多借五册图书，普通图书借期为二十一天。' },
    { id: 'C', name: '续借规则', text: '在没有其他读者预约的情况下，普通图书最多可以续借一次，额外延长十四天。' },
    { id: 'D', name: '活动公告', text: '十一月八日下午两点举行科普讲座，地点是图书馆二楼多功能室。' }
  ];
  let retrievalQuery = '图书续借几天', retrievalTop = 2;
  function readState() { try { const s = JSON.parse(recordStorage.getItem(KEY) || '{}'); return s && typeof s === 'object' && !Array.isArray(s) ? s : {} } catch { return {} } }
  let state = readState();
  function save() { try { recordStorage.setItem(KEY, JSON.stringify(state)) } catch { lastError = '当前浏览器无法保存阅读进度，请检查保存提示或存储空间。' } }
  function itemState(id) { return state[id] || { opened: false, completed: false, quiz: {} } }
  function markOpened(id) { if (!id) return; const item = itemState(id); if (!item.opened) { state[id] = { ...item, opened: true }; save() } }
  async function loadManifest() {
    if (manifest) return manifest;
    if (loading) return loading;
    loading = fetch(BASE + 'manifest.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw Error('教材目录无法加载（HTTP ' + r.status + '）');
      return r.json()
    }).then(d => {
      if (!d || !Array.isArray(d.lessons) || d.lessons.length < 8 || new Set(d.lessons.map(l => l.id)).size !== d.lessons.length) throw Error('教材目录格式异常');
      manifest = d; return d
    }).finally(() => loading = null);
    return loading
  }
  function navigate(id) {
    active = id; step = 0; weight = 0; bias = 0; labEvidence = null; quizChoice = {}; quizChecked = {};
    const area = $('#dynamicArea');
    if (area) area.innerHTML = '<div class="book-empty">正在加载教材…</div>';
    markOpened(id);
    if (typeof updateHashRoute === 'function') updateHashRoute();
    if (typeof updateMainSidebar === 'function') updateMainSidebar();
    return render();
  }
  async function render() {
    const area = $('#dynamicArea');
    if (!area || ui.tab !== 'textbook') return;
    const renderToken = ++renderVersion;
    try {
      await loadManifest();
      if (renderToken !== renderVersion || ui.tab !== 'textbook') return;
      if (active && !manifest.lessons.some(x => x.id === active)) active = null;
      let lesson = manifest.lessons.find(x => x.id === active);
      if (lesson) {
        if (!Object.prototype.hasOwnProperty.call(articleCache, lesson.id)) {
          const response = await fetch('./' + lesson.file, { cache: 'no-cache' });
          if (!response.ok) throw Error(`《${lesson.title}》暂时无法读取`);
          articleCache[lesson.id] = await response.text();
        }
        articleHtml = articleCache[lesson.id];
        if (renderToken !== renderVersion || ui.tab !== 'textbook') return;
      }
      const finished = manifest.lessons.filter(l => itemState(l.id).completed).length;
      const groups = [...new Set(manifest.lessons.map(l => l.group))];
      const sidebar = `<aside class="book-sidebar"><div class="book-sidebar-head"><strong>📚 AI 系统教材</strong><small>${finished} / ${manifest.lessons.length} 完成阅读</small></div><div class="book-progress"><span style="width:${finished / manifest.lessons.length * 100}%"></span></div><button type="button" class="book-nav ${active === null ? 'active' : ''}" data-book-open=""><span>⌂</span><div><strong>教材首页</strong><small>${manifest.lessons.length} 篇 · 原理与实践</small></div></button><div class="book-sidebar-list">${groups.map(g => `<div class="book-group">${escape(g)}</div>${manifest.lessons.filter(l => l.group === g).map((l) => `<button type="button" class="book-nav ${active === l.id ? 'active' : ''}" data-book-open="${escape(l.id)}"><span>${itemState(l.id).completed ? '✓' : manifest.lessons.indexOf(l) + 1}</span><div><strong>${escape(l.title)}</strong><small>${l.mins} 分钟 · ${itemState(l.id).completed ? '已完成阅读' : itemState(l.id).opened ? '继续阅读' : '未开始'}</small></div></button>`).join('')}`).join('')}</div></aside>`;
      const inner = lesson ? lessonView(lesson) : libraryView();
      area.innerHTML = `<div class="book-shell"><div class="book-desktop-catalog-slot">${sidebar}</div><div class="book-lesson-body">${inner}<div class="book-foot">本教材为原创教学文本。外部资源仅作延伸阅读；实验在本机浏览器执行，不会上传学习数据。完成阅读不等于知识已经掌握。</div></div></div>`;
      if (lesson && lesson.lab) paintLab(lesson.lab);
      if (typeof updateMainSidebar === 'function') updateMainSidebar();
    } catch (e) {
      if (renderToken === renderVersion && ui.tab === 'textbook' && area) area.innerHTML = `<div class="book-empty"><strong>教材加载失败</strong><p>${escape(e.message)}</p><button type="button" class="book-btn" data-book-retry>重新尝试</button></div>`;
    }
  }
  function libraryView() {
    return `<div class="book-intro"><div class="book-overline">TEXTBOOK · 系统性知识阅读</div><h2>从概念、推导到真实案例，建立可以迁移的 AI 知识体系。</h2><p>从基础理论走向 RAG、Agent 与数据工程。每篇教材独立保存为 Markdown；你可以阅读、手算、自测，并对照资料重复实验。请按顺序学习，也可以跳转到需要补足的章节。</p></div><div class="book-library-grid">${manifest.lessons.map((l, i) => `<button class="book-library-card" type="button" data-book-open="${escape(l.id)}"><span class="book-overline">LESSON ${String(i + 1).padStart(2, '0')} · ${escape(l.group)}</span><strong>${escape(l.title)}</strong><p>约 ${l.mins} 分钟 · ${l.chars} 字符教材 · ${l.quiz.length} 道即时理解检查${l.lab ? ' · 可运行实验' : ''}</p><small class="book-skip">${itemState(l.id).completed ? '✓ 已阅读' : '开始阅读'} →</small></button>`).join('')}</div><div class="book-notice">学习建议：阅读正文 → 手算或动手复现例子 → 作答自测 → 完成课后任务。文字篇幅不是掌握程度，只有能够解释原因、重现结果和定位失败才算真正理解。</div>`;
  }
  const labTitles = {gradient:'🧮 双参数与链式法则：真实计算', attention:'🧮 向量注意力：真实计算', retrieval:'🔎 检索实验：真实计算匹配排序'};
  const labNotes = {gradient:'修改目标截距、参数和学习率；观察同步更新与隐藏层梯度。实验参数只在本页会话内保留，可导出本次计算。', attention:'输入JSON向量/矩阵，核对缩放得分、权重与上下文向量；这里只计算一个查询位置、一个头，不是完整语言模型。参数只在本页会话内保留，可导出本次计算。', retrieval:'本地四条短资料演示词项匹配；进一步的长文、切块与证据缺失实验在“项目实践 → RAG”中进行。没有在线LLM。'};
  function lessonView(lesson) {
    const item = itemState(lesson.id);
    const currentIndex = manifest.lessons.findIndex(l => l.id === lesson.id);
    const prevLesson = currentIndex > 0 ? manifest.lessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < manifest.lessons.length - 1 ? manifest.lessons[currentIndex + 1] : null;

    let hIdx = 0;
    const headings = [];
    const processedHtml = articleHtml.replace(/<h([23])([^>]*)>(.*?)<\/h\1>/gi, (m, level, attrs, text) => {
      hIdx++;
      const idMatch = attrs.match(/id=["']([^"']+)["']/i);
      const id = idMatch ? idMatch[1] : 'heading-' + hIdx;
      const cleanText = text.replace(/<[^>]+>/g, '').trim();
      headings.push({ level, id, text: cleanText });
      return idMatch ? m : `<h${level}${attrs} id="${id}">${text}</h${level}>`;
    });

    const tocHtml = headings.length ? `<aside class="book-toc" aria-label="本课大纲"><div class="book-toc-title">本课大纲</div><nav class="book-toc-list">${headings.map(h => `<a href="#${escape(h.id)}" class="book-toc-link level-${h.level}">${escape(h.text)}</a>`).join('')}</nav></aside>` : '';

    const quiz = lesson.quiz.map((q, qi) => {
      const selection = quizChoice[qi], check = quizChecked[qi];
      return `<div class="book-quiz-item"><strong>${qi + 1}. ${escape(q.q)}</strong>${q.options.map((option, j) => {
        const selected = selection === j, cls = check && j === q.answer ? 'correct' : check && selected && j !== q.answer ? 'wrong' : selected ? 'selected' : '';
        return `<button class="book-answer ${cls}" data-book-choice="${qi}:${j}" ${check ? 'disabled' : ''}>${String.fromCharCode(65 + j)} · ${escape(option)}</button>`;
      }).join('')}${check ? `<div class="book-explain"><strong>${selection === q.answer ? '✓ 回答正确' : '✕ 回答不正确'}</strong> · ${escape(q.why)}</div>` : `<button type="button" class="book-btn secondary" data-book-check="${qi}" ${selection === undefined ? 'disabled' : ''}>核对答案</button>`}</div>`;
    }).join('');

    const navFooter = `<div class="book-nav-footer">${prevLesson ? `<button type="button" class="book-nav-btn prev" data-book-open="${escape(prevLesson.id)}"><span class="book-nav-dir">← 上一课</span><strong>${escape(prevLesson.title)}</strong></button>` : '<div class="book-nav-placeholder"></div>'}${nextLesson ? `<button type="button" class="book-nav-btn next" data-book-open="${escape(nextLesson.id)}"><span class="book-nav-dir">下一课 →</span><strong>${escape(nextLesson.title)}</strong></button>` : '<div class="book-nav-placeholder"></div>'}</div>`;

    return `<div class="book-reading-wrap"><div class="book-reading-main"><div class="book-breadcrumb"><button type="button" class="book-bc-link" data-book-open="">📚 系统教材</button><span class="book-bc-sep">/</span><span>${escape(lesson.group)}</span><span class="book-bc-sep">/</span><strong class="book-bc-current">${escape(lesson.title)}</strong></div><div class="book-meta"><span>${escape(lesson.group)}</span><span>建议 ${lesson.mins} 分钟</span><span>先修：${escape(lesson.prereq)}</span><span class="${item.completed ? 'book-meta-done' : ''}">${item.completed ? '✓ 已完成阅读' : '正在阅读'}</span></div><article class="book-article" aria-label="${escape(lesson.title)}">${processedHtml}</article>${lesson.lab ? `<section class="book-lab" id="bookLab"><h3>${labTitles[lesson.lab]}</h3><p>${labNotes[lesson.lab]}</p><div id="bookLabBody"></div></section>` : ''}<section class="book-checkpoint"><h3>本课理解检查</h3><p>每题回答后才揭示答案和理由。${lesson.quizVersion ? `本课检查版本 ${escape(lesson.quizVersion)}；当前已核对 ${Object.keys(item.checks?.[lesson.quizVersion] || {}).length}/${lesson.quiz.length} 题。旧版作答保留，不自动算作新版结果。` : ""} 此处自测与阅读分别记录；规则通过和自评均不代表专业知识掌握。</p>${quiz}<div class="book-tools"><button type="button" class="book-btn" data-book-complete="${escape(lesson.id)}">${item.completed ? '撤销阅读完成标记' : '我已完成正文与课后任务'}</button><button type="button" class="book-btn secondary" data-book-reset-quiz>重新回答</button><span class="book-note">${lastError ? escape(lastError) : '进度仅保存在当前浏览器'}</span></div></section>${navFooter}</div>${tocHtml}</div>`;
  }
  function affineStats(w,b,intercept=1) {
    const x=[1,2,3], errors=x.map(t=>w*t+b-(2*t+intercept));
    return {loss:errors.reduce((n,e)=>n+e*e,0)/3,dw:2*errors.reduce((n,e,i)=>n+e*x[i],0)/3,db:2*errors.reduce((n,e)=>n+e,0)/3};
  }
  function hiddenStats(x,w1,b1,w2,y) {
    const z=w1*x+b1,a=Math.max(0,z),prediction=w2*a,g=2*(prediction-y),dz=g*w2*(z>0?1:0);
    return {z,a,prediction,loss:(prediction-y)**2,dy:g,da:g*w2,dz,dw1:dz*x,db1:dz,dw2:g*a};
  }
  function attentionStats(q,k,v) {
    const vector=a=>Array.isArray(a)&&a.length>0&&a.length<=16&&a.every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e6);
    if(!vector(q)||!Array.isArray(k)||!Array.isArray(v)||!k.length||k.length>16||!k.every(vector)||!v.every(vector))throw Error('请使用1—16维、绝对值不超过1000000的有限数值JSON数组。');
    if(v.length!==k.length||k.some(row=>row.length!==q.length)||v.some(row=>row.length!==v[0].length))throw Error('维度不匹配：K每行须与q同维，K与V行数相同，V每行等长。');
    const scores=k.map(row=>row.reduce((sum,x,i)=>sum+x*q[i],0)/Math.sqrt(q.length));
    const exps=scores.map(x=>Math.exp(x-Math.max(...scores))),total=exps.reduce((sum,x)=>sum+x,0),weights=exps.map(x=>x/total);
    const output=v[0].map((_,j)=>v.reduce((sum,row,i)=>sum+weights[i]*row[j],0));
    return {scores,weights,output,shape:`q:1×${q.length}，K:${k.length}×${q.length}，V:${v.length}×${v[0].length}，输出:1×${v[0].length}`};
  }
  function gradientView() {
    return `<p>先用正文的y=2x+1做示范，再改截距为-1独立核对。每次点击使用更新前的两项梯度。</p><div class="book-lab-form">${[['bookWeight','当前w',weight],['bookBias','当前b',bias],['bookIntercept','目标截距',targetIntercept]].map(([id,label,value])=>`<label>${label}<input type="number" id="${id}" value="${value}" step="0.1" min="${id==='bookIntercept'?-100:-1e8}" max="${id==='bookIntercept'?100:1e8}"></label>`).join('')}<label for="bookRate">学习率</label><input type="range" min="0.01" max="0.55" step="0.01" id="bookRate" value="${rate.toFixed(2)}"><strong id="bookRateLabel">${rate.toFixed(2)}</strong><button type="button" class="book-btn" data-book-gradient-step>执行一次梯度更新</button><button type="button" class="book-btn secondary" data-book-gradient-reset>重置</button></div><div class="book-lab-output" id="bookGradientOutput" aria-live="polite"></div><h4>隐藏神经元：沿计算图逐步核查</h4><p>x → z=w₁x+b₁ → a=ReLU(z) → ŷ=w₂a → L=(ŷ-y)²。改w₁为-1，解释梯度为何变为0；z=0的导数约定取0。</p><div class="book-lab-form">${Object.entries(hidden).map(([key,value])=>`<label>${key}<input type="number" data-book-hidden="${key}" value="${value}" step="0.1" min="-100" max="100"></label>`).join('')}</div><div class="book-lab-output" id="bookHiddenOutput" aria-live="polite"></div><button type="button" class="book-btn secondary" data-book-lab-export>导出当前计算 JSON</button>`;
  }
  // Preserve the original one-parameter calculation for existing callers.
  function gradientStats() { const d=affineStats(weight,0,0);return {gradient:d.dw,loss:d.loss} }
  function showGradient() {
    const el=$('#bookGradientOutput');if(!el)return;
    if([...document.querySelectorAll('#bookLabBody input[type=number]')].some(t=>!t.value.trim()||!Number.isFinite(Number(t.value))||Number(t.value)<Number(t.min)||Number(t.value)>Number(t.max))){el.textContent='请输入完整的有限数值，并遵守各字段的上下限，再重新计算。';labEvidence=null;return;}
    const d=affineStats(weight,bias,targetIntercept),h=hiddenStats(hidden.x,hidden.w1,hidden.b1,hidden.w2,hidden.y);
    el.textContent=`样本：x=[1,2,3]，y=2x+${targetIntercept}；模型ŷ=wx+b\n第${step}次更新：w=${weight.toFixed(6)}，b=${bias.toFixed(6)}\nMSE=${d.loss.toFixed(6)}；dw=${d.dw.toFixed(6)}；db=${d.db.toFixed(6)}\n下一步同步更新：w←w-ηdw，b←b-ηdb；η=${rate}。\n数值验证不判断是否掌握；大步长可能导致发散。`;
    $('#bookHiddenOutput').textContent=`前向：z=${h.z} → a=${h.a} → ŷ=${h.prediction} → L=${h.loss}\n反向：dL/dŷ=${h.dy} → dL/da=${h.da} → dL/dz=${h.dz}\n参数梯度：dw₁=${h.dw1}，db₁=${h.db1}，dw₂=${h.dw2}`;
    labEvidence={lab:'gradient',parameters:{weight,bias,targetIntercept,rate,step,hidden:{...hidden}},affine:d,hidden:h};
  }
  function attentionView() {
    return `<p>先复现正文三行Key，再独立改为两行Key与Value验证变式。每行Value是向量，输出维度等于Value列数。</p><div class="book-matrix-fields">${[['q','Query向量 q'],['k','Key矩阵 K'],['v','Value矩阵 V']].map(([key,label])=>`<label>${label}<textarea data-book-matrix="${key}" rows="2" maxlength="5000" spellcheck="false">${escape(attentionDraft[key])}</textarea></label>`).join('')}</div><button type="button" class="book-btn" data-book-attention>计算注意力</button><div class="book-lab-output" id="bookAttentionOutput" aria-live="polite"></div><button type="button" class="book-btn secondary" data-book-lab-export>导出本次计算 JSON</button>`;
  }
  function showAttention() {
    const el=$('#bookAttentionOutput');if(!el)return;
    try {
      const q=JSON.parse(attentionDraft.q),k=JSON.parse(attentionDraft.k),v=JSON.parse(attentionDraft.v),result=attentionStats(q,k,v);
      const nums=a=>a.map(x=>Number(x.toFixed(6))).join(', ');
      el.textContent=`${result.shape}\n缩放得分：[${nums(result.scores)}]\nsoftmax权重：[${nums(result.weights)}]\n上下文向量：[${nums(result.output)}]\n计算检查不是语义评分，也不是完整LLM推理。`;
      labEvidence={lab:'attention',parameters:{q,k,v},result};
    }catch(e){el.textContent='未计算：'+e.message;labEvidence=null;}
  }
  function tokens(s) { const txt = String(s).toLowerCase(); const cjk = (txt.match(/[\u3400-\u9fff]+/g) || []).flatMap(seg => seg.length < 2 ? [seg] : Array.from({ length: seg.length - 1 }, (_, i) => seg.slice(i, i + 2))); const en = txt.match(/[a-z0-9]+/g) || []; return [...cjk, ...en] }
  function retrieve(query, k) { const words = [...new Set(tokens(query))]; return docs.map(d => { const corpus = tokens(d.name + ' ' + d.text), count = {}; for (const w of corpus) count[w] = (count[w] || 0) + 1; const score = words.reduce((s, w) => s + Math.min(2, count[w] || 0), 0); return { ...d, score } }).filter(d => d.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, k) }
  function retrievalView() { return `<div class="book-lab-form"><label for="bookQuery">输入查询</label><input type="text" id="bookQuery" value="${escape(retrievalQuery)}" maxlength="80" style="flex:1;min-width:140px"><label for="bookTop">Top-K</label><input type="number" id="bookTop" min="1" max="4" step="1" value="${retrievalTop}" style="width:70px"><button type="button" class="book-btn" data-book-retrieve>重新检索</button></div><div id="bookRetrievalOutput" class="book-lab-output"></div>` }
  function showRetrieval() { const el = $('#bookRetrievalOutput'); if (!el) return; const hits = retrieve(retrievalQuery, retrievalTop); el.textContent = !hits.length ? `资料库没有足够的词项命中依据。请明确表示“未查到可靠资料”，不要编造答案。\n\n尝试：图书续借、周一开放、电影票价。` : `匹配依据（按中文字符二元组与英文词项计分）：\n` + hits.map((h, i) => `${i + 1}. [${h.id}] ${h.name} · 匹配分 ${h.score}\n${h.text}`).join('\n\n') + `\n\n注意：词项匹配不等于语义理解、事实核验或答案生成。` }
  function paintLab(lab) { const el = $('#bookLabBody'); if (!el) return; el.innerHTML = lab === 'gradient' ? gradientView() : lab === 'attention' ? attentionView() : retrievalView(); if (lab === 'gradient') showGradient(); else if(lab === 'attention') showAttention(); else showRetrieval() }
  function show() { if (!manifest) render(); else render() }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-book-open],[data-book-complete],[data-book-choice],[data-book-check],[data-book-retry],[data-book-reset-quiz],[data-book-gradient-step],[data-book-gradient-reset],[data-book-retrieve],[data-book-attention],[data-book-lab-export]');
    if (!b || (!b.closest('#dynamicArea') && !b.closest('#mainSidebar')) || !$('#mainContent')) return;
    if (!$('#dynamicArea .book-shell') && !b.hasAttribute('data-book-retry')) return;
    if (b.hasAttribute('data-book-open')) { navigate(b.dataset.bookOpen || null); return; }
    if (b.hasAttribute('data-book-retry')) { manifest = null; render(); return; }
    if (b.hasAttribute('data-book-complete')) { const id = b.dataset.bookComplete, s = itemState(id); state[id] = { ...s, opened: true, completed: !s.completed }; save(); render(); return; }
    if (b.hasAttribute('data-book-choice')) { const [q, j] = b.dataset.bookChoice.split(':').map(Number); if (quizChecked[q]) return; quizChoice[q] = j; render(); return; }
    if (b.hasAttribute('data-book-check')) { const q = Number(b.dataset.bookCheck); if (quizChoice[q] === undefined || quizChecked[q]) return; quizChecked[q] = true; const id = active, item = itemState(id); const scores = { ...(item.quiz || {}), [q]: quizChoice[q] === manifest.lessons.find(l => l.id === active).quiz[q].answer }; const lesson=manifest.lessons.find(l=>l.id===active); state[id] = lesson.quizVersion ? { ...item, checks: {...item.checks,[lesson.quizVersion]:{...item.checks?.[lesson.quizVersion],[q]:quizChoice[q]===lesson.quiz[q].answer}} } : { ...item, quiz: scores }; save(); render(); return; }
    if (b.hasAttribute('data-book-reset-quiz')) { quizChoice = {}; quizChecked = {}; render(); return; }
    if (b.hasAttribute('data-book-gradient-reset')) { step = 0; weight = 0; bias = 0; render(); return; }
    if (b.hasAttribute('data-book-gradient-step')) { showGradient(); if(!labEvidence)return; const d = affineStats(weight,bias,targetIntercept); const nw=weight-rate*d.dw,nb=bias-rate*d.db; if(!Number.isFinite(nw)||!Number.isFinite(nb)||Math.abs(nw)>1e8||Math.abs(nb)>1e8){labEvidence=null;lastError='下一步超出教学数值范围，请重置或降低学习率。'; $('#bookGradientOutput').textContent=lastError;return;} weight=nw;bias=nb;step++;$('#bookWeight').value=weight;$('#bookBias').value=bias; showGradient(); return; }
    if (b.hasAttribute('data-book-attention')) { showAttention(); return; }
    if (b.hasAttribute('data-book-lab-export')) {
      if(!labEvidence)return;
      const blob=new Blob([JSON.stringify({created:new Date().toISOString(),scope:'本机固定数值计算，不证明专业掌握',...labEvidence},null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ai-'+labEvidence.lab+'-calculation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if (b.hasAttribute('data-book-retrieve')) { retrievalQuery = $('#bookQuery')?.value.slice(0, 80) || ''; retrievalTop = Math.min(4, Math.max(1, parseInt($('#bookTop')?.value || '2', 10) || 2)); showRetrieval(); return; }
  });
  document.addEventListener('input', e => {
    const t=e.target;
    if(t?.dataset.bookMatrix){attentionDraft[t.dataset.bookMatrix]=t.value;labEvidence=null;const out=$('#bookAttentionOutput');if(out)out.textContent='输入已修改，请重新计算；先预测权重与输出会怎样变化。';return;}
    if(t?.matches('[data-book-hidden],#bookWeight,#bookBias,#bookIntercept,#bookRate')) {
      if(t.value.trim()===''||!Number.isFinite(Number(t.value))||Number(t.value)<Number(t.min)||Number(t.value)>Number(t.max)){$('#bookGradientOutput').textContent='请输入各字段允许范围内的有限数值。';labEvidence=null;return;}
      const n=Number(t.value);
      if(t.dataset.bookHidden)hidden[t.dataset.bookHidden]=n;
      else if(t.id==='bookWeight')weight=n;else if(t.id==='bookBias')bias=n;else if(t.id==='bookIntercept'){targetIntercept=n;step=0;}else rate=n;
      const label=$('#bookRateLabel');if(label)label.textContent=rate.toFixed(2);showGradient();
    }
  });
  return {
    render: show,
    navigate,
    getActive: () => active,
    getManifest: () => manifest,
    getState: () => state,
    itemState,
    getProgress: () => manifest ? { completed: manifest.lessons.filter(l => itemState(l.id).completed).length, total: manifest.lessons.length } : null,
    _test: { gradientStats, affineStats, hiddenStats, attentionStats, tokens, retrieve }
  };
})();
