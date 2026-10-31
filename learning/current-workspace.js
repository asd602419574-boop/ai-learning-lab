/* Host course UI. All durable writes pass through LearningStorage. */
(() => {
  'use strict';
  const C = window.CurrentCore, D = window.CurrentContent;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = (n, d = 3) => Number(n === 0 ? 0 : n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  let host, store, state, sim = null, pending = null, message = '', saveNotice = '';
  const q = selector => host?.querySelector(selector);

  function ensure() {
    if (store) return;
    store = C.createStore(window.LearningStorage.storage);
    state = store.read();
    saveNotice = store.getError() || '当前浏览器自动保存；刷新可继续。重要记录请另行导出。';
  }

  function destroy() {
    if (sim) { sim.destroy(); sim = null; }
  }

  function writable() {
    return window.LearningStorage.role === 'writer';
  }

  function persist(restore = false) {
    if (!writable()) {
      saveNotice = '只读：请先在此页继续学习，再修改记录。';
      return false;
    }
    state.updatedAt = new Date().toISOString();
    const result = store.write(state, { restore });
    saveNotice = result.ok
      ? '已保存并读回确认 · ' + new Date().toLocaleTimeString() + ' · 刷新可恢复。'
      : '未保存：' + result.error + '；当前稿仍可导出JSON。';
    return result.ok;
  }

  function download(text, name) {
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })), a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function summary() {
    ensure();
    return {
      started: C.TASKS.some(id => state.tasks[id].rounds.length || state.tasks[id].prediction),
      versions: state.submissions.length
    };
  }

  function getEvidenceChecklist(taskState, taskId) {
    const round = taskState.rounds.at(-1);
    const observations = round?.observations || [];
    const base = p => p.closed && p.mode === 'ideal' && p.material === 'copper' && p.temperature === 20;
    if (taskId === 'voltage') {
      const has3 = observations.some(o => base(o.params) && o.params.topology === 'single' && o.params.resistance === 10 && o.params.voltage === 3);
      const has6 = observations.some(o => base(o.params) && o.params.topology === 'single' && o.params.resistance === 10 && o.params.voltage === 6);
      return [
        { text: '条件 1：保持单电阻 10 Ω、闭合开关，记录 3.0 V 模拟值（理论读数 0.300 A）', met: has3 },
        { text: '条件 2：保持单电阻 10 Ω、闭合开关，记录 6.0 V 模拟值（理论读数 0.600 A）', met: has6 }
      ];
    }
    if (taskId === 'resistance') {
      const has10 = observations.some(o => base(o.params) && o.params.topology === 'single' && o.params.voltage === 6 && o.params.resistance === 10);
      const has20 = observations.some(o => base(o.params) && o.params.topology === 'single' && o.params.voltage === 6 && o.params.resistance === 20);
      return [
        { text: '条件 1：保持电压 6.0 V、闭合开关，记录 10 Ω 模拟值（理论读数 0.600 A）', met: has10 },
        { text: '条件 2：保持电压 6.0 V、闭合开关，记录 20 Ω 模拟值（理论读数 0.300 A）', met: has20 }
      ];
    }
    if (taskId === 'transfer') {
      const hasParallel = observations.some(o => base(o.params) && o.params.topology === 'parallel' && o.params.voltage === 6 && o.params.resistance === 10 && o.params.r2 === 20);
      return [
        { text: '并联迁移：保持 6.0 V，R₁=10 Ω 与 R₂=20 Ω 并联回路，记录总电流与支路读数', met: hasParallel }
      ];
    }
    return [];
  }

  function physics() {
    ensure();
    const s = summary();
    return `<div class="current-course current-subject">
      <header>
        <p class="current-kicker">物理 / 电学</p>
        <h1>从一个条件的变化，理解一个规律。</h1>
        <p>先读原理与完整示范，再亲手控制变量、观察模拟数值，留下可以解释的实验记录。</p>
      </header>
      <article class="current-subject-card">
        <span class="current-kicker">交互实验 · 无需编程</span>
        <h2>电流探索实验课</h2>
        <p>连接宏观电路与微观漂移，探索电压、电阻与串并联关系。包含两项单变量任务和一次独立迁移；无需先完成AI课程。</p>
        <p class="current-card-meta">${s.started ? '本机已有实验稿 · 已保存提交版本 ' + s.versions : '尚未开始 · 学习时长由你自己安排'}</p>
        <div class="current-subject-actions">
          <a class="btn" href="#current">阅读原理与示范 →</a>
          ${s.started ? '<a class="btn btn-secondary" href="#current?view=practice">继续实验</a>' : ''}
        </div>
      </article>
      <p class="current-back-links"><a href="#pathways">人工智能学科 →</a> · <a href="#home">返回学科选择</a></p>
    </div>`;
  }

  const labels = {
    prediction: '预测：改变条件后，电流会怎样变化？',
    reason: '预测依据：基于哪条规律或公式？',
    explanation: '对比与解释：预测与模拟读数是否一致？为什么？',
    revision: '修正与复盘：若不一致检查了什么？下一次如何改进？'
  };

  function backup() {
    return `<section class="current-backup">
      <div class="current-backup-header">
        <div>
          <h2>本实验的独立备份与恢复</h2>
          <p>实验数据保存在当前浏览器的本机存储中。原全站九键备份暂不包含本实验独立稿；换设备、换端口或清理浏览器时请使用以下 JSON 备份。</p>
        </div>
      </div>
      <div class="current-backup-actions">
        <button class="btn btn-secondary" data-current-action="export">导出本实验 JSON</button>
        <button class="btn btn-secondary" data-current-action="raw">导出本机原始记录</button>
      </div>
      <div class="current-backup-restore">
        <label>从文件恢复：选择导出的 JSON 文件（先预览核对，确认后覆盖本课）
          <input type="file" accept="application/json,.json" data-current-file>
        </label>
        <div data-current-preview aria-live="polite"></div>
      </div>
    </section>`;
  }

  function workbench() {
    const task = state.tasks[state.activeTask];
    const taskCheck = C.check(state);
    return `<p class="current-save" data-current-save role="status" aria-live="polite"></p>

    <!-- 任务切换与学习导引 -->
    <section class="current-task current-task-step-card">
      <div class="task-selector-bar">
        <div class="task-selector-head">
          <span class="editorial-kicker">实验任务导航</span>
          <h2>选择当前要完成的探究任务</h2>
        </div>
        <div class="current-task-pills" role="tablist" aria-label="三项实验任务">
          ${C.TASKS.map(id => {
            const isCur = id === state.activeTask;
            const isReady = taskCheck.tasks[id].ready;
            const hasStarted = state.tasks[id].rounds.length > 0;
            const badge = isReady ? '✓ 已就绪' : hasStarted ? '○ 进行中' : '未开始';
            return `<button type="button" class="task-pill-btn ${isCur ? 'active' : ''}" data-task-pill="${id}" role="tab" aria-selected="${isCur}">
              <span class="pill-id">${id === 'voltage' ? '任务 1' : id === 'resistance' ? '任务 2' : '任务 3'}</span>
              <span class="pill-name">${id === 'voltage' ? '改变电压' : id === 'resistance' ? '改变电阻' : '并联迁移'}</span>
              <span class="pill-status ${isReady ? 'status-ready' : hasStarted ? 'status-active' : ''}">${badge}</span>
            </button>`;
          }).join('')}
        </div>
        <div class="current-task-dropdown-wrap">
          <label class="current-task-dropdown-label">任务切换列表：
            <select data-current-task>
              ${C.TASKS.map(id => `<option value="${id}"${id === state.activeTask ? ' selected' : ''}>${D.tasks[id].title}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>

      <div class="current-task-brief">
        <h3 class="current-task-title">${D.tasks[state.activeTask].title}</h3>
        <p class="current-instruction-text" data-current-instruction>${D.tasks[state.activeTask].instruction}</p>
        <div class="current-workflow-flow" aria-label="实验操作流程">
          <span class="flow-step current"><span class="step-badge">1</span> 审清变量要求</span>
          <span class="flow-arrow" aria-hidden="true">→</span>
          <span class="flow-step current"><span class="step-badge">2</span> 填写预测并锁定</span>
          <span class="flow-arrow" aria-hidden="true">→</span>
          <span class="flow-step"><span class="step-badge">3</span> 在控制台调节参数</span>
          <span class="flow-arrow" aria-hidden="true">→</span>
          <span class="flow-step"><span class="step-badge">4</span> 记录读数与对比解释</span>
        </div>
      </div>

      <p class="task-help-note">切换任务会自动设置起始参数，并妥善保留每个任务的预测、轮次与历史观察。模拟器支持自由探索；完成任务仍需按题目严格控制单一变量。</p>

      <div class="current-notes">
        ${['prediction', 'reason'].map(k => `<label class="current-field-wrap">
          <span class="field-title">${labels[k]}</span>
          <textarea rows="2" maxlength="6000" data-current-note="${k}" placeholder="${k === 'prediction' ? '例如：保持电阻10Ω不变，电压从3V加倍到6V时，我预测电流会……' : '例如：依据欧姆定律 I = U / R，固定电阻时电流与电压成正比……'}">${esc(task[k])}</textarea>
        </label>`).join('')}
      </div>

      <div class="current-round-action">
        <button class="btn" data-current-action="begin">锁定预测，开始本轮</button>
        <span class="action-note">每次开始新轮次会保留历史轮次的预测与观察，不改写旧记录。</span>
      </div>
    </section>

    <!-- 交互模拟器工作区 -->
    <div class="current-sim" data-current-sim></div>

    <!-- 观察记录、对照解释与提交 -->
    <section class="current-task current-record-card">
      <div class="card-head">
        <div>
          <h2>记录本轮数据、对比解释与提交</h2>
          <p class="card-subtitle">模拟计算读数用于检验预测，曲线与动画提供微观机理解释，不代表真实仪器测量。</p>
        </div>
      </div>

      <div class="current-observe-action-bar">
        <button class="btn" data-current-action="observe">记录本轮条件与读数</button>
        <span class="observe-tip">在上方控制台设置好参数后，点击此按钮将当前参数和理论读数记录到本轮。</span>
      </div>

      <div class="current-checklist-box" data-current-checklist></div>

      <div data-current-observations></div>

      <div class="current-notes">
        ${['explanation', 'revision'].map(k => `<label class="current-field-wrap">
          <span class="field-title">${labels[k]}</span>
          <textarea rows="3" maxlength="6000" data-current-note="${k}" placeholder="${k === 'explanation' ? '写明固定量、改变量、两组模拟读数以及运用的公式（如 I = U / R），说明是否符合预测。' : '若预测与模拟读数不一致，写下排查过程（检查了开关状态、单位或是否误触了其他变量），下一次操作如何调整。'}">${esc(task[k])}</textarea>
        </label>`).join('')}
      </div>

      <details class="current-self-eval-details">
        <summary>自评核对提示：怎样写出有依据的解释？</summary>
        <div class="self-eval-content">
          <p><strong>1. 单变量任务（01与02）：</strong>写清楚固定哪个量（如固定R=10Ω）、改变哪个量（3V到6V），分别列出两组模拟电流读数，并说明是否符合正比或反比规律。</p>
          <p><strong>2. 并联迁移任务（03）：</strong>写出两电阻两端电压相同（U₁=U₂=6V），分别计算两支路电流（I₁=0.6A，I₂=0.3A），解释为什么总电流等于二者之和（0.9A），以及为什么不能把电阻直接相加。</p>
          <p><strong>3. 开放说明：</strong>本站自动检查仅核验任务所需条件与材料是否满足，开放文字解释由学习者自评核对，不自动给出分数或能力认证。</p>
        </div>
      </details>

      <div class="current-actions">
        <button class="btn btn-secondary" data-current-action="check">检查任务证据</button>
        <button class="btn" data-current-action="submit">提交并保存当前版本</button>
      </div>
      <div data-current-feedback role="status" aria-live="polite"></div>
    </section>

    <!-- 独立备份与恢复 -->
    ${backup()}

    <!-- 历史提交快照 -->
    <section class="current-task current-history-card">
      <h2>已保存的提交版本快照</h2>
      <p class="card-subtitle">提交后会在此生成不可篡改的历史快照。平时调节参数会自动保存在草稿中。</p>
      <div data-current-history></div>
    </section>`;
  }

  function feedback() {
    if (!host?.isConnected) return;
    const task = state.tasks[state.activeTask], round = task.rounds.at(-1);

    // Save status
    if (q('[data-current-save]')) {
      q('[data-current-save]').textContent = (writable() ? '' : '本页只读；可阅读或导出，请使用页面上方的切换按钮取得写入权。 ') + saveNotice;
    }

    // Evidence checklist
    const checklistBox = q('[data-current-checklist]');
    if (checklistBox) {
      const items = getEvidenceChecklist(task, state.activeTask);
      const allMet = items.length > 0 && items.every(x => x.met);
      checklistBox.innerHTML = `<div class="checklist-inner ${allMet ? 'all-met' : ''}">
        <div class="checklist-title"><strong>当前任务条件核验：</strong><span class="checklist-status-badge ${allMet ? 'badge-met' : 'badge-pending'}">${allMet ? '✓ 所需条件已齐全' : '○ 条件记录中'}</span></div>
        <ul class="checklist-items">
          ${items.map(item => `<li class="${item.met ? 'item-met' : 'item-pending'}">
            <span class="icon" aria-hidden="true">${item.met ? '✓' : '○'}</span>
            <span class="text">${esc(item.text)}</span>
            <span class="badge ${item.met ? 'badge-met' : 'badge-pending'}">${item.met ? '已记录' : '待记录'}</span>
          </li>`).join('')}
        </ul>
        ${allMet ? '<p class="checklist-ready-note">✓ 本任务条件读数已收集完毕。请对照预测填写下方【对比与解释】，然后可在上方切换下一任务或提交。</p>' : (round ? '<p class="checklist-hint-note">提示：在上方模拟器调节参数后，点击【记录本轮条件与读数】收集所需条件。</p>' : '<p class="checklist-hint-note">提示：请先在上方填写预测并点击【锁定预测，开始本轮】。</p>')}
      </div>`;
    }

    // Observations Table
    const observations = q('[data-current-observations]');
    if (observations) {
      observations.innerHTML = round ? `
        <div class="current-round-banner">
          <span class="round-badge">第 ${task.rounds.length} 轮记录</span>
          <p><strong>初始预测：</strong>${esc(round.prediction)}</p>
          <p><strong>理论依据：</strong>${esc(round.reason)}</p>
        </div>
        <div class="current-table-wrap">
          <table>
            <caption>本轮已记录的模拟读数（共 ${round.observations.length} 组）</caption>
            <thead>
              <tr>
                <th scope="col">电路状态 / 连接 / 开关</th>
                <th scope="col">电源电压 U</th>
                <th scope="col">电阻配置</th>
                <th scope="col">电流计算值 I (理论读数)</th>
              </tr>
            </thead>
            <tbody>
              ${round.observations.map(o => `<tr>
                <td>
                  <strong>${o.params.closed ? '● 闭合' : '○ 断开'}</strong> ·
                  ${o.params.topology === 'parallel' ? '并联' : o.params.topology === 'series' ? '串联' : '单电阻'} ·
                  ${o.params.mode === 'wire' ? esc(o.params.material) + '电阻丝' : '恒温理想电阻'}
                  <div class="td-sub">${o.params.temperature}℃ · L=${o.params.length} m · A=${o.params.area} mm²</div>
                </td>
                <td><strong>${f(o.params.voltage, 1)} V</strong></td>
                <td>R₁ = ${o.result.r1.toPrecision(4)} Ω ${o.params.topology !== 'single' ? `<br>R₂ = ${o.params.r2} Ω` : ''}</td>
                <td>
                  <strong class="curr-val">${o.result.current.toPrecision(4)} A</strong>
                  ${o.params.topology === 'parallel' ? `<div class="td-sub">支路：I₁ = ${o.result.i1.toPrecision(4)} A, I₂ = ${o.result.i2.toPrecision(4)} A</div>` : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<p class="empty-observations">尚无本轮观察。请先填写上方预测与理由，点击“锁定预测，开始本轮”，再调参记录。</p>';
    }

    // Feedback Panel
    const panel = q('[data-current-feedback]');
    if (panel) {
      const isSub = C.current(state);
      panel.innerHTML = `<div class="feedback-box ${isSub ? 'submitted' : ''}">
        ${message ? `<p class="feedback-msg"><strong>反馈信息：</strong>${esc(message)}</p>` : ''}
        <div class="feedback-status">
          <strong>${isSub ? '已提交当前版本；符合本课固定证据规则。' : '当前稿尚未提交，或已在上次提交后修改；历史版本仍保留。'}</strong>
        </div>
        <p class="feedback-sub">自动检查核对任务条件与材料，不评价开放解释，不认证知识掌握。</p>
      </div>`;
    }

    // History Submissions
    const history = q('[data-current-history]');
    if (history) {
      history.innerHTML = state.submissions.map((v, i) => {
        const timeStr = new Date(v.at).toLocaleString();
        const tKeys = Object.keys(v.tasks || {});
        return `<details class="current-history-details">
          <summary>版本 ${i + 1} · ${esc(v.at)}</summary>
          <div class="history-content">
            <p class="history-time"><strong>提交时间：</strong>${esc(timeStr)}</p>
            <div class="history-tasks-grid">
              ${tKeys.map(k => {
                const t = v.tasks[k];
                const lastRound = t.rounds?.at(-1);
                return `<div class="history-task-card">
                  <h4>${esc(D.tasks[k]?.title || k)}</h4>
                  <p><strong>预测：</strong>${esc(t.prediction || '—')}</p>
                  <p><strong>理由：</strong>${esc(t.reason || '—')}</p>
                  <p><strong>观测组数：</strong>${lastRound?.observations?.length || 0} 组模拟数据</p>
                  <p><strong>对比解释：</strong>${esc(t.explanation || '—')}</p>
                  ${t.revision ? `<p><strong>修正记录：</strong>${esc(t.revision)}</p>` : ''}
                </div>`;
              }).join('')}
            </div>
            <details class="history-raw-pre"><summary>查看完整原始 JSON 快照</summary><pre>${esc(JSON.stringify(v.tasks, null, 2))}</pre></details>
          </div>
        </details>`;
      }).join('') || '<p class="empty-history">尚无提交版本。完成三个任务后点击上方“提交并保存当前版本”，平时的草稿会自动保存。</p>';
    }

    // Preview Panel
    const preview = q('[data-current-preview]');
    if (preview) {
      preview.innerHTML = pending ? `
        <div class="preview-box">
          <p><strong>待恢复文件 ${esc(pending.name)}：</strong>包含 ${pending.state.submissions.length} 个提交版本，${C.TASKS.reduce((n, id) => n + pending.state.tasks[id].rounds.length, 0)} 轮观察。</p>
          <p class="preview-warning">⚠ 确认恢复将替换本实验当前草稿与版本；其他课程不受影响。请先导出需要保留的内容。</p>
          <div class="preview-actions">
            <button class="btn" data-current-action="restore">确认恢复本实验</button>
            <button class="btn btn-secondary" data-current-action="cancel">取消</button>
          </div>
        </div>` : '';
    }
  }

  function paint(practice) {
    destroy();
    host.innerHTML = `<div class="current-course ${practice ? 'current-practice' : 'current-reading'}">
      <header>
        <p class="current-kicker"><a href="#physics">物理</a> / 电学 / 电流探索</p>
        <h1>电流探索实验课</h1>
        <p>控制一个变量，用模拟值检验预测，用原理解释变化。</p>
        <nav class="current-view-tabs" aria-label="电流课程">
          <a href="#current"${practice ? '' : ' aria-current="page"'}>背景、原理与示范</a>
          <a href="#current?view=practice"${practice ? ' aria-current="page"' : ''}>实验与个人记录</a>
        </nav>
      </header>
      ${practice ? workbench() : `<article data-current-reading>${D.reading}</article><div class="current-reading-foot"><a class="btn" href="#current?view=practice" data-current-start>已读原理与示范，开始实验 →</a></div>${backup()}`}
    </div>`;

    if (practice) {
      sim = window.CurrentSimulation.mount(q('[data-current-sim]'), state.simulation, value => {
        if (!writable()) return;
        try {
          C.setSimulation(state, value);
          persist();
        } catch (error) {
          message = error.message;
        }
        feedback();
      });
    }
    feedback();
  }

  function render(root, view = 'reading') {
    ensure();
    host = root;
    pending = null;
    message = '';

    host.oninput = e => {
      const k = e.target.dataset.currentNote;
      if (k && writable()) {
        try {
          C.setNote(state, k, e.target.value);
          persist();
        } catch (error) {
          e.target.value = state.tasks[state.activeTask][k];
          message = error.message;
        }
        feedback();
      }
    };

    host.onchange = async e => {
      if (e.target.hasAttribute('data-current-task') && writable()) {
        try {
          C.setSimulation(state, { ...state.simulation, params: { ...C.DEFAULT_PARAMS, ...D.tasks[e.target.value].params } });
          state.activeTask = e.target.value;
          persist();
          paint(true);
          q('[data-current-task]')?.focus();
        } catch (error) {
          e.target.value = state.activeTask;
          message = error.message;
          feedback();
        }
        return;
      }
      if (!e.target.hasAttribute('data-current-file') || !writable()) return;
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        if (file.size > 8000000) throw Error('文件超过8MB；请使用本实验导出的紧凑JSON');
        pending = { name: file.name, state: C.parse(await file.text()) };
        message = '仅预览，当前实验稿尚未覆盖。';
      } catch (error) {
        pending = null;
        message = '文件未应用：' + error.message;
      }
      e.target.value = '';
      feedback();
    };

    host.onclick = e => {
      const pill = e.target.closest('[data-task-pill]');
      if (pill && writable()) {
        const taskId = pill.dataset.taskPill;
        if (taskId && taskId !== state.activeTask) {
          const select = q('[data-current-task]');
          if (select) {
            select.value = taskId;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }
        return;
      }

      const button = e.target.closest('[data-current-action]');
      if (!button) return;
      const action = button.dataset.currentAction;
      try {
        if (action === 'export') {
          const raw = C.serialize(state);
          C.parse(raw);
          download(raw, 'current-experiment.json');
          message = '已发起下载，请确认文件已保留。';
        } else if (action === 'raw') {
          download(store.raw() ?? 'null', 'current-original-record.json');
          message = '已导出本机原始记录，未修改内容。';
        } else if (!writable()) {
          message = '请先在此页继续学习后再修改或恢复。';
        } else if (action === 'begin') {
          C.startRound(state);
          persist();
          message = '当前预测已锁定；现在调参并记录。';
        } else if (action === 'observe') {
          C.setSimulation(state, sim.snapshot());
          C.observe(state);
          persist();
          message = '已记录当前完整条件与模型计算结果。';
        } else if (action === 'check' || action === 'submit') {
          const result = action === 'check' ? C.check(state) : C.submit(state);
          message = result.ready
            ? (action === 'submit' ? '已创建提交快照；保存状态见上方。' : '三个任务的固定证据齐全，请自行核对解释后提交。')
            : C.TASKS.flatMap(id => result.tasks[id].issues.map(v => D.tasks[id].title + '：' + v)).join(' ');
          if (action === 'submit' && result.ready) persist();
        } else if (action === 'restore' && pending) {
          const restored = pending.state;
          const result = store.write(restored, { restore: true });
          if (result.ok) {
            state = restored;
            pending = null;
            message = '已恢复并读回确认；其他课程记录保留。';
            saveNotice = message;
            paint(view === 'practice');
          } else {
            saveNotice = '未保存：' + result.error;
            message = '恢复未应用，当前内存稿保留。';
          }
        } else if (action === 'cancel') {
          pending = null;
          message = '已取消恢复，当前实验稿保留。';
        }
      } catch (error) {
        message = error.message;
      }
      feedback();
    };

    paint(view === 'practice');
  }

  window.addEventListener('storage', e => {
    if (e.key === C.KEY || e.key === null) feedback();
  });

  window.CurrentWorkspace = { render, physics, destroy, summary };
})();
