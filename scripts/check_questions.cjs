#!/usr/bin/env node
/*
 * Question-bank quality gate.
 *
 * Checks the three authored MCQ banks for defects that let learners score
 * without understanding the material:
 *   - answer position skew (e.g. "always pick B")
 *   - option-length cues (the correct option being conspicuously the longest)
 *   - duplicate options or stems
 *   - explanations that are too short to teach anything
 *
 * Run: node scripts/check_questions.cjs
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const failures = [];
const warnings = [];

function loadScript(relative, exportName, symbolName) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const context = { module: { exports: {} }, console };
  vm.createContext(context);
  vm.runInContext(`${source}\n;module.exports.__value=${symbolName};`, context);
  return context.module.exports.__value;
}

function normalise(options, answer) {
  return { options, answer };
}

function checkBank(name, questions, { groups }) {
  const total = questions.length;
  assert.ok(total > 0, `${name}: empty bank`);

  const positions = [0, 0, 0, 0];
  let correctLongest = 0;
  let strongCue = 0;
  let shortExplanation = 0;
  const seenStems = new Map();

  for (const [index, question] of questions.entries()) {
    const { options, answer } = normalise(question.options, question.answer);
    const label = `${name}[${index}]`;

    if (options.length !== 4) failures.push(`${label}: expected 4 options, got ${options.length}`);
    if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
      failures.push(`${label}: answer index ${answer} out of range`);
      continue;
    }
    if (new Set(options).size !== options.length) failures.push(`${label}: duplicate option text`);
    if (options.some(option => typeof option !== 'string' || !option.trim())) {
      failures.push(`${label}: blank option`);
    }

    positions[answer] += 1;

    const wrongLengths = options.filter((_, i) => i !== answer).map(option => option.length);
    const maxWrong = Math.max(...wrongLengths);
    if (options[answer].length === Math.max(...options.map(option => option.length))) correctLongest += 1;
    if (options[answer].length - maxWrong >= 4) strongCue += 1;

    const explanation = question.why || question.explanation || '';
    if (explanation.length < 25) shortExplanation += 1;

    const stem = question.q || question.question;
    if (seenStems.has(stem)) failures.push(`${label}: duplicate stem also used by ${seenStems.get(stem)}`);
    else seenStems.set(stem, label);
  }

  for (const [groupName, groupQuestions] of Object.entries(groups)) {
    const groupPositions = [0, 0, 0, 0];
    for (const question of groupQuestions) groupPositions[question.answer] += 1;
    const groupTotal = groupQuestions.length;
    for (const [position, count] of groupPositions.entries()) {
      if (groupTotal >= 8 && count / groupTotal > 0.4) {
        failures.push(`${name}/${groupName}: answer position ${position} is ${Math.round(count / groupTotal * 100)}% (max 40%)`);
      }
    }
  }

  const maxShare = Math.max(...positions) / total;
  if (maxShare > 0.4) failures.push(`${name}: overall answer position skew ${Math.round(maxShare * 100)}% (max 40%)`);
  if (strongCue > 0) failures.push(`${name}: ${strongCue} question(s) have a correct option at least 4 chars longer than every distractor`);
  if (shortExplanation > 0) failures.push(`${name}: ${shortExplanation} explanation(s) shorter than 25 characters`);

  console.log(
    `${name.padEnd(12)} n=${String(total).padEnd(3)} positions=${positions.join('/')} ` +
    `correct-longest=${Math.round(correctLongest / total * 100)}% strong-cue=${strongCue} short-why=${shortExplanation}`
  );
  if (correctLongest / total > 0.75) {
    warnings.push(`${name}: correct option is the longest in ${Math.round(correctLongest / total * 100)}% of questions (report only)`);
  }
}

const foundations = loadScript('content/foundations.js', 'COURSES', 'COURSES');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'content/manifest.json'), 'utf8'));
const training = loadScript('training/training-data.js', 'TRAINING_PLAN', 'TRAINING_PLAN');

const foundationQuestions = foundations.flatMap((course, chapter) =>
  course.quiz.map(question => ({ q: question.q, options: question.o, answer: question.a, why: question.why, chapter })));
const lessonQuestions = manifest.lessons.flatMap(lesson =>
  lesson.quiz.map(question => ({
    q: question.q,
    options: question.options,
    answer: question.answer,
    why: question.why,
    lesson: lesson.id,
  })));
const trainingQuestions = training.flatMap(day =>
  day.questions.map(question => ({
    q: question.q,
    options: question.o,
    answer: question.a,
    why: question.why,
    day: day.day,
  })));

if (foundationQuestions.length !== 144) failures.push(`foundations: expected 144 questions, got ${foundationQuestions.length}`);
if (lessonQuestions.length !== 45) failures.push(`lessons: expected 45 questions, got ${lessonQuestions.length}`);
if (trainingQuestions.length !== 64) failures.push(`training: expected 64 questions, got ${trainingQuestions.length}`);

const byChapter = Object.fromEntries(foundations.map((course, chapter) => [`ch${chapter}`, course.quiz.map(q => ({ ...q, options: q.o, answer: q.a, why: q.why }))]));
const byLesson = Object.fromEntries(manifest.lessons.map(lesson => [lesson.id, lesson.quiz.map(q => ({ ...q, answer: q.answer }))]));
const byDay = Object.fromEntries(training.map(day => [`d${day.day}`, day.questions.map(q => ({ ...q, options: q.o, answer: q.a, why: q.why }))]));

checkBank('foundations', foundationQuestions, { groups: byChapter });
checkBank('lessons', lessonQuestions, { groups: byLesson });
checkBank('training', trainingQuestions, { groups: byDay });

for (const warning of warnings) console.warn(`WARN  ${warning}`);
if (failures.length) {
  console.error('\nQuestion-bank quality gate failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('\nPASS: question banks have balanced answers, plausible lengths, unique stems and explanations.');
