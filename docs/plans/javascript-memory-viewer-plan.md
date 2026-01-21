# JavaScript 시각화 도구: 메모리(Memory) vs. 흐름(Flow) 구현 계획

JavaScript 학습 및 디버깅을 효과적으로 돕기 위해, `CodeInsight`는 **코드의 실행 흐름**과 **메모리 상태 변화**를 동시에 시각화하는 통합 도구를 목표로 합니다.

## 1. 메모리 뷰 (Memory View): "데이터는 어떻게 저장되고 연결되는가?"

JavaScript에서 메모리 뷰는 단순히 값을 보여주는 것을 넘어, **'참조(Reference)'** 개념을 시각적으로 이해시키는 것이 핵심입니다. Java와 달리 JavaScript 초심자들은 `원시 타입(Primitive)`과 `참조 타입(Object)`의 차이를 가장 어려워하기 때문입니다.

### 주요 구현 항목

*   **스택 (Stack) & 원시 타입**:
    *   함수 실행 컨텍스트(Execution Context)별로 생성되는 로컬 변수 상자.
    *   `Number`, `String`, `Boolean` 등 원시 값은 변수 상자 안에 직접 표시.
*   **힙 (Heap) & 참조 타입**:
    *   `Object`, `Array`, `Function` 등은 별도의 '힙 영역'에 둥둥 떠 있는 형태로 시각화.
    *   **참조 선(Reference Line)**: 변수에서 객체로, 또는 객체에서 다른 객체로 연결되는 화살표.
    *   *핵심 시나리오:* `const a = {x: 1}; const b = a;` 실행 시, a와 b가 **동일한 힙 객체**를 가리키는 화살표 시각화.
*   **클로저 (Closure) 영역**:
    *   함수가 종료된 후에도 힙에 남아있는 '스코프 객체' 시각화.
    *   가비지 컬렉션(GC) 대상이 되지 않고 살아있는 데이터를 명확히 표시.

> **목표: "변수에 값이 들어가는 것이 아니라, 변수가 값을 '가리킬' 수 있다"는 멘탈 모델을 형성.**

## 2. 흐름 뷰 (Flow View): "엔진은 코드를 어떤 순서로 처리하는가?"

흐름 뷰는 눈에 보이지 않는 JavaScript 엔진의 내부 동작(Call Stack, Event Loop)을 시각화하여, 코드 실행 순서의 인과관계를 설명합니다.

### 주요 구현 항목

*   **실행 컨텍스트 스택 (Call Stack)**:
    *   함수 호출 시 스택 프레임이 쌓이고(Push), 리턴 시 빠지는(Pop) 애니메이션.
    *   현재 실행 중인 코드 라인 하이라이팅 연동.
*   **스코프 체인 (Scope Chain)**:
    *   변수를 찾을 때 현재 스코프 → 상위 스코프 → 전역 스코프로 올라가는 탐색 경로 시각화.
*   **이벤트 루프 & 큐 (비동기)**:
    *   `setTimeout`, `Promise` 등이 실행될 때 **Task Queue** 및 **Microtask Queue**로 이동하는 모습.
    *   Call Stack이 비었을 때 큐의 작업이 스택으로 이동하는 타이밍 시각화.

> **목표: "비동기 코드가 왜 나중에 실행되는가?"에 대한 명쾌한 시각적 해답 제공.**

## 3. CodeInsight 통합 구현 전략 (Implementation Plan)

두 뷰를 분리하지 않고 **"동기화된 하나의 경험"**으로 제공합니다.

### 아키텍처 (SimulatorSlice 확장)

1.  **Code Parser**: 유저 코드를 AST(Abstract Syntax Tree)로 파싱 (Babel 사용).
2.  **Instrumenter**: 각 줄(Line)과 표현식(Expression) 실행 전후에 '스냅샷'을 찍는 추적 코드 삽입.
3.  **Runtime**: 코드를 실행하며 `Step[]` 배열에 로그(현재 스택, 힙 상태, 라인 번호)를 기록.
4.  **Visualizer**:
    *   **좌측 (Code)**: 현재 실행 라인 하이라이팅.
    *   **우측 (Graph)**: React Flow를 사용하여 Stack(노드) -> Heap(노드) 간의 화살표(엣지) 동적 렌더링.

### 단계별 로드맵

#### Phase 1: 기초 구조 (Stack & Primitive)
- [ ] 실행 라인 하이라이터 (Stepping 기능).
- [ ] 전역/로컬 변수와 원시 값 표시 (Stack View).
- [ ] 변수 값 변경 애니메이션.

#### Phase 2: 참조 & 힙 (Reference & Heap)
- [ ] 객체/배열 생성 시 Heap 영역에 노드 배치.
- [ ] 변수 -> 객체 간 화살표 연결 (React Flow).
- [ ] 중첩 객체 및 순환 참조 시각화.

#### Phase 3: 심화 (Closure & Async)
- [ ] 클로저로 인해 유지되는 변수 시각화.
- [ ] 비동기 콜백 큐 시각화 (Event Loop 모사).
