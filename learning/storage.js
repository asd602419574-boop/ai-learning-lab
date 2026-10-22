/* One cooperating writer per origin. Existing record keys and backup formats stay intact. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root&&root.document)root.LearningStorage=api.connect(root);
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const KEYS=Object.freeze(['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1']);
  const CONFLICT='学习记录已被其他页面改变。已停止保存，请先备份本页需要保留的内容，再重新载入最新记录。';
  function createGuard(raw,onConflict=()=>{}){
    const expected=new Map(KEYS.map(k=>[k,raw.getItem(k)]));
    function check(key){if(KEYS.includes(key)&&raw.getItem(key)!==expected.get(key)){onConflict();throw Error(CONFLICT);}}
    return {getItem:key=>raw.getItem(key),setItem(key,value){check(key);raw.setItem(key,value);if(KEYS.includes(key))expected.set(key,String(value));},removeItem(key){check(key);raw.removeItem(key);if(KEYS.includes(key))expected.set(key,null);}};
  }
  function connect(win){
    let role='starting',updated=false,release=null,channel=null,banner=null,guard,raw,resolveReady;
    const ready=new Promise(resolve=>resolveReady=resolve),disabled=new Set();
    const lockName='ai-learning-record-writer-v1';
    const allowed='[data-storage-activate],[data-action^="nav-"],[data-action="chapter"],[data-action="tab"],[data-action="concept"],[data-action="view-chapter"],[data-action="flip"],[data-action="flash-prev"],[data-action="flash-next"],[data-action="backup"],[data-action="export-artifact"],[data-reading-anchor],[data-learning-path],[data-book-open],[data-project="open"],[data-project="back"],[data-project="export-all"],[data-project="export-project"]';
    function stop(nextRole){role=nextRole;if(release){release();release=null;}paint();}
    function protectControls(){
      if(role==='writer'){
        for(const el of disabled)if(el.isConnected)el.disabled=false;
        disabled.clear();return;
      }
      win.document.querySelectorAll('#mainContent input,#mainContent textarea,#mainContent select,#mainContent button').forEach(el=>{
        if(el.matches(allowed)||el.disabled)return;el.disabled=true;disabled.add(el);
      });
    }
    function paint(){
      if(!banner)return;
      banner.hidden=role==='writer';
      const text=banner.querySelector('p'),button=banner.querySelector('button');
      const messages={starting:'正在检查学习记录…',reader:updated?'其他页面已更新学习进度。重新载入后可查看最新记录，或切换到此页继续学习。':'另一页面正在记录学习进度。本页可以阅读；需要作答时，可切换到此页继续学习。',switching:'正在切换作答页面，并载入最新学习记录…',conflict:CONFLICT,unsupported:'当前环境无法启用跨页面保存保护。本页可阅读，请通过 HTTPS 或 localhost 使用支持 Web Locks 的浏览器后保存学习记录。'};
      text.textContent=messages[role]||messages.reader;
      button.textContent=role==='conflict'?'重新载入最新记录':'在此页继续学习';
      button.disabled=['starting','switching','unsupported'].includes(role);
      banner.setAttribute('role',role==='conflict'?'alert':'status');
      protectControls();
    }
    async function activate(){
      if(role==='conflict'){win.location.reload();return;}
      if(role!=='reader')return;
      role='switching';paint();
      const controller=new win.AbortController();
      const timeout=win.setTimeout(()=>controller.abort(),5000);
      if(channel)channel.postMessage({type:'release-writer'});
      try{
        await win.navigator.locks.request(lockName,{signal:controller.signal},()=>{
          win.clearTimeout(timeout);
          // All module caches are reconstructed from the latest records before editing resumes.
          win.location.reload();return new Promise(resolve=>release=resolve);
        });
      }catch{role='reader';paint();}finally{win.clearTimeout(timeout);}
    }
    function mount(){
      const main=win.document.getElementById('mainContent');if(!main)return;
      banner=win.document.createElement('section');banner.className='learning-storage-notice';banner.setAttribute('data-storage-notice','');banner.innerHTML='<p></p><button type="button" data-storage-activate>在此页继续学习</button>';
      banner.querySelector('button').addEventListener('click',activate);main.prepend(banner);
      new win.MutationObserver(protectControls).observe(main,{childList:true,subtree:true});paint();
    }
    try{raw=win.localStorage;guard=createGuard(raw,()=>stop('conflict'));}catch{role='unsupported';}
    const unavailable=()=>{throw Error('当前页面不可保存学习记录，请先在此页继续学习或重新载入。');};
    const storage={getItem(key){if(!raw)unavailable();return raw.getItem(key);},setItem(key,value){if(KEYS.includes(key)&&role!=='writer')unavailable();if(!guard)unavailable();guard.setItem(key,value);},removeItem(key){if(KEYS.includes(key)&&role!=='writer')unavailable();if(!guard)unavailable();guard.removeItem(key);}};
    if(win.document.readyState==='loading')win.document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
    if(guard&&win.navigator.locks&&win.navigator.locks.request){
      if(win.BroadcastChannel){channel=new win.BroadcastChannel(lockName);channel.onmessage=e=>{if(e.data&&e.data.type==='release-writer'&&role==='writer')stop('reader');};}
      win.navigator.locks.request(lockName,{ifAvailable:true},lock=>{
        if(!lock){role='reader';resolveReady();paint();return;}
        role='writer';resolveReady();paint();return new Promise(resolve=>release=resolve);
      }).catch(()=>{role='unsupported';resolveReady();paint();});
    }else{role='unsupported';resolveReady();paint();}
    win.addEventListener('storage',event=>{
      if(event.storageArea!==raw||(event.key!==null&&!KEYS.includes(event.key)))return;
      updated=true;
      if(role==='writer')stop('conflict');else paint();
    });
    win.addEventListener('pagehide',()=>{if(release)release();release=null;role='reader';});
    win.addEventListener('pageshow',event=>{if(event.persisted)win.location.reload();});
    return {storage,ready,get role(){return role;}};
  }
  return {KEYS,createGuard,connect};
});
