'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'content/manifest.json'),'utf8'));
assert.equal(manifest.lessons.length,12);
const ids=new Set();
for(const lesson of manifest.lessons){
  assert(!ids.has(lesson.id),`duplicate id ${lesson.id}`);ids.add(lesson.id);
  assert(lesson.quiz.length===2);
  for(const q of lesson.quiz){assert(q.options.length>=3);assert(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<q.options.length);assert(q.why.length>8)}
  for(const key of ['file','source']){
    const file=path.join(root,lesson[key]);assert(fs.existsSync(file),`${file} missing`);
    assert(path.normalize(file).startsWith(root));
  }
  const md=fs.readFileSync(path.join(root,lesson.source),'utf8');
  assert(md.length>1500,`${lesson.id} shallow article`);
  assert(md.includes('## ')&&md.includes('延伸阅读'));
  const html=fs.readFileSync(path.join(root,lesson.file),'utf8');
  assert(html.includes('<h1>')&&html.length>500);
}
const source=fs.readFileSync(path.join(root,'content/reader.js'),'utf8');
new vm.Script(source);
const context={document:{addEventListener(){}},localStorage:{getItem(){return null}},console};
const lab=vm.runInNewContext(source+'\nTextbook._test',context);
assert.equal(lab.retrieve('电影票',2).length,0);
assert(lab.retrieve('续借规则',2).some(item=>item.id==='C'));
assert.equal(lab.retrieve('图书馆周一',1).length,1);
const stats=lab.gradientStats();assert(Math.abs(stats.loss-56/3)<1e-9);
assert(Math.abs(stats.gradient+56/3)<1e-9);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const required of ['content/reader.js','content/reader.css','nav-textbook','training/training-ui.js','feedback/feedback.js'])assert(index.includes(required),required);
console.log('TEXTBOOK STATIC TEST PASS — twelve articles, twenty-four checks, content files, source links, gradient, lexical search');
