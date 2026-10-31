/* Author: Lliftime. Curriculum overview composed from existing course data. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.LearningOverview = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const lessonLink = id => '#lesson?id=' + esc(encodeURIComponent(String(id)));
  function render({ trainingPlan = [], foundationCourses = [], textbookLessons = [], lessons = [] } = {}) {
    const days = Array.isArray(trainingPlan) ? trainingPlan : [];
    const units = days.reduce((sum, day) => sum + (Array.isArray(day.sessions) ? day.sessions.length : 0), 0);
    return `<div class="learn-overview" data-program-overview>
      <header class="overview-intro">
        <p class="overview-eyebrow">人工智能 · 自主学习指南</p>
        <h1>按目标规划你的 AI 实战学习旅程</h1>
        <p class="overview-lead">从直觉认知入门，到核心技术的交互实验台，再到端到端的小系统构建。先理解原理与示范，再动手验证。</p>
        <div class="overview-actions">
          <a class="btn" href="#lesson?id=ai-basics">开始基础资料学习</a>
          <a class="btn secondary" href="#labs">🔬 交互实验室</a>
        </div>
        <p class="overview-intro-note">循序渐进：先建立直觉，再做交互实验与练习。学习记录自动保存在当前浏览器。</p>
      </header>
      <section class="overview-system" aria-labelledby="overview-system-title">
        <h2 id="overview-system-title">清晰的 3 层能力阶梯</h2>
        <div class="overview-system-grid">
          <article>
            <span class="overview-stage">Level 1 · 直觉入门</span>
            <h3>${lessons.length} 节连续认知课</h3>
            <p>从任务选择、清楚表达，到事实核对、结果评价。每课先读示范，再按需练习并保存成果。</p>
            <a href="#pathways?anchor=overview-intro-lessons">查看入门课目录 ↓</a>
          </article>
          <article>
            <span class="overview-stage">Level 2 · 核心实验</span>
            <h3>交互实验室 &amp; 六章基础</h3>
            <p>通过滑块探索 Prompt 温度、RAG 切块与神经元边界，结合六章知识体系深化理解。</p>
            <a href="#labs">打开交互实验室 →</a>
          </article>
          <article>
            <span class="overview-stage">Level 3 · 场景贯穿</span>
            <h3>${textbookLessons.length} 篇专题与系统项目</h3>
            <p>深入数据清洗、知识库与工具流程，跑通通知整理器端到端真实小系统。</p>
            <a href="#system">查看贯穿项目 →</a>
          </article>
        </div>
      </section>
      <section class="overview-section" id="overview-system-project">
        <p class="overview-eyebrow">入门之后 · 架构、工程与流程</p>
        <h2>用同一个小系统，把学习连起来</h2>
        <p class="overview-section-description">从通知整理器出发，学习说清需求、划分职责、确认再保存、验证失败和交付版本。四阶段均提供资料、完整示范和站内实践；可导出自己的项目报告。</p>
        <a class="btn btn-secondary" href="#system">阅读贯穿项目的第一阶段 →</a>
      </section>
      <section class="overview-section" id="overview-intro-lessons" aria-labelledby="overview-intro-title">
        <p class="overview-eyebrow">第一步 · 资料与示范</p>
        <h2 id="overview-intro-title">从这 ${lessons.length} 节开始</h2>
        <p class="overview-section-description">建议依次学习。点击课程先进入资料阅读，读完再开始本课练习；已有基础也可以自由跳读。</p>
        <ol class="overview-lesson-list">
          ${lessons.map((lesson, i) => `<li><span class="overview-number">${String(i + 1).padStart(2, '0')}</span><div><h3><a href="${lessonLink(lesson.id)}">${esc(lesson.title)}</a></h3><p>${esc(lesson.subtitle || '')}</p><span class="overview-meta">资料 · 完整示范 · 练习${lesson.minutes ? ' · 参考 ' + esc(lesson.minutes) + ' 分钟' : ''}</span></div><a class="overview-read-link" href="${lessonLink(lesson.id)}" aria-label="阅读${esc(lesson.title)}">阅读资料 →</a></li>`).join('')}
        </ol>
      </section>
      <section class="overview-section" id="overview-foundations" aria-labelledby="overview-foundations-title">
        <p class="overview-eyebrow">第二步 · 系统理解</p>
        <h2 id="overview-foundations-title">六章基础，把概念连起来</h2>
        <p class="overview-section-description">与四节任务入门互为补充：这里按知识结构展开，涵盖机器学习、神经网络、语言模型与安全规范。</p>
        <div class="overview-foundation-grid">
          ${foundationCourses.map((course, i) => `<a class="overview-foundation" href="#courses?mode=foundations&amp;ch=${i}&amp;tab=learn"><span class="overview-stage">第 ${i + 1} 章</span><h3>${esc(course.title)}</h3><p>${esc(course.goal || course.subtitle || '')}</p><span class="overview-read-link">打开基础资料 →</span></a>`).join('')}
        </div>
      </section>
      <footer class="overview-footer">
        <h2>规划好路线后，从第一份资料开始</h2>
        <p>先看懂一个例子，再用交互实验与练习检验。随时返回这里切换不同学习模块。</p>
        <a class="btn" href="#lesson?id=ai-basics">开始基础资料学习</a>
      </footer>
    </div>`;
  }
  return { render };
});
