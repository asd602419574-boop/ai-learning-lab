from pathlib import Path
from playwright.sync_api import sync_playwright
import json
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text('utf-8')
assets={'content/manifest.json':(R/'content/manifest.json').read_text('utf-8')}
for f in (R/'content/rendered').glob('*.html'):assets['content/rendered/'+f.name]=f.read_text('utf-8')
bootstrap='<script>window.__memory={};Object.defineProperty(window,"localStorage",{configurable:true,value:{getItem(k){return Object.prototype.hasOwnProperty.call(window.__memory,k)?window.__memory[k]:null},setItem(k,v){window.__memory[k]=String(v)},removeItem(k){delete window.__memory[k]}}});const fixture='+json.dumps(assets,ensure_ascii=False).replace('</','<\\/')+';window.fetch=async function(u){const p=String(u).replace(/^\\.\\//,\'\');return p in fixture?{ok:true,text:async()=>fixture[p],json:async()=>JSON.parse(fixture[p])}:{ok:false,status:404,text:async()=>\'\'}};</script>'
html=html.replace('</head>',bootstrap+'</head>',1)
for file in ['content/reader.css','projects/projects.css','training/training.css','feedback/feedback.css']:
    html=html.replace('<link rel="stylesheet" href="./'+file+'">','<style>'+ (R/file).read_text('utf-8')+'</style>')
for file in ['feedback/feedback.js','content/reader.js','projects/logic.js','projects/guides.js','projects/app.js','training/training-data.js','training/training-ui.js']:
    html=html.replace('<script src="./'+file+'"></script>','<script>'+ (R/file).read_text('utf-8').replace('</script>','<\\/script>')+'</script>')
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
    page=browser.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(html,wait_until='load')
    page.evaluate("localStorage.setItem('ai_foundations_learning_v1','keep-legacy')")
    page.locator('[data-action="nav-projects"]').click()
    assert page.locator('.studio-tile').count()==4
    # 12 labels with one deliberate disagreement, then check calculated kappa and CSV
    page.locator('[data-project="open"][data-id="label"]').click()
    gold=page.evaluate('ProjectLogic.LABEL_ROWS.map(x=>x.gold)')
    for i,expected in enumerate(gold):
        page.locator('[data-label-row]').nth(i).select_option('技术' if i==0 else expected)
    page.locator('[data-project="review-label"]').click()
    assert '参考一致性' in page.locator('.studio-metrics').inner_text()
    assert '分歧清单' in page.locator('.studio-explain').inner_text()
    with page.expect_download() as d: page.locator('[data-project="export-label"]').click()
    assert d.value.suggested_filename.endswith('.csv')
    page.locator('[data-project="back"]').click()
    # actual training/evaluation/prediction
    page.locator('[data-project="open"][data-id="ml"]').click()
    page.locator('[data-project="train-model"]').click()
    assert '测试集准确率' in page.locator('.studio-metrics').inner_text()
    page.locator('#mlCustom').fill('免费奖励马上领取')
    page.locator('[data-project="predict-model"]').click()
    assert '预测：' in page.locator('.studio-explain').inner_text()
    page.locator('[data-project="back"]').click()
    # retrieval, evaluation, user doc
    page.locator('[data-project="open"][data-id="rag"]').click()
    page.locator('#ragQuery').fill('普通图书续借几天')
    page.locator('[data-project="rag-search"]').click()
    assert '[LIB]' in page.locator('.studio-hit').first.inner_text()
    page.locator('[data-project="rag-eval"]').click()
    assert 'Recall@K' in page.locator('.studio-metrics').inner_text()
    page.locator('#ragDocTitle').fill('交通')
    page.locator('#ragDocText').fill('公共交通建议提前检查运营时间，出行前核对公告并备选路线。')
    page.locator('[data-project="rag-add"]').click()
    assert '7 份文档' in page.locator('.studio-main').inner_text()
    page.locator('[data-project="rag-search"]').click()
    page.locator('[data-project="back"]').click()
    # read, reject collision, approve, write, trace, deny another write
    page.locator('[data-project="open"][data-id="agent"]').click()
    page.locator('[data-project="agent-read"]').click()
    page.locator('[data-agent-day]').select_option('周二')
    page.locator('[data-project="agent-propose"]').click()
    assert '时间冲突' in page.locator('.studio-main').inner_text()
    page.locator('[data-agent-day]').select_option('周三')
    page.locator('[data-project="agent-propose"]').click()
    assert page.locator('[data-project="agent-write"]').is_disabled()
    page.locator('[data-agent-approve]').check()
    page.locator('[data-project="agent-write"]').click()
    assert '本地写入成功' in page.locator('.studio-trace').inner_text()
    assert page.locator('.studio-scroll tr').count()==4
    page.locator('[data-project="back"]').click()
    assert '4 / 4' in page.locator('.studio-stats').inner_text()
    with page.expect_download() as d:page.locator('[data-project="export-all"]').click()
    assert d.value.suggested_filename.endswith('.json')
    assert page.evaluate("localStorage.getItem('ai_foundations_learning_v1')")=='keep-legacy'
    stored=page.evaluate('JSON.stringify(window.__memory)')
    page.close()
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.on('pageerror',lambda err:errors.append(str(err)))
    page.set_content(html.replace('window.__memory={};','window.__memory='+stored+';'),wait_until='load')
    page.locator('[data-action="nav-projects"]').click()
    assert '4 / 4' in page.locator('.studio-stats').inner_text()
    page.locator('[data-action="nav-textbook"]').click();page.wait_for_selector('.book-library-card')
    assert page.locator('.book-library-card').count()==8
    mobile=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
    mobile.on('pageerror',lambda err:errors.append(str(err)))
    mobile.set_content(html,wait_until='load')
    mobile.locator('[data-action="nav-projects"]').click()
    mobile.locator('[data-project="open"][data-id="rag"]').click()
    measure=mobile.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
    assert measure['scroll']<=measure['client']+1,measure
    assert not errors,errors
    print('PASS: 4 projects, 12 label rows, metrics, CSV, real ML, RAG, tool gating, export, persistence, textbook legacy, mobile 390px')
    browser.close()
