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

    // Phase 4: 포인터 선언 이벤트
    if (ctx.addEvent && ctx.getCurrentFrame) {
      // 변수 선언 이벤트
      ctx.addEvent({
        type: 'variable',
        action: 'declare',
        frame: ctx.getCurrentFrame(),
        name: ptrName,
        varType: 'int *',
        value: target.address,
        address: ctx.toHex(addr),
        size: 8,
      });
      // 포인터 할당 이벤트
      ctx.addEvent({
        type: 'pointer',
        action: 'assign',
        frame: ctx.getCurrentFrame(),
        pointer: ptrName,
        targetAddress: target.address,
        targetName: targetName,
      });
    }

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
 * @returns 변수 이름만 반환 (현재 스코프 기준)
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
 * Phase 5: 크로스 프레임 변수 찾기 (포인터 역참조용)
 * 모든 프레임에서 해당 주소를 가진 변수를 찾고, 프레임 정보도 반환
 * @returns { frameName, variableName, variable } 또는 null
 */
function findTargetVariableCrossFrame(
  ctx: SimContext,
  ptr: { points_to?: string | null }
): { frameName: string; variableName: string; variable: { value: string; bytes: number[] } } | null {
  if (!ptr?.points_to) return null;

  // Phase 5: 크로스 프레임 검색 시도
  if (ctx.findVariableByAddress) {
    const result = ctx.findVariableByAddress(ptr.points_to);
    if (result) {
      return {
        frameName: result.frameName,
        variableName: result.variableName,
        variable: result.variable,
      };
    }
  }

  // 폴백: 현재 스코프에서만 검색
  for (const [name, v] of ctx.variables) {
    if (v.address === ptr.points_to) {
      const currentFrame = ctx.getCurrentFrame?.() || 'global';
      return {
        frameName: currentFrame,
        variableName: name,
        variable: v,
      };
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

  // Phase 5: 크로스 프레임 지원
  const targetInfo = findTargetVariableCrossFrame(ctx, ptr || {});

  if (targetInfo && ptr) {
    const { frameName: targetFrame, variableName: targetVar, variable: target } = targetInfo;
    const currentFrame = ctx.getCurrentFrame?.() || 'global';
    const oldValue = target.value;
    target.value = String(value);
    target.bytes = ctx.intToBytes(value, 4);

    // Phase 4+5: 포인터 역참조 쓰기 이벤트 (크로스 프레임 지원)
    if (ctx.addEvent && ctx.getCurrentFrame) {
      const isCrossFrame = targetFrame !== currentFrame;
      ctx.addEvent({
        type: 'pointer',
        action: 'deref_write',
        frame: currentFrame,
        pointer: ptrName,
        targetAddress: ptr.points_to!,
        targetFrame: isCrossFrame ? targetFrame : undefined, // Phase 5: 크로스 프레임일 때만 포함
        targetName: targetVar,
        value: value,
        previousValue: parseFloat(oldValue) || 0,
      });
    }

    const currentFrameName = ctx.getCurrentFrame?.() || 'global';
    const crossFrameNote = targetFrame !== currentFrameName
      ? `\n\n🔥 크로스 프레임 수정! '${currentFrameName}'에서 '${targetFrame}'의 변수를 변경`
      : '';

    const explanation = `✏️ 포인터를 통한 간접 수정!

• *${ptrName} = ${value}
• ${ptrName}이 가리키는 주소(${ptr.points_to})의 값을 수정
• 실제로 '${targetVar}'의 값이 ${oldValue} → ${value}로 변경됨!${crossFrameNote}

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

  // Phase 5: 크로스 프레임 지원
  const destInfo = findTargetVariableCrossFrame(ctx, destPtr || {});
  const srcInfo = findTargetVariableCrossFrame(ctx, srcPtr || {});

  if (destInfo && srcInfo && destPtr && srcPtr) {
    const { frameName: destFrame, variableName: destVar, variable: destTarget } = destInfo;
    const { frameName: srcFrame, variableName: srcVar, variable: srcTarget } = srcInfo;
    const currentFrame = ctx.getCurrentFrame?.() || 'global';

    const oldValue = destTarget.value;
    const newValue = srcTarget.value;

    destTarget.value = newValue;
    destTarget.bytes = ctx.intToBytes(parseInt(newValue), 4);

    // Phase 4+5: 포인터 역참조 읽기 + 쓰기 이벤트 (크로스 프레임 지원)
    if (ctx.addEvent && ctx.getCurrentFrame) {
      const isSrcCrossFrame = srcFrame !== currentFrame;
      const isDestCrossFrame = destFrame !== currentFrame;

      // 소스 포인터 역참조 읽기
      ctx.addEvent({
        type: 'pointer',
        action: 'deref_read',
        frame: currentFrame,
        pointer: srcPtrName,
        targetAddress: srcPtr.points_to!,
        targetFrame: isSrcCrossFrame ? srcFrame : undefined, // Phase 5
        targetName: srcVar,
        value: parseFloat(newValue) || 0,
      });
      // 대상 포인터 역참조 쓰기
      ctx.addEvent({
        type: 'pointer',
        action: 'deref_write',
        frame: currentFrame,
        pointer: destPtrName,
        targetAddress: destPtr.points_to!,
        targetFrame: isDestCrossFrame ? destFrame : undefined, // Phase 5
        targetName: destVar,
        value: parseFloat(newValue) || 0,
        previousValue: parseFloat(oldValue) || 0,
      });
    }

    // 크로스 프레임 설명 추가
    const crossFrameDetails: string[] = [];
    if (srcFrame !== currentFrame) {
      crossFrameDetails.push(`'${srcVar}'는 '${srcFrame}' 프레임에 있음`);
    }
    if (destFrame !== currentFrame) {
      crossFrameDetails.push(`'${destVar}'는 '${destFrame}' 프레임에 있음`);
    }
    const crossFrameNote = crossFrameDetails.length > 0
      ? `\n\n🔥 크로스 프레임 접근!\n   ${crossFrameDetails.join('\n   ')}`
      : '';

    const explanation = `✏️ 포인터를 통한 값 복사!

• *${destPtrName} = *${srcPtrName}
• ${srcPtrName}이 가리키는 값(${srcTarget.value})을
  ${destPtrName}이 가리키는 곳에 복사
• '${destVar}': ${oldValue} → ${newValue}${crossFrameNote}

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

  // Phase 5: 크로스 프레임 지원
  const destInfo = findTargetVariableCrossFrame(ctx, ptr || {});

  if (destInfo && srcVar && ptr) {
    const { frameName: destFrame, variableName: destVar, variable: destTarget } = destInfo;
    const currentFrame = ctx.getCurrentFrame?.() || 'global';

    const oldValue = destTarget.value;
    const newValue = srcVar.value;

    destTarget.value = newValue;
    destTarget.bytes = ctx.intToBytes(parseInt(newValue), 4);

    // Phase 4+5: 포인터 역참조 쓰기 이벤트 (크로스 프레임 지원)
    if (ctx.addEvent && ctx.getCurrentFrame) {
      const isCrossFrame = destFrame !== currentFrame;
      ctx.addEvent({
        type: 'pointer',
        action: 'deref_write',
        frame: currentFrame,
        pointer: ptrName,
        targetAddress: ptr.points_to!,
        targetFrame: isCrossFrame ? destFrame : undefined, // Phase 5
        targetName: destVar,
        value: parseFloat(newValue) || 0,
        previousValue: parseFloat(oldValue) || 0,
      });
    }

    const crossFrameNote = destFrame !== currentFrame
      ? `\n\n🔥 크로스 프레임 수정! '${currentFrame}'에서 '${destFrame}'의 변수를 변경`
      : '';

    const explanation = `✏️ 포인터를 통한 값 저장!

• *${ptrName} = ${varName}
• ${varName}의 값(${srcVar.value})을
  ${ptrName}이 가리키는 곳에 저장
• '${destVar}': ${oldValue} → ${newValue}${crossFrameNote}

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

      // Phase 4: 힙 쓰기 이벤트
      if (ctx.addEvent && ctx.getCurrentFrame) {
        ctx.addEvent({
          type: 'heap',
          action: 'write',
          address: ctx.toHex(elemAddr),
          size: 4,
          value: value,
          name: `${name}[${index}]`,
        });
      }

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
