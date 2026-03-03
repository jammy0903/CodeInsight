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

### Bug 1: ~~CRITICAL~~ RESOLVED — C 레슨 c-5-1~c-5-6 Zod 검증 실패

**수정 완료**: schema를 `size: z.union([z.number(), z.string()]).optional()`로 변경하여 해결.

---

### Bug 2: ~~CRITICAL~~ RESOLVED — 47/49 C 레슨: 시뮬레이터가 수제 JSON 덮어씀

**수정 완료**: `allStepsHaveViz` 체크에서 `visualizationType === 'terminal'` step 제외 처리.

---

### Bug 3: ~~HIGH~~ RESOLVED — 9 JS 레슨: memory 타입 시각화 안됨

**수정 완료 (2026-03-03)**:
1. `useLessonVisualization.ts` — 일반 memoryState 전용 핸들러 추가 (Java 핸들러와 분리)
2. `LessonFlowVisualizer.tsx` — JS에서 memoryState enrichment 제외하던 `!isJavaScript` 조건 제거

---

### Bug 4: ~~MEDIUM~~ RESOLVED — 3 JS 레슨: EventLoopView 빈 렌더링

**수정 완료**: `hasEventLoopNoteOnly` 분기 추가하여 note/warning 텍스트를 렌더링.

---

### Bug 5: ~~LOW~~ RESOLVED — Python 레슨: 빈 pythonMemoryState

**수정 완료 (2026-03-03)**: print/output step에서 이전 변수 상태가 누락되던 문제.
30개 파일 60개 step에 이전 step의 `names[]`/`objects[]`를 propagate하여 해결.
남은 빈 step 3개는 변수가 아직 없는 최초 step이므로 정상.

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
