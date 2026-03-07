#!/usr/bin/env node
/*
 Runtime trace for lesson simulation usage.
 - Starts backend/frontend dev servers
 - Discovers lesson routes from backend API
 - Visits each lesson page with Playwright
 - Records whether simulator endpoints were called

 Usage:
   node scripts/trace-lesson-runtime.cjs
   node scripts/trace-lesson-runtime.cjs --limit=50
   node scripts/trace-lesson-runtime.cjs --start=200 --limit=100
   node scripts/trace-lesson-runtime.cjs --no-servers
*/

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'tmp');
const NOW = new Date().toISOString().replace(/[:.]/g, '-');
const OUT_JSON = path.join(OUT_DIR, `lesson-runtime-trace-${NOW}.json`);
const OUT_CSV = path.join(OUT_DIR, `lesson-runtime-trace-${NOW}.csv`);

const FRONTEND_URL = 'http://localhost:5174';
const BACKEND_URL = 'http://localhost:3002';
const API_BASE = `${BACKEND_URL}/api/v1`;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? 'true'];
  })
);

const startAt = Number(args.start || 0);
const limit = Number(args.limit || 0);
const noServers = args['no-servers'] === 'true';
const headful = args.headful === 'true';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 120000) {
  const start = Date.now();
  let lastErr = null;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return;
      lastErr = new Error(`HTTP ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for ${url}: ${lastErr?.message || 'unknown error'}`);
}

function startProc(name, cmd, cmdArgs) {
  const p = spawn(cmd, cmdArgs, {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  p.stdout.on('data', (d) => {
    process.stdout.write(`[${name}] ${d.toString()}`);
  });
  p.stderr.on('data', (d) => {
    process.stderr.write(`[${name}] ${d.toString()}`);
  });

  p.on('exit', (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return p;
}

function stopProc(p) {
  if (!p || p.killed) return;
  p.kill('SIGTERM');
}

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    throw new Error(`GET ${url} failed: ${r.status}`);
  }
  return r.json();
}

async function discoverLessonRoutes() {
  const languages = await getJson(`${API_BASE}/courses/languages`);
  const routes = [];

  for (const lang of languages) {
    const langId = lang.id || lang.languageId || lang.code;
    if (!langId) continue;

    const langPayload = await getJson(`${API_BASE}/courses/${langId}`);
    const chapters = Array.isArray(langPayload?.chapters) ? langPayload.chapters : [];

    for (const ch of chapters) {
      const chapterId = ch.id || ch.chapterId;
      const lessons = Array.isArray(ch.lessons) ? ch.lessons : [];

      for (const ls of lessons) {
        const lessonId = ls.id || ls.lessonId;
        if (!chapterId || !lessonId) continue;
        routes.push({
          lang: langId,
          chapterId,
          lessonId,
          url: `${FRONTEND_URL}/courses/${langId}/${chapterId}/${lessonId}`,
        });
      }
    }
  }

  return routes;
}

function toCsv(rows) {
  const cols = [
    'index',
    'lang',
    'chapterId',
    'lessonId',
    'simulatorUsed',
    'simulatorEndpoints',
    'status',
    'error',
    'durationMs',
    'url',
  ];
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.join(',')];
  for (const r of rows) {
    lines.push(cols.map((c) => esc(r[c])).join(','));
  }
  return lines.join('\n') + '\n';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let backendProc = null;
  let frontendProc = null;

  try {
    if (!noServers) {
      backendProc = startProc('backend', 'pnpm', ['--filter', '@codeinsight/backend', 'dev']);
      await waitForHttp(`${BACKEND_URL}/health`, 180000);

      frontendProc = startProc('frontend', 'pnpm', ['--filter', '@codeinsight/frontend', 'dev']);
      await waitForHttp(FRONTEND_URL, 180000);
    } else {
      await waitForHttp(`${BACKEND_URL}/health`, 5000);
      await waitForHttp(FRONTEND_URL, 5000);
    }

    const allRoutes = await discoverLessonRoutes();
    const sliced = limit > 0 ? allRoutes.slice(startAt, startAt + limit) : allRoutes.slice(startAt);

    console.log(`Discovered lessons: ${allRoutes.length}`);
    console.log(`Tracing range: start=${startAt}, count=${sliced.length}`);

    const browser = await chromium.launch({ headless: !headful });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(45000);

    const rows = [];

    for (let i = 0; i < sliced.length; i++) {
      const item = sliced[i];
      const absoluteIndex = startAt + i;
      const t0 = Date.now();

      const simEndpoints = new Set();
      const reqListener = (req) => {
        const u = req.url();
        if (u.includes('/api/v1/simulators/')) {
          try {
            const p = new URL(u).pathname;
            simEndpoints.add(p.replace('/api/v1', ''));
          } catch {
            simEndpoints.add(u);
          }
        }
      };
      page.on('request', reqListener);

      let status = 'ok';
      let errMsg = '';

      try {
        await page.goto(item.url, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(700);
      } catch (e) {
        status = 'nav_error';
        errMsg = e?.message || String(e);
      }

      page.off('request', reqListener);

      rows.push({
        index: absoluteIndex,
        lang: item.lang,
        chapterId: item.chapterId,
        lessonId: item.lessonId,
        simulatorUsed: simEndpoints.size > 0,
        simulatorEndpoints: Array.from(simEndpoints).sort().join('|'),
        status,
        error: errMsg,
        durationMs: Date.now() - t0,
        url: item.url,
      });

      if ((i + 1) % 20 === 0 || i === sliced.length - 1) {
        const tmpPayload = {
          meta: {
            generatedAt: new Date().toISOString(),
            totalDiscovered: allRoutes.length,
            traced: i + 1,
            startAt,
            limit,
            frontendUrl: FRONTEND_URL,
            backendUrl: BACKEND_URL,
          },
          rows,
        };
        fs.writeFileSync(OUT_JSON, JSON.stringify(tmpPayload, null, 2));
        fs.writeFileSync(OUT_CSV, toCsv(rows));
        console.log(`Progress ${i + 1}/${sliced.length}`);
      }
    }

    await browser.close();

    const simulatorUsedCount = rows.filter((r) => r.simulatorUsed).length;
    const navErrors = rows.filter((r) => r.status !== 'ok').length;

    console.log('--- Summary ---');
    console.log(`Traced: ${rows.length}`);
    console.log(`Simulator used: ${simulatorUsedCount}`);
    console.log(`Navigation errors: ${navErrors}`);
    console.log(`JSON: ${OUT_JSON}`);
    console.log(`CSV: ${OUT_CSV}`);
  } finally {
    stopProc(frontendProc);
    stopProc(backendProc);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
