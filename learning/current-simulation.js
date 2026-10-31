/* Adapted from Lliftime current lab; host-scoped DOM and disposable drawing lifecycle. */
(function(){
window.CurrentSimulation = { mount(host, initial, onChange) {
  host.innerHTML = `<nav class="current-exploration-tabs" aria-label="实验场景">
    <button data-page="linked">微观与宏观</button>
    <button data-page="wire">电阻丝</button>
    <button data-page="networks">串联与并联</button>
    <button data-page="resources">外部资源</button>
    <button id="reset">重置模拟参数</button>
    <button id="fullscreen">全屏模拟</button>
    <button id="assumptionsButton">模型边界与来源</button>
  </nav>
  <section class="intro">
    <div>
      <div class="eyebrow">A LITTLE MOTION. A BIG CONNECTION.</div>
      <h2 id="pageTitle">电流，从电子的一小步开始。</h2>
      <p id="pageSubtitle">拨动电压，看微观电子的运动，如何成为宏观电路中的电流。</p>
    </div>
    <div class="intro-tag">探索 · 观察 · 理解 <span>↘</span></div>
  </section>
  <div id="experimentPages">
    <div class="workspace">
      <div class="stage-column">
        <section class="card experiment-card">
          <div class="card-heading">
            <div class="title-with-number">
              <span class="section-index">01</span>
              <h2 id="macroTitle">宏观 · 看见电路</h2>
            </div>
            <button id="switch" class="pill-button on" aria-pressed="true"><span class="status-dot"></span>电路已闭合</button>
          </div>
          <div class="macro-wrap">
            <canvas id="macroCanvas" aria-label="闭合回路、电源、电阻和仪表的联动示意图">电路示意：电源、电阻与开关串联。电流 I=U/R。</canvas>
            <div class="macro-bottom">
              <span><i class="dot current"></i>约定电流 I</span>
              <span><i class="dot electron"></i>电子运动</span>
              <span class="diagram-note">理想电源 · 理想导线 · 稳态</span>
            </div>
          </div>
          <div class="scale-connector"><span></span><b>⌕</b> 放大电阻内部 <span></span></div>
          <div class="card-heading micro-heading">
            <div class="title-with-number">
              <span class="section-index">02</span>
              <h2>微观 · 跟随一个电子</h2>
            </div>
            <div class="view-toggle" aria-label="微观观察模式">
              <button data-view="combined" class="selected">随机 + 漂移</button>
              <button data-view="drift">仅看平均漂移</button>
            </div>
          </div>
          <div class="micro-wrap">
            <canvas id="microCanvas" aria-label="电子随机运动叠加与电流相反的定向漂移示意">电子的平均漂移方向与约定电流相反。</canvas>
            <div class="micro-overlay">
              <span id="leftPotential">高电势 +</span>
              <span id="rightPotential">低电势 −</span>
            </div>
          </div>
          <div class="micro-legend">
            <span><i class="dot electron"></i>自由电子 e⁻</span>
            <span><i class="dot ion"></i>晶格离子</span>
            <button id="track" aria-pressed="false">◎ 跟踪一个电子</button>
          </div>
          <div class="stage-footer">
            <span id="microCaption">电子不停地随机运动；电场让它们叠加一个向左的平均漂移。</span>
            <span class="tiny">粒子与速度均经示意缩放</span>
          </div>
        </section>
        <div class="insight">
          <span class="insight-icon" aria-hidden="true">↔</span>
          <div>
            <strong id="insightTitle">电子向左，电流向右。</strong>
            <p id="insightBody">电流方向按正电荷的运动方向规定；电子带负电，所以两者方向相反。</p>
          </div>
        </div>
      </div>
      <aside class="control-column">
        <section class="card controls">
          <div class="card-heading">
            <h2>实验控制台</h2>
            <span class="live-tag">实时联动</span>
          </div>
          <div class="control-group">
            <div class="control-label">
              <label for="voltage">电源电压 U <small class="param-tip">（电势差）</small></label>
              <output id="voltageValue">6.0 <small>V</small></output>
            </div>
            <input id="voltage" type="range" min="-12" max="12" value="6" step="0.1" aria-label="电源电压 U">
            <div class="range-labels">
              <span>−12 V</span>
              <button id="zeroVoltage">归零 (0V)</button>
              <span>+12 V</span>
            </div>
            <button id="reverse" class="reverse-button">⇄ 反转电源极性</button>
          </div>
          <div class="control-group" id="idealControls">
            <div class="control-label">
              <label for="resistance">回路电阻 R <small class="param-tip">（阻碍电流）</small></label>
              <output id="resistanceValue">10 <small>Ω</small></output>
            </div>
            <input id="resistance" type="range" min="1" max="100" value="10" step="1" aria-label="回路电阻 R">
            <div class="range-labels">
              <span>1 Ω</span>
              <span>100 Ω</span>
            </div>
            <p class="control-help">保持温度不变，控制单一变量探索电压与电流。</p>
          </div>
          <div id="wireControls" hidden>
            <div class="control-group">
              <label class="block-label" for="material">电阻丝材料</label>
              <select id="material">
                <option value="copper">铜 · Copper</option>
                <option value="aluminum">铝 · Aluminum</option>
                <option value="nichrome">镍铬合金 · Nichrome</option>
              </select>
              <p class="control-help" id="rhoLabel"></p>
            </div>
            <div class="control-group">
              <div class="control-label">
                <label for="length">长度 L</label>
                <output id="lengthValue"></output>
              </div>
              <input id="length" type="range" min="1" max="20" step="0.5" value="10" aria-label="导线长度 L">
              <div class="range-labels">
                <span>1 m</span>
                <span>20 m</span>
              </div>
            </div>
            <div class="control-group">
              <div class="control-label">
                <label for="area">截面积 A</label>
                <output id="areaValue"></output>
              </div>
              <input id="area" type="range" min="0.01" max="0.10" step="0.005" value="0.02" aria-label="截面积 A">
              <div class="range-labels">
                <span>0.01 mm²</span>
                <span>0.10 mm²</span>
              </div>
            </div>
            <div class="control-group">
              <div class="control-label">
                <label for="temperature">外部恒温 T</label>
                <output id="temperatureValue"></output>
              </div>
              <input id="temperature" type="range" min="20" max="100" step="1" value="20" aria-label="外部恒温 T">
              <p class="control-help">外部热浴固定温度；不模拟自发升温或熔断。</p>
            </div>
          </div>
          <div id="networkControls" hidden>
            <div class="control-group">
              <span class="block-label">连接方式</span>
              <div class="segmented">
                <button data-topology="series" class="selected">串联</button>
                <button data-topology="parallel">并联</button>
              </div>
            </div>
            <div class="control-group">
              <div class="control-label">
                <label for="r2">第二个电阻 R₂</label>
                <output id="r2Value"></output>
              </div>
              <input id="r2" type="range" min="1" max="100" value="20" step="1" aria-label="第二个电阻 R2">
            </div>
          </div>
          <div class="reading">
            <div>
              <span>电路总电流 I</span>
              <span class="reading-symbol">↗</span>
            </div>
            <output id="currentValue">0.600 <small>A</small></output>
            <div class="reading-track"><span id="currentBar"></span></div>
            <p id="readingFormula">I = U / R = 6.0 / 10 = 0.600 A</p>
            <div class="reading-model-tag">★ 理想恒温模型计算读数（I = U / R）</div>
          </div>
          <div class="secondary-readings">
            <div>
              <span id="resistanceLabel">总等效电阻</span>
              <strong id="totalRValue"></strong>
            </div>
            <div>
              <span>总发热功率 P</span>
              <strong id="powerValue"></strong>
            </div>
            <div>
              <span>1 秒内通过电荷量</span>
              <strong id="chargeValue"></strong>
            </div>
          </div>
          <div class="play-controls">
            <button id="play" aria-pressed="true">Ⅱ 暂停动画</button>
            <label for="speed">动画速率
              <select id="speed">
                <option value="0.25">0.25×</option>
                <option value="0.5">0.5×</option>
                <option value="1" selected>1×</option>
                <option value="2">2×</option>
              </select>
            </label>
          </div>
          <p class="control-help pause-note">暂停只冻结动画画面，不代表断路；读数仍按当前物理参数计算。</p>
        </section>
      </aside>
    </div>
    <section class="analysis-grid">
      <div class="card graph-card">
        <div class="card-heading">
          <div>
            <span class="small-kicker">把变化画出来</span>
            <h2>电压与电流，有迹可循。</h2>
          </div>
          <span class="graph-tag">I–U 特性曲线</span>
        </div>
        <canvas id="graphCanvas" aria-label="固定当前电阻时，电流与电压成正比的伏安特性曲线"></canvas>
        <div class="graph-footer">
          <span><i class="dot electron"></i>实线为闭合回路的理论直线</span>
          <button id="record">＋ 标记当前点</button>
          <button id="clearRecords" aria-label="清除全部标记">清除标记</button>
        </div>
        <div id="recordList" class="record-list">拖动电压滑块，观察工作点沿直线移动。</div>
      </div>
      <div class="card takeaway">
        <span class="small-kicker">核心规律</span>
        <h2 id="takeawayTitle">电压推动，电阻限制。</h2>
        <div class="formula" id="mainFormula">
          <span>I</span><b>=</b><span class="fraction"><i>U</i><i>R</i></span>
        </div>
        <p id="takeawayText">对温度不变的欧姆电阻，电压加倍，电流也加倍；电阻加倍，电流减半。</p>
        <div class="quick-presets">
          <button id="doubleVoltage">电压 ×2 ↗</button>
          <button id="doubleResistance">电阻 ×2 ↘</button>
        </div>
        <p class="control-help" id="presetNote">快捷实验：每次只改变一个变量。</p>
      </div>
    </section>
    <section id="networkAnalysis" class="card extra-panel" hidden>
      <div class="card-heading">
        <h2>两段电阻，一组守恒关系。</h2>
        <span class="live-tag">基尔霍夫定律</span>
      </div>
      <div id="branchReadings"></div>
    </section>
    <section class="learn-section">
      <div class="learn-heading">
        <span class="small-kicker">思考与验证</span>
        <h2>三个操作，理解电流的本质。</h2>
      </div>
      <div class="lesson-grid">
        <button class="lesson" data-lesson="zero">
          <span class="lesson-no">01 / 没有电压</span>
          <h3>电子还在动吗？ <b>↗</b></h3>
          <p>将电压设为零，观察随机无规则热运动与净定向流动的区别。</p>
        </button>
        <button class="lesson" data-lesson="reverse">
          <span class="lesson-no">02 / 改变方向</span>
          <h3>反接电源会怎样？ <b>↗</b></h3>
          <p>同时关注电场方向、电子漂移方向和约定电流方向的反转。</p>
        </button>
        <button class="lesson" data-lesson="area">
          <span class="lesson-no">03 / 改变截面积</span>
          <h3>导线更粗，意味着更快吗？ <b>↗</b></h3>
          <p>同材料、同电压下，电流加倍不等于漂移变快，因为载流子数成比例增加。</p>
        </button>
      </div>
      <div id="lessonFeedback" role="status" class="lesson-feedback" hidden></div>
    </section>
    <details class="advanced">
      <summary>进阶观察 · 从电场到漂移速度 <span>＋</span></summary>
      <div class="advanced-grid">
        <div>
          <h3>宏观与微观如何对应？</h3>
          <p>电流 I = ΔQ/Δt，1 A = 1 C/s。电阻丝内 E = U₁/L，J = I₁/A。平均电流密度与电场满足 J = E/ρ。对电子，J⃗ = −ne v⃗<sub>d</sub>，所以漂移方向与电场相反。</p>
          <p>铜按 n ≈ 8.5 × 10²⁸ m⁻³ 估算，|v<sub>d</sub>| = |I₁|/(neA)。其他材料未指定 n，不显示数值漂移速度。</p>
        </div>
        <div class="advanced-values" id="advancedValues"></div>
        <div>
          <h3>为什么合上开关很快就有电流？</h3>
          <p>金属导线内本来就有大量自由电子。电磁场的变化以近光速沿电路传播，使各处电子近乎同时响应；无须等某个电子从电源负极跑完整圈。本实验只显示建立后的稳态，不模拟开关瞬态或传播延迟。</p>
        </div>
      </div>
    </details>
  </div>
  <section id="resourcesPage" hidden>
    <div class="resource-intro">
      <span class="small-kicker">优先复用成熟资源</span>
      <h2>继续探索 PhET 的经典实验。</h2>
      <p>直接运行科罗拉多大学博尔德分校 PhET 官方 HTML5 模拟，保留原始署名与界面。它们与本页控制台独立，在线加载。</p>
    </div>
    <div class="resource-grid">
      <article class="card resource-card">
        <div class="resource-art">V = I R</div>
        <h3>欧姆定律</h3>
        <p>改变电压和电阻，直观看到电流变化。</p>
        <button data-phet="ohms-law">在此加载 ↗</button>
        <a href="https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html?locale=zh_CN" target="_blank" rel="noopener">在官方页面打开</a>
      </article>
      <article class="card resource-card">
        <div class="resource-art wire-art">R = ρ L / A</div>
        <h3>导线电阻</h3>
        <p>探索电阻率、导线长度、截面积之间的关系。</p>
        <button data-phet="resistance-in-a-wire">在此加载 ↗</button>
        <a href="https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_all.html?locale=zh_CN" target="_blank" rel="noopener">在官方页面打开</a>
      </article>
      <article class="card resource-card">
        <div class="resource-art circuit-art">⊕ ─ ▱ ─ ⊖</div>
        <h3>直流电路搭建</h3>
        <p>自由连接元件，用电流表和电压表探索电路。</p>
        <button data-phet="circuit-construction-kit-dc">在此加载 ↗</button>
        <a href="https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html?locale=zh_CN" target="_blank" rel="noopener">在官方页面打开</a>
      </article>
    </div>
    <div id="embedContainer" class="card" hidden>
      <div class="card-heading">
        <h2 id="embedTitle">PhET 官方模拟</h2>
        <button id="closeEmbed" class="text-button">关闭 ×</button>
      </div>
      <p class="embed-note">需要联网。若内嵌受浏览器或网络限制，请使用上方“在官方页面打开”。</p>
      <iframe id="phetFrame" title="PhET 官方互动模拟" allow="fullscreen" allowfullscreen></iframe>
    </div>
    <p class="resource-credit">PhET Interactive Simulations · University of Colorado Boulder。常规 HTML 模拟按 CC BY-NC 4.0 提供。Simulation by PhET Interactive Simulations, University of Colorado Boulder, licensed under CC BY-NC 4.0 (https://phet.colorado.edu)。仅非商业使用，商用另需许可。外部模拟不与本站共享记录。</p>
  </section>
  <details id="assumptions" class="assumptions">
    <summary>模型边界、物理依据与资源署名 <span>↗</span></summary>
    <div class="assumption-content">
      <div>
        <h3>这里计算了什么</h3>
        <p>理想直流电源、零电阻连接线、理想开关、理想仪表与恒温欧姆电阻。断路后稳态电流与电阻两端电压均为零，电源电压降在开关间隙。温度由外部设定，功率 P = UI 是能量转化速率，不是温度。</p>
        <p>电阻丝按 R = ρL/A、ρ(T) ≈ ρ₂₀[1 + α(T − 20℃)] 计算，限 20–100℃。材料数值为近似典型值，合金成分及样品差异可改变真实读数。</p>
      </div>
      <div>
        <h3>动画代表什么</h3>
        <p>经典粒子示意仅帮助区分无规则运动与平均漂移，不是真实量子轨迹。电子数量、晶格距离、随机运动速度和漂移速度分别缩放，动画速度非线性压缩，不能据此测量真实速度或碰撞率。图中粒子总数不表示真实载流子总数。</p>
        <p>电阻不消耗电荷；稳态同一无分支回路各处电流相同。电源通过内部过程维持电势差；本页不画电源内部的载流机制。</p>
      </div>
      <div>
        <h3>核对与延伸阅读</h3>
        <a href="https://openstax.org/books/university-physics-volume-2/pages/9-2-model-of-conduction-in-metals" target="_blank" rel="noopener">OpenStax · 金属导电与漂移速度 ↗</a>
        <a href="https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance" target="_blank" rel="noopener">OpenStax · 电阻率与电阻（材料数据）↗</a>
        <a href="https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law" target="_blank" rel="noopener">OpenStax · 欧姆定律 ↗</a>
        <a href="https://phet.colorado.edu/" target="_blank" rel="noopener">PhET · 官方互动模拟 ↗</a>
        <p>上述教材作为物理事实核对与延伸阅读来源；本站讲解与图形为自行编写。无第三方图片或代码拷贝。</p>
      </div>
    </div>
  </details>
  <footer>
    <a class="footer-brand" href="#">ϟ 流动 · CURRENT LAB</a>
    <span>让抽象的规律，成为看得见的变化。</span>
    <span>Author: Lliftime</span>
  </footer>`;

  let stopped = false, initializing = true, previous = "", animation = 0;

  const $ = id => host.querySelector("#" + id);
  const defaults = { voltage: 6, resistance: 10, closed: true, mode: 'ideal', material: 'copper', length: 10, area: .02, temperature: 20, topology: 'single', r2: 20 };
  let state = { ...defaults, ...initial.params },
      page = initial.params.mode === 'wire' ? 'wire' : initial.params.topology !== 'single' ? 'networks' : 'linked',
      view = 'combined', tracking = false,
      playing = !matchMedia('(prefers-reduced-motion: reduce)').matches,
      speed = 1, phase = 0,
      records = JSON.parse(JSON.stringify(initial.points || [])), p;
  const charts = ['macroCanvas', 'microCanvas', 'graphCanvas'].map(id => ({ id, el: $(id), ctx: $(id).getContext('2d'), w: 0, h: 0 }));
  const escapeLabel = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const f = (n, d = 3) => Number(n === 0 ? 0 : n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const compact = (n, unit) => Math.abs(n) >= 1000 ? `${f(n / 1000, 2)} k${unit}` : Math.abs(n) > 0 && Math.abs(n) < .001 ? `${f(n * 1e6, 2)} µ${unit}` : `${f(n, Math.abs(n) < 1 ? 3 : 2)} ${unit}`;
  const sf = n => Number(n).toExponential(2).replace('e+', ' × 10^').replace('e-', ' × 10^−');
  const setText = (id, t) => $(id).textContent = t;

  function feedback(t) { setText('lessonFeedback', t); $('lessonFeedback').hidden = false; }
  function calculate() { p = CurrentPhysics.calculate(state); return p; }
  function resize() {
    if (stopped) return;
    for (const c of charts) {
      const box = c.el.getBoundingClientRect();
      if (box.width && box.height) {
        c.w = box.width;
        c.h = box.height;
        const dpr = Math.min(devicePixelRatio || 1, 4);
        c.el.width = Math.round(c.w * dpr);
        c.el.height = Math.round(c.h * dpr);
        c.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
    draw();
  }
  function changed() { const value = snapshot(), raw = JSON.stringify(value); if (!initializing && raw !== previous) { previous = raw; onChange(value); } }
  function snapshot() { return { params: { ...state }, points: JSON.parse(JSON.stringify(records)) }; }

  function update() {
    calculate();
    host.querySelectorAll('[data-view], [data-topology]').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('selected')));
    for (const key of ['voltage', 'resistance', 'material', 'length', 'area', 'temperature', 'r2']) $(key).value = state[key];
    $('voltageValue').innerHTML = `${f(state.voltage, 1)} <small>V</small>`;
    $('resistanceValue').innerHTML = `${f(state.resistance, 0)} <small>Ω</small>`;
    $('lengthValue').innerHTML = `${f(state.length, 1)} <small>m</small>`;
    $('areaValue').innerHTML = `${f(state.area, 3)} <small>mm²</small>`;
    $('temperatureValue').innerHTML = `${f(state.temperature, 0)} <small>℃</small>`;
    $('r2Value').innerHTML = `${f(state.r2, 0)} <small>Ω</small>`;
    $('currentValue').innerHTML = `${f(p.current, 3)} <small>A</small>`;
    setText('totalRValue', compact(p.totalR, 'Ω'));
    setText('powerValue', compact(p.power, 'W'));
    setText('chargeValue', compact(Math.abs(p.current), 'C'));
    setText('readingFormula', state.closed ? `I = U / R总 = ${f(state.voltage, 1)} / ${f(p.totalR, 2)} = ${f(p.current, 3)} A` : '断路：I = 0.000 A；电源电压降在开关间隙。');
    $('currentBar').style.width = `${Math.min(100, Math.abs(p.current) / 1.2 * 100)}%`;
    $('switch').classList.toggle('on', state.closed);
    $('switch').setAttribute('aria-pressed', state.closed);
    $('switch').innerHTML = state.closed ? '<span class="status-dot"></span>电路已闭合' : '○ 电路已断开';
    $('play').setAttribute('aria-pressed', playing);
    setText('play', playing ? 'Ⅱ 暂停动画' : '▶ 播放动画');
    $('track').setAttribute('aria-pressed', tracking);
    $('doubleVoltage').disabled = Math.abs(state.voltage) >= 12;
    $('doubleResistance').disabled = state.mode === 'ideal' ? state.resistance >= 100 : state.length >= 20;
    setText('doubleResistance', state.mode === 'wire' ? '长度 ×2 ↘' : '电阻 ×2 ↘');
    const dir = p.currentDirection;
    setText('leftPotential', !dir ? '无电势差' : dir > 0 ? '高电势 +' : '低电势 −');
    setText('rightPotential', !dir ? '无电势差' : dir > 0 ? '低电势 −' : '高电势 +');
    setText('microCaption', !state.closed ? '断路后的稳态：电阻内没有持续净电流；电子仍有随机运动。' : !dir ? '没有电压时，电子仍在随机运动，但平均漂移为零。' : `电子不停地随机运动；电场让它们叠加一个向${dir > 0 ? '左' : '右'}的平均漂移。`);
    if (!state.closed) {
      setText('insightTitle', '断开回路，持续电流归零。');
      setText('insightBody', '理想稳态下，电源电压降在开关间隙；电阻两端无电势差。电子并没有停止随机运动。');
    } else if (!dir) {
      setText('insightTitle', '电子在动，但没有净电流。');
      setText('insightBody', '没有电场造成的定向漂移，随机运动在统计上相互抵消；某个电子仍会穿过观察截面。');
    } else {
      setText('insightTitle', dir > 0 ? '电子向左，电流向右。' : '电子向右，电流向左。');
      setText('insightBody', '电流方向按正电荷的运动方向规定；电子带负电，所以两者方向相反。');
    }
    setText('rhoLabel', `ρ(${state.temperature}℃) ≈ ${sf(p.rho)} Ω·m`);
    if (state.mode === 'wire') {
      setText('takeawayTitle', '更长更难通过，更粗更易通过。');
      $('mainFormula').innerHTML = '<span>R</span><b>=</b><span>ρ</span><span class="fraction"><i>L</i><i>A</i></span>';
      setText('takeawayText', `当前电阻丝 R = ${f(p.r1, 3)} Ω。固定材料、温度和电压时，长度加倍会使电流减半，截面积加倍会使电流加倍。`);
    } else {
      setText('takeawayTitle', page === 'networks' ? (state.topology === 'series' ? '串联分电压，并联分电流。' : '同电压，各走各的支路。') : '电压推动，电阻限制。');
      $('mainFormula').innerHTML = '<span>I</span><b>=</b><span class="fraction"><i>U</i><i>R<small style="font-size:12px">总</small></i></span>';
      setText('takeawayText', page === 'networks' ? (state.topology === 'series' ? '串联中，流过各电阻的电流相同；两段电阻的电压降相加等于电源电压。' : '并联中，各支路电压相同；支路电流之和等于电源提供的总电流。') : '对温度不变的欧姆电阻，电压加倍，电流也加倍；电阻加倍，电流减半。');
    }
    if (state.mode === 'wire') $('advancedValues').innerHTML = `<p>电阻丝电场 E <strong>${compact(p.field, 'V/m')}</strong></p><p>电流密度 J <strong>${sf(p.currentDensity)} A/m²</strong></p><p>平均漂移速率 <strong>${p.drift === null ? '需给定 n' : compact(p.drift * 1000, 'mm/s')}</strong></p><p>温度 <strong>${state.temperature} ℃（外部固定）</strong></p>`;
    else $('advancedValues').innerHTML = `<p>电阻 R₁ <strong>${compact(p.r1, 'Ω')}</strong></p><p>电压 U₁ <strong>${compact(p.u1, 'V')}</strong></p><p>电流 I₁ <strong>${compact(p.i1, 'A')}</strong></p><p>定量微观读数 <strong>请切换电阻丝实验</strong></p>`;
    if (page === 'networks') $('branchReadings').innerHTML = `<div class="branch-box">R₁ = ${f(p.r1, 0)} Ω<strong>${f(p.i1, 3)} A</strong>U₁ = ${f(p.u1, 3)} V · P₁ = ${f(p.p1, 3)} W</div><div class="branch-box">R₂ = ${f(p.r2, 0)} Ω<strong>${f(p.i2, 3)} A</strong>U₂ = ${f(p.u2, 3)} V · P₂ = ${f(p.p2, 3)} W</div><div class="branch-box">${state.topology === 'series' ? '电压守恒 U = U₁ + U₂' : '电流守恒 I = I₁ + I₂'}<strong>${state.topology === 'series' ? f(p.u1 + p.u2, 3) + ' V' : f(p.i1 + p.i2, 3) + ' A'}</strong>${state.topology === 'series' ? 'I₁ = I₂ = ' + f(p.current, 3) + ' A' : 'U₁ = U₂ = ' + f(p.u1, 1) + ' V'}</div>`;
    draw();
    changed();
  }

  const titles = {
    linked: ['电流，从电子的一小步开始。', '拨动电压，看微观电子的运动，如何成为宏观电路中的电流。'],
    wire: ['一段电阻，藏着怎样的规律？', '改变材料、长度与截面积，连接电阻的外形和内部电子的运动。'],
    networks: ['两段电阻，电流如何选择路径？', '切换串联与并联，用电压分配和电流守恒理解一个完整回路。'],
    resources: ['好奇心，接着往前走。', '复用成熟的物理教学资源，把更多实验带到同一张桌面上。']
  };

  function go(next) {
    page = next;
    $('lessonFeedback').hidden = true;
    if (page !== 'resources' && $('phetFrame').getAttribute('src')) { $('phetFrame').src = 'about:blank'; $('embedContainer').hidden = true; }
    host.querySelectorAll('[data-page]').forEach(b => { const active = b.dataset.page === page; b.classList.toggle('active', active); b.setAttribute('aria-current', active ? 'page' : 'false'); });
    setText('pageTitle', titles[page][0]);
    setText('pageSubtitle', titles[page][1]);
    $('experimentPages').hidden = page === 'resources';
    $('resourcesPage').hidden = page !== 'resources';
    $('idealControls').hidden = page === 'wire';
    $('wireControls').hidden = page !== 'wire';
    $('networkControls').hidden = page !== 'networks';
    $('networkAnalysis').hidden = page !== 'networks';
    state.mode = page === 'wire' ? 'wire' : 'ideal';
    state.topology = page === 'networks' ? lastTopology : 'single';
    setText('macroTitle', page === 'networks' ? '宏观 · 两段电阻的连接' : '宏观 · 看见电路');
    update();
    requestAnimationFrame(resize);
  }

  let lastTopology = state.topology === 'parallel' ? 'parallel' : 'series';
  host.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => go(b.dataset.page)));
  for (const id of ['voltage', 'resistance', 'material', 'length', 'area', 'temperature', 'r2']) {
    $(id).addEventListener('input', e => {
      state[id] = id === 'material' ? e.target.value : Number(e.target.value);
      $('lessonFeedback').hidden = true;
      setText('presetNote', '快捷实验：每次只改变一个变量。');
      update();
    });
  }
  $('switch').addEventListener('click', () => { state.closed = !state.closed; update(); });
  $('play').addEventListener('click', () => { playing = !playing; update(); });
  $('speed').addEventListener('change', e => speed = Number(e.target.value));
  $('reverse').addEventListener('click', () => { state.voltage = -state.voltage; update(); });
  $('zeroVoltage').addEventListener('click', () => { state.voltage = 0; update(); });
  $('track').addEventListener('click', () => { tracking = !tracking; trail = []; update(); });
  $('doubleVoltage').addEventListener('click', () => {
    const before = state.voltage;
    state.voltage = Math.min(12, Math.max(-12, state.voltage * 2));
    setText('presetNote', before === 0 ? '零电压乘二仍为零，先调高电压。' : Math.abs(before * 2) > 12 ? '已到达电压上限，未完成严格倍增。' : '只改变电压，观察电流的倍增。');
    update();
  });
  $('doubleResistance').addEventListener('click', () => {
    if (state.mode === 'wire') {
      const before = state.length;
      state.length = Math.min(20, before * 2);
      setText('presetNote', before * 2 > 20 ? '长度达到 20 m 上限，未完成严格倍增。' : '长度加倍：固定电压时电流减半。');
    } else {
      const before = state.resistance;
      state.resistance = Math.min(100, before * 2);
      setText('presetNote', before * 2 > 100 ? '电阻达到 100 Ω 上限，未完成严格倍增。' : page === 'networks' ? 'R₁ 加倍；总电流由整个网络的等效电阻决定。' : '电阻加倍：固定电压时电流减半。');
    }
    update();
  });
  host.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { view = b.dataset.view; host.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('selected', x === b)); trail = []; update(); }));
  host.querySelectorAll('[data-topology]').forEach(b => b.addEventListener('click', () => { lastTopology = b.dataset.topology; state.topology = lastTopology; host.querySelectorAll('[data-topology]').forEach(x => x.classList.toggle('selected', x === b)); update(); }));
  $('reset').addEventListener('click', () => {
    state = { ...defaults }; records = []; view = 'combined'; tracking = false; playing = !matchMedia('(prefers-reduced-motion: reduce)').matches; speed = 1; phase = 0; lastTopology = 'series'; trail = []; $('speed').value = '1';
    host.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('selected', x.dataset.view === view));
    host.querySelectorAll('[data-topology]').forEach(x => x.classList.toggle('selected', x.dataset.topology === lastTopology));
    $('lessonFeedback').hidden = true;
    setText('presetNote', '快捷实验：每次只改变一个变量。');
    updateRecordList();
    go(page);
  });
  $('fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await host.requestFullscreen();
    } catch { feedback('当前浏览器不支持全屏，可使用浏览器的全屏菜单。'); }
  });
  $('assumptionsButton').addEventListener('click', () => { $('assumptions').open = true; $('assumptions').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

  function updateRecordList() {
    changed();
    $('recordList').innerHTML = records.length ? records.map((r, i) => `<span class="record-chip">${i + 1}. ${escapeLabel(r.label)} · ${f(r.u, 1)} V / ${f(r.i, 3)} A · R总 ${f(r.r, 2)} Ω</span>`).join('') : '拖动电压滑块，观察工作点沿直线移动。';
  }
  $('record').addEventListener('click', () => {
    if (records.length >= 12) records.shift();
    records.push({ u: state.voltage, i: p.current, r: p.totalR, label: state.closed ? state.mode === 'wire' ? CurrentPhysics.materials[state.material].name + '丝' : state.topology === 'single' ? '单电阻' : state.topology === 'series' ? '串联' : '并联' : '断路' });
    updateRecordList();
    draw();
  });
  $('clearRecords').addEventListener('click', () => { records = []; updateRecordList(); draw(); });

  host.querySelectorAll('[data-lesson]').forEach(b => b.addEventListener('click', () => {
    const lesson = b.dataset.lesson;
    if (lesson === 'zero') {
      go('linked'); state.closed = true; state.voltage = 0; view = 'combined'; playing = true;
      feedback('观察：随机热运动继续，但定向漂移、净电流和发热功率都为零。穿过截面的随机电子在宏观上相互抵消。');
    }
    if (lesson === 'reverse') {
      go('linked'); state.closed = true; state.voltage = state.voltage === 0 ? -6 : -state.voltage; playing = true;
      feedback('观察：电源极性反转，电场、电流和电子的平均漂移同时反向；电子漂移始终与电流相反，发热功率保持非负。');
    }
    if (lesson === 'area') {
      go('wire'); state = { ...state, voltage: 6, closed: true, material: 'copper', length: 10, area: .02, temperature: 20 };
      calculate(); const before = p; state.area = .04; calculate();
      feedback(`已将铜丝截面积从 0.020 加倍至 0.040 mm²：电阻 ${f(before.r1, 2)} → ${f(p.r1, 2)} Ω，电流 ${f(before.current, 3)} → ${f(p.current, 3)} A，而漂移速率仍为 ${f(p.drift * 1000, 3)} mm/s。因为单位体积参与导电的电子成比例增多。`);
      playing = true;
    }
    host.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('selected', x.dataset.view === view));
    update();
    $('pageTitle').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const phetTitles = { 'ohms-law': 'PhET · 欧姆定律', 'resistance-in-a-wire': 'PhET · 导线电阻', 'circuit-construction-kit-dc': 'PhET · 直流电路搭建' };
  host.querySelectorAll('[data-phet]').forEach(b => b.addEventListener('click', () => {
    const simId = b.dataset.phet;
    setText('embedTitle', phetTitles[simId]);
    $('embedContainer').hidden = false;
    $('phetFrame').src = `https://phet.colorado.edu/sims/html/${simId}/latest/${simId}_all.html?locale=zh_CN`;
    $('embedContainer').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  $('closeEmbed').addEventListener('click', () => { $('phetFrame').src = 'about:blank'; $('embedContainer').hidden = true; });

  // Canvas helpers. Electrical calculations always come from CurrentPhysics.
  function line(c, points, color = '#64748b', width = 2) {
    c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.stroke();
  }
  function text(c, t, x, y, color = '#334155', size = 12, align = 'center') {
    c.fillStyle = color;
    c.font = `${Math.max(size, 11)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif`;
    c.textAlign = align;
    c.textBaseline = 'middle';
    c.fillText(t, x, y);
  }
  function circle(c, x, y, r, fill, stroke) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.5; c.stroke(); }
  }
  function arrow(c, x, y, direction, color = '#b45309', len = 38) {
    if (!direction) return;
    line(c, [[x - direction * len / 2, y], [x + direction * len / 2, y]], color, 1.8);
    line(c, [[x + direction * (len / 2 - 5), y - 4], [x + direction * len / 2, y], [x + direction * (len / 2 - 5), y + 4]], color, 1.8);
  }
  function resistor(c, x, y, label, value) {
    c.fillStyle = '#f8fafc';
    c.strokeStyle = '#4f46e5';
    c.lineWidth = 1.8;
    c.beginPath();
    c.roundRect(x - 48, y - 13, 96, 26, 5);
    c.fill();
    c.stroke();
    text(c, label, x, y, '#4338ca', 13);
    text(c, `${label} ${compact(value, 'Ω')}`, x, y - 30, '#0f172a', 12);
  }

  function drawMacro() {
    const ch = charts[0], c = ch.ctx;
    if (!ch.w) return;
    c.clearRect(0, 0, ch.w, ch.h);
    c.save();
    c.scale(ch.w / 720, ch.h / 260);

    const wireColor = '#64748b', left = 85, right = 635, top = 66, bottom = 213;
    line(c, [[338, bottom], [left, bottom], [left, top], [right, top], [right, 113]], wireColor, 2.5);
    line(c, [[right, 159], [right, bottom], [375, bottom]], wireColor, 2.5);

    circle(c, right, 113, 3.5, '#4f46e5');
    circle(c, right, 159, 3.5, '#4f46e5');
    line(c, [[right, 159], [state.closed ? right : right - 28, 116]], state.closed ? '#10b981' : '#f59e0b', 2.5);
    text(c, 'S', right + 22, 135, '#334155', 12);

    line(c, [[338, state.voltage >= 0 ? 189 : 199], [338, state.voltage >= 0 ? 237 : 227]], '#4f46e5', state.voltage >= 0 ? 2.5 : 3.5);
    line(c, [[375, state.voltage >= 0 ? 199 : 189], [375, state.voltage >= 0 ? 227 : 237]], '#4f46e5', state.voltage >= 0 ? 3.5 : 2.5);
    text(c, state.voltage >= 0 ? '+' : '−', 324, 195, '#4f46e5', 15);
    text(c, state.voltage >= 0 ? '−' : '+', 389, 195, '#475569', 15);
    text(c, `理想电源 U = ${f(state.voltage, 1)} V`, 356, 250, '#1e293b', 12);

    if (state.topology === 'parallel') {
      line(c, [[230, top], [230, 125], [490, 125], [490, top]], wireColor, 2);
      resistor(c, 360, top, 'R₁', p.r1);
      resistor(c, 360, 125, 'R₂', p.r2);
      arrow(c, 530, top, Math.sign(p.i1), '#b45309');
      arrow(c, 530, 125, Math.sign(p.i2), '#b45309');
      text(c, `${f(p.i1, 3)} A`, 536, 47, '#0f172a', 11);
      text(c, `${f(p.i2, 3)} A`, 537, 146, '#0f172a', 11);
      text(c, `U₁ = U₂ = ${f(p.u1, 2)} V`, 359, 161, '#475569', 12);
    } else if (state.topology === 'series') {
      resistor(c, 265, top, 'R₁', p.r1);
      resistor(c, 455, top, 'R₂', p.r2);
      text(c, `U₁ = ${f(p.u1, 2)} V`, 265, 112, '#475569', 12);
      text(c, `U₂ = ${f(p.u2, 2)} V`, 455, 112, '#475569', 12);
      arrow(c, 565, top, p.currentDirection, '#b45309');
      text(c, '相同电流 I', 565, 41, '#b45309', 11);
    } else {
      resistor(c, 360, top, 'R', p.r1);
      line(c, [[274, top], [274, 131], [343, 131]], '#94a3b8', 1.2);
      line(c, [[377, 131], [446, 131], [446, top]], '#94a3b8', 1.2);
      circle(c, 360, 131, 18, '#ffffff', '#64748b');
      text(c, 'V', 360, 131, '#4338ca', 14);
      text(c, `${f(p.u1, 2)} V`, 360, 159, '#0f172a', 12);
      arrow(c, 192, top, p.currentDirection, '#b45309');
      text(c, 'I', 192, 44, '#b45309', 12);
      arrow(c, 530, top, p.electronDirection, '#0891b2');
      text(c, 'e⁻', 530, 44, '#0891b2', 12);
    }

    circle(c, 196, bottom, 23, '#ffffff', '#4f46e5');
    text(c, 'A', 196, bottom - 5, '#4338ca', 14);
    text(c, f(p.current, 3) + ' A', 196, bottom + 13, '#0f172a', 11);
    if (!state.closed) {
      text(c, '开关断开：无持续电流，电源电压降在开关间隙', 490, 188, '#b45309', 11);
    }

    // Electrons on external metal paths only; never animated through the source.
    {
      const path = [[338, bottom], [left, bottom], [left, top], [right, top], [right, bottom], [375, bottom]];
      const total = 253 + 147 + 550 + 147 + 260;
      const displacement = phase * Math.sign(p.current) * Math.min(100, 18 + Math.abs(p.current) * 40);
      for (let j = 0; j < 30; j++) {
        let distance = ((j * total / 30 - displacement) % total + total) % total;
        let pos;
        for (let k = 1; k < path.length; k++) {
          const a = path[k - 1], b = path[k], len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          if (distance <= len) {
            pos = [a[0] + (b[0] - a[0]) * distance / len, a[1] + (b[1] - a[1]) * distance / len];
            break;
          }
          distance -= len;
        }
        if (pos) {
          if (!state.closed && pos[0] === right && pos[1] > 109 && pos[1] < 163) continue;
          if ((state.topology !== 'single' && pos[1] === top && pos[0] > 210 && pos[0] < 500) || Math.hypot(pos[0] - 196, pos[1] - bottom) < 25 || Math.abs(pos[0] - 356) < 32 && pos[1] === top) continue;
          circle(c, pos[0], pos[1], 3.2, '#0284c7');
        }
      }
    }
    text(c, page === 'wire' ? '下方放大：整段电阻丝内部' : page === 'networks' ? '下方放大：R₁ 内部' : '下方放大：电阻内部', 359, 12, '#475569', 11);
    c.restore();
  }

  let particles = Array.from({ length: 66 }, (_, i) => ({ x: (i * .61803398875) % 1, y: .15 + ((i * .41421356) % 1) * .7, a: i * 2.39996, r: .7 + (i % 4) * .22 })), trail = [], lastTrack = null;
  function advance(dt) {
    phase += dt;
    const density = state.mode === 'wire' ? state.area / .02 : 1;
    const localFlux = state.mode === 'wire' ? p.i1 / density : p.i1;
    const widthRatio = state.mode === 'wire' ? .33 + state.length / 20 * .62 : 1;
    const drift = -Math.sign(localFlux) * Math.min(0.17, Math.abs(localFlux) * .07) / widthRatio;
    const jitter = view === 'combined' ? .08 : 0;
    for (let i = 0; i < particles.length; i++) {
      const e = particles[i];
      e.a += Math.sin(phase * 2.7 + i) * dt * 2.2;
      e.x = ((e.x + (drift + Math.cos(e.a) * jitter) * dt) % 1 + 1) % 1;
      e.y += Math.sin(e.a) * jitter * dt;
      if (e.y < .17) { e.y = .17; e.a = -e.a; }
      if (e.y > .84) { e.y = .84; e.a = -e.a; }
    }
    if (tracking) {
      const e = particles[0];
      if (lastTrack && Math.abs(e.x - lastTrack.x) > .5) trail = [];
      trail.push({ x: e.x, y: e.y });
      if (trail.length > 110) trail.shift();
      lastTrack = { ...e };
    }
  }

  function drawMicro() {
    const ch = charts[1], c = ch.ctx, w = ch.w, h = ch.h;
    if (!w) return;
    c.clearRect(0, 0, w, h);
    const top = 42, bottom = h - 30, mid = (top + bottom) / 2;
    const areaRatio = state.mode === 'wire' ? state.area / .02 : 1;
    const thickness = Math.min((bottom - top) / 2, 22 + Math.sqrt(areaRatio) * 11);
    const y0 = mid - thickness, y1 = mid + thickness;
    const span = state.mode === 'wire' ? w * (.33 + state.length / 20 * .62) : w - 20, x0 = (w - span) / 2, x1 = x0 + span;

    const grad = c.createLinearGradient(0, y0, 0, y1);
    grad.addColorStop(0, '#e0e7ff');
    grad.addColorStop(.5, '#f8fafc');
    grad.addColorStop(1, '#e0e7ff');
    c.fillStyle = grad;
    c.fillRect(x0, y0, span, y1 - y0);

    line(c, [[x0, y0], [x1, y0]], '#cbd5e1', 1.2);
    line(c, [[x0, y1], [x1, y1]], '#cbd5e1', 1.2);

    if (state.mode === 'wire') text(c, `L = ${f(state.length, 1)} m · A = ${f(state.area, 3)} mm²（尺寸示意）`, w / 2, 29, '#334155', 11);

    const cols = Math.max(7, Math.floor(span / 44)), rows = Math.max(2, Math.floor((y1 - y0) / 26));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const jig = view === 'combined' ? Math.sin(phase * 7 + i * 1.2 + j) * 1.2 : 0;
      const x = x0 + 15 + i * (span - 30) / (cols - 1) + jig, y = y0 + 12 + j * (y1 - y0 - 24) / (rows - 1) + jig;
      circle(c, x, y, 5.5, '#fef3c7');
      text(c, '+', x, y + .2, '#b45309', 10);
    }

    // Central section is a measuring surface, not a barrier.
    c.setLineDash([3, 4]);
    line(c, [[w * .51, y0 - 7], [w * .51, y1 + 7]], '#64748b', 1.2);
    c.setLineDash([]);
    text(c, '观察截面 A', w * .51, y1 + 17, '#475569', 11);

    if (tracking && trail.length > 1) {
      line(c, trail.map(v => [x0 + 5 + v.x * (span - 10), y0 + 6 + (v.y - .15) / .7 * (y1 - y0 - 12)]), '#d97706', 1.8);
    }

    const count = state.mode === 'wire' ? Math.min(66, Math.round(32 * Math.sqrt(areaRatio))) : 42;
    for (let i = 0; i < count; i++) {
      const e = particles[i];
      const x = x0 + 5 + e.x * (span - 10), y = y0 + 6 + (e.y - .15) / .7 * (y1 - y0 - 12);
      const tracked = tracking && i === 0;
      if (tracked) { circle(c, x, y, 9, '#fef08a80', '#ca8a04'); }
      circle(c, x, y, tracked ? 4.5 : 3.5, tracked ? '#eab308' : '#0284c7');
      text(c, '−', x, y - .3, '#ffffff', 8);
    }

    const dir = p.currentDirection;
    if (dir) {
      arrow(c, w * .3, h - 13, dir, '#b45309', Math.min(44, w * .1));
      text(c, '电场 E / 电流 I', w * .3 + 38, h - 13, '#b45309', 11, 'left');
      arrow(c, w * .73, h - 13, -dir, '#0284c7', Math.min(44, w * .1));
      text(c, '电子平均漂移', w * .73 + 28, h - 13, '#0284c7', 11, 'left');
    } else {
      text(c, view === 'combined' ? '无外加电压：电子无规则运动持续 · 平均漂移为零' : '平均漂移为零；电子仍在进行无规则热运动', w / 2, h - 12, '#475569', 11);
    }
    if (view === 'drift' && state.mode !== 'wire') text(c, '仅显示系综平均漂移，已隐藏无规则热运动', w / 2, 29, '#475569', 11);
  }

  function drawGraph() {
    const ch = charts[2], c = ch.ctx, w = ch.w, h = ch.h;
    if (!w) return;
    c.clearRect(0, 0, w, h);
    const left = 54, right = w - 25, top = 23, bottom = h - 33, cx = (left + right) / 2, cy = (top + bottom) / 2;
    const maxI = Math.max(12 / p.totalR, ...records.map(r => Math.abs(r.i)), .01) * 1.12;
    const x = u => cx + u / 12 * (right - left) / 2, y = i => cy - i / maxI * (bottom - top) / 2;

    c.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      const xx = x(i * 6), yy = y(i * maxI / 2);
      line(c, [[xx, top], [xx, bottom]], '#f1f5f9', 1);
      line(c, [[left, yy], [right, yy]], '#f1f5f9', 1);
      text(c, String(i * 6), xx, bottom + 13, '#475569', 11);
      if (i !== 0) text(c, Math.abs(i * maxI / 2) >= 1 ? f(i * maxI / 2, 1) : f(i * maxI / 2, 2), left - 7, yy, '#475569', 11, 'right');
    }

    line(c, [[left - 4, cy], [right + 6, cy]], '#cbd5e1', 1.2);
    line(c, [[cx, bottom + 4], [cx, top - 6]], '#cbd5e1', 1.2);
    text(c, 'U / V', right + 1, bottom + 23, '#0f172a', 12);
    text(c, 'I / A', left, top - 11, '#0f172a', 12);

    c.setLineDash([4, 4]);
    line(c, [[x(-12), y(-12 / p.totalR)], [x(12), y(12 / p.totalR)]], '#94a3b8', 1.5);
    c.setLineDash([]);
    if (state.closed) line(c, [[x(-12), y(-12 / p.totalR)], [x(12), y(12 / p.totalR)]], '#4f46e5', 1.8);

    for (const r of records) {
      circle(c, x(r.u), y(r.i), 3.5, '#f59e0b', '#b45309');
    }

    const px = x(state.voltage), py = y(p.current);
    line(c, [[px, cy], [px, py], [cx, py]], '#cbd5e1', 1);
    circle(c, px, py, 9, '#4f46e530');
    circle(c, px, py, 4.5, '#4f46e5', '#ffffff');

    const label = `(${f(state.voltage, 1)} V, ${f(p.current, 3)} A)`;
    text(c, label, px + (px > cx ? -9 : 9), Math.max(top + 5, py - 13), '#0f172a', 12, px > cx ? 'right' : 'left');
    if (!state.closed) text(c, '断路：实心工作点 I = 0 A；虚线仅为闭合回路参考', w / 2, top + 7, '#b45309', 11);
  }

  function draw() {
    if (page === 'resources') return;
    if (!p) calculate();
    drawMacro();
    drawMicro();
    drawGraph();
  }

  let last = 0;
  function frame(now) {
    if (stopped) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (playing && page !== 'resources' && !document.hidden) {
      advance(dt * speed);
      drawMacro();
      drawMicro();
    }
    animation = requestAnimationFrame(frame);
  }

  const visibility = () => { last = 0; };
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => { if (motion.matches) { playing = false; update(); } };

  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', visibility);
  motion.addEventListener('change', reduced);

  const observer = new ResizeObserver(resize);
  observer.observe($('macroCanvas'));

  go(page);
  updateRecordList();
  previous = JSON.stringify(snapshot());
  initializing = false;
  requestAnimationFrame(resize);
  animation = requestAnimationFrame(frame);

  return {
    snapshot,
    setParams(next) {
      state = { ...defaults, ...next };
      lastTopology = state.topology === 'parallel' ? 'parallel' : 'series';
      go(state.mode === 'wire' ? 'wire' : state.topology !== 'single' ? 'networks' : 'linked');
    },
    destroy() {
      stopped = true;
      cancelAnimationFrame(animation);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', reduced);
      $('phetFrame').src = 'about:blank';
    }
  };
}};
})();
