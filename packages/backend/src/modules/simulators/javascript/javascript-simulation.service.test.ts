import {
  JavaScriptSimulationService,
  SimulationErrorCode,
} from './javascript-simulation.service';
import { spawnSync } from 'child_process';

type SuccessCase = {
  name: string;
  code: string;
  expectedLinesInOrder: number[];
  expectedStdoutIncludes?: string[];
};

type ErrorCase = {
  name: string;
  code: string;
  expectedCode: SimulationErrorCode;
};

function hasLinesInOrder(actualLines: number[], expectedLines: number[]): boolean {
  let cursor = 0;
  for (const line of actualLines) {
    if (line === expectedLines[cursor]) {
      cursor += 1;
      if (cursor === expectedLines.length) return true;
    }
  }
  return expectedLines.length === 0;
}

function collectStdout(steps: Array<{ stdout?: string }>): string {
  return steps
    .map((s) => s.stdout ?? '')
    .filter(Boolean)
    .join('\n');
}

describe('JavaScriptSimulationService Golden Cases', () => {
  process.env.JS_SIM_ENGINE = 'legacy';
  const probe = spawnSync('node', ['-v'], { encoding: 'utf8' });
  const canSpawnChildNode = !probe.error;
  const suite = canSpawnChildNode ? describe : describe.skip;

  const service = new JavaScriptSimulationService();

  const successCases: SuccessCase[] = [
    {
      name: 'variable assignment and print',
      code: 'let x = 1;\nx = x + 2;\nconsole.log(x);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['3'],
    },
    {
      name: 'const and arithmetic',
      code: 'const a = 1;\nconst b = 2;\nconst c = a + b;\nconsole.log(c);',
      expectedLinesInOrder: [1, 2, 3, 4],
      expectedStdoutIncludes: ['3'],
    },
    {
      name: 'function declaration and return',
      code: 'function add(a, b) { const s = a + b; return s; }\nconst r = add(2, 3);\nconsole.log(r);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['5'],
    },
    {
      name: 'block scope shadowing',
      code: 'let x = 1;\n{ let x = 2; console.log(x); }\nconsole.log(x);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['2', '1'],
    },
    {
      name: 'array push',
      code: 'const arr = [1, 2];\narr.push(3);\nconsole.log(arr.length);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['3'],
    },
    {
      name: 'object mutation',
      code: 'const user = { name: "A" };\nuser.age = 20;\nconsole.log(user.age);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['20'],
    },
    {
      name: 'for loop sum',
      code: 'let sum = 0;\nfor (let i = 1; i <= 3; i++) { sum += i; }\nconsole.log(sum);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['6'],
    },
    {
      name: 'while loop',
      code: 'let i = 0;\nwhile (i < 3) { i++; }\nconsole.log(i);',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['3'],
    },
    {
      name: 'if else',
      code: 'const x = 10;\nif (x > 5) { console.log("big"); } else { console.log("small"); }',
      expectedLinesInOrder: [1, 2],
      expectedStdoutIncludes: ['big'],
    },
    {
      name: 'switch case',
      code: 'const x = 2;\nswitch (x) { case 1: console.log("one"); break; case 2: console.log("two"); break; default: console.log("other"); }',
      expectedLinesInOrder: [1, 2],
      expectedStdoutIncludes: ['two'],
    },
    {
      name: 'try catch',
      code: 'try { throw new Error("x"); } catch (e) { console.log("caught"); }',
      expectedLinesInOrder: [1],
      expectedStdoutIncludes: ['caught'],
    },
    {
      name: 'class method call',
      code: 'class Person { constructor(name) { this.name = name; } greet() { return this.name; } }\nconst p = new Person("Kim");\nconsole.log(p.greet());',
      expectedLinesInOrder: [1, 2, 3],
      expectedStdoutIncludes: ['Kim'],
    },
    {
      name: 'promise then callback',
      code: 'Promise.resolve(1).then(v => { const x = v + 1; console.log(x); });',
      expectedLinesInOrder: [1],
      expectedStdoutIncludes: ['2'],
    },
    {
      name: 'async await basics',
      code: 'async function run() { const a = await Promise.resolve(3); console.log(a); }\nrun();',
      expectedLinesInOrder: [1, 2],
      expectedStdoutIncludes: ['3'],
    },
    {
      name: 'setTimeout callback',
      code: 'setTimeout(() => { const x = 7; console.log(x); }, 0);',
      expectedLinesInOrder: [1],
      expectedStdoutIncludes: ['7'],
    },
    {
      name: 'microtask before macrotask',
      code: 'setTimeout(() => console.log("t1"), 0);\nPromise.resolve().then(() => console.log("m1"));',
      expectedLinesInOrder: [1, 2],
      expectedStdoutIncludes: ['m1', 't1'],
    },
    {
      name: 'setTimeout order by delay',
      code: 'setTimeout(() => console.log("A"), 0);\nsetTimeout(() => console.log("B"), 5);',
      expectedLinesInOrder: [1, 2],
      expectedStdoutIncludes: ['A', 'B'],
    },
  ];

  const errorCases: ErrorCase[] = [
    {
      name: 'syntax error',
      code: 'function () {',
      expectedCode: SimulationErrorCode.SYNTAX_ERROR,
    },
    {
      name: 'dangerous code',
      code: 'require("fs");',
      expectedCode: SimulationErrorCode.DANGEROUS_CODE,
    },
    {
      name: 'code too long',
      code: `const x = "${'a'.repeat(10001)}";`,
      expectedCode: SimulationErrorCode.CODE_TOO_LONG,
    },
  ];

  suite('success cases (17)', () => {
    it.each(successCases)('$name', async (testCase) => {
      const result = await service.simulate(testCase.code);

      expect(result.success).toBe(true);
      expect(result.engine).toBe('legacy');
      expect(result.error).toBeUndefined();
      expect(result.steps).toBeDefined();
      expect(result.meta).toBeDefined();

      const steps = result.steps ?? [];
      expect(steps.length).toBeGreaterThan(0);
      expect(result.meta?.stepCount).toBe(steps.length);

      const lines = testCase.code.split('\n');
      for (const step of steps) {
        expect(step.line).toBeGreaterThanOrEqual(1);
        expect(step.line).toBeLessThanOrEqual(lines.length);
      }

      const stepLines = steps.map((s) => s.line);
      expect(hasLinesInOrder(stepLines, testCase.expectedLinesInOrder)).toBe(true);

      if (testCase.expectedStdoutIncludes?.length) {
        const stdout = collectStdout(steps);
        for (const expected of testCase.expectedStdoutIncludes) {
          expect(stdout).toContain(expected);
        }
      }
    });
  });

  suite('error cases (3)', () => {
    it.each(errorCases)('$name', async (testCase) => {
      const result = await service.simulate(testCase.code);

      expect(result.success).toBe(false);
      expect(result.engine).toBe('legacy');
      expect(result.steps).toEqual([]);
      expect(result.error?.code).toBe(testCase.expectedCode);
      expect(result.error?.message).toBeTruthy();
      expect(result.meta?.stepCount).toBe(0);
    });
  });
});
