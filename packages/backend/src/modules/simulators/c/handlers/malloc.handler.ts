/**
 * Malloc Handler
 * 동적 메모리 할당/해제 처리
 *
 * 처리하는 패턴:
 * - int *p = (int *)malloc(sizeof(int) * 5);
 * - int *p = malloc(20);
 * - free(p);
 */

import type { CodeHandler, SimContext, Step } from './types';

// 패턴 정의
const PATTERNS = {
  // int *p = (int *)malloc(...); 또는 int *p = malloc(...);
  MALLOC_DECL: /^int\s*\*\s*(\w+)\s*=\s*(?:\(int\s*\*\)\s*)?malloc\s*\((.+)\)/,
  // free(p);
  FREE_CALL: /^free\s*\(\s*(\w+)\s*\)/,
};

export const MallocHandler: CodeHandler = {
  name: 'malloc',
  priority: 30, // 높은 우선순위

  canHandle(code: string): boolean {
    return PATTERNS.MALLOC_DECL.test(code) || PATTERNS.FREE_CALL.test(code);
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // malloc
    const mallocDecl = code.match(PATTERNS.MALLOC_DECL);
    if (mallocDecl) {
      const sizeExpr = mallocDecl[2];
      const sizeMatch = sizeExpr.match(/sizeof\s*\(\s*int\s*\)\s*\*\s*(\d+)/);
      let size: number;
      if (sizeMatch) {
        size = 4 * parseInt(sizeMatch[1]);
      } else {
        size = parseInt(sizeExpr) || 20;
      }
      return handleMalloc(ctx, lineNum, code, mallocDecl[1], size);
    }

    // free
    const freeCall = code.match(PATTERNS.FREE_CALL);
    if (freeCall) {
      return handleFree(ctx, lineNum, code, freeCall[1]);
    }

    return null;
  },
};

// malloc 처리
function handleMalloc(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  size: number
): Step {
  const heapAddr = ctx.allocateHeap(size + 16); // 메타데이터 포함
  const ptrAddr = ctx.allocateStack(8);

  const bytesList = ctx.intToBytes(heapAddr, 8);
  const numElements = Math.floor(size / 4);

  ctx.variables.set(name, {
    address: ctx.toHex(ptrAddr),
    type: 'int *',
    size: 8,
    bytes: bytesList,
    value: ctx.toHex(heapAddr),
    points_to: ctx.toHex(heapAddr),
  });

  ctx.heapBlocks.set(name, {
    address: ctx.toHex(heapAddr),
    type: `int[${numElements}]`,
    size: size,
    bytes: new Array(size).fill(0),
    value: `[${numElements} elements]`,
    is_heap: true,
  });

  // Phase 4: malloc 이벤트
  if (ctx.addEvent && ctx.getCurrentFrame) {
    // 포인터 변수 선언
    ctx.addEvent({
      type: 'variable',
      action: 'declare',
      frame: ctx.getCurrentFrame(),
      name: name,
      varType: 'int *',
      value: ctx.toHex(heapAddr),
      address: ctx.toHex(ptrAddr),
      size: 8,
    });
    // 힙 할당
    ctx.addEvent({
      type: 'heap',
      action: 'allocate',
      address: ctx.toHex(heapAddr),
      size: size,
      name: name,
    });
  }

  const explanation = `🗄️ 동적 메모리 할당 (malloc)

• malloc(${size}) 호출
• 힙(Heap)에 ${size}바이트 공간 할당
• 할당된 주소: ${ctx.toHex(heapAddr)}

포인터 '${name}':
• 스택 주소: ${ctx.toHex(ptrAddr)}
• 저장된 값: ${ctx.toHex(heapAddr)} (힙 주소)

💡 스택 vs 힙:
   스택: 자동 할당/해제, 작은 크기
   힙: 수동 할당(malloc)/해제(free), 큰 크기 가능

⚠️ malloc 후에는 반드시 free()로 해제해야 메모리 누수 방지!`;

  return ctx.createStep(lineNum, code, explanation);
}

// free 처리
function handleFree(ctx: SimContext, lineNum: number, code: string, name: string): Step {
  const ptr = ctx.variables.get(name);
  const heap = ctx.heapBlocks.get(name);

  if (ptr && heap) {
    const heapAddr = ptr.points_to;
    ctx.heapBlocks.delete(name);

    // Phase 4: free 이벤트
    if (ctx.addEvent && ctx.getCurrentFrame) {
      ctx.addEvent({
        type: 'heap',
        action: 'free',
        address: heapAddr!,
        name: name,
      });
    }

    const explanation = `🗑️ 동적 메모리 해제 (free)

• free(${name}) 호출
• 힙 주소 ${heapAddr}의 메모리 해제
• 운영체제에 메모리 반환

⚠️ free 후 주의사항:
• 포인터 ${name}은 여전히 같은 주소를 가리킴 (댕글링 포인터!)
• free 후 ${name} = NULL; 권장
• 같은 메모리 두 번 free 금지 (double free 취약점)`;

    ptr.value = 'freed';
    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(
    lineNum,
    code,
    `'${name}'은 malloc으로 할당되지 않았거나 이미 해제됨`
  );
}

export default MallocHandler;
