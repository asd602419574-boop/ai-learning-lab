/* Controlled browser layout checks; these do not verify a physical Windows display. */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'screenshots_v2', 'p1');
fs.mkdirSync(out, { recursive: true });
const cases = [
  ['1k',1920,1080,1], ['2k',2560,1440,1], ['4k',3840,2160,1],
  ['sim-1k-125',1536,864,1.25], ['sim-2k-150',1707,960,1.5],
  ['sim-4k-150',2560,1440,1.5], ['sim-4k-200',1920,1080,2],
  ['transition',1024,768,1], ['mobile',390,844,1]
];
const routes = [
  ['home','#home','[data-learning-home]'], ['lesson-workspace','#lesson?id=reliable-ai','[data-workshop]',1],
  ['lesson-reading','#lesson?id=reliable-ai','[data-workshop]',3],
  ['portfolio','#my-learning','[data-workshop]'],
  ['textbook','#courses?mode=textbook&lesson=transformers','.book-article'],
  ['rag-project','#projects?id=rag','.studio-work']
];
const report = {kind:'controlled-browser-simulation',physicalWindowsDisplayVerified:false,browserZoom:'100% controlled default; no physical zoom observation',systemScale:'Unobserved; DPR and CSS viewports simulated independently',generatedAt:new Date().toISOString(),measurements:[],failures:[]};
const server = http.createServer((req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if(!file.startsWith(root + path.sep)) throw Error('outside root');
    const mime={'.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
    res.setHeader('Content-Type',mime[path.extname(file)]||'text/html; charset=utf-8');res.end(fs.readFileSync(file));
  } catch {res.statusCode=404;res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}/`;
  let browser;
  try {
    browser=await chromium.launch({headless:true,channel:process.env.CHROME_CHANNEL||'chrome'});
    for(const [name,width,height,dpr] of cases){
      const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
      const page=await context.newPage();
      for(const [route,hash,selector,step] of routes){
        try {
          await page.goto(base+hash);await page.waitForSelector(selector,{timeout:10000});
          if(step!==undefined) await page.locator(`[data-step="${step}"]`).first().click();
          await page.evaluate(()=>document.fonts.ready);
          const m=await page.evaluate(()=>{
            const measure=s=>{const n=document.querySelector(s);if(!n)return null;const r=n.getBoundingClientRect(),c=getComputedStyle(n);return {left:r.left,right:r.right,width:r.width,fontSize:c.fontSize,display:c.display};};
            const nav=document.querySelector('.nav-item'), navStyle=nav?getComputedStyle(nav):null;
            return {innerWidth,innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,main:measure('#mainContent'),workspace:measure('[data-workshop]'),reading:measure('.learn-reading'),book:measure('.book-article'),navFont:navStyle?navStyle.fontSize:null,scaling:['html','body','#mainContent','#dynamicArea'].map(s=>{const n=document.querySelector(s);return n?{selector:s,zoom:getComputedStyle(n).zoom,transform:getComputedStyle(n).transform}:null;}).filter(Boolean)};
          });
          const errors=[];
          if(m.scrollWidth>m.innerWidth+1)errors.push('horizontal overflow');
          if(m.main&&(m.main.right>m.innerWidth+1||m.main.left< -1))errors.push('main outside viewport');
          for(const key of ['reading','book'])if(m[key]&&m[key].width>880.5)errors.push(key+' exceeds 880px');
          if(m.navFont!=='13.5px')errors.push('navigation font changed: '+m.navFont);
          if(m.scaling.some(s=>!['1','normal'].includes(s.zoom)||s.transform!=='none'))errors.push('whole-page CSS scaling found');
          report.measurements.push({case:name,route,...m,errors});
          for(const error of errors)report.failures.push({case:name,route,error});
          if(['1k','2k','4k','mobile'].includes(name)&&['home','lesson-workspace'].includes(route))await page.screenshot({path:path.join(out,`${name}-${route}.png`),fullPage:false});
        }catch(error){report.failures.push({case:name,route,error:error.message});}
      }
      await context.close();
    }
  }finally{
    if(browser)await browser.close();server.close();
    fs.writeFileSync(path.join(out,'layout-results.json'),JSON.stringify(report,null,2));
  }
  console.log(JSON.stringify({measurements:report.measurements.length,failures:report.failures,output:path.join(out,'layout-results.json')},null,2));
  if(report.failures.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
