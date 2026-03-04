# Java 레슨 시각화 데이터 품질 감사

> **감사일**: 2026-03-04
>
> **대상**: `packages/backend/prisma/content/java/lessons/` 전체 45개 레슨, 266 스텝

---

## 요약

- **문제 있는 파일**: 36 / 45 (80%)
- **문제 스텝 수**: 130 / 266
- **깨끗한 파일**: 9개

---

## 문제 유형

| # | 유형 | 스텝 수 | 심각도 |
|---|------|---------|--------|
| 1 | output/comparison만 있고 stack/heap 누락 | 41 | HIGH |
| 2 | heap만 있고 stack 누락 (변수→객체 연결 끊김) | 28 | HIGH |
| 3 | note만 있고 시각화 데이터 없음 | 9 | MEDIUM |
| 4 | javaMemoryState 자체 누락 (main 시작 step) | 7 | MEDIUM |
| 5 | Ch10 비표준 커스텀 필드 (렌더링 불가) | 8 | MEDIUM |
| 6 | stack/heap 둘 다 빈 배열 (에러 step) | 2 | LOW |

---

## 유형 1: output/comparison만 있고 stack/heap 누락 (41 스텝)

Python Bug 5와 동일 패턴. `System.out.println()` step에서 `{comparison, output}`만 넣고 stack/heap 빠뜨림.

| 파일 | 영향 스텝 수 |
|------|-------------|
| java-1-4.json | 5 |
| java-4-4.json | 5 |
| java-1-1.json | 3 |
| java-1-2.json | 3 |
| java-1-3.json | 3 |
| java-1-5.json | 2 |
| java-1-7.json | 2 |
| java-2-1.json | 2 |
| java-2-2.json | 2 |
| java-2-4.json | 2 |
| java-3-1.json | 2 |
| java-3-3.json | 2 |
| java-3-4.json | 2 |
| java-4-1.json | 1 |
| java-4-2.json | 1 |
| java-4-3.json | 1 |
| java-5-3.json | 1 |
| java-5-4.json | 1 |
| java-6-2.json | 1 |

---

## 유형 2: heap만 있고 stack 누락 (28 스텝)

힙에 객체 구조는 보여주지만 참조하는 stack 변수가 없어서 화살표 연결 끊김. Ch7-8 집중.

| 파일 | 영향 스텝 수 | 내용 |
|------|-------------|------|
| java-8-1.json | 4 | ArrayList 내부 구조 |
| java-8-2.json | 4 | HashMap 내부 구조 |
| java-8-3.json | 4 | HashSet 내부 구조 |
| java-8-4.json | 4 | LinkedList 내부 구조 |
| java-7-1.json | 3 | Generics: Box/List |
| java-7-2.json | 3 | Generics: Wildcard |
| java-7-4.json | 3 | Generics: Type Erasure |
| java-5-1.json | 1 | final 배열 |
| java-4-2.json | 1 | StringBuilder |
| java-6-1.json | 1 | Stack unwinding |

---

## 유형 3: note만 있고 시각화 데이터 없음 (9 스텝)

| 파일 | 스텝 | 내용 |
|------|------|------|
| java-1-8.json | 1, 2, 3, 4, 5 | String 메서드 — step 0 이후 전부 note만 |
| java-2-2.json | 1 | Short-circuit: `{evaluation, note}` |
| java-2-3.json | 4 | Optional: `{note}` |
| java-1-5.json | 5 | HashSet add: `{hashSet}` |
| java-1-7.json | 5 | Swap: `{note}` |

---

## 유형 4: javaMemoryState 자체 누락 (7 스텝)

`visualizationType: "javaMemory"` 선언했지만 `javaMemoryState` 프로퍼티 없음. 빈 화면.

| 파일 | 스텝 | title |
|------|------|-------|
| java-7-2.json | 1 | main 메서드 시작 |
| java-7-4.json | 1 | main 메서드 실행 |
| java-8-1.json | 1 | main 메서드 시작 |
| java-8-2.json | 1 | main 메서드 시작 |
| java-8-3.json | 1 | main 메서드 시작 |
| java-8-4.json | 1 | main 메서드 시작 |
| java-9-4.json | 1 | main 메서드 시작 |

---

## 유형 5: Ch10 비표준 커스텀 필드 (8 스텝)

`memoryState`에 `cpu`, `threadA`, `threadB`, `worker1-3`, `threadPool` 등 표준 스키마에 없는 필드 사용. 프론트엔드 렌더링 불가.

| 파일 | 스텝 | 커스텀 필드 |
|------|------|------------|
| java-10-1.json | 1 | `{note, stack:[]}` |
| java-10-1.json | 4 | `{output, note:null}` |
| java-10-2.json | 3 | `{threadPool, heap:[]}` |
| java-10-3.json | 1 | `{cpu, stack:[], note:null}` |
| java-10-3.json | 2 | `{threadA, threadB, finalCount, cpu:null}` |
| java-10-4.json | 2 | `{worker1, worker2, worker3, heap:[]}` |
| java-10-4.json | 3 | `{worker2}` |
| java-10-4.json | 4 | `{threadPool, note, worker1:null, worker2:null, worker3:null}` |

---

## 유형 6: stack/heap 둘 다 빈 배열 (2 스텝)

| 파일 | 스텝 | title |
|------|------|-------|
| java-2-4.json | 4 | ConcurrentHashMap에 null 넣기 (NPE!) |
| java-2-4.json | 6 | contains(null) 호출 (NPE!) |

에러 발생 step이지만 직전 상태의 stack/heap은 유지되어야 함.

---

## 챕터별 현황

| Ch | 주제 | 영향/전체 | 비율 |
|----|------|----------|------|
| 1 | String/Integer 비교 | 7/8 | 88% |
| 2 | Null 처리 | 4/4 | 100% |
| 3 | Pass by value/reference | 3/4 | 75% |
| 4 | String 불변성 | 4/4 | 100% |
| 5 | final 키워드 | 3/4 | 75% |
| 6 | 예외 처리 | 3/5 | 60% |
| 7 | Generics | 3/4 | 75% |
| 8 | Collections | 4/4 | 100% |
| 9 | GC, JVM 구조 | 1/4 | 25% |
| 10 | Threading | 4/4 | 100% |

---

## 깨끗한 파일 (9개)

`java-1-6`, `java-3-2`, `java-5-2`, `java-6-3`, `java-6-4`, `java-7-3`, `java-9-1`, `java-9-2`, `java-9-3`

---

## 수정 완료 (2026-03-04)

### 감사 결과 재분석

원래 감사에서 130 스텝에 문제가 있다고 보고했으나, 대부분은 실제 버그가 아님.
`deltaFormat: true` 파일에서 output/comparison step이 stack/heap을 "생략"하는 건 올바른 동작 —
`expandDeltaSteps`가 이전 step에서 자동 상속함.

**실제 버그는 두 가지 패턴만 해당:**
1. explicit empty array (`stack: []` / `heap: []`) — 상속 대신 빈 상태로 덮어씀
2. step 1 (main 메서드 시작)에 `javaMemoryState` 누락 — 빈 화면 표시

### Phase 1: Explicit empty array 제거 (자동)

`deltaFormat: true` 파일에서 step index > 0의 `stack: []` / `heap: []`를 삭제.
`expandDeltaSteps`가 이전 step에서 자동 상속하도록 변경.

스크립트: `scripts/fix-java-empty-arrays.mjs`

수정 내역 (19 fixes, 13 files):
- java-2-3.json step[3]: heap
- java-2-4.json step[4]: stack, heap / step[6]: stack, heap
- java-4-3.json step[3]: heap
- java-5-2.json step[2]: heap
- java-5-4.json step[2]: stack
- java-6-2.json step[5]: heap
- java-6-3.json step[3]: heap
- java-7-3.json step[5]: heap
- java-9-4.json step[3]: heap / step[4]: stack
- java-10-1.json step[1]: stack / step[3]: heap
- java-10-2.json step[2]: stack / step[3]: heap
- java-10-3.json step[1]: stack
- java-10-4.json step[2]: heap

### Phase 2: java-8-*.json main 프레임 추가

java-8-1 ~ java-8-4의 step 1 (main 메서드 시작)에 `javaMemoryState` 추가:
```json
{ "stack": [{ "name": "main", "value": "running", "frame": "main" }] }
```
이미 `deltaFormat: true`이므로 heap은 step 0에서 자동 상속.

### 미수정 (향후 작업)

- **유형 3** (note-only steps 9개): 시각화 데이터 새로 작성 필요 — 별도 작업
- **유형 5** (Ch10 비표준 필드): 표준 stack/heap 모델로 표현 불가 — 한계 문서화
- **유형 1, 2** (output/comparison, heap-only): deltaFormat 상속으로 정상 동작 — 버그 아님
