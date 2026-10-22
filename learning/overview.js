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
        <p class="overview-eyebrow">零基础学习指南</p>
        <h1>先读懂基础，再动手练习</h1>
        <p class="overview-lead">第一次来，从“认识 AI”的资料开始。先了解背景、原理与完整例子，再进入预测、尝试和迁移练习；不需要先答题证明自己。</p>
        <div class="overview-actions"><a class="btn" href="#lesson?id=ai-basics">开始基础资料学习</a><a class="btn secondary" href="#pathways?anchor=training-overview">先看16天培训大纲</a></div>
        <p class="overview-intro-note">16 天培训是集中安排参考，部分专题仍是大纲与任务说明，并涉及外部工具。你可以先读下面的入门资料，再按个人节奏深入。</p>
        <p class="overview-intro-note">本平台支持个人自学。入门资料与固定练习无需模型账号；学习记录保存在当前浏览器，可在“个人成果”备份。</p>
      </header>
      <section class="overview-system" aria-labelledby="overview-system-title">
        <h2 id="overview-system-title">先了解这套学习体系</h2>
        <div class="overview-system-grid">
          <article><span class="overview-stage">01 · 先入门</span><h3>${lessons.length} 节连续入门课</h3><p>从任务选择、清楚表达，到事实核对、结果评价。每课先读资料，再按需练习并保存个人成果。</p><a href="#pathways?anchor=overview-intro-lessons">查看入门资料目录 ↓</a></article>
          <article><span class="overview-stage">02 · 理解更深</span><h3>${foundationCourses.length} 章系统基础</h3><p>进一步理解机器学习、神经网络、大模型与安全。按章节读概念、原理和例子，再用章节练习检查理解。</p><a href="#pathways?anchor=overview-foundations">查看系统基础目录 ↓</a></article>
          <article><span class="overview-stage">03 · 按目标深入</span><h3>${textbookLessons.length} 篇专题教材与实践</h3><p>按需深入数据、检索、智能体和交付等主题，结合站内实践项目。无需把全部资源学完才开始应用。</p><a href="#courses?mode=textbook">打开专题教材</a></article>
        </div>
        <aside class="overview-scope"><h3>${days.length} 天 / ${units} 单元培训：集中安排参考</h3><p>培训大纲展示从通识到应用、数据与综合实操的集中安排，可在开始前了解全貌，也可按个人节奏选学。它与上面的资料目录是两种组织方式，不代表四节入门课或六章基础等同于 ${days.length} 天的全部教学。</p><p><strong>当前部分专题仍是大纲与任务说明</strong>，尚未补成完整独立自学课；部分实操涉及外部工具、安装环境或模型服务。大纲不是全部课程已经完成的承诺，也不规定自学者必须在 ${days.length} 天内学完。</p><a href="#pathways?anchor=training-overview">查看完整培训大纲 ↓</a></aside>
      </section>
      <section class="overview-section" id="overview-system-project"><p class="overview-eyebrow">入门之后 · 架构、工程与流程</p><h2>用同一个小系统，把学习连起来</h2><p class="overview-section-description">从通知整理器出发，学习说清需求、划分职责、确认再保存、验证失败和交付版本。四阶段均提供资料、完整示范和站内实践；无需编程或模型账号，可导出自己的项目报告。深入后端与模型接入仍是后续扩展。</p><a class="btn btn-secondary" href="#system">阅读贯穿项目的第一阶段 →</a></section>
      <section class="overview-section" id="overview-intro-lessons" aria-labelledby="overview-intro-title"><p class="overview-eyebrow">第一步 · 资料与示范</p><h2 id="overview-intro-title">从这 ${lessons.length} 节开始</h2><p class="overview-section-description">建议依次学习。点击课程先进入资料阅读，读完再开始本课练习；已有基础也可以自由跳读。</p><ol class="overview-lesson-list">${lessons.map((lesson, i) => `<li><span class="overview-number">${String(i + 1).padStart(2, '0')}</span><div><h3><a href="${lessonLink(lesson.id)}">${esc(lesson.title)}</a></h3><p>${esc(lesson.subtitle || '')}</p><span class="overview-meta">资料 · 完整示范 · 练习${lesson.minutes ? ' · 参考 ' + esc(lesson.minutes) + ' 分钟' : ''}</span></div><a class="overview-read-link" href="${lessonLink(lesson.id)}" aria-label="阅读${esc(lesson.title)}">阅读资料 →</a></li>`).join('')}</ol><p class="overview-caption">参考时长是自学安排提示，不是已验证的实际学习时长或达标证明。</p></section>
      <section class="overview-section" id="overview-foundations" aria-labelledby="overview-foundations-title"><p class="overview-eyebrow">第二步 · 系统理解</p><h2 id="overview-foundations-title">六章基础，把概念连起来</h2><p class="overview-section-description">与四节任务入门互为补充：这里按知识结构展开。先打开“学习”资料，之后再选择测验、回忆或实验，不把题目作为阅读门槛。</p><div class="overview-foundation-grid">${foundationCourses.map((course, i) => `<a class="overview-foundation" href="#courses?mode=foundations&amp;ch=${i}&amp;tab=learn"><span class="overview-stage">第 ${i + 1} 章</span><h3>${esc(course.title)}</h3><p>${esc(course.goal || course.subtitle || '')}</p><span class="overview-read-link">打开基础资料 →</span></a>`).join('')}</div></section>
      <section class="overview-section overview-training" id="training-overview" aria-labelledby="overview-training-title"><p class="overview-eyebrow">开始前可先了解全貌</p><h2 id="overview-training-title">${days.length} 天培训大纲</h2><p class="overview-section-description">以下保留现有大纲的实际日程与上午、下午主题。展开某天查看学习重点和预期产物，再决定是否进入专题。大纲中的集中培训、分组或交叉验收措辞属于原安排；个人自学时可改为独立制作、量规自检和个人成果记录，无需等待班级或教师。</p><div class="overview-preparation"><h3>开始专题前，先检查准备条件</h3><p>基础资料可直接在站内阅读。专题实践请根据当天的操作说明准备获准使用且已去除敏感信息的练习材料、对应工具与运行环境；需要外部账号、软件、设备或服务时，先核对可用性与费用，再选择是否实践。下面的预期产物帮助你判断要准备什么，不表示本站已提供所有工具或材料包。</p></div><div class="overview-days">${days.map(day => `<details class="overview-day" data-training-day="${esc(day.day)}"><summary><span class="overview-day-number">第 ${esc(day.day)} 天</span><span class="overview-day-heading"><strong>${esc(day.title)}</strong><span>${(day.sessions || []).map(s => `${esc(s.slot)} · ${esc(s.topic)}`).join('　/　')}</span></span><span class="overview-expand" aria-hidden="true">＋</span></summary><div class="overview-day-detail">${(day.sessions || []).map(session => `<article class="overview-session"><p class="overview-stage">${esc(session.slot)}</p><h3>${esc(session.topic)}</h3><dl><div><dt>学习重点</dt><dd>${esc(session.focus)}</dd></div><div><dt>操作与材料要求</dt><dd>${esc(session.description)}</dd></div><div><dt>预期产物</dt><dd>${esc(session.deliverable)}</dd></div></dl></article>`).join('')}<p class="overview-day-note">此处为原大纲摘要。可独立完成的部分按个人节奏实践；工具操作与完整教学内容以专题当前页面为准。</p><a class="overview-read-link" href="#courses?mode=training&amp;day=${esc(day.day)}">打开第 ${esc(day.day)} 天原大纲与练习 →</a></div></details>`).join('')}</div></section>
      <footer class="overview-footer"><h2>了解路线后，从第一份资料开始</h2><p>先读懂一个概念和一个例子，再用练习检验。你可以随时返回这里查看学习体系和培训安排。</p><a class="btn" href="#lesson?id=ai-basics">开始基础资料学习</a></footer>
    </div>`;
  }
  return { render };
});
