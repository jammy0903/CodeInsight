/**
 * 홈 화면 데모용 시뮬레이터 응답 녹화
 *
 * WHY: 홈 첫 화면은 백엔드 콜드 스타트를 기다리지 않고 바로 재생돼야 한다.
 *      실제 시뮬레이터 응답을 녹화해 번들에 넣고, 프론트에서는 같은 변환 함수로 재생한다.
 *
 * 실행 (백엔드가 떠 있어야 함):
 *   node scripts/record-home-demo.mjs [API_BASE]
 *   기본 API_BASE: http://localhost:3002/api/v1
 */

import { writeFile } from 'node:fs/promises';

const API_BASE = process.argv[2] ?? 'http://localhost:3002/api/v1';
const OUTPUT = new URL('../src/features/home/demo/recordings.json', import.meta.url);

// Python: Playground와 같은 경로 (시뮬레이터 응답 → toPythonLessonSteps)
const PYTHON_CODE = `a = [1, 2]
b = a
b.append(3)
c = a[:]
c.append(4)
print(a, b, c)`;

// JavaScript: 레슨과 같은 경로 (사전 제작된 이벤트 루프 레슨 JSON)
// WHY: 시뮬레이터는 동기 구간만 추적해 microtask/task 실행 순서가 녹화되지 않는다.
const JS_LESSON_ID = 'js-1-4';

async function request(path, init) {
  const res = await fetch(`${API_BASE}${path}`, init);
  if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
  return res.json();
}

const py = await request('/simulators/python/simulate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: PYTHON_CODE }),
});
if (!py.success || !Array.isArray(py.steps) || py.steps.length === 0) {
  throw new Error(`python simulation failed: ${JSON.stringify(py.error ?? py).slice(0, 200)}`);
}
console.log(`✅ python: ${py.steps.length} steps`);

const lesson = await request(`/courses/lessons/${JS_LESSON_ID}`);
if (!lesson.content?.code || !Array.isArray(lesson.content.steps)) {
  throw new Error(`${JS_LESSON_ID} has no content`);
}
console.log(`✅ javascript (${JS_LESSON_ID}): ${lesson.content.steps.length} steps`);

const recordings = {
  python: { code: PYTHON_CODE, steps: py.steps },
  javascript: { lessonId: JS_LESSON_ID, code: lesson.content.code, steps: lesson.content.steps },
};

await writeFile(OUTPUT, JSON.stringify(recordings, null, 2) + '\n');
console.log(`📝 ${OUTPUT.pathname}`);
