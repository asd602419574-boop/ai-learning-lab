// Controlled compatibility data extracted from the historical commit recorded in
// foundations-questions-v1.json. Verification must not depend on Git history or HEAD.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const baseline = require('./foundations-questions-v1.json');

function questionData(html) {
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1);
  assert(script, 'The generated entry must contain its application script');
  const code = script[1].replace(/render\(\);\s*(?:syncRouteFromHash\(\);\s*)?$/, '');
  const context = { document: { addEventListener() {} }, window: { addEventListener() {} },
    localStorage: { getItem() { return null; } }, console };
  return JSON.parse(JSON.stringify(vm.runInNewContext(code + `;
    [...ALL_QUESTIONS.values()].map(q=>({id:q.id,chapter:q.chapter,q:q.q,o:q.o,a:q.a,why:q.why}));`, context)));
}

function assertQuestionBaseline(questions) {
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.questions.length, 144);
  assert.equal(crypto.createHash('sha256').update(JSON.stringify(baseline.questions)).digest('hex'),
    baseline.source.questionsSha256, 'The controlled fixture and its provenance checksum must agree');
  assert.equal(questions.length, 144);
  assert.deepEqual(questions, baseline.questions,
    'All old question IDs, chapters, prompts, choices, answers and explanations must survive');
}

module.exports = { questionData, assertQuestionBaseline };

if (require.main === module) {
  // Also accepts a copied index.html outside the repository, proving that this
  // compatibility check works without any .git directory or historical objects.
  const entry = process.argv[2] || path.resolve(__dirname, '../../index.html');
  const questions = questionData(fs.readFileSync(entry, 'utf8'));
  assertQuestionBaseline(questions);
  for (const field of ['id', 'chapter', 'q', 'o', 'a', 'why']) {
    const changed = structuredClone(questions);
    if (field === 'o') changed[0].o[0] += ' changed';
    else if (typeof changed[0][field] === 'number') changed[0][field] += 1;
    else changed[0][field] += ' changed';
    assert.throws(() => assertQuestionBaseline(changed), assert.AssertionError,
      `Changes to ${field} must fail compatibility verification`);
  }
  console.log('PASS: 144 historical questions match; mutations to all six protected fields are rejected.');
}
