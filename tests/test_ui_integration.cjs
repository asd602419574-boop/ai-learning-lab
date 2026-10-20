// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package when needed.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');

function questionData(html) {
  const code = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1]
    .replace(/render\(\);\s*(?:syncRouteFromHash\(\);\s*)?$/, '');
  const context = { document: { addEventListener() {} }, window: { addEventListener() {} },
    localStorage: { getItem() { return null; } }, console };
  return JSON.parse(JSON.stringify(vm.runInNewContext(code + `;
    [...ALL_QUESTIONS.values()].map(q=>({id:q.id,chapter:q.chapter,q:q.q,o:q.o,a:q.a,why:q.why}));`, context)));
}
const previous = questionData(execFileSync('git', ['show',
  '97976e4297856364fb5daf795ebc0c07870a7ef0:index.html'], { cwd: root, encoding: 'utf8' }));
const current = questionData(fs.readFileSync(path.join(root, 'index.html'), 'utf8'));
assert.equal(current.length, 144);
assert.deepEqual(current, previous, 'All old question IDs, contents and answer keys must survive');

const server = http.createServer((req, res) => {
  const name = new URL(req.url, 'http://localhost').pathname;
  const file = path.join(root, name === '/' ? 'index.html' : name);
  try {
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' :
      file.endsWith('.css') ? 'text/css' : file.endsWith('.json') ? 'application/json' : 'text/html; charset=utf-8');
    res.end(fs.readFileSync(file));
  } catch { res.statusCode = 404; res.end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {}) });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(base);
    const seed = await page.evaluate(() => {
      const data = {
        ai_foundations_learning_v1: { mastered: {0:true}, known: {0:{0:true}}, best: {0:18},
          bestPct: {0:90}, questionStats: {'c0-q0':{attempts:1,wrong:1,correct:0,needsReview:true}},
          reviewCards: {'c0-k0':{intervalDays:1,successes:1,attempts:1,due:1,lastGrade:'good'}}, missions:{0:123} },
        ai_training_16day_v1: {completed:{'1-0':123},best:{1:3},stats:{}},
        ai_training_practice_v1: {3:123},
        ai_lab_textbook_v1: {transformers:{opened:true,completed:true,quiz:{0:true}}},
        ai_lab_projects_v1: {version:1,data:{label:{labels:{L01:'日程'},reviewed:false},
          ml:{alpha:2,trained:true,tested:true},rag:{docs:[{title:'旧文档',text:'这是一份已保存的公开教学样例资料。'}]},
          agent:{added:[{id:'old',day:'周五',time:'15:00',title:'旧沙箱日程'}],trace:[]}}}
      };
      for (const [key, value] of Object.entries(data)) localStorage.setItem(key, JSON.stringify(value));
      return Object.fromEntries(Object.keys(data).map(key=>[key, localStorage.getItem(key)]));
    });
    await page.reload(); // Recreate modules as when opening a browser with existing records.
    await page.goto(base + '#courses?mode=textbook&lesson=neural-training');
    await page.waitForSelector('.book-toc');
    await page.locator('.book-toc a').first().click();
    assert(page.url().includes('lesson=neural-training&anchor='));
    await page.reload();
    await page.waitForSelector('.book-article');
    assert.equal(await page.evaluate(()=>Textbook.getActive()), 'neural-training');
    await page.goto(base + '#projects?id=rag');
    await page.locator('.studio-steps-nav a').nth(1).click();
    assert(page.url().includes('id=rag&anchor=proj-step-2'));
    await page.reload();
    assert.equal(await page.evaluate(()=>ProjectLab.getSelected()), 'rag');
    await page.goto(base + '#practice?mode=lab&id=0');
    await page.locator('[data-action="nav-review"]:not(#dailyNav *):visible').first().click();
    assert(page.url().includes('mode=review'));
    await page.reload();
    assert.equal(await page.evaluate(()=>ui.tab), 'review');
    await page.goto(base + '#courses?mode=training&day=3');
    await page.locator('.tr-days [data-day="16"]').click();
    assert(page.url().includes('day=16'));
    await page.reload();
    assert.equal(await page.evaluate(()=>trState.day), 16);
    for (const key of ['ai_foundations_learning_v1', 'ai_training_16day_v1', 'ai_training_practice_v1', 'ai_lab_projects_v1']) {
      assert.equal(await page.evaluate(key=>localStorage.getItem(key), key), seed[key]);
    }
    assert.deepEqual(await page.evaluate(()=>Textbook.getState().transformers),
      JSON.parse(seed.ai_lab_textbook_v1).transformers);

    await page.goto(base + '#courses?mode=foundations&ch=0&tab=quiz');
    const results = await page.evaluate(() => {
      const click = (action, extra='') => {
        const button = document.querySelector(`[data-action="${action}"]${extra}`);
        if (!button || button.disabled) throw Error('Missing enabled control: '+action);
        button.click();
      };
      for (let ch=0; ch<6; ch++) {
        resetChapter(ch, 'quiz'); click('start20');
        if (ui.quizItems.length !== 24 || new Set(ui.quizItems).size !== 24) throw Error('Question ID collision');
        for (let i=0;i<24;i++) {
          const q=ALL_QUESTIONS.get(ui.quizItems[ui.qIndex]);
          click('choice', `[data-index="${ch===0&&i===0?(q.a+1)%4:q.a}"]`);
          click('quiz-check'); click('quiz-next');
        }
        if (!ui.finished) throw Error('Quiz did not finish');
      }
      changeTab('wrong'); click('review-wrong');
      while (!ui.finished) {
        const q=ALL_QUESTIONS.get(ui.quizItems[ui.qIndex]);
        click('choice', `[data-index="${q.a}"]`); click('quiz-check'); click('quiz-next');
      }
      if (activeWrongIds().length) throw Error('Wrong review did not clear');
      for (let ch=0;ch<6;ch++) {
        resetChapter(ch, 'mission');
        const wrong=(MISSIONS[ch].steps[0].ok+1)%3;
        click('mission-choice', `[data-index="${wrong}"]`); click('mission-retry');
        for(let step=0;step<2;step++) {
          click('mission-choice', `[data-index="${MISSIONS[ch].steps[step].ok}"]`); click('mission-advance');
        }
        if (!saved.missions[ch]) throw Error('Mission not saved');
      }
      return {questions:ALL_QUESTIONS.size,wrong:activeWrongIds().length,missions:Object.keys(saved.missions).length};
    });
    assert.deepEqual(results, {questions:144,wrong:0,missions:6});
    await page.setViewportSize({width:390,height:844});
    await page.goto(base + '#courses?mode=textbook&lesson=ai-systems');
    await page.waitForSelector('.book-article');
    await page.locator('#mobileMenuToggle').click();
    await page.locator('#mainSidebar [data-book-open="transformers"]').click();
    assert.equal(await page.locator('#mainSidebar').evaluate(el=>el.classList.contains('drawer-open')), false);
    await page.waitForSelector('[data-book-complete="transformers"]');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert.deepEqual(errors, []);
    console.log('PASS: 144 preserved questions, full quizzes/wrong review, six missions, five-key compatibility, route anchors/reload, training day and drawer selection');
  } finally { await browser.close(); server.close(); }
})().catch(error=>{ console.error(error); server.close(); process.exitCode=1; });
