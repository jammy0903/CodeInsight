#!/usr/bin/env node
/**
 * Add \n after every sentence-ending period in step explanations.
 * Excludes: code spans (`...`), numbered lists (1. ), decimals (3.14), ellipsis (...)
 *
 * Usage: node add-newlines.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const contentDir = path.join(__dirname, '..', 'content');

function findJsonFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findJsonFiles(fullPath));
    } else if (entry.name.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function addNewlinesAfterPeriods(text) {
  if (!text || typeof text !== 'string') return text;

  let result = '';
  let inCode = false;  // inside `...`
  let i = 0;

  while (i < text.length) {
    const ch = text[i];

    // Toggle backtick code span
    if (ch === '`') {
      inCode = !inCode;
      result += ch;
      i++;
      continue;
    }

    // Inside code span — copy as-is
    if (inCode) {
      result += ch;
      i++;
      continue;
    }

    // Period detection
    if (ch === '.') {
      const next = text[i + 1];

      // Already followed by \n — leave it
      if (next === '\n') {
        result += ch;
        i++;
        continue;
      }

      // Not followed by a space — not a sentence boundary
      if (next !== ' ') {
        result += ch;
        i++;
        continue;
      }

      // ". " found — check exclusions

      // 1. Ellipsis: preceded by another period
      if (i > 0 && text[i - 1] === '.') {
        result += ch;
        i++;
        continue;
      }

      // 2. Ellipsis: ". ." pattern (next char after space is period)
      if (i + 2 < text.length && text[i + 2] === '.') {
        result += ch;
        i++;
        continue;
      }

      // 3. Decimal / version: preceded by digit (e.g., 3.14)
      if (i > 0 && /\d/.test(text[i - 1])) {
        result += ch;
        i++;
        continue;
      }

      // 4. Numbered list: \n + digits + .  (e.g., "\n1. ")
      let j = i - 1;
      while (j >= 0 && /\d/.test(text[j])) j--;
      if (j >= 0 && text[j] === '\n') {
        result += ch;
        i++;
        continue;
      }
      // Also handle start of string: "1. "
      if (j < 0 && i > 0) {
        result += ch;
        i++;
        continue;
      }

      // Replace ". " → ".\n"
      result += '.\n';
      i += 2; // skip period and space
      continue;
    }

    result += ch;
    i++;
  }

  return result;
}

// Helper: apply transform to a string field, return true if changed
function transformField(obj, key) {
  if (!obj[key] || typeof obj[key] !== 'string') return false;
  const updated = addNewlinesAfterPeriods(obj[key]);
  if (updated === obj[key]) return false;
  obj[key] = updated;
  return true;
}

// Main
const files = findJsonFiles(contentDir);
let totalChanges = 0;
let filesChanged = 0;
const changedFiles = [];

for (const file of files) {
  const raw = fs.readFileSync(file, 'utf-8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    continue;
  }

  let fileChanged = false;

  // 1) Lesson files: steps + quiz
  if (file.includes('/lessons/') && data.content && data.content.steps) {
    for (const step of data.content.steps) {
      if (transformField(step, 'explanation')) {
        fileChanged = true;
        totalChanges++;
      }
    }
    // Lesson-embedded quiz
    if (data.quiz) {
      if (transformField(data.quiz, 'explanation')) {
        fileChanged = true;
        totalChanges++;
      }
      if (transformField(data.quiz, 'question')) {
        fileChanged = true;
        totalChanges++;
      }
    }
    // misconceptions
    if (Array.isArray(data.misconceptions)) {
      for (const m of data.misconceptions) {
        for (const k of ['wrong', 'correct', 'why']) {
          if (transformField(m, k)) {
            fileChanged = true;
            totalChanges++;
          }
        }
      }
    }
  }

  // 2) Standalone quiz files (quizzes/ directory)
  if (file.includes('/quizzes/') && Array.isArray(data.quizzes)) {
    for (const q of data.quizzes) {
      if (transformField(q, 'explanation')) {
        fileChanged = true;
        totalChanges++;
      }
      if (transformField(q, 'question')) {
        fileChanged = true;
        totalChanges++;
      }
    }
  }

  if (fileChanged) {
    if (!DRY_RUN) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    }
    filesChanged++;
    changedFiles.push(path.relative(contentDir, file));
  }
}

console.log(`\n=== Summary ===`);
console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'APPLIED'}`);
console.log(`Files changed: ${filesChanged}`);
console.log(`Fields changed: ${totalChanges}`);
if (changedFiles.length > 0) {
  console.log(`\nChanged files:`);
  changedFiles.forEach(f => console.log(`  ${f}`));
}
