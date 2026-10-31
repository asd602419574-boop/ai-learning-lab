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
  let attentionDraft = {q:'[1,0]',k:'[[1,0],[0,1],[-1,0]]',v:'[[10,0],[0,10],[-10,5]]'}, labEvidence = null, attentionPreset = 'classic';
  let tokenizerText = 'Transformer 架构是现代 LLM 的基石。OpenAI 于 2026 年发布新型号，def eval(): return True 🚀', tokenizerPreset = 'mixed';
  let agentPreset = 'weather', agentStep = 0, agentMockObs = '';
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
  
  const labTitles = {
    gradient: '🧮 双参数与链式法则：真实计算',
    attention: '🧮 向量注意力：真实计算与热力图显微镜',
    tokenizer: '🔬 字符串切分示意（非模型 Tokenizer）',
    retrieval: '🔎 RAG 语义分块与相似度检索匹配',
    agent: '🤖 ReAct 流程示例回放（无工具执行）'
  };
  const labNotes = {
    gradient: '修改目标截距、参数和学习率；观察同步更新与隐藏层梯度。实验参数只在本页会话内保留，可导出本次计算。',
    attention: '输入向量/矩阵或选择经典语境预设，直观观察点积得分、Softmax 归一化注意力权重热力图与最终上下文向量。',
    tokenizer: '用简单正则观察字符、单词和空白片段。不是模型词表，不生成 Token ID，不用于计费或上下文估算。',
    retrieval: '本地四条短资料演示词项匹配；进一步的长文、切块与证据缺失实验在“项目实践 → RAG”中进行。没有在线LLM。',
    agent: '逐步阅读预写的 Thought、Action、Observation 与结论示例。没有模型、天气查询、物流或催单接口执行。'
  };
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
  const ATTN_PRESETS = {
    classic: { name: '教材示例 (经典向量)', q: '[1,0]', k: '[[1,0],[0,1],[-1,0]]', v: '[[10,0],[0,10],[-10,5]]', desc: 'q 与 K₁ 方向完全重合，K₁ 获得最高注意力' },
    pronoun: { name: '代词消歧 (“它” ➔ “树叶”)', q: '[0.9,0.3]', k: '[[0.85,0.35],[0.1,0.95],[-0.8,0.2]]', v: '[[12,4],[2,15],[-6,6]]', desc: '语境中“它”高概率指向先行词“树叶”而非“水面”' },
    uniform: { name: '均等分散加权', q: '[1,1]', k: '[[1,1],[1,1],[1,1]]', v: '[[5,10],[10,5],[5,5]]', desc: 'Query 与全部 Key 点积完全一致，注意力平均分配' }
  };

  function attentionView() {
    return `
      <div class="book-matrix-presets">
        ${Object.entries(ATTN_PRESETS).map(([k, v]) => `
          <button type="button" class="book-tag-btn ${attentionPreset === k ? 'active' : ''}" data-book-attn-preset="${k}">${escape(v.name)}</button>
        `).join('')}
      </div>
      <p style="margin:12px 0 8px;font-size:13.5px;color:var(--muted,#64748b);">可直接选择上方预设，或在下方手动修改 JSON 向量。输出上下文向量维度严格等于 Value 列数。</p>
      <div class="book-matrix-fields">
        ${[['q','Query向量 q'],['k','Key矩阵 K'],['v','Value矩阵 V']].map(([key,label])=>`<label>${label}<textarea data-book-matrix="${key}" rows="2" maxlength="5000" spellcheck="false">${escape(attentionDraft[key])}</textarea></label>`).join('')}
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:14px 0;">
        <button type="button" class="book-btn" data-book-attention>计算注意力与热力图</button>
        <button type="button" class="book-btn secondary" data-book-lab-export>导出本次计算 JSON</button>
      </div>
      <div class="book-lab-output" id="bookAttentionOutput" aria-live="polite"></div>
      <div id="bookAttentionVisual"></div>
    `;
  }

  function showAttention() {
    const el=$('#bookAttentionOutput');if(!el)return;
    try {
      const q=JSON.parse(attentionDraft.q),k=JSON.parse(attentionDraft.k),v=JSON.parse(attentionDraft.v),result=attentionStats(q,k,v);
      const nums=a=>a.map(x=>Number(x.toFixed(6))).join(', ');
      el.textContent=`${result.shape}\n缩放得分：[${nums(result.scores)}]\nsoftmax权重：[${nums(result.weights)}]\n上下文向量：[${nums(result.output)}]\n计算检查不是语义评分，也不是完整LLM推理。`;
      labEvidence={lab:'attention',parameters:{q,k,v},result};

      let visualEl = $('#bookAttentionVisual');
      if (!visualEl) {
        visualEl = document.createElement('div');
        visualEl.id = 'bookAttentionVisual';
        el.parentNode.insertBefore(visualEl, el.nextSibling);
      }

      const rowsHtml = k.map((row, i) => {
        const score = result.scores[i];
        const weight = result.weights[i];
        const pct = (weight * 100).toFixed(1);
        const intensity = Math.min(0.85, Math.max(0.12, weight));
        const bg = `rgba(79, 70, 229, ${intensity})`;
        const color = weight > 0.4 ? '#ffffff' : '#0f172a';
        return `
          <div class="book-attn-row">
            <div class="book-attn-row-key"><strong>K<sub>${i+1}</sub></strong> [${row.join(', ')}]</div>
            <div class="book-attn-row-score">点积得分: ${score.toFixed(3)}</div>
            <div class="book-attn-row-bar-wrap">
              <div class="book-attn-row-bar" style="width:${pct}%;background:${bg};color:${color};">
                ${pct}%
              </div>
            </div>
            <div class="book-attn-row-val">V<sub>${i+1}</sub> 加权贡献: [${v[i].map(x => (x * weight).toFixed(2)).join(', ')}]</div>
          </div>
        `;
      }).join('');

      visualEl.innerHTML = `
        <div class="book-attn-visual-box">
          <div class="book-attn-visual-head">
            <span>📊 交互式注意力权重热力图 (Attention Heatmap)</span>
            <small>深色代表 Softmax 高权重集中区域</small>
          </div>
          <div class="book-attn-rows">${rowsHtml}</div>
          <div class="book-attn-context-box">
            <span>最终汇总的上下文向量 (Context Vector)：</span>
            <strong>[${result.output.map(x => x.toFixed(4)).join(', ')}]</strong>
          </div>
        </div>
      `;
    } catch(e) {
      el.textContent='未计算：'+e.message;
      labEvidence=null;
      const visualEl = $('#bookAttentionVisual');
      if (visualEl) visualEl.innerHTML = '';
    }
  }

  // -------------------------------------------------------------
  // Tokenizer Lab (Lesson 5)
  // -------------------------------------------------------------
  const TOKEN_PRESETS = {
    mixed: { name: '中英混排与技术名词', text: 'Transformer 架构是现代 LLM 的基石。OpenAI 于 2026 年发布新型号，def eval(): return True 🚀' },
    code: { name: '代码缩进与空白符', text: 'def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)' },
    numbers: { name: '数学与浮点数切分', text: '版本号 9.11 与 9.9 谁更大？圆周率前十位是 3.1415926535，总耗时 128ms。' },
    multilingual: { name: '多语言与 Emoji 编码', text: 'Hello 世界！Bonjour le monde! 🌍 人工智能与人类智慧并肩同行 💡✨' }
  };

  function tokenize(text) {
    if (!text) return [];
    const regex = /[\u4e00-\u9fa5]|[a-zA-Z]+|[0-9]+|\s+|[^\sA-Za-z0-9\u4e00-\u9fa5]+/gu;
    const matches = text.match(regex) || [];
    return matches.map((tok, i) => {
      return { text: tok, len: tok.length, isSpace: /^\s+$/.test(tok), colorIdx: i % 6 };
    });
  }

  function tokenizerView() {
    return `
      <div class="book-matrix-presets">
        ${Object.entries(TOKEN_PRESETS).map(([k, v]) => `
          <button type="button" class="book-tag-btn ${tokenizerPreset === k ? 'active' : ''}" data-book-token-preset="${k}">${escape(v.name)}</button>
        `).join('')}
      </div>
      <div class="book-lab-form" style="margin-top:12px;">
        <label for="bookTokenizerInput" style="width:100%;">输入文本（仅作规则切分示意）：</label>
        <textarea id="bookTokenizerInput" class="book-textarea" rows="3" style="width:100%;">${escape(tokenizerText)}</textarea>
      </div>
      <div id="bookTokenizerOutput"></div>
    `;
  }

  function showTokenizer() {
    const el = $('#bookTokenizerOutput');
    if (!el) return;
    const toks = tokenize(tokenizerText);
    const charsCount = tokenizerText.length;
    const tokCount = toks.length;
    const ratio = tokCount > 0 ? (charsCount / tokCount).toFixed(2) : '0';

    const tokenPills = toks.map(t => {
      const display = t.isSpace ? (t.text === '\n' ? '↵\\n' : '␣'.repeat(t.text.length)) : escape(t.text);
      return `<span class="book-tok-pill tok-c${t.colorIdx}" title="片段长度: ${t.len} 个 UTF-16 代码单元">${display}</span>`;
    }).join('');

    el.innerHTML = `
      <div class="book-token-stats">
        <div><span>UTF-16 代码单元数</span><strong>${charsCount}</strong></div>
        <div><span>规则片段数</span><strong style="color:var(--accent,#4f46e5);">${tokCount}</strong></div>
        <div><span>每片段平均代码单元数</span><strong>${ratio}</strong></div>
        <div><span>模型 Token / 计费</span><strong>未计算</strong></div>
      </div>
      <div class="book-token-stream-box">
        <div class="book-token-stream-head">
          <span>规则切分预览（色块不代表模型 Token）：</span>
          <small>悬停可查看片段长度；本页没有模型词表</small>
        </div>
        <div class="book-token-stream">
          ${tokenPills || '<span style="color:#94a3b8;">请输入文本以查看切分效果</span>'}
        </div>
      </div>
      <div class="book-intuition-card">
        <strong>💡 从切分示意到真实 Tokenizer</strong>
        <p>1. <strong>需要明确编码器</strong>：真实 Token 边界和 ID 由模型使用的词表及编码算法决定。本页的正则只帮助观察文本片段，不能解释特定模型的行为或能力。</p>
        <p>2. <strong>费用与上下文需另行核算</strong>：请使用目标模型对应的官方编码器和计费规则。不能用这里的片段数量推算费用或上下文占用。</p>
      </div>
    `;
  }

  // -------------------------------------------------------------
  // Agent ReAct Lab (Lesson 7)
  // -------------------------------------------------------------
  const AGENT_PRESETS = {
    weather: {
      task: '查询北京明天的天气预报，并判断是否需要携带雨伞。',
      defaultObs: '{"status": "success", "city": "北京", "condition": "雷阵雨", "temp": "18~24℃", "rain_prob": "85%"}',
      steps: [
        { phase: 'thought', title: 'Step 1: 意图分析与规划 (Thought)', badge: '思考', badgeCls: 'badge-thought', content: '用户需要查询北京明天的天气，并获知是否需备伞。我自身不具备实时天气数据，必须调用注册工具 get_weather 进行数据检索。' },
        { phase: 'action', title: 'Step 2: 生成工具调用指令 (Action)', badge: '行动', badgeCls: 'badge-action', content: 'call_tool(name="get_weather", arguments={"city": "北京", "date": "tomorrow"})' },
        { phase: 'observation', title: 'Step 3: 环境执行与结果回填 (Observation)', badge: '观察', badgeCls: 'badge-obs', content: '预写工具响应示例：', isObs: true },
        { phase: 'final', title: 'Step 4: 综合事实生成最终答复 (Final Answer)', badge: '结论', badgeCls: 'badge-final', content: '根据气象工具查询结果，北京明天为**雷阵雨**，降水概率高达 **85%**，气温 18~24℃。**强烈建议您外出随身携带雨伞**，并注意防雷避雨与交通安全。' }
      ]
    },
    order: {
      task: '用户查询订单号 #892147 的派送状态，并要求加急催派。',
      defaultObs: '{"order_id": "892147", "carrier": "SF", "hub": "华北枢纽", "status": "in_transit", "eta": "今日18:00前"}',
      steps: [
        { phase: 'thought', title: 'Step 1: 意图分析与规划 (Thought)', badge: '思考', badgeCls: 'badge-thought', content: '用户需要查询指定订单状态并执行催单。我需要先通过物流 API 查询最新流转状态，再决定是否触发催派接口。' },
        { phase: 'action', title: 'Step 2: 生成工具调用指令 (Action)', badge: '行动', badgeCls: 'badge-action', content: 'call_tool(name="query_logistics", arguments={"order_id": "892147"})' },
        { phase: 'observation', title: 'Step 3: 环境执行与结果回填 (Observation)', badge: '观察', badgeCls: 'badge-obs', content: '预写工具响应示例：', isObs: true },
        { phase: 'final', title: 'Step 4: 综合事实生成最终答复 (Final Answer)', badge: '结论', badgeCls: 'badge-final', content: '您的订单 #892147 当前已到达**华北枢纽**，正在派送中，预计**今日 18:00 前送达**。当前示例仅展示物流查询，没有执行催单；如需催单，应另行确认并调用相应工具，再核对响应。' }
      ]
    }
  };

  function agentView() {
    return `
      <div class="book-matrix-presets">
        ${Object.entries(AGENT_PRESETS).map(([k, v]) => `
          <button type="button" class="book-tag-btn ${agentPreset === k ? 'active' : ''}" data-book-agent-preset="${k}">${escape(v.task)}</button>
        `).join('')}
      </div>
      <div class="book-agent-toolbar" style="margin:16px 0;display:flex;gap:10px;align-items:center;">
        <button type="button" class="book-btn" data-book-agent-step>
          <span>${agentStep < AGENT_PRESETS[agentPreset].steps.length ? '▶ 查看下一步示例 (Step ' + (agentStep + 1) + ')' : '✓ 示例已展示完毕'}</span>
        </button>
        <button type="button" class="book-btn secondary" data-book-agent-reset>重置流程</button>
        <span style="font-size:12px;color:var(--muted,#64748b);">当前进度：${agentStep} / ${AGENT_PRESETS[agentPreset].steps.length} 步</span>
      </div>
      <div id="bookAgentOutput"></div>
    `;
  }

  function showAgent() {
    const el = $('#bookAgentOutput');
    if (!el) return;
    const preset = AGENT_PRESETS[agentPreset];
    const steps = preset.steps;

    let stepsHtml = '';
    for (let i = 0; i < agentStep; i++) {
      const s = steps[i];
      let body = '';
      if (s.isObs) {
        body = `
          <pre class="book-agent-code" style="background:#f1f5f9;color:#0f172a;">${escape(agentMockObs || preset.defaultObs)}</pre>
        `;
      } else if (s.phase === 'action') {
        body = `<pre class="book-agent-code" style="color:#047857;background:#ecfdf5;border-color:#a7f3d0;">${escape(s.content)}</pre>`;
      } else {
        body = `<p style="margin:4px 0;line-height:1.6;font-size:14px;color:#1e293b;">${escape(s.content)}</p>`;
      }

      stepsHtml += `
        <div class="book-agent-card ${s.phase}">
          <div class="book-agent-card-header">
            <strong>${escape(s.title)}</strong>
            <span class="book-agent-badge ${s.badgeCls}">${escape(s.badge)}</span>
          </div>
          <div class="book-agent-card-body">
            ${body}
          </div>
        </div>
      `;
    }

    if (agentStep === 0) {
      stepsHtml = `<div class="book-empty-hint" style="padding:24px;text-align:center;color:var(--muted,#64748b);background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;">点击上方“查看下一步示例”按钮，查看预写工具参数、响应与结论；本页不会向外部服务发送请求。</div>`;
    }

    el.innerHTML = `
      <div class="book-agent-flow">
        ${stepsHtml}
      </div>
      <div class="book-intuition-card" style="margin-top:20px;">
        <strong>💡 ReAct 核心机制：为什么 Agent 需要反复执行 Thought ➔ Action ➔ Observation？</strong>
        <p>1. <strong>行动与观察解耦</strong>：模型无法自己直接运行代码或调用外部 API。它必须生成一段结构化 Action（如 JSON 格式的函数名和参数），由运行宿主执行后，再把 Observation 回传给大模型。</p>
        <p>2. <strong>防死循环机制</strong>：若工具返回报错或未查到结果，Agent 需要通过下一轮 Thought 决定是重试、更换参数，还是及时向用户如实报告失败，而非无限空转。</p>
      </div>
    `;
  }
  function tokens(s) { const txt = String(s).toLowerCase(); const cjk = (txt.match(/[\u3400-\u9fff]+/g) || []).flatMap(seg => seg.length < 2 ? [seg] : Array.from({ length: seg.length - 1 }, (_, i) => seg.slice(i, i + 2))); const en = txt.match(/[a-z0-9]+/g) || []; return [...cjk, ...en] }
  function retrieve(query, k) { const words = [...new Set(tokens(query))]; return docs.map(d => { const corpus = tokens(d.name + ' ' + d.text), count = {}; for (const w of corpus) count[w] = (count[w] || 0) + 1; const score = words.reduce((s, w) => s + Math.min(2, count[w] || 0), 0); return { ...d, score } }).filter(d => d.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, k) }
  function retrievalView() { return `<div class="book-lab-form"><label for="bookQuery">输入查询</label><input type="text" id="bookQuery" value="${escape(retrievalQuery)}" maxlength="80" style="flex:1;min-width:140px"><label for="bookTop">Top-K</label><input type="number" id="bookTop" min="1" max="4" step="1" value="${retrievalTop}" style="width:70px"><button type="button" class="book-btn" data-book-retrieve>重新检索</button></div><div id="bookRetrievalOutput" class="book-lab-output"></div>` }
  function showRetrieval() { const el = $('#bookRetrievalOutput'); if (!el) return; const hits = retrieve(retrievalQuery, retrievalTop); el.textContent = !hits.length ? `资料库没有足够的词项命中依据。请明确表示“未查到可靠资料”，不要编造答案。\n\n尝试：图书续借、周一开放、电影票价。` : `匹配依据（按中文字符二元组与英文词项计分）：\n` + hits.map((h, i) => `${i + 1}. [${h.id}] ${h.name} · 匹配分 ${h.score}\n${h.text}`).join('\n\n') + `\n\n注意：词项匹配不等于语义理解、事实核验或答案生成。` }
  function paintLab(lab) {
    const el = $('#bookLabBody');
    if (!el) return;
    if (lab === 'gradient') { el.innerHTML = gradientView(); showGradient(); }
    else if (lab === 'attention') { el.innerHTML = attentionView(); showAttention(); }
    else if (lab === 'tokenizer') { el.innerHTML = tokenizerView(); showTokenizer(); }
    else if (lab === 'retrieval') { el.innerHTML = retrievalView(); showRetrieval(); }
    else if (lab === 'agent') { el.innerHTML = agentView(); showAgent(); }
  }
  function show() { if (!manifest) render(); else render() }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-book-open],[data-book-complete],[data-book-choice],[data-book-check],[data-book-retry],[data-book-reset-quiz],[data-book-gradient-step],[data-book-gradient-reset],[data-book-retrieve],[data-book-attention],[data-book-lab-export],[data-book-attn-preset],[data-book-token-preset],[data-book-agent-preset],[data-book-agent-step],[data-book-agent-reset]');
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

    if (b.hasAttribute('data-book-attn-preset')) {
      const presetKey = b.dataset.bookAttnPreset;
      if (ATTN_PRESETS[presetKey]) {
        attentionPreset = presetKey;
        attentionDraft.q = ATTN_PRESETS[presetKey].q;
        attentionDraft.k = ATTN_PRESETS[presetKey].k;
        attentionDraft.v = ATTN_PRESETS[presetKey].v;
        const qEl = document.querySelector('textarea[data-book-matrix="q"]');
        const kEl = document.querySelector('textarea[data-book-matrix="k"]');
        const vEl = document.querySelector('textarea[data-book-matrix="v"]');
        if (qEl) qEl.value = attentionDraft.q;
        if (kEl) kEl.value = attentionDraft.k;
        if (vEl) vEl.value = attentionDraft.v;
        document.querySelectorAll('[data-book-attn-preset]').forEach(btn => btn.classList.toggle('active', btn.dataset.bookAttnPreset === presetKey));
        showAttention();
      }
      return;
    }
    if (b.hasAttribute('data-book-token-preset')) {
      const presetKey = b.dataset.bookTokenPreset;
      if (TOKEN_PRESETS[presetKey]) {
        tokenizerPreset = presetKey;
        tokenizerText = TOKEN_PRESETS[presetKey].text;
        const input = document.getElementById('bookTokenizerInput');
        if (input) input.value = tokenizerText;
        document.querySelectorAll('[data-book-token-preset]').forEach(btn => btn.classList.toggle('active', btn.dataset.bookTokenPreset === presetKey));
        showTokenizer();
      }
      return;
    }
    if (b.hasAttribute('data-book-agent-preset')) {
      const presetKey = b.dataset.bookAgentPreset;
      if (AGENT_PRESETS[presetKey]) {
        agentPreset = presetKey;
        agentStep = 0;
        document.querySelectorAll('[data-book-agent-preset]').forEach(btn => btn.classList.toggle('active', btn.dataset.bookAgentPreset === presetKey));
        showAgent();
      }
      return;
    }
    if (b.hasAttribute('data-book-agent-step')) {
      const maxSteps = AGENT_PRESETS[agentPreset].steps.length;
      if (agentStep < maxSteps) {
        agentStep++;
        showAgent();
      }
      return;
    }
    if (b.hasAttribute('data-book-agent-reset')) {
      agentStep = 0;
      showAgent();
      return;
    }

    if (b.hasAttribute('data-book-lab-export')) {
      if(!labEvidence)return;
      const blob=new Blob([JSON.stringify({created:new Date().toISOString(),scope:'本机固定数值计算，不证明专业掌握',...labEvidence},null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ai-'+labEvidence.lab+'-calculation.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
    }
    if (b.hasAttribute('data-book-retrieve')) { retrievalQuery = $('#bookQuery')?.value.slice(0, 80) || ''; retrievalTop = Math.min(4, Math.max(1, parseInt($('#bookTop')?.value || '2', 10) || 2)); showRetrieval(); return; }
  });
  document.addEventListener('input', e => {
    const t=e.target;
    if(t?.dataset.bookMatrix){attentionDraft[t.dataset.bookMatrix]=t.value;labEvidence=null;const out=$('#bookAttentionOutput');if(out)out.textContent='输入已修改，请重新计算；先预测权重与输出会怎样变化。';return;}

    if (t?.id === 'bookTokenizerInput') {
      tokenizerText = t.value;
      showTokenizer();
      return;
    }

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
