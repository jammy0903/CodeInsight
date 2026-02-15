#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function findJson(dir) {
  const r = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) r.push(...findJson(f));
    else if (e.name.endsWith('.json')) r.push(f);
  }
  return r;
}

function stripBold(text) {
  if (!text || typeof text !== 'string') return text;
  // **text** → text (markdown bold only; lone ** like **pp won't match)
  return text.replace(/\*\*([^*]+)\*\*/g, '$1');
}

const contentDir = path.join(__dirname, '..', 'content');
const files = findJson(contentDir);
let changes = 0, fileCount = 0;

for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  let changed = false;

  // Lesson-embedded quiz
  if (data.quiz) {
    for (const k of ['question', 'explanation']) {
      if (data.quiz[k] && data.quiz[k].includes('**')) {
        const updated = stripBold(data.quiz[k]);
        if (updated !== data.quiz[k]) {
          data.quiz[k] = updated;
          changed = true;
          changes++;
        }
      }
    }
  }

  // Standalone quizzes
  if (Array.isArray(data.quizzes)) {
    for (const q of data.quizzes) {
      for (const k of ['question', 'explanation']) {
        if (q[k] && q[k].includes('**')) {
          const updated = stripBold(q[k]);
          if (updated !== q[k]) {
            q[k] = updated;
            changed = true;
            changes++;
          }
        }
      }
    }
  }

  if (changed) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    fileCount++;
    console.log('Fixed:', path.relative(contentDir, file));
  }
}

console.log('\nTotal: ' + changes + ' fields in ' + fileCount + ' files');
