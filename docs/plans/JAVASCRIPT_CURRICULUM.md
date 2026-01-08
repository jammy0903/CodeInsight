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

## 구현 계획

1. `prisma/content/javascript/curriculum.json` 생성 (10챕터 구조)
2. `js-1-1.json` ~ `js-10-4.json` (40레슨)
3. `seed.ts`에서 JavaScript 로드
4. 프론트엔드 JavaScript 시각화 컴포넌트
   - Event Loop Visualizer
   - Prototype Chain Visualizer
   - Closure Environment Visualizer

## 참고 자료

- https://www.lydiahallie.com/blog/event-loop
- https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
- https://javascript.info/event-loop
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Inheritance_and_the_prototype_chain
- https://medium.com/javascript-scene/master-the-javascript-interview-what-s-the-difference-between-class-prototypal-inheritance-e4cd0a7562e9
- https://www.freecodecamp.org/news/js-type-coercion-explained-27ba3d9a2839/
