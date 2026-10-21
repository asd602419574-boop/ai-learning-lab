'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'screenshots_v2/onboarding');
const phase=process.env.ONBOARDING_PHASE||'curriculum';
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
async function measure(page){return page.locator('[data-learning-start]').evaluate(el=>{const r=el.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {text:el.textContent.trim(),href:el.getAttribute('href'),x:r.x,y:r.y,width:r.width,height:r.height,viewportHeight:innerHeight,inFirstScreen:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,unobstructed:!!top&&(el===top||el.contains(top)),overflow:document.documentElement.scrollWidth>innerWidth};});}
(async()=>{
 fs.mkdirSync(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'}),measurements=[],failures=[],errors=[];
 const check=(ok,message)=>{if(!ok)failures.push(message);};
 try{
  const base=`http://127.0.0.1:${server.address().port}/`;
  const profiles=[['mobile',390,844,1],['1k',1920,1080,1],['2k',2560,1440,1],['4k',3840,2160,1]];
  if(phase!=='before')profiles.push(['1k-125',1536,864,1.25],['2k-150',1707,960,1.5],['4k-150',2560,1440,1.5],['4k-200',1920,1080,2],['transition',1024,768,1]);
  for(const [name,width,height,dpr] of profiles){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
   await context.addInitScript(()=>{window.learningWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1'].includes(k))window.learningWrites.push(k);return original.call(this,k,v);};});
   const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'#home');await page.locator('[data-learning-start]').waitFor();await page.evaluate(()=>document.fonts.ready);
   const metrics=await measure(page);measurements.push({profile:name,viewport:{width,height},deviceScaleFactor:dpr,simulation:'browser viewport and DPR; not physical Windows scaling',...metrics});
   if(['mobile','1k','2k','4k'].includes(name))await page.screenshot({path:path.join(out,`${phase}-${name}-home.png`)});
   const home=page.locator('[data-learning-home]'),text=await home.innerText();
   check(await home.locator('[data-learning-start]').count()===1,`${name}: exactly one primary start CTA`);
   check(await page.locator('[data-newcomer-home]').count()===1,`${name}: explicit first-visit guide`);
   check(/零基础/.test(text)&&/第\s*1\s*课/.test(text)&&/基础学习/.test(metrics.text),`${name}: plain beginner wording and course introduction CTA`);
   check(/4\s*节|四\s*节|四课/.test(text)&&/六章|6\s*章/.test(text),`${name}: explains four lesson introduction then six chapter foundations`);
   check(metrics.href==='#pathways',`${name}: start explains the course before AI basics`);
   check(metrics.inFirstScreen&&metrics.unobstructed,`${name}: start CTA visible and unobstructed in first viewport`);
   check(!metrics.overflow,`${name}: no horizontal overflow`);
   check(await page.locator('.editorial-metrics').count()===0,`${name}: newcomers do not see three zero metrics`);
   check(await page.evaluate(()=>window.learningWrites.length)===0,`${name}: home render does not write learning records`);
   if(name==='1k'){
    await page.locator('[data-learning-start]').click();await page.locator('[data-program-overview]').waitFor();
    await page.locator('.btn[href="#lesson?id=ai-basics"]').first().click();await page.locator('[data-lesson-reading]').waitFor();
    check(page.url().endsWith('#lesson?id=ai-basics'),'Course introduction leads to first lesson reading');
    check(await page.locator('[data-prediction]').count()===0,'First lesson starts without prediction questions');
   }
   await context.close();
  }
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  await context.addInitScript(()=>{window.learningWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1'].includes(k))window.learningWrites.push(k);return original.call(this,k,v);};});
  const page=await context.newPage();await page.goto(base+'#home');
  await page.evaluate(()=>{const s=LearningCore.emptyState();s.step=2;s.updatedAt='2026-10-22T01:00:00.000Z';s.hints=2;const task=LearningCatalog.get('clear-task').scenarios.practice;s.attempts=[{id:'returning-check',scenarioId:'practice',phase:1,answers:task.exampleAnswers,result:LearningCore.checkFields(task,task.exampleAnswers),explanation:'依据材料核对',createdAt:s.updatedAt}];localStorage.setItem(LearningCore.PATHWAY_KEY,JSON.stringify({schemaVersion:1,lessons:{'clear-task':s}}));});
  await page.reload();await page.locator('[data-learning-start]').waitFor();
  const returning=await measure(page);measurements.push({profile:'returning-1k',viewport:{width:1920,height:1080},deviceScaleFactor:1,...returning});
  await page.screenshot({path:path.join(out,`${phase}-returning-home.png`)});
  check(returning.href==='#lesson?id=clear-task&view=practice'&&/继续/.test(returning.text),'Returning learner continues clear-task practice');
  check(await page.locator('.editorial-metrics').count()===1,'Returning learner retains real growth metrics');
  check(JSON.stringify(await page.locator('.editorial-metrics strong').allTextContents())===JSON.stringify(['0','1','2']),'Metrics reflect actual saved records');
  check(await page.evaluate(()=>window.learningWrites.length)===0,'Returning home does not auto-write records');
  await context.close();
  const legacyContext=await browser.newContext({viewport:{width:1920,height:1080}});
  await legacyContext.addInitScript(()=>{window.learningWrites=[];const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1'].includes(k))window.learningWrites.push(k);return original.call(this,k,v);};});
  const legacyPage=await legacyContext.newPage();await legacyPage.goto(base+'#home');
  const raw=await legacyPage.evaluate(()=>{const raw=JSON.stringify({transformers:{opened:true,completed:true,quiz:{0:true}}});localStorage.setItem('ai_lab_textbook_v1',raw);return raw;});
  await legacyPage.reload();await legacyPage.locator('[data-learning-start]').waitFor();
  measurements.push({profile:'legacy-1k',viewport:{width:1920,height:1080},deviceScaleFactor:1,...await measure(legacyPage)});
  check(await legacyPage.locator('[data-newcomer-home]').count()===0,'Old textbook learner is not treated as first visit');
  check(await legacyPage.locator('.editorial-metrics').count()===1,'Old textbook learner retains personal progress view');
  check(await legacyPage.evaluate(()=>localStorage.getItem('ai_lab_textbook_v1'))===raw,'Old textbook progress remains unchanged');
  check(await legacyPage.evaluate(()=>window.learningWrites.length)===0,'Old learner home is read-only across all seven learning keys');
  await legacyContext.close();
  check(errors.length===0,'No page errors: '+errors.join('; '));
  fs.writeFileSync(path.join(out,`${phase}-measurements.json`),JSON.stringify({measurements,failures,errors},null,2));
  console.log(JSON.stringify({phase,measurements,failures},null,2));
  assert.deepEqual(failures,[],'First visit home must make the foundation starting point clear');
  console.log('PASS: first visit guidance, first-screen CTA, returning progress and read-only home');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
