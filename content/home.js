/* Home discovery reuses existing course metadata and learning state; no new storage key. */
const HomeContent = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const link = (route, label) => `<a href="${escape(route)}">${escape(label)} <span aria-hidden="true">→</span></a>`;
  function render() {
    const lessons = HOME_LESSONS;
    const reading = Textbook.getState();
    const projects = ProjectLab.getProjects(), flags = ProjectLab.getProgress();
    const completed = lessons.filter(l => reading[l.id]?.completed).length;
    const due = dueIds().length, wrong = activeWrongIds().length;
    const next = lessons.find(l => !reading[l.id]?.completed);
    const nextDay = TRAINING_PLAN.find(day => !trCompleted(day.day));
    const todos = [
      { title: '到期回忆卡', text: due ? `${due} 张待复习，先尝试回忆再查看答案。` : '当前没有到期卡片，可以主动复习。', url:'#practice?mode=review', cta:'进入复习' },
      { title: '错题巩固', text: wrong ? `${wrong} 道基础题待巩固，重新答对后移出待练列表。` : '当前没有待巩固基础错题，可进入练习积累记录。', url:'#practice?mode=wrong', cta:'查看错题' },
      { title: '下一篇教材', text: next ? `${next.title} · 建议 ${next.mins} 分钟` : '教材已全部标记已读，可返回目录复习。', url:next ? `#courses?mode=textbook&lesson=${next.id}`:'#courses?mode=textbook', cta:'开始阅读' },
      { title:'培训下一步', text:nextDay ? `第 ${nextDay.day} 天 · ${nextDay.title}`:'16 天任务均已确认，可再次复盘交付物。', url:`#courses?mode=training&day=${nextDay?.day || 1}`, cta:'查看任务' }
    ];
    return `<section class="home-detail-section" aria-labelledby="home-todo-title">
      <div class="home-section-head"><h2 class="home-section-title" id="home-todo-title">我的学习待办</h2><span class="home-section-subtitle">来自本机记录，不自动推断掌握程度</span></div>
      <div class="home-todos">${todos.map(t=>`<article><h3>${t.title}</h3><p>${escape(t.text)}</p>${link(t.url,t.cta)}</article>`).join('')}</div>
    </section>
    <div class="home-curriculum-grid">
      <section class="home-detail-section" aria-labelledby="home-catalog-title">
        <div class="home-section-head"><h2 class="home-section-title" id="home-catalog-title">系统教材与工程进阶</h2><span class="home-section-subtitle">${completed} / ${lessons.length} 篇已读 · 含 4 篇新增专题</span></div>
        <p class="home-section-description">先理解原理，再手算例子与完成自测。前置知识是学习建议，可以自由进入。</p>
        <div class="home-lesson-list">${lessons.map((l,i)=>`<article class="home-lesson-row">
          <span class="home-lesson-index">${String(i+1).padStart(2,'0')}</span>
          <div><div class="home-lesson-meta">${escape(l.group)} · ${l.mins} 分钟${i>=8?' · 新课':''}</div><h3>${escape(l.title)}</h3><p>前置：${escape(l.prereq)} · ${l.lab?'含计算实验':'含案例与课后任务'} · 2 道自测</p></div>
          <div class="home-lesson-action"><span>${reading[l.id]?.completed?'已读':reading[l.id]?.opened?'阅读中':'待学习'}</span>${link(`#courses?mode=textbook&lesson=${l.id}`,'阅读')}</div>
        </article>`).join('')}</div>
      </section>
      <section class="home-detail-section" aria-labelledby="home-training-title">
        <div class="home-section-head"><h2 class="home-section-title" id="home-training-title">16 天培训路线</h2><span class="home-section-subtitle">32 个任务单元 · 64 道专项题</span></div>
        <p class="home-section-description">每一天都有具体任务和交付物。展开查看要求，再进入课程完成实操与练习。</p>
        <ol class="home-training-list">${TRAINING_PLAN.map(d=>`<li><details>
          <summary><span class="home-lesson-index">${String(d.day).padStart(2,'0')}</span><span><strong>${escape(d.title)}</strong><small>${trCompleted(d.day)?'任务已确认':Number(trSaved.best[d.day]||0)>=3?'练习已达标':'待学习'} · ${escape(d.sessions.map(s=>s.topic).join(' / '))}</small></span></summary>
          <div class="home-training-detail">${d.sessions.map(s=>`<p><strong>${escape(s.slot)} · ${escape(s.topic)}</strong><br>${escape(s.description)}<br><span>交付：${escape(s.deliverable)}</span></p>`).join('')}${link(`#courses?mode=training&day=${d.day}`,`进入第 ${d.day} 天`)}</div>
        </details></li>`).join('')}</ol>
      </section>
    </div>
    <section class="home-detail-section" aria-labelledby="home-projects-title">
      <div class="home-section-head"><h2 class="home-section-title" id="home-projects-title">实战项目：做出可检查的成果</h2><span class="home-section-subtitle">浏览器本地教学沙箱</span></div>
      <div class="home-project-catalog">${projects.map(p=>`<article><div class="home-lesson-meta">${escape(p.level)} · ${flags[p.id]?'项目已达标':'待完成'}</div><h3>${escape(p.title)}</h3><p>${escape(p.desc)}</p><div class="home-project-output"><strong>交付成果</strong><p>${escape(p.out)}</p></div><ol>${p.steps.map(s=>`<li>${escape(s)}</li>`).join('')}</ol>${link(`#projects?id=${p.id}`,'进入项目')}</article>`).join('')}</div>
    </section>
    <section class="home-detail-section" aria-labelledby="home-resources-title">
      <div class="home-section-head"><h2 class="home-section-title" id="home-resources-title">继续学习：精选公开资源</h2><span class="home-section-subtitle">站外资源 · 不计入本站完成进度</span></div>
      <div class="home-resources">${[
        ['Microsoft AI for Beginners','https://github.com/microsoft/AI-For-Beginners','按课程、实验和测验继续学习 AI 基础。','对应：AI 系统、机器学习评估、神经网络'],
        ['动手学深度学习','https://zh.d2l.ai/','中文讲解配合数学、代码与练习，适合深入原理。','对应：梯度下降、注意力与 Transformer'],
        ['Microsoft 生成式 AI 入门','https://github.com/microsoft/generative-ai-for-beginners','继续学习生成式应用的构建方法与练习。','对应：Prompt、RAG、Agent 与上线评估'],
        ['scikit-learn 常见陷阱','https://scikit-learn.org/stable/common_pitfalls.html','通过错误和正确示例理解预处理与数据泄漏。','对应：数据清洗、评估与训练测试隔离']
      ].map(([title,url,desc,map])=>`<article><h3><a href="${url}" target="_blank" rel="noopener noreferrer">${title} ↗</a></h3><p>${desc}</p><small>${map}</small></article>`).join('')}</div>
    </section>`;
  }
  return { render };
})();
