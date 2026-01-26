import { describe, it, expect, beforeEach } from 'vitest';
import { JavaScriptSimulationService } from './javascript-simulation.service';

describe('JavaScriptSimulationService (Debugger-based)', () => {
  let service: JavaScriptSimulationService;

  beforeEach(() => {
    service = new JavaScriptSimulationService();
  });

  it('should capture variable assignments', async () => {
    const code = `let x = 10;
let y = 20;
let z = x + y;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();
    expect(result.steps).toBeInstanceOf(Array);
    expect(result.steps!.length).toBeGreaterThan(0);

    // Check that variables are captured
    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep).toHaveProperty('line');
    expect(lastStep).toHaveProperty('event', 'STEP');
    expect(lastStep).toHaveProperty('stack');
    expect(lastStep.stack[0].variables).toHaveProperty('x', 10);
    expect(lastStep.stack[0].variables).toHaveProperty('y', 20);
    expect(lastStep.stack[0].variables).toHaveProperty('z', 30);
  }, 15000);

  it('should capture strings on heap', async () => {
    const code = `let name = "This is a very long string that should be stored in heap because it exceeds 50 characters limit";`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);
    expect(lastStep.heap[0].type).toBe('String');
    expect(lastStep.heap[0].content).toContain('This is a very long string');
  }, 15000);

  it('should capture arrays on heap', async () => {
    const code = `let arr = [1, 2, 3];`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);

    const arrayHeap = lastStep.heap.find((h) => h.type === 'Array');
    expect(arrayHeap).toBeDefined();
    expect(arrayHeap?.length).toBe(3);
  }, 15000);

  it('should capture function definitions', async () => {
    const code = `function add(a, b) {
    return a + b;
}

let x = 5;
let y = 10;
let total = add(x, y);`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    // Check that function is captured
    const stepWithFunction = result.steps!.find((s) =>
      s.stack[0]?.variables?.add
    );
    expect(stepWithFunction).toBeDefined();
    expect(stepWithFunction!.stack[0].variables.add.class).toBe('Function');
  }, 15000);

  it('should capture objects on heap', async () => {
    const code = `let obj = { name: "test", value: 42 };`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    const objectHeap = lastStep.heap.find((h) => h.type === 'Object');
    expect(objectHeap).toBeDefined();
    expect(objectHeap?.content).toContain('name');
    expect(objectHeap?.content).toContain('value');
  }, 15000);

  it('should return error for syntax errors', async () => {
    const code = `let x = 10;
let y = (20;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 15000);

  it('should reject dangerous code patterns', async () => {
    const code = `const fs = require('fs');
fs.readFileSync('/etc/passwd');`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('dangerous');
  }, 15000);

  it('should handle const and let declarations', async () => {
    const code = `const PI = 3.14;
let radius = 5;
let area = PI * radius * radius;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('PI', 3.14);
    expect(lastStep.stack[0].variables).toHaveProperty('radius', 5);
  }, 15000);

  it('should handle timeout for infinite loops', async () => {
    const code = `while (true) {}`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Time Limit Exceeded');
  }, 15000);

  it('should handle boolean values', async () => {
    const code = `let isActive = true;
let isDisabled = false;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('isActive', true);
    expect(lastStep.stack[0].variables).toHaveProperty('isDisabled', false);
  }, 15000);

  it('should handle null values', async () => {
    const code = `let empty = null;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('empty', null);
  }, 15000);

  // ===== Category 1: 기본 데이터 타입 =====
  describe('기본 데이터 타입', () => {
    it('should handle undefined values', async () => {
      const code = `let notDefined;
let explicitUndefined = undefined;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables).toHaveProperty('notDefined', undefined);
      expect(lastStep.stack[0].variables).toHaveProperty('explicitUndefined', undefined);
    }, 15000);

    it('should handle NaN values', async () => {
      const code = `let notANumber = NaN;
let computed = 0 / 0;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(Number.isNaN(lastStep.stack[0].variables.notANumber)).toBe(true);
      expect(Number.isNaN(lastStep.stack[0].variables.computed)).toBe(true);
    }, 15000);

    it('should handle Infinity values', async () => {
      const code = `let positiveInf = Infinity;
let negativeInf = -Infinity;
let computed = 1 / 0;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.positiveInf).toBe(Infinity);
      expect(lastStep.stack[0].variables.negativeInf).toBe(-Infinity);
      expect(lastStep.stack[0].variables.computed).toBe(Infinity);
    }, 15000);

    it('should handle BigInt values', async () => {
      const code = `let big = 9007199254740991n;
let computed = BigInt(123);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.big).toBeDefined();
      expect(lastStep.stack[0].variables.computed).toBeDefined();
    }, 15000);
  });

  // ===== Category 2: 조건문 =====
  describe('조건문', () => {
    it('should handle if/else statements', async () => {
      const code = `let x = 10;
let result;
if (x > 5) {
  result = "greater";
} else {
  result = "less";
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe("greater");
    }, 15000);

    it('should handle nested if statements', async () => {
      const code = `let x = 15;
let category;
if (x > 10) {
  if (x > 20) {
    category = "large";
  } else {
    category = "medium";
  }
} else {
  category = "small";
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.category).toBe("medium");
    }, 15000);

    it('should handle switch statements', async () => {
      const code = `let day = 2;
let dayName;
switch (day) {
  case 1:
    dayName = "Monday";
    break;
  case 2:
    dayName = "Tuesday";
    break;
  default:
    dayName = "Unknown";
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.dayName).toBe("Tuesday");
    }, 15000);

    it('should handle else if chains', async () => {
      const code = `let score = 75;
let grade;
if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else if (score >= 70) {
  grade = "C";
} else {
  grade = "F";
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.grade).toBe("C");
    }, 15000);
  });

  // ===== Category 3: 반복문 =====
  describe('반복문', () => {
    it('should handle for loops', async () => {
      const code = `let sum = 0;
for (let i = 1; i <= 5; i++) {
  sum += i;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(15);
    }, 15000);

    it('should handle while loops', async () => {
      const code = `let count = 0;
let total = 0;
while (count < 5) {
  total += count;
  count++;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.total).toBe(10);
      expect(lastStep.stack[0].variables.count).toBe(5);
    }, 15000);

    it('should handle do-while loops', async () => {
      const code = `let i = 0;
let sum = 0;
do {
  sum += i;
  i++;
} while (i < 3);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(3);
    }, 15000);

    it('should handle for...of loops', async () => {
      const code = `let arr = [1, 2, 3];
let sum = 0;
for (let num of arr) {
  sum += num;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(6);
    }, 15000);

    it('should handle for...in loops', async () => {
      const code = `let obj = { a: 1, b: 2, c: 3 };
let keys = [];
for (let key in obj) {
  keys.push(key);
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.keys).toBeDefined();
      const keysHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.keys.id);
      expect(keysHeap?.length).toBeGreaterThan(0);
    }, 15000);

    it('should handle break statements', async () => {
      const code = `let sum = 0;
for (let i = 0; i < 10; i++) {
  if (i === 5) break;
  sum += i;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(10);
    }, 15000);

    it('should handle continue statements', async () => {
      const code = `let sum = 0;
for (let i = 0; i < 5; i++) {
  if (i === 2) continue;
  sum += i;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(8);
    }, 15000);
  });

  // ===== Category 4: 함수 호출 스택 =====
  describe('함수 호출 스택', () => {
    it('should handle recursive functions', async () => {
      const code = `function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
let result = factorial(5);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(120);

      // Check stack depth during recursion
      const maxStackDepth = Math.max(...result.steps!.map(s => s.stack.length));
      expect(maxStackDepth).toBeGreaterThan(1);
    }, 15000);

    it('should handle arrow functions', async () => {
      const code = `const add = (a, b) => a + b;
const square = x => x * x;
let sum = add(3, 4);
let sq = square(5);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(7);
      expect(lastStep.stack[0].variables.sq).toBe(25);
    }, 15000);

    it('should handle IIFE (Immediately Invoked Function Expression)', async () => {
      const code = `let result = (function(x) {
  return x * 2;
})(10);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(20);
    }, 15000);

    it('should handle nested function calls', async () => {
      const code = `function outer(x) {
  function inner(y) {
    return y * 2;
  }
  return inner(x) + 5;
}
let result = outer(10);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(25);
    }, 15000);

    it('should track multiple function calls in sequence', async () => {
      const code = `function add(a, b) { return a + b; }
function multiply(a, b) { return a * b; }
let x = add(2, 3);
let y = multiply(4, 5);
let z = add(x, y);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.x).toBe(5);
      expect(lastStep.stack[0].variables.y).toBe(20);
      expect(lastStep.stack[0].variables.z).toBe(25);
    }, 15000);
  });

  // ===== Category 5: 객체 & 배열 고급 =====
  describe('객체 & 배열 고급', () => {
    it('should handle nested objects', async () => {
      const code = `let person = {
  name: "John",
  address: {
    city: "Seoul",
    zip: 12345
  }
};`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.heap.length).toBeGreaterThan(0);
      const personHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.person.id);
      expect(personHeap).toBeDefined();
    }, 15000);

    it('should handle nested arrays', async () => {
      const code = `let matrix = [[1, 2], [3, 4], [5, 6]];`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      const matrixHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.matrix.id);
      expect(matrixHeap?.type).toBe('Array');
    }, 15000);

    it('should handle property access', async () => {
      const code = `let obj = { x: 10, y: 20 };
let a = obj.x;
let b = obj["y"];`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe(10);
      expect(lastStep.stack[0].variables.b).toBe(20);
    }, 15000);

    it('should handle array push and pop', async () => {
      const code = `let arr = [1, 2, 3];
arr.push(4);
let last = arr.pop();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.last).toBe(4);
      const arrHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.arr.id);
      expect(arrHeap?.length).toBe(3);
    }, 15000);

    it('should handle array destructuring', async () => {
      const code = `let arr = [1, 2, 3];
let [a, b, c] = arr;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe(1);
      expect(lastStep.stack[0].variables.b).toBe(2);
      expect(lastStep.stack[0].variables.c).toBe(3);
    }, 15000);

    it('should handle object destructuring', async () => {
      const code = `let obj = { x: 10, y: 20 };
let { x, y } = obj;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.x).toBe(10);
      expect(lastStep.stack[0].variables.y).toBe(20);
    }, 15000);
  });

  // ===== Category 6: 스코프 & 클로저 =====
  describe('스코프 & 클로저', () => {
    it('should handle block scope with let', async () => {
      const code = `let x = 10;
{
  let x = 20;
  let y = 30;
}
let z = x;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.z).toBe(10);
    }, 15000);

    it('should handle function scope', async () => {
      const code = `function outer() {
  let x = 10;
  function inner() {
    let y = 20;
    return x + y;
  }
  return inner();
}
let result = outer();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(30);
    }, 15000);

    it('should handle closures', async () => {
      const code = `function makeCounter() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}
let counter = makeCounter();
let a = counter();
let b = counter();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe(1);
      expect(lastStep.stack[0].variables.b).toBe(2);
    }, 15000);

    it('should handle this binding in methods', async () => {
      const code = `let obj = {
  value: 42,
  getValue: function() {
    return this.value;
  }
};
let result = obj.getValue();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(42);
    }, 15000);
  });

  // ===== Category 7: 에러 처리 =====
  describe('에러 처리', () => {
    it('should handle try/catch blocks', async () => {
      const code = `let result;
try {
  let x = 10;
  result = x + 5;
} catch (e) {
  result = -1;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(15);
    }, 15000);

    it('should handle try/catch with errors', async () => {
      const code = `let result;
try {
  throw new Error("test error");
  result = 100;
} catch (e) {
  result = -1;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(-1);
    }, 15000);

    it('should handle finally blocks', async () => {
      const code = `let result = 0;
let cleanup = 0;
try {
  result = 10;
} finally {
  cleanup = 1;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(10);
      expect(lastStep.stack[0].variables.cleanup).toBe(1);
    }, 15000);

    it('should handle nested try/catch', async () => {
      const code = `let outer = 0;
let inner = 0;
try {
  try {
    throw new Error("inner");
  } catch (e) {
    inner = 1;
  }
  outer = 2;
} catch (e) {
  outer = -1;
}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.inner).toBe(1);
      expect(lastStep.stack[0].variables.outer).toBe(2);
    }, 15000);
  });

  // ===== Category 8: 연산자 =====
  describe('연산자', () => {
    it('should handle ternary operator', async () => {
      const code = `let x = 10;
let result = x > 5 ? "yes" : "no";`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe("yes");
    }, 15000);

    it('should handle logical operators (&&, ||)', async () => {
      const code = `let a = true && false;
let b = true || false;
let c = false || true;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe(false);
      expect(lastStep.stack[0].variables.b).toBe(true);
      expect(lastStep.stack[0].variables.c).toBe(true);
    }, 15000);

    it('should handle nullish coalescing operator (??)', async () => {
      const code = `let a = null ?? "default";
let b = undefined ?? "default";
let c = 0 ?? "default";`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe("default");
      expect(lastStep.stack[0].variables.b).toBe("default");
      expect(lastStep.stack[0].variables.c).toBe(0);
    }, 15000);

    it('should handle typeof operator', async () => {
      const code = `let a = typeof 42;
let b = typeof "hello";
let c = typeof true;
let d = typeof undefined;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.a).toBe("number");
      expect(lastStep.stack[0].variables.b).toBe("string");
      expect(lastStep.stack[0].variables.c).toBe("boolean");
      expect(lastStep.stack[0].variables.d).toBe("undefined");
    }, 15000);

    it('should handle spread operator', async () => {
      const code = `let arr1 = [1, 2, 3];
let arr2 = [...arr1, 4, 5];`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      const arr2Heap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.arr2.id);
      expect(arr2Heap?.length).toBe(5);
    }, 15000);
  });

  // ===== Category 9: 클래스 & OOP =====
  describe('클래스 & OOP', () => {
    it('should handle class definition and instantiation', async () => {
      const code = `class Person {
  constructor(name) {
    this.name = name;
  }
}
let person = new Person("John");`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.person).toBeDefined();
      const personHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.person.id);
      expect(personHeap).toBeDefined();
    }, 15000);

    it('should handle class methods', async () => {
      const code = `class Calculator {
  add(a, b) {
    return a + b;
  }
}
let calc = new Calculator();
let result = calc.add(5, 3);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe(8);
    }, 15000);

    it('should handle class with properties', async () => {
      const code = `class Counter {
  constructor() {
    this.count = 0;
  }
  increment() {
    this.count++;
  }
}
let counter = new Counter();
counter.increment();
counter.increment();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      const counterHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.counter.id);
      expect(counterHeap).toBeDefined();
    }, 15000);

    it('should handle class inheritance', async () => {
      const code = `class Animal {
  constructor(name) {
    this.name = name;
  }
}
class Dog extends Animal {
  constructor(name, breed) {
    super(name);
    this.breed = breed;
  }
}
let dog = new Dog("Max", "Labrador");`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      const dogHeap = lastStep.heap.find(h => h.id === lastStep.stack[0].variables.dog.id);
      expect(dogHeap).toBeDefined();
    }, 15000);
  });

  // ===== Category 10: 비동기 처리 =====
  describe('비동기 처리 (실험적)', () => {
    it('should handle Promise creation', async () => {
      const code = `let promise = new Promise((resolve, reject) => {
  resolve(42);
});`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.promise).toBeDefined();
    }, 15000);

    it('should handle async/await syntax', async () => {
      const code = `async function test() {
  return 42;
}
let result = test();`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBeDefined();
    }, 15000);

    it('should handle Promise.resolve', async () => {
      const code = `let p = Promise.resolve(100);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();

      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.p).toBeDefined();
    }, 15000);
  });
});
