const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/manifest.json'), 'utf8'));
const old = JSON.parse(execFileSync('git', ['show', '85613ac:content/manifest.json'], {cwd:root, encoding:'utf8'}));
assert.deepEqual(manifest.lessons.slice(0,8), old.lessons, 'Original eight course IDs, quiz answers and metadata must survive');
const server = http.createServer((req,res)=>{
  const file = path.join(root,new URL(req.url,'http://localhost').pathname.replace(/^\/$/,'/index.html'));
  try { res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html; charset=utf-8'); res.end(fs.readFileSync(file)); }
  catch { res.statusCode=404; res.end(); }
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,...(process.env.CHROME_CHANNEL?{channel:process.env.CHROME_CHANNEL}:{})});
  try {
    const page=await browser.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    page.on('response', r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
    await page.goto(base);
    await page.evaluate(()=>localStorage.setItem('ai_lab_textbook_v1',JSON.stringify({transformers:{opened:true,completed:true,quiz:{0:true}}})));
    await page.reload();
    assert.equal(await page.locator('.editorial-courses article').count(),3);
    assert.equal(await page.locator('.editorial-resources article').count(),4);
    assert.equal(await page.locator('.editorial-tabs [role="tab"]').count(),4);
    assert.equal(await page.locator('.editorial-steps li').count(),6);
    for(const tab of ['foundation','application','building','advanced']) {
      await page.locator(`[data-learning-path="${tab}"]`).click();
      assert.equal(await page.locator('.editorial-courses article').count(),3);
      assert.equal(await page.locator(`[data-learning-path="${tab}"]`).getAttribute('aria-selected'),'true');
    }
    for(const [width,height] of [[1440,900],[1920,1080],[2560,1440],[3840,2160],[390,844]]) {
      await page.setViewportSize({width,height});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'overflow '+width);
      if(width===3840) {
        assert(await page.locator('.editorial-library').evaluate(e=>e.getBoundingClientRect().bottom)>1200, 'Resource discovery should remain reachable below the current task and routes');
      }
    }
    await page.setViewportSize({width:1440,height:900});
    await page.locator('.editorial-resources a[href="#courses?mode=training&day=1"]').click();
    await page.waitForFunction(()=>trState.day===1);
    await page.waitForSelector('[data-action="tr-day"]');
    assert.equal(await page.locator('.chapter-button[data-action="tr-day"]').count(),16);
    await page.locator('.chapter-button[data-action="tr-day"][data-day="16"]').click();
    await page.waitForFunction(()=>trState.day===16);
    await page.goto(base+'#home');
    await page.locator('.editorial-resources a[href="#projects"]').click();
    assert.equal(await page.evaluate(()=>ProjectLab.getProjects().length),4);
    await page.goto(base+'#projects?id=rag');
    await page.waitForSelector('[data-project="rag-search"]');
    // All original courses remain discoverable through the complete textbook catalog.
    await page.goto(base+'#home');
    await page.locator('.editorial-resources a[href="#courses?mode=textbook"]').click();
    await page.waitForSelector('.book-library-card');
    assert.equal(await page.locator('.book-library-card').count(),manifest.lessons.length);
    await page.getByText('系统教材 (1/12)',{exact:true}).waitFor({state:'visible'});
    for(const lesson of old.lessons) {
      assert.equal(await page.locator(`.book-library-card[data-book-open="${lesson.id}"]`).count(),1);
    }
    for(const lesson of manifest.lessons.slice(8)) {
      await page.goto(base+'#home');
      await page.locator('.editorial-resources a[href="#courses?mode=textbook"]').click();
      await page.locator(`.chapter-button[data-book-open="${lesson.id}"]`).click();
      await page.waitForSelector(`[data-book-complete="${lesson.id}"]`);
      assert((await page.locator('.book-article').innerText()).length>1500);
      await page.reload();
      await page.waitForSelector(`[data-book-complete="${lesson.id}"]`);
      for(let q=0;q<lesson.quiz.length;q++) {
        await page.locator(`[data-book-choice="${q}:${lesson.quiz[q].answer}"]`).click();
        await page.locator(`[data-book-check="${q}"]`).click();
      }
      await page.locator(`[data-book-complete="${lesson.id}"]`).click();
    }
    await page.goto(base+'#home');
    await page.locator('.editorial-resources a[href="#courses?mode=textbook"]').click();
    await page.getByText('系统教材 (5/12)',{exact:true}).waitFor({state:'visible'});
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('ai_lab_textbook_v1')));
    assert.equal(saved.transformers.completed,true);
    for(const l of manifest.lessons.slice(8))assert.deepEqual(saved[l.id].quiz,{'0':true,'1':true});
    assert.deepEqual(errors,[]);
    console.log('PASS editorial home: three route selections, four resource entries, 12 catalog courses, 16 training days, four projects, responsive discovery, new lessons/quizzes/reload and old records');
  } finally {await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1;server.close()});
