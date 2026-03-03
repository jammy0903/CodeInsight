# Memory Viewer / Visualizer 한계 및 현황 종합

> 메모리 뷰어 관련 제한사항, 언어별 지원 현황, 해결된 버그 이력을 한 문서에 정리.
>
> **최종 업데이트**: 2026-03-04

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
| **JavaScript** | O | O | memoryState 기반 (Bug 3 수정 완료) |
| **Python** | X | O | pythonMemoryState 기반 (Bug 5 수정 완료) |

**코드 레벨 참고:**
- `LessonMemoryVisualizer.tsx` — Java, C만 Memory View 탭 지원. Python/JS는 Flow View로 시각화
- `LessonFlowVisualizer.tsx` — 모든 언어의 memoryState enrichment 지원

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

## 4. Java 시각화 현황

### 레슨 규모

45개 레슨, 10개 챕터. 모든 레슨 `deltaFormat: true` 사용.

| Ch | 주제 | 레슨 수 |
|----|------|---------|
| 1 | String/Integer 비교 | 8 |
| 2 | Null 처리 | 4 |
| 3 | Pass by value/reference | 4 |
| 4 | String 불변성 | 4 |
| 5 | final 키워드 | 4 |
| 6 | 예외 처리 | 5 |
| 7 | Generics | 4 |
| 8 | Collections (ArrayList, HashMap) | 4 |
| 9 | GC, JVM 구조 | 4 |
| 10 | Threading, 동기화 | 4 |

### 시각화 타입별 스텝 수

| 타입 | 스텝 수 | 설명 |
|------|---------|------|
| `javaMemory` | 249 | Java 전용 메모리 뷰 |
| `memory` | 17 | 범용 메모리 뷰 (fallback) |

### 시각화 구성 요소

**1. Stack-Heap 다이어그램** (핵심)
- **Stack**: 함수 프레임, 변수명/타입/값, 참조 화살표 (`→ 0x001`)
- **Heap**: 메모리 주소, 객체 타입/내용
- **인터랙션**: 참조 변수 hover → 힙 객체 하이라이트 (파란색 glow)
- **변경 표시**: 수정된 변수/객체 노란색 배경
- **타입 컬러코딩**: 노랑(primitive), 초록(String), 주황(배열), 분홍(객체), 회색(null)

**2. Integer Cache 시각화** (5개 레슨)
- -128~127 캐시 범위 시각적 표시
- 현재 참조 값 하이라이트, 참조 카운트 표시

**3. HashSet Bucket 시각화** (2개 레슨)
- 내부 버킷 구조, 버킷 인덱스/내용
- 검색/활성 버킷 초록색 하이라이트

**4. 배너/메타 정보**

| 배너 | 색상 | 용도 | 스텝 수 |
|------|------|------|---------|
| comparison | 파랑 | 주소 비교 (`0x001 != 0x002`) | 8 |
| warning | 주황 | 위험 패턴 안내 | 46 |
| note | 하늘 | 추가 설명 | — |
| output | — | `System.out.println()` 결과 | 129 |

### javaMemoryState 데이터 구조

```json
{
  "stack": [{ "name": "str", "value": "→ 0x001", "type": "String", "isFinal": false }],
  "heap": [{ "address": "0x001", "content": "String(hello)", "type": "String", "new": true }],
  "cache": { "name": "Integer Cache", "range": "-128 ~ 127", "highlight": 127, "refCount": 2 },
  "hashSet": { "buckets": [{ "index": "bucket[3]", "content": "Person[Alice]", "searched": true }] },
  "comparison": "0x001 == 0x001",
  "warning": "캐시 범위 내라서 true, 하지만 이에 의존하면 안 됨!",
  "output": ["hello", "world"]
}
```

### 렌더링 파이프라인

```
useLessonVisualization.ts (javaMemoryState 파싱)
  → LessonFlowVisualizer.tsx (ReferenceGraphView + 배너 렌더링)
  → LessonMemoryVisualizer.tsx (Memory View 탭 — JavaMemoryView)
```

### 지원 O vs 미지원 X

| 지원됨 | 미지원 |
|--------|--------|
| Stack 변수 (primitive, 참조) | static/클래스 레벨 변수 |
| Heap 객체 (String, 배열, 사용자 정의) | GC 시각화 (마킹, 수거 이벤트) |
| 참조 화살표 + hover 하이라이트 | JVM 내부 영역 (PermGen, MetaSpace) |
| 타입별 컬러코딩 | 스레드 상태 시각화 |
| 변경 하이라이트 | WeakReference/SoftReference |
| Integer Cache 시각화 | 메서드 호출 애니메이션 |
| HashSet Bucket 시각화 | volatile 변수 마커 |
| 복수 스택 프레임 | 커스텀 toString() 표현 |

---

## 5. 해결된 버그 이력 (전체)

> 5건 모두 RESOLVED (2026-03-03 기준)

| Bug | 심각도 | 내용 | 수정 방법 |
|-----|--------|------|-----------|
| 1 | CRITICAL | C 레슨 c-5-1~c-5-6 Zod 검증 실패 (`heap[].size` 타입) | schema를 `z.union([z.number(), z.string()])` 으로 변경 |
| 2 | CRITICAL | 47/49 C 레슨: 시뮬레이터가 수제 JSON 덮어씀 | `allStepsHaveViz`에서 terminal step 제외 |
| 3 | HIGH | 9 JS 레슨: memory 타입 시각화 안됨 | 일반 memoryState 핸들러 분리 + `!isJavaScript` 조건 제거 |
| 4 | MEDIUM | 3 JS 레슨: EventLoopView 빈 렌더링 | `hasEventLoopNoteOnly` 분기 추가 |
| 5 | LOW | Python 30개 레슨 60 step: 빈 pythonMemoryState | 이전 step의 `names[]`/`objects[]` propagate |

---

## 6. C 레슨 스캔 결과 (46개 전수조사)

| Phase | 대상 | 레슨 수 | 결과 |
|-------|------|---------|------|
| Phase 1 | Ch1-2 기초 | 10개 | 8 완벽, 2 수정 (c-2-5, c-2-6 stack 누락) |
| Phase 2 | Ch3-5 핵심 메모리 | 16개 | 14 완벽, 2 수정 (c-3-1, c-3-3 stack 누락) |
| Phase 3 | Ch6-8 고급 기능 | 12개 | 10 완벽, 2 수정 (c-7-3, c-8-4 stack/heap 누락) |
| Phase 4 | Ch9-10 한계 영역 | 8개 | 5 완벽, 3 수정 (c-9-2, c-10-2, c-10-4 변수 누락) |

**공통 패턴**: printf/출력 step에서 stack 배열을 비워두는 실수 → 변수가 함수 종료 전까지 stack에 남아있어야 함

---

## 7. 미래 계획: Wasm 하이브리드 시뮬레이터

**전략**: "컴파일은 Emscripten, 실행은 인터프리터"

```
C 코드 → Emscripten 검증 (emcc -fsyntax-only) → 통과 시 인터프리터 실행 → 메모리 스냅샷
```

**목표**:
- Emscripten으로 문법/의미 정확성 사전 검증
- 현재 인터프리터의 메모리 시각화 유지
- 함수 포인터, 이중 포인터 등 점진적 확장

**상태**: 계획 단계
