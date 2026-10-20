/* Feedback drafts stay in memory; learning records are never sent. */
const Feedback = (() => {
  const draft = {message:'', email:'', image:null, preview:'', busy:false, reading:false};
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let generation = 0;
  function status(message, error=false) {
    const el = document.getElementById('feedbackStatus');
    if(el){el.textContent=message;el.classList.toggle('error',error);}
  }
  function update() {
    const count=document.getElementById('feedbackCount'), submit=document.getElementById('feedbackSubmit');
    if(count)count.textContent=`${draft.message.length} / 2000`;
    if(submit){submit.disabled=draft.busy||draft.reading||!draft.message.trim();submit.textContent=draft.busy?'正在发送…':draft.reading?'正在读取截图…':'发送反馈 →';}
  }
  function attachment() {
    const el=document.getElementById('feedbackPreview');
    if(!el)return;
    el.innerHTML=draft.image?`<img src="${draft.preview}" alt="待提交的问题截图"><div><strong>${escape(draft.image.name)}</strong><small>${Math.ceil(draft.image.size/1024)} KB</small><button type="button" id="feedbackRemove">移除截图</button></div>`:'';
    const remove=document.getElementById('feedbackRemove');
    if(remove)remove.onclick=()=>{if(draft.busy)return;generation++;draft.reading=false;draft.image=null;draft.preview='';attachment();update();};
  }
  async function select(file) {
    if(draft.busy)return;
    const ticket=++generation;
    if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)){status('请选择 PNG、JPEG 或 WebP 图片。',true);return;}
    if(file.size>5*1024*1024){status('截图不能超过 5 MB，请压缩后再试。',true);return;}
    draft.reading=true;update();
    try {
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});
      const img=new Image();img.src=data;await img.decode();
      if(img.naturalWidth*img.naturalHeight>20000000)throw new Error('图片尺寸过大，请裁剪后再试。');
      if(ticket!==generation)return;
      draft.image=file;draft.preview=data;attachment();status('截图已添加，发送前请确认已遮盖敏感信息。');
    }catch(e){status(e.message||'无法读取这张图片，请重新选择。',true);}
    finally{if(ticket===generation){draft.reading=false;update();}}
  }
  function render() {
    const area=document.getElementById('dynamicArea');
    area.innerHTML=`<section class="feedback-heading"><span class="eyebrow">FEEDBACK · 一起改进学习体验</span><h2>说说你的想法</h2><p>发现课程错误、想要新功能、手机上哪里不好用，都可以告诉我。</p></section>
      <form id="feedbackForm" class="feedback-card">
        <div class="feedback-fields"><label for="feedbackMessage">想说点什么？<span class="feedback-required">必填</span></label><div class="feedback-textarea"><textarea id="feedbackMessage" name="message" required maxlength="2000" placeholder="比如：某道题的答案不太准确、想增加一个学习功能、手机上哪里不好点……" aria-describedby="feedbackCount">${escape(draft.message)}</textarea><small id="feedbackCount">0 / 2000</small></div>
        <label for="feedbackEmail">邮箱 <span>（选填）</span></label><input id="feedbackEmail" name="email" type="email" maxlength="254" autocomplete="email" placeholder="留下邮箱，方便回复你" value="${escape(draft.email)}">
        <label for="feedbackFile">截图 <span>（选填）</span></label><div id="feedbackDrop" class="feedback-drop"><input id="feedbackFile" type="file" accept="image/png,image/jpeg,image/webp"><label for="feedbackFile" class="feedback-upload"><span class="feedback-image-icon" aria-hidden="true">▧</span><span><strong>添加一张问题截图</strong><small>也可以粘贴或拖放到这里 · PNG、JPEG 或 WebP，最大 5 MB</small></span></label><div id="feedbackPreview" class="feedback-preview"></div></div>
        <p id="feedbackStatus" class="feedback-status" role="status" aria-live="polite"></p></div>
        <footer class="feedback-footer"><p>请勿提交密码、密钥、身份证件或无关个人信息。<br>发送后，内容、选填邮箱、截图及当前页面位置将保存到本站服务器，仅管理员可查看；不会上传你的学习记录。</p><button type="submit" class="btn" id="feedbackSubmit">发送反馈 →</button></footer>
      </form>`;
    const form=document.getElementById('feedbackForm');
    form.querySelector('#feedbackMessage').oninput=e=>{draft.message=e.target.value;update();};
    form.querySelector('#feedbackEmail').oninput=e=>{draft.email=e.target.value;};
    form.querySelector('#feedbackFile').onchange=e=>{select(e.target.files[0]);e.target.value='';};
    const drop=document.getElementById('feedbackDrop');
    drop.ondragover=e=>{e.preventDefault();drop.classList.add('dragging');};
    drop.ondragleave=()=>drop.classList.remove('dragging');
    drop.ondrop=e=>{e.preventDefault();drop.classList.remove('dragging');select(e.dataTransfer.files[0]);};
    form.onpaste=e=>{const image=[...e.clipboardData.items].find(item=>item.type.startsWith('image/'));if(image){e.preventDefault();select(image.getAsFile());}};
    form.onsubmit=async e=>{
      e.preventDefault();if(draft.busy||draft.reading||!form.reportValidity()||!draft.message.trim())return;
      draft.busy=true;update();status('正在发送，请稍候…');
      const payload={message:draft.message.trim(),email:draft.email.trim(),image:draft.preview||null,page:location.pathname};
      const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),20000);
      try{
        const response=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
        const data=await response.json().catch(()=>({}));
        if(!response.ok||!data.id)throw new Error(data.error||'反馈暂时无法发送，你填写的内容已保留，请稍后重试。');
        generation++;draft.message='';draft.email='';draft.image=null;draft.preview='';
        form.reset();attachment();status(`反馈已收到，感谢你的建议！编号：${data.id}`);
      }catch(err){status(err.name==='AbortError'?'发送超时，内容已保留。可稍后重试；如已收到，管理员会合并重复反馈。':err.message,true);}
      finally{clearTimeout(timer);draft.busy=false;update();}
    };
    attachment();update();
  }
  return {render};
})();
