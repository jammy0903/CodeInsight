/**
 * Full-Stack Fuzz Test Script
 * Tests all API endpoints with edge cases to find 500 errors, crashes, and unhandled cases.
 *
 * Usage: npx tsx scripts/fuzz-test.ts
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3002';
const API = `${BASE_URL}/api/v1`;
const TIMEOUT_MS = 15_000; // 15s per request
const SIM_TIMEOUT_MS = 30_000; // 30s for simulators (they can be slow)

// ─── Types ────────────────────────────────────────────────────────

interface TestResult {
  category: string;
  method: string;
  path: string;
  description: string;
  status: number | 'TIMEOUT' | 'ERROR';
  responseTime: number;
  pass: boolean;
  detail?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────

async function request(
  method: string,
  path: string,
  body?: unknown,
  timeoutMs = TIMEOUT_MS,
): Promise<{ status: number; body: unknown; time: number }> {
  const url = `${API}${path}`;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);
    const time = Date.now() - start;
    let resBody: unknown;
    try {
      resBody = await res.json();
    } catch {
      resBody = await res.text().catch(() => '');
    }
    return { status: res.status, body: resBody, time };
  } catch (err: unknown) {
    clearTimeout(timer);
    const time = Date.now() - start;
    if (err instanceof Error && err.name === 'AbortError') {
      return { status: -1, body: 'TIMEOUT', time };
    }
    return { status: -2, body: String(err), time };
  }
}

function expect(
  category: string,
  method: string,
  path: string,
  description: string,
  result: { status: number; body: unknown; time: number },
  expectedStatuses: number[],
): TestResult {
  const status = result.status === -1 ? 'TIMEOUT' as const : result.status === -2 ? 'ERROR' as const : result.status;
  const pass = typeof status === 'number' && expectedStatuses.includes(status);
  return {
    category,
    method,
    path,
    description,
    status,
    responseTime: result.time,
    pass,
    detail: !pass ? `Expected ${expectedStatuses.join('|')}, got ${status}${typeof result.body === 'string' ? `: ${result.body.slice(0, 100)}` : ''}` : undefined,
  };
}

// ─── Test Definitions ─────────────────────────────────────────────

async function phase1_publicGET(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const tests: Array<{ path: string; desc: string; expected: number[] }> = [
    // Courses
    { path: '/courses/languages', desc: 'Get all languages', expected: [200] },
    { path: '/courses/INVALID_LANG_ID_999', desc: 'Non-existent language ID', expected: [404, 400] },
    { path: '/courses/javascript/chapters', desc: 'JS chapters', expected: [200] },
    { path: '/courses/chapters/nonexistent-chapter-id', desc: 'Non-existent chapter', expected: [404] },
    { path: '/courses/lessons/nonexistent-lesson-id', desc: 'Non-existent lesson', expected: [404] },
    { path: '/courses/lessons/js-1-1', desc: 'Valid lesson (js-1-1)', expected: [200] },
    { path: '/courses/lessons/js-1-1?locale=en', desc: 'Lesson with locale param', expected: [200] },
    { path: '/courses/lessons/js-1-1?locale=xx', desc: 'Lesson with invalid locale', expected: [200, 400, 404] },

    // Problems
    { path: '/problems', desc: 'List all problems', expected: [200] },
    { path: '/problems/nonexistent-id', desc: 'Non-existent problem (bad UUID)', expected: [400, 404] },
    { path: '/problems/0', desc: 'Problem ID 0', expected: [404, 400] },
    { path: '/problems/-1', desc: 'Negative problem ID', expected: [404, 400] },

    // Nickname checks
    { path: '/users/check-nickname/a', desc: 'Too short nickname (1 char)', expected: [200, 400] },
    { path: '/users/check-nickname/!!@@##', desc: 'Special chars nickname', expected: [200, 400] },
    { path: '/users/check-nickname/' + 'a'.repeat(200), desc: 'Very long nickname (200 chars)', expected: [200, 400, 404, 414] },
    { path: '/users/check-nickname/validnickname', desc: 'Normal nickname', expected: [200] },
    { path: '/users/check-nickname/%00%00', desc: 'Null bytes in nickname', expected: [200, 400] },

    // Edge case paths
    { path: '/courses/../../etc/passwd', desc: 'Path traversal attempt', expected: [400, 404] },
    { path: '/courses/' + 'x'.repeat(1000), desc: 'Very long path segment', expected: [400, 404] },
  ];

  for (const t of tests) {
    const res = await request('GET', t.path);
    results.push(expect('Public GET', 'GET', t.path, t.desc, res, t.expected));
  }

  return results;
}

async function phase1_authRequired(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  const endpoints: Array<{ method: string; path: string; desc: string; body?: unknown }> = [
    // All should return 401 without auth token
    { method: 'GET', path: '/courses/progress', desc: 'Course progress (no auth)' },
    { method: 'POST', path: '/courses/progress', desc: 'Update progress (no auth)', body: {} },
    { method: 'GET', path: '/analytics/summary', desc: 'Analytics summary (no auth)' },
    { method: 'POST', path: '/analytics/activity', desc: 'Log activity (no auth)', body: {} },
    { method: 'GET', path: '/notes', desc: 'List notes (no auth)' },
    { method: 'POST', path: '/notes', desc: 'Create note (no auth)', body: {} },
    { method: 'GET', path: '/gamification/streak', desc: 'Streak (no auth)' },
    { method: 'GET', path: '/users/me', desc: 'Current user (no auth)' },
    { method: 'GET', path: '/users/me/role', desc: 'User role (no auth)' },
    // Note: Fastify validates body schema before preHandler, so {} fails validation with 400 before auth runs
    { method: 'POST', path: '/reports', desc: 'Submit report (no auth)', body: { type: 'lesson', category: 'test' } },
    { method: 'GET', path: '/standalone-quizzes/chapters?language=javascript', desc: 'Quiz chapters (no auth)' },
    { method: 'GET', path: '/standalone-quizzes?language=javascript', desc: 'Quiz list (no auth)' },
    { method: 'GET', path: '/submissions/me', desc: 'My submissions (no auth)' },
    { method: 'GET', path: '/submissions/me/solved', desc: 'Solved problems (no auth)' },
    // Note: same Fastify schema-before-auth behavior — send valid-looking body to test auth
    { method: 'POST', path: '/submissions', desc: 'Create submission (no auth)', body: { problemId: 'test', code: 'x', language: 'c', result: 'pass' } },

    // Admin endpoints
    { method: 'GET', path: '/admin/stats', desc: 'Admin stats (no auth)' },
    { method: 'GET', path: '/admin/users', desc: 'Admin users (no auth)' },
    { method: 'GET', path: '/admin/submissions', desc: 'Admin submissions (no auth)' },
    { method: 'GET', path: '/admin/system', desc: 'Admin system (no auth)' },
    { method: 'GET', path: '/admin/reports', desc: 'Admin reports (no auth)' },
  ];

  for (const ep of endpoints) {
    const res = await request(ep.method, ep.path, ep.body);
    results.push(expect('Auth Required', ep.method, ep.path, ep.desc, res, [401, 403]));
  }

  return results;
}

async function phase1_simulatorFuzz(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const simulators = ['c', 'python', 'javascript', 'java', 'cpp'];

  for (const lang of simulators) {
    const path = `/simulators/${lang}/simulate`;

    // Empty body
    {
      const res = await request('POST', path, {}, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: empty body {}`, res, [400, 422]));
    }

    // Missing code field
    {
      const res = await request('POST', path, { notCode: 'hello' }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: missing code field`, res, [400, 422]));
    }

    // Wrong type for code (Fastify coerces number→string by default, so 200 is acceptable)
    {
      const res = await request('POST', path, { code: 12345 }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: code as number`, res, [200, 400, 422]));
    }

    // Empty string code
    {
      const res = await request('POST', path, { code: '' }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: empty string code`, res, [200, 400, 422]));
    }

    // Syntax error code
    {
      const res = await request('POST', path, { code: '}{)(][' }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: syntax error code`, res, [200, 400, 422]));
    }

    // Null code
    {
      const res = await request('POST', path, { code: null }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: null code`, res, [400, 422]));
    }

    // Array instead of string
    {
      const res = await request('POST', path, { code: [1, 2, 3] }, SIM_TIMEOUT_MS);
      results.push(expect('Simulator Fuzz', 'POST', path, `${lang}: code as array`, res, [400, 422]));
    }
  }

  return results;
}

async function phase3_simulatorStress(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // Language-specific dangerous code patterns
  const patterns: Record<string, Array<{ desc: string; code: string }>> = {
    c: [
      { desc: 'infinite loop', code: '#include <stdio.h>\nint main() { while(1){} return 0; }' },
      { desc: 'stack overflow', code: '#include <stdio.h>\nvoid f() { f(); }\nint main() { f(); return 0; }' },
      { desc: 'huge array', code: '#include <stdio.h>\nint main() { int a[100000000]; a[0]=1; return 0; }' },
      { desc: 'fork bomb attempt', code: '#include <unistd.h>\nint main() { while(1) fork(); return 0; }' },
      { desc: 'system command injection', code: '#include <stdlib.h>\nint main() { system("echo pwned"); return 0; }' },
      { desc: 'null pointer', code: '#include <stdio.h>\nint main() { int *p = 0; *p = 42; return 0; }' },
    ],
    python: [
      { desc: 'infinite loop', code: 'while True: pass' },
      { desc: 'stack overflow', code: 'def f(): f()\nf()' },
      { desc: 'memory bomb', code: 'x = "a" * (10**9)' },
      { desc: 'os command injection', code: 'import os; os.system("echo pwned")' },
      { desc: 'file read attempt', code: 'print(open("/etc/passwd").read())' },
      { desc: 'exec injection', code: 'exec("import os; os.system(\'echo pwned\')")' },
    ],
    javascript: [
      { desc: 'infinite loop', code: 'while(true){}' },
      { desc: 'stack overflow', code: 'function f(){f()}; f()' },
      { desc: 'memory bomb', code: 'let a=[]; while(true) a.push(new Array(1000000))' },
      { desc: 'process.exit', code: 'process.exit(0)' },
      { desc: 'require attempt', code: 'const fs = require("fs"); console.log(fs.readFileSync("/etc/passwd","utf8"))' },
      { desc: 'eval injection', code: 'eval("process.exit(1)")' },
    ],
    java: [
      { desc: 'infinite loop', code: 'public class Main { public static void main(String[] args) { while(true){} } }' },
      { desc: 'stack overflow', code: 'public class Main { static void f() { f(); } public static void main(String[] args) { f(); } }' },
      { desc: 'runtime exec', code: 'public class Main { public static void main(String[] args) throws Exception { Runtime.getRuntime().exec("echo pwned"); } }' },
      { desc: 'huge allocation', code: 'public class Main { public static void main(String[] args) { int[] a = new int[Integer.MAX_VALUE]; } }' },
    ],
    cpp: [
      { desc: 'infinite loop', code: '#include <iostream>\nint main() { while(true){} return 0; }' },
      { desc: 'stack overflow', code: '#include <iostream>\nvoid f() { f(); }\nint main() { f(); return 0; }' },
      { desc: 'system call', code: '#include <cstdlib>\nint main() { system("echo pwned"); return 0; }' },
      { desc: 'null deref', code: '#include <iostream>\nint main() { int *p = nullptr; *p = 42; return 0; }' },
    ],
  };

  // Very large code (10KB)
  const hugeCode = '// ' + 'x'.repeat(10240) + '\nint main() { return 0; }';

  for (const [lang, cases] of Object.entries(patterns)) {
    const path = `/simulators/${lang}/simulate`;

    for (const tc of cases) {
      const res = await request('POST', path, { code: tc.code }, SIM_TIMEOUT_MS);
      // Should NOT be 500; 200 with error info, 400, or 408 timeout are all acceptable
      const isAcceptable = (typeof res.status === 'number' && res.status !== 500) || res.status === -1;
      results.push({
        category: 'Simulator Stress',
        method: 'POST',
        path,
        description: `${lang}: ${tc.desc}`,
        status: res.status === -1 ? 'TIMEOUT' : res.status === -2 ? 'ERROR' : res.status,
        responseTime: res.time,
        pass: isAcceptable,
        detail: !isAcceptable ? `Got ${res.status} (expected safe handling)` : undefined,
      });
    }

    // 10KB code
    {
      const res = await request('POST', path, { code: hugeCode }, SIM_TIMEOUT_MS);
      const isAcceptable = typeof res.status === 'number' && res.status !== 500;
      results.push({
        category: 'Simulator Stress',
        method: 'POST',
        path,
        description: `${lang}: 10KB code payload`,
        status: res.status === -1 ? 'TIMEOUT' : res.status === -2 ? 'ERROR' : res.status,
        responseTime: res.time,
        pass: isAcceptable,
        detail: !isAcceptable ? `Got ${res.status}` : undefined,
      });
    }
  }

  return results;
}

async function phase1_wrongTypes(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // POST endpoints that should validate input types
  const tests: Array<{
    path: string;
    desc: string;
    body: unknown;
    expected: number[];
  }> = [
    // Analytics activity end (public)
    { path: '/analytics/activity/end', desc: 'Activity end with empty body', body: {}, expected: [400, 422] },
    { path: '/analytics/activity/end', desc: 'Activity end with wrong types', body: { activityId: 123, action: true }, expected: [400, 422] },

    // C trace endpoint
    { path: '/simulators/c/trace', desc: 'C trace empty body', body: {}, expected: [400, 422] },
    { path: '/simulators/c/trace', desc: 'C trace wrong type', body: { code: 12345 }, expected: [400, 422] },

    // C judge endpoint (optionalAuth)
    { path: '/simulators/c/judge', desc: 'C judge empty body', body: {}, expected: [400, 422] },
    { path: '/simulators/c/judge', desc: 'C judge wrong types', body: { code: 123, testCases: 'not-array' }, expected: [400, 422] },
  ];

  for (const t of tests) {
    const res = await request('POST', t.path, t.body, SIM_TIMEOUT_MS);
    results.push(expect('Wrong Types', 'POST', t.path, t.desc, res, t.expected));
  }

  return results;
}

// ─── Reporting ────────────────────────────────────────────────────

function printResults(results: TestResult[]): void {
  console.log('\n' + '='.repeat(120));
  console.log('  FUZZ TEST RESULTS');
  console.log('='.repeat(120));

  // Group by category
  const categories = new Map<string, TestResult[]>();
  for (const r of results) {
    const list = categories.get(r.category) || [];
    list.push(r);
    categories.set(r.category, list);
  }

  let totalPass = 0;
  let totalFail = 0;

  for (const [cat, items] of categories) {
    const passed = items.filter(r => r.pass).length;
    const failed = items.filter(r => !r.pass).length;
    totalPass += passed;
    totalFail += failed;

    console.log(`\n--- ${cat} (${passed}/${items.length} passed) ---`);
    console.log(
      '  ' +
      'Status'.padEnd(10) +
      'Time'.padEnd(10) +
      'Method'.padEnd(7) +
      'Path'.padEnd(50) +
      'Description'
    );
    console.log('  ' + '-'.repeat(110));

    for (const r of items) {
      const icon = r.pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
      const statusStr = String(r.status).padEnd(6);
      const timeStr = `${r.responseTime}ms`.padEnd(10);
      const pathTrunc = r.path.length > 48 ? r.path.slice(0, 45) + '...' : r.path;
      console.log(
        `  ${icon} ${statusStr} ${timeStr}${r.method.padEnd(7)}${pathTrunc.padEnd(50)}${r.description}`
      );
      if (r.detail) {
        console.log(`       \x1b[33m${r.detail}\x1b[0m`);
      }
    }
  }

  console.log('\n' + '='.repeat(120));
  console.log(`  TOTAL: ${totalPass + totalFail} tests | \x1b[32m${totalPass} passed\x1b[0m | \x1b[31m${totalFail} failed\x1b[0m`);

  if (totalFail > 0) {
    console.log('\n  FAILURES:');
    for (const [, items] of categories) {
      for (const r of items) {
        if (!r.pass) {
          console.log(`  \x1b[31m- ${r.method} ${r.path}: ${r.description}\x1b[0m`);
          if (r.detail) console.log(`    ${r.detail}`);
        }
      }
    }
  }

  console.log('='.repeat(120) + '\n');
}

// ─── Main ─────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`\nFuzz Test Target: ${API}`);
  console.log('Checking server connectivity...');

  // Health check
  try {
    const healthRes = await fetch(`${BASE_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!healthRes.ok) {
      console.error(`Server health check failed: ${healthRes.status}`);
      process.exit(1);
    }
    console.log('Server is up!\n');
  } catch {
    console.error(`Cannot connect to ${BASE_URL}. Is the dev server running? (pnpm dev)`);
    process.exit(1);
  }

  const allResults: TestResult[] = [];

  // Phase 1: Public GET endpoints
  console.log('Phase 1a: Testing public GET endpoints...');
  allResults.push(...await phase1_publicGET());

  // Phase 1: Auth-required endpoints (no token)
  console.log('Phase 1b: Testing auth-required endpoints without token...');
  allResults.push(...await phase1_authRequired());

  // Phase 1: Wrong types / validation
  console.log('Phase 1c: Testing input validation (wrong types)...');
  allResults.push(...await phase1_wrongTypes());

  // Phase 1: Simulator basic fuzz
  console.log('Phase 1d: Testing simulator endpoints with fuzz inputs...');
  allResults.push(...await phase1_simulatorFuzz());

  // Phase 3: Simulator stress tests
  console.log('Phase 3: Running simulator stress tests (dangerous code patterns)...');
  allResults.push(...await phase3_simulatorStress());

  // Print results
  printResults(allResults);

  const failCount = allResults.filter(r => !r.pass).length;
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
