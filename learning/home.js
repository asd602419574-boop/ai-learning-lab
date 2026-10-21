/* Editorial home: one current task, honest local progress, and goal-based discovery. */
const LearningHome = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected='foundation', lastMeta={}, onlyPaths=false;
  const routes = [
    {id:'foundation',title:'共同基础',intro:'从第一次可靠地使用 AI 开始，逐步看懂它怎样工作。',cards:[
      ['认识 AI，先选对任务','从六个具体情境判断哪些适合规则、AI 辅助或人工确认。','入门第 1 课 · 完整互动课','#lesson?id=ai-basics','开始实作'],
      ['把任务说清楚','把材料、目标、受众、格式和核验要求整理成可复用的任务说明。','入门第 2 课 · 完整互动课','#lesson?id=clear-task','完善任务说明'],
      ['从回答到依据，可靠使用 AI','跟着通知找事实、保留未知，再独立完成自己的核对清单。','入门第 3 课 · 完整互动课','#lesson?id=reliable-ai','动手核对']
    ]},
    {id:'application',title:'AI 日常应用',intro:'把说清任务、核对资料和整理成果变成可重复的方法。',cards:[
      ['把任务说清楚','从材料、目标和输出要求开始，把含糊需求修订为明确任务。','完整互动课 · 可保存作品','#lesson?id=clear-task','完善任务说明'],
      ['给每个结论找到依据','在小知识库里检索，观察引用，遇到没有答案的问题保留未知。','本地检索项目 · 可导出','#projects?id=rag','动手找证据'],
      ['整理数据之前，先定义规则','理解缺失、重复和异常，保留原始资料并避免信息泄漏。','进阶阅读 · 含任务','#courses?mode=textbook&lesson=data-quality','阅读与核对']
    ]},
    {id:'building',title:'AI 项目构建',intro:'从可观察的小系统开始。已有教学沙箱可以直接运行，不需要配置模型。',cards:[
      ['训练并检查一个小分类器','使用教学样本训练朴素贝叶斯，观察独立测试结果，再输入自己的例子。','浏览器算法项目','#projects?id=ml','运行分类器'],
      ['让工具操作可控、可恢复','读日历、查冲突、确认再写入；所有变化只发生在本地教学沙箱。','本地状态实践','#projects?id=agent','尝试工具流程'],
      ['从一条功能走到完整交付','查看页面、API、数据保存与交付任务，按说明完成外部实践。','培训任务说明 · 正文逐步补充','#courses?mode=training&day=8','查看任务']
    ]},
    {id:'advanced',title:'架构 · 工程 · 流程',intro:'用已有教材建立进阶起点；完整连续进阶课将依据项目任务逐步补齐。',cards:[
      ['架构：从需求到系统边界','先明确输入、输出、约束和方案取舍，再思考模型应该放在哪里。','已有教材 · 架构起点','#courses?mode=textbook&lesson=ai-systems','理解系统'],
      ['工程：怎样知道可以交付','从固定样例、版本、运行方式和失败恢复理解可靠交付。','已有教材 · 工程起点','#courses?mode=textbook&lesson=ai-release','查看交付方法'],
      ['流程：让工具守住边界','把外部材料当资料，核对权限和确认，理解安全的工具操作流程。','已有教材 · 流程起点','#courses?mode=textbook&lesson=prompt-injection','学习工具边界']
    ]}
  ];
  const artifactTitles={'ai-basics':'一份 AI 任务选择清单','clear-task':'一份可复用的任务说明','reliable-ai':'一份有依据的核对清单','evaluate-results':'一份结果评价与修订清单'};
  const headlines={'ai-basics':'先看清任务，<br>再选择 AI。','clear-task':'把一个想法，<br>说成可做的任务。','reliable-ai':'从一个回答，<br>找到它的依据。','evaluate-results':'看懂一个结果，<br>怎样才算好。'};
  function sequence(courses,summary){
    const progress=summary.lessons||[];
    return `<section class="editorial-sequence" aria-labelledby="sequence-title"><div class="editorial-section-head"><div><span class="editorial-kicker">共同基础 · 四课连续实践</span><h2 id="sequence-title">从认识 AI，到独立判断结果</h2></div><div class="editorial-sequence-progress" data-pathway-progress>课程任务完成 <strong>${summary.completedCount||0} / ${courses.length}</strong></div></div><ol class="editorial-sequence-list">${courses.map((course,i)=>{const item=progress.find(l=>l.id===course.id)||{},label=item.completed?'课程任务已完成':item.artifactCount?'已有作品 · 可继续完善':item.started?'进行中 · 可以续学':'尚未开始';return `<li data-pathway-lesson="${esc(course.id)}"><span class="editorial-sequence-index">${String(i+1).padStart(2,'0')}</span><div><h3><a href="#lesson?id=${esc(course.id)}">${esc(course.title)}</a></h3><p>${esc(label)} · 约 ${course.minutes} 分钟</p></div><a class="editorial-sequence-action" href="#lesson?id=${esc(course.id)}">${item.completed?'回看':item.started?'继续':'开始'} <span aria-hidden="true">→</span></a></li>`;}).join('')}</ol><p class="editorial-note">课程任务完成表示迁移作品通过字段规则并完成解释、复盘与自评，不自动推断知识掌握。四课均可独立进入。</p></section>`;
  }
  function render(meta={}, pathsOnly=false) {
    lastMeta=meta;onlyPaths=pathsOnly;
    const s=typeof LearningWorkspace!=='undefined'?LearningWorkspace.summary():{step:0,artifactCount:0,attemptCount:0,passedCount:0,hints:0};
    const courses=typeof LearningCatalog!=='undefined'?LearningCatalog.list():[LearningContent];
    const content=courses.find(c=>c.id===s.nextLessonId)||courses[0];
    const current=(s.lessons||[]).find(l=>l.id===content.id)||s;
    const allDone=(s.completedCount||0)===courses.length;
    const steps=content?.steps||[];
    const track=routes.find(x=>x.id===selected)||routes[0];
    return `<div class="learning-home" data-learning-home>
      <header class="editorial-welcome"><div><span class="editorial-kicker">一点理解，一次尝试，一份自己的成果</span><h1>${pathsOnly?'选择适合你的学习路径':'学懂 AI，也用好 AI。'}</h1><p>${pathsOnly?'共同基础之后，按目标选择日常应用、项目构建或进阶。':'从一个具体问题出发。在尝试、核对和改进中，建立可靠使用 AI 的方法。'}</p></div><a class="editorial-local" href="#my-learning"><span class="editorial-dot"></span>个人学习空间 · 本机保存</a></header>
      ${pathsOnly?'':`<section class="editorial-hero" aria-label="当前任务与个人成长"><article class="editorial-focus"><div class="editorial-overline">${allDone?'四课任务已完成 · 随时回来复练':current.started?'继续上次的探索':'从这里开始 · 无需编程或密钥'}</div><h2>${headlines[content.id]||esc(content.title)}</h2><p class="editorial-lead">${esc(content.title)}</p><p class="editorial-intro">${esc(content.subtitle)}</p><ol class="editorial-steps">${steps.map((step,i)=>`<li class="${i===current.step?'current':''}"><span>${i+1}</span>${esc(step.title)}</li>`).join('')}</ol><div class="editorial-focus-bottom"><a href="#lesson?id=${esc(content.id)}" class="btn" data-learning-start>${allDone?'回顾入门课程':current.started?'继续本节实作':'开始第一份实作'} <span aria-hidden="true">→</span></a><span>约 ${content?.minutes||30} 分钟 · 可以随时暂停</span></div></article>
      <aside class="editorial-growth"><div class="editorial-overline">属于你的学习积累</div><h2>进步，留得下来。</h2><div class="editorial-metrics"><div><strong>${s.artifactCount}</strong><span>已保存作品</span></div><div><strong>${s.passedCount}</strong><span>字段检查通过</span></div><div><strong>${s.hints}</strong><span>提示使用记录</span></div></div><div class="editorial-recent"><span>${s.lastArtifactTitle?'最近作品':'你的第一份成果'}</span><h3>${esc(s.lastArtifactTitle||artifactTitles[content.id])}</h3><p>${s.lastArtifactTitle?'回看原材料、修改记录和自检说明，看到自己怎样一步步做得更好。':'每课都能留下任务材料、自己的判断和修订记录。现在还没有作品，保存后会在这里出现。'}</p><a href="#my-learning">${s.lastArtifactTitle?'查看我的成果':'了解作品与备份'} <span aria-hidden="true">↗</span></a></div><p class="editorial-note">记录描述已发生的练习与保存，不自动推断掌握程度。</p></aside></section>`}
      ${sequence(courses,s)}
      <section class="editorial-pathways" aria-labelledby="learning-paths-title"><div class="editorial-section-head"><div><span class="editorial-kicker">有顺序，也有选择</span><h2 id="learning-paths-title">找到你的下一步</h2></div><a href="#courses?mode=textbook">查看全部教材 ↗</a></div><div class="editorial-tabs" role="tablist" aria-label="学习路线">${routes.map(r=>`<button type="button" role="tab" aria-selected="${r.id===selected}" tabindex="${r.id===selected?'0':'-1'}" aria-controls="learning-route-panel" data-learning-path="${r.id}">${esc(r.title)}</button>`).join('')}</div><div id="learning-route-panel" role="tabpanel" aria-label="${esc(track.title)}"><p class="editorial-path-intro">${esc(track.intro)}</p><div class="editorial-courses">${track.cards.map(([title,description,meta,url,cta],i)=>`<article><span class="editorial-course-index">${String(i+1).padStart(2,'0')}</span><p class="editorial-course-meta">${esc(meta)}</p><h3>${esc(title)}</h3><p>${esc(description)}</p><a href="${esc(url)}">${esc(cta)} <span aria-hidden="true">→</span></a></article>`).join('')}</div></div></section>
      <section class="editorial-library" aria-labelledby="learning-library-title"><div class="editorial-section-head"><div><span class="editorial-kicker">按需要深入</span><h2 id="learning-library-title">你的自主学习资源架</h2></div><span class="editorial-note">从原理、练习到实践</span></div><div class="editorial-resources">${[
        ['知','系统教材',`${meta.lessons||12} 篇原创教材，理解机制、例子与失败边界。`,'#courses?mode=textbook','阅读教材'],
        ['练','基础与复习',`${meta.questions||144} 道基础题，配合回忆卡和错题巩固。`,'#courses?mode=foundations&ch=0&tab=learn','进入基础'],
        ['做','浏览器实践',`${meta.projects||4} 个本地项目，计算、观察并导出结果。`,'#projects','动手实践'],
        ['拓','培训专题',`${meta.sessions||32} 个单元的任务说明，完整讲解逐步补充。`,'#courses?mode=training&day=1','查看专题']
      ].map(([icon,title,description,url,cta])=>`<article><span class="editorial-resource-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${esc(description)}</p><a href="${url}">${cta} ↗</a></article>`).join('')}</div></section><footer class="editorial-end"><span>按自己的节奏学习。每一次核对和修订，都是成果的一部分。</span><a href="#my-learning">管理记录与备份 →</a></footer></div>`;
  }
  function choose(id) {
    if(!routes.some(r=>r.id===id))return;
    selected=id;
    const node=document.querySelector('[data-learning-home]');
    if(node){node.outerHTML=render(lastMeta,onlyPaths);document.querySelector(`[data-learning-path="${id}"]`)?.focus();}
  }
  document.addEventListener('click',event=>{const tab=event.target.closest('[data-learning-path]');if(tab)choose(tab.dataset.learningPath);});
  document.addEventListener('keydown',event=>{const tab=event.target.closest('[data-learning-path]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const i=routes.findIndex(r=>r.id===tab.dataset.learningPath),n=event.key==='Home'?0:event.key==='End'?routes.length-1:(i+(event.key==='ArrowRight'?1:-1)+routes.length)%routes.length;choose(routes[n].id);});
  return {render};
})();
