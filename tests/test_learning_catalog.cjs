const assert=require('node:assert/strict');
const catalog=require('../learning/catalog.js');
const core=require('../learning/core.js');
const fs=require('node:fs');
const vm=require('node:vm');
const sandbox={};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(require.resolve('../learning/content.js'),'utf8'),sandbox);
vm.runInContext(fs.readFileSync(require.resolve('../learning/catalog.js'),'utf8'),sandbox);
assert.equal(sandbox.LearningCatalog.get('reliable-ai'),sandbox.LearningContent);
assert.equal(sandbox.LearningCatalog.list().length,4);
const list=catalog.list();
assert.deepEqual(list.map(x=>x.id),['ai-basics','clear-task','reliable-ai','evaluate-results']);
assert.equal(catalog.get('reliable-ai'),require('../learning/content.js'));
assert.equal(catalog.get('missing'),null);
for(const lesson of list){
  assert.equal(catalog.get(lesson.id),lesson);
  assert.deepEqual(lesson.steps.map(x=>x.id),['predict','try','observe','explain','retry','transfer']);
  assert.ok(lesson.sections.length>=7);
  assert.ok(lesson.sections.every(x=>x.title&&x.html.length>200));
  assert.equal(new Set(lesson.sections.map(x=>x.id)).size,lesson.sections.length);
  assert.ok(lesson.sections.map(x=>x.html).join('').length>2400);
  assert.ok(lesson.resources.length>=2&&lesson.resources.every(x=>/^https:\/\//.test(x.url)));
  assert.notEqual(lesson.scenarios.practice.source,lesson.scenarios.transfer.source);
  assert.notDeepEqual(lesson.scenarios.practice.exampleAnswers,lesson.scenarios.transfer.exampleAnswers);
  for(const scenario of Object.values(lesson.scenarios)){
    assert.equal(scenario.fields.length,6);
    assert.equal(new Set(scenario.fields.map(x=>x.id)).size,6);
    for(const f of scenario.fields){
      assert.ok(scenario.source.includes(f.evidence),lesson.id+': evidence '+f.id);
      assert.ok(f.explanation&&f.expected&&scenario.exampleAnswers[f.id]&&scenario.flawedAnswers[f.id]);
      if(f.options)assert.ok(f.options.includes(f.expected));
    }
    assert.ok(core.checkFields(scenario,scenario.exampleAnswers).passed);
    assert.ok(!core.checkFields(scenario,scenario.flawedAnswers).passed);
  }
  assert.ok(lesson.predictionClaims.some(x=>x.supported)&&lesson.predictionClaims.some(x=>!x.supported));
  for(const claim of lesson.predictionClaims){assert.equal(typeof claim.supported,'boolean');assert.ok(lesson.scenarios.practice.source.includes(claim.evidence));}
}
console.log('Learning catalog: 4 stable lessons, field rules, evidence, transfer, and reuse passed');
