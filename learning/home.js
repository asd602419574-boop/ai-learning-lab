/* Editorial home: one current task, honest local progress, and goal-based discovery. */
const LearningHome = (() => {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let selected='foundation', lastMeta={}, onlyPaths=false;
  const routes = [
    {id:'foundation',title:'共同基础',intro:'从第一次可靠地使用 AI 开始，逐步看懂它怎样工作。',cards:[
      ['认识 AI，先选对任务','从六个具体情境判断哪些适合规则、AI 辅助或人工确认。','入门第 1 课 · 资料与练习','#lesson?id=ai-basics','阅读第1课资料'],
      ['把任务说清楚','把材料、目标、受众、格式和核验要求整理成可复用的任务说明。','入门第 2 课 · 资料与练习','#lesson?id=clear-task','阅读任务说明方法'],
      ['从回答到依据，可靠使用 AI','跟着通知找事实、保留未知，再独立完成自己的核对清单。','入门第 3 课 · 资料与练习','#lesson?id=reliable-ai','阅读事实核对方法']
    ]},
    {id:'application',title:'AI 日常应用',intro:'把说清任务、核对资料和整理成果变成可重复的方法。',cards:[
      ['把任务说清楚','从材料、目标和输出要求开始，把含糊需求修订为明确任务。','资料与练习 · 可保存作品','#lesson?id=clear-task','阅读任务说明方法'],
      ['给每个结论找到依据','在小知识库里检索，观察引用，遇到没有答案的问题保留未知。','本地检索项目 · 可导出','#projects?id=rag','动手找证据'],
      ['整理数据之前，先定义规则','理解缺失、重复和异常，保留原始资料并避免信息泄漏。','进阶阅读 · 含任务','#courses?mode=textbook&lesson=data-quality','阅读与核对']
    ]},
    {id:'building',title:'AI 项目构建',intro:'从可观察的小系统开始。已有教学沙箱可以直接运行，不需要配置模型。',cards:[
      ['训练并检查一个小分类器','使用教学样本训练朴素贝叶斯，观察独立测试结果，再输入自己的例子。','浏览器算法项目','#projects?id=ml','运行分类器'],
      ['让工具操作可控、可恢复','读日历、查冲突、确认再写入；所有变化只发生在本地教学沙箱。','本地状态实践','#projects?id=agent','尝试工具流程'],
      ['从一条功能走到完整交付','把通知整理成可核对的清单，体验设计、保存、异常验证和版本交付。','四阶段贯穿项目 · 零编程可学','#system','从资料与示范开始']
    ]},
    {id:'advanced',title:'架构 · 工程 · 流程',intro:'同一个通知整理器，贯穿设计、保存、验证与交付。先读资料，再做站内实践。',cards:[
      ['架构：从需求到系统边界','画清输入、校验、确认与保存的职责，说明为什么先用可核对的规则。','贯穿项目 · 第1阶段','#system?stage=brief','阅读架构示范'],
      ['工程：跑通保存与失败恢复','按原文填清单，实际检查缺失、重复、确认和保存后读回。','贯穿项目 · 第2–3阶段','#system?stage=build','开始功能实践'],
      ['流程：带着证据交付版本','用固定例子验收，写下改进与限制，保存个人版本并导出作品。','贯穿项目 · 第4阶段','#system?stage=deliver','了解交付与复盘']
    ]}
  ];
  const artifactTitles={'ai-basics':'一份 AI 任务选择清单','clear-task':'一份可复用的任务说明','reliable-ai':'一份有依据的核对清单','evaluate-results':'一份结果评价与修订清单'};
  const headlines={'ai-basics':'先看清任务，<br>再选择 AI。','clear-task':'把一个想法，<br>说成可做的任务。','reliable-ai':'从一个回答，<br>找到它的依据。','evaluate-results':'看懂一个结果，<br>怎样才算好。'};
  function focusCard(content,current,allDone,isNew){
    const readFirst=!current.started&&!allDone;
    const steps=readFirst?`<ol class="editorial-steps editorial-study-steps" aria-label="先学习后练习">${['了解课程安排','阅读基础资料','看懂完整示范','进入配套练习'].map((title,i)=>`<li class="${i===0?'current':''}"><span>${i+1}</span>${title}</li>`).join('')}</ol>`:`<ol class="editorial-steps" aria-label="练习步骤">${content.steps.map((step,i)=>`<li class="${i===current.step?'current':''}"><span>${i+1}</span>${esc(step.title)}</li>`).join('')}</ol>`;
    const href=readFirst?'#pathways':'#lesson?id='+esc(content.id)+(allDone?'':'&view=practice');
    const action=`<div class="editorial-focus-bottom"><a href="${href}" class="btn" data-learning-start>${readFirst?'了解课程安排，开始基础学习':allDone?'回顾入门资料':'继续本节练习'} <span aria-hidden="true">→</span></a><span>${readFirst?'先了解课程，再从第1课资料开始':`本课约 ${content.minutes} 分钟 · 可以分几次学完`}</span></div>`;
    return `<article class="editorial-focus" ${isNew?'data-newcomer-home':''}><div class="editorial-overline">${readFirst?'零基础起点 · 先学资料，再做练习':allDone?'四课任务已完成 · 随时回来复练':'继续上次的探索'}</div><h2>${readFirst?'先看课程安排，<br>再从基础学起。':headlines[content.id]||esc(content.title)}</h2><p class="editorial-lead">${readFirst?'第1课：认识 AI':esc(content.title)}</p><p class="editorial-intro">${readFirst?'先了解课程与16天培训安排，再学习背景、原理、案例和完整示范。理解之后，再进入配套练习。':esc(content.subtitle)}</p>${readFirst?action+steps:steps+action}</article>`;
  }
  function newcomerGuide(){
    return `<aside class="editorial-growth editorial-onboarding" aria-label="零基础学习顺序"><div class="editorial-overline">先知道学什么，再开始学</div><h2>先学资料，理解后练习。</h2><ol class="editorial-onboarding-order"><li><span>先看</span><div><h3>课程说明与16天培训安排</h3><p>16天 / 32单元是集中培训参考；先了解每天主题、所需工具和学习范围。</p><a href="#pathways?anchor=training-overview">查看完整16天培训大纲 →</a></div></li><li><span>学习</span><div><h3>4节入门资料 → 六章系统基础</h3><p>先读概念、背景、原理与示范，再按章节深入。教材可随时查阅。</p></div></li><li><span>巩固</span><div><h3>配套练习与实践项目</h3><p>学完一节后再检验理解，按反馈修订并保存自己的成果。</p></div></li></ol><a class="editorial-foundations-link" href="#courses?mode=foundations&ch=0&tab=learn">已有基础？直接进入六章系统基础 →</a><p class="editorial-note">四节入门课可直接自学；16天部分专题目前仍以大纲和任务说明为主，外部工具实践按需准备。</p></aside>`;
  }
  function growthCard(s,content){
    return `<aside class="editorial-growth"><div class="editorial-overline">属于你的学习积累</div><h2>进步，留得下来。</h2><div class="editorial-metrics"><div><strong>${s.artifactCount}</strong><span>已保存作品</span></div><div><strong>${s.passedCount}</strong><span>字段检查通过</span></div><div><strong>${s.hints}</strong><span>提示使用记录</span></div></div><div class="editorial-recent"><span>${s.lastArtifactTitle?'最近作品':'你的第一份成果'}</span><h3>${esc(s.lastArtifactTitle||artifactTitles[content.id])}</h3><p>${s.lastArtifactTitle?'回看原材料、修改记录和自检说明，看到自己怎样一步步做得更好。':'每课都能留下任务材料、自己的判断和修订记录。现在还没有作品，保存后会在这里出现。'}</p><a href="#my-learning">${s.lastArtifactTitle?'查看我的成果':'了解作品与备份'} <span aria-hidden="true">↗</span></a></div><p class="editorial-note">记录描述已发生的练习与保存，不自动推断掌握程度。</p></aside>`;
  }
  function sequence(courses,summary){
    const progress=summary.lessons||[];
    return `<section class="editorial-sequence" aria-labelledby="sequence-title"><div class="editorial-section-head"><div><span class="editorial-kicker">第1阶段 · 4节零基础入门课</span><h2 id="sequence-title">从第1课开始，按顺序往下学</h2></div><div class="editorial-sequence-progress" data-pathway-progress>课程任务完成 <strong>${summary.completedCount||0} / ${courses.length}</strong></div></div><ol class="editorial-sequence-list">${courses.map((course,i)=>{const item=progress.find(l=>l.id===course.id)||{},label=item.completed?'课程任务已完成':item.artifactCount?'已有作品 · 可继续完善':item.started?'进行中 · 可以续学':'尚未开始';return `<li data-pathway-lesson="${esc(course.id)}"><span class="editorial-sequence-index">${String(i+1).padStart(2,'0')}</span><div><h3><a href="#lesson?id=${esc(course.id)}">${esc(course.title)}</a></h3><p>${esc(label)} · 约 ${course.minutes} 分钟</p></div><a class="editorial-sequence-action" href="#lesson?id=${esc(course.id)}" aria-label="${item.completed?'回看':item.started?'继续':'开始'}第${i+1}课：${esc(course.title)}">${item.completed?'回看':item.started?'继续':'开始本课'} <span aria-hidden="true">→</span></a></li>`;}).join('')}</ol><p class="editorial-sequence-follow">入门之后：<a href="#courses?mode=foundations&ch=0&tab=learn">进入第2阶段 · 六章系统基础 →</a></p><p class="editorial-note">课程任务完成表示迁移作品通过字段规则并完成解释、复盘与自评，不自动推断知识掌握。已了解基础的学员也可以选课进入。</p></section>`;
  }
  function render(meta={}, pathsOnly=false) {
    lastMeta=meta;onlyPaths=pathsOnly;
    const s=typeof LearningWorkspace!=='undefined'?LearningWorkspace.summary():{step:0,artifactCount:0,attemptCount:0,passedCount:0,hints:0};
    const courses=typeof LearningCatalog!=='undefined'?LearningCatalog.list():[LearningContent];
    const content=courses.find(c=>c.id===s.nextLessonId)||courses[0];
    const current=(s.lessons||[]).find(l=>l.id===content.id)||s;
    const allDone=(s.completedCount||0)===courses.length;
    const isNew=!s.started&&!meta.hasLegacyProgress;
    const track=routes.find(x=>x.id===selected)||routes[0];
    return `<div class="learning-home ${isNew?'editorial-newcomer':''}" data-learning-home>
      <header class="editorial-welcome"><div><span class="editorial-kicker">${isNew?'零基础入门 · 无需编程基础':'一点理解，一次尝试，一份自己的成果'}</span><h1>${pathsOnly?'基础学习，从这里开始。':isNew?'第一次学 AI？从这里开始。':'继续你的 AI 学习。'}</h1><p>${isNew?'先了解课程和16天培训安排，再从第1课资料开始。读懂背景与原理后，再做练习。':'可以继续上次的课程，也可以按下面的阶段补课、深入学习。'}</p></div>${isNew?'<span class="editorial-local"><span class="editorial-dot"></span>无需注册 · 随时开始</span>':'<a class="editorial-local" href="#my-learning"><span class="editorial-dot"></span>个人学习空间 · 本机保存</a>'}</header>
      ${pathsOnly?(isNew?'<p class="editorial-path-start"><a class="btn" href="#lesson?id=ai-basics" data-learning-start>从第1课开始：认识 AI →</a><span>先完成四课入门，再进入六章系统基础。</span></p>':''):`<section class="editorial-hero" aria-label="${isNew?'零基础学习起点与顺序':'当前任务与个人成长'}">${focusCard(content,current,allDone,isNew)}${isNew?newcomerGuide():growthCard(s,content)}</section>`}
      ${sequence(courses,s)}
      <section class="editorial-pathways" aria-labelledby="learning-paths-title"><div class="editorial-section-head"><div><span class="editorial-kicker">学完入门后，按需要查看</span><h2 id="learning-paths-title">补课与深入的学习方向</h2></div><a href="#courses?mode=textbook">查看全部教材 ↗</a></div><div class="editorial-tabs" role="tablist" aria-label="学习路线">${routes.map(r=>`<button type="button" role="tab" aria-selected="${r.id===selected}" tabindex="${r.id===selected?'0':'-1'}" aria-controls="learning-route-panel" data-learning-path="${r.id}">${esc(r.title)}</button>`).join('')}</div><div id="learning-route-panel" role="tabpanel" aria-label="${esc(track.title)}"><p class="editorial-path-intro">${esc(track.intro)}</p><div class="editorial-courses">${track.cards.map(([title,description,meta,url,cta],i)=>`<article><span class="editorial-course-index">${String(i+1).padStart(2,'0')}</span><p class="editorial-course-meta">${esc(meta)}</p><h3>${esc(title)}</h3><p>${esc(description)}</p><a href="${esc(url)}">${esc(cta)} <span aria-hidden="true">→</span></a></article>`).join('')}</div></div></section>
      <section class="editorial-library" aria-labelledby="learning-library-title"><div class="editorial-section-head"><div><span class="editorial-kicker">按需要深入</span><h2 id="learning-library-title">你的自主学习资源架</h2></div><span class="editorial-note">从原理、练习到实践</span></div><div class="editorial-resources">${[
        ['知','深入教材',`${meta.lessons||12} 篇原创教材，理解机制、例子与失败边界。`,'#courses?mode=textbook','阅读教材'],
        ['练','六章系统基础',`按章节学习概念与原理，配合 ${meta.questions||144} 道基础题、回忆卡和错题巩固。`,'#courses?mode=foundations&ch=0&tab=learn','进入基础'],
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
