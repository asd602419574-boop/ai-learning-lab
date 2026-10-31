/* Apple & Award-Grade Interactive AI Labs Module
   Brings the interactive, vivid scientific enquiry model (Predict -> Experiment -> Observe -> Reflect)
   into the core AI curriculum.
*/
window.InteractiveLabs = (() => {
  'use strict';

  let currentTab = 'prompt'; // 'prompt' | 'rag' | 'neuron'

  // -------------------------------------------------------------
  // Lab 1: Prompt & Temperature Sampling Lab
  // -------------------------------------------------------------
  const promptState = {
    temp: 0.2,
    topP: 0.9,
    task: 'extract',
    systemPrompt: '你是一个严格的信息提取助手。只从给定的用户输入中提取【日期】与【金额】，输出为 JSON 格式。严禁编造任何未提及的信息。',
    userPrompt: '发票报销申请：10月28日打车去客户公司开会，发票金额共计 78.50 元，请审核。',
    prediction: null,
    samples: [],
    variance: 0
  };

  const PROMPT_PRESETS = {
    extract: {
      name: '结构化抽取（发票核销）',
      system: '你是一个严格的信息提取助手。只从给定的用户输入中提取【日期】与【金额】，输出为 JSON 格式。严禁编造任何未提及的信息。',
      user: '发票报销申请：10月28日打车去客户公司开会，发票金额共计 78.50 元，请审核。',
      recTemp: 0.0,
      candidates: [
        '{"date": "10月28日", "amount": 78.50}',
        '{"date": "10月28日", "amount": 78.50, "currency": "CNY"}',
        '{\n  "date": "2026-10-28",\n  "amount": 78.5,\n  "category": "打车"\n}',
        '根据您提供的信息，日期是10月28日，金额是78.50元。祝您报销顺利！'
      ]
    },
    creative: {
      name: '创意构思（产品命名）',
      system: '你是一个具有创意的品牌策划大师。为一款面向开发者的极简智能代码编辑器起一个独特的名字并附带一句话口号。',
      user: '设计 1 个名字和口号，要求具有科技感与极简优雅的质感。',
      recTemp: 0.9,
      candidates: [
        '「NovaCode」—— 让逻辑如星光般清澈流淌。',
        '「Aura」—— 呼吸感极简编码，灵感直达构建。',
        '「Kanso (简朴)」—— 剥离杂质，只留纯粹代码之美。',
        '「VortexLab」—— 极速响应，专为高执行力工程师打造。',
        '「Prism Studio」—— 折射每行代码的思维光谱。'
      ]
    }
  };

  function runPromptSampling() {
    const preset = PROMPT_PRESETS[promptState.task];
    const isLow = promptState.temp < 0.3;
    const isHigh = promptState.temp > 0.8;

    if (isLow) {
      // Deterministic / Greedy: Samples are nearly identical
      promptState.samples = [
        preset.candidates[0],
        preset.candidates[0],
        preset.candidates[0]
      ];
      promptState.variance = 0;
    } else if (!isHigh) {
      // Balanced
      promptState.samples = [
        preset.candidates[0],
        preset.candidates[1] || preset.candidates[0],
        preset.candidates[0]
      ];
      promptState.variance = 35;
    } else {
      // Creative / Diverse: Samples vary wildly
      const shuffled = [...preset.candidates].sort(() => Math.random() - 0.5);
      promptState.samples = [
        shuffled[0] || preset.candidates[0],
        shuffled[1] || preset.candidates[1],
        shuffled[2] || preset.candidates[2]
      ];
      promptState.variance = 85;
    }
    render();
  }

  // -------------------------------------------------------------
  // Lab 2: RAG Chunking & Retrieval Lab
  // -------------------------------------------------------------
  const ragState = {
    chunkSize: 90,
    overlap: 20,
    query: '报销住宿费的最高限额是多少？',
    sourceText: `企业差旅与财务报销管理规范（2026年修订版）。
第一条 差旅住宿标准：员工因公出差，一线城市住宿费报销上限为每日 550 元，新一线及二线城市每日上限为 400 元。超出上限部分需提前获得部门负责人特批，否则由员工自行承担。
第二条 交通出行规范：市内交通优先使用公共交通或合规网约车，单次打车超过 100 元需注明事由。跨城差旅一律乘坐高铁二等座或经济舱机票。
第三条 报销流程与凭证：所有发票需在消费发生后 30 日内提交系统审批。发票抬头必须与企业全称完全一致，连同支付凭证截图一并上传。
第四条 违规处理细则：严禁虚报、重报及提供不实发票，一经查实将严肃通报并记入合规考评。`,
    activeChunks: [],
    queryHits: []
  };

  function computeRagChunks() {
    const text = ragState.sourceText.trim();
    const size = Math.max(30, ragState.chunkSize);
    const overlap = Math.min(size - 10, Math.max(0, ragState.overlap));
    const step = size - overlap;
    const chunks = [];

    let start = 0;
    let idx = 1;
    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      const content = text.slice(start, end);
      chunks.push({
        id: idx++,
        start,
        end,
        content,
        isOverlap: start > 0 && overlap > 0
      });
      if (end >= text.length) break;
      start += step;
    }
    ragState.activeChunks = chunks;

    // Simulate vector search scoring
    const keywords = ragState.query.match(/[\u4e00-\u9fa5]{2,4}/g) || ['住宿', '限额', '报销'];
    const hits = chunks.map(chunk => {
      let score = 0.15;
      for (const kw of keywords) {
        if (chunk.content.includes(kw)) score += 0.35;
      }
      if (chunk.content.includes('550 元') || chunk.content.includes('住宿费')) score += 0.2;
      return {
        id: chunk.id,
        score: Math.min(0.98, Number(score.toFixed(2))),
        content: chunk.content
      };
    });

    hits.sort((a, b) => b.score - a.score);
    ragState.queryHits = hits.slice(0, 3);
  }

  // -------------------------------------------------------------
  // Lab 3: Neuron Decision Boundary Canvas Lab
  // -------------------------------------------------------------
  const neuronState = {
    w1: 1.2,
    w2: -0.8,
    b: 0.1,
    activation: 'linear'
  };

  // Fixed 2D sample points: [x, y, label] where label is +1 (blue) or -1 (amber)
  const NEURON_POINTS = [
    { x: -0.6, y: -0.5, label: -1 },
    { x: -0.4, y: -0.7, label: -1 },
    { x: -0.2, y: -0.3, label: -1 },
    { x: -0.7, y: -0.2, label: -1 },
    { x: -0.1, y: -0.6, label: -1 },
    { x: 0.5, y: 0.6, label: 1 },
    { x: 0.3, y: 0.7, label: 1 },
    { x: 0.6, y: 0.3, label: 1 },
    { x: 0.7, y: 0.5, label: 1 },
    { x: 0.2, y: 0.4, label: 1 }
  ];

  function drawNeuronCanvas(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Coordinate transformation helper: (-1 to 1) -> (0 to width)
    const toScreenX = x => ((x + 1) / 2) * width;
    const toScreenY = y => ((1 - y) / 2) * height;

    // Draw grid
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i <= width; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
    }
    for (let i = 0; i <= height; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }

    // Draw Axes
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toScreenX(0), 0); ctx.lineTo(toScreenX(0), height);
    ctx.moveTo(0, toScreenY(0)); ctx.lineTo(width, toScreenY(0));
    ctx.stroke();

    // Draw Decision Line: w1 * x + w2 * y + b = 0  =>  y = -(w1 * x + b) / w2
    const { w1, w2, b } = neuronState;
    if (Math.abs(w2) > 0.001) {
      const x1 = -1;
      const y1 = -(w1 * x1 + b) / w2;
      const x2 = 1;
      const y2 = -(w1 * x2 + b) / w2;

      ctx.strokeStyle = '#0f766e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(toScreenX(x1), toScreenY(y1));
      ctx.lineTo(toScreenX(x2), toScreenY(y2));
      ctx.stroke();
    }

    // Draw Points & calculate accuracy
    let correct = 0;
    NEURON_POINTS.forEach(pt => {
      const z = w1 * pt.x + w2 * pt.y + b;
      const pred = z >= 0 ? 1 : -1;
      const isRight = pred === pt.label;
      if (isRight) correct++;

      const sx = toScreenX(pt.x);
      const sy = toScreenY(pt.y);

      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, Math.PI * 2);
      ctx.fillStyle = pt.label === 1 ? '#0284c7' : '#d97706';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isRight ? '#ffffff' : '#ef4444';
      ctx.stroke();
    });

    const acc = Math.round((correct / NEURON_POINTS.length) * 100);
    const accEl = document.getElementById('neuronAcc');
    if (accEl) accEl.textContent = `${acc}% (${correct}/${NEURON_POINTS.length})`;
  }

  // -------------------------------------------------------------
  // HTML Template Renderers
  // -------------------------------------------------------------
  function renderPromptLab() {
    const isCreative = promptState.task === 'creative';
    return `
      <div class="lab-card">
        <div class="lab-stage-intro">
          <div>
            <h2>🔬 实验室 01：Prompt 与 Temperature 采样控制台</h2>
            <p>探索大模型采样的确定性与创造性平衡，像调节物理仪器一样直观感受温度对输出稳定度的影响。</p>
          </div>
          <span class="lab-badge">实时采样模拟</span>
        </div>

        <div class="lab-loop">
          <div class="lab-loop-step">
            <b>1. 提出预测</b>
            <p>当任务需要严格 JSON 抽取时，若将 Temperature 调高至 1.2 会发生什么？</p>
          </div>
          <div class="lab-loop-step">
            <b>2. 控制变量</b>
            <p>固定系统提示词，单变量调节温度与 Top-P，执行 3 次并行采样。</p>
          </div>
          <div class="lab-loop-step">
            <b>3. 观察与沉淀</b>
            <p>比对 3 次输出的一致性方差，理解为什么工具调用必须强制 low-temperature。</p>
          </div>
        </div>

        <div class="lab-split">
          <div class="lab-controls">
            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>任务预设模式</label>
              </div>
              <select class="lab-select" id="labPromptTaskSelect">
                <option value="extract" ${promptState.task==='extract'?'selected':''}>📋 结构化抽取（发票核销）- 要求确定性</option>
                <option value="creative" ${promptState.task==='creative'?'selected':''}>💡 创意构思（产品命名）- 鼓励多样性</option>
              </select>
            </div>

            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>Temperature (温度 / 随机度)</label>
                <span id="labTempVal">${promptState.temp.toFixed(2)}</span>
              </div>
              <input type="range" class="lab-slider" id="labTempSlider" min="0" max="1.5" step="0.05" value="${promptState.temp}">
              <small style="color:var(--lab-muted);font-size:11px;">0.0 = 贪心解码（严格一致）；1.2 = 高随机度（发散丰富）</small>
            </div>

            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>Top-P (核心采样范围)</label>
                <span id="labTopPVal">${promptState.topP.toFixed(2)}</span>
              </div>
              <input type="range" class="lab-slider" id="labTopPSlider" min="0.1" max="1.0" step="0.05" value="${promptState.topP}">
            </div>

            <button class="lab-btn-action" id="btnRunPromptSampling">
              <span>🎲</span> 立即执行 3 次并行采样
            </button>
          </div>

          <div class="lab-viewport">
            <div class="lab-view-box">
              <div class="lab-control-header" style="margin-bottom:12px;">
                <label style="font-size:13px;font-weight:700;">并行采样输出比对 (3 Samples)</label>
                <div class="lab-variance-bar">
                  <span>输出散布方差：</span>
                  <div class="lab-bar-track" style="width:100px;">
                    <div class="lab-bar-fill" style="width:${promptState.variance}%;"></div>
                  </div>
                  <b>${promptState.variance}%</b>
                </div>
              </div>

              <div class="lab-samples-grid">
                ${(promptState.samples.length ? promptState.samples : [PROMPT_PRESETS[promptState.task].candidates[0], PROMPT_PRESETS[promptState.task].candidates[0], PROMPT_PRESETS[promptState.task].candidates[0]]).map((s, i) => `
                  <div class="lab-sample-card">
                    <span class="lab-sample-title">采样 #${i+1}</span>
                    <div class="lab-sample-content">${s.replace(/\n/g, '<br>')}</div>
                  </div>
                `).join('')}
              </div>

              <div style="margin-top:auto;padding-top:14px;border-top:1px solid var(--lab-border);font-size:12.5px;color:var(--lab-muted);line-height:1.5;">
                💡 <b>物理机理对照</b>：Temperature 就像热力学分子热运动。<br>
                低温让概率最高的 Token 拥有绝对压倒性的选择概率（适合 API 接口、SQL 生成、数据提取）；高温则平滑所有 Token 的概率分布，激发出意想不到的词汇搭配。
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderRagLab() {
    computeRagChunks();
    const topHitId = ragState.queryHits[0]?.id;

    return `
      <div class="lab-card">
        <div class="lab-stage-intro">
          <div>
            <h2>🔬 实验室 02：RAG 语义切块与召回对齐台</h2>
            <p>直观观察文档切分大小（Chunk Size）与重叠窗口（Overlap）如何直接决定检索命中精度与上下文完整性。</p>
          </div>
          <span class="lab-badge">交互式语义检索</span>
        </div>

        <div class="lab-split">
          <div class="lab-controls">
            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>Chunk Size (切块字数)</label>
                <span id="labChunkSizeVal">${ragState.chunkSize} 字符</span>
              </div>
              <input type="range" class="lab-slider" id="labChunkSizeSlider" min="40" max="220" step="10" value="${ragState.chunkSize}">
              <small style="color:var(--lab-muted);font-size:11px;">太小易割裂关键事实；太大易引入无关噪音</small>
            </div>

            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>Overlap (滑动重叠字数)</label>
                <span id="labOverlapVal">${ragState.overlap} 字符</span>
              </div>
              <input type="range" class="lab-slider" id="labOverlapSlider" min="0" max="50" step="5" value="${ragState.overlap}">
              <small style="color:var(--lab-muted);font-size:11px;">重叠窗口用于保护处于边界上的核心事实</small>
            </div>

            <div class="lab-control-group">
              <label style="font-size:12.5px;font-weight:600;">模拟查询输入 (Query)</label>
              <input type="text" class="lab-input" id="labRagQueryInput" value="${ragState.query}">
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                <button type="button" class="rag-chip-btn" data-query="报销住宿费的最高限额是多少？" style="font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid var(--lab-border);background:var(--lab-surface);cursor:pointer;">住宿限额</button>
                <button type="button" class="rag-chip-btn" data-query="市内打车超过多少元需要注明事由？" style="font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid var(--lab-border);background:var(--lab-surface);cursor:pointer;">打车事由</button>
                <button type="button" class="rag-chip-btn" data-query="虚报发票有什么处罚后果？" style="font-size:11px;padding:3px 8px;border-radius:4px;border:1px solid var(--lab-border);background:var(--lab-surface);cursor:pointer;">违规处罚</button>
              </div>
            </div>
          </div>

          <div class="lab-viewport">
            <div class="lab-view-box">
              <div class="lab-control-header" style="margin-bottom:8px;">
                <label style="font-size:13px;font-weight:700;">实时分块全景（${ragState.activeChunks.length} 个独立 Chunk）</label>
                <span style="font-size:11.5px;color:var(--lab-accent);">高亮绿色为 Top-1 最佳匹配</span>
              </div>

              <div class="rag-chunks-container">
                ${ragState.activeChunks.map(chunk => `
                  <div class="rag-chunk ${chunk.id === topHitId ? 'hit' : ''}">
                    <span class="rag-chunk-num">CHUNK #${chunk.id} [${chunk.content.length}字]</span>
                    <span>${chunk.content}</span>
                  </div>
                `).join('')}
              </div>

              <div class="rag-scores-list">
                <div style="font-size:12px;font-weight:700;color:var(--lab-ink);margin-top:8px;">Top-3 检索相关性得分：</div>
                ${ragState.queryHits.map((hit, idx) => `
                  <div class="rag-score-item">
                    <span class="rag-score-badge">#${idx+1} [${Math.round(hit.score*100)}%]</span>
                    <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;">CHUNK #${hit.id}: ${hit.content}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderNeuronLab() {
    return `
      <div class="lab-card">
        <div class="lab-stage-intro">
          <div>
            <h2>🔬 实验室 03：单神经元分类与决策边界玩具</h2>
            <p>通过物理级滑块调节权重与偏置，亲手操控分类超平面旋转与平移，直观理解深度学习的最底层数学本质。</p>
          </div>
          <span class="lab-badge">60FPS 实时几何渲染</span>
        </div>

        <div class="lab-split">
          <div class="lab-controls">
            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>权重 W1 (X 轴灵敏度)</label>
                <span id="labW1Val">${neuronState.w1.toFixed(2)}</span>
              </div>
              <input type="range" class="lab-slider" id="labW1Slider" min="-3" max="3" step="0.1" value="${neuronState.w1}">
            </div>

            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>权重 W2 (Y 轴灵敏度)</label>
                <span id="labW2Val">${neuronState.w2.toFixed(2)}</span>
              </div>
              <input type="range" class="lab-slider" id="labW2Slider" min="-3" max="3" step="0.1" value="${neuronState.w2}">
            </div>

            <div class="lab-control-group">
              <div class="lab-control-header">
                <label>偏置 Bias (阈值截距)</label>
                <span id="labBVal">${neuronState.b.toFixed(2)}</span>
              </div>
              <input type="range" class="lab-slider" id="labBSlider" min="-2" max="2" step="0.05" value="${neuronState.b}">
            </div>

            <div style="padding:12px;background:var(--lab-surface);border:1px solid var(--lab-border);border-radius:8px;">
              <div style="font-size:12px;color:var(--lab-muted);margin-bottom:4px;">分类准确率</div>
              <strong id="neuronAcc" style="font-size:18px;color:var(--lab-accent);font-variant-numeric:tabular-nums;">--</strong>
            </div>
          </div>

          <div class="lab-viewport">
            <div class="lab-view-box" style="padding:12px;">
              <div class="neuron-canvas-wrap">
                <canvas id="neuronCanvas" width="560" height="280" class="neuron-canvas"></canvas>
              </div>
              <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:12px;color:var(--lab-muted);">
                <span>● 蓝色点：类别 A (正例)</span>
                <span>● 橙色点：类别 B (负例)</span>
                <span style="color:var(--lab-accent);font-weight:600;">—— 绿色实线：决策边界 (w1·x + w2·y + b = 0)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function render(container) {
    if (!container) return;

    container.innerHTML = `
      <div class="lab-shell">
        <header class="lab-header">
          <div class="lab-header-main">
            <h1><span>🔬</span> 交互式 AI 实验室</h1>
            <p>告别纸上谈兵与死记硬背。像物理实验一样，通过直观的滑块与动态可视化，探索大模型与机器学习的内核规律。</p>
          </div>
          <nav class="lab-tabs">
            <button class="lab-tab-btn ${currentTab==='prompt'?'active':''}" data-lab-tab="prompt">Prompt 与温度</button>
            <button class="lab-tab-btn ${currentTab==='rag'?'active':''}" data-lab-tab="rag">RAG 切块检索</button>
            <button class="lab-tab-btn ${currentTab==='neuron'?'active':''}" data-lab-tab="neuron">神经元决策边界</button>
          </nav>
        </header>

        <div id="labActiveContent">
          ${currentTab === 'prompt' ? renderPromptLab() : currentTab === 'rag' ? renderRagLab() : renderNeuronLab()}
        </div>
      </div>
    `;

    bindEvents();
    if (currentTab === 'neuron') {
      const canvas = document.getElementById('neuronCanvas');
      drawNeuronCanvas(canvas);
    }
  }

  function bindEvents() {
    // Tab switching
    document.querySelectorAll('[data-lab-tab]').forEach(btn => {
      btn.addEventListener('click', e => {
        currentTab = e.currentTarget.dataset.labTab;
        const container = document.getElementById('dynamicArea');
        render(container);
      });
    });

    // Lab 1 events
    const tempSlider = document.getElementById('labTempSlider');
    if (tempSlider) {
      tempSlider.addEventListener('input', e => {
        promptState.temp = parseFloat(e.target.value);
        const valEl = document.getElementById('labTempVal');
        if (valEl) valEl.textContent = promptState.temp.toFixed(2);
      });
    }

    const topPSlider = document.getElementById('labTopPSlider');
    if (topPSlider) {
      topPSlider.addEventListener('input', e => {
        promptState.topP = parseFloat(e.target.value);
        const valEl = document.getElementById('labTopPVal');
        if (valEl) valEl.textContent = promptState.topP.toFixed(2);
      });
    }

    const taskSelect = document.getElementById('labPromptTaskSelect');
    if (taskSelect) {
      taskSelect.addEventListener('change', e => {
        promptState.task = e.target.value;
        promptState.temp = PROMPT_PRESETS[promptState.task].recTemp;
        runPromptSampling();
      });
    }

    const btnRunPrompt = document.getElementById('btnRunPromptSampling');
    if (btnRunPrompt) {
      btnRunPrompt.addEventListener('click', () => {
        runPromptSampling();
      });
    }

    // Lab 2 events
    const chunkSizeSlider = document.getElementById('labChunkSizeSlider');
    if (chunkSizeSlider) {
      chunkSizeSlider.addEventListener('input', e => {
        ragState.chunkSize = parseInt(e.target.value, 10);
        const valEl = document.getElementById('labChunkSizeVal');
        if (valEl) valEl.textContent = `${ragState.chunkSize} 字符`;
        const container = document.getElementById('dynamicArea');
        render(container);
      });
    }

    const overlapSlider = document.getElementById('labOverlapSlider');
    if (overlapSlider) {
      overlapSlider.addEventListener('input', e => {
        ragState.overlap = parseInt(e.target.value, 10);
        const valEl = document.getElementById('labOverlapVal');
        if (valEl) valEl.textContent = `${ragState.overlap} 字符`;
        const container = document.getElementById('dynamicArea');
        render(container);
      });
    }

    const queryInput = document.getElementById('labRagQueryInput');
    if (queryInput) {
      queryInput.addEventListener('change', e => {
        ragState.query = e.target.value;
        const container = document.getElementById('dynamicArea');
        render(container);
      });
    }

    document.querySelectorAll('.rag-chip-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        ragState.query = e.currentTarget.dataset.query;
        const container = document.getElementById('dynamicArea');
        render(container);
      });
    });

    // Lab 3 events
    const w1Slider = document.getElementById('labW1Slider');
    const w2Slider = document.getElementById('labW2Slider');
    const bSlider = document.getElementById('labBSlider');

    const updateNeuron = () => {
      if (w1Slider) {
        neuronState.w1 = parseFloat(w1Slider.value);
        document.getElementById('labW1Val').textContent = neuronState.w1.toFixed(2);
      }
      if (w2Slider) {
        neuronState.w2 = parseFloat(w2Slider.value);
        document.getElementById('labW2Val').textContent = neuronState.w2.toFixed(2);
      }
      if (bSlider) {
        neuronState.b = parseFloat(bSlider.value);
        document.getElementById('labBVal').textContent = neuronState.b.toFixed(2);
      }
      const canvas = document.getElementById('neuronCanvas');
      drawNeuronCanvas(canvas);
    };

    if (w1Slider) w1Slider.addEventListener('input', updateNeuron);
    if (w2Slider) w2Slider.addEventListener('input', updateNeuron);
    if (bSlider) bSlider.addEventListener('input', updateNeuron);
  }

  return {
    render
  };
})();
