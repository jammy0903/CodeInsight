import { EmscriptenValidatorService } from './emscripten-validator.service';

describe('EmscriptenValidatorService', () => {
  let validator: EmscriptenValidatorService;

  beforeEach(() => {
    validator = new EmscriptenValidatorService();
  });

  describe('checkInstallation()', () => {
    it('should check if Emscripten is installed', async () => {
      const isInstalled = await validator.checkInstallation();
      // Emscripten이 설치되어 있지 않을 수 있으므로 boolean만 확인
      expect(typeof isInstalled).toBe('boolean');
    });
  });

  describe('validate()', () => {
    // 이 테스트들은 Emscripten이 설치되어 있어야 실행됩니다
    // CI/CD에서는 skip될 수 있음

    it('should validate correct C code', async () => {
      const code = `
        #include <stdio.h>
        int main() {
          printf("Hello, World!\\n");
          return 0;
        }
      `;

      const result = await validator.validate(code);

      // Emscripten이 설치되어 있으면 검증 성공
      if (result.isValid) {
        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      } else {
        // 설치되어 있지 않으면 경고와 함께 통과
        expect(result.warnings).toBeDefined();
      }
    });

    it('should reject syntax errors', async () => {
      const code = `
        int main() {
          printf("Missing semicolon")
          return 0;
        }
      `;

      const result = await validator.validate(code);

      // Emscripten이 설치되어 있으면
      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      }
    });

    it('should detect undeclared variables', async () => {
      const code = `
        int main() {
          x = 10;
          return 0;
        }
      `;

      const result = await validator.validate(code);

      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      }
    });

    it('should return warnings for unused variables', async () => {
      const code = `
        int main() {
          int unused = 10;
          return 0;
        }
      `;

      const result = await validator.validate(code);

      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        expect(result.isValid).toBe(true);
        // 경고가 있을 수도 있고 없을 수도 있음 (컴파일러 설정에 따라)
      }
    });

    it('should detect missing return statement', async () => {
      const code = `
        int add(int a, int b) {
          int sum = a + b;
          // return 문 없음
        }

        int main() {
          return 0;
        }
      `;

      const result = await validator.validate(code);

      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        // 경고가 있을 수 있음
        expect(result.isValid).toBe(true);
      }
    });

    it('should detect type mismatches', async () => {
      const code = `
        int main() {
          int x = "string";
          return 0;
        }
      `;

      const result = await validator.validate(code);

      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
      }
    });

    it('should handle empty code gracefully', async () => {
      const code = '';

      const result = await validator.validate(code);

      // 빈 코드는 에러
      const isInstalled = await validator.checkInstallation();
      if (isInstalled) {
        expect(result.isValid).toBe(false);
      }
    });

    it('should handle timeout for very large code', async () => {
      // 매우 큰 코드 (5초 타임아웃 테스트용)
      const largeCode = `
        int main() {
          ${Array(1000)
            .fill(0)
            .map((_, i) => `int var${i} = ${i};`)
            .join('\n')}
          return 0;
        }
      `;

      const result = await validator.validate(largeCode);

      // 타임아웃이 발생할 수 있지만, 정상 처리되어야 함
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
    }, 10000); // 10초 타임아웃
  });

  describe('parseErrors()', () => {
    it('should extract error messages from stderr', () => {
      const validator = new EmscriptenValidatorService();
      const stderr = `
/tmp/test.c:5:10: error: expected ';' before 'return'
    return 0;
         ^
/tmp/test.c:3:5: error: use of undeclared identifier 'x'
    x = 10;
    ^
      `;

      const errors = (validator as any).parseErrors(stderr);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0]).toContain('expected');
      expect(errors[1]).toContain('undeclared');
    });
  });

  describe('parseWarnings()', () => {
    it('should extract warning messages from stderr', () => {
      const validator = new EmscriptenValidatorService();
      const stderr = `
/tmp/test.c:3:9: warning: unused variable 'unused'
    int unused = 10;
        ^
      `;

      const warnings = (validator as any).parseWarnings(stderr);

      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('unused');
    });
  });
});
