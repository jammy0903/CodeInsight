#!/usr/bin/env node

/**
 * Full lesson locale translator (ko base -> en/zh locale files)
 *
 * Translates selected lesson text fields:
 * - lesson: title, description, concept, keyTakeaway
 * - quiz: question, options[], explanation
 * - misconceptions[]: wrong, correct, why
 * - steps[]: title, explanation, keyInsight, analogy, misconception, tip
 *
 * Keeps structural/code fields untouched (lessonId, code, stdout, etc.).
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

function request(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve(body));
    }).on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('request timeout')));
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
      if (attempt < retries) await sleep(500 * attempt);
    }
  }
  throw lastError;
}

async function mapWithConcurrency(items, mapper, concurrency = 6) {
  const result = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const idx = cursor;
      cursor += 1;
      result[idx] = await mapper(items[idx], idx);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length || 1) }, () => worker()));
  return result;
}

function getByPath(obj, pathArr) {
  let cur = obj;
  for (const key of pathArr) {
    if (cur == null) return undefined;
    cur = cur[key];
  }
  return cur;
}

function setByPath(obj, pathArr, value) {
  let cur = obj;
  for (let i = 0; i < pathArr.length - 1; i += 1) {
    const key = pathArr[i];
    if (cur[key] == null || typeof cur[key] !== 'object') {
      cur[key] = typeof pathArr[i + 1] === 'number' ? [] : {};
    }
    cur = cur[key];
  }
  cur[pathArr[pathArr.length - 1]] = value;
}

function addStringField(entries, obj, pathArr) {
  const val = getByPath(obj, pathArr);
  if (typeof val === 'string' && val.trim() !== '') {
    entries.push({ path: pathArr, text: val });
  }
}

function collectTranslatableEntries(baseLesson) {
  const entries = [];

  // Lesson-level fields
  for (const key of ['title', 'description', 'concept', 'keyTakeaway']) {
    addStringField(entries, baseLesson, [key]);
  }

  // Quiz
  addStringField(entries, baseLesson, ['quiz', 'question']);
  addStringField(entries, baseLesson, ['quiz', 'explanation']);
  const options = getByPath(baseLesson, ['quiz', 'options']);
  if (Array.isArray(options)) {
    for (let i = 0; i < options.length; i += 1) {
      addStringField(entries, baseLesson, ['quiz', 'options', i]);
    }
  }

  // Misconceptions
  const misconceptions = getByPath(baseLesson, ['misconceptions']);
  if (Array.isArray(misconceptions)) {
    for (let i = 0; i < misconceptions.length; i += 1) {
      for (const key of ['wrong', 'correct', 'why']) {
        addStringField(entries, baseLesson, ['misconceptions', i, key]);
      }
    }
  }

  // Content steps
  const steps = getByPath(baseLesson, ['content', 'steps']);
  if (Array.isArray(steps)) {
    for (let i = 0; i < steps.length; i += 1) {
      for (const key of ['title', 'explanation', 'keyInsight', 'analogy', 'misconception', 'tip']) {
        addStringField(entries, baseLesson, ['content', 'steps', i, key]);
      }
    }
  }

  return entries;
}

function textHasHangul(value) {
  return HANGUL_RE.test(String(value || ''));
}

function countHangulInEntries(lessonObj, entries) {
  let count = 0;
  for (const entry of entries) {
    const val = getByPath(lessonObj, entry.path);
    if (typeof val === 'string' && textHasHangul(val)) {
      count += 1;
    }
  }
  return count;
}

async function main() {
  const summary = {
    scannedLessons: 0,
    processedLessons: 0,
    createdMissing: 0,
    recreatedInvalid: 0,
    filesUpdated: 0,
    translatedStrings: 0,
    targetBreakdown: {},
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
      const baseLesson = baseParsed.data;
      const entries = collectTranslatableEntries(baseLesson);
      if (entries.length === 0) continue;
      summary.processedLessons += 1;

      const lessonId = baseFile.replace(/\.json$/, '');
      for (const target of TARGETS) {
        const localePath = path.join(lessonsDir, `${lessonId}.${target}.json`);
        const exists = fs.existsSync(localePath);
        const parsed = exists ? readJsonSafe(localePath) : null;

        let localeData;
        if (!exists) {
          localeData = JSON.parse(JSON.stringify(baseLesson));
          summary.createdMissing += 1;
        } else if (!parsed.ok) {
          localeData = JSON.parse(JSON.stringify(baseLesson));
          summary.recreatedInvalid += 1;
        } else {
          localeData = parsed.data;
        }

        try {
          const translatedValues = await mapWithConcurrency(
            entries,
            (entry) => translateTextWithRetry(entry.text, target),
            6
          );

          for (let i = 0; i < entries.length; i += 1) {
            setByPath(localeData, entries[i].path, translatedValues[i]);
          }

          fs.writeFileSync(localePath, `${JSON.stringify(localeData, null, 2)}\n`, 'utf8');
          summary.filesUpdated += 1;
          summary.translatedStrings += entries.length;
          summary.targetBreakdown[target] = (summary.targetBreakdown[target] || 0) + 1;

          if (summary.filesUpdated % 20 === 0) {
            console.error(`[progress] updated files ${summary.filesUpdated}`);
          }
        } catch (error) {
          summary.errors.push(`Translate failed: ${localePath} :: ${String(error.message || error)}`);
        }
      }
    }
  }

  // Post-check: remaining hangul in translated fields
  const remaining = { en: 0, zh: 0 };
  for (const langDir of langDirs) {
    const lessonsDir = path.join(ROOT, langDir, 'lessons');
    if (!fs.existsSync(lessonsDir)) continue;
    const baseFiles = fs
      .readdirSync(lessonsDir)
      .filter((name) => name.endsWith('.json') && !/\.[a-z]{2}\.json$/.test(name));
    for (const baseFile of baseFiles) {
      const baseParsed = readJsonSafe(path.join(lessonsDir, baseFile));
      if (!baseParsed.ok) continue;
      const entries = collectTranslatableEntries(baseParsed.data);
      if (entries.length === 0) continue;
      const lessonId = baseFile.replace(/\.json$/, '');
      for (const target of TARGETS) {
        const localePath = path.join(lessonsDir, `${lessonId}.${target}.json`);
        const localeParsed = readJsonSafe(localePath);
        if (!localeParsed.ok) continue;
        remaining[target] += countHangulInEntries(localeParsed.data, entries);
      }
    }
  }
  summary.remainingHangulInTargetFields = remaining;

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

