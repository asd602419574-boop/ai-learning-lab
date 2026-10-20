/* Textbook v1: eight original lessons, isolated progress and genuinely computed micro labs. */
const Textbook = (() => {
  'use strict';
  const KEY = 'ai_lab_textbook_v1';
  const BASE = './content/';
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let manifest = null, active = null, articleHtml = '', articleCache = {}, loading = null, renderVersion = 0, step = 0, rate = 0.1, weight = 0, quizChoice = {}, quizChecked = {}, lastError = '';
  const docs = [
    { id: 'A', name: '开放时间', text: '图书馆周二到周日开放，时间是上午九点至下午五点；每周一闭馆。' },
    { id: 'B', name: '借阅政策', text: '每位读者一次最多借五册图书，普通图书借期为二十一天。' },
    { id: 'C', name: '续借规则', text: '在没有其他读者预约的情况下，普通图书最多可以续借一次，额外延长十四天。' },
    { id: 'D', name: '活动公告', text: '十一月八日下午两点举行科普讲座，地点是图书馆二楼多功能室。' }
  ];
  let retrievalQuery = '图书续借几天', retrievalTop = 2;
  function readState() { try { const s = JSON.parse(localStorage.getItem(KEY) || '{}'); return s && typeof s === 'object' && !Array.isArray(s) ? s : {} } catch { return {} } }
  let state = readState();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { lastError = '当前浏览器无法保存阅读进度，请检查隐私模式或存储空间。' } }
  function itemState(id) { return state[id] || { opened: false, completed: false, quiz: {} } }
  function markOpened(id) { if (!id) return; const item = itemState(id); if (!item.opened) { state[id] = { ...item, opened: true }; save() } }
  async function loadManifest() {
    if (manifest) return manifest;
    if (loading) return loading;
    loading = fetch(BASE + 'manifest.json', { cache: 'no-cache' }).then(r => {
      if (!r.ok) throw Error('教材目录无法加载（HTTP ' + r.status + '）');
      return r.json()
    }).then(d => {
      if (!d || !Array.isArray(d.lessons) || d.lessons.length !== 8) throw Error('教材目录格式异常');
      manifest = d; return d
    }).finally(() => loading = null);
    return loading
  }
  function navigate(id) {
    active = id; step = 0; weight = 0; quizChoice = {}; quizChecked = {};
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
      const sidebar = `<aside class="book-sidebar"><div class="book-sidebar-head"><strong>📚 AI 系统教材</strong><small>${finished} / 8 完成阅读</small></div><div class="book-progress"><span style="width:${finished * 12.5}%"></span></div><button type="button" class="book-nav ${active === null ? 'active' : ''}" data-book-open=""><span>⌂</span><div><strong>教材首页</strong><small>8 篇 · 原理与实践</small></div></button><div class="book-sidebar-list">${groups.map(g => `<div class="book-group">${escape(g)}</div>${manifest.lessons.filter(l => l.group === g).map((l) => `<button type="button" class="book-nav ${active === l.id ? 'active' : ''}" data-book-open="${escape(l.id)}"><span>${itemState(l.id).completed ? '✓' : manifest.lessons.indexOf(l) + 1}</span><div><strong>${escape(l.title)}</strong><small>${l.mins} 分钟 · ${itemState(l.id).completed ? '已完成阅读' : itemState(l.id).opened ? '继续阅读' : '未开始'}</small></div></button>`).join('')}`).join('')}</div></aside>`;
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

    return `<div class="book-reading-wrap"><div class="book-reading-main"><div class="book-breadcrumb"><button type="button" class="book-bc-link" data-book-open="">📚 系统教材</button><span class="book-bc-sep">/</span><span>${escape(lesson.group)}</span><span class="book-bc-sep">/</span><strong class="book-bc-current">${escape(lesson.title)}</strong></div><div class="book-meta"><span>${escape(lesson.group)}</span><span>建议 ${lesson.mins} 分钟</span><span>先修：${escape(lesson.prereq)}</span><span class="${item.completed ? 'book-meta-done' : ''}">${item.completed ? '✓ 已完成阅读' : '正在阅读'}</span></div><article class="book-article" aria-label="${escape(lesson.title)}">${processedHtml}</article>${lesson.lab ? `<section class="book-lab" id="bookLab"><h3>${lesson.lab === 'gradient' ? '🧮 梯度下降：实际计算参数更新' : '🔎 检索实验：真实计算匹配排序'}</h3><p>${lesson.lab === 'gradient' ? '下列数值每次点击都会重新按公式计算，不是固定的动画或模拟分数。' : '使用本地四条公开示例资料，修改查询和 Top-K，将实时重新计算中文词项匹配。非真实向量检索，也不调用在线 LLM。'}</p><div id="bookLabBody"></div></section>` : ''}<section class="book-checkpoint"><h3>本课理解检查</h3><p>每题回答后才揭示答案和理由。此处自测与“标记已阅读”分别记录；只看完文字不代表知识已经掌握。</p>${quiz}<div class="book-tools"><button type="button" class="book-btn" data-book-complete="${escape(lesson.id)}">${item.completed ? '撤销阅读完成标记' : '我已完成正文与课后任务'}</button><button type="button" class="book-btn secondary" data-book-reset-quiz>重新回答</button><span class="book-note">${lastError ? escape(lastError) : '进度仅保存在当前浏览器'}</span></div></section>${navFooter}</div>${tocHtml}</div>`;
  }
  function gradientView() { return `<div class="book-lab-form"><label for="bookRate">学习率</label><input type="range" min="0.01" max="0.55" step="0.01" id="bookRate" value="${rate.toFixed(2)}"><strong id="bookRateLabel">${rate.toFixed(2)}</strong><button type="button" class="book-btn" data-book-gradient-step>执行一次梯度更新</button><button type="button" class="book-btn secondary" data-book-gradient-reset>重置</button></div><div class="book-lab-output" id="bookGradientOutput"></div>` }
  function gradientStats() { const x = [1, 2, 3], y = [2, 4, 6], gradient = x.reduce((s, t, i) => s + 2 * (weight * t - y[i]) * t, 0) / 3; const loss = x.reduce((s, t, i) => s + (weight * t - y[i]) ** 2, 0) / 3; return { gradient, loss } }
  function showGradient() { const el = $('#bookGradientOutput'); if (!el) return; const { gradient, loss } = gradientStats(); el.textContent = `训练样本：(x,y)=(1,2),(2,4),(3,6)\n模型：预测值 = w × x；目标参数 w=2\n第 ${step} 次更新；当前 w = ${weight.toFixed(6)}\n当前平均平方误差 MSE = ${loss.toFixed(6)}\n当前梯度 dL/dw = ${gradient.toFixed(6)}\n下一次更新将执行：w ← w - ${rate.toFixed(2)} × (${gradient.toFixed(6)})\n说明：学习率过大可能引发震荡或发散。` }
  function tokens(s) { const txt = String(s).toLowerCase(); const cjk = (txt.match(/[\u3400-\u9fff]+/g) || []).flatMap(seg => seg.length < 2 ? [seg] : Array.from({ length: seg.length - 1 }, (_, i) => seg.slice(i, i + 2))); const en = txt.match(/[a-z0-9]+/g) || []; return [...cjk, ...en] }
  function retrieve(query, k) { const words = [...new Set(tokens(query))]; return docs.map(d => { const corpus = tokens(d.name + ' ' + d.text), count = {}; for (const w of corpus) count[w] = (count[w] || 0) + 1; const score = words.reduce((s, w) => s + Math.min(2, count[w] || 0), 0); return { ...d, score } }).filter(d => d.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, k) }
  function retrievalView() { return `<div class="book-lab-form"><label for="bookQuery">输入查询</label><input type="text" id="bookQuery" value="${escape(retrievalQuery)}" maxlength="80" style="flex:1;min-width:140px"><label for="bookTop">Top-K</label><input type="number" id="bookTop" min="1" max="4" step="1" value="${retrievalTop}" style="width:70px"><button type="button" class="book-btn" data-book-retrieve>重新检索</button></div><div id="bookRetrievalOutput" class="book-lab-output"></div>` }
  function showRetrieval() { const el = $('#bookRetrievalOutput'); if (!el) return; const hits = retrieve(retrievalQuery, retrievalTop); el.textContent = !hits.length ? `资料库没有足够的词项命中依据。请明确表示“未查到可靠资料”，不要编造答案。\n\n尝试：图书续借、周一开放、电影票价。` : `匹配依据（按示例中文双字词与英文词项计分）：\n` + hits.map((h, i) => `${i + 1}. [${h.id}] ${h.name} · 匹配分 ${h.score}\n${h.text}`).join('\n\n') + `\n\n注意：词项匹配不等于语义理解、事实核验或答案生成。` }
  function paintLab(lab) { const el = $('#bookLabBody'); if (!el) return; el.innerHTML = lab === 'gradient' ? gradientView() : retrievalView(); if (lab === 'gradient') showGradient(); else showRetrieval() }
  function show() { if (!manifest) render(); else render() }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-book-open],[data-book-complete],[data-book-choice],[data-book-check],[data-book-retry],[data-book-reset-quiz],[data-book-gradient-step],[data-book-gradient-reset],[data-book-retrieve]');
    if (!b || (!b.closest('#dynamicArea') && !b.closest('#mainSidebar')) || !$('#mainContent')) return;
    if (!$('#dynamicArea .book-shell') && !b.hasAttribute('data-book-retry')) return;
    if (b.hasAttribute('data-book-open')) { navigate(b.dataset.bookOpen || null); return; }
    if (b.hasAttribute('data-book-retry')) { manifest = null; render(); return; }
    if (b.hasAttribute('data-book-complete')) { const id = b.dataset.bookComplete, s = itemState(id); state[id] = { ...s, opened: true, completed: !s.completed }; save(); render(); return; }
    if (b.hasAttribute('data-book-choice')) { const [q, j] = b.dataset.bookChoice.split(':').map(Number); if (quizChecked[q]) return; quizChoice[q] = j; render(); return; }
    if (b.hasAttribute('data-book-check')) { const q = Number(b.dataset.bookCheck); if (quizChoice[q] === undefined || quizChecked[q]) return; quizChecked[q] = true; const id = active, item = itemState(id); const scores = { ...(item.quiz || {}), [q]: quizChoice[q] === manifest.lessons.find(l => l.id === active).quiz[q].answer }; state[id] = { ...item, quiz: scores }; save(); render(); return; }
    if (b.hasAttribute('data-book-reset-quiz')) { quizChoice = {}; quizChecked = {}; render(); return; }
    if (b.hasAttribute('data-book-gradient-reset')) { step = 0; weight = 0; render(); return; }
    if (b.hasAttribute('data-book-gradient-step')) { const d = gradientStats(); weight -= rate * d.gradient; step++; showGradient(); return; }
    if (b.hasAttribute('data-book-retrieve')) { retrievalQuery = $('#bookQuery')?.value.slice(0, 80) || ''; retrievalTop = Math.min(4, Math.max(1, parseInt($('#bookTop')?.value || '2', 10) || 2)); showRetrieval(); return; }
  });
  document.addEventListener('input', e => { if (e.target?.id === 'bookRate') { rate = Number(e.target.value); const label = $('#bookRateLabel'); if (label) label.textContent = rate.toFixed(2); showGradient() } });
  return {
    render: show,
    navigate,
    getActive: () => active,
    getManifest: () => manifest,
    getState: () => state,
    itemState,
    getProgress: () => manifest ? { completed: manifest.lessons.filter(l => itemState(l.id).completed).length, total: 8 } : null,
    _test: { gradientStats, tokens, retrieve }
  };
})();
