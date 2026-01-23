/**
 * 메모리 시뮬레이터 테스트
 *
 * 테스트 전략:
 * 1. 기본 변수 선언 및 초기화
 * 2. 포인터 연산
 * 3. malloc/free 동적 메모리
 * 4. 배열 처리
 * 5. printf/scanf I/O
 */

import { describe, it, expect } from 'vitest';
import { simulateCode } from './simulator';

describe('Memory Simulator', () => {
  describe('기본 변수 선언', () => {
    it('int 변수 선언 및 초기화', () => {
      const code = `
int main() {
  int x = 10;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);

      const varStep = result.steps.find(s => s.code.includes('int x'));
      expect(varStep).toBeDefined();
      if (varStep) {
        expect(varStep.explanation).toBeTruthy();
      }
    });

    it('여러 변수 선언', () => {
      const code = `
int main() {
  int a = 5;
  int b = 10;
  int c = a + b;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('포인터 연산', () => {
    it('포인터 선언 및 초기화', () => {
      const code = `
int main() {
  int x = 42;
  int *p = &x;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);

      const pointerStep = result.steps.find(s => s.code.includes('*p'));
      if (pointerStep) {
        expect(pointerStep.explanation).toBeTruthy();
      }
    });

    it('포인터 역참조', () => {
      const code = `
int main() {
  int x = 100;
  int *p = &x;
  int y = *p;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('동적 메모리 할당', () => {
    it('malloc 테스트', () => {
      const code = `
int main() {
  int *p = malloc(sizeof(int));
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);

      const mallocStep = result.steps.find(s => s.code.includes('malloc'));
      expect(mallocStep).toBeDefined();
    });

    it('malloc + free 테스트', () => {
      const code = `
int main() {
  int *p = malloc(sizeof(int));
  free(p);
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);

      const freeStep = result.steps.find(s => s.code.includes('free'));
      expect(freeStep).toBeDefined();
    });
  });

  describe('배열 처리', () => {
    it('배열 선언', () => {
      const code = `
int main() {
  int arr[5] = {1, 2, 3, 4, 5};
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
    });
  });

  describe('I/O 처리', () => {
    it('printf 테스트', () => {
      const code = `
int main() {
  int x = 42;
  printf("%d", x);
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);

      const printfStep = result.steps.find(s => s.code.includes('printf'));
      expect(printfStep).toBeDefined();
    });

    it('scanf 테스트', () => {
      const code = `
int main() {
  int x;
  scanf("%d", &x);
  return 0;
}`;

      const result = simulateCode(code, '100');

      expect(result.success).toBe(true);

      const scanfStep = result.steps.find(s => s.code.includes('scanf'));
      expect(scanfStep).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('빈 main 함수', () => {
      const code = `
int main() {
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(0);
    });

    it('주석 무시', () => {
      const code = `
int main() {
  // 이것은 주석입니다
  int x = 10;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('빈 줄 무시', () => {
      const code = `
int main() {
  int x = 10;

  int y = 20;
  return 0;
}`;

      const result = simulateCode(code);

      expect(result.success).toBe(true);
      expect(result.steps.length).toBeGreaterThanOrEqual(2);
    });

    it('에러 처리 - 빈 코드', () => {
      const result = simulateCode('');
      expect(result.success).toBe(false);
      expect(result.message).toBeTruthy();
    });
  });
});
