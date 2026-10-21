const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const base = path.resolve(__dirname, '..');
function extract(file, name) {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(base, file), 'utf8') + `;globalThis.result=${name}`, context);
  return context.result;
}
const { render } = require('../learning/overview.js');
const trainingPlan = extract('training/training-data.js', 'TRAINING_PLAN');
const foundationCourses = extract('content/foundations.js', 'COURSES');
const textbookLessons = JSON.parse(fs.readFileSync(path.join(base, 'content/manifest.json'), 'utf8')).lessons;
const lessons = require('../learning/catalog.js').list();
const html = render({ trainingPlan, foundationCourses, textbookLessons, lessons });
assert.match(html, /data-program-overview/);
assert.match(html, /href="#lesson\?id=ai-basics"[^>]*>开始基础资料学习/);
assert.match(html, /id="training-overview"/);
assert.equal((html.match(/data-training-day="\d+"/g) || []).length, 16);
for (const day of trainingPlan) {
  assert.ok(html.includes(day.title), `Missing day ${day.day} title`);
  for (const session of day.sessions) {
    assert.ok(html.includes(session.topic));
    assert.ok(html.includes(session.focus));
    assert.ok(html.includes(session.deliverable));
  }
  assert.ok(html.includes(`#courses?mode=training&amp;day=${day.day}`));
}
for (const [index, course] of foundationCourses.entries()) {
  assert.ok(html.includes(course.title));
  assert.ok(html.includes(`#courses?mode=foundations&amp;ch=${index}&amp;tab=learn`));
}
for (const lesson of lessons) assert.ok(html.includes(`#lesson?id=${lesson.id}`));
assert.match(html, /部分专题仍是大纲与任务说明/);
assert.match(html, /外部工具/);
assert.match(html, /个人自学/);
assert.match(html, /<details[\s>]/);
assert.match(html, /12 篇/);
const escaped = render({ lessons: [{ id: 'x"><img', title: '<script>alert(1)</script>' }] });
assert.ok(!escaped.includes('<script>'));
assert.ok(escaped.includes('&lt;script&gt;'));
console.log('Learning overview: complete curriculum, honest scope, links and escaping PASS');
