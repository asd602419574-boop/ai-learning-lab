/* AI Learning Studio Home
   Refactored for clarity, intuitive progression, and vivid interactivity.
*/
const LearningHome = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let selected = 'foundation', lastMeta = {};

  const routes = [
    {
      id: 'foundation',
      title: '核心基础',
      intro: '从第一次可靠使用 AI 开始，建立直觉并看懂底层机制。',
      cards: [
        ['认识 AI，先选对任务', '从具体情境判断哪些适合确定性规则、哪些适合 AI 辅助或人工复核。', '入门第 1 课 · 资料与练习', '#lesson?id=ai-basics', '开始第 1 课'],
        ['把任务说清楚', '将材料、目标、受众、格式与核验约束转化为高清晰度的提示词契约。', '入门第 2 课 · 资料与练习', '#lesson?id=clear-task', '学习任务表达'],
        ['可靠使用 AI：事实与引用', '在资料中核对事实依据，遇到无答案问题明确保留未知。', '入门第 3 课 · 资料与练习', '#lesson?id=reliable-ai', '核对方法实操']
      ]
    },
    {
      id: 'labs',
      title: '交互实验台',
      intro: '像物理实验一样，通过滑块调节与实时可视化探索核心机制。',
      cards: [
        ['Prompt 与温度采样控制台', '单变量调节 Temperature 与 Top-P，观察并行采样的确定性与散布方差。', '实时采样模拟 · 交互实验室', '#labs', '打开控制台'],
        ['RAG 语义切块与召回对齐', '动态调整 Chunk Size 与 Overlap，实时观察文档切割与向量匹配。', '语义检索实验 · 交互实验室', '#labs', '测试检索匹配'],
        ['单神经元决策边界玩具', '拖动权重与偏置滑块，实时观察 2D 分类超平面旋转平移与损失变化。', '60FPS 几何渲染 · 交互实验室', '#labs', '调试神经元']
      ]
    },
    {
      id: 'projects',
      title: '工程与系统',
      intro: '从可观察的小系统开始，体验真实输入、校验、存储与异常恢复。',
      cards: [
        ['通知整理小系统', '整理非结构化通知，体验字段校验、确认落库与七类异常用例测试。', '四阶段贯穿项目 · 零编程可学', '#system', '阅读架构示范'],
        ['本地贝叶斯文本分类器', '使用训练样本训练朴素贝叶斯，观察测试集表现并输入自定义案例。', '浏览器轻量算法项目', '#projects?id=ml', '运行分类器'],
        ['受控状态与工具调用 Agent', '查询日历空档、识别冲突并在写入前触发人工授权确认。', '本地沙箱实践', '#projects?id=agent', '体验工具流程']
      ]
    }
  ];

  function heroSection() {
    return `
      <section class="editorial-welcome" style="margin-bottom: 24px;">
        <div style="max-width: 780px;">
          <span class="editorial-kicker">AI LEARNING STUDIO · 沉浸式人工智能实战工作台</span>
          <h1 style="font-size: 28px; line-height: 1.3; margin: 8px 0 12px; font-weight: 800; letter-spacing: -0.5px;">
            让 AI 学习回归直觉与亲手实验。
          </h1>
          <p style="font-size: 15px; color: var(--ink-secondary); line-height: 1.6; margin: 0 0 20px;">
            告别冰冷的死记硬背。从 4 节认知入门，到像物理实验般直观的交互实验台，再到端到端的小系统构建，步步扎实、所见即所得。
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <a href="#lesson?id=ai-basics" class="btn" style="padding: 10px 20px; font-weight: 600;">从第 1 课开始探索 →</a>
            <a href="#labs" class="btn btn-secondary" style="padding: 10px 20px; font-weight: 600;">🔬 打开交互实验室</a>
          </div>
        </div>
      </section>

      <!-- 3 Featured Pillars -->
      <section style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 28px;">
        <article class="home-track-card" onclick="window.location.hash='#labs'" style="cursor: pointer;">
          <div class="home-track-top">
            <span style="font-size: 24px;">🔬</span>
            <span class="home-track-badge">高互动性</span>
          </div>
          <h3 style="font-size: 16px; margin: 0 0 6px; font-weight: 700;">交互式 AI 实验室</h3>
          <p style="font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5;">
            滑块调节 Prompt 温度、实时观察 RAG 切块与向量匹配、操控神经元决策超平面。
          </p>
          <span style="margin-top: 14px; font-size: 13px; font-weight: 600; color: var(--accent);">
            立即进入实验台 →
          </span>
        </article>

        <article class="home-track-card" onclick="window.location.hash='#pathways'" style="cursor: pointer;">
          <div class="home-track-top">
            <span style="font-size: 24px;">🧭</span>
            <span class="home-track-badge">循序渐进</span>
          </div>
          <h3 style="font-size: 16px; margin: 0 0 6px; font-weight: 700;">4 步零基础认知路线</h3>
          <p style="font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5;">
            任务选择、结构化表达、事实核查与结果评价，先看完整示范，再留下自己的成果。
          </p>
          <span style="margin-top: 14px; font-size: 13px; font-weight: 600; color: var(--accent);">
            查看学习路线 →
          </span>
        </article>

        <article class="home-track-card" onclick="window.location.hash='#system'" style="cursor: pointer;">
          <div class="home-track-top">
            <span style="font-size: 24px;">🛠️</span>
            <span class="home-track-badge">工程实战</span>
          </div>
          <h3 style="font-size: 16px; margin: 0 0 6px; font-weight: 700;">通知整理器贯穿项目</h3>
          <p style="font-size: 13px; color: var(--muted); margin: 0; line-height: 1.5;">
            零编程体验需求边界、字段设计、落库校验与 7 类异常用例回归，带证据交付成果。
          </p>
          <span style="margin-top: 14px; font-size: 13px; font-weight: 600; color: var(--accent);">
            了解贯穿项目 →
          </span>
        </article>
      </section>
    `;
  }

  function sequence(courses, summary) {
    const progress = summary.lessons || [];
    return `
      <section class="editorial-sequence" aria-labelledby="sequence-title" style="margin-bottom: 28px;">
        <div class="editorial-section-head">
          <div>
            <span class="editorial-kicker">LEVEL 1 · 认知入门</span>
            <h2 id="sequence-title">4 节入门课：先看示范，再动手练习</h2>
          </div>
          <div class="editorial-sequence-progress" data-pathway-progress>
            已完成 <strong>${summary.completedCount || 0} / ${courses.length}</strong>
          </div>
        </div>
        <ol class="editorial-sequence-list">
          ${courses.map((course, i) => {
            const item = progress.find(l => l.id === course.id) || {};
            const label = item.completed ? '已通关' : item.started ? '进行中' : '待探索';
            return `
              <li data-pathway-lesson="${esc(course.id)}">
                <span class="editorial-sequence-index">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <h3><a href="#lesson?id=${esc(course.id)}">${esc(course.title)}</a></h3>
                  <p>${esc(label)} · 建议 ${course.minutes || 15} 分钟</p>
                </div>
                <a class="editorial-sequence-action" href="#lesson?id=${esc(course.id)}">
                  ${item.completed ? '回顾' : item.started ? '继续' : '开始'} <span aria-hidden="true">→</span>
                </a>
              </li>
            `;
          }).join('')}
        </ol>
      </section>
    `;
  }

  function render(meta = {}, pathsOnly = false) {
    lastMeta = meta;
    const s = typeof LearningWorkspace !== 'undefined' ? LearningWorkspace.summary() : { step: 0, artifactCount: 0, attemptCount: 0, passedCount: 0, hints: 0 };
    const courses = typeof LearningCatalog !== 'undefined' ? LearningCatalog.list() : [LearningContent];
    const track = routes.find(x => x.id === selected) || routes[0];

    return `
      <div class="learning-home" data-learning-home>
        ${heroSection()}
        ${sequence(courses, s)}

        <!-- Interactive Discovery Tracks -->
        <section class="editorial-pathways" style="margin-bottom: 28px;">
          <div class="editorial-section-head">
            <div>
              <span class="editorial-kicker">LEVEL 2 · 核心技术与进阶</span>
              <h2>按目标深入学习</h2>
            </div>
            <a href="#courses?mode=textbook">查阅全部系统教材 ↗</a>
          </div>

          <div class="editorial-tabs" role="tablist">
            ${routes.map(r => `
              <button type="button" role="tab" 
                aria-selected="${r.id === selected}" 
                class="${r.id === selected ? 'active' : ''}" 
                data-learning-path="${r.id}">
                ${esc(r.title)}
              </button>
            `).join('')}
          </div>

          <div id="learning-route-panel" role="tabpanel" style="margin-top: 16px;">
            <p class="editorial-path-intro" style="font-size: 13.5px; color: var(--muted); margin-bottom: 16px;">
              ${esc(track.intro)}
            </p>
            <div class="editorial-courses">
              ${track.cards.map(([title, description, metaText, url, cta], i) => `
                <article>
                  <span class="editorial-course-index">${String(i + 1).padStart(2, '0')}</span>
                  <p class="editorial-course-meta">${esc(metaText)}</p>
                  <h3>${esc(title)}</h3>
                  <p>${esc(description)}</p>
                  <a href="${esc(url)}">${esc(cta)} <span aria-hidden="true">→</span></a>
                </article>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- Local Learning Storage & Footer -->
        <footer class="editorial-end" style="border-top: 1px solid var(--line); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <span style="font-size: 12.5px; color: var(--muted);">
            🌱 学习记录自动保存在本机浏览器中，可随时在个人成果中查看与导出。
          </span>
          <a href="#my-learning" style="font-size: 13px; font-weight: 600; color: var(--accent);">
            查看我的学习成果与备份 →
          </a>
        </footer>
      </div>
    `;
  }

  function choose(id) {
    if (!routes.some(r => r.id === id)) return;
    selected = id;
    const node = document.querySelector('[data-learning-home]');
    if (node) {
      node.outerHTML = render(lastMeta);
      document.querySelector(`[data-learning-path="${id}"]`)?.focus();
    }
  }

  document.addEventListener('click', event => {
    const tab = event.target.closest('[data-learning-path]');
    if (tab) choose(tab.dataset.learningPath);
  });

  return { render };
})();
