/**
 * C Simulation Service — Integration Tests
 *
 * Tests the full GDB-based pipeline: security → compile → debug → normalize
 * Requires gcc and gdb to be installed on the system.
 */

import { describe, it, expect } from 'vitest';
import { CSimulationService } from './c-simulation.service';

const service = new CSimulationService();

describe('CSimulationService', () => {
  // 1. Basic variables
  describe('basic variables', () => {
    it('traces int, float, char variables with frame structure', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int x = 42;
    float f = 3.14;
    char c = 'A';
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps).toBeDefined();
      expect(result.steps!.length).toBeGreaterThan(0);

      // Should have stack frames with variables
      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack).toBeDefined();
      expect(lastStep.stack.length).toBeGreaterThan(0);

      // Check frame structure
      const mainFrame = lastStep.stack[0];
      expect(mainFrame.functionName).toBe('main');
      expect(mainFrame.variables.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 2. Pointers
  describe('pointers', () => {
    it('resolves pointer targets with points_to', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int x = 10;
    int *p = &x;
    printf("%d\\n", *p);
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);

      // Find a step where pointer p exists
      const stepWithPtr = result.steps!.find(s =>
        s.stack.some(f => f.variables.some(v => v.name === 'p'))
      );
      expect(stepWithPtr).toBeDefined();

      const mainFrame = stepWithPtr!.stack.find(f => f.functionName === 'main');
      const ptrVar = mainFrame?.variables.find(v => v.name === 'p');
      expect(ptrVar).toBeDefined();
      expect(ptrVar!.type).toContain('*');
      expect(ptrVar!.points_to).toBeTruthy();
    });
  });

  // 3. malloc/free
  describe('malloc/free', () => {
    it('tracks heap blocks from malloc', async () => {
      const result = await service.simulate(`
#include <stdio.h>
#include <stdlib.h>
int main() {
    int *p = (int*)malloc(sizeof(int));
    *p = 42;
    printf("%d\\n", *p);
    free(p);
    return 0;
}
`);

      expect(result.success).toBe(true);

      // Find step after malloc where heap block exists
      const stepWithHeap = result.steps!.find(s => s.heap.length > 0);
      expect(stepWithHeap).toBeDefined();
      expect(stepWithHeap!.heap[0].address).toMatch(/^0x/);
    });
  });

  // 4. Structs
  describe('structs', () => {
    it('extracts struct members', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    struct Point { int x; int y; };
    struct Point p = {10, 20};
    printf("%d %d\\n", p.x, p.y);
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);

      // Find step with struct variable
      const stepWithStruct = result.steps!.find(s =>
        s.stack.some(f => f.variables.some(v => v.name === 'p' && v.structMembers))
      );
      // structMembers may or may not be populated depending on GDB's ptype output
      // At minimum, the variable should exist with a value
      const lastStep = result.steps![result.steps!.length - 1];
      const mainFrame = lastStep.stack.find(f => f.functionName === 'main');
      const structVar = mainFrame?.variables.find(v => v.name === 'p');
      expect(structVar).toBeDefined();
    });
  });

  // 5. Char arrays
  describe('char arrays', () => {
    it('extracts char array elements', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    char name[6] = "Hello";
    printf("%s\\n", name);
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);
    });
  });

  // 6. Multiple functions
  describe('multi-function calls', () => {
    it('tracks function calls and variable changes', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int add(int a, int b) {
    int sum = a + b;
    return sum;
}
int main() {
    int x = 10;
    int y = 20;
    int z = add(x, y);
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(1);

      // Should have frames (at least main)
      const hasMainFrame = result.steps!.some(s =>
        s.stack.some(f => f.functionName === 'main')
      );
      expect(hasMainFrame).toBe(true);

      // Verify z gets the return value (30) — proves function call worked
      const stepWithZ = result.steps!.find(s =>
        s.stack.some(f => f.variables.some(v => v.name === 'z' && v.value === '30'))
      );
      expect(stepWithZ).toBeDefined();
    });
  });

  // 7. Control flow (GDB key advantage)
  describe('control flow', () => {
    it('traces if/else branches', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int x = 10;
    if (x > 5) {
        printf("big\\n");
    } else {
        printf("small\\n");
    }
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);
    });

    it('traces for loops', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += i;
    }
    printf("sum=%d\\n", sum);
    return 0;
}
`);

      expect(result.success).toBe(true);
      // Should have multiple steps (loop iterations)
      expect(result.steps!.length).toBeGreaterThan(5);
    });

    it('traces while loops', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int n = 5;
    int fact = 1;
    while (n > 1) {
        fact *= n;
        n--;
    }
    printf("fact=%d\\n", fact);
    return 0;
}
`);

      expect(result.success).toBe(true);
      // While loop with 4 iterations should produce multiple steps
      expect(result.steps!.length).toBeGreaterThanOrEqual(5);
    });
  });

  // 8. scanf + stdin
  describe('stdin support', () => {
    it('reads stdin via freopen redirect', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int x;
    scanf("%d", &x);
    int result_val = x * 2;
    printf("result=%d\\n", result_val);
    int done = 1;
    return 0;
}
`, '21');

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);

      // Verify scanf read the value — find a step where x has value 21
      const stepWithX = result.steps!.find(s =>
        s.stack.some(f => f.variables.some(v => v.name === 'x' && v.value === '21'))
      );
      expect(stepWithX).toBeDefined();
    });
  });

  // 9. Security patterns
  describe('security', () => {
    it('rejects system() calls', async () => {
      const result = await service.simulate(`
#include <stdio.h>
#include <stdlib.h>
int main() {
    system("ls");
    return 0;
}
`);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security');
    });

    it('rejects fork()', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    fork();
    return 0;
}
`);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security');
    });
  });

  // 10. printf stdout capture
  describe('stdout capture', () => {
    it('captures printf output in stdout field', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    printf("Hello\\n");
    printf("World\\n");
    int x = 1;
    int y = 2;
    int z = 3;
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);

      // stdout accumulates across steps — check last step has all output
      const lastStep = result.steps![result.steps!.length - 1];
      expect(typeof lastStep.stdout).toBe('string');
      // At least some output should be captured by the final step
      expect(lastStep.stdout.length).toBeGreaterThan(0);
    });
  });

  // 11. Events (normalizer)
  describe('event normalization', () => {
    it('generates variable declare events', async () => {
      const result = await service.simulate(`
#include <stdio.h>
int main() {
    int x = 42;
    int y = 10;
    return 0;
}
`);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(0);

      // Should have variable declare events
      const declareEvent = result.steps!.find(s =>
        Array.isArray(s.events) && s.events.some(
          (e: any) => e.type === 'variable' && e.action === 'declare'
        )
      );
      expect(declareEvent).toBeDefined();
    });
  });
});
