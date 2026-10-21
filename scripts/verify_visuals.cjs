const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/lovsia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'screenshots_quiet');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const server = http.createServer((req, res) => {
  const parsed = new URL(req.url, 'http://localhost');
  const file = path.join(root, parsed.pathname === '/' ? 'index.html' : parsed.pathname);
  try {
    const ext = path.extname(file);
    const ct = ext === '.js' ? 'text/javascript' :
      ext === '.css' ? 'text/css' :
      ext === '.json' ? 'application/json' :
      ext === '.png' ? 'image/png' :
      ext === '.svg' ? 'image/svg+xml' : 'text/html; charset=utf-8';
    res.setHeader('Content-Type', ct);
    res.end(fs.readFileSync(file));
  } catch (e) {
    res.statusCode = 404;
    res.end();
  }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/`;
  console.log(`Server running at ${base}`);

  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROME_CHANNEL ? { channel: process.env.CHROME_CHANNEL } : {})
  });

  try {
    // A wide workspace must use the available viewport without scaling its controls.
    for (const width of [1440, 1920, 2560, 3072, 3840]) {
      const context = await browser.newContext({ viewport: { width, height: 1000 } });
      const page = await context.newPage();
      for (const route of ['#home', '#projects']) {
        await page.goto(base + route);
        const layout = await page.evaluate(() => {
          const sidebar = document.querySelector('#mainSidebar').getBoundingClientRect();
          const content = document.querySelector('#mainContent').getBoundingClientRect();
          return { sidebarRight: sidebar.right, left: content.left, right: content.right,
            overflow: document.documentElement.scrollWidth > innerWidth,
            navFont: getComputedStyle(document.querySelector('.nav-item')).fontSize };
        });
        assert(Math.abs(layout.right - width) <= 1, `Unused workspace at ${width} ${route}: right=${layout.right}`);
        assert(Math.abs(layout.left - layout.sidebarRight) <= 1, `Sidebar overlaps workspace at ${width}`);
        assert.equal(layout.overflow, false, `Horizontal overflow at ${width} ${route}`);
        assert.equal(layout.navFont, '13.5px', 'Wider layout must not inflate navigation');
      }
      await page.goto(base + '#courses?mode=textbook&lesson=transformers');
      await page.waitForSelector('.book-article');
      const reading = await page.evaluate(() => ({
        width: document.querySelector('.book-article').getBoundingClientRect().width,
        font: getComputedStyle(document.querySelector('.book-article > p')).fontSize,
        overflow: document.documentElement.scrollWidth > innerWidth
      }));
      assert(reading.width <= 880, `Reading measure too wide at ${width}`);
      assert.equal(reading.font, '17.5px');
      assert.equal(reading.overflow, false);
      await context.close();
    }
    // 1. Check 1920x1080 Desktop Home
    console.log('Capturing 1920x1080 Home...');
    const ctx1920 = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
    const p1920 = await ctx1920.newPage();
    await p1920.goto(base + '#home');
    await p1920.waitForSelector('.home-resume');
    await p1920.screenshot({ path: path.join(outDir, 'screenshot-1920-home.png'), fullPage: false });

    // Measure layout properties at 1920
    const m1920 = await p1920.evaluate(() => {
      const sb = document.querySelector('#mainSidebar').getBoundingClientRect();
      const resume = document.querySelector('.home-resume').getBoundingClientRect();
      const track = document.querySelector('.home-track-card').getBoundingClientRect();
      const titleFont = getComputedStyle(document.querySelector('.home-heading')).fontSize;
      const navFont = getComputedStyle(document.querySelector('.nav-item')).fontSize;
      return { sidebarLeft: sb.left, sidebarWidth: sb.width, resumeWidth: resume.width, trackWidth: track.width, titleFont, navFont };
    });
    console.log('1920x1080 measurements:', m1920);
    assert.equal(m1920.sidebarLeft, 0, 'Sidebar must be docked to the left edge at x=0');
    assert(m1920.sidebarWidth >= 190 && m1920.sidebarWidth <= 220, `Sidebar width ${m1920.sidebarWidth} out of bounds (190-220)`);
    assert.equal(m1920.navFont, '13.5px', 'Nav font size should be disciplined ~13.5-14px');

    // 2. Check 2560x1440 Desktop Home
    console.log('Capturing 2560x1440 Home...');
    const ctx2560 = await browser.newContext({ viewport: { width: 2560, height: 1440 } });
    const p2560 = await ctx2560.newPage();
    await p2560.goto(base + '#home');
    await p2560.waitForSelector('.home-resume');
    await p2560.screenshot({ path: path.join(outDir, 'screenshot-2560-home.png'), fullPage: false });

    const m2560 = await p2560.evaluate(() => {
      const sb = document.querySelector('#mainSidebar').getBoundingClientRect();
      const titleFont = getComputedStyle(document.querySelector('.home-heading')).fontSize;
      const navFont = getComputedStyle(document.querySelector('.nav-item')).fontSize;
      return { sidebarLeft: sb.left, sidebarWidth: sb.width, titleFont, navFont };
    });
    console.log('2560x1440 measurements:', m2560);
    assert.equal(m2560.sidebarLeft, 0, 'Sidebar must remain docked at x=0 on 2560');
    assert(m2560.sidebarWidth >= 190 && m2560.sidebarWidth <= 225, `Sidebar width ${m2560.sidebarWidth} out of bounds`);
    assert.equal(m2560.navFont, '13.5px', 'Nav font size should NOT balloon on 2560');

    // 3. Check 3840x2160 Desktop Home (4K)
    console.log('Capturing 3840x2160 Home (4K)...');
    const ctx3840 = await browser.newContext({ viewport: { width: 3840, height: 2160 } });
    const p3840 = await ctx3840.newPage();
    await p3840.goto(base + '#home');
    await p3840.waitForSelector('.home-resume');
    await p3840.screenshot({ path: path.join(outDir, 'screenshot-3840-home.png'), fullPage: false });

    const m3840 = await p3840.evaluate(() => {
      const sb = document.querySelector('#mainSidebar').getBoundingClientRect();
      const content = document.querySelector('#mainContent').getBoundingClientRect();
      const titleFont = getComputedStyle(document.querySelector('.home-heading')).fontSize;
      const navFont = getComputedStyle(document.querySelector('.nav-item')).fontSize;
      const bodyFont = getComputedStyle(document.body).fontSize;
      return { sidebarLeft: sb.left, sidebarWidth: sb.width, contentLeft: content.left, contentWidth: content.width, titleFont, navFont, bodyFont };
    });
    console.log('3840x2160 measurements:', m3840);
    assert.equal(m3840.sidebarLeft, 0, `Sidebar must be docked at x=0 on 4K, was ${m3840.sidebarLeft}`);
    assert(m3840.sidebarWidth >= 190 && m3840.sidebarWidth <= 225, `Sidebar width ${m3840.sidebarWidth} out of bounds on 4K`);
    assert.equal(m3840.navFont, '13.5px', 'Nav font size should NOT balloon on 4K');

    // 4. Check Textbook Reader on Desktop (1920x1080)
    console.log('Capturing Textbook Reader on Desktop...');
    const pTextbook = await ctx1920.newPage();
    await pTextbook.goto(base + '#courses?mode=textbook&lesson=transformers');
    await pTextbook.waitForSelector('.book-article');
    await pTextbook.waitForSelector('.book-toc');
    await pTextbook.screenshot({ path: path.join(outDir, 'screenshot-desktop-textbook.png'), fullPage: false });

    const mReader = await pTextbook.evaluate(() => {
      const article = document.querySelector('.book-article').getBoundingClientRect();
      const p = document.querySelector('.book-article > p, .book-article p:not(blockquote p)');
      const pFont = getComputedStyle(p).fontSize;
      const pLineHeight = getComputedStyle(p).lineHeight;
      const bqP = document.querySelector('.book-article blockquote p');
      const bqFont = bqP ? getComputedStyle(bqP).fontSize : null;
      const toc = document.querySelector('.book-toc').getBoundingClientRect();
      return { articleWidth: article.width, pFont, pLineHeight, bqFont, tocTop: toc.top };
    });
    console.log('Textbook Reader measurements:', mReader);
    assert(mReader.articleWidth <= 920, `Article reading width ${mReader.articleWidth} exceeds maximum comfortable width`);
    const pNum = parseFloat(mReader.pFont);
    assert(pNum >= 17 && pNum <= 18.5, `Article body font size should be ~17.5px, was ${mReader.pFont}`);

    // 5. Check 1440x1000 Viewport Sequential Lesson Clicking & Sidebar 3-Tier non-occlusion
    console.log('Testing 1440x1000 Sequential Textbook Lesson Clicking & Sidebar Non-Occlusion...');
    const ctx1440 = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const p1440 = await ctx1440.newPage();
    await p1440.goto(base + '#courses?mode=textbook');
    await p1440.waitForSelector('#mainSidebar [data-book-open="agents"]');

    const lessonIds = [
      'ai-systems',
      'ml-evaluation',
      'neural-training',
      'transformers',
      'prompt-llm',
      'rag',
      'agents',
      'data-delivery'
    ];

    for (const id of lessonIds) {
      const btn = p1440.locator(`#mainSidebar [data-book-open="${id}"]`);
      await btn.click({ timeout: 4000 });
      await p1440.waitForTimeout(150);
    }

    assert.equal(await p1440.evaluate(() => Textbook.getActive()), 'data-delivery');

    // Click back to agents
    const agentBtn = p1440.locator('#mainSidebar [data-book-open="agents"]');
    await agentBtn.click({ timeout: 3000 });
    assert.equal(await p1440.evaluate(() => Textbook.getActive()), 'agents');

    // Verify 3-tier sidebar zones
    const zones = await p1440.evaluate(() => {
      const header = document.querySelector('.sidebar-header').getBoundingClientRect();
      const panel = document.querySelector('#sidePanelContent').getBoundingClientRect();
      const footer = document.querySelector('.side-global-footer').getBoundingClientRect();
      const agentBox = document.querySelector('#mainSidebar [data-book-open="agents"]').getBoundingClientRect();
      return {
        headerBottom: header.bottom,
        panelTop: panel.top,
        panelBottom: panel.bottom,
        footerTop: footer.top,
        agentBoxTop: agentBox.top,
        agentBoxBottom: agentBox.bottom,
        isAgentOverlappingFooter: agentBox.top < footer.top && agentBox.bottom > footer.top
      };
    });
    console.log('1440x1000 Sidebar zones:', zones);
    assert(zones.panelTop >= zones.headerBottom - 2, 'Catalog panel should be below sidebar header');
    assert(zones.footerTop >= zones.panelBottom - 2, 'Footer feedback should be below catalog panel');
    assert(!zones.isAgentOverlappingFooter, 'Agent button must not overlap footer feedback');
    await p1440.screenshot({ path: path.join(outDir, 'screenshot-1440-textbook-agent.png'), fullPage: false });

    // 6. Check Practical Project on Desktop (1920x1080)
    console.log('Capturing Practical Project on Desktop...');
    const pProject = await ctx1920.newPage();
    await pProject.goto(base + '#projects?id=rag');
    await pProject.waitForSelector('.studio-work');
    await pProject.screenshot({ path: path.join(outDir, 'screenshot-desktop-project.png'), fullPage: false });

    // 7. Check Mobile 390x844 Viewport
    console.log('Capturing Mobile 390x844...');
    const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const pMobile = await ctxMobile.newPage();
    await pMobile.goto(base + '#home');
    await pMobile.waitForSelector('.home-resume');
    await pMobile.screenshot({ path: path.join(outDir, 'screenshot-390-mobile-home.png'), fullPage: false });

    // Open mobile drawer
    console.log('Testing Mobile Drawer...');
    await pMobile.locator('#mobileMenuToggle').click();
    await pMobile.waitForTimeout(300);
    assert.equal(await pMobile.locator('#mainSidebar').evaluate(el => el.classList.contains('drawer-open')), true);
    await pMobile.screenshot({ path: path.join(outDir, 'screenshot-390-mobile-drawer.png'), fullPage: false });

    // Check no horizontal overflow on mobile
    const overflow = await pMobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    assert(overflow, 'Mobile page must not have horizontal overflow');

    console.log('ALL VISUAL & LAYOUT CHECKS PASSED.');
  } finally {
    await browser.close();
    server.close();
  }
})().catch(e => {
  console.error(e);
  server.close();
  process.exitCode = 1;
});
