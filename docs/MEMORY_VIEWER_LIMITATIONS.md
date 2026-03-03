# Memory Viewer / Visualizer 한계 및 현황 종합

> 메모리 뷰어 관련 제한사항, 알려진 버그, 언어별 지원 현황을 한 문서에 정리.
>
> **관련 원본 문서** (이 문서로 통합됨):
> - `packages/backend/prisma/content/c/C_LESSON_SCAN_PLAN.md` — C 시뮬레이터 지원 범위 & 레슨 스캔 결과
> - `docs/buglist.md` — 시각화 관련 버그 5건
> - `.claude/plans/wasm-hybrid-c-simulator.md` — 미래 아키텍처 계획

---

## 1. 아키텍처 전제

**"우리 시뮬레이터는 범용이 아니다"**

```
일반 gcc/node/python:   모든 코드 실행 가능
우리 시뮬레이터:        특정 패턴만 step-by-step 메모리 추적 가능
```

레슨 모드에서는 수제 JSON으로 시각화 데이터를 제공하고, 플레이그라운드 모드에서만 시뮬레이터가 동적으로 실행된다.

---

## 2. 언어별 메모리 뷰어 지원 현황

| 언어 | Memory View | Flow View | 비고 |
|------|:-----------:|:---------:|------|
| **C** | O | O | 가장 완성도 높음. 핸들러 10개 |
| **Java** | O | O | javaMemoryState 기반 |
| **JavaScript** | X | 부분 | memoryState 라우팅이 Java 핸들러로 빠짐 (Bug 3) |
| **Python** | X | 부분 | pythonMemoryState 빈 데이터 다수 (Bug 5) |

**코드 레벨 제한:**
- `LessonMemoryVisualizer.tsx` — Java, C만 지원. Python/JS memory는 null 반환
- `LessonFlowVisualizer.tsx` — `if (memoryState && !isJavaScript)` → JS 명시적 제외

---

## 3. C 시뮬레이터 지원 범위

### 핸들러 구조 (우선순위순)

```
packages/backend/src/modules/simulators/c/handlers/
├── malloc.handler (30)           - malloc/free
├── function-pointer.handler (27) - 함수 포인터
├── double-pointer.handler (26)   - 이중 포인터
├── pointer.handler (25)          - 포인터 역참조
├── struct.handler (22)           - 구조체
├── array.handler (20)            - 배열
├── bitwise.handler (18)          - 비트 연산
├── io.handler (15)               - printf/scanf
├── variable.handler (10)         - 변수 선언/대입
└── function.handler (5)          - 함수 호출
```

### 지원 O vs 미지원 X

| 지원됨 | 미지원/제한적 |
|--------|-------------|
| int, char, float, double, long | 파일 I/O (fopen/fread/fwrite) |
| 포인터 선언/역참조 | pthread (멀티스레드) |
| malloc/free (힙 할당) | 복잡한 매크로 (#define) |
| 배열 선언/접근 | VLA (가변 길이 배열) |
| 구조체 정의/멤버 접근 | 재귀 (깊이 제한) |
| 함수 호출/반환 | 표준 라이브러리 함수 대부분 |
| 비트 연산 | union |
| 이중 포인터 | 복잡한 캐스팅 |
| 함수 포인터 | 전처리기 동작 시뮬레이션 |
| printf (기본 포맷) | scanf (제한적) |

### 챕터별 시뮬레이터 호환성

| 챕터 | 내용 | 시뮬레이터 | 비고 |
|------|------|:----------:|------|
| Ch1-2 | 변수, 포인터 기초 | O | 기본 기능 |
| Ch3-5 | 배열, 함수, malloc | O | 핵심 메모리 |
| Ch6-8 | 구조체, 이중포인터, 함수포인터 | O | 고급 핸들러 |
| Ch9 | 전처리기/매크로 | X | 정적 시각화로 대체 |
| Ch10 | 파일 I/O | X | 정적 시각화로 대체 |

---

## 4. 알려진 버그 (시각화 관련)

### Bug 1: CRITICAL — C 레슨 c-5-1~c-5-6 Zod 검증 실패

**증상**: "Invalid lesson data from server" 에러로 레슨 로드 불가

**원인**: `MemoryBlockSchema`에서 `size: z.number()` 인데 JSON에 `"40MB"`, `"4 bytes"` 등 string 값

**경로**: `getLessonFull() → LessonFullSchema.safeParse() → FAIL`

**파일**:
- Schema: `packages/shared/src/schemas/course.ts` (MemoryBlockSchema)
- Data: `packages/backend/prisma/content/c/lessons/c-5-{1..6}.json`

---

### Bug 2: CRITICAL — 47/49 C 레슨: 시뮬레이터가 수제 JSON 덮어씀

**증상**: 풍부한 수제 시각화 데이터 대신 빈약한 시뮬레이터 결과 표시

**원인**: `useLessonSimulation.ts`의 `allStepsHaveViz` 체크에서 `visualizationType: "terminal"` step에 VIZ_FIELDS가 없으면 false → 시뮬레이터 호출 → 수제 데이터 덮어씀

**수정 옵션**:
1. terminal step에 `stack: []` 추가 (데이터 수정)
2. terminal step을 체크에서 제외 (코드 수정)

**파일**: `packages/frontend/src/features/courses/hooks/useLessonSimulation.ts` (lines 175-184)

---

### Bug 3: HIGH — 9 JS 레슨: memory 타입이 Java 핸들러로 라우팅

**영향**: js-5-1~5-3, js-7-1~7-3, js-9-1~9-3

**증상**: Flow 탭에 "No variables" 또는 빈 시각화

**원인 (2단계)**:
1. `useLessonVisualization.ts` — `resolvedStep.memoryState` 조건이 JS 레슨을 Java 핸들러로 보냄
2. `LessonFlowVisualizer.tsx` — `if (memoryState && !isJavaScript)` → JS는 memoryState enrichment 제외

**수정 옵션**:
1. JS memory 전용 핸들러 추가
2. `visualizationType: "jsMemory"` 도입
3. JS 네이티브 `stack[]` 포맷으로 데이터 변환

**파일**:
- `packages/frontend/src/features/courses/hooks/useLessonVisualization.ts` (line 185)
- `packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx` (line 96)

---

### Bug 4: MEDIUM — 3 JS 레슨: EventLoopView 빈 렌더링

**영향**: js-8-2 (2/3 steps), js-8-3 (3/3 steps), js-1-4 (2/7 steps)

**증상**: EventLoop 시각화 빈 패널

**원인**: `eventLoopState`에 `note`/`warning`만 있고 `callStack`/`webApis`/`taskQueue` 없음 → `hasStandardEventLoop = false` → 빈 div

**파일**: `packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx` (line 75)

---

### Bug 5: LOW — Python 레슨: 빈 pythonMemoryState

**전체 비어있음**: py-1-5 (5/5), py-1-8 (6/6)
**대부분 비어있음**: py-2-1, py-2-4, py-4-4, py-4-5, py-9-3, py-9-4

**증상**: Flow 탭 "no variables" 표시

**수정**: `names[]`/`objects[]` 채우거나 `visualizationType: "terminal"`로 변경

---

## 5. C 레슨 스캔 결과 (46개 전수조사)

| Phase | 대상 | 레슨 수 | 결과 |
|-------|------|---------|------|
| Phase 1 | Ch1-2 기초 | 10개 | 8 완벽, 2 수정 (c-2-5, c-2-6 stack 누락) |
| Phase 2 | Ch3-5 핵심 메모리 | 16개 | 14 완벽, 2 수정 (c-3-1, c-3-3 stack 누락) |
| Phase 3 | Ch6-8 고급 기능 | 12개 | 10 완벽, 2 수정 (c-7-3, c-8-4 stack/heap 누락) |
| Phase 4 | Ch9-10 한계 영역 | 8개 | 5 완벽, 3 수정 (c-9-2, c-10-2, c-10-4 변수 누락) |

**공통 패턴**: printf/출력 step에서 stack 배열을 비워두는 실수 → 변수가 함수 종료 전까지 stack에 남아있어야 함

---

## 6. 미래 계획: Wasm 하이브리드 시뮬레이터

**전략**: "컴파일은 Emscripten, 실행은 인터프리터"

```
C 코드 → Emscripten 검증 (emcc -fsyntax-only) → 통과 시 인터프리터 실행 → 메모리 스냅샷
```

**목표**:
- Emscripten으로 문법/의미 정확성 사전 검증
- 현재 인터프리터의 메모리 시각화 유지
- 함수 포인터, 이중 포인터 등 점진적 확장

**상태**: 계획 단계 (`.claude/plans/wasm-hybrid-c-simulator.md` 참고)
