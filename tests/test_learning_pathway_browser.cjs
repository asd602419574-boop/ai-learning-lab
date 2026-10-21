/* Four connected lessons: isolated inputs, honest completion, portfolio and restore. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const ids = ['ai-basics','clear-task','reliable-ai','evaluate-results'];
const server = http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const downloadsPath=path.join(root,'screenshots_v2/p2/downloads');fs.mkdirSync(downloadsPath,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome',downloadsPath});
  try{
    const page=await browser.newPage({viewport:{width:1920,height:1080},acceptDownloads:true}), errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await page.goto(base+'#home');
    assert.equal(await page.locator('[data-pathway-lesson]').count(),4,'Home must offer the four connected lessons');
    assert.deepEqual(await page.locator('[data-pathway-lesson]').evaluateAll(nodes=>nodes.map(n=>n.dataset.pathwayLesson)),ids);
    assert.equal(await page.locator('[data-learning-start]').getAttribute('href'),'#lesson?id=ai-basics');
    const legacy=await page.evaluate(()=>{
      const s=LearningCore.emptyState();s.step=4;s.reflection='P1已有复盘，不应被其他课程覆盖';s.drafts.practice.time='待确认';
      localStorage.setItem(LearningCore.KEY,JSON.stringify(s));localStorage.setItem('ai_training_practice_v1','{"3":123}');
      return localStorage.getItem(LearningCore.KEY);
    });
    await page.reload();
    const step=async n=>page.locator(`[data-step="${n}"]`).first().click();
    const fill=async (lessonId,scenarioId,kind='exampleAnswers')=>{
      const answers=await page.evaluate(({lessonId,scenarioId,kind})=>LearningCatalog.get(lessonId).scenarios[scenarioId][kind],{lessonId,scenarioId,kind});
      for(const [key,value] of Object.entries(answers)){
        const field=page.locator(`[data-answer="${key}"]`);
        if(await field.evaluate(n=>n.tagName==='SELECT'))await field.selectOption(value);else await field.fill(value);
      }
    };
    // Switching between drafts must keep the P1 record and independent new-course state intact.
    await page.goto(base+'#lesson?id=ai-basics');await step(1);await fill('ai-basics','practice');
    const first=await page.locator('[data-answer]').first().inputValue();
    await page.goto(base+'#lesson?id=clear-task');await step(1);
    assert.equal(await page.locator('[data-answer]').first().inputValue(),'');
    assert.equal(await page.evaluate(()=>localStorage.getItem(LearningCore.KEY)),legacy);
    await page.goto(base+'#lesson?id=ai-basics');assert.equal(await page.locator('[data-answer]').first().inputValue(),first);
    await page.reload();assert.equal(await page.locator('[data-answer]').first().inputValue(),first);
    for(const id of ids){
      await page.goto(base+'#lesson?id='+id);await step(0);
      await page.locator('[data-prediction]').first().check();
      await step(1);await fill(id,'practice','flawedAnswers');await page.locator('[data-action="check"]').click();
      assert(await page.locator('.learn-fix').count()>0,id+' flawed answer needs specific feedback');
      await step(2);assert((await page.locator('.learn-reading').innerText()).includes('依据'));
      await step(3);assert((await page.locator('.learn-prose').allTextContents()).join('').length>1800,id+' must have substantive teaching');
      await page.locator('[data-explanation="practice"]').fill('我依据任务材料核对了每一项，并把没有支持的说法改成需要确认。');
      await step(4);await fill(id,'practice');await page.locator('[data-action="check"]').click();
      assert.equal(await page.locator('.learn-correct').count(),6);
      await step(5);await fill(id,'transfer');await page.locator('[data-action="check"]').click();
      assert.equal(await page.locator('.learn-correct').count(),6);
      if(id==='ai-basics'){
        await page.locator('[data-action="save-artifact"]').click();
        assert.equal(await page.evaluate(id=>LearningWorkspace.summary(id).completed,id),false,'Field check alone must not count as course completion');
      }
      await page.locator('[data-explanation="transfer"]').fill('这个新情境改变了条件，我重新核对证据，没有照抄上一题答案。');
      await page.locator('[data-reflection]').fill('下次先明确目标和标准，再检查每个结果是否有材料支持。');
      for(const key of ['evidence','uncertainty','explain'])await page.locator(`[data-review="${key}"]`).check();
      await page.locator('[data-action="save-artifact"]').click();
      assert.equal(await page.evaluate(id=>LearningWorkspace.summary(id).completed,id),true,id+' completion is based on saved transfer artifact');
      if(id!==ids.at(-1))assert.equal(await page.locator('.learn-completion a').getAttribute('href'),'#lesson?id='+ids[ids.indexOf(id)+1]);
      await page.reload();assert.equal(await page.evaluate(id=>LearningWorkspace.summary(id).completed,id),true);
    }
    await page.goto(base+'#home');
    assert.equal(await page.evaluate(()=>LearningWorkspace.summary().completedCount),4);
    assert((await page.locator('[data-pathway-progress]').innerText()).includes('4 / 4'));
    await page.goto(base+'#my-learning');assert.equal(await page.locator('.learn-artifact').count(),5);
    await page.locator('[data-course-filter]').selectOption('ai-basics');assert.equal(await page.locator('.learn-artifact').count(),2);
    await page.locator('[data-course-filter]').selectOption('evaluate-results');assert.equal(await page.locator('.learn-artifact').count(),1);
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="backup"]').click()]);
    const raw=fs.readFileSync(await download.path(),'utf8'), backup=JSON.parse(raw);
    assert(backup.records.ai_lab_pathway_v1 && backup.records.ai_lab_learning_v2);
    const restore=await browser.newPage({acceptDownloads:true});restore.on('pageerror',e=>errors.push(e.message));
    await restore.goto(base+'#my-learning');
    await restore.locator('[data-import]').setInputFiles({name:'pathway.json',mimeType:'application/json',buffer:Buffer.from(raw)});
    await restore.waitForSelector('[data-action="confirm-import"]');
    assert.equal(await restore.evaluate(()=>localStorage.getItem(LearningCore.PATHWAY_KEY)),null,'Restore preview cannot write');
    await restore.locator('[data-action="confirm-import"]').click();
    await restore.waitForSelector('.learn-artifact');
    assert.equal(await restore.locator('.learn-artifact').count(),5);
    assert.equal(await restore.evaluate(()=>LearningWorkspace.summary().completedCount),4);
    assert.equal(await restore.evaluate(()=>localStorage.getItem('ai_training_practice_v1')),'{"3":123}');
    await restore.goto(base+'#lesson?id=missing-course');await restore.waitForSelector('[data-lesson-error]');
    assert.equal(await restore.locator('[data-answer]').count(),0,'Unknown route cannot silently open a different lesson');
    assert.deepEqual(errors,[]);
    console.log('PASS four-lesson pathway: isolated drafts, six-step lessons, honest completion, next lesson, filtered artifacts, reload, whole-route backup/restore and invalid routes');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
