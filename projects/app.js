/* V1.7 project studio. Owns only ai_lab_projects_v1; never writes to original learning storage. */
const ProjectLab = (() => {
  'use strict';
  const L = ProjectLogic, KEY = 'ai_lab_projects_v1';
  const recordStorage = typeof LearningStorage!=='undefined'?LearningStorage.storage:localStorage;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  function init() {
    return {
      label: { labels: {}, reviewed: false },
      ml: { alpha: 1, trained: false, tested: false, custom: '', result: null },
      rag: { size: 65, k: 2, query: '图书馆周一开放吗', docs: [], tested: false, evaluated: false, last: [] },
      agent: { day: '周三', time: '10:00', title: 'AI 学习讨论', inspected: false, proposed: null, approved: false, added: [], trace: [] }
    }
  }
  let state = init(), selected = null, notice = '', storageWarn = '';
  try {
    const raw = JSON.parse(recordStorage.getItem(KEY) || 'null');
    if (raw && raw.version === 1 && raw.data) {
      const defaults = init();
      for (const k of Object.keys(defaults)) {
        const v = raw.data[k];
        if (v && typeof v === 'object' && !Array.isArray(v)) state[k] = { ...defaults[k], ...v };
      }
    }
  } catch { storageWarn = '旧记录无法解析，已使用新的本地学习状态。' }
  function save() {
    try { recordStorage.setItem(KEY, JSON.stringify({ version: 1, data: state })) }
    catch { storageWarn = '浏览器无法保存项目进度；可使用导出成果备份。' }
  }
  function download(name, body, type) {
    const blob = new Blob([body], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const projects = [
    { id: 'label', icon: '🏷️', title: '数据标注与质量评估', level: '入门 · 20–35 分钟', desc: '制定分类规范、独立标注 12 条文本、计算参考一致性与宏平均 F1，导出标注数据。', out: '标注 CSV + 混淆矩阵 + 标注分歧清单', steps: ['阅读标签规范', '标注 12 条', '对照参考检查错误', '导出成果'] },
    { id: 'ml', icon: '📨', title: '训练一个垃圾邮件分类器', level: '中级 · 25–40 分钟', desc: '利用 18 条训练样本建立词频朴素贝叶斯模型，评价 8 条留出测试样本，再独立输入新邮件。', out: '独立测试集指标 + 模型解释 + 自定义预测', steps: ['检查训练/测试隔离', '设定平滑参数', '真实计算训练与预测', '分析错误并试新输入'] },
    { id: 'rag', icon: '📚', title: '搭建可引用的检索问答', level: '中级 · 30–45 分钟', desc: '建立文档分块与 TF-IDF 排序，观察检索证据，评估六个问题的命中率，并尝试添加自有资料。', out: '检索排名 + 可追溯证据 + Recall@K / MRR', steps: ['阅读样本知识库', '调整分块和 Top-K', '执行检索与引文', '跑完六题评测'] },
    { id: 'agent', icon: '🧭', title: '受控工具 Agent：安排活动', level: '中级 · 20–35 分钟', desc: '在本地沙箱读取日历、检查冲突、请求用户授权，写入新的活动并观察完整工具记录。', out: '操作审计轨迹 + 授权证据 + 沙箱日历', steps: ['读取当前日历', '检查日程冲突', '显式授权', '执行与验证写入'] }
  ];
  function passFlags() {
    const c = state.label, labels = L.LABEL_ROWS.map(r => c.labels?.[r.id] || '');
    const m = state.ml, r = state.rag, a = state.agent;
    return {
      label: labels.every(Boolean) && c.reviewed,
      ml: m.trained && m.tested,
      rag: r.tested && r.evaluated,
      agent: a.added?.length > 0
    }
  }
  function listPage() {
    const flags = passFlags();
    return `<div class="studio-header"><div class="studio-eyebrow">PROJECT STUDIO · 原理 → 实验 → 证据</div><h2>从认识概念，到亲手做出可验证的结果。</h2><p>四个项目直接运行在浏览器，计算、评估与状态修改都可观察。没有外部 AI 调用，也不修改你的真实邮箱、日历或服务器。项目成果可导出，学习进度保存在本机。</p><div class="studio-stats"><strong>${Object.values(flags).filter(Boolean).length} / 4</strong><span>项目达到基础验收条件</span><button type="button" data-project="export-all">导出全部成果 JSON ↓</button></div></div><div class="studio-list">${projects.map((p, i) => `<button class="studio-tile" type="button" data-project="open" data-id="${p.id}"><span class="studio-tile-icon">${p.icon}</span><span class="studio-tile-main"><small>PROJECT ${String(i + 1).padStart(2, '0')} · ${p.level}</small><strong>${p.title}</strong><span>${p.desc}</span><em>交付物：${p.out}</em></span><span class="studio-status">${flags[p.id] ? '✓ 已达标' : '进入项目 →'}</span></button>`).join('')}</div><div class="studio-tip"><strong>什么叫真实实践？</strong><p>每个项目都在本机对明确的数据执行算法或状态修改。标签、指标、检索结果和工具执行记录不是预先写死的通关动画；但其中的训练数据和日历都是教学样本，不能代表生产环境的模型效果或实际第三方工具集成。</p></div>`;
  }
  function shell(project, html) {
    const p = projects.find(x => x.id === project), guide = PROJECT_GUIDES[project];
    return `<div class="studio-work"><div class="studio-topbar-nav"><button type="button" class="studio-back" data-project="back">← 返回项目目录</button><div class="studio-steps-nav" aria-label="项目步骤导航"><a href="#proj-step-1" class="studio-step-pill"><span>1</span> 说明与规范</a><a href="#proj-step-2" class="studio-step-pill"><span>2</span> 操作与计算</a><a href="#proj-step-3" class="studio-step-pill"><span>3</span> 评估与分析</a><a href="#proj-step-4" class="studio-step-pill"><span>4</span> 导出交付物</a></div></div><div class="studio-project-head"><div class="studio-eyebrow">PROJECT ${String(projects.indexOf(p) + 1).padStart(2, '0')} · ${p.level}</div><h2>${p.icon} ${p.title}</h2><p>${p.desc}</p></div><div class="studio-split"><aside class="studio-task"><h3>你的项目任务</h3><ol>${p.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol><div class="studio-out"><strong>最终交付</strong><p>${esc(p.out)}</p></div><p class="studio-disclaimer">${storageWarn || '操作保存在当前浏览器。教学数据没有上传到服务器。'}</p></aside><div class="studio-main">${notice ? `<div class="studio-note" role="status">${esc(notice)}</div>` : ''}<details class="studio-guide"><summary>📖 项目教学：核心原理、验收标准和进阶任务（建议先阅读）</summary>${guide.sections.map(sec => `<section class="studio-guide-section"><h3>${esc(sec.title)}</h3>${sec.paragraphs.map(x => `<p>${esc(x)}</p>`).join('')}</section>`).join('')}<div class="studio-rubric"><strong>验收检查清单</strong><ol>${guide.rubric.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p><strong>进阶挑战：</strong>${esc(guide.extension)}</p></div></details>${html}</div></div></div>`;
  }
  function matrixView(result) {
    return `<div class="studio-metrics">${[{ n: '覆盖数', v: result.used + '/' + result.total }, { n: '准确率', v: (result.accuracy * 100).toFixed(1) + '%' }, { n: '宏 F1', v: result.macroF1.toFixed(3) }, { n: '参考一致性 κ', v: result.kappa.toFixed(3) }].map(x => `<div><small>${x.n}</small><strong>${x.v}</strong></div>`).join('')}</div><div class="studio-scroll"><table><thead><tr><th>参考标签 ↓ / 你的标签 →</th>${L.LABELS.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${L.LABELS.map(g => `<tr><th>${g}</th>${L.LABELS.map(x => `<td>${result.matrix[g][x]}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="studio-scroll"><table><thead><tr><th>类别</th><th>Precision</th><th>Recall</th><th>F1</th></tr></thead><tbody>${result.metrics.map(x => `<tr><td>${x.label}</td><td>${x.precision.toFixed(2)}</td><td>${x.recall.toFixed(2)}</td><td>${x.f1.toFixed(2)}</td></tr>`).join('')}</tbody></table></div><small class="studio-help">κ 是你与预置参考标注之间的 Cohen κ，仅用于练习一致性分析；并非真实双标注员之间的质量统计。数据集仅有 12 条，指标存在较大波动。</small>`;
  }
  function labelView() {
    const s = state.label, labels = L.LABEL_ROWS.map(r => s.labels?.[r.id] || '');
    const answered = labels.filter(Boolean).length;
    const report = L.confusion(L.LABELS, L.LABEL_ROWS.map(r => r.gold), labels);
    return `<section id="proj-step-1"><h3>1. 制定标注规则</h3><p>请将每条文本按其**主要意图**标注：<strong>日程</strong>＝安排具体活动、会议或提醒；<strong>知识</strong>＝询问事实或解释；<strong>技术</strong>＝程序报错和设备软件问题。标注时只使用文本本身，不推测未提供的背景。</p><p class="studio-help">同一句如“如何安装程序？”通常归技术；“明天下午安装软件的培训”则按主意图归日程。先独立完成再查看参考。</p></section><section id="proj-step-2"><h3>2. 标注样本 <span class="studio-count">${answered} / 12</span></h3><div class="studio-scroll"><table><thead><tr><th>ID</th><th>待标注文本</th><th>你的标签</th>${s.reviewed ? '<th>参考</th>' : ''}</tr></thead><tbody>${L.LABEL_ROWS.map(row => `<tr><td>${row.id}</td><td>${esc(row.text)}</td><td><select data-label-row="${row.id}" aria-label="${row.id} 标签"><option value="">请选择</option>${L.LABELS.map(k => `<option value="${k}" ${s.labels?.[row.id] === k ? 'selected' : ''}>${k}</option>`).join('')}</select></td>${s.reviewed ? `<td class="${s.labels?.[row.id] === row.gold ? 'studio-good' : 'studio-bad'}">${row.gold}${s.labels?.[row.id] === row.gold ? ' ✓' : ' · 再思考'}</td>` : ''}</tr>`).join('')}</tbody></table></div><div class="studio-actions" id="proj-step-4"><button data-project="review-label" ${answered !== 12 ? 'disabled' : ''}>${s.reviewed ? '重新计算质量' : '提交标注并对照参考'} →</button><button class="studio-secondary" data-project="export-label" ${answered !== 12 ? 'disabled' : ''}>导出 CSV ↓</button></div></section>${s.reviewed ? `<section id="proj-step-3"><h3>3. 质量报告（真实计算）</h3>${matrixView(report)}<div class="studio-explain"><strong>分歧清单</strong>${L.LABEL_ROWS.filter(row => s.labels?.[row.id] !== row.gold).map(row => `<p>${row.id}：${esc(row.text)} · 你的标注「${esc(s.labels?.[row.id])}」 / 参考「${row.gold}」</p>`).join('') || '<p>当前与参考标注完全一致。尝试有意修改一个标签，观察宏 F1 与 κ 的变化。</p>'}</div></section>` : ''}`;
  }
  function mlReport() {
    const s = state.ml, model = L.naiveBayes(L.MAIL_TRAIN, ['正常', '垃圾'], Number(s.alpha));
    const preds = L.MAIL_TEST.map(r => model.predict(r.text).label);
    const matrix = L.confusion(['正常', '垃圾'], L.MAIL_TEST.map(x => x.label), preds);
    return { model, matrix, preds }
  }
  function mlView() {
    const s = state.ml;
    const { model, matrix, preds } = mlReport();
    return `<section id="proj-step-1"><h3>1. 分离训练集与测试集</h3><p>本项目使用 **18 条训练文本**（模型能学习）和 **8 条独立留出文本**（只用于评估）。采用多项式朴素贝叶斯，计算各词在类别中出现的频数、拉普拉斯平滑概率与类别后验对数得分。</p><p class="studio-help">⚠️ 这只是教学数据，样本量极小且人为构造。测试准确率不能推广到真实邮件系统。</p></section><section id="proj-step-2"><h3>2. 训练模型</h3><div class="studio-input-row"><label>Laplace 平滑 α <select data-ml-alpha><option value="0.5" ${s.alpha == .5 ? 'selected' : ''}>0.5</option><option value="1" ${s.alpha == 1 ? 'selected' : ''}>1</option><option value="2" ${s.alpha == 2 ? 'selected' : ''}>2</option></select></label><button data-project="train-model">重新训练并评估</button></div>${s.trained ? `<div class="studio-metrics"><div><small>训练样本</small><strong>${model.trainSize}</strong></div><div><small>词汇表词项</small><strong>${model.count}</strong></div><div><small>测试集准确率</small><strong>${(matrix.accuracy * 100).toFixed(1)}%</strong></div><div><small>宏 F1</small><strong>${matrix.macroF1.toFixed(3)}</strong></div></div><div class="studio-scroll" id="proj-step-3"><table><thead><tr><th>留出测试文本</th><th>真实</th><th>预测</th></tr></thead><tbody>${L.MAIL_TEST.map((r, i) => `<tr><td>${esc(r.text)}</td><td>${r.label}</td><td class="${preds[i] === r.label ? 'studio-good' : 'studio-bad'}">${preds[i]}</td></tr>`).join('')}</tbody></table></div><small class="studio-help">模型内部用词频、对数概率计算；没有在线大模型参与。比较不同 α 与失败样本，观察真实可解释的变化。</small>` : '<div class="studio-placeholder">点击“重新训练并评估”，实时训练并计算留出测试集指标。</div>'}</section><section id="proj-step-4"><h3>3. 对新的文本推理与成果</h3><div class="studio-input-row"><label class="studio-grow">新邮件内容 <input id="mlCustom" maxlength="180" value="${esc(s.custom || '限时免费领取课程资料')}" placeholder="例如：明日会议安排"></label><button data-project="predict-model" ${!s.trained ? 'disabled' : ''}>预测并解释</button><button class="studio-secondary" data-project="export-project" ${!s.trained ? 'disabled' : ''}>导出模型记录 ↓</button></div>${s.result ? `<div class="studio-explain"><strong>预测：${esc(s.result.label)}</strong><p>匹配训练词项 ${s.result.matched}/${s.result.words.length}；${s.result.scores.map(x => `${x.label} 对数分数 ${x.score.toFixed(3)}`).join('，')}。</p><small>这是模型推断，不保证正确。对比不同措辞并记录误判。</small></div>` : ''}</section>`;
  }
  function docSet() {
    const s = state.rag;
    return [...L.DOCS, ...(s.docs || []).map((d, i) => ({ id: 'USER' + (i + 1), title: d.title, text: d.text }))]
  }
  function ragResults(query, size, k) {
    const idx = L.buildIndex(docSet(), size);
    return L.searchIndex(idx, query, k)
  }
  function ragView() {
    const s = state.rag, docs = docSet();
    const results = s.tested ? ragResults(s.query, s.size, s.k) : [], metrics = s.evaluated ? L.evaluateRetrieval(L.DOCS, s.size, s.k) : null;
    return `<section id="proj-step-1"><h3>1. 准备带来源的资料库</h3><p>内置六份公开领域示例文档：图书馆规则、开放时间、科普讲座、编程工作坊、平台隐私、学习计划。所有文档拥有独立 ID，检索后将展示来源标识。</p><details><summary>查看 ${docs.length} 份文档内容</summary>${docs.map(d => `<div class="studio-doc"><strong>[${d.id}] ${esc(d.title)}</strong><p>${esc(d.text)}</p></div>`).join('')}</details></section><section id="proj-step-2"><h3>2. 执行可追溯检索</h3><div class="studio-input-row"><label>分块长度 <select data-rag-size>${[45, 65, 100, 160].map(n => `<option value="${n}" ${s.size == n ? 'selected' : ''}>${n} 字符</option>`).join('')}</select></label><label>Top-K <select data-rag-k>${[1, 2, 3, 4].map(n => `<option value="${n}" ${s.k == n ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div><div class="studio-input-row"><label class="studio-grow">你的问题 <input id="ragQuery" maxlength="150" value="${esc(s.query)}" placeholder="例如：普通图书能续借几天？"></label><button data-project="rag-search">检索</button></div>${s.tested ? `<div class="studio-explain"><strong>${results.length ? `检索到 ${results.length} 个来源` : '没有足够的词项匹配依据'}</strong><p>${results.length ? '下方为按词频和文档频率重新计算的 TF-IDF 排名。这里只摘录原文证据，不根据证据生成未经核实的回答。' : '当前应回答“资料中没有可靠依据”，不能编造。请尝试修改提问或补充文档。'}</p></div>${results.map((x, i) => `<div class="studio-hit"><strong>${i + 1}. [${x.docId}] ${esc(x.title)}</strong><small>得分 ${x.score.toFixed(3)} · 分块 ${esc(x.key)}</small><p>「${esc(x.text)}」</p></div>`).join('')}` : ''}</section><section id="proj-step-3"><h3>3. 用六个已知答案的问题评测</h3><p>评测只使用固定测试问题和六份原始文档，不包含临时添加的资料，避免改变标准答案。计算来源命中率 Recall@K 与平均倒数排名 MRR。</p><button data-project="rag-eval">运行六题检索评估</button>${metrics ? `<div class="studio-metrics"><div><small>命中问题数</small><strong>${metrics.hit} / 6</strong></div><div><small>Recall@K</small><strong>${metrics.recall.toFixed(3)}</strong></div><div><small>MRR</small><strong>${metrics.mrr.toFixed(3)}</strong></div><div><small>原始分块</small><strong>${metrics.index.n}</strong></div></div><div class="studio-scroll"><table><thead><tr><th>测试问题</th><th>目标来源</th><th>排名</th></tr></thead><tbody>${metrics.rows.map(x => `<tr><td>${esc(x.q)}</td><td>${x.want}</td><td>${x.rank || '未命中'}</td></tr>`).join('')}</tbody></table></div>` : ''}</section><section id="proj-step-4"><h3>4. 扩展自己的资料与导出成果</h3><p class="studio-help">添加一条公开且不包含个人信息的短文档，观察检索变化。本地最多 3 条，每条最多 800 字；更复杂的嵌入向量、重排模型和答案生成属于后续高级项目。</p><div class="studio-input-row"><label>标题 <input id="ragDocTitle" maxlength="50" placeholder="例如：公共交通乘车说明"></label></div><label class="studio-block-label">文档内容 <textarea id="ragDocText" maxlength="800" rows="3" placeholder="输入有事实依据的短文段，不要输入密码或私人资料"></textarea></label><div class="studio-actions"><button data-project="rag-add" ${s.docs?.length >= 3 ? 'disabled' : ''}>添加到本地资料库</button><button class="studio-secondary" data-project="rag-clear">移除自定义资料</button><button class="studio-secondary" data-project="export-project">导出项目成果 JSON ↓</button></div></section>`;
  }
  function agentCalendar() { return [...L.BASE_CALENDAR, ...state.agent.added] }
  function trace(msg) { const s = state.agent; s.trace = [...(s.trace || []), { at: new Date().toISOString(), event: msg }].slice(-50) }
  function agentView() {
    const s = state.agent, calendar = agentCalendar(), p = s.proposed;
    return `<section id="proj-step-1"><h3>1. 认识你的工具权限</h3><p>工具仅有 <code>calendar.list()</code> 和 <code>calendar.create()</code> 两种。读取无需授权，写入必须在**查看空闲情况后**由用户确认。所有调用都在本地沙箱执行，不访问真实日历或第三方 API。</p><button data-project="agent-read">读取日历 · calendar.list()</button>${s.inspected ? `<div class="studio-scroll"><table><thead><tr><th>日期</th><th>时间</th><th>事件</th></tr></thead><tbody>${calendar.map(x => `<tr><td>${esc(x.day)}</td><td>${esc(x.time)}</td><td>${esc(x.title)}</td></tr>`).join('')}</tbody></table></div>` : ''}</section><section id="proj-step-2"><h3>2. 制定日程方案</h3><div class="studio-input-row"><label>工作日 <select data-agent-day>${L.DAYS.map(x => `<option ${s.day === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label><label>时间 <select data-agent-time>${L.HOURS.map(x => `<option ${s.time === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label></div><label class="studio-block-label">活动名称 <input id="agentTitle" maxlength="40" value="${esc(s.title)}"></label><button data-project="agent-propose" ${!s.inspected ? 'disabled' : ''}>检查冲突并提出方案</button>${p ? `<div class="studio-explain"><strong>待批准计划：${esc(p.day)} ${esc(p.time)} · ${esc(p.title)}</strong><p>冲突检查已执行。请核对上述内容是否符合自己的真实意图；点击批准才允许执行写入。修改计划将自动撤销已有批准。</p></div>` : ''}</section><section id="proj-step-3"><h3>3. 明确授权并执行</h3><label class="studio-check"><input type="checkbox" data-agent-approve ${s.approved ? 'checked' : ''} ${!p ? 'disabled' : ''}>我已核对上述具体计划，授权写入**本地演示日历**（不是 Google Calendar）</label><div class="studio-actions"><button data-project="agent-write" ${!p || !s.approved ? 'disabled' : ''}>执行受控工具 calendar.create()</button><button class="studio-secondary" data-project="agent-reset">撤销本项目新增事件</button><button class="studio-secondary" data-project="export-project">导出审计记录 ↓</button></div><p class="studio-help">试着先选已有活动占用的周二 10:00，观察冲突拒绝；然后改成空闲时段。测试未经授权时不可写入。</p></section><section id="proj-step-4"><h3>4. 工具执行轨迹（最近 ${s.trace.length} 条）</h3><div class="studio-trace">${s.trace.length ? s.trace.slice().reverse().map(x => `<p><small>${esc(x.at)}</small> ${esc(x.event)}</p>`).join('') : '<p>尚未调用任何工具。先读取日历。</p>'}</div></section>`;
  }
  function render() {
    const container = $('#dynamicArea');
    if (!container || ui.tab !== 'projects') return;
    document.querySelectorAll('#dailyNav button').forEach(b => b.classList.toggle('active', b.dataset.action === 'nav-projects'));
    document.querySelectorAll('#chapterNav button').forEach(b => b.classList.remove('active'));
    const view = !selected ? listPage() : shell(selected, { label: labelView, ml: mlView, rag: ragView, agent: agentView }[selected]());
    container.innerHTML = view;
    if (typeof updateMainSidebar === 'function') updateMainSidebar();
  }
  function go(id) {
    if (id !== null && !projects.some(p => p.id === id)) return;
    selected = id; notice = '';
    if (typeof updateHashRoute === 'function') updateHashRoute();
    if (typeof updateMainSidebar === 'function') updateMainSidebar();
    render();
  }
  function exportCurrent() {
    download('ai-project-' + selected + '-evidence.json', JSON.stringify({ project: selected, created: new Date().toISOString(), data: state[selected] }, null, 2), 'application/json;charset=utf-8');
  }
  function act(name, id) {
    notice = ''; const s = state[selected];
    switch (name) {
      case 'open': go(id); return;
      case 'back': go(null); return;
      case 'export-all': download('ai-learning-projects-evidence.json', JSON.stringify({ created: new Date().toISOString(), progress: passFlags(), data: state }, null, 2), 'application/json;charset=utf-8'); return;
      case 'export-project': exportCurrent(); return;
      case 'review-label': if (L.LABEL_ROWS.every(row => s.labels[row.id])) s.reviewed = true; break;
      case 'export-label': {
        if (!L.LABEL_ROWS.every(row => s.labels[row.id])) return;
        const rows = ['id,text,your_label,reference_label', ...L.LABEL_ROWS.map(row => [row.id, row.text, s.labels[row.id], row.gold].map(x => '"' + String(x).replace(/"/g, '""') + '"').join(','))];
        download('annotation-project.csv', '\ufeff' + rows.join('\r\n'), 'text/csv;charset=utf-8');
        return;
      }
      case 'train-model': s.trained = true; s.tested = false; s.result = null; notice = '训练完毕：已对留出测试集执行真实预测。'; break;
      case 'predict-model': {
        if (!s.trained) return;
        const input = $('#mlCustom')?.value.trim().slice(0, 180) || '';
        if (!input) { notice = '请先输入新文本。'; break }
        s.custom = input; s.result = L.naiveBayes(L.MAIL_TRAIN, ['正常', '垃圾'], Number(s.alpha)).predict(input); s.tested = true; break;
      }
      case 'rag-search': s.query = $('#ragQuery')?.value.trim().slice(0, 150) || ''; s.tested = true; break;
      case 'rag-eval': s.evaluated = true; break;
      case 'rag-add': {
        const title = $('#ragDocTitle')?.value.trim().slice(0, 50) || '', text = $('#ragDocText')?.value.trim().slice(0, 800) || '';
        if (!title || text.length < 12) { notice = '需要标题和不少于 12 字的文档正文。'; break }
        if ((s.docs || []).length >= 3) { notice = '本地文档最多三条。'; break }
        s.docs.push({ title, text }); s.tested = false; notice = '文档已加入本地索引；请重新检索查看排序。'; break;
      }
      case 'rag-clear': s.docs = []; s.tested = false; break;
      case 'agent-read': s.inspected = true; trace('calendar.list() → 返回 ' + agentCalendar().length + ' 条本地事件'); notice = '读取成功。请在日历中选择空闲时段。'; break;
      case 'agent-propose': {
        if (!s.inspected) { notice = '请先读取日历。'; break }
        const title = $('#agentTitle')?.value.trim().slice(0, 40) || '';
        s.title = title;
        const result = L.scheduleCheck(agentCalendar(), s.day, s.time, title, true);
        trace('calendar.check(' + s.day + ' ' + s.time + ') → ' + result.why);
        s.approved = false; s.proposed = result.ok ? { day: s.day, time: s.time, title } : null;
        notice = result.ok ? '时间空闲，方案可供授权。' : result.why; break;
      }
      case 'agent-write': {
        const p = s.proposed;
        if (!p || !s.approved) { trace('calendar.create() 已拒绝：无有效授权'); notice = '已拒绝：缺少明确授权。'; break }
        const check = L.scheduleCheck(agentCalendar(), p.day, p.time, p.title, s.approved);
        if (!check.ok) { trace('calendar.create() 已拒绝：' + check.why); notice = check.why; break }
        s.added.push({ id: 'demo-' + Date.now() + '-' + (s.added.length + 1), day: p.day, time: p.time, title: p.title });
        trace('calendar.create(' + p.day + ' ' + p.time + ' ' + p.title + ') → 本地写入成功');
        s.proposed = null; s.approved = false; s.inspected = true;
        notice = '已写入本地沙箱日历。没有产生真实日历事件。'; break;
      }
      case 'agent-reset':
        s.added = []; s.proposed = null; s.approved = false; s.inspected = false;
        trace('rollback() → 清空本项目创建的演示事件（原始日历不变）');
        notice = '已回滚新增事件。'; break;
      default: return;
    }
    save(); render();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-project]');
    if (!b || ui.tab !== 'projects' || (!b.closest('#dynamicArea') && !b.closest('#subNavBar') && !b.closest('#mainSidebar'))) return;
    act(b.dataset.project, b.dataset.id);
  });
  document.addEventListener('change', e => {
    if (ui.tab !== 'projects' || !e.target.closest('#dynamicArea')) return;
    const t = e.target;
    if (t.matches('[data-label-row]')) { state.label.labels[t.dataset.labelRow] = t.value; state.label.reviewed = false; save(); render(); return }
    if (t.matches('[data-ml-alpha]')) { state.ml.alpha = Number(t.value); state.ml.trained = false; state.ml.tested = false; state.ml.result = null; save(); render(); return }
    if (t.matches('[data-rag-size]')) { state.rag.size = Number(t.value); state.rag.tested = false; state.rag.evaluated = false; save(); render(); return }
    if (t.matches('[data-rag-k]')) { state.rag.k = Number(t.value); state.rag.tested = false; state.rag.evaluated = false; save(); render(); return }
    if (t.matches('[data-agent-day]')) { state.agent.day = t.value; state.agent.proposed = null; state.agent.approved = false; save(); render(); return }
    if (t.matches('[data-agent-time]')) { state.agent.time = t.value; state.agent.proposed = null; state.agent.approved = false; save(); render(); return }
    if (t.matches('[data-agent-approve]')) { state.agent.approved = Boolean(t.checked); save(); render(); return }
  });
  document.addEventListener('input', e => {
    if (ui.tab !== 'projects' || !e.target.closest('#dynamicArea')) return;
    const t = e.target;
    if (t.id === 'agentTitle') { state.agent.title = t.value.slice(0, 40); state.agent.proposed = null; state.agent.approved = false; save() }
  });
  return {
    render,
    go,
    getSelected: () => selected,
    getProjects: () => projects,
    getProgress: passFlags,
    _test: { mlReport, ragResults }
  };
})();
