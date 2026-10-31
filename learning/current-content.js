/* Author: Lliftime. Fixed instructional material; equations use the supplied ideal model. */
window.CurrentContent = {
  tasks: {
    voltage: {
      title: '01 · 固定电阻，改变电压',
      instruction: '闭合单电阻回路，保持 R=10 Ω。分别记录 U=3 V 与 6 V；先预测电流如何变化，再核对两组模拟值。',
      params: { voltage: 3, resistance: 10, topology: 'single' }
    },
    resistance: {
      title: '02 · 固定电压，改变电阻',
      instruction: '闭合单电阻回路，保持 U=6 V。分别记录 R=10 Ω 与 20 Ω。对比电流；不要同时改变电压。',
      params: { voltage: 6, resistance: 10, topology: 'single' }
    },
    transfer: {
      title: '03 · 独立迁移：多一条支路',
      instruction: '理想6 V电源接10 Ω和20 Ω两个电阻。自行选择并联连接，预测总电流与各支路电流，记录结果并解释为何不能把电阻直接相加。可切换串联作反例对照。',
      params: { voltage: 6, resistance: 10, r2: 20, topology: 'series' }
    }
  },
  reading: `<div class="current-reading-nav-guide" aria-label="学习导引">
    <span class="editorial-kicker">学习顺序 · 从理解到探索</span>
    <h2>四步完成电学初探：先读懂，再动手</h2>
    <div class="current-reading-steps">
      <div class="reading-step-card current">
        <span class="step-num">01</span>
        <strong>背景与微观</strong>
        <p>电子运动与电流方向</p>
      </div>
      <div class="reading-step-card">
        <span class="step-num">02</span>
        <strong>物理量与规律</strong>
        <p>U、R、I 与欧姆定律</p>
      </div>
      <div class="reading-step-card">
        <span class="step-num">03</span>
        <strong>完整示范</strong>
        <p>只改一个条件的记录方法</p>
      </div>
      <div class="reading-step-card">
        <span class="step-num">04</span>
        <strong>显式进入实验</strong>
        <p>预测、观察与独立迁移</p>
      </div>
    </div>
  </div>

  <section>
    <h2>电流探索：让看不见的变化有依据</h2>
    <p>为什么接同一个电源，有些元件中电流大，有些小？这节课用可操控的理想模型，把电压、电阻与电流连接起来。目标是能只改变一个条件，读懂模拟数值，并用规律解释结果。无需编程，也不要求先学人工智能。</p>
    <div class="current-notice-card">
      <strong>★ 提示：关于本站的模拟计算值与真实测量</strong>
      <p>这里的电流、电压和功率读数均来自<strong>恒温理想欧姆模型计算</strong>，用于直观理解物理规律。真实实验室中的导线发热、电阻温度系数变化、电源内阻与测量仪表内阻在简化模型中均予忽略。模拟画面中的电子粒子与速度经示意缩放，用于区分微观概念，不能用直尺在屏幕上测量真实速度。</p>
    </div>
  </section>

  <section>
    <h2>1. 电流是什么，电子又向哪里走？</h2>
    <p>电流描述单位时间内通过某个截面的净电荷量：I = ΔQ / Δt。I 的单位是安培（A），1 A = 1 C/s。<strong>无规则热运动不等于持续净电流</strong>：即便没有外加电压，金属中的自由电子仍在不停地做无规则运动，但在宏观截面上各方向的流动在统计上相互抵消，没有持续的净定向输运。</p>
    <p>物理学中约定<strong>电流方向按正电荷移动方向定义</strong>。金属导电的微观实质是带负电的自由电子流动，因此自由电子的平均漂移方向与约定电流方向<strong>恰好相反</strong>。合上开关瞬间，电磁场以接近光速在整个闭合回路中建立，导线内各处的电子近乎同时开始定向漂移，无须等待某个电子从电源负极漫步跑完整圈。</p>
  </section>

  <section>
    <h2>2. 三个核心量、单位与实验条件控制</h2>
    <div class="current-concept-grid">
      <div class="concept-card">
        <span class="concept-symbol">U</span>
        <h3>电压（单位：伏特 V）</h3>
        <p>电势差，推动自由电荷定向流动的“推动力”。本模型可在 −12 V 至 +12 V 范围内调节，反转电源使电场和流动方向反转。</p>
      </div>
      <div class="concept-card">
        <span class="concept-symbol">R</span>
        <h3>电阻（单位：欧姆 Ω）</h3>
        <p>导体对电流流动的阻碍作用。电阻越大，相同电压下形成的电流越小。本模型基础部分采用恒温理想电阻元件。</p>
      </div>
      <div class="concept-card">
        <span class="concept-symbol">I</span>
        <h3>电流（单位：安培 A）</h3>
        <p>闭合稳态回路中单位时间通过的电荷量，计算公式为 <strong>I = U / R</strong>。例如：6.0 V ÷ 10 Ω = 0.600 A。</p>
      </div>
    </div>
    <p><strong>控制变量原则：</strong>只有在比较时严格保持其他条件不变，才能从数值变化推断规律。固定 R，U 加倍则 I 加倍；固定 U，R 加倍则 I 减半。如果电压和电阻同时加倍，电流将保持不变，这并不是前两条规律失效，而是两个变量同时变化相互抵消。</p>
    <p><strong>电路状态辨析：</strong>断路后，回路中没有持续净电流（I = 0 A），电阻两端电压为零，全部电源电压降在断开的开关间隙。暂停按钮只冻结模拟动画，并不等于断路，计算读数依然反映当前参数下的稳态值。</p>
  </section>

  <section>
    <h2>3. 完整示范：只改一个条件的操作规范</h2>
    <p>在进入正式实验前，请看这份标准的<strong>单变量控制示范</strong>：</p>
    <div class="current-demo-box">
      <ol class="current-demo-list">
        <li><strong>设定初始基准：</strong>单电阻回路，闭合开关，设置 U = 4 V，R = 20 Ω。通过公式 I = U / R 计算，理论读数为 4 ÷ 20 = 0.200 A。</li>
        <li><strong>写出预测与理由：</strong>若将 U 调至 8 V 并保持 R = 20 Ω 不变，预测电流将变为 0.400 A；依据是“固定电阻时，欧姆定律表明电流与电压成正比，电压翻倍电流亦翻倍”。</li>
        <li><strong>锁定预测并记录第一组：</strong>调至 4 V，点击【记录本轮条件与读数】，数据表记录 (4.0 V, 20 Ω, 0.200 A)。</li>
        <li><strong>只变电压记录第二组：</strong>保持电阻 20 Ω 不动，仅调节电压滑块至 8.0 V，再次记录，数据表呈现 (8.0 V, 20 Ω, 0.400 A)。</li>
        <li><strong>对照 I–U 伏安特性图：</strong>观察坐标系中的两点，两点与原点落在同一条直线上。直线的斜率即为导纳 1/R。</li>
        <li><strong>对比解释与复盘：</strong>观察值与预测完全吻合。若不符，检查开关是否未闭合、是否误触了电阻滑块、或是否把暂停当成了断路。</li>
      </ol>
    </div>
    <p>提示：模拟器控制台上的“＋ 记录当前点”仅用于在右上方的 I–U 特性曲线上打标记；下方任务区的<strong>“记录本轮条件与读数”</strong>才会将完整的条件和模拟结果归入正式任务证据中。</p>
  </section>

  <section>
    <h2>4. 迁移准备：串联与并联的本质区别</h2>
    <p>在完成基础单变量实验后，你将面对<strong>多电阻迁移任务</strong>：</p>
    <div class="current-network-contrast">
      <div class="contrast-col">
        <h3>串联连接（同一路径）</h3>
        <p>电流只有一条通道，流过两个电阻的电流处处相等：I = I₁ = I₂。总电阻为二者相加：R总 = R₁ + R₂。电源电压由两电阻按阻值比例分担：U = U₁ + U₂。</p>
      </div>
      <div class="contrast-col">
        <h3>并联连接（多路分流）</h3>
        <p>电流在节点分岔，两个电阻两端的电压相等：U₁ = U₂ = U。各支路按各自阻值独立分流：I₁ = U / R₁，I₂ = U / R₂。总电流为支路之和：<strong>I总 = I₁ + I₂</strong>。</p>
      </div>
    </div>
    <p><strong>避坑指南：</strong>在并联电路中，绝不能把两电阻直接相加作为总电阻！新增并联支路相当于拓宽了电荷流动的通道，总电阻必然小于任一单独支路，总电流大于单一电阻时的电流。</p>
  </section>

  <section>
    <h2>5. 自由探索与模型物理边界</h2>
    <p>电阻丝模型中满足电阻定律：R = ρL / A。在恒定材料、温度与电压下，截面积 A 加倍，电阻 R 减半，电流 I 加倍；而电子平均漂移速度保持不变，因为参与导电的载流子数量也成比例增加。进阶微观公式为 |v_d| = |I| / (n · e · A)。</p>
    <p>本站模型不模拟器件烧毁、瞬态火花或量子效应。如需进一步延伸查验经典教材，可查阅：
      <a href="https://openstax.org/books/university-physics-volume-2/pages/9-2-model-of-conduction-in-metals" target="_blank" rel="noopener">OpenStax 金属导电模型</a>、
      <a href="https://openstax.org/books/university-physics-volume-2/pages/9-3-resistivity-and-resistance" target="_blank" rel="noopener">电阻率与电阻</a> 与
      <a href="https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law" target="_blank" rel="noopener">欧姆定律</a>。
    </p>
  </section>

  <div class="current-reading-cta-box">
    <div class="cta-inner">
      <span class="editorial-kicker">准备就绪</span>
      <h2>原理已掌握，现在开启实验</h2>
      <p>你即将进入交互实验台，依次完成 3 项任务：固定电阻改变电压、固定电压改变电阻、以及双电阻并联独立迁移。每一步均可随时回看本原理。</p>
      <a class="btn" href="#current?view=practice">开始实验 →</a>
    </div>
  </div>`
};
