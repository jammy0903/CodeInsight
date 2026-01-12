# JavaScript Curriculum Research

> 조사일: 2026-01-12

---

## 1. 헷갈리는 개념 (Confusing Concepts)

### 1.1 Hoisting
- `var` 선언은 스코프 최상단으로 끌어올려짐 (값은 X)
- `let`/`const`는 TDZ(Temporal Dead Zone) 존재
- 함수 선언문은 전체가 호이스팅, 함수 표현식은 변수만 호이스팅

```javascript
console.log(x); // undefined (var 호이스팅)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 10;
```

### 1.2 Closure
- 내부 함수가 외부 함수의 변수에 접근 가능
- 외부 함수가 종료되어도 변수 유지

```javascript
function createCounter() {
  let count = 0;
  return function() {
    return ++count;
  };
}
const counter = createCounter();
counter(); // 1
counter(); // 2
```

### 1.3 this 바인딩
- 호출 방식에 따라 달라짐
- 일반 함수: 전역 객체 (strict mode에서는 undefined)
- 메서드: 해당 객체
- 화살표 함수: 렉시컬 this (상위 스코프)
- `call`/`apply`/`bind`: 명시적 바인딩

```javascript
const obj = {
  name: 'Alice',
  greet() { console.log(this.name); },
  greetArrow: () => console.log(this.name)
};
obj.greet();      // 'Alice'
obj.greetArrow(); // undefined (전역의 this)
```

### 1.4 Scope (스코프)
- Global Scope: 어디서든 접근 가능
- Function Scope: `var`는 함수 단위
- Block Scope: `let`/`const`는 블록 단위 (`{}`)

### 1.5 == vs ===
- `==`: 타입 변환 후 비교 (느슨한 비교)
- `===`: 타입 변환 없이 비교 (엄격한 비교)

```javascript
'5' == 5   // true
'5' === 5  // false
null == undefined  // true
null === undefined // false
```

---

## 2. 실수하는 개념 (Common Mistakes)

### 2.1 비동기 코드 순서 착각
```javascript
console.log('1');
setTimeout(() => console.log('2'), 0);
console.log('3');
// 출력: 1, 3, 2 (2가 마지막!)
```

### 2.2 배열/객체 참조 복사
```javascript
const arr1 = [1, 2, 3];
const arr2 = arr1;  // 참조 복사!
arr2.push(4);
console.log(arr1);  // [1, 2, 3, 4] - 원본도 변경됨

// 올바른 방법
const arr3 = [...arr1];  // 얕은 복사
```

### 2.3 for 루프에서 var 사용
```javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 출력: 3, 3, 3 (모두 3!)

// 올바른 방법: let 사용
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 출력: 0, 1, 2
```

### 2.4 콜백 지옥
```javascript
// BAD
getData(function(a) {
  getMoreData(a, function(b) {
    getMoreData(b, function(c) {
      // ...
    });
  });
});

// GOOD: async/await
async function fetchAll() {
  const a = await getData();
  const b = await getMoreData(a);
  const c = await getMoreData(b);
}
```

### 2.5 undefined vs null 혼동
- `undefined`: 변수가 선언만 되고 값이 할당되지 않음
- `null`: 의도적으로 "값이 없음"을 표현

### 2.6 Overengineering
- 단순한 문제에 복잡한 패턴 적용
- 불필요한 추상화 계층 추가

### 2.7 문서화 무시
- 코드만 쓰고 주석/문서 작성 안 함
- 미래의 자신과 동료를 위해 문서화 필수

---

## 3. 이해하기 어려운 문법 (Hard Syntax)

### 3.1 Promise
```javascript
// Promise 생성
const promise = new Promise((resolve, reject) => {
  setTimeout(() => resolve('done'), 1000);
});

// Promise 사용
promise
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

### 3.2 async/await
- `async` 함수는 항상 Promise 반환
- `await`는 Promise가 resolve될 때까지 대기

```javascript
async function fetchData() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

### 3.3 Prototype
```javascript
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function() {
  console.log(`Hello, ${this.name}`);
};

const john = new Person('John');
john.greet();  // 'Hello, John'
```

### 3.4 Destructuring (구조 분해)
```javascript
// 객체
const { name, age } = { name: 'Alice', age: 25 };

// 배열
const [first, second] = [1, 2, 3];

// 기본값
const { x = 10 } = {};
```

### 3.5 Spread/Rest 연산자
```javascript
// Spread: 펼치기
const arr = [1, 2, 3];
const newArr = [...arr, 4, 5];

// Rest: 모으기
function sum(...numbers) {
  return numbers.reduce((a, b) => a + b, 0);
}
```

### 3.6 Optional Chaining (?.)
```javascript
const user = { profile: { name: 'Alice' } };
console.log(user?.profile?.name);  // 'Alice'
console.log(user?.settings?.theme); // undefined (에러 없음)
```

### 3.7 Nullish Coalescing (??)
```javascript
const value = null ?? 'default';  // 'default'
const zero = 0 ?? 'default';      // 0 (0은 nullish가 아님)
```

---

## 4. 초급 개발자 필수 개념 (Essential for Juniors)

### 4.1 기초 (33 Essential Concepts 기반)

| # | 개념 | 설명 |
|---|------|------|
| 1 | Variables | let, const, var 차이 |
| 2 | Data Types | string, number, boolean, object, array, null, undefined |
| 3 | Functions | 선언문, 표현식, 화살표 함수 |
| 4 | Scope | 전역, 함수, 블록 스코프 |
| 5 | Closures | 외부 변수 참조 유지 |
| 6 | Hoisting | 선언 끌어올림 |
| 7 | Event Loop | 비동기 실행 원리 |
| 8 | Promises | 비동기 처리 객체 |
| 9 | async/await | Promise 문법 설탕 |
| 10 | this | 실행 컨텍스트 바인딩 |
| 11 | Prototypes | 상속 메커니즘 |
| 12 | Classes | ES6 클래스 문법 |
| 13 | Modules | import/export |
| 14 | Error Handling | try/catch/finally |
| 15 | DOM Manipulation | 문서 객체 모델 조작 |

### 4.2 중급으로 가기 위한 개념

| 개념 | 왜 중요한가 |
|------|------------|
| Execution Context | 코드 실행 원리 이해 |
| Call Stack | 함수 호출 추적 |
| Callback Queue | 비동기 콜백 대기열 |
| Microtask Queue | Promise 콜백 우선순위 |
| Memory Management | 메모리 누수 방지 |
| Garbage Collection | 자동 메모리 해제 |
| Event Delegation | 이벤트 버블링 활용 |
| Debounce/Throttle | 성능 최적화 |

### 4.3 React 개발자 필수

- Arrow Functions
- Array Methods: map, filter, reduce, find
- Destructuring
- Spread/Rest
- Template Literals
- Modules (import/export)
- Promises & async/await

---

## 5. 레슨 우선순위 제안

### Chapter 1: 이벤트 루프 (완료)
- [x] js-1-1: 콜 스택과 동기 실행
- [x] js-1-2: setTimeout과 Task Queue
- [x] js-1-3: Promise와 Microtask Queue
- [x] js-1-4: 이벤트 루프 종합

### Chapter 2: 스코프와 클로저 (완료)
- [x] js-2-1: var vs let vs const
- [x] js-2-2: 함수 스코프 vs 블록 스코프
- [x] js-2-3: 호이스팅 (Hoisting)
- [x] js-2-4: 클로저 (Closure)

### Chapter 3: this 바인딩 (완료)
- [x] js-3-1: 전역에서의 this
- [x] js-3-2: 메서드에서의 this
- [x] js-3-3: 화살표 함수의 this
- [x] js-3-4: call, apply, bind

### Chapter 4: 비동기 심화 (완료)
- [x] js-4-1: 콜백 패턴
- [x] js-4-2: Promise 생성과 체이닝
- [x] js-4-3: async/await
- [x] js-4-4: 에러 핸들링

### Chapter 5: 참조와 복사 (완료)
- [x] js-5-1: 원시값 vs 참조값
- [x] js-5-2: 얕은 복사 vs 깊은 복사
- [x] js-5-3: 불변성 (Immutability)

### Chapter 6: 프로토타입 (완료)
- [x] js-6-1: 프로토타입 체인
- [x] js-6-2: 상속
- [x] js-6-3: ES6 클래스

---

## 참고 자료

- [33 Essential JavaScript Concepts](https://dev.to/timvandort7291/33-essential-concepts-every-javascript-developer-should-know-3ekn)
- [JavaScript Scope: Lexical, Block, and Hoisting](https://www.codesmith.io/blog/understanding-javascript-scope)
- [Truly Understanding Async/Await](https://medium.com/@rafaelvidaurre/truly-understanding-async-await-491dd580500e)
