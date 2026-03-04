#!/usr/bin/env node

/**
 * Translate lesson quiz text from base lesson JSON into locale files (.en/.zh).
 *
 * Scope:
 * - packages/backend/prisma/content/<language>/lessons/*.json
 * - quiz.question / quiz.options[] / quiz.explanation only
 * - preserves non-text quiz fields (e.g. correctIndex, answer)
 *
 * Behavior:
 * - If locale file is missing or invalid JSON, recreate from base lesson JSON.
 * - If locale quiz text still contains Korean, overwrite quiz text with translation.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..', 'packages', 'backend', 'prisma', 'content');
const TARGETS = ['en', 'zh'];
const HANGUL_RE = /[\uac00-\ud7a3]/;
const cache = new Map();

function readJsonSafe(filePath) {
  try {
    return { ok: true, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error: String(error.message) };
  }
}

function hasHangul(value) {
  return HANGUL_RE.test(String(value || ''));
}

function quizContainsHangul(quiz) {
  if (!quiz) return false;
  const text = [
    quiz.question,
    ...(Array.isArray(quiz.options) ? quiz.options : []),
    quiz.explanation,
  ].join('\n');
  return hasHangul(text);
}

function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    }).on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('request timeout'));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function translateText(text, target) {
  if (typeof text !== 'string' || text.trim() === '') return text || '';
  const key = `${target}::${text}`;
  if (cache.has(key)) return cache.get(key);

  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko' +
    `&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
  const raw = await request(url);
  const parsed = JSON.parse(raw);
  const result = (parsed?.[0] || [])
    .map((part) => Array.isArray(part) ? part[0] : '')
    .join('')
    .trim();
  cache.set(key, result || text);
  return result || text;
}

async function translateTextWithRetry(text, target, retries = 3) {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      return await translateText(text, target);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(500 * attempt);
      }
    }
  }
  throw lastError;
}

async function translateQuiz(baseQuiz, target) {
  const nextQuiz = { ...baseQuiz };
  nextQuiz.question = await translateTextWithRetry(baseQuiz.question || '', target);
  if (Array.isArray(baseQuiz.options)) {
    const translated = [];
    for (const option of baseQuiz.options) {
      translated.push(await translateTextWithRetry(String(option), target));
    }
    nextQuiz.options = translated;
  }
  if (typeof baseQuiz.explanation === 'string') {
    nextQuiz.explanation = await translateTextWithRetry(baseQuiz.explanation, target);
  }
  return nextQuiz;
}

async function main() {
  const summary = {
    scannedLessons: 0,
    withQuiz: 0,
    updated: 0,
    recreatedInvalid: 0,
    createdMissing: 0,
    skippedAlreadyLocalized: 0,
    errors: [],
  };

  const langDirs = fs.readdirSync(ROOT);
  for (const langDir of langDirs) {
    const lessonsDir = path.join(ROOT, langDir, 'lessons');
    if (!fs.existsSync(lessonsDir)) continue;

    const baseFiles = fs
      .readdirSync(lessonsDir)
      .filter((name) => name.endsWith('.json') && !/\.[a-z]{2}\.json$/.test(name));

    for (const baseFile of baseFiles) {
      summary.scannedLessons += 1;
      const basePath = path.join(lessonsDir, baseFile);
      const baseParsed = readJsonSafe(basePath);
      if (!baseParsed.ok) {
        summary.errors.push(`Base parse failed: ${basePath} :: ${baseParsed.error}`);
        continue;
      }
      const base = baseParsed.data;
      if (!base.quiz) continue;
      summary.withQuiz += 1;

      const lessonId = baseFile.replace(/\.json$/, '');

      for (const target of TARGETS) {
        const localePath = path.join(lessonsDir, `${lessonId}.${target}.json`);
        const localeExists = fs.existsSync(localePath);
        const localeParsed = localeExists ? readJsonSafe(localePath) : null;

        let localeData;
        let needsUpdate = false;

        if (!localeExists) {
          localeData = JSON.parse(JSON.stringify(base));
          needsUpdate = true;
          summary.createdMissing += 1;
        } else if (!localeParsed.ok) {
          localeData = JSON.parse(JSON.stringify(base));
          needsUpdate = true;
          summary.recreatedInvalid += 1;
        } else {
          localeData = localeParsed.data;
          if (!localeData.quiz || quizContainsHangul(localeData.quiz)) {
            needsUpdate = true;
          }
        }

        if (!needsUpdate) {
          summary.skippedAlreadyLocalized += 1;
          continue;
        }

        try {
          localeData.quiz = await translateQuiz(base.quiz, target);
          fs.writeFileSync(localePath, `${JSON.stringify(localeData, null, 2)}\n`, 'utf8');
          summary.updated += 1;
          if (summary.updated % 25 === 0) {
            console.error(`[progress] updated ${summary.updated}`);
          }
        } catch (error) {
          summary.errors.push(`Translate failed: ${localePath} :: ${String(error.message || error)}`);
        }
      }
    }
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
