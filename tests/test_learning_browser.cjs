/* Consumer flow: a beginner can start the workshop from home without losing old records. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
  const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  try {
    const types = { '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const downloadsPath=path.join(root,'screenshots_v2/p1/downloads');
  fs.mkdirSync(downloadsPath,{recursive:true});
  const browser = await chromium.launch({headless:true, channel:process.env.CHROME_CHANNEL || 'chrome',downloadsPath});
  try {
    const page = await browser.newPage({viewport:{width:1920,height:1080},acceptDownloads:true});
    const errors=[];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {if(response.status()>=400)errors.push(response.status()+' '+response.url());});
    await page.goto(`http://127.0.0.1:${server.address().port}/#home`);
    const base=page.url().split('#')[0];
    const legacy=await page.evaluate(()=>{
      const records={ai_lab_textbook_v1:{transformers:{opened:true,completed:true,quiz:{0:true}}},ai_training_practice_v1:{3:123}};
      for(const [k,v] of Object.entries(records))localStorage.setItem(k,JSON.stringify(v));
      localStorage.setItem('unrelated_private_key','must stay local');
      return Object.fromEntries(Object.keys(records).map(k=>[k,localStorage.getItem(k)]));
    });
    await page.reload();
    assert.equal(await page.locator('[data-learning-home]').count(), 1,
      'Home must offer the new guided learning experience');
    assert.equal(await page.locator('.editorial-courses > article').count(), 3);
    await page.locator('[data-learning-path="foundation"]').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('[data-learning-path="application"]').getAttribute('aria-selected'),'true');
    await page.locator('[data-learning-start]').click();
    await page.waitForSelector('[data-workshop]');
    assert.match(page.url(), /#lesson\?id=reliable-ai/);
    await page.locator('[data-prediction]').first().check();
    await page.reload();
    assert.equal(await page.locator('[data-prediction]').first().isChecked(),true,'Prediction survives reload');
    const step=async n=>{await page.locator(`[data-step="${n}"]`).first().click();};
    await step(1);
    await page.locator('[data-answer="time"]').fill('09:00');
    await page.locator('[data-action="check"]').click();
    assert(await page.locator('.learn-feedback .learn-fix').count()>0,'Wrong answers receive actionable feedback');
    await page.locator('[data-hint]').first().locator('summary').click();
    await page.waitForFunction(()=>LearningWorkspace.summary().hints===1);
    await step(2);
    assert((await page.locator('.learn-reading').innerText()).includes('错误示例'));
    await step(3);
    assert(await page.locator('.learn-prose').count()>=6,'Substantial background, principles, examples and sources exist');
    await page.locator('[data-explanation="practice"]').fill('原稿没有明确几点开始，应保留未知；报名截止不能当作活动日期。');
    await step(4);
    async function correct(id){
      const answers=await page.evaluate(id=>LearningContent.scenarios[id].exampleAnswers,id);
      for(const [key,value] of Object.entries(answers))await page.locator(`[data-answer="${key}"]`).fill(value);
      await page.locator('[data-action="check"]').click();
      assert((await page.locator('[data-draft-validity]').innerText()).includes('已通过'));
    }
    await correct('practice');
    await page.locator('[data-answer="time"]').fill('09:00');
    assert((await page.locator('[data-draft-validity]').innerText()).includes('已失效'),'Changed inputs cannot inherit an old pass');
    await page.locator('[data-action="save-artifact"]').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(LearningCore.KEY)).artifacts[0].status),'draft');
    await correct('practice');
    await page.locator('[data-review="evidence"]').check();
    await page.locator('[data-reflection]').fill('下一次先找原句，再填写结论；缺少证据就写未知。');
    await page.locator('[data-action="save-artifact"]').click();
    await step(5);
    await correct('transfer');
    await page.locator('[data-explanation="transfer"]').fill('新通知明确10:30，但领取地点没有说明，仍需要确认。');
    await page.locator('[data-action="save-artifact"]').click();
    await page.goto(base+'#my-learning');
    assert.equal(await page.locator('.learn-artifact').count(),3);
    await page.reload();
    assert.equal(await page.locator('.learn-artifact').count(),3);
    const [artifactDownload]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="export-artifact"]').first().click()]);
    const artifact=JSON.parse(fs.readFileSync(await artifactDownload.path(),'utf8'));
    assert(artifact.source.length>40 && artifact.checks.length>0,'Export includes the original task and actual check snapshots');
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="backup"]').click()]);
    const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(backup.records.ai_lab_learning_v2.artifacts.length,3);
    assert.equal(backup.records.unrelated_private_key,undefined);
    const before=await page.evaluate(()=>localStorage.getItem(LearningCore.KEY));
    await page.locator('input[data-import]').setInputFiles({name:'broken.json',mimeType:'application/json',buffer:Buffer.from('{"format":"wrong"}')});
    await page.waitForFunction(()=>document.querySelector('[data-import-preview]').textContent.includes('无法恢复'));
    assert.equal(await page.locator('[data-action="confirm-import"]').count(),0);
    assert.equal(await page.evaluate(()=>localStorage.getItem(LearningCore.KEY)),before);
    await page.locator('input[data-import]').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await page.waitForSelector('[data-action="confirm-import"]');
    assert.equal(await page.evaluate(()=>localStorage.getItem(LearningCore.KEY)),before,'Preview must not mutate data');
    await page.locator('[data-action="confirm-import"]').click();
    await page.waitForSelector('.learn-artifact');
    assert.equal(await page.locator('.learn-artifact').count(),3);
    for(const [key,value] of Object.entries(legacy))assert.equal(await page.evaluate(k=>localStorage.getItem(k),key),value);
    await page.goto(base+'#home');
    assert((await page.locator('.editorial-metrics').innerText()).includes('3'));
    assert.deepEqual(errors, []);
    const failure=await browser.newPage();
    await failure.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('test quota','QuotaExceededError');};});
    await failure.goto(base+'#lesson?id=reliable-ai');
    await failure.locator('[data-step="1"]').first().click();
    await failure.locator('[data-answer="title"]').fill('unsaved draft');
    await failure.locator('[data-action="save-artifact"]').click();
    assert((await failure.locator('[data-save-status]').innerText()).includes('保存失败'));
    assert.equal(await failure.evaluate(()=>LearningWorkspace.summary().artifactCount),0);
    await failure.close();
    console.log('PASS: six-step practice/revision/transfer, honest feedback, artifacts/reload, backup preview/restore, old keys and quota failure');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); process.exitCode=1; server.close(); });
