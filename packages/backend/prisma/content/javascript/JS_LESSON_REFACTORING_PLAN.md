# JavaScript 레슨 리팩토링 계획

## 🎯 목표
**시뮬레이터가 변수 상태 변화를 제대로 캡처할 수 있도록** 레슨 코드 수정

## 📊 현황 분석

### 문제점
1. **console.log만 있는 코드** → 변수 상태 변화 없음
2. **비동기 코드** (setTimeout, Promise) → 시뮬레이터가 완벽히 추적 못함
3. **변수 선언만 하고 조작 없음** → 시각화할 상태 변화가 없음

### 시뮬레이터가 캡처하는 것
```json
{
  "line": 3,
  "event": "STEP",
  "stack": [{ "methodName": "__main__", "variables": { "x": 10, "y": 20 } }],
  "heap": [{ "address": "@1", "type": "Array", "content": "[1, 2, 3]" }],
  "stdout": "hello"
}
```

---

## 📋 챕터별 리팩토링 계획

### Chapter 1: 이벤트 루프 (4개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-1-1 | 콜 스택과 동기 실행 | console.log만 | ✅ **변수 추가**: 각 함수에서 변수 조작 |
| js-1-2 | setTimeout과 Task Queue | 비동기 | ⚠️ 정적 시각화 유지 (eventLoopState) |
| js-1-3 | Promise와 Microtask | 비동기 | ⚠️ 정적 시각화 유지 |
| js-1-4 | 이벤트 루프 종합 | 비동기 | ⚠️ 정적 시각화 유지 |

**js-1-1 변경안:**
```javascript
// Before
function first() {
  console.log('first');
  second();
  console.log('first end');
}

// After
let result = [];

function first() {
  result.push('first');
  second();
  result.push('first end');
}

function second() {
  result.push('second');
}

first();
console.log(result);
```

---

### Chapter 2: 스코프 (4개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-2-1 | var vs let vs const | 변수 있음 | ✅ 이미 양호, 상태 변화 강조 |
| js-2-2 | 함수 스코프 vs 블록 스코프 | 변수 있음 | ✅ 이미 양호 |
| js-2-3 | 호이스팅 | 에러 발생 코드 | ⚠️ 에러 없이 동작하는 코드로 변경 |
| js-2-4 | 클로저 | 변수 있음 | ✅ 이미 양호 |

**js-2-3 변경안:**
```javascript
// Before (에러 발생)
console.log(a);  // undefined
console.log(b);  // ReferenceError!
console.log(c);  // ReferenceError!

// After (에러 없이 호이스팅 설명)
var hoistedVar = 'I am hoisted!';
let blockScoped = 'I am NOT hoisted!';

function showHoisting() {
  console.log(innerVar);  // undefined (호이스팅됨)
  var innerVar = 'declared later';
  console.log(innerVar);  // 'declared later'
}

showHoisting();
```

---

### Chapter 3: this 바인딩 (4개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-3-1 | 전역에서의 this | this만 출력 | ✅ **객체 속성 조작 추가** |
| js-3-2 | 메서드에서의 this | 객체 있음 | ✅ 이미 양호 |
| js-3-3 | 화살표 함수의 this | 비동기 | ⚠️ 동기 코드로 변경 |
| js-3-4 | call, apply, bind | 함수 호출 | ✅ 변수 결과 저장하도록 변경 |

**js-3-1 변경안:**
```javascript
// Before
console.log(this);
function showThis() {
  console.log(this);
}

// After
const context = {
  name: 'Global',
  value: 0
};

function updateValue() {
  context.value += 1;
  return context.value;
}

let result1 = updateValue();
let result2 = updateValue();
console.log(context.value);
```

---

### Chapter 4: 비동기 (4개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-4-1 | 콜백 패턴 | 비동기 | ⚠️ **동기 콜백으로 변경** |
| js-4-2 | Promise 체이닝 | 비동기 | ⚠️ 정적 시각화 |
| js-4-3 | async/await | 비동기 | ⚠️ 정적 시각화 |
| js-4-4 | 에러 핸들링 | 에러 throw | ⚠️ try/catch 결과 저장 |

**js-4-1 변경안 (동기 콜백):**
```javascript
// Before (비동기)
function fetchData(callback) {
  setTimeout(() => callback(data), 1000);
}

// After (동기 콜백 패턴 설명)
function processData(data, transformer) {
  return transformer(data);
}

const numbers = [1, 2, 3];
const doubled = processData(numbers, (arr) => arr.map(n => n * 2));
const summed = processData(doubled, (arr) => arr.reduce((a, b) => a + b, 0));

console.log(doubled);  // [2, 4, 6]
console.log(summed);   // 12
```

---

### Chapter 5: 참조와 복사 (3개) ⭐ 시각화 최적

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-5-1 | 원시값 vs 참조값 | 좋음! | ✅ 이미 훌륭, 유지 |
| js-5-2 | 얕은 복사 vs 깊은 복사 | 좋음! | ✅ 이미 훌륭, 유지 |
| js-5-3 | 불변성 | 좋음! | ✅ 이미 훌륭, 유지 |

**Chapter 5는 변경 불필요** - 이미 변수와 객체 상태 변화가 명확함!

---

### Chapter 6: 프로토타입/클래스 (3개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-6-1 | 프로토타입 체인 | 객체 있음 | ✅ 메서드 호출 결과를 변수에 저장 |
| js-6-2 | 생성자 함수 | 객체 있음 | ✅ 인스턴스 상태 추적 |
| js-6-3 | ES6 클래스 | 객체 있음 | ✅ 인스턴스 상태 추적 |

**js-6-1 변경안:**
```javascript
// Before
const dog = { bark() { return 'woof!'; } };
Object.setPrototypeOf(dog, animal);
console.log(dog.eat());

// After
const animal = { type: 'animal', eat() { return this.type + ' eats'; } };
const dog = { type: 'dog', bark() { return 'woof!'; } };

Object.setPrototypeOf(dog, animal);

let bark = dog.bark();
let eat = dog.eat();
let type = dog.type;

console.log(bark, eat, type);
```

---

### Chapter 7: V8 최적화 (3개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-7-1 | 히든 클래스 | 개념 설명 | ⚠️ 객체 속성 변화 시각화 |
| js-7-2 | 메모리 구조 | 개념 설명 | ⚠️ 배열 push/참조 시각화 |
| js-7-3 | 최적화 해제 | 루프 | ⚠️ 작은 루프로 축소 |

**js-7-1 변경안:**
```javascript
// 히든 클래스 변경 시각화
function Point(x, y) {
  this.x = x;
  this.y = y;
}

const p1 = new Point(1, 2);
const p2 = new Point(3, 4);

// 같은 Shape (효율적)
let sum1 = p1.x + p1.y;
let sum2 = p2.x + p2.y;

// Shape 변경 (비효율적)
p1.z = 5;
let sum3 = p1.x + p1.y + p1.z;
```

---

### Chapter 8: 렌더링 (3개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-8-1 | ??? | 빈 내용 | ❌ 콘텐츠 필요 |
| js-8-2 | requestAnimationFrame | 브라우저 API | ⚠️ 개념 설명 + 정적 시각화 |
| js-8-3 | 작업 쪼개기 | 무한 루프 | ⚠️ 작은 청크로 시각화 |

**js-8-3 변경안:**
```javascript
// Task Splitting 시각화 (작은 청크)
const tasks = ['A', 'B', 'C', 'D', 'E'];
const completed = [];

function processChunk(start, chunkSize) {
  const end = Math.min(start + chunkSize, tasks.length);

  for (let i = start; i < end; i++) {
    completed.push(tasks[i]);
  }

  return end;
}

let position = 0;
position = processChunk(position, 2);  // A, B
position = processChunk(position, 2);  // C, D
position = processChunk(position, 2);  // E

console.log(completed);
```

---

### Chapter 9: 메타프로그래밍 (3개)

| 레슨 | 현재 | 문제 | 방향 |
|------|------|------|------|
| js-9-1 | Proxy | 고급 | ⚠️ 결과를 변수에 저장 |
| js-9-2 | Generator | yield | ⚠️ next() 결과를 변수에 저장 |
| js-9-3 | WeakMap | 메모리 | ⚠️ Map 비교 시각화 |

**js-9-2 변경안:**
```javascript
function* counter() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = counter();

let step1 = gen.next();  // { value: 1, done: false }
let step2 = gen.next();  // { value: 2, done: false }
let step3 = gen.next();  // { value: 3, done: false }
let step4 = gen.next();  // { value: undefined, done: true }

console.log(step1.value, step2.value, step3.value);
```

---

## ✅ 우선순위

### 1순위 (바로 수정)
- [ ] js-1-1: 콜 스택 (변수 추가)
- [ ] js-2-3: 호이스팅 (에러 제거)
- [ ] js-3-1: this (객체 조작)
- [ ] js-4-1: 콜백 (동기화)

### 2순위 (시각화 개선)
- [ ] js-6-1, js-6-2, js-6-3: 프로토타입/클래스
- [ ] js-7-1, js-7-2, js-7-3: V8 최적화
- [ ] js-9-1, js-9-2, js-9-3: 메타프로그래밍

### 3순위 (정적 시각화 유지)
- js-1-2, js-1-3, js-1-4: 이벤트 루프 (비동기)
- js-4-2, js-4-3, js-4-4: Promise/async (비동기)
- js-8-2, js-8-3: 렌더링 (브라우저 API)

---

## 🔧 작업 체크리스트

1. **코드 수정 원칙**
   - [ ] 모든 중요 값을 변수에 저장
   - [ ] console.log는 마지막에만 (결과 확인용)
   - [ ] 비동기 → 동기로 대체 가능한 부분은 변경
   - [ ] 루프는 5회 이하로 제한

2. **테스트**
   - [ ] 시뮬레이터 실행 확인
   - [ ] 스냅샷에 변수 상태 포함 확인
   - [ ] 힙 메모리 객체 추적 확인

3. **DB 업데이트**
   - [ ] JSON 파일 수정
   - [ ] `npx tsx prisma/seed.ts` 실행
