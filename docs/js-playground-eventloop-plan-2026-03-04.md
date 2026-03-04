# JavaScript Playground 개념 탭(5종) 단계적 완성 계획 (2026-03-04)

## 1) 목표
- Playground JavaScript에서 `Flow(메모리/참조)` 외 개념 탭을 단계적으로 제공한다.
- 대상 개념: `Event Loop`, `Scope`, `This`, `Prototype`, `Promise`.
- “완벽 작동” 기준(실행 순서/상태 정확도)을 만족하는 범위까지 구현한다.
- 정확도와 유지보수를 위해 고확실성부터 순차 확장한다.

## 2) 코드베이스 현황 (실측)
- Event Loop 전용 프론트 컴포넌트는 이미 존재:
  - `packages/frontend/src/features/visualizers/javascript/components/EventLoopView.tsx`
- Flow 라우터도 Event Loop 분기 지원:
  - `packages/frontend/src/features/visualizers/LessonFlowVisualizer.tsx`
  - 분기 조건: `visualizationType === 'eventLoop'` 또는 `eventLoopState` 존재
- 백엔드 JS inspector 경로는 현재 `stack/heap` 중심 스냅샷만 생성:
  - `packages/backend/src/modules/simulators/javascript/javascript-simulation.service.ts`
  - `packages/backend/src/modules/simulators/javascript/engine/inspector-snapshot-builder.ts`
- 프론트 JS simulator는 개념 상태(`eventLoopState/scopeState/thisState/prototypeState/promiseState`)를 step으로 전달하지 않음:
  - `packages/frontend/src/services/simulator/jsSimulator.ts`

## 3) 커리큘럼/레슨 커버리지 점검 결과

### 3.1 레슨 데이터 집계 (기본 JSON 기준)
- 대상: `packages/backend/prisma/content/javascript/lessons/*.json` (locale 제외)
- 레슨 파일 수: `35`
- 총 step 수: `231`
- `visualizationType` 분포:
  - `memory`: 58
  - `scope`: 46
  - `eventLoop`: 43
  - `jsMemory`: 29
  - `thisBinding`: 23
  - `prototype`: 21
  - `promise`: 11

### 3.2 “가르치는 모든 JS 개념” 대비 상태
- 커리큘럼 장(챕터) 기준 개념군:
  - Basics, Runtime/Event Loop, Scope/Closure, This Binding, Async Patterns, Memory/Immutability, Prototype/Class, V8 Internal, Rendering Perf, Metaprogramming
- 결론:
  - **Lesson 모드 기준**: 주요 개념 뷰(`eventLoop/scope/thisBinding/prototype/promise/jsMemory`)는 이미 데이터/컴포넌트 경로가 존재.
  - **Playground 모드 기준**: 동적 실행 경로는 아직 `stack/heap` 중심이라 5개 개념 탭 자동화는 미완료.
  - 따라서 “한 번에 5개 완성”보다, 정확도 높은 순서로 단계 확장하는 것이 맞다.

### 3.3 개념별 실현 가능성(코드 기반)
- `Event Loop`: 높음
  - inspector 이벤트 + 런타임 훅으로 queue 상태 추적 가능
- `Scope`: 높음
  - `callFrame.scopeChain` + 변수 수집으로 `ScopeView` 입력 생성 가능
- `This`: 중간
  - 호출 문맥/strict/bind 정보 추론 규칙 필요
- `Prototype`: 중간
  - 체인 자체는 가능, `lookupPath/foundAt` 정확도는 훅 없으면 저하 가능
- `Promise`: 중간~낮음
  - 상태/핸들러/큐를 정확히 맞추려면 런타임 훅 의존도 높음

## 4) 아키텍처 계획

### Phase A. 계약(Contract) 확장 (공통 기반)
1. 백엔드 JS snapshot 타입에 개념 상태 필드 optional 추가
   - `eventLoopState`
   - `scopeState`
   - `thisState`
   - `prototypeState`
   - `promiseState`
2. 프론트 JS step 파서에도 동일 필드 전달

목표:
- 기존 `stack/heap` 경로와 충돌 없이 개념 상태를 병행 전달

### Phase B. 백엔드 트래킹 계층 추가 (1차: EventLoop/Scope)
1. 신규 모듈:
   - `event-loop-state-tracker.ts`
   - `scope-state-tracker.ts`
2. 입력 소스:
- `Runtime.consoleAPICalled` (이미 수신 중)
- `Debugger.paused` 흐름/라인/프레임
- 런타임 훅(preload)에서 발행하는 queue marker
3. 출력:
- 각 step에 대응되는 `eventLoopState`/`scopeState`

핵심:
- 정적 파싱 추정이 아니라 “실행 중 이벤트”를 기반으로 상태를 만든다.

### Phase C. 런타임 훅(정확도 핵심)
1. 임시 프로젝트 생성 시 preload 스크립트 생성/주입
2. 훅 대상:
- `setTimeout` 등록/해제
- `Promise.then/catch/finally` enqueue
- `queueMicrotask`
3. 각 이벤트를 표준 marker로 기록(콘솔 marker 또는 별도 채널)
4. tracker가 marker를 consume하여 큐 상태를 갱신

정확도 목표:
- `Promise` 계열이 `setTimeout`보다 먼저 큐 소모되는 순서가 step에 반영
- Scope 변화(enter/exit, 변수 선언/가려짐)가 step 단위로 일관되게 반영

### Phase D. Playground 탭 연결 (1차)
1. JS 언어에서 탭을 `Flow | Event Loop | Scope`로 노출
2. 각 탭 선택 시 `LessonFlowVisualizer` 분기 진입
3. 데이터 없을 때는 명시적 empty state(실제 빈 상태) 표시

### Phase E. 개념 확장 (2차: This, 3차: Prototype/Promise)
1. `this-state-tracker.ts` 추가
2. `prototype-state-tracker.ts`, `promise-state-tracker.ts` 추가
3. JS 탭을 최종 `Flow | Event Loop | Scope | This | Prototype | Promise`로 확장
4. 탭별 데이터 품질 기준 충족 시에만 기본 노출

## 5) 성능/운영 고려
- Step당 연산량: tracker 업데이트 `O(1)~O(k)` (k=해당 step 신규 이벤트 수)
- 메모리 보호:
  - queue item cap (`<=100`)
  - 문자열 길이 cap (`<=160`)
  - 스텝 수 상한은 기존 `MAX_INSPECTOR_STEPS` 유지
- 오버헤드 목표:
  - 기존 inspector 대비 시뮬레이션 총 시간 증가 `<=15%`

## 6) 유지보수 전략
- 개념별 상태 생성 로직을 tracker 단위로 분리
  - `event-loop/scope/this/prototype/promise`
- 공통 인터페이스(`buildConceptState(stepContext)`)로 맞춰 교체/확장 비용 최소화
- `inspector-client`는 transport/CDP 역할만 유지
- `javascript-simulation.service`는 orchestration만 담당
- 프론트는 기존 개념 컴포넌트 재사용 (새 UI 재개발 최소화)

## 7) 검증 계획 (완벽 작동 기준)
1. 단위 테스트
- tracker: enqueue/dequeue, microtask 우선, nested callback, async/await
- scope enter/exit, lexical shadowing, closure 캡처
- this implicit/explicit/arrow/constructor
- prototype lookup path
- promise state/handlers/microtaskQueue
2. 통합 테스트
- `setTimeout + Promise.resolve().then(...)` 순서 검증
- async/await + Promise chain 혼합
3. 수동 시나리오
- Playground에서 개념 탭 이동 시 상태가 연속적으로 맞게 변함

성공 기준:
- `__main__`/함수 프레임 메모리 뷰는 기존과 동등 이상
- Event Loop 탭에서 큐 이동이 코드 실행 순서와 일치
- 회귀 없이 build/test 통과

## 8) 범위 명시 (이번 라운드)
- 포함:
  - 공통 계약 확장(5개 개념 상태 필드)
  - 1차 완성: EventLoop + Scope
- 후속:
  - 2차: This
  - 3차: Prototype + Promise

## 9) 리스크와 대응
- 리스크: Node/Inspector 내부 pause 노이즈로 상태 오염
  - 대응: user script frame 필터 + blackbox + dedupe 규칙 유지
- 리스크: 훅이 사용자 코드와 충돌
  - 대응: 네임스페이스 충돌 방지 prefix + 최소 침습 패치
- 리스크: step 매핑 불일치
  - 대응: line 기반 + marker 시퀀스 기반 이중 정합 체크

## 10) 실행 순서 (권장)
1. Contract 확장 (`eventLoop/scope/this/prototype/promise` 필드)
2. 1차 tracker(EventLoop+Scope) + preload 훅 + 단위 테스트
3. service 연결 + Playground `Event Loop/Scope` 탭 연결
4. 통합/골든 검증 후 1차 기본 노출
5. 2차 `This` tracker + 탭 연결 + 검증
6. 3차 `Prototype/Promise` tracker + 탭 연결 + 검증
7. 최종 노출 기준(정확도/성능) 통과 시 전체 탭 기본 활성화
