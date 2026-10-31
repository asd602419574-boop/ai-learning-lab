/* V1.5 Refactored: 16-stage scenario-driven AI practical workshop.
   Uses independent storage key: ai_training_16day_v1 & ai_training_practice_v1
*/
const TR_STORE = 'ai_training_16day_v1';
const trStorage = typeof LearningStorage !== 'undefined' ? LearningStorage.storage : localStorage;
let trSaved = { completed: {}, best: {}, stats: {} };

try {
  const v = JSON.parse(trStorage.getItem(TR_STORE) || 'null');
  if (v && typeof v === 'object') {
    for (const k of ['completed', 'best', 'stats']) {
      if (v[k] && typeof v[k] === 'object' && !Array.isArray(v[k])) trSaved[k] = v[k];
    }
  }
} catch (e) {}

const trQuestions = new Map(TRAINING_PLAN.flatMap(day => day.questions.map(q => [q.id, { ...q, day: day.day }])));
const trState = { day: 1, mode: 'lesson', type: 'day', ids: [], index: 0, selected: null, checked: false, answers: [], finished: false };
const trEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const trSave = () => {
  try {
    trStorage.setItem(TR_STORE, JSON.stringify(trSaved));
  } catch (e) {
    console.warn('培训课程进度保存失败', e);
  }
};

const trPending = () => [...trQuestions.keys()].filter(id => trSaved.stats[id]?.needsReview);
const trCompleted = d => Boolean(trSaved.completed[`${d}-0`] && trSaved.completed[`${d}-1`] && Number(trSaved.best[d] || 0) >= 3);

const TR_STAGE_SHORT_NAMES = [
  '通识与对比', '自动编码实操', '本地模型部署', 'RAG知识库',
  '智能体基础', '智能体进阶', '前端生成测试', '后端接口存储',
  '文件自动化', '短剧生成管线', '智能办公纪要', '数据清洗校验',
  '标注规范入门', '预处理与增强', 'BadCase治理', '综合交付验收'
];

function renderTraining() {
  const d = TRAINING_PLAN[trState.day - 1];
  const halfCount = Object.values(trSaved.completed).filter(Boolean).length;
  const passDays = TRAINING_PLAN.filter(x => Number(trSaved.best[x.day] || 0) >= 3).length;
  const completedDays = TRAINING_PLAN.filter(x => trCompleted(x.day)).length;

  const header = `
    <div class="tr-lead">
      <div>
        <div class="eyebrow">AI TRAINING WORKSHOP · 16 阶段进阶工坊</div>
        <h3>16 阶段实操与自检</h3>
        <p>按场景实践与自检 · 单元完成由学员自确认 · 不等于自动验收</p>
      </div>
      <span aria-hidden="true">🛠️</span>
    </div>

    <div class="tr-stats">
      <div>
        <b>${halfCount}<small> / 32</small></b>
        <span>学员自确认单元</span>
      </div>
      <div>
        <b>${passDays}<small> / 16</small></b>
        <span>阶段练习达标</span>
      </div>
      <div>
        <b>${completedDays}<small> / 16</small></b>
        <span>练习达标且自确认阶段</span>
      </div>
      <div>
        <b>${trPending().length}</b>
        <span>待复练错题</span>
      </div>
    </div>

    <div class="tr-toolbar">
      <button data-action="tr-lessons">📖 阶段实训</button>
      <button data-action="tr-wrong">📝 错题复练 (${trPending().length})</button>
      <small>保存在当前浏览器 · 跨标签作答需切换接管</small>
    </div>

    <div class="tr-days">
      ${TRAINING_PLAN.map(x => {
        const isDone = trCompleted(x.day);
        const isPassed = Number(trSaved.best[x.day] || 0) >= 3;
        const statusClass = isDone ? 'status-done' : isPassed ? 'status-passed' : '';
        const statusText = isDone ? '✓ 已自确认且练习达标' : isPassed ? '练习达标' : '待探索';
        return `
          <button data-action="tr-day" data-day="${x.day}" class="${trState.day === x.day ? 'active' : ''}" aria-pressed="${trState.day === x.day}">
            <strong>${String(x.day).padStart(2, '0')}</strong>
            <small class="${statusClass}">${statusText}</small>
          </button>
        `;
      }).join('')}
    </div>
  `;

  if (trState.mode === 'quiz') return header + trQuizView();
  if (trState.mode === 'wrong') return header + trWrongView();

  const isDayDone = trCompleted(d.day);

  return header + `
    <div class="tr-day-heading">
      <div>
        <small>STAGE ${String(d.day).padStart(2, '0')} / 16 · ${TR_STAGE_SHORT_NAMES[d.day - 1]}</small>
        <h3>第 ${d.day} 阶段 · ${trEsc(d.title)}</h3>
        <p>每个实战单元：先理解，再按成果要求实践与自检，最后完成四题练习。实操完成仅由学员自确认，不是平台自动验收。</p>
      </div>
      <span class="${isDayDone ? 'completed' : ''}">${isDayDone ? '✓ 已自确认且练习达标' : '正在挑战中'}</span>
    </div>

    <div class="tr-sessions">
      ${d.sessions.map((s, i) => {
        const isDone = Boolean(trSaved.completed[`${d.day}-${i}`]);
        const unitTitle = i === 0 ? '单元 A · 核心机制与探索' : '单元 B · 场景实战与交付';
        return `
          <article>
            <div class="tr-session-heading">
              <span>${unitTitle}</span>
              <div>
                <h4>${trEsc(s.topic)}</h4>
                <small>${trEsc(s.module || d.title)}</small>
              </div>
            </div>

            <section>
              <b>🧩 核心机制与考量</b>
              <p>${trEsc(s.guide)}</p>
            </section>

            ${renderTrainingInsight(d.day, i)}

            <details>
              <summary>📒 任务详情与材料要求</summary>
              <div>
                ${trEsc(s.description)}
                ${s.focus ? `<p class="tr-muted" style="margin-top:6px;">教学重点：${trEsc(s.focus)}</p>` : ''}
              </div>
            </details>

            <section class="tr-outcome">
              <b>🎯 成果交付标准</b>
              <p>${trEsc(s.deliverable)}</p>
            </section>

            <div class="tr-verify-box">
              <div class="tr-verify-status">
                <span>学员自确认状态：</span>
                <b style="color:${isDone ? 'var(--tr-success)' : 'var(--tr-muted)'}">
                  ${isDone ? '✓ 学员已自确认（未自动验收）' : '○ 待完成场景实操'}
                </b>
              </div>
              <button class="tr-verify-btn ${isDone ? 'verified' : ''}" 
                data-action="tr-done" 
                data-day="${d.day}" 
                data-half="${i}" 
                aria-pressed="${isDone}">
                ${isDone ? '✓ 已自确认 · 点击撤销' : '□ 我已完成本单元实操（自确认）'}
              </button>
            </div>
          </article>
        `;
      }).join('')}
    </div>

    ${renderTrainingLab(d.day)}

    <div class="tr-call">
      <div>
        <b>📋 阶段验收闯关：4 道场景题</b>
        <p>逐题讲解、自动保存错题；答对 3/4 即视为达标。</p>
      </div>
      <button class="btn" data-action="tr-start">
        ${trSaved.best[d.day] !== undefined ? '再次练习' : '开始闯关'} →
      </button>
    </div>

    <div class="tr-bottom">
      <small>当前阶段最好成绩：${trSaved.best[d.day] !== undefined ? `${trSaved.best[d.day]} / 4` : '尚未练习'}</small>
      <div>
        <button data-action="tr-prev" ${d.day === 1 ? 'disabled' : ''}>← 前一阶段</button>
        <button data-action="tr-next" ${d.day === 16 ? 'disabled' : ''}>后一阶段 →</button>
      </div>
    </div>
  `;
}

function trQuizView() {
  if (trState.finished) {
    const good = trState.ids.filter((id, i) => trState.answers[i] === trQuestions.get(id).a).length;
    const total = trState.ids.length;
    const isPassed = good / total >= 0.75;
    return `
      <div class="tr-result">
        <div class="tr-score">${good}<small> / ${total}</small></div>
        <h3>${isPassed ? '🎉 阶段验收达标！' : '继续巩固与复查'}</h3>
        <p>本次正确率 ${Math.round(100 * good / total)}%。答对的错题已自动移出待复练队列。</p>
        <div>
          <button class="btn" data-action="tr-start">再测一次</button>
          <button data-action="tr-lessons">返回实训</button>
          <button data-action="tr-wrong">查看错题</button>
        </div>
        <div class="tr-review">
          ${trState.ids.map((id, i) => {
            const q = trQuestions.get(id);
            const isRight = trState.answers[i] === q.a;
            return `
              <section style="border-left: 3px solid ${isRight ? 'var(--tr-success)' : 'var(--tr-danger)'};">
                <b>${i + 1}. ${trEsc(q.q)}</b>
                <p>
                  <span style="color:${isRight ? 'var(--tr-success)' : 'var(--tr-danger)'};font-weight:700;">
                    ${isRight ? '✓ 正确' : '✕ 错误'}
                  </span>
                  正确答案：<strong>${trEsc(q.o[q.a])}</strong>
                </p>
                <small style="display:block;margin-top:6px;line-height:1.5;">${trEsc(q.why)}</small>
              </section>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  const q = trQuestions.get(trState.ids[trState.index]);
  if (!q) return '<p>练习状态异常，请重新打开课程。</p>';

  return `
    <div class="tr-quiz">
      <div class="tr-quiz-top">
        <span>${trState.type === 'wrong' ? '错题专项强化' : `第 ${trState.day} 阶段场景验收`} · ${trEsc(TRAINING_PLAN[q.day - 1].title)}</span>
        <b>${trState.index + 1} / ${trState.ids.length}</b>
      </div>
      <div class="tr-line">
        <span style="width:${100 * trState.index / trState.ids.length}%"></span>
      </div>
      <h3>${trEsc(q.q)}</h3>
      <div class="tr-options">
        ${q.o.map((v, i) => `
          <button data-action="tr-choice" data-index="${i}" 
            class="${trState.selected === i ? 'selected' : ''} ${trState.checked && i === q.a ? 'correct' : ''} ${trState.checked && i === trState.selected && i !== q.a ? 'incorrect' : ''}" 
            ${trState.checked ? 'disabled' : ''}>
            <span>${String.fromCharCode(65 + i)}</span>
            ${trEsc(v)}
          </button>
        `).join('')}
      </div>

      ${trState.checked ? `
        <div class="tr-feedback ${trState.selected === q.a ? 'good' : 'bad'}">
          <b>${trState.selected === q.a ? '✓ 回答正确' : '✕ 回答错误 · 已自动加入错题本'}</b>
          <p>${trEsc(q.why)}</p>
        </div>
      ` : ''}

      <div class="tr-answer-controls">
        <small>${trState.checked ? '核对解析后点击进入下一题' : '请先选择一个最符合的选项'}</small>
        <button class="btn" data-action="${trState.checked ? 'tr-forward' : 'tr-confirm'}" 
          ${!trState.checked && trState.selected === null ? 'disabled' : ''}>
          ${trState.checked ? (trState.index === trState.ids.length - 1 ? '查看考核成绩 →' : '下一题 →') : '确认答案'}
        </button>
      </div>
    </div>
  `;
}

function trWrongView() {
  const ids = trPending();
  if (!ids.length) {
    return `
      <div class="tr-empty">
        <span style="font-size:40px;">🌿</span>
        <h3>目前没有待复练的错题</h3>
        <p>答错后会自动记录，重新答对后将自动移出复练队列。</p>
        <button class="btn" data-action="tr-lessons" style="margin-top:14px;">继续阶段实训 →</button>
      </div>
    `;
  }

  return `
    <div class="tr-wrong-head">
      <div>
        <h3>待复练错题（${ids.length} 道）</h3>
        <p>答错后自动留存，再次答对后自动移出待复练列表。</p>
      </div>
      <button class="btn" data-action="tr-startwrong">开始复练 →</button>
    </div>
    <div class="tr-wrong-list">
      ${ids.map(id => {
        const q = trQuestions.get(id);
        return `
          <article>
            <small>第 ${q.day} 阶段 · 累计答错 ${trSaved.stats[id].wrong} 次</small>
            <h4>${trEsc(q.q)}</h4>
            <details>
              <summary>查看正确答案与深度解析</summary>
              <p><strong>正确答案：</strong>${trEsc(q.o[q.a])}</p>
              <p style="margin-top:4px;color:var(--tr-ink-secondary);">${trEsc(q.why)}</p>
            </details>
            <button data-action="tr-day" data-day="${q.day}">复习第 ${q.day} 阶段实操 →</button>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function trDay(day) {
  if (!Number.isInteger(day) || day < 1 || day > 16) return;
  trState.day = day;
  trState.mode = 'lesson';
  trState.ids = [];
  ui.tab = 'training';
  if (typeof updateHashRoute === 'function') updateHashRoute();
  render();
}

function trStart(type) {
  const ids = type === 'wrong' ? trPending().slice(0, 16) : TRAINING_PLAN[trState.day - 1].questions.map(x => x.id);
  if (!ids.length) {
    trState.mode = 'wrong';
    render();
    return;
  }
  Object.assign(trState, { mode: 'quiz', type, ids, index: 0, selected: null, checked: false, answers: [], finished: false });
  render();
}

function trRecord(q, a) {
  const st = trSaved.stats[q.id] || { attempts: 0, correct: 0, wrong: 0, needsReview: false };
  st.attempts++;
  if (a === q.a) {
    st.correct++;
    st.needsReview = false;
  } else {
    st.wrong++;
    st.needsReview = true;
  }
  st.lastAttempt = Date.now();
  trSaved.stats[q.id] = st;
  trSave();
}

document.addEventListener('click', event => {
  const node = event.target.closest('[data-action^="tr-"]');
  if (!node) return;
  const action = node.dataset.action;
  const day = Number(node.dataset.day);
  const half = Number(node.dataset.half);
  const i = Number(node.dataset.index);

  switch (action) {
    case 'tr-day': trDay(day); break;
    case 'tr-prev': trDay(trState.day - 1); break;
    case 'tr-next': trDay(trState.day + 1); break;
    case 'tr-lessons': trState.mode = 'lesson'; render(); break;
    case 'tr-wrong': trState.mode = 'wrong'; render(); break;
    case 'tr-done': {
      if (day < 1 || day > 16 || ![0, 1].includes(half)) break;
      const key = `${day}-${half}`;
      if (trSaved.completed[key]) delete trSaved.completed[key];
      else trSaved.completed[key] = Date.now();
      trSave();
      render();
      break;
    }
    case 'tr-start': trStart('day'); break;
    case 'tr-startwrong': trStart('wrong'); break;
    case 'tr-choice':
      if (!trState.checked && i >= 0 && i < 4) {
        trState.selected = i;
        render();
      }
      break;
    case 'tr-confirm': {
      if (trState.checked || trState.selected === null) break;
      const q = trQuestions.get(trState.ids[trState.index]);
      if (!q) break;
      trState.answers[trState.index] = trState.selected;
      trState.checked = true;
      trRecord(q, trState.selected);
      render();
      break;
    }
    case 'tr-forward': {
      if (!trState.checked) break;
      if (trState.index === trState.ids.length - 1) {
        trState.finished = true;
        if (trState.type === 'day') {
          const n = trState.ids.filter((id, j) => trState.answers[j] === trQuestions.get(id).a).length;
          trSaved.best[trState.day] = Math.max(Number(trSaved.best[trState.day] || 0), n);
          trSave();
        }
      } else {
        trState.index++;
        trState.selected = null;
        trState.checked = false;
      }
      render();
      break;
    }
  }
});

/* Recall cards and micro-lab helpers */
const TR_LESSON_EXT = [
  ["生成答案流畅不代表事实可靠。", "不要把模型推测当作已核实事实。", "如何核验关键事实？", "回查权威原文与引用。"],
  ["横向比较模型需要相同输入和评分标准。", "不能在任务条件不同的情况下直接排名。", "怎样保证比较公平？", "相同输入、相同约束、相同指标。"],
  ["生成代码需要测试输入与失败路径。", "能运行不等于满足业务要求。", "最少验证哪些场景？", "正常闭环和典型失败场景。"],
  ["先做可运行的最小示例。", "不要功能未完成就重构全部架构。", "初版成果的核心是什么？", "真实可操作的结果与验证步骤。"],
  ["模型部署取决于内存和运行资源。", "模型能下载不代表能顺畅运行。", "部署前关注什么？", "模型体积、量化和设备资源。"],
  ["训练更新参数，推理利用参数。", "提示词改变不等于重新训练。", "模型回答新问题属于什么？", "通常属于推理。"],
  ["RAG先处理文本、切块并索引。", "切块过细会丢失上下文。", "切块为什么保留语义？", "防止可引用事实被拆散。"],
  ["RAG检索结果是证据候选。", "检索命中不保证支持结论。","没有足够证据时怎么办？", "明确不足，不编造引用。"],
  ["工作流步骤预设，Agent可依反馈选择动作。", "不能把任意接口串联都叫自主Agent。", "什么影响下一步行动？", "目标、状态、工具和权限。"],
  ["外部工具使用应检查权限和参数。", "有副作用的写入不能擅自执行。", "写入前一般检查什么？", "授权、范围及必要确认。"],
  ["智能体要处理失败和超时。", "不能无限重试或假称完成。", "工具超时后如何处理？", "报告状态并给出有限重试路径。"],
  ["执行结果要以真实工具响应为准。", "模型自己说完成不算证据。", "如何确认日历创建？", "核对写入响应及结果。"],
  ["UI应根据业务状态更新。", "只改文字不更新状态会出错。", "点击后应保持什么一致？", "状态与界面反馈。"],
  ["交互要完整验证输入到结果的路径。", "只看页面好看无法证明可用。", "怎样验证一个表单？", "输入、提交、结果和异常。"],
  ["API契约包括输入、输出和错误。", "HTTP 200不保证业务数据正确。", "验收API需看什么？", "响应结构和业务语义。"],
  ["持久化意味着刷新后仍能读取。", "只看当前页面状态不足。", "怎么验证保存？", "重新加载后核对相同记录。"],
  ["文件自动化应先确定输入范围。", "未经核对不应直接覆盖原始文件。", "运行前先做什么？", "确认输入、输出与备份。"],
  ["自动化应避免重复写入。", "重试可能生成重复数据。", "怎样减少重复？", "稳定标识与幂等处理。"],
  ["短视频制作先做脚本和分镜。", "素材逐段生成可能风格不一。", "分镜解决什么问题？", "顺序、节奏和角色一致性。"],
  ["AI生成内容也可能有版权限制。", "AI生成不等于拥有全部商业使用权。", "发布前检查什么？", "素材许可、人物肖像与来源。"],
  ["抽取信息应保留出处。", "不要猜测填补未知字段。", "不确定字段怎样处理？", "标记未知并记录来源。"],
  ["会议整理需要区别决定和建议。", "建议不能写成已获批准的行动。", "任务字段有哪些？", "负责人、事项、期限和出处。"],
  ["数据清洗要理解字段含义。", "空值不都适合填零。", "处理空值前先判断什么？", "缺失原因及字段语义。"],
  ["清洗过程要可追溯。", "修改原值后不能丢掉来源。", "结果如何便于复核？", "保留原值、规则与规范值。"],
  ["标注需要统一标签边界。", "不能让人员随意解释类别。", "为什么先写标注规范？", "降低不同标注者的歧义。"],
  ["不同标注形式对应不同任务。", "不是所有场景都适合矩形框。", "选择标注形式取决于什么？", "任务目标及所需精度。"],
  ["增强样本要保持标签语义。", "改写后标签变化不算合法增强。", "增强后需验证什么？", "目标类别仍然成立。"],
  ["标注质量要抽检和处理冲突。", "只看标注数量不能代表质量。", "出现冲突怎么办？", "按规则复核并记录争议。"],
  ["有效复习需要尝试主动回忆。", "只反复阅读不等于记住。", "复习时先做什么？", "先尝试作答再核对。"],
  ["综合项目需要明确成功标准。", "华丽演示不能代替业务闭环。", "怎样证明功能跑通？", "可重复步骤及实际结果。"],
  ["考核结果应可核验。", "只展示截图不等于交付成果。", "什么证明实操完成？", "真实输出及复现方法。"],
  ["项目展示要说明边界。", "不能把计划写成已完成。", "汇报时区分哪几项？", "已验证能力、限制和计划。"]
];

const TR_MICRO_DAYS = { 3: '模型训练与过拟合判定', 4: 'RAG 证据检索匹配', 5: 'Agent 工具调用与确认环', 13: '多样本标注规范核验' };
const TR_MICRO_KEY = 'ai_training_practice_v1';
let trMicroDone = {};

try {
  const x = JSON.parse(trStorage.getItem(TR_MICRO_KEY) || '{}');
  if (x && typeof x === 'object') trMicroDone = x;
} catch (e) {}

const trMicro = { epoch: 7, model: null, rag: null, step: 0, message: '', labels: {}, checked: false };

function trMicroSave(day) {
  trMicroDone[day] = Date.now();
  try {
    trStorage.setItem(TR_MICRO_KEY, JSON.stringify(trMicroDone));
  } catch (e) {
    console.warn('交互实验存储失败', e);
  }
}

function renderTrainingInsight(day, half) {
  const c = TR_LESSON_EXT[(day - 1) * 2 + half];
  if (!c) return '';
  return `
    <section class="tr-insight">
      <b>💡 深入理解与避坑</b>
      <p>${trEsc(c[0])}</p>
      <small>⚠️ 常见误区：${trEsc(c[1])}</small>
      <details>
        <summary>🧠 思考检查：${trEsc(c[2])}</summary>
        <p>${trEsc(c[3])}</p>
      </details>
    </section>
  `;
}

const trTrainCurve = n => 1.05 * Math.exp(-n / 6) + 0.12;
const trValCurve = n => 0.82 * Math.exp(-n / 4) + 0.25 + 0.0075 * Math.max(0, n - 7) ** 2;

function trCurve(epoch) {
  const path = fn => Array.from({ length: 20 }, (_, i) => (26 + i * 14.4) + ',' + (115 - fn(i + 1) * 62)).join(' ');
  return `
    <svg class="tr-curve" viewBox="0 0 324 132" role="img" aria-label="训练损失持续下降，验证损失先降后升">
      <path d="M26 12 V115 H310" stroke="#c9cfdf" fill="none"/>
      <polyline points="${path(trTrainCurve)}" stroke="#0f766e" fill="none" stroke-width="2.5"/>
      <polyline points="${path(trValCurve)}" stroke="#d97706" fill="none" stroke-width="2.5"/>
      <line x1="${26 + (epoch - 1) * 14.4}" x2="${26 + (epoch - 1) * 14.4}" y1="8" y2="115" stroke="#2563eb" stroke-dasharray="3 3"/>
      <text x="30" y="11" font-size="8" fill="#64748b">损失 Loss（越低越好）</text>
      <text x="250" y="129" font-size="8" fill="#64748b">训练轮次 Epoch→</text>
    </svg>
  `;
}

const trLabelItems = [
  ['请解释 Transformer 的自注意力机制原理。', '知识提问'],
  ['希望增加暗黑夜间主题模式。', '功能建议'],
  ['今天深圳的天气真不错。', '其他'],
  ['检索召回率具体是如何计算的？', '知识提问'],
  ['建议支持导出 PDF 格式的学习成绩单。', '功能建议'],
  ['祝大家工作顺利。', '其他']
];

function renderTrainingLab(day) {
  if (!TR_MICRO_DAYS[day]) return '';
  let body = '';

  if (day === 3) {
    const n = trMicro.epoch;
    const options = [
      ['train', '只看训练集损失是否持续下降'],
      ['validation', '参考验证集表现，在验证损失回升前早停'],
      ['last', '训练轮次越多越好，跑到最后一定最优']
    ];
    body = `
      <p style="font-size:13px;color:var(--tr-ink-secondary);line-height:1.6;">
        拖动训练轮次滑块，观察训练损失（深青色）与验证损失（橙色）的变化分水岭。
      </p>
      ${trCurve(n)}
      <p class="tr-curve-legend" style="font-size:12px;text-align:center;color:var(--tr-muted);">
        ● 青色：训练集损失　 ● 橙色：验证集损失　┆ 虚线：当前轮次 (${n})
      </p>
      <label class="tr-epoch-label" style="display:flex;align-items:center;gap:12px;margin:12px 0;">
        <span>训练轮次 (Epoch): <strong>${n}</strong></span>
        <input id="trMicroEpoch" type="range" min="1" max="20" value="${n}" style="flex:1;accent-color:var(--tr-accent);">
      </label>
      <div style="font-size:12.5px;color:var(--tr-ink);margin-bottom:10px;">
        当前训练损失：<strong>${trTrainCurve(n).toFixed(2)}</strong>　
        当前验证损失：<strong>${trValCurve(n).toFixed(2)}</strong>
      </div>
      <b style="font-size:13px;display:block;margin-bottom:8px;">在真实生产中，选取模型检查点的最合理准则是？</b>
      <div class="tr-micro-options">
        ${options.map(o => `
          <button data-action="trmicro-model" data-value="${o[0]}" class="${trMicro.model === o[0] ? 'selected' : ''}">
            ${o[1]}
          </button>
        `).join('')}
      </div>
      ${trMicro.model ? `
        <div class="tr-micro-result ${trMicro.model === 'validation' ? 'good' : 'bad'}">
          ${trMicro.model === 'validation' ? '✓ 正确：验证损失回升代表模型开始死记硬背训练样本（过拟合），应当依据验证集表现实施 Early Stopping。' : '训练损失持续下降并不代表泛化能力更强，必须看验证集表现以防过拟合。'}
        </div>
      ` : ''}
    `;
  }

  if (day === 4) {
    const docs = [
      ['借阅柜台', '虚构图书馆周六借书服务09:00—17:00，17:00停止借书。'],
      ['自习室', '虚构图书馆周六自习室开放至20:00。'],
      ['建筑开放', '虚构图书馆周六建筑闭馆时间为21:00。']
    ];
    body = `
      <p style="font-size:13px;color:var(--tr-ink-secondary);line-height:1.6;">
        问题：<strong>“这家图书馆周六几点停止借书服务？”</strong> 从检索到的候选文档切块中，选出能直接作为事实证据的片段。
      </p>
      <div class="tr-micro-options">
        ${docs.map((d, i) => `
          <button data-action="trmicro-rag" data-index="${i}" class="${trMicro.rag === i ? 'selected' : ''}">
            <b>[${d[0]}]</b>　${d[1]}
          </button>
        `).join('')}
      </div>
      ${trMicro.rag !== null ? `
        <div class="tr-micro-result ${trMicro.rag === 0 ? 'good' : 'bad'}">
          ${trMicro.rag === 0 ? '✓ 证据切块精确支持：周六 17:00 停止借书。' : '该片段讲述的是自习室或闭馆时间，无法作为借书截止的直接证据。'}
        </div>
      ` : ''}
    `;
  }

  if (day === 5) {
    const steps = [
      ['用户指令：“请帮我周五下午安排读书会，创建前必须先找我确认”。第一步应该？', ['直接调用写接口创建日程', '只读查询周五空闲时段', '清空周五所有已有日程'], 1],
      ['查询到 15:00—16:00 处于空闲状态，智能体接下来应该？', ['向用户清晰展示时间并请求授权确认', '直接不经询问写入日历', '公开当前日历的所有隐私详情'], 0],
      ['用户回复已确认无误，智能体的下一步执行是？', ['不调接口直接向用户假报成功', '调用日历写入工具并校验真实接口返回', '忽略用户确认改换其他日期'], 1]
    ];
    if (trMicro.step < 3) {
      const [q, options] = steps[trMicro.step];
      body = `
        <p style="font-size:13px;color:var(--tr-muted);">模拟感知-决策-行动环（第 ${trMicro.step + 1} / 3 步）：</p>
        <h4 style="margin:6px 0 12px;font-size:14.5px;">${q}</h4>
        <div class="tr-micro-options">
          ${options.map((x, i) => `<button data-action="trmicro-agent" data-index="${i}">${x}</button>`).join('')}
        </div>
        ${trMicro.message ? `<div class="tr-micro-result bad">${trEsc(trMicro.message)}</div>` : ''}
      `;
    } else {
      body = `
        <div class="tr-micro-result good" style="margin-bottom:12px;">
          ✓ 模拟通关：遵循“只读探测 → 人机确认（Human-in-the-Loop） → 受控写入与响应校验”的安全规范。
        </div>
        <button class="btn" data-action="trmicro-replay">重新模拟一次</button>
      `;
    }
  }

  if (day === 13) {
    const labels = ['知识提问', '功能建议', '其他'];
    body = `
      <p style="font-size:13px;color:var(--tr-ink-secondary);line-height:1.6;">
        标注规范：<strong>知识提问</strong>＝询问概念定义与计算；<strong>功能建议</strong>＝对产品特性的改进诉求；<strong>其他</strong>＝闲聊或寒暄。
      </p>
      <div class="tr-label-grid">
        ${trLabelItems.map((x, i) => `
          <div class="tr-label-card">
            <b>${i + 1}. ${trEsc(x[0])}</b>
            <div>
              ${labels.map(l => `
                <button data-action="trmicro-label" data-index="${i}" data-value="${l}" 
                  ${trMicro.checked ? 'disabled' : ''} 
                  class="${trMicro.labels[i] === l ? 'selected' : ''}">
                  ${l}
                </button>
              `).join('')}
            </div>
            ${trMicro.checked ? `
              <small style="color:${trMicro.labels[i] === x[1] ? 'var(--tr-success)' : 'var(--tr-danger)'};">
                ${trMicro.labels[i] === x[1] ? '✓ 标注正确' : '正确标签：' + x[1]}
              </small>
            ` : ''}
          </div>
        `).join('')}
      </div>
      <div class="tr-micro-actions">
        <button class="btn" data-action="trmicro-check" ${Object.keys(trMicro.labels).length !== 6 || trMicro.checked ? 'disabled' : ''}>
          核对标注一致性
        </button>
        <button data-action="trmicro-clear">清空重测</button>
      </div>
      ${trMicro.checked ? `
        <div class="tr-micro-result ${trLabelItems.every((x, i) => trMicro.labels[i] === x[1]) ? 'good' : 'bad'}" style="margin-top:12px;">
          正确率：${trLabelItems.filter((x, i) => trMicro.labels[i] === x[1]).length} / 6
        </div>
      ` : ''}
    `;
  }

  const isDone = Boolean(trMicroDone[day]);
  return `
    <section class="tr-micro">
      <div class="tr-micro-head">
        <div>
          <small>INTERACTIVE WORKSPACE · 阶段交互实验台</small>
          <h3>🔬 ${TR_MICRO_DAYS[day]}</h3>
        </div>
        <span class="${isDone ? 'completed' : ''}">${isDone ? '✓ 实操已通关' : '待挑战'}</span>
      </div>
      ${body}
    </section>
  `;
}

document.addEventListener('change', e => {
  if (e.target && e.target.id === 'trMicroEpoch') {
    trMicro.epoch = Number(e.target.value);
    render();
  }
});

document.addEventListener('click', e => {
  const b = e.target.closest('[data-action^="trmicro-"]');
  if (!b) return;
  const a = b.dataset.action;
  const day = trState.day;

  if (a === 'trmicro-model') {
    trMicro.model = b.dataset.value;
    if (trMicro.model === 'validation') trMicroSave(3);
  }
  if (a === 'trmicro-rag') {
    trMicro.rag = Number(b.dataset.index);
    if (trMicro.rag === 0) trMicroSave(4);
  }
  if (a === 'trmicro-agent') {
    const answers = [1, 0, 1];
    if (Number(b.dataset.index) === answers[trMicro.step]) {
      trMicro.step++;
      trMicro.message = '';
      if (trMicro.step === 3) trMicroSave(5);
    } else {
      trMicro.message = '请遵循：只读探测优先、关键操作必须用户确认、最小权限原则。';
    }
  }
  if (a === 'trmicro-replay') {
    trMicro.step = 0;
    trMicro.message = '';
  }
  if (a === 'trmicro-label' && !trMicro.checked) {
    trMicro.labels[Number(b.dataset.index)] = b.dataset.value;
  }
  if (a === 'trmicro-check' && Object.keys(trMicro.labels).length === 6) {
    trMicro.checked = true;
    if (trLabelItems.every((x, i) => trMicro.labels[i] === x[1])) trMicroSave(13);
  }
  if (a === 'trmicro-clear') {
    trMicro.checked = false;
    trMicro.labels = {};
  }
  if (TR_MICRO_DAYS[day]) render();
});
