/* Controlled browser layout checks; these do not verify a physical Windows display. */
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const stage = process.env.LEARNING_VISUAL_STAGE === 'p2' ? 'p2' : 'p1';
const out = path.join(root, 'screenshots_v2', stage);
fs.mkdirSync(out, { recursive: true });
const cases = [
  ['1k',1920,1080,1], ['2k',2560,1440,1], ['4k',3840,2160,1],
  ['sim-1k-125',1536,864,1.25], ['sim-2k-150',1707,960,1.5],
  ['sim-4k-150',2560,1440,1.5], ['sim-4k-200',1920,1080,2],
  ['transition',1024,768,1], ['mobile',390,844,1]
];
const routes = [
  ['home','#home','[data-learning-home]'], ['lesson-workspace','#lesson?id=reliable-ai&view=practice','[data-workshop]',1],
  ['lesson-reading','#lesson?id=reliable-ai&view=practice','[data-workshop]',3],
  ['portfolio','#my-learning','[data-workshop]'],
  ['textbook','#courses?mode=textbook&lesson=transformers','.book-article'],
  ['rag-project','#projects?id=rag','.studio-work']
];
if(stage==='p2') routes.push(['ai-basics-workspace','#lesson?id=ai-basics&view=practice','[data-workshop]',1],['clear-task-workspace','#lesson?id=clear-task&view=practice','[data-workshop]',1],['evaluate-results-workspace','#lesson?id=evaluate-results&view=practice','[data-workshop]',1]);
const report = {stage,portfolioFixture:stage==='p2'?'Four explicitly fictional task-complete artifacts, created only in isolated browser contexts for layout measurement. No user records touched.':'none',kind:'controlled-browser-simulation',physicalWindowsDisplayVerified:false,browserZoom:'100% controlled default; no physical zoom observation',systemScale:'Unobserved; DPR and CSS viewports simulated independently',generatedAt:new Date().toISOString(),measurements:[],failures:[]};
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
          if(stage==='p2' && route==='portfolio') {
            await page.evaluate(()=>{
              const createdAt='2026-10-21T12:00:00.000Z';
              for(const lesson of LearningCatalog.list()) {
                const scenario=lesson.scenarios.transfer, answers={...scenario.exampleAnswers}, result=LearningCore.checkFields(scenario,answers), state=LearningCore.emptyState();
                state.step=5;state.updatedAt=createdAt;state.drafts.transfer=answers;state.explanations.transfer='虚构布局测试：我根据材料逐项核对，并解释了判断依据。';state.reflection='虚构布局测试：下一次先检查约束，再比较结果。';state.selfReview={evidence:true,uncertainty:true,explain:true};
                const attempt={id:'fixture-attempt-'+lesson.id,scenarioId:'transfer',phase:5,answers,result,explanation:state.explanations.transfer,createdAt};state.attempts=[attempt];
                state.artifacts=[{id:'fixture-artifact-'+lesson.id,title:'虚构布局测试作品 · '+lesson.title,lessonId:lesson.id,scenarioId:'transfer',source:scenario.source,checks:[attempt],status:result.passed?'passed':'draft',answers,explanation:state.explanations.transfer,reflection:state.reflection,selfReview:{...state.selfReview},attemptIds:[attempt.id],createdAt,updatedAt:createdAt}];
                const write=LearningCore.createLessonStore(localStorage,lesson.id).write(state);if(!write.ok)throw Error(write.error);
              }
            });
          }
          await page.goto(base+hash);if(stage==='p2' && route==='portfolio')await page.reload();await page.waitForSelector(selector,{timeout:10000});
          if(stage==='p2' && route==='portfolio' && await page.locator('.learn-artifact').count()!==4)throw Error('fictional portfolio fixture must render four artifacts');
          if(step!==undefined) await page.locator(`[data-step="${step}"]`).first().click();
          await page.evaluate(()=>document.fonts.ready);
          const m=await page.evaluate(()=>{
            const measure=s=>{const n=document.querySelector(s);if(!n)return null;const r=n.getBoundingClientRect(),c=getComputedStyle(n);return {left:r.left,right:r.right,width:r.width,fontSize:c.fontSize,display:c.display};};
            const nav=document.querySelector('.nav-item'), navStyle=nav?getComputedStyle(nav):null;
            return {lessonId:document.querySelector('[data-workshop]')?.getAttribute('data-lesson-id')||null,artifactCount:document.querySelectorAll('.learn-artifact').length,innerWidth,innerHeight,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth,main:measure('#mainContent'),workspace:measure('[data-workshop]'),reading:measure('.learn-reading'),book:measure('.book-article'),navFont:navStyle?navStyle.fontSize:null,scaling:['html','body','#mainContent','#dynamicArea'].map(s=>{const n=document.querySelector(s);return n?{selector:s,zoom:getComputedStyle(n).zoom,transform:getComputedStyle(n).transform}:null;}).filter(Boolean)};
          });
          const errors=[];
          if(m.scrollWidth>m.innerWidth+1)errors.push('horizontal overflow');
          if(m.main&&(m.main.right>m.innerWidth+1||m.main.left< -1))errors.push('main outside viewport');
          for(const key of ['reading','book'])if(m[key]&&m[key].width>880.5)errors.push(key+' exceeds 880px');
          if(m.navFont!=='13.5px')errors.push('navigation font changed: '+m.navFont);
          if(m.scaling.some(s=>!['1','normal'].includes(s.zoom)||s.transform!=='none'))errors.push('whole-page CSS scaling found');
          report.measurements.push({case:name,route,fictionalFixture:stage==='p2'&&route==='portfolio',...m,errors});
          for(const error of errors)report.failures.push({case:name,route,error});
          const originalShot=['1k','2k','4k','mobile'].includes(name)&&['home','lesson-workspace'].includes(route);
          const additionalShot=stage==='p2'&&((name==='1k'&&['clear-task-workspace','lesson-reading','portfolio'].includes(route))||(name==='4k'&&route==='evaluate-results-workspace')||(name==='mobile'&&['ai-basics-workspace','portfolio'].includes(route)));
          if(originalShot||additionalShot)await page.screenshot({path:path.join(out,`${name}-${route}.png`),fullPage:false});
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
