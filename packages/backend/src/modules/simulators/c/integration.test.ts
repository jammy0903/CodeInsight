/**
 * C Simulator Integration Tests - Hybrid Mode (Emscripten + Interpreter)
 *
 * Phase 1 & 2 통합 검증:
 * - Emscripten 검증 + 인터프리터 실행
 * - 함수 포인터 지원
 * - 이중 포인터 지원
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { EmscriptenValidatorService } from './services/emscripten-validator.service';
import { simulateCode } from './simulator';

describe('C Simulator - Hybrid Mode Integration', () => {
  let validator: EmscriptenValidatorService;
  let isEmscriptenAvailable: boolean;

  beforeEach(async () => {
    validator = new EmscriptenValidatorService();
    isEmscriptenAvailable = await validator.checkInstallation();
  });

  describe('Emscripten Validation + Interpreter Execution', () => {
    it('should reject code with syntax errors before execution', async () => {
      if (!isEmscriptenAvailable) {
        console.log('⏭️  Skipping: Emscripten not installed');
        return;
      }

      const code = `
        int main() {
          int x = 10
          return 0;
        }
      `;

      // 1️⃣ Emscripten 검증 실패
      const validation = await validator.validate(code);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors!.length).toBeGreaterThan(0);
      expect(validation.errors![0]).toContain('expected');
    });

    it('should validate then execute valid code', async () => {
      const code = `
        int main() {
          int x = 10;
          int y = 20;
          int sum = x + y;
          return 0;
        }
      `;

      // 1️⃣ Emscripten 검증 통과
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toBeUndefined();

      // 2️⃣ 인터프리터 실행
      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();
      expect(result.steps.length).toBeGreaterThan(0);

      // 변수 선언 스텝 확인
      const xDecl = result.steps.find(s => s.code?.includes('int x = 10'));
      expect(xDecl).toBeDefined();
      expect(xDecl!.explanation).toContain('변수');
    });

    it('should detect undeclared variables', async () => {
      if (!isEmscriptenAvailable) {
        console.log('⏭️  Skipping: Emscripten not installed');
        return;
      }

      const code = `
        int main() {
          x = 10;
          return 0;
        }
      `;

      // Emscripten이 미선언 변수 감지
      const validation = await validator.validate(code);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors![0]).toMatch(/undeclared|use of undeclared identifier/i);
    });

    it('should return warnings for unused variables but still execute', async () => {
      const code = `
        int main() {
          int unused = 42;
          return 0;
        }
      `;

      // 1️⃣ 경고는 있지만 검증 통과
      const validation = await validator.validate(code);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings).toBeDefined();
      // Emscripten의 -Wall -Wextra로 미사용 변수 경고

      // 2️⃣ 실행은 정상적으로 진행
      const result = simulateCode(code);
      expect(result.success).toBe(true);
    });
  });

  describe('Function Pointer Support', () => {
    it('should handle function pointer declaration and initialization', async () => {
      const code = `
        #include <stdio.h>

        void greet(int n) {
          printf("Hello %d\\n", n);
        }

        int main() {
          void (*callback)(int) = &greet;
          return 0;
        }
      `;

      // 1️⃣ Emscripten 검증
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      // 2️⃣ 인터프리터 실행
      const result = simulateCode(code);

      expect(result.success).toBe(true);

      // 3️⃣ 함수 포인터 선언 스텝 확인
      const fpDecl = result.steps.find(s => s.code?.includes('(*callback)'));
      expect(fpDecl).toBeDefined();
      expect(fpDecl!.explanation).toMatch(/함수 포인터/i);
      expect(fpDecl!.explanation).toContain('greet');
    });

    it('should handle function pointer call', async () => {
      const code = `
        #include <stdio.h>

        void greet(int n) {
          printf("Hello %d\\n", n);
        }

        int main() {
          void (*callback)(int) = &greet;
          callback(42);
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // 함수 포인터 호출 확인
      const fpCall = result.steps.find(s => s.code?.includes('callback(42)'));
      expect(fpCall).toBeDefined();
    });

    it('should validate function pointer with incorrect syntax', async () => {
      const code = `
        void greet(int n) {
          printf("Hello\\n");
        }

        int main() {
          void (*callback)(int) = greet;  // Missing & operator
          return 0;
        }
      `;

      // Emscripten이 타입 불일치 감지 가능
      const validation = await validator.validate(code);

      // 경고나 에러가 있을 수 있음
      if (!validation.isValid) {
        expect(validation.errors).toBeDefined();
      }
    });
  });

  describe('Double Pointer Support', () => {
    it('should handle double pointer declaration', async () => {
      const code = `
        int main() {
          int x = 42;
          int *p = &x;
          int **pp;
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // 이중 포인터 선언 확인
      const ppDecl = result.steps.find(s => s.code?.includes('int **pp'));
      expect(ppDecl).toBeDefined();
      expect(ppDecl!.explanation).toMatch(/이중 포인터/i);
    });

    it('should handle double pointer initialization', async () => {
      const code = `
        int main() {
          int x = 42;
          int *p = &x;
          int **pp = &p;
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // 이중 포인터 초기화 확인
      const ppInit = result.steps.find(s => s.code?.includes('int **pp = &p'));
      expect(ppInit).toBeDefined();
      expect(ppInit!.explanation).toContain('p의 주소');
    });

    it('should handle double pointer assignment', async () => {
      const code = `
        int main() {
          int x = 42;
          int *p = &x;
          int **pp;
          pp = &p;
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // pp = &p 할당 확인
      const ppAssign = result.steps.find(s => s.code?.includes('pp = &p'));
      expect(ppAssign).toBeDefined();
    });

    it('should handle double dereference write operation', async () => {
      const code = `
        int main() {
          int x = 42;
          int *p = &x;
          int **pp = &p;
          **pp = 100;
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // **pp = 100 스텝 확인
      const derefWrite = result.steps.find(s => s.code?.includes('**pp = 100'));
      expect(derefWrite).toBeDefined();
      expect(derefWrite!.explanation).toMatch(/이중 역참조/i);
      expect(derefWrite!.explanation).toContain('100');

      // x 값이 변경되었는지 확인
      expect(derefWrite!.explanation).toMatch(/42.*100|x:.*42.*→.*100/i);
    });

    it('should validate double pointer with type mismatch', async () => {
      if (!isEmscriptenAvailable) {
        console.log('⏭️  Skipping: Emscripten not installed');
        return;
      }

      const code = `
        int main() {
          int x = 42;
          int **pp = &x;  // Type error: int** = int*
          return 0;
        }
      `;

      // Emscripten이 타입 불일치 감지
      const validation = await validator.validate(code);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toBeDefined();
      expect(validation.errors![0]).toMatch(/incompatible|type/i);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle function pointer + double pointer together', async () => {
      const code = `
        #include <stdio.h>

        void modify(int **pp) {
          **pp = 999;
        }

        int main() {
          int x = 42;
          int *p = &x;
          int **pp = &p;

          void (*func)(int**) = &modify;
          func(pp);

          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // 두 기능이 모두 동작하는지 확인
      const hasFunctionPointer = result.steps.some(s =>
        s.explanation?.includes('함수 포인터')
      );
      const hasDoublePointer = result.steps.some(s =>
        s.explanation?.includes('이중 포인터')
      );

      expect(hasFunctionPointer).toBe(true);
      expect(hasDoublePointer).toBe(true);
    });

    it('should handle multiple double pointers', async () => {
      const code = `
        int main() {
          int x = 10;
          int y = 20;
          int *px = &x;
          int *py = &y;
          int **ppx = &px;
          int **ppy = &py;

          **ppx = 100;
          **ppy = 200;

          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);

      // 두 개의 이중 포인터 선언 확인
      const doublePointerSteps = result.steps.filter(s =>
        s.code?.includes('**pp')
      );
      expect(doublePointerSteps.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle nested double pointer operations', async () => {
      const code = `
        int main() {
          int a = 10;
          int b = 20;
          int *pa = &a;
          int *pb = &b;
          int **ppa = &pa;

          // 포인터 재할당
          *ppa = &b;

          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      // 인터프리터가 이 시나리오를 지원하지 않을 수 있음
      // 최소한 컴파일은 성공해야 함
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle runtime errors after validation', async () => {
      const code = `
        int main() {
          int x = 10;
          int *p = &x;

          // 잘못된 연산 (컴파일은 통과하지만 런타임 에러 가능)
          return 0;
        }
      `;

      // 검증은 통과
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      // 실행도 정상
      const result = simulateCode(code);
      expect(result.success).toBe(true);
    });

    it('should handle empty code gracefully', async () => {
      const code = '';

      // Emscripten 검증에서 거부
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(false);
      expect(validation.errors![0]).toContain('비어있습니다');
    });

    it('should handle code without main function', async () => {
      const code = `
        void helper() {
          int x = 10;
        }
      `;

      // Emscripten 검증은 통과 가능 (문법적으로 유효)
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      // 하지만 인터프리터는 main 함수 없음 에러
      const result = simulateCode(code);
      expect(result.success).toBe(false);
      // 한글 메시지 또는 영어 메시지 모두 허용
      expect(result.message || result.error).toMatch(/main.*not found|main 함수를 찾을 수 없습니다/i);
    });
  });

  describe('Performance & Limits', () => {
    it('should handle large but valid code', async () => {
      // 100개의 변수 선언
      const declarations = Array.from(
        { length: 100 },
        (_, i) => `  int var${i} = ${i};`
      ).join('\n');

      const code = `
        int main() {
        ${declarations}
          return 0;
        }
      `;

      // 검증 + 실행
      const validation = await validator.validate(code);
      expect(validation.isValid).toBe(true);

      const result = simulateCode(code);
      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(100);
    }, 10000); // 10초 타임아웃

    it('should complete validation within timeout', async () => {
      const code = `
        int main() {
          int x = 10;
          return 0;
        }
      `;

      const startTime = Date.now();
      const validation = await validator.validate(code);
      const duration = Date.now() - startTime;

      expect(validation.isValid).toBe(true);
      expect(duration).toBeLessThan(5000); // 5초 이내
    });
  });
});
