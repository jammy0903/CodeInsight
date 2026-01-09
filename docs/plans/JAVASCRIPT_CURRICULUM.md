# JavaScript 커리큘럼 계획

> 연구 기반 JavaScript 10챕터 커리큘럼 설계
>
> **Part A (Ch 1-5): 언어 기초** - 스코프, 타입, 함수, this, 클로저
> **Part B (Ch 6-10): 비동기와 객체 모델** - 프로토타입, 클래스, 이벤트 루프, Promise

## 연구 기반

| 출처 | 핵심 내용 |
|------|----------|
| ACM SIGPLAN - Semantics of Asynchronous JavaScript | Node.js 비동기 콜백/이벤트 루프 의미론 |
| Lydia Hallie - JavaScript Visualized | Event Loop, Task Queue 시각화 교육 |
| Jake Archibald - Tasks, microtasks, queues | Task vs Microtask 실행 순서 |
| Eric Elliott - Class vs Prototypal Inheritance | 프로토타입 vs 클래스 혼란 분석 |
| SIGCSE 2010 - Identifying Student Misconceptions | 프로그래밍 학습자 misconception 연구 |
| Programming Language Misconceptions Inventory | JavaScript 포함 언어별 misconception 목록 |

## 핵심 Misconceptions

### 1. Hoisting과 TDZ
| Misconception | 올바른 이해 |
|---------------|-------------|
| Hoisting이 코드를 물리적으로 위로 이동 | 컴파일 단계에서의 동작, 코드 위치는 그대로 |
| let/const는 호이스팅 안 됨 | 호이스팅 되지만 TDZ에 걸림 (ReferenceError) |
| var는 undefined로 초기화 | var만 선언과 동시에 undefined로 초기화 |

### 2. this 바인딩
| Misconception | 올바른 이해 |
|---------------|-------------|
| this는 함수가 정의된 곳을 가리킴 | this는 함수가 **호출된 방식**에 따라 결정 |
| 콜백에서 this가 유지됨 | 콜백에서 this 컨텍스트를 잃음 |
| arrow function은 자체 this를 가짐 | arrow function은 렉시컬 this (상위 스코프) |

```javascript
// this 바인딩 4가지 규칙
// 1. Default: 전역객체 (strict mode에서 undefined)
// 2. Implicit: 호출 객체 (obj.method())
// 3. Explicit: call/apply/bind
// 4. new: 새로 생성된 객체
```

### 3. 클로저
| Misconception | 올바른 이해 |
|---------------|-------------|
| 클로저는 함수 안의 함수 | 함수 + 렉시컬 환경의 조합 |
| var 루프에서 각 반복마다 새 변수 | var는 함수 스코프, 마지막 값만 캡처 |

```javascript
// 위험한 코드
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 출력: 3, 3, 3 (모두 같은 i 참조!)

// 해결: let 사용
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 출력: 0, 1, 2
```

### 4. Prototype vs Class
| Misconception | 올바른 이해 |
|---------------|-------------|
| ES6 class는 Java처럼 동작 | class는 프로토타입의 syntactic sugar |
| class가 새로운 상속 모델 | 내부적으로 여전히 프로토타입 체인 |
| 프로토타입은 구식 | 프로토타입이 더 강력한 모델 |

### 5. Event Loop
| Misconception | 올바른 이해 |
|---------------|-------------|
| setTimeout(fn, 0)은 즉시 실행 | Task Queue에 들어가 다음 틱에 실행 |
| Promise와 setTimeout 실행 순서가 같음 | Promise(Microtask) > setTimeout(Task) |
| 비동기 코드는 별도 스레드 | JS는 싱글 스레드, Web API만 별도 |

### 6. Type Coercion
| Misconception | 올바른 이해 |
|---------------|-------------|
| == 와 === 는 비슷함 | ==는 타입 변환 후 비교, ===는 타입+값 비교 |
| "5" + 3 = 8 | 문자열 연결로 "53" |
| "5" - 3 = "53" | 숫자 연산으로 2 |

---

## 커리큘럼 구조 (10챕터, 40레슨)

### Part A: 언어 기초 (문법/실행) - Ch 1-5
> 변수 스코프, 타입 시스템, 함수 실행, this 바인딩, 클로저의 **동작 원리** 이해

#### Chapter 1: 변수와 스코프
> 핵심 질문: "var, let, const는 어떻게 다르게 동작하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-1-1 | var의 함수 스코프 | var는 함수 스코프, 블록 무시 |
| js-1-2 | let/const의 블록 스코프 | 블록({})마다 새 스코프 |
| js-1-3 | Hoisting의 진실 | 선언만 호이스팅, 초기화는 제자리 |
| js-1-4 | TDZ (Temporal Dead Zone) | let/const 선언 전 접근 금지 |

#### Chapter 2: 타입과 강제 변환
> 핵심 질문: "왜 '5' + 3은 '53'이고 '5' - 3은 2인가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-2-1 | JavaScript의 타입 시스템 | 7가지 원시 타입 + Object |
| js-2-2 | 암묵적 타입 변환 | 연산자별 변환 규칙 |
| js-2-3 | == vs === | 느슨한 비교 vs 엄격한 비교 |
| js-2-4 | Truthy와 Falsy | Boolean 컨텍스트에서의 변환 |

#### Chapter 3: 함수와 실행 컨텍스트
> 핵심 질문: "함수는 어떻게 실행되고 메모리에 어떻게 존재하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-3-1 | 함수 선언 vs 함수 표현식 | 호이스팅 차이, 익명 함수 |
| js-3-2 | 실행 컨텍스트 | Variable Environment, Lexical Environment |
| js-3-3 | Call Stack | 함수 호출과 스택 프레임 |
| js-3-4 | 스코프 체인 | 외부 환경 참조, 변수 탐색 |

#### Chapter 4: this 키워드
> 핵심 질문: "this는 왜 때마다 다른 것을 가리키나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-4-1 | this 바인딩 4가지 규칙 | default, implicit, explicit, new |
| js-4-2 | 메서드와 this | 객체.메서드()에서의 this |
| js-4-3 | 콜백에서 this 잃어버리기 | setTimeout, addEventListener 문제 |
| js-4-4 | Arrow Function의 this | 렉시컬 this, 바인딩 고정 |

#### Chapter 5: 클로저와 렉시컬 환경
> 핵심 질문: "함수가 끝나도 변수가 살아있는 이유는?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-5-1 | 렉시컬 스코프 | 함수 정의 위치가 스코프 결정 |
| js-5-2 | 클로저란 무엇인가 | 함수 + 렉시컬 환경 번들 |
| js-5-3 | 클로저 활용 패턴 | 데이터 캡슐화, private 변수 |
| js-5-4 | 루프와 클로저 함정 | var vs let in loops |

---

### Part B: 비동기와 객체 모델 (설계/패턴) - Ch 6-10
> 프로토타입 상속, ES6 클래스, 이벤트 루프, 비동기 패턴의 **설계 원리** 이해

#### Chapter 6: 프로토타입과 상속
> 핵심 질문: "JavaScript에서 상속은 어떻게 작동하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-6-1 | 모든 객체는 프로토타입을 가진다 | __proto__, Object.getPrototypeOf |
| js-6-2 | 프로토타입 체인 | 속성 탐색 순서 |
| js-6-3 | 생성자 함수와 prototype | new 키워드의 동작 |
| js-6-4 | Object.create() | 프로토타입 직접 지정 |

#### Chapter 7: ES6 클래스
> 핵심 질문: "class는 프로토타입과 어떻게 다른가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-7-1 | class는 syntactic sugar | 내부적으로 프로토타입 |
| js-7-2 | constructor와 메서드 | 인스턴스 생성과 메서드 정의 |
| js-7-3 | extends와 super | 클래스 상속 |
| js-7-4 | static 메서드와 속성 | 클래스 레벨 멤버 |

#### Chapter 8: 이벤트 루프
> 핵심 질문: "setTimeout(fn, 0)은 왜 즉시 실행되지 않나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-8-1 | JavaScript 런타임 구조 | Call Stack, Heap, Queue |
| js-8-2 | Web APIs | setTimeout, fetch, DOM events |
| js-8-3 | Task Queue (Macrotask) | 콜백 대기열 |
| js-8-4 | Microtask Queue | Promise, queueMicrotask 우선순위 |

#### Chapter 9: Promise
> 핵심 질문: "콜백 지옥을 어떻게 탈출하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-9-1 | 콜백의 문제점 | Callback Hell, 에러 처리 어려움 |
| js-9-2 | Promise 기초 | pending, fulfilled, rejected |
| js-9-3 | then, catch, finally | Promise 체이닝 |
| js-9-4 | Promise.all, race, allSettled | 여러 Promise 조합 |

#### Chapter 10: async/await
> 핵심 질문: "비동기 코드를 동기처럼 쓸 수 있나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| js-10-1 | async 함수 | 항상 Promise 반환 |
| js-10-2 | await의 동작 | Promise가 resolve될 때까지 대기 |
| js-10-3 | 에러 처리 | try/catch with async/await |
| js-10-4 | 순차 vs 병렬 실행 | await 연속 vs Promise.all |

---

## 시각화 설계

### Event Loop 시각화
```
┌──────────────────────────────────────────────────────────────┐
│  Call Stack          │  Web APIs                            │
│  ┌──────────────┐    │  ┌────────────────────────────────┐  │
│  │ foo()        │    │  │ setTimeout(callback, 1000)     │  │
│  │ bar()        │    │  │ fetch('/api')                  │  │
│  │ main()       │    │  │ addEventListener(...)          │  │
│  └──────────────┘    │  └────────────────────────────────┘  │
├──────────────────────┴──────────────────────────────────────┤
│  Microtask Queue (우선순위 높음)                             │
│  [Promise.then callback] → [queueMicrotask callback]        │
├─────────────────────────────────────────────────────────────┤
│  Task Queue (Macrotask)                                     │
│  [setTimeout callback] → [click event handler]              │
└─────────────────────────────────────────────────────────────┘

실행 순서:
1. Call Stack이 빌 때까지 실행
2. Microtask Queue 전부 실행
3. Task Queue에서 하나 실행
4. 2-3 반복
```

### Prototype Chain 시각화
```
┌─────────────────────────────────────────┐
│  Instance: dog                          │
│  ├── name: "Buddy"                      │
│  └── __proto__ ──────────────────┐      │
│                                  ▼      │
│  ┌────────────────────────────────┐     │
│  │  Dog.prototype                 │     │
│  │  ├── bark: function            │     │
│  │  └── __proto__ ────────┐       │     │
│  │                        ▼       │     │
│  │  ┌──────────────────────────┐  │     │
│  │  │  Object.prototype       │  │     │
│  │  │  ├── toString: function │  │     │
│  │  │  └── __proto__: null    │  │     │
│  │  └──────────────────────────┘  │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Closure 시각화
```
┌─────────────────────────────────────────┐
│  function outer() {                     │
│    let count = 0;  ◄────────────────┐   │
│    return function inner() {        │   │
│      return ++count; ───────────────┘   │
│    }                                    │
│  }                                      │
│                                         │
│  const counter = outer();               │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  counter (inner 함수)            │   │
│  │  └── [[Environment]]             │   │
│  │       └── { count: 0 }           │   │
│  │           (outer의 렉시컬 환경)   │   │
│  └──────────────────────────────────┘   │
│                                         │
│  counter() → 1                          │
│  counter() → 2  (같은 count 참조!)      │
└─────────────────────────────────────────┘
```

---

## 시각화 유형별 상세 설계

### 1. 실행 컨텍스트 스택 (Call Stack Visualizer)
```
┌─────────────────┐
│   inner()       │ ← 현재 실행 중 (하이라이트)
├─────────────────┤
│   outer()       │
├─────────────────┤
│   global        │
└─────────────────┘
```
**적용 챕터**: Ch 3 (함수와 실행 컨텍스트), Ch 5 (클로저)
**구현 방식**: 스택 push/pop 애니메이션

### 2. 스코프 체인 트리 (Scope Chain Visualizer)
```
┌─────────────────────────────────────┐
│ Global Scope                        │
│   └─ outer()                        │
│        x = 10                       │
│        └─ inner()                   │
│             console.log(x) → 10 찾음│
└─────────────────────────────────────┘
```
**적용 챕터**: Ch 1 (변수와 스코프), Ch 3 (스코프 체인), Ch 5 (렉시컬 스코프)
**구현 방식**: 트리 구조 + 탐색 경로 화살표 애니메이션

### 3. 호이스팅 코드 변환 (Hoisting Visualizer)
```
// 작성한 코드              // 실제 실행 순서
┌─────────────────┐       ┌─────────────────┐
│ console.log(x); │  →    │ var x;          │ (선언 올라감)
│ var x = 5;      │       │ console.log(x); │ (undefined)
│                 │       │ x = 5;          │ (할당은 그대로)
└─────────────────┘       └─────────────────┘
```
**적용 챕터**: Ch 1 (Hoisting, TDZ)
**구현 방식**: 코드 전/후 비교 + 줄 이동 애니메이션

### 4. this 바인딩 다이어그램 (This Binding Visualizer)
```
┌────────────────────────────────────────────────┐
│  호출 방식              │  this 값            │
├────────────────────────────────────────────────┤
│  obj.method()    ────→  │  obj (암시적)       │
│  func()          ────→  │  window (기본)      │
│  new Func()      ────→  │  새 인스턴스        │
│  func.call(x)    ────→  │  x (명시적)         │
│  () => {}        ────→  │  외부 this (렉시컬) │
└────────────────────────────────────────────────┘
```
**적용 챕터**: Ch 4 (this 키워드)
**구현 방식**: 호출 시점에 화살표로 바인딩 대상 표시

### 5. 클로저 환경 캡처 (Closure Visualizer)
```
┌─────────────────────────────────────────┐
│  outer() 실행 후 종료                    │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │  inner 함수                      │   │
│  │  └── [[Environment]] ────────────┼───┼──► { count: 0 }
│  │       (렉시컬 환경 참조)          │   │    (GC 안 됨!)
│  └──────────────────────────────────┘   │
│                                         │
│  inner() 호출 → count 접근 가능!        │
└─────────────────────────────────────────┘
```
**적용 챕터**: Ch 5 (클로저)
**구현 방식**: 함수가 환경을 "캡처"하는 연결선 + 힙에 남은 환경 표시

### 6. 프로토타입 체인 (Prototype Chain Visualizer)
```
  dog ──► Dog.prototype ──► Animal.prototype ──► Object.prototype ──► null
   │           │                  │                     │
 name       bark()            walk()               toString()

  dog.toString() 호출 시:
  dog (없음) → Dog.prototype (없음) → Animal.prototype (없음) → Object.prototype (찾음!)
```
**적용 챕터**: Ch 6 (프로토타입), Ch 7 (ES6 클래스)
**구현 방식**: 체인 다이어그램 + 속성 탐색 경로 애니메이션

### 7. 이벤트 루프 (Event Loop Visualizer) ⭐ 핵심
```
┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
│  Call Stack  │    │   Web APIs   │    │   Task Queue     │
├──────────────┤    ├──────────────┤    ├──────────────────┤
│  foo()       │    │ setTimeout   │───→│  callback        │
│              │    │   2초 대기   │    │                  │
└──────────────┘    └──────────────┘    └──────────────────┘
        ↑                                        │
        └──────────── Event Loop ────────────────┘
                    (Stack 비면 Queue에서 가져옴)

┌──────────────────────────────────────────────────────────┐
│  Microtask Queue (우선순위 높음!)                         │
│  [Promise.then] → [queueMicrotask]                       │
└──────────────────────────────────────────────────────────┘
```
**적용 챕터**: Ch 8 (이벤트 루프), Ch 9 (Promise), Ch 10 (async/await)
**구현 방식**: Loupe 스타일 실시간 애니메이션

---

## 챕터별 시각화 매핑

| 챕터 | 주요 시각화 | 구현 난이도 | 우선순위 |
|------|------------|------------|----------|
| Ch 1 | 스코프 체인 + 호이스팅 | ⭐⭐ | 🥇 높음 |
| Ch 2 | 타입 변환 테이블 | ⭐ | 🥉 낮음 |
| Ch 3 | 콜 스택 + 스코프 체인 | ⭐⭐ | 🥇 높음 |
| Ch 4 | this 바인딩 화살표 | ⭐⭐ | 🥈 중간 |
| Ch 5 | 클로저 환경 캡처 | ⭐⭐⭐ | 🥇 높음 |
| Ch 6 | 프로토타입 체인 | ⭐⭐ | 🥈 중간 |
| Ch 7 | class → 프로토타입 변환 | ⭐⭐ | 🥉 낮음 |
| Ch 8 | **이벤트 루프** | ⭐⭐⭐ | 🥇 **최우선** |
| Ch 9 | 이벤트 루프 + Promise 상태 | ⭐⭐⭐ | 🥇 높음 |
| Ch 10 | async/await 실행 흐름 | ⭐⭐⭐ | 🥇 높음 |

---

## 상세 설계

### 아키텍처 결정 사항

| 항목 | 결정 | 이유 |
|------|------|------|
| Hook 구조 | `useLessonVisualization` (리네임) | 이름이 역할을 정확히 반영, 메모리 외 시각화도 지원 |
| 분기 위치 | `LessonPage`에서 직접 분기 | YAGNI 원칙, 2개 언어에 별도 컴포넌트는 과잉 설계 |
| 타입 구조 | Union Type | 타입 안전성, 자동완성 지원 |
| 애니메이션 | Framer Motion | 프로젝트에 이미 있음, 복잡한 시퀀스 가능 |

---

### 컴포넌트 계층 구조

```
LessonPage.tsx
    │
    ├── CodeViewer (코드 하이라이트)
    ├── StepExplanation (설명)
    │
    └── [시각화 영역] ◄── LessonPage에서 직접 분기 (YAGNI)
            │
            ├── language === "c"
            │       └── CourseMemoryView (기존)
            │
            └── language === "javascript"
                    └── JSVisualizerView
                            │
                            ├── "callStack"   → CallStackView
                            ├── "scopeChain"  → ScopeChainView
                            ├── "eventLoop"   → EventLoopView
                            ├── "closure"     → ClosureView
                            ├── "prototype"   → PrototypeChainView
                            ├── "thisBind"    → ThisBindingView
                            └── "hoisting"    → HoistingView
```

**LessonPage 분기 코드 (간단):**
```tsx
// LessonPage.tsx
{lesson.language === "c" && (
  <CourseMemoryView stack={stack} heap={heap} changedBlocks={changedBlocks} />
)}
{lesson.language === "javascript" && (
  <JSVisualizerView type={visualizationType} state={visualizationState} />
)}
```

---

### 데이터 플로우

```
┌─────────────────────────────────────────────────────────────────┐
│  Backend: GET /api/v1/courses/lessons/js-8-1                    │
│                                                                 │
│  Response: {                                                    │
│    lessonId: "js-8-1",                                          │
│    language: "javascript",  ◄── 언어 구분                       │
│    content: {                                                   │
│      steps: [{                                                  │
│        visualizationType: "eventLoop",  ◄── 시각화 타입         │
│        visualizationState: { ... }      ◄── 시각화 데이터       │
│      }]                                                         │
│    }                                                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  useLessonVisualization (리네임됨)                              │
│                                                                 │
│  - C 언어: memoryChanges → stack/heap 계산                      │
│  - JavaScript: visualizationType 체크                           │
│          → "eventLoop" | "closure" | ... → 그대로 전달          │
│                                                                 │
│  return {                                                       │
│    // C용                                                       │
│    stack, heap, changedBlocks,                                  │
│    // JS용                                                      │
│    visualizationType,                                           │
│    visualizationState,  // Union Type                           │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  LessonPage.tsx (직접 분기 - YAGNI)                             │
│                                                                 │
│  const { stack, heap, visualizationType, visualizationState }   │
│    = useLessonVisualization(steps, currentStep);                │
│                                                                 │
│  // C 언어                                                      │
│  {lesson.language === "c" && (                                  │
│    <CourseMemoryView stack={stack} heap={heap} />               │
│  )}                                                             │
│                                                                 │
│  // JavaScript                                                  │
│  {lesson.language === "javascript" && (                         │
│    <JSVisualizerView                                            │
│      type={visualizationType}                                   │
│      state={visualizationState}                                 │
│    />                                                           │
│  )}                                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

### 타입 정의

```typescript
// types/visualization.ts

// 시각화 타입 enum
type JSVisualizationType =
  | "callStack"
  | "scopeChain"
  | "hoisting"
  | "thisBind"
  | "closure"
  | "prototype"
  | "eventLoop"
  | "promise";

// 각 시각화별 상태 타입
interface CallStackState {
  frames: { name: string; variables: Record<string, unknown> }[];
  currentFrame: number;
}

interface ScopeChainState {
  scopes: { name: string; type: "global" | "function" | "block"; variables: Record<string, unknown> }[];
  lookupPath: string[];  // 변수 탐색 경로
  targetVariable?: string;
}

interface HoistingState {
  originalCode: string;
  transformedCode: string;
  hoistedDeclarations: { name: string; type: "var" | "function"; originalLine: number }[];
}

interface ThisBindingState {
  bindingType: "default" | "implicit" | "explicit" | "new" | "arrow";
  thisValue: string;
  callSite: string;
  explanation: string;
}

interface ClosureState {
  outerFunction: string;
  innerFunction: string;
  capturedVariables: { name: string; value: unknown }[];
  environmentChain: { scope: string; variables: Record<string, unknown> }[];
}

interface PrototypeChainState {
  instance: { name: string; ownProperties: string[] };
  chain: { name: string; properties: string[] }[];
  lookupProperty?: string;
  lookupPath?: string[];
}

interface EventLoopState {
  callStack: string[];
  webApis: { name: string; delay?: number; status: "waiting" | "ready" }[];
  taskQueue: string[];
  microtaskQueue: string[];
  output: string[];
  currentPhase: "executing" | "checkingMicrotasks" | "checkingTasks" | "idle";
}

interface PromiseState {
  promises: {
    id: string;
    status: "pending" | "fulfilled" | "rejected";
    value?: unknown;
    reason?: string;
  }[];
  eventLoopState: EventLoopState;
}

// Union Type
type JSVisualizationState =
  | { type: "callStack"; data: CallStackState }
  | { type: "scopeChain"; data: ScopeChainState }
  | { type: "hoisting"; data: HoistingState }
  | { type: "thisBind"; data: ThisBindingState }
  | { type: "closure"; data: ClosureState }
  | { type: "prototype"; data: PrototypeChainState }
  | { type: "eventLoop"; data: EventLoopState }
  | { type: "promise"; data: PromiseState };
```

---

### Hook 설계 (useLessonVisualization)

> **리네임:** `useLessonMemory` → `useLessonVisualization`
> **이유:** "Memory"는 C 전용 느낌. JS는 Event Loop, Closure 등 메모리가 아닌 시각화도 있음.

```typescript
// hooks/useLessonVisualization.ts (리네임됨)

interface UseLessonVisualizationResult {
  // C용 (메모리 시각화)
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  changedBlocks: string[];

  // JS용 (다양한 시각화)
  visualizationType: JSVisualizationType | "memory" | null;
  visualizationState: JSVisualizationState | null;
}

export function useLessonVisualization(
  steps: LessonStep[],
  currentStep: number
): UseLessonVisualizationResult {
  const step = steps[currentStep];
  const vizType = step?.visualizationType ?? "memory";

  // C 언어: 기존 메모리 시각화 로직
  if (vizType === "memory" || !vizType) {
    // 기존 memoryChanges 누적 로직 유지
    return { stack, heap, changedBlocks, visualizationType: "memory", visualizationState: null };
  }

  // JavaScript: 시각화 상태 그대로 전달
  return {
    stack: [],
    heap: [],
    changedBlocks: [],
    visualizationType: vizType,
    visualizationState: step.visualizationState,
  };
}
```

**마이그레이션:**
```bash
# 파일 리네임
mv useLessonMemory.ts useLessonVisualization.ts

# import 변경 (LessonPage.tsx)
- import { useLessonMemory } from '../hooks/useLessonMemory';
+ import { useLessonVisualization } from '../hooks/useLessonVisualization';
```

---

### 컴포넌트별 Props 인터페이스

```typescript
// JSVisualizerView (JavaScript 시각화 통합)
interface JSVisualizerViewProps {
  type: JSVisualizationType;
  state: JSVisualizationState;
}

// EventLoopView
interface EventLoopViewProps {
  state: EventLoopState;
  animate?: boolean;
}

// ClosureView
interface ClosureViewProps {
  state: ClosureState;
}

// ScopeChainView
interface ScopeChainViewProps {
  state: ScopeChainState;
  highlightLookup?: boolean;  // 변수 탐색 경로 강조
}

// CallStackView
interface CallStackViewProps {
  state: CallStackState;
}
```

---

## 구현 계획

### Phase 1: 데이터 구조 (1주)
1. `prisma/content/javascript/` 디렉토리 생성
2. `chapters.json` - 10챕터 메타데이터
3. `js-1-1.json` ~ `js-10-4.json` - 40레슨 콘텐츠
4. `seed.ts` 업데이트 - JavaScript 데이터 로드

### Phase 2: 기본 시각화 컴포넌트 (2주)
1. `features/visualizers/js/` 디렉토리 구조
2. `CallStackView.tsx` - 콜 스택 시각화
3. `ScopeChainView.tsx` - 스코프 체인 트리
4. `HoistingView.tsx` - 코드 전/후 비교

### Phase 3: 고급 시각화 컴포넌트 (3주)
1. `EventLoopView.tsx` - 이벤트 루프 (핵심!)
2. `ClosureView.tsx` - 클로저 환경 캡처
3. `PrototypeChainView.tsx` - 프로토타입 체인
4. `ThisBindingView.tsx` - this 바인딩 다이어그램

### Phase 4: 통합 및 테스트 (1주)
1. `JSVisualizerView.tsx` - 통합 시각화 컴포넌트
2. `useLessonVisualization` hook 리네임 및 확장
3. `LessonPage` 언어별 분기 추가
4. 애니메이션 최적화

---

## 파일 구조 (다국어 확장 고려)

> **설계 원칙:** DRY (Don't Repeat Yourself)
> - 공통 컴포넌트는 `shared/`에 한 번만 구현
> - 언어별 전용 컴포넌트만 각 폴더에 구현

```
packages/frontend/src/features/
├── courses/
│   ├── hooks/
│   │   └── useLessonVisualization.ts  # 리네임됨 (구 useLessonMemory)
│   └── LessonPage.tsx                 # 직접 분기 (C/JS/Python/Java)
│
└── visualizers/
    ├── shared/                        # 🔥 공통 컴포넌트 (모든 언어)
    │   ├── index.tsx                  # 공통 export
    │   ├── types.ts                   # SharedVisualizationType
    │   ├── constants.ts               # 공통 색상/애니메이션
    │   └── components/
    │       ├── CallStackView.tsx      # ✅ 모든 언어 공통
    │       ├── ScopeChainView.tsx     # ✅ 모든 언어 공통 (C 제외)
    │       └── MemoryView.tsx         # ✅ Stack/Heap 기본 구조
    │
    ├── c/                             # C 전용
    │   ├── index.tsx
    │   ├── types.ts                   # CVisualizationType extends Shared
    │   ├── CVisualizerView.tsx
    │   └── components/
    │       └── PointerView.tsx        # C 전용: 포인터 화살표
    │
    ├── js/                            # JavaScript 전용
    │   ├── index.tsx
    │   ├── types.ts                   # JSVisualizationType extends Shared
    │   ├── JSVisualizerView.tsx
    │   └── components/
    │       ├── EventLoopView.tsx      # JS 전용
    │       ├── ClosureView.tsx        # JS 전용
    │       ├── PrototypeChainView.tsx # JS 전용
    │       ├── ThisBindingView.tsx    # JS 전용
    │       ├── HoistingView.tsx       # JS 전용
    │       └── PromiseStateView.tsx   # JS 전용
    │
    ├── python/                        # 🔮 미래: Python 전용
    │   ├── index.tsx
    │   ├── types.ts                   # PythonVisualizationType extends Shared
    │   ├── PythonVisualizerView.tsx
    │   └── components/
    │       ├── GILView.tsx            # Python 전용: Global Interpreter Lock
    │       ├── GeneratorView.tsx      # Python 전용: yield/generator
    │       ├── RefCountView.tsx       # Python 전용: 참조 카운팅
    │       └── DecoratorView.tsx      # Python 전용: 데코레이터 체인
    │
    └── java/                          # 🔮 미래: Java 전용
        ├── index.tsx
        ├── types.ts                   # JavaVisualizationType extends Shared
        ├── JavaVisualizerView.tsx
        └── components/
            ├── JVMMemoryView.tsx      # Java 전용: Method Area, Metaspace
            ├── GCPhasesView.tsx       # Java 전용: GC 단계 시각화
            ├── ClassLoaderView.tsx    # Java 전용: 클래스 로딩
            └── ThreadStateView.tsx    # Java 전용: 스레드 상태
```

---

## 타입 상속 구조 (다국어 확장)

```typescript
// ============================================
// shared/types.ts - 공통 타입 (모든 언어)
// ============================================

// 공통 시각화 타입
type SharedVisualizationType =
  | "callStack"     // 모든 언어
  | "scopeChain"    // JS, Python, Java
  | "memory";       // C, Python, Java (Stack/Heap)

// 공통 상태 인터페이스
interface CallStackState {
  frames: StackFrame[];
  currentFrame: number;
}

interface StackFrame {
  name: string;
  variables: Record<string, unknown>;
  line?: number;
}

interface ScopeChainState {
  scopes: Scope[];
  lookupPath?: string[];
  targetVariable?: string;
}

interface MemoryState {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  changedBlocks?: string[];
}

// ============================================
// js/types.ts - JavaScript 확장
// ============================================

import { SharedVisualizationType, CallStackState, ScopeChainState } from '../shared/types';

type JSOnlyVisualizationType =
  | "eventLoop"
  | "closure"
  | "prototype"
  | "thisBind"
  | "hoisting"
  | "promise";

// 공통 + JS 전용 합치기
type JSVisualizationType = SharedVisualizationType | JSOnlyVisualizationType;

// JS 전용 상태들...
interface EventLoopState { /* ... */ }
interface ClosureState { /* ... */ }

// ============================================
// python/types.ts - Python 확장 (미래)
// ============================================

import { SharedVisualizationType } from '../shared/types';

type PythonOnlyVisualizationType =
  | "gil"           // Global Interpreter Lock
  | "generator"     // yield, generator
  | "refCount"      // 참조 카운팅 GC
  | "decorator"     // 데코레이터 체인
  | "comprehension" // 리스트 컴프리헨션
  | "contextMgr";   // with 문, context manager

type PythonVisualizationType = SharedVisualizationType | PythonOnlyVisualizationType;

// ============================================
// java/types.ts - Java 확장 (미래)
// ============================================

import { SharedVisualizationType } from '../shared/types';

type JavaOnlyVisualizationType =
  | "jvmMemory"     // Method Area, Metaspace, PermGen
  | "gcPhases"      // Mark, Sweep, Compact
  | "classLoader"   // Bootstrap, Extension, Application
  | "threadState"   // NEW, RUNNABLE, BLOCKED, WAITING...
  | "inheritance"   // 클래스 상속 트리
  | "interface";    // 인터페이스 구현

type JavaVisualizationType = SharedVisualizationType | JavaOnlyVisualizationType;
```

---

## 언어별 시각화 매핑 테이블

| 시각화 | 위치 | C | JS | Python | Java | 비고 |
|--------|------|---|----|----|------|------|
| **Call Stack** | `shared/` | ✅ | ✅ | ✅ | ✅ | 모든 언어 공통 |
| **Scope Chain** | `shared/` | ❌ | ✅ | ✅ | ✅ | C는 렉시컬 스코프 없음 |
| **Memory** | `shared/` | ✅ | ❌ | ✅ | ✅ | JS는 메모리 직접 접근 없음 |
| Pointer | `c/` | ✅ | ❌ | ❌ | ❌ | C 전용 |
| Event Loop | `js/` | ❌ | ✅ | ❌ | ❌ | JS 전용 (Node.js) |
| Closure | `js/` | ❌ | ✅ | ⚠️ | ❌ | Python도 비슷하지만 다름 |
| Prototype | `js/` | ❌ | ✅ | ❌ | ❌ | JS 전용 |
| this Binding | `js/` | ❌ | ✅ | ❌ | ❌ | JS 전용 |
| GIL | `python/` | ❌ | ❌ | ✅ | ❌ | Python 전용 |
| Generator | `js/`, `python/` | ❌ | ✅ | ✅ | ❌ | 둘 다 있지만 구현 다름 |
| JVM Memory | `java/` | ❌ | ❌ | ❌ | ✅ | Java 전용 |
| GC Phases | `python/`, `java/` | ❌ | ❌ | ✅ | ✅ | 둘 다 있지만 알고리즘 다름 |

---

## 새 언어 추가 가이드 (미래)

### Step 1: 폴더 생성
```bash
mkdir -p features/visualizers/{language}/components
```

### Step 2: 타입 정의
```typescript
// {language}/types.ts
import { SharedVisualizationType } from '../shared/types';

type {Language}OnlyVisualizationType =
  | "feature1"
  | "feature2";

export type {Language}VisualizationType =
  SharedVisualizationType | {Language}OnlyVisualizationType;
```

### Step 3: 통합 뷰 생성
```tsx
// {language}/{Language}VisualizerView.tsx
import { CallStackView, ScopeChainView } from '../shared';
import { Feature1View, Feature2View } from './components';

export function {Language}VisualizerView({ type, state }) {
  switch (type) {
    // 공통 컴포넌트 재사용
    case "callStack":
      return <CallStackView state={state.data} />;
    case "scopeChain":
      return <ScopeChainView state={state.data} />;

    // 언어 전용 컴포넌트
    case "feature1":
      return <Feature1View state={state.data} />;
    default:
      return null;
  }
}
```

### Step 4: LessonPage 분기 추가
```tsx
// LessonPage.tsx
{lesson.language === "{language}" && (
  <{Language}VisualizerView type={visualizationType} state={visualizationState} />
)}
```

### Step 5: 레슨 콘텐츠 생성
```bash
mkdir -p prisma/content/{language}/lessons
# chapters.json, {lang}-1-1.json 등 생성
```

---

## 레슨 JSON 형식 (예시)

```json
{
  "lessonId": "js-8-1",
  "title": "JavaScript 런타임 구조",
  "concept": "JavaScript는 싱글 스레드지만 비동기 처리가 가능한 이유",
  "content": {
    "code": "console.log('1');\nsetTimeout(() => console.log('2'), 0);\nconsole.log('3');",
    "steps": [
      {
        "line": 1,
        "title": "동기 코드 실행",
        "explanation": "console.log('1')이 Call Stack에 올라가고 즉시 실행됩니다.",
        "visualizationType": "eventLoop",
        "eventLoopState": {
          "callStack": ["console.log('1')"],
          "webApis": [],
          "taskQueue": [],
          "microtaskQueue": [],
          "output": ["1"]
        }
      },
      {
        "line": 2,
        "title": "setTimeout 등록",
        "explanation": "setTimeout이 Web API로 전달됩니다. 0ms여도 즉시 실행되지 않습니다!",
        "visualizationType": "eventLoop",
        "eventLoopState": {
          "callStack": [],
          "webApis": ["setTimeout(callback, 0)"],
          "taskQueue": [],
          "microtaskQueue": [],
          "output": ["1"]
        }
      }
    ]
  }
}
```

---

## 참고 자료

- https://www.lydiahallie.com/blog/event-loop
- https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
- https://javascript.info/event-loop
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain
- https://medium.com/javascript-scene/master-the-javascript-interview-what-s-the-difference-between-class-prototypal-inheritance-e4cd0a7562e9
- https://www.freecodecamp.org/news/js-type-coercion-explained-27ba3d9a2839/
