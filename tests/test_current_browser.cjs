'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>{
  const p=new URL(req.url,'http://local').pathname;
  const f=path.resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));
  if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'text/html; charset=utf-8');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    const context=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true,reducedMotion:'reduce'});
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
    await page.goto(base);
    await page.evaluate(()=>{
      localStorage.setItem('ai_lab_textbook_v1',JSON.stringify({transformers:{opened:true,completed:true,quiz:{0:true}}}));
      localStorage.setItem('ai_training_practice_v1',JSON.stringify({3:123}));
      localStorage.setItem('ai_lab_change_v1',JSON.stringify(ChangeCore.empty()));
    });
    await page.reload();await page.locator('[data-subject="physics"]').first().click();
    await page.locator('a[href="#current"]').filter({hasText:'阅读'}).first().click();
    await page.waitForSelector('[data-current-reading]');assert((await page.locator('[data-current-reading]').innerText()).includes('完整示范'));
    assert.equal(await page.locator('#voltage').count(),0,'reading precedes experiment');
    await page.locator('[data-current-start]').click();await page.waitForSelector('#voltage');
    const key='ai_lab_sim_current_v1';
    const oldKeys=require('../learning/storage.js').KEYS.filter(k=>k!==key);
    const old=await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),oldKeys);
    async function value(id,n){await page.locator('#'+id).fill(String(n));}
    for(const id of ['voltage','resistance','transfer']){
      await page.locator('[data-current-task]').selectOption(id);
      await page.locator('[data-current-note="prediction"]').fill('我预测改变本轮变量会按欧姆定律改变总电流。');
      await page.locator('[data-current-note="reason"]').fill('先固定其他条件，再计算I=U/R；并联总电流为支路之和。');
      await page.locator('[data-current-action="begin"]').click();
      if(id==='voltage'){await value('voltage',3);await page.locator('[data-current-action="observe"]').click();await value('voltage',6);}
      if(id==='resistance'){await value('resistance',10);await page.locator('[data-current-action="observe"]').click();await value('resistance',20);}
      if(id==='transfer')await page.locator('[data-topology="parallel"]').click();
      await page.locator('[data-current-action="observe"]').click();
      await page.locator('[data-current-note="explanation"]').fill('模拟与预测对照后，固定电阻时电流随电压变化；并联电压相同且支路电流相加。');
      await page.locator('[data-current-note="revision"]').fill('再次核对固定条件与单位。');
    }
    await page.locator('[data-current-action="submit"]').click();assert((await page.locator('[data-current-feedback]').innerText()).includes('已提交'));
    const stored=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),key);assert.equal(stored.submissions.length,1);
    await page.reload();await page.waitForSelector('#voltage');assert.equal(await page.locator('[data-current-note="revision"]').inputValue(),'再次核对固定条件与单位。');
    let download=page.waitForEvent('download');await page.locator('[data-current-action="export"]').click();
    const file=await download,artifact=fs.readFileSync(await file.path(),'utf8');assert.equal(JSON.parse(artifact).submissions.length,1);
    await page.locator('[data-current-note="explanation"]').fill('新稿不应被预览覆盖');
    await page.locator('[data-current-file]').setInputFiles({name:'current.json',mimeType:'application/json',buffer:Buffer.from(artifact)});
    assert.equal(await page.locator('[data-current-note="explanation"]').inputValue(),'新稿不应被预览覆盖');
    await page.locator('[data-current-action="restore"]').click();assert.equal(await page.locator('[data-current-note="revision"]').inputValue(),'再次核对固定条件与单位。');
    assert.deepEqual(await page.evaluate(keys=>Object.fromEntries(keys.map(k=>[k,localStorage.getItem(k)])),oldKeys),old);
    await page.locator('[data-page="linked"]').click();
    await page.locator('#switch').click();assert((await page.locator('#currentValue').innerText()).includes('0.000'));
    await page.locator('#switch').click();await page.locator('#reverse').click();assert((await page.locator('#currentValue').innerText()).includes('-0.600'));
    await page.locator('#zeroVoltage').click();assert((await page.locator('#currentValue').innerText()).includes('0.000'));
    await value('voltage',6);await page.locator('[data-page="wire"]').click();
    await page.locator('#material').selectOption('aluminum');await page.locator('.current-sim .advanced > summary').click();assert((await page.locator('#advancedValues').innerText()).includes('需给定 n'));
    await page.locator('#material').selectOption('copper');await value('area',.04);await value('temperature',30);
    await page.locator('#record').click();await page.reload();await page.waitForSelector('#voltage');assert((await page.locator('#recordList').innerText()).includes('铜'));
    assert.equal(await page.locator('#area').inputValue(),'0.04');assert.equal(await page.locator('#temperature').inputValue(),'30');
    await page.locator('[data-page="networks"]').click();await page.locator('[data-topology="parallel"]').click();assert((await page.locator('#branchReadings').innerText()).includes('0.900'));
    const unsafe=JSON.parse(artifact);unsafe.simulation.points=[{u:6,i:.6,r:10,label:'<img src=x onerror="window.importExecuted=true">'}];
    await page.locator('[data-current-file]').setInputFiles({name:'untrusted-label.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(unsafe))});await page.locator('[data-current-action="restore"]').click();
    assert.equal(await page.locator('#recordList img').count(),0);assert.equal(await page.evaluate(()=>window.importExecuted),undefined);
    const second=await context.newPage();await second.goto(base+'#current?view=practice');await second.waitForSelector('[data-current-note="prediction"]');
    assert(await second.locator('[data-current-note="prediction"]').isDisabled());
    await second.locator('[data-storage-activate]').click();await second.waitForFunction(()=>window.LearningStorage?.role==='writer');
    await second.locator('[data-current-note="revision"]').fill('第二页接管后的修订');await second.reload();await second.waitForSelector('[data-current-note="revision"]');
    assert.equal(await second.locator('[data-current-note="revision"]').inputValue(),'第二页接管后的修订');
    assert(await page.locator('[data-current-note="prediction"]').isDisabled());await second.close();
    await page.locator('[data-storage-activate]').click();await page.waitForFunction(()=>window.LearningStorage?.role==='writer');
    await page.evaluate(()=>{window.__setItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='ai_lab_sim_current_v1')throw new DOMException('Full','QuotaExceededError');return window.__setItem.call(this,k,v);};});
    await page.locator('[data-current-note="revision"]').fill('保存失败时的内存稿');assert((await page.locator('[data-current-save]').innerText()).includes('未保存'));
    download=page.waitForEvent('download');await page.locator('[data-current-action="export"]').click();assert(JSON.parse(fs.readFileSync(await (await download).path(),'utf8')).tasks.transfer.revision.includes('内存稿'));
    await page.reload();await page.waitForSelector('#voltage');assert.equal(await page.locator('[data-current-note="revision"]').inputValue(),'第二页接管后的修订');
    for(const raw of ['{broken',JSON.stringify({...stored,version:99})]){
      await page.evaluate(({key,raw})=>localStorage.setItem(key,raw),{key,raw});await page.reload();await page.waitForSelector('#voltage');
      await page.locator('[data-current-note="revision"]').fill('不可覆盖旧原文');assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),raw);
      await page.locator('[data-current-file]').setInputFiles({name:'recover.json',mimeType:'application/json',buffer:Buffer.from(artifact)});await page.locator('[data-current-action="restore"]').click();
      assert.equal(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).version,key),1);
    }
    const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ai-current-visual-')),layouts=[];
    for(const [width,height,dpr] of [[1920,1080,1],[2560,1440,1],[3840,2160,1],[1024,768,1],[390,844,1],[1536,864,1.25],[1707,960,1.5],[1920,1080,2]]){
      const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'}),p=await c.newPage();
      p.on('pageerror',e=>errors.push(e.message));
      for(const route of ['#home','#physics','#current','#current?view=practice']){
        await p.goto(base+route);await p.waitForTimeout(150);
        assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+width+' '+route);
        if(route.includes('practice')){
          const metrics=await p.locator('#macroCanvas').evaluate(c=>({css:c.getBoundingClientRect().width,px:c.width}));assert(Math.abs(metrics.px-metrics.css*dpr)<2,'canvas DPR');
          assert((await p.locator('#play').innerText()).includes('播放'),'reduced motion defaults to pause');
          await p.locator('#voltage').focus();await p.keyboard.press('ArrowRight');assert.equal(Number(await p.locator('#voltage').inputValue()),6.1);
        }
        layouts.push({width,height,dpr,route});
        if(dpr===1&&[1920,390,3840].includes(width))await p.screenshot({path:path.join(dir,`${width}-${route.replace(/[^a-z]/g,'')}.png`),fullPage:width===390});
      }
      await c.close();
    }
    fs.writeFileSync(path.join(dir,'layouts.json'),JSON.stringify(layouts,null,2));
    await page.goto(base+'#lesson?id=ai-basics');await page.waitForSelector('[data-lesson-id="ai-basics"]');
    await page.goto(base+'#courses?mode=training&day=1');await page.waitForTimeout(150);assert((await page.locator('#dynamicArea').innerText()).length>100);
    assert.equal(errors.length,0,errors.join('\n'));
    console.log('PASS current end-to-end, independent backup, refresh, two-tab handoff, quota and protected corrupt/future data, legacy keys/routes, 32 viewport/page combinations; screenshots '+dir);
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
