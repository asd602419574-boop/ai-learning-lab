/* P4 project: real browser completion, retained records, export and responsive reading. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'screenshots_v2/p4'),KEY='ai_lab_system_v1';
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://local').pathname),file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const role=(page,value)=>page.waitForFunction(value=>window.LearningStorage?.role===value,value);
const record=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const click=(page,action)=>page.locator('[data-system-action="'+action+'"]').click();
(async()=>{
  fs.mkdirSync(path.join(output,'downloads'),{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome',downloadsPath:path.join(output,'downloads')});
  try{
    const context=await browser.newContext({viewport:{width:1920,height:1080},acceptDownloads:true}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    async function route(stage,practice=true){await page.goto(base+'#system?stage='+stage+(practice?'&view=practice':''));await page.waitForSelector(practice?'.system-practice':'.system-reading');}
    await route('brief',false);await role(page,'writer');assert.equal(await page.locator('.system-practice').count(),0);assert.ok(await page.locator('.system-reading section').count()>=3);
    const projectEntry=()=>page.locator('#sidePanelContent a[href="#system?view=overview"]');
    assert.equal(await projectEntry().count(),1,'Project navigation must open its own overview instead of the current lesson');
    await projectEntry().click();await page.waitForSelector('[data-system-overview]');
    assert.equal(await page.locator('[data-system-overview] h1').innerText(),'通知整理器');assert.equal(await projectEntry().getAttribute('aria-current'),'page');
    await page.locator('[data-system-start]').click();await page.waitForSelector('.system-reading');assert.equal(await page.evaluate(()=>ui.systemStage),'brief');
    await page.screenshot({path:path.join(output,'reading-1920.png')});
    await page.getByRole('link',{name:'开始本阶段实践 →',exact:true}).click();await page.waitForSelector('[data-decision="goal"]');
    await page.locator('[data-decision="goal"]').fill('把通知整理为可核对并能恢复的活动清单，保留未知信息。');
    for(const [key,value] of Object.entries({method:'rules',boundary:'validator',failure:'reject',approval:'confirm'}))await page.locator('[data-decision="'+key+'"]').selectOption(value);
    await click(page,'design');assert.match(await page.locator('[data-system-feedback]').innerText(),/设计已覆盖/);
    await route('build');
    for(const [key,value] of Object.entries({title:'图书交换会',date:'2026-11-08',place:'社区阅览室',owner:'小王'}))await page.locator('[data-draft="'+key+'"]').fill(value);
    await page.locator('[data-system-approved]').check();await click(page,'submit');assert.match(await page.locator('[data-system-feedback]').innerText(),/invalid/);assert.equal((await record(page)).entries.length,0);
    await page.locator('[data-draft="owner"]').fill('待确认');assert.equal(await page.locator('[data-system-approved]').isChecked(),false,'Changed input must revoke confirmation');
    await click(page,'submit');assert.match(await page.locator('[data-system-feedback]').innerText(),/unconfirmed/);assert.equal((await record(page)).entries.length,0);
    await click(page,'preview');assert.match(await page.locator('[data-system-preview]').innerText(),/核对|有效|通过/);
    await page.locator('[data-system-approved]').check();await page.locator('[data-system-role]').selectOption('viewer');await click(page,'submit');assert.match(await page.locator('[data-system-feedback]').innerText(),/forbidden/);assert.equal((await record(page)).entries.length,0);
    await page.locator('[data-system-role]').selectOption('editor');await click(page,'submit');assert.equal((await record(page)).entries.length,1);await click(page,'submit');assert.match(await page.locator('[data-system-feedback]').innerText(),/duplicate/);assert.equal((await record(page)).entries.length,1);
    await page.locator('[data-system-source]').selectOption('n2');
    for(const [key,value] of Object.entries({title:'修理体验课',date:'2026-11-15',place:'待确认',owner:'林老师'}))await page.locator('[data-draft="'+key+'"]').fill(value);
    await page.locator('[data-system-approved]').check();await click(page,'submit');assert.equal((await record(page)).entries.length,2);
    const beforeOverview=await record(page);await projectEntry().click();await page.waitForSelector('[data-system-overview]');
    assert.match(await page.locator('[data-system-overview]').innerText(),/2\s*条/);
    assert.equal(await page.locator('[data-system-continue]').getAttribute('href'),'#system?stage=build&view=practice');
    await page.locator('[data-system-continue]').click();await page.waitForSelector('.system-practice');assert.equal(await page.evaluate(()=>ui.systemStage),'build');
    assert.deepEqual((await record(page)).draft,beforeOverview.draft,'Visiting the project overview must preserve the current draft');assert.equal((await record(page)).entries.length,2);
    await page.reload();await role(page,'writer');await page.waitForSelector('.system-entries');assert.match(await page.locator('.system-entries').innerText(),/图书交换会/);assert.match(await page.locator('.system-entries').innerText(),/修理体验课/);assert.equal((await record(page)).entries.length,2);
    await page.screenshot({path:path.join(output,'practice-1920.png')});
    await route('verify');await click(page,'checks');assert.equal(await page.locator('[data-system-checks] tbody tr').count(),7);assert.equal((await record(page)).checks.filter(x=>x.passed).length,7);assert.equal((await record(page)).entries.length,2,'Isolated checks must not change learner entries');
    await route('deliver');await page.locator('[data-system-reflection]').fill('我核对了原文，未知地点保留待确认，验证只读拒绝与刷新恢复后再交付。');for(const key of ['evidence','recovery','limits'])await page.locator('[data-self-review="'+key+'"]').check();
    await click(page,'release');assert.equal((await record(page)).releases.length,1);assert.equal((await record(page)).releases[0].version,1);
    await page.locator('[data-system-reflection]').fill('第二版增加对重复提交的说明：失败保留输入，固定规则不代表真实鉴权，下一步补材料覆盖。');await click(page,'release');assert.equal((await record(page)).releases.length,2);assert.notEqual((await record(page)).releases[0].reflection,(await record(page)).releases[1].reflection);
    const [md]=await Promise.all([page.waitForEvent('download'),click(page,'export')]);const markdown=fs.readFileSync(await md.path(),'utf8');assert.match(markdown,/图书交换会/);assert.match(markdown,/本地/);assert.match(markdown,/v2/);
    await page.goto(base+'#my-learning');await page.waitForSelector('[data-system-portfolio]');assert.match(await page.locator('[data-system-portfolio]').innerText(),/2 个交付版本/);assert.match(await page.locator('[data-system-portfolio]').innerText(),/v2/);
    const [download]=await Promise.all([page.waitForEvent('download'),page.locator('[data-action="backup"]').click()]);const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.ok(Object.prototype.hasOwnProperty.call(backup.records,KEY));assert.equal(backup.records[KEY].releases.length,2);
    await page.evaluate(key=>LearningStorage.storage.setItem(key,JSON.stringify(LearningSystemCore.emptyState())),KEY);await page.reload();await role(page,'writer');
    await page.locator('input[data-import]').setInputFiles({name:'p4-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});await page.locator('[data-action="confirm-import"]').click();await role(page,'writer');assert.deepEqual(await record(page),backup.records[KEY]);
    await route('build');await page.locator('[data-draft="owner"]').fill('跨页保留草稿');
    const reader=await context.newPage();reader.on('pageerror',e=>errors.push(e.message));await reader.goto(base+'#system?stage=build&view=practice');await role(reader,'reader');assert.equal(await reader.locator('[data-draft="owner"]').isDisabled(),true);assert.equal(await reader.locator('[data-system-action="submit"]').isDisabled(),true);
    const blocked=await reader.evaluate(key=>{try{LearningStorage.storage.setItem(key,'{}');return false;}catch{return true;}},KEY);assert.equal(blocked,true);
    await reader.locator('[data-storage-activate]').click();await role(reader,'writer');await role(page,'reader');await reader.waitForSelector('[data-draft="owner"]');assert.equal(await reader.locator('[data-draft="owner"]').inputValue(),'跨页保留草稿');assert.equal((await record(reader)).entries.length,2);assert.equal((await record(reader)).releases.length,2);
    await page.close();await reader.close();await context.close();
    for(const profile of [{width:1920,height:1080,dpr:1},{width:2560,height:1440,dpr:1},{width:3840,height:2160,dpr:1},{width:1707,height:960,dpr:1.5},{width:1920,height:1080,dpr:2},{width:390,height:844,dpr:1}]){
      const ctx=await browser.newContext({viewport:{width:profile.width,height:profile.height},deviceScaleFactor:profile.dpr}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
      for(const practice of [false,true]){await p.goto(base+'#system?stage=build'+(practice?'&view=practice':''));await p.waitForSelector(practice?'.system-practice':'.system-reading');assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,JSON.stringify({profile,practice})+' must not overflow');}
      await p.screenshot({path:path.join(output,`practice-${profile.width}-dpr${profile.dpr}.png`)});await ctx.close();
    }
    assert.deepEqual(errors,[]);console.log('PASS P4: four-stage browser project, guarded submissions, 7 actual cases, two releases, Markdown, whole-site backup/restore including P4, cross-tab draft handoff and native 1K/2K/4K/mobile plus DPR layouts.');
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
