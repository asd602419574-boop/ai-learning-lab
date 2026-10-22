/* Real same-origin tabs: one writer, safe handoff, unsupported browsers and legacy writes. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'), output=path.join(root,'screenshots_v2/storage');
const keys=['ai_foundations_learning_v1','ai_lab_textbook_v1','ai_training_16day_v1','ai_lab_projects_v1','ai_training_practice_v1','ai_lab_learning_v2','ai_lab_pathway_v1'];
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
async function role(page,expected){await page.waitForFunction(expected=>window.LearningStorage?.role===expected,expected);}
async function handoff(page){await page.locator('[data-storage-activate]').click();await role(page,'writer');}
async function state(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('ai_lab_learning_v2')));}
async function blockedWrites(page){
  const result=await page.evaluate(keys=>keys.map(key=>{
    const before=localStorage.getItem(key);let threw=false;
    try{LearningStorage.storage.setItem(key,'{"overwrite":true}');}catch{threw=true;}
    return{key,threw,unchanged:localStorage.getItem(key)===before};
  }),keys);
  assert(result.every(r=>r.threw&&r.unchanged),JSON.stringify(result));
}
(async()=>{
  fs.mkdirSync(path.join(output,'downloads'),{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/`,practice=base+'#lesson?id=reliable-ai&view=practice';
  const browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome',downloadsPath:path.join(output,'downloads')});
  try{
    const context=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true});
    const owner=await context.newPage(),reader=await context.newPage(),errors=[];
    for(const page of [owner,reader])page.on('pageerror',e=>errors.push(e.message));
    await owner.goto(practice);await role(owner,'writer');
    const retained=await owner.evaluate(()=>{
      const records={
        ai_foundations_learning_v1:{mastered:{0:true},known:{},best:{},bestPct:{},questionStats:{},reviewCards:{},missions:{}},
        ai_lab_textbook_v1:{transformers:{opened:true,completed:true,quiz:{0:true}}},
        ai_training_16day_v1:{completed:{'1-0':123},best:{1:3},stats:{}},
        ai_lab_projects_v1:{version:1,data:{}},
        ai_training_practice_v1:{3:123},
        ai_lab_pathway_v1:{schemaVersion:1,lessons:Object.fromEntries(['ai-basics','clear-task','evaluate-results'].map(id=>[id,LearningCore.emptyState()]))}
      };
      for(const [key,value] of Object.entries(records))LearningStorage.storage.setItem(key,JSON.stringify(value));
      return records;
    });
    await owner.reload();await role(owner,'writer');
    await reader.goto(practice);await role(reader,'reader');
    assert.equal(await owner.locator('[data-prediction]').first().isEnabled(),true);
    assert.equal(await reader.locator('[data-prediction]').first().isDisabled(),true);
    assert.equal(await reader.locator('[data-action="save-artifact"]').isDisabled(),true);
    await blockedWrites(reader);
    await reader.goto(base+'#lesson?id=reliable-ai');
    await reader.waitForSelector('[data-lesson-reading]');
    await reader.locator('[data-reading-anchor]').first().click();
    assert.equal(await reader.locator('[data-reading-anchor]').first().isEnabled(),true,'Reader may navigate course sections');
    await reader.locator('[data-storage-notice]').scrollIntoViewIfNeeded();
    await reader.screenshot({path:path.join(output,'reader-desktop.png')});
    await reader.setViewportSize({width:390,height:844});
    await reader.reload();await role(reader,'reader');
    await reader.locator('[data-storage-notice]').scrollIntoViewIfNeeded();
    await reader.screenshot({path:path.join(output,'reader-mobile.png')});
    assert(await reader.locator('[data-storage-notice]').isVisible());
    assert(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Readonly banner must not overflow on mobile');
    await reader.setViewportSize({width:1920,height:1080});
    await owner.locator('[data-prediction]').first().check();
    const prediction=(await state(owner)).prediction;
    await owner.locator('[data-step="1"]').first().click();
    await owner.locator('[data-answer="time"]').fill('09:15 两页切换保留');
    const original=await state(owner);
    assert.equal(original.step,1);assert.deepEqual(original.prediction,prediction);
    await reader.goto(practice);await role(reader,'reader');
    await handoff(reader);await role(owner,'reader');
    assert.equal(await reader.locator('[data-answer="time"]').inputValue(),original.drafts.practice.time);
    assert.deepEqual((await state(reader)).prediction,prediction);
    assert.equal(await owner.locator('[data-answer="time"]').isDisabled(),true);
    await blockedWrites(owner);
    await reader.locator('[data-answer="title"]').fill('新页继续作答');
    await handoff(owner);await role(reader,'reader');
    assert.equal(await owner.locator('[data-answer="time"]').inputValue(),original.drafts.practice.time);
    assert.equal(await owner.locator('[data-answer="title"]').inputValue(),'新页继续作答');
    await owner.close();
    await handoff(reader);
    assert.equal(await reader.locator('[data-answer="title"]').inputValue(),'新页继续作答');
    await reader.locator('[data-answer="title"]').fill('关闭原页面后仍可保存');
    assert.equal((await state(reader)).drafts.practice.title,'关闭原页面后仍可保存');
    await reader.goto(base+'#my-learning');
    const [download]=await Promise.all([reader.waitForEvent('download'),reader.locator('[data-action="backup"]').click()]);
    const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));
    assert.equal(backup.format,'ai-learning-backup');assert.equal(backup.version,1);
    assert.equal(backup.records.ai_lab_learning_v2.drafts.practice.title,'关闭原页面后仍可保存');
    assert.deepEqual(Object.keys(backup.records).sort(),[...keys].sort());
    for(const [key,value] of Object.entries(retained))assert.deepEqual(backup.records[key],value,'Backup must retain '+key+' format and contents');
    await reader.locator('input[data-import]').setInputFiles({name:'same-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await reader.locator('[data-action="confirm-import"]').click();
    await role(reader,'writer');
    assert.equal((await state(reader)).drafts.practice.title,'关闭原页面后仍可保存');
    for(const [key,value] of Object.entries(retained))assert.deepEqual(await reader.evaluate(key=>JSON.parse(localStorage.getItem(key)),key),value,'Restore must retain '+key);
    const external=await context.newPage();await external.goto(base+'#home');await role(external,'reader');
    await external.evaluate(()=>{const s=JSON.parse(localStorage.getItem('ai_lab_learning_v2'));s.drafts.practice.title='旧页面写入的新值';localStorage.setItem('ai_lab_learning_v2',JSON.stringify(s));});
    await role(reader,'conflict');
    assert.match(await reader.locator('[data-storage-notice]').innerText(),/其他页面改变|停止保存/);
    await blockedWrites(reader);
    await reader.screenshot({path:path.join(output,'external-write-conflict.png')});
    await context.close();
    const unsupportedContext=await browser.newContext();
    const unsupported=await unsupportedContext.newPage();
    await unsupported.addInitScript(()=>Object.defineProperty(navigator,'locks',{value:undefined,configurable:true}));
    await unsupported.goto(practice);await role(unsupported,'unsupported');
    assert.match(await unsupported.locator('[data-storage-notice]').innerText(),/无法启用跨页面保存保护/);
    assert.equal(await unsupported.locator('[data-storage-activate]').isDisabled(),true);
    assert.equal(await unsupported.locator('[data-prediction]').first().isDisabled(),true);
    await blockedWrites(unsupported);
    assert.deepEqual(await unsupported.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys),keys.map(()=>null));
    await unsupportedContext.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: real shared-origin tabs, seven protected keys, read-only course navigation, latest-answer handoff both directions, closed-owner takeover, backup/restore, unsupported browser, external-write conflict.');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
