'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'ai-subject-home-'));
const phase=process.env.ONBOARDING_PHASE||'curriculum';
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'}),base=`http://127.0.0.1:${server.address().port}/`;
 try{
  for(const [width,height,dpr] of [[390,844,1],[1024,768,1],[1920,1080,1],[2560,1440,1],[3840,2160,1],[1536,864,1.25],[1707,960,1.5],[2560,1440,1.5],[1920,1080,2]]){
   const c=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
   await c.addInitScript(()=>{window.homeWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){window.homeWrites.push(k);return original.call(this,k,v);};});
   const p=await c.newPage();await p.goto(base);
   assert.equal(await p.locator('[data-subject]').count(),2);
   assert.equal(await p.locator('[data-subject="ai"]').getAttribute('href'),'#pathways');
   assert.equal(await p.locator('[data-subject="physics"]').getAttribute('href'),'#physics');
   assert(!(await p.locator('[data-learning-home]').innerText()).includes('16天'));
   assert.equal(await p.locator('.editorial-metrics').count(),0,'no invented newcomer metrics');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   assert.deepEqual(await p.evaluate(()=>window.homeWrites),[],'first visit must not create progress');
   await p.screenshot({path:path.join(out,`${width}-${dpr}.png`)});
   if(width===1920&&dpr===1){
    await p.locator('[data-subject="ai"]').click();await p.locator('.overview-actions a[href="#lesson?id=ai-basics"]').click();
    await p.waitForSelector('[data-lesson-reading]');assert.equal(await p.locator('[data-prediction]').count(),0);
    await p.goto(base+'#home');await p.locator('[data-subject="physics"]').click();await p.locator('a[href="#current"]').filter({hasText:'阅读'}).click();
    await p.waitForSelector('[data-current-reading]');assert.equal(await p.locator('#voltage').count(),0);
   }
   await c.close();
  }
  const c=await browser.newContext(),p=await c.newPage();await p.goto(base);
  const previous=await p.evaluate(()=>{const s=LearningCore.emptyState();s.step=2;s.updatedAt=new Date().toISOString();localStorage.setItem(LearningCore.PATHWAY_KEY,JSON.stringify({schemaVersion:1,lessons:{'clear-task':s}}));localStorage.setItem('ai_lab_textbook_v1',JSON.stringify({transformers:{opened:true,completed:true,quiz:{0:true}}}));return [localStorage.getItem(LearningCore.PATHWAY_KEY),localStorage.getItem('ai_lab_textbook_v1')];});
  await p.reload();assert.equal(await p.locator('a[href="#lesson?id=clear-task&view=practice"]').count(),1);
  assert.deepEqual(await p.evaluate(()=>[localStorage.getItem(LearningCore.PATHWAY_KEY),localStorage.getItem('ai_lab_textbook_v1')]),previous);
  await c.close();console.log('PASS subject-first onboarding: 9 viewport/scaling profiles, read-only first visit, AI and physics reading-first entry, actual returning progress; screenshots '+out);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
