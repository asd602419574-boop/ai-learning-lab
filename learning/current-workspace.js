/* Host course UI. All durable writes pass through LearningStorage. */
(() => {
  'use strict';
  const C=window.CurrentCore,D=window.CurrentContent;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let host,store,state,sim=null,pending=null,message='',saveNotice='';
  const q=selector=>host?.querySelector(selector);
  function ensure(){
    if(store)return;
    store=C.createStore(window.LearningStorage.storage);state=store.read();
    saveNotice=store.getError()||'当前浏览器自动保存；刷新可继续。重要记录请另行导出。';
  }
  function destroy(){if(sim){sim.destroy();sim=null;}}
  function writable(){return window.LearningStorage.role==='writer';}
  function persist(restore=false){
    if(!writable()){saveNotice='只读：请先在此页继续学习，再修改记录。';return false;}
    state.updatedAt=new Date().toISOString();const result=store.write(state,{restore});
    saveNotice=result.ok?'已保存并读回确认 · '+new Date().toLocaleTimeString()+' · 刷新可恢复。':'未保存：'+result.error+'；当前稿仍可导出JSON。';
    return result.ok;
  }
  function download(text,name){const url=URL.createObjectURL(new Blob([text],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function summary(){ensure();return {started:C.TASKS.some(id=>state.tasks[id].rounds.length||state.tasks[id].prediction),versions:state.submissions.length};}
  function physics(){
    ensure();const s=summary();return `<div class="current-course current-subject"><header><p class="current-kicker">物理 / 电学</p><h1>从一个条件的变化，理解一个规律。</h1><p>先读原理与完整示范，再亲手控制变量、观察模拟数值，留下可以解释的实验记录。</p></header><article class="current-subject-card"><span class="current-kicker">交互实验 · 无需编程</span><h2>电流探索实验课</h2><p>连接宏观电路与微观漂移，探索电压、电阻与串并联关系。包含两项单变量任务和一次独立迁移；无需先完成AI课程。</p><p>${s.started?'本机已有实验稿 · 已保存提交版本 '+s.versions:'尚未开始 · 学习时长由你自己安排'}</p><a class="btn" href="#current">阅读原理与示范 →</a> ${s.started?'<a class="btn btn-secondary" href="#current?view=practice">继续实验</a>':''}</article><p><a href="#pathways">人工智能学科 →</a> · <a href="#home">返回学科选择</a></p></div>`;
  }
  const labels={prediction:'预测：改变条件后，电流会怎样？',reason:'预测理由：依据哪条规律？',explanation:'对比与解释：预测与模拟是否一致？为什么？',revision:'修正与重试记录：检查了什么，下一次如何做？'};
  function backup(){return `<section class="current-backup"><h2>本实验的独立备份</h2><p>实验自动保存在当前浏览器与地址。原全站备份暂不包含本实验和V2.3独立稿；本实验请使用下面的JSON。换设备、换端口或清理浏览器需要自行备份恢复。</p><button class="btn btn-secondary" data-current-action="export">导出本实验JSON</button> <button class="btn btn-secondary" data-current-action="raw">导出本机原始记录</button><label>选择本实验JSON，先预览再确认<input type="file" accept="application/json,.json" data-current-file></label><div data-current-preview aria-live="polite"></div></section>`;}
  function workbench(){
    const task=state.tasks[state.activeTask];
    return `<p class="current-save" data-current-save role="status" aria-live="polite"></p><section class="current-task"><label>选择本轮任务<select data-current-task>${C.TASKS.map(id=>`<option value="${id}"${id===state.activeTask?' selected':''}>${D.tasks[id].title}</option>`).join('')}</select></label><p data-current-instruction>${D.tasks[state.activeTask].instruction}</p><p>切换任务会设置起始参数，保留各任务的预测、轮次与观察。模拟器可自由探索；完成任务仍需按题目控制变量。</p><div class="current-notes">${['prediction','reason'].map(k=>`<label>${labels[k]}<textarea rows="2" maxlength="6000" data-current-note="${k}">${esc(task[k])}</textarea></label>`).join('')}</div><button class="btn" data-current-action="begin">锁定预测，开始本轮</button><p>每次重试会保留之前的预测与观察，不改写旧轮次。</p></section><div class="current-sim" data-current-sim></div><section class="current-task"><h2>记录、解释与修订</h2><p>下面的结果均为模型计算值。曲线与动画帮助解释，不代表真实测量。</p><button class="btn" data-current-action="observe">记录本轮条件与读数</button><div data-current-observations></div><div class="current-notes">${['explanation','revision'].map(k=>`<label>${labels[k]}<textarea rows="3" maxlength="6000" data-current-note="${k}">${esc(task[k])}</textarea></label>`).join('')}</div><details><summary>自评提示：怎样解释与核对？</summary><p>写清固定量、改变量、两组模拟值以及使用的公式。若预测不符，检查开关、单位或是否同时改变了其他量；修正后点击上方“锁定预测，开始本轮”再记录。迁移任务先分清支路与总电流。文字只检查是否填写，内容是否合理请对照原理。</p></details><div class="current-actions"><button class="btn btn-secondary" data-current-action="check">检查任务证据</button><button class="btn" data-current-action="submit">提交并保存当前版本</button></div><div data-current-feedback role="status" aria-live="polite"></div></section>${backup()}<section class="current-task"><h2>已保存的提交版本</h2><div data-current-history></div></section>`;
  }
  function feedback(){
    if(!host?.isConnected)return;
    const task=state.tasks[state.activeTask],round=task.rounds.at(-1);
    if(q('[data-current-save]'))q('[data-current-save]').textContent=(writable()?'':'本页只读；可阅读或导出，请使用页面上方的切换按钮取得写入权。 ')+saveNotice;
    const observations=q('[data-current-observations]');
    if(observations)observations.innerHTML=round?`<p>第 ${task.rounds.length} 轮 · 初始预测：${esc(round.prediction)} · 理由：${esc(round.reason)}</p><div class="current-table-wrap"><table><caption>本轮完整条件与模拟结果</caption><thead><tr><th>模型 / 连接 / 开关</th><th>U (V)</th><th>R₁ / R₂ (Ω)</th><th>I总 / I₁ / I₂ (A)</th></tr></thead><tbody>${round.observations.map(o=>`<tr><td>${o.params.mode==='wire'?esc(o.params.material)+'电阻丝':'恒温理想电阻'} / ${esc(o.params.topology)} / ${o.params.closed?'闭合':'断开'}<br>${o.params.temperature}℃ · L=${o.params.length} m · A=${o.params.area} mm²</td><td>${o.params.voltage}</td><td>${o.result.r1.toPrecision(4)} / ${o.params.r2}</td><td>${o.result.current.toPrecision(4)} / ${o.result.i1.toPrecision(4)} / ${o.result.i2.toPrecision(4)}</td></tr>`).join('')}</tbody></table></div>`:'<p>尚无本轮观察。先填写并锁定预测，再调参记录。</p>';
    const panel=q('[data-current-feedback]');
    if(panel)panel.innerHTML=`<p>${esc(message)}</p><strong>${C.current(state)?'已提交当前版本；符合本课固定证据规则。':'当前稿尚未提交，或已在上次提交后修改；历史版本仍保留。'}</strong><p>自动检查核对任务条件与材料，不评价开放解释，不认证知识掌握。</p>`;
    const history=q('[data-current-history]');
    if(history)history.innerHTML=state.submissions.map((v,i)=>`<details><summary>版本 ${i+1} · ${esc(v.at)}</summary><pre>${esc(JSON.stringify(v.tasks,null,2))}</pre></details>`).join('')||'<p>尚无提交版本。完成三个任务后提交，平时的草稿会自动保存。</p>';
    const preview=q('[data-current-preview]');
    if(preview)preview.innerHTML=pending?`<p>待恢复 ${esc(pending.name)}：${pending.state.submissions.length} 个提交版本，${C.TASKS.reduce((n,id)=>n+pending.state.tasks[id].rounds.length,0)} 轮观察。确认会替换本实验当前稿与版本；其他课程不受影响。请先导出需要保留的内容。</p><button class="btn" data-current-action="restore">确认恢复本实验</button> <button class="btn btn-secondary" data-current-action="cancel">取消</button>`:'';
  }
  function paint(practice){
    destroy();
    host.innerHTML=`<div class="current-course ${practice?'current-practice':'current-reading'}"><header><p class="current-kicker"><a href="#physics">物理</a> / 电学 / 电流探索</p><h1>电流探索实验课</h1><p>控制一个变量，用模拟值检验预测，用原理解释变化。</p><nav class="current-view-tabs" aria-label="电流课程"><a href="#current"${practice?'':' aria-current="page"'}>背景、原理与示范</a><a href="#current?view=practice"${practice?' aria-current="page"':''}>实验与个人记录</a></nav></header>${practice?workbench():`<article data-current-reading>${D.reading}</article><a class="btn" href="#current?view=practice" data-current-start>已读原理与示范，开始实验 →</a>${backup()}`}</div>`;
    if(practice)sim=window.CurrentSimulation.mount(q('[data-current-sim]'),state.simulation,value=>{
      if(!writable())return;
      try{C.setSimulation(state,value);persist();}catch(error){message=error.message;}
      feedback();
    });
    feedback();
  }
  function render(root,view='reading'){
    ensure();host=root;pending=null;message='';
    host.oninput=e=>{const k=e.target.dataset.currentNote;if(k&&writable()){
      try{C.setNote(state,k,e.target.value);persist();}
      catch(error){e.target.value=state.tasks[state.activeTask][k];message=error.message;}
      feedback();
    }};
    host.onchange=async e=>{
      if(e.target.hasAttribute('data-current-task')&&writable()){
        try{C.setSimulation(state,{...state.simulation,params:{...C.DEFAULT_PARAMS,...D.tasks[e.target.value].params}});state.activeTask=e.target.value;persist();paint(true);q('[data-current-task]')?.focus();}
        catch(error){e.target.value=state.activeTask;message=error.message;feedback();}return;
      }
      if(!e.target.hasAttribute('data-current-file')||!writable())return;
      const file=e.target.files?.[0];if(!file)return;
      try{if(file.size>8000000)throw Error('文件超过8MB；请使用本实验导出的紧凑JSON');pending={name:file.name,state:C.parse(await file.text())};message='仅预览，当前实验稿尚未覆盖。';}
      catch(error){pending=null;message='文件未应用：'+error.message;}
      e.target.value='';feedback();
    };
    host.onclick=e=>{
      const button=e.target.closest('[data-current-action]');if(!button)return;
      const action=button.dataset.currentAction;
      try{
        if(action==='export'){const raw=C.serialize(state);C.parse(raw);download(raw,'current-experiment.json');message='已发起下载，请确认文件已保留。';}
        else if(action==='raw'){download(store.raw()??'null','current-original-record.json');message='已导出本机原始记录，未修改内容。';}
        else if(!writable())message='请先在此页继续学习后再修改或恢复。';
        else if(action==='begin'){C.startRound(state);persist();message='当前预测已锁定；现在调参并记录。';}
        else if(action==='observe'){C.setSimulation(state,sim.snapshot());C.observe(state);persist();message='已记录当前完整条件与模型计算结果。';}
        else if(action==='check'||action==='submit'){
          const result=action==='check'?C.check(state):C.submit(state);
          message=result.ready?(action==='submit'?'已创建提交快照；保存状态见上方。':'三个任务的固定证据齐全，请自行核对解释后提交。'):C.TASKS.flatMap(id=>result.tasks[id].issues.map(v=>D.tasks[id].title+'：'+v)).join(' ');
          if(action==='submit'&&result.ready)persist();
        }
        else if(action==='restore'&&pending){
          const restored=pending.state;
          const result=store.write(restored,{restore:true});
          if(result.ok){state=restored;pending=null;message='已恢复并读回确认；其他课程记录保留。';saveNotice=message;paint(view==='practice');}
          else {saveNotice='未保存：'+result.error;message='恢复未应用，当前内存稿保留。';}
        }
        else if(action==='cancel'){pending=null;message='已取消恢复，当前实验稿保留。';}
      }catch(error){message=error.message;}
      feedback();
    };
    paint(view==='practice');
  }
  window.addEventListener('storage',e=>{if(e.key===C.KEY||e.key===null)feedback();});
  window.CurrentWorkspace={render,physics,destroy,summary};
})();
