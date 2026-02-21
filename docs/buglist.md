# Lesson Test Buglist (2026-02-10)

## Test Scope
- C: 49 lessons (c-1-1 ~ c-10-4)
- Python: 44 lessons (py-1-1 ~ py-10-4, excluding py-3-5/py-3-6 terminal-only)
- JavaScript: 34 lessons (js-1-1 ~ js-9-3)
- Java: SKIPPED

---

## Summary

| # | Severity | Affected | Description |
|---|----------|----------|-------------|
| 1 | CRITICAL | 6 C lessons | Zod validation failure: `heap[].size` is string, schema expects number |
| 2 | CRITICAL | 47/49 C lessons | Simulator overrides handcrafted JSON visualization data |
| 3 | HIGH | 9 JS lessons | `visualizationType: "memory"` routes through wrong handler |
| 4 | MEDIUM | 3 JS lessons | Sparse `eventLoopState` — EventLoopView renders empty |
| 5 | LOW | 2+8 Python lessons | Empty `pythonMemoryState` (all steps or majority of steps) |

---

## Bug 1: CRITICAL — C lessons c-5-1~c-5-6 fail to load (Zod validation)

**Affected**: c-5-1, c-5-2, c-5-3, c-5-4, c-5-5, c-5-6

**Symptom**: Lesson page shows error "Invalid lesson data from server". User cannot view any content.

**Root Cause**: `MemoryBlockSchema` in `packages/shared/src/schemas/course.ts` defines `size: z.number().optional()`, but these lesson JSONs have string values like `"40MB"`, `"4 bytes"`, `"20 bytes"` in `heap[].size`.

**Validation flow**:
```
getLessonFull() → api.get() → resolveStepLines() → LessonFullSchema.safeParse() → FAIL
                                                     └── MemoryBlockSchema.size: z.number() ← "40MB" (string)
```

**Fix options**:
1. Change schema: `size: z.union([z.number(), z.string()]).optional()`
2. Change JSON data: Convert string sizes to numbers (remove units)
3. Add `.transform()` to coerce string→number in the schema

**Files**:
- Schema: `packages/shared/src/schemas/course.ts` (MemoryBlockSchema, ~line 144)
- Service: `packages/frontend/src/services/courses.ts` (getLessonFull, line 174)
- Data: `packages/backend/prisma/content/c/lessons/c-5-{1..6}.json`

---

## Bug 2: CRITICAL — 47/49 C lessons: Simulator replaces handcrafted JSON data

**Affected**: All C lessons except c-1-2 and c-4-5

**Symptom**: Memory/Flow visualization shows minimal or empty content instead of the rich handcrafted data authored in JSON. Step count may differ (simulator typically returns fewer steps). Explanations partially preserved via merge, but memory state data comes from simulator (sparse/empty).

**Root Cause**: `useLessonSimulation.ts` lines 175-184:
```typescript
const VIZ_FIELDS = ['stack', 'memoryState', 'pythonMemoryState', 'javaMemoryState',
  'scopeState', 'eventLoopState', 'promiseState', 'thisState', 'prototypeState', 'callStackState'];
const allStepsHaveViz = lesson.content.steps.every((s: any) =>
  VIZ_FIELDS.some(f => s[f] != null)
);
```

47/49 C lessons contain `visualizationType: "terminal"` steps (printf output steps) that have **no VIZ_FIELDS** — only `stdout` and `explanation`. One missing step makes `allStepsHaveViz = false`, triggering the C simulator which replaces ALL steps.

**Chain of events**:
```
Terminal step lacks stack/heap
  → allStepsHaveViz = false
  → C simulator API called (/simulators/c/trace)
  → Simulator returns fewer steps + no memory visualization
  → mergeSteps() tries to match by line number (partial match)
  → Rich handcrafted JSON data LOST
```

**Fix options** (pick one):
1. **Best**: Add `stack: []` to all terminal-type steps in C lesson JSONs (script fix)
2. **Alternative**: Modify `allStepsHaveViz` check to skip terminal steps:
   ```typescript
   const allStepsHaveViz = lesson.content.steps.every((s: any) =>
     s.visualizationType === 'terminal' || VIZ_FIELDS.some(f => s[f] != null)
   );
   ```
3. **Alternative**: Add `'visualizationType'` to VIZ_FIELDS list (any step with an explicit vizType is pre-authored)

**Files**:
- Hook: `packages/frontend/src/features/courses/hooks/useLessonSimulation.ts` (lines 175-184)
- Data: All C lesson JSONs under `packages/backend/prisma/content/c/lessons/`

---

## Bug 3: HIGH — 9 JS lessons: `visualizationType: "memory"` Flow viewer shows empty/wrong

**Affected**: js-5-1, js-5-2, js-5-3, js-7-1, js-7-2, js-7-3, js-9-1, js-9-2, js-9-3

**Symptom**: Flow tab shows "No variables" or empty visualization. These lessons are about Objects/Arrays (ch5), Garbage Collection/V8 Memory (ch7), and WeakMap/WeakSet (ch9) — all using a `memoryState` data format that the renderer doesn't handle for JavaScript.

**Root Cause**: Two-stage routing failure:

**Stage 1** — `useLessonVisualization.ts` line 185:
```typescript
if (vizType === 'java' || vizType === 'javaMemory' || resolvedStep.javaMemoryState || resolvedStep.memoryState)
```
The `resolvedStep.memoryState` condition catches JS lessons with `memoryState`, routing them through the **Java handler**. Returns `visualizationType: 'java'` for a JavaScript lesson.

**Stage 2** — `LessonFlowVisualizer.tsx` line 96:
```typescript
if (memoryState && !isJavaScript) {
  enriched.stack = memoryState.stack;
  enriched.heap = memoryState.heap;
}
```
JavaScript is explicitly excluded from memoryState enrichment. The JS transformer then receives a step without proper stack/heap data → produces empty FlowStep → ReferenceGraphView renders empty.

**Fix options**:
1. Add JS `"memory"` handler before the Java handler in `useLessonVisualization.ts`
2. Support a dedicated `visualizationType: "jsMemory"` or `"v8Memory"` with its own component
3. Convert these lessons to use `stack[]` with `methodName + variables` format (JS-native format)

**Files**:
- Hook: `packages/frontend/src/features/courses/hooks/useLessonVisualization.ts` (line 185)
- Visualizer: `packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx` (line 96)
- Data: `packages/backend/prisma/content/javascript/lessons/js-{5-1,5-2,5-3,7-1,7-2,7-3,9-1,9-2,9-3}.json`

---

## Bug 4: MEDIUM — 3 JS lessons: EventLoopView renders empty for sparse eventLoopState

**Affected**: js-8-2 (2/3 steps), js-8-3 (3/3 steps), js-1-4 (2/7 steps)

**Symptom**: EventLoop visualization shows blank panel on affected steps. The eventLoopState data exists but contains only `note` or `warning` strings — no `callStack`, `webApis`, `taskQueue`, or `microtaskQueue` arrays.

**Root Cause**: `LessonFlowVisualizer.tsx` line 75:
```typescript
const hasStandardEventLoop = els && (els.callStack || els.webApis || els.taskQueue || els.microtaskQueue);
```
Steps with `eventLoopState: { note: "..." }` or `{ warning: "..." }` fail this check → `hasStandardEventLoop = false` → falls through to memory visualization route → `flowStepWithAnimations = null` → renders empty `<div>`.

Meanwhile, `allStepsHaveViz` in `useLessonSimulation` PASSES (because `eventLoopState != null`), so the simulator is correctly skipped. The issue is purely in rendering.

**Fix options**:
1. **Content fix**: Populate proper eventLoop structure in JSON (callStack, webApis, etc.)
2. **Code fix**: Show a note/warning banner when eventLoopState has only note/warning:
   ```typescript
   if (els && !hasStandardEventLoop && (els.note || els.warning)) {
     return <EventLoopNoteView note={els.note} warning={els.warning} />;
   }
   ```

**Files**:
- Visualizer: `packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx` (line 75)
- Data: `packages/backend/prisma/content/javascript/lessons/js-{1-4,8-2,8-3}.json`

---

## Bug 5: LOW — Python lessons with empty pythonMemoryState

**Affected (all steps empty)**:
- py-1-5 (5/5 steps), py-1-8 (6/6 steps) — likely should be `visualizationType: "terminal"` instead

**Affected (majority empty)**:
- py-2-1 (4/5), py-2-4 (11/22), py-4-4 (4/8), py-4-5 (5/10), py-9-3 (8/18), py-9-4 (5/17)

**Symptom**: Flow tab shows empty Python memory visualization ("no variables") for steps where `pythonMemoryState` exists but `names[]` and `objects[]` are both empty arrays.

**Note**: 22 additional lessons have 1-3 empty steps each, which are likely intentional (first step before any variables are created). Only the lessons listed above have a problematic ratio of empty steps.

**Fix**: Populate `names[]` and `objects[]` for steps that should show variable state, or change `visualizationType` to `"terminal"` for explanation-only steps.

**Files**:
- Data: `packages/backend/prisma/content/python/lessons/` (listed files above)

---

## Test Methodology

### Phase 1: Crash/Load Test
- Navigated to each lesson URL via Chrome DevTools automation
- Verified: page loads without crash, steps can be navigated (prev/next)
- Checked for console errors, "Something went wrong" messages

### Phase 2: Deep Visualization Test
- For each lesson, examined:
  - Flow tab: Is visualization content rendered? Does it match the step's data?
  - Memory tab: Are stack/heap variables displayed correctly?
  - Terminal output: Is stdout shown for terminal-type steps?
  - Code highlighting: Does the highlighted line match `step.line`?
- Cross-referenced JSON data with rendered output
- Verified visualization pipeline routing (useLessonVisualization → LessonFlowVisualizer)

### Phase 3: Root Cause Analysis
- Traced data flow from JSON → API → Zod validation → hooks → components
- Identified schema mismatches, routing logic errors, and content gaps
- Verified each bug with code-level evidence

### Tools Used
- `mcp__chrome-devtools` for browser automation
- Direct JSON file inspection for content verification
- Node.js scripts for batch validation across all lesson files
