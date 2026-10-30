/* Real browser integration for the bounded textbook and evidence additions. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':decodeURIComponent(new URL(req.url,'http://local').pathname)));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true});
    const keys=require('../learning/storage.js').KEYS,protectedKeys=keys.filter(k=>!['ai_lab_textbook_v1','ai_lab_projects_v1'].includes(k));
    await context.addInitScript(({keys})=>{
      if(localStorage.getItem('fixture-initialized'))return;
      localStorage.setItem('fixture-initialized','yes');
      for(const key of keys)localStorage.setItem(key,JSON.stringify({sentinel:key}));
      localStorage.setItem('ai_lab_textbook_v1',JSON.stringify({'neural-training':{opened:true,completed:true,quiz:{0:true,1:false}},rag:{completed:true,quiz:{0:true}}}));
      localStorage.setItem('ai_lab_projects_v1',JSON.stringify({version:1,data:{rag:{size:65,k:2,query:'旧查询',docs:[{title:'保留文档',text:'这份文档用于检查历史学习成果仍被保留。'}],tested:true,evaluated:true,last:[]},ml:{alpha:2,trained:true,tested:true}}}));
    },{keys:protectedKeys});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'#courses?mode=textbook');await page.waitForSelector('.book-library-card');
    const previous=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),protectedKeys);
    assert.equal(await page.locator('.book-library-card').count(),13);
    await page.locator('.book-library-card[data-book-open="reliable-ai-workshop"]').click();
    await page.waitForSelector('.book-article table');assert((await page.locator('.book-article').innerText()).includes('三种判断'));
    assert(!(await page.locator('.book-article').innerText()).includes('<p>'),'authored HTML must render, not appear as markup');
    await page.locator('.book-bc-link').click();await page.locator('.book-library-card[data-book-open="neural-training"]').click();
    await page.waitForSelector('#bookGradientOutput');
    assert((await page.locator('.book-checkpoint').innerText()).includes('当前已核对 0/8'));
    await page.locator('[data-book-gradient-step]').click();
    assert((await page.locator('#bookGradientOutput').innerText()).includes('MSE=0.331852'));
    assert.equal(Number(await page.locator('#bookBias').inputValue()),1);
    await page.locator('[data-book-gradient-reset]').click();
    await page.locator('#bookRate').fill('0.55');
    for(let i=0;i<5;i++)await page.locator('[data-book-gradient-step]').click();
    assert((await page.locator('#bookGradientOutput').innerText()).includes('第5次更新'));
    await page.locator('[data-book-hidden="w1"]').fill('-1');
    assert((await page.locator('#bookHiddenOutput').innerText()).includes('dw₁=0'));
    const input=page.locator('#bookIntercept');await input.fill('-1');await page.locator('[data-book-gradient-reset]').click();
    assert((await page.locator('#bookGradientOutput').innerText()).includes('dw=-14.666667'));
    await page.locator('.book-answer[data-book-choice="0:0"]').click();await page.locator('[data-book-check="0"]').click();
    const book=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai_lab_textbook_v1')));
    assert.deepEqual(book['neural-training'].quiz,{0:true,1:false});assert.equal(book['neural-training'].completed,true);
    assert.equal(book['neural-training'].checks['2026-10-depth-1'][0],true);
    await page.locator('.book-nav-footer .next').click();await page.waitForSelector('[data-book-matrix="q"]');
    for(const [key,value] of Object.entries({q:'[1,0]',k:'[[0,1],[0,2]]',v:'[[2,4],[6,8]]'}))await page.locator(`[data-book-matrix="${key}"]`).fill(value);
    await page.locator('[data-book-attention]').click();assert((await page.locator('#bookAttentionOutput').innerText()).includes('上下文向量：[4, 6]'));
    await page.locator('[data-book-matrix="k"]').fill('[[1]]');await page.locator('[data-book-attention]').click();
    assert((await page.locator('#bookAttentionOutput').innerText()).includes('维度不匹配'));
    await page.locator('[data-book-matrix="k"]').fill('[[0,1],[0,2]]');await page.locator('[data-book-attention]').click();
    let download=page.waitForEvent('download');await page.locator('[data-book-lab-export]').click();const math=await download;
    assert.deepEqual(JSON.parse(fs.readFileSync(await math.path(),'utf8')).result.output,[4,6]);
    await page.goto(base+'#projects?id=rag');await page.waitForSelector('[data-evidence-text]');
    assert.equal(await page.locator('#ragQuery').inputValue(),'旧查询');
    await page.locator('[data-project="evidence-run"]').click();
    assert((await page.locator('[data-evidence-result]').innerText()).includes('来源命中：是'));
    assert((await page.locator('[data-evidence-result]').innerText()).includes('证据尚不完整'));
    await page.locator('[data-evidence-param="size"]').selectOption('180');await page.locator('[data-project="evidence-run"]').click();
    assert((await page.locator('[data-evidence-result]').innerText()).includes('必要原句覆盖：3/3'));
    await page.locator('[data-evidence-note="explanation"]').fill('原短块遗漏条件；增大块后核对现行来源，旧版高分仍不能直接采用。');
    await page.reload();await page.waitForSelector('[data-evidence-text]');
    assert.equal(await page.locator('[data-evidence-param="size"]').inputValue(),'180');
    assert((await page.locator('[data-evidence-note="explanation"]').inputValue()).includes('原短块遗漏条件'));
    await page.locator('[data-evidence-param="task"]').selectOption('child');
    await page.locator('[data-evidence-param="size"]').selectOption('45');await page.locator('[data-evidence-param="k"]').selectOption('1');await page.locator('[data-evidence-param="overlap"]').selectOption('20');
    await page.locator('[data-evidence-note="prediction"]').fill('需要核对少儿房间的预约、时刻与年龄条件，成人规则不适用。');
    await page.locator('[data-project="evidence-run"]').click();
    assert((await page.locator('[data-evidence-result]').innerText()).includes('证据尚不完整'));
    await page.locator('[data-evidence-param="size"]').selectOption('180');await page.locator('[data-project="evidence-run"]').click();
    assert((await page.locator('[data-evidence-result]').innerText()).includes('必要原句覆盖：3/3'));
    const original=await page.locator('[data-evidence-text]').inputValue();
    await page.locator('[data-evidence-text]').fill(original.replace('十二岁以下须监护人陪同','（本段条件缺失）'));
    assert((await page.locator('[data-evidence-result]').innerText()).includes('上次结果失效'));
    await page.locator('[data-project="evidence-run"]').click();assert((await page.locator('[data-evidence-result]').innerText()).includes('十二岁以下须监护人陪同'));
    await page.locator('[data-evidence-text]').fill(original);await page.locator('[data-project="evidence-run"]').click();
    download=page.waitForEvent('download');await page.locator('#evidenceLab [data-project="export-project"]').click();const file=await download;
    const artifact=JSON.parse(fs.readFileSync(await file.path(),'utf8'));
    assert.equal(artifact.data.evidence.report.row.complete,true);assert(artifact.data.evidence.attempts.some(a=>!a.report.row.complete));
    assert(artifact.data.docs.some(d=>d.title==='保留文档'));
    assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),protectedKeys),previous);
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('ai_lab_textbook_v1'))['neural-training'].quiz),{0:true,1:false});
    for(const width of [390,1920,2560,3840]){
      await page.setViewportSize({width,height:width===390?844:1080});await page.waitForTimeout(200);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`overflow at ${width}`);
    }
    const shotDir=fs.mkdtempSync(path.join(os.tmpdir(),'ai-depth-visual-'));
    await page.setViewportSize({width:1920,height:1080});await page.locator('#evidenceLab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shotDir,'retrieval.png')});
    await page.goto(base+'#courses?mode=textbook&lesson=transformers');await page.waitForSelector('.book-article');
    await page.locator('#bookLab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shotDir,'attention.png')});
    for(const width of [390,1920,2560,3840]){await page.setViewportSize({width,height:1080});await page.waitForTimeout(100);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'book overflow '+width+' '+JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right})).slice(-15))));}
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS: 13th textbook entry, bias/chain/attention edit and export, versioned quiz preserving old data, source-vs-evidence failure/revision, transfer, autosave/reload/export, 8 protected keys, four viewport widths; screenshots '+shotDir);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
