/**
 * Pointer Handler
 * 포인터 선언 및 역참조 처리
 *
 * 처리하는 패턴:
 * - int *p = &x;
 * - *p = 10;
 * - p[i] = value; (힙 메모리 접근)
 */

import type { CodeHandler, SimContext, Step } from './types';

// 패턴 정의
const PATTERNS = {
  // int *p = &x;
  PTR_DECL: /^int\s*\*\s*(\w+)\s*=\s*&(\w+)/,
  // *p = 10; (숫자 리터럴)
  PTR_ASSIGN_LITERAL: /^\*(\w+)\s*=\s*(-?\d+)$/,
  // *p = *q; (포인터 역참조)
  PTR_ASSIGN_DEREF: /^\*(\w+)\s*=\s*\*(\w+)$/,
  // *p = var; (변수)
  PTR_ASSIGN_VAR: /^\*(\w+)\s*=\s*(\w+)$/,
  // p[i] = value; (포인터 인덱스 접근)
  PTR_INDEX_ASSIGN: /^(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)/,
};

export const PointerHandler: CodeHandler = {
  name: 'pointer',
  priority: 25, // array보다 높음 (p[i]와 arr[i] 구분 필요)

  canHandle(code: string): boolean {
    // PTR_INDEX_ASSIGN은 배열과 겹치므로 변수 타입 확인 필요
    // canHandle에서는 패턴만 체크하고, handle에서 타입 검증
    return (
      PATTERNS.PTR_DECL.test(code) ||
      PATTERNS.PTR_ASSIGN_LITERAL.test(code) ||
      PATTERNS.PTR_ASSIGN_DEREF.test(code) ||
      PATTERNS.PTR_ASSIGN_VAR.test(code) ||
      PATTERNS.PTR_INDEX_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // int *p = &x;
    const ptrDecl = code.match(PATTERNS.PTR_DECL);
    if (ptrDecl) {
      return handlePtrDecl(ctx, lineNum, code, ptrDecl[1], ptrDecl[2]);
    }

    // *p = 10; (숫자 리터럴)
    const ptrAssignLiteral = code.match(PATTERNS.PTR_ASSIGN_LITERAL);
    if (ptrAssignLiteral) {
      return handlePtrAssignValue(ctx, lineNum, code, ptrAssignLiteral[1], parseInt(ptrAssignLiteral[2]));
    }

    // *p = *q; (포인터 역참조)
    const ptrAssignDeref = code.match(PATTERNS.PTR_ASSIGN_DEREF);
    if (ptrAssignDeref) {
      return handlePtrAssignDeref(ctx, lineNum, code, ptrAssignDeref[1], ptrAssignDeref[2]);
    }

    // *p = var; (변수) - 가장 일반적인 패턴이므로 마지막에
    const ptrAssignVar = code.match(PATTERNS.PTR_ASSIGN_VAR);
    if (ptrAssignVar) {
      // 숫자인지 확인 (리터럴 패턴에서 이미 처리됨)
      if (/^\d+$/.test(ptrAssignVar[2])) {
        return null; // 리터럴 패턴으로 이미 처리됨
      }
      return handlePtrAssignFromVar(ctx, lineNum, code, ptrAssignVar[1], ptrAssignVar[2]);
    }

    // p[i] = value;
    const ptrIdxAssign = code.match(PATTERNS.PTR_INDEX_ASSIGN);
    if (ptrIdxAssign) {
      const varName = ptrIdxAssign[1];
      const ptr = ctx.variables.get(varName);
      // 포인터인지 확인 (배열이 아닌 경우)
      if (ptr && ptr.type === 'int *' && !ptr.is_array) {
        return handlePtrIndexAssign(
          ctx,
          lineNum,
          code,
          varName,
          parseInt(ptrIdxAssign[2]),
          parseInt(ptrIdxAssign[3])
        );
      }
      // 배열이면 null 반환하여 array handler가 처리하도록
      return null;
    }

    return null;
  },
};

// 포인터 선언
function handlePtrDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  ptrName: string,
  targetName: string
): Step {
  const addr = ctx.allocateStack(8); // 64비트 포인터
  const target = ctx.variables.get(targetName);

  if (target) {
    const targetAddrInt = parseInt(target.address, 16);
    const bytesList = ctx.intToBytes(targetAddrInt, 8);

    const explanation = `🔗 포인터 '${ptrName}' 선언 - '${targetName}'의 주소 저장

• 포인터도 변수! 스택에 8바이트 공간 할당 (64비트 주소)
• 포인터 주소: ${ctx.toHex(addr)}
• 저장된 값: ${target.address} ('${targetName}'의 주소)

💡 포인터 = 다른 변수의 주소를 저장하는 변수
   ${ptrName} ──→ ${targetName} (${target.value})
                  (${target.address})`;

    ctx.variables.set(ptrName, {
      address: ctx.toHex(addr),
      type: 'int *',
      size: 8,
      bytes: bytesList,
      value: target.address,
      points_to: target.address,
    });

    return ctx.createStep(lineNum, code, explanation);
  }

  // 타겟 변수가 없는 경우
  ctx.variables.set(ptrName, {
    address: ctx.toHex(addr),
    type: 'int *',
    size: 8,
    bytes: new Array(8).fill(0),
    value: '0x0',
    points_to: '0x0',
  });

  return ctx.createStep(lineNum, code, '❌ 포인터가 존재하지 않는 변수를 가리킴');
}

/**
 * 포인터가 가리키는 변수 찾기 (헬퍼)
 */
function findTargetVariable(ctx: SimContext, ptr: { points_to?: string | null }): string | null {
  if (!ptr?.points_to) return null;

  for (const [name, v] of ctx.variables) {
    if (v.address === ptr.points_to) {
      return name;
    }
  }
  return null;
}

/**
 * 포인터 역참조 대입 - 숫자 리터럴
 * *p = 10;
 */
function handlePtrAssignValue(
  ctx: SimContext,
  lineNum: number,
  code: string,
  ptrName: string,
  value: number
): Step {
  const ptr = ctx.variables.get(ptrName);
  const targetVar = findTargetVariable(ctx, ptr || {});

  if (targetVar && ptr) {
    const target = ctx.variables.get(targetVar)!;
    const oldValue = target.value;
    target.value = String(value);
    target.bytes = ctx.intToBytes(value, 4);

    const explanation = `✏️ 포인터를 통한 간접 수정!

• *${ptrName} = ${value}
• ${ptrName}이 가리키는 주소(${ptr.points_to})의 값을 수정
• 실제로 '${targetVar}'의 값이 ${oldValue} → ${value}로 변경됨!

💡 포인터 역참조(*): 포인터가 가리키는 메모리에 접근`;

    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(lineNum, code, '포인터 역참조');
}

/**
 * 포인터 역참조 대입 - 다른 포인터 역참조
 * *a = *b;
 */
function handlePtrAssignDeref(
  ctx: SimContext,
  lineNum: number,
  code: string,
  destPtrName: string,
  srcPtrName: string
): Step {
  const destPtr = ctx.variables.get(destPtrName);
  const srcPtr = ctx.variables.get(srcPtrName);

  const destVar = findTargetVariable(ctx, destPtr || {});
  const srcVar = findTargetVariable(ctx, srcPtr || {});

  if (destVar && srcVar && destPtr && srcPtr) {
    const destTarget = ctx.variables.get(destVar)!;
    const srcTarget = ctx.variables.get(srcVar)!;

    const oldValue = destTarget.value;
    const newValue = srcTarget.value;

    destTarget.value = newValue;
    destTarget.bytes = ctx.intToBytes(parseInt(newValue), 4);

    const explanation = `✏️ 포인터를 통한 값 복사!

• *${destPtrName} = *${srcPtrName}
• ${srcPtrName}이 가리키는 값(${srcTarget.value})을
  ${destPtrName}이 가리키는 곳에 복사
• '${destVar}': ${oldValue} → ${newValue}

💡 *${srcPtrName}은 '${srcVar}'의 값(${srcTarget.value})
   *${destPtrName}은 '${destVar}'를 가리킴`;

    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(lineNum, code, '포인터 역참조 복사');
}

/**
 * 포인터 역참조 대입 - 변수값
 * *b = temp;
 */
function handlePtrAssignFromVar(
  ctx: SimContext,
  lineNum: number,
  code: string,
  ptrName: string,
  varName: string
): Step {
  const ptr = ctx.variables.get(ptrName);
  const srcVar = ctx.variables.get(varName);
  const destVar = findTargetVariable(ctx, ptr || {});

  if (destVar && srcVar && ptr) {
    const destTarget = ctx.variables.get(destVar)!;

    const oldValue = destTarget.value;
    const newValue = srcVar.value;

    destTarget.value = newValue;
    destTarget.bytes = ctx.intToBytes(parseInt(newValue), 4);

    const explanation = `✏️ 포인터를 통한 값 저장!

• *${ptrName} = ${varName}
• ${varName}의 값(${srcVar.value})을
  ${ptrName}이 가리키는 곳에 저장
• '${destVar}': ${oldValue} → ${newValue}

💡 포인터 역참조로 원본 변수를 수정!`;

    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(lineNum, code, '포인터 역참조 대입');
}

// 포인터 인덱스 접근 (힙)
function handlePtrIndexAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  index: number,
  value: number
): Step {
  const ptr = ctx.variables.get(name);
  const heap = ctx.heapBlocks.get(name);

  if (ptr && heap) {
    const offset = index * 4;
    if (offset + 4 <= heap.size) {
      const newBytes = ctx.intToBytes(value, 4);
      heap.bytes.splice(offset, 4, ...newBytes);

      const baseAddr = parseInt(ptr.points_to!, 16);
      const elemAddr = baseAddr + offset;

      const explanation = `✏️ 힙 메모리 접근: ${name}[${index}] = ${value}

• 포인터 ${name}이 가리키는 힙 영역에 접근
• 요소 주소: ${ctx.toHex(elemAddr)}
• 계산: ${ptr.points_to} + (${index} × 4) = ${ctx.toHex(elemAddr)}
• 값 ${value} 저장

💡 p[i]는 *(p + i)와 동일!
   포인터 산술: 주소 + (인덱스 × sizeof(타입))`;

      return ctx.createStep(lineNum, code, explanation);
    }
    return ctx.createStep(lineNum, code, '⚠️ 힙 버퍼 오버플로우! 할당 범위 초과');
  }

  if (ptr) {
    return ctx.createStep(lineNum, code, `'${name}'은 힙을 가리키지 않음`);
  }

  return ctx.createStep(lineNum, code, `포인터 '${name}'을 찾을 수 없음`);
}

export default PointerHandler;
