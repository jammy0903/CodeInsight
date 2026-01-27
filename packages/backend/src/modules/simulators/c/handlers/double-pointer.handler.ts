/**
 * Double Pointer Handler
 * 이중 포인터 선언, 할당, 역참조 처리
 *
 * 지원 패턴:
 * - int **pp;
 * - int **pp = &p;
 * - **pp = 42;
 * - int x = **pp;
 */

import type { CodeHandler, SimContext, Step, Variable } from './types';

// 패턴 정의
const PATTERNS = {
  // int **pp;
  DOUBLE_PTR_DECL: /^(\w+)\s+\*\*\s*(\w+)\s*;?$/,
  // int **pp = &p;
  DOUBLE_PTR_INIT: /^(\w+)\s+\*\*\s*(\w+)\s*=\s*&(\w+)\s*;?$/,
  // pp = &p;
  DOUBLE_PTR_ASSIGN: /^(\w+)\s*=\s*&(\w+)\s*;?$/,
  // **pp = value;
  DOUBLE_DEREF_ASSIGN: /^\*\*(\w+)\s*=\s*(.+)\s*;?$/,
};

export const DoublePointerHandler: CodeHandler = {
  name: 'double-pointer',
  priority: 26, // PointerHandler(25)보다 높음

  canHandle(code: string): boolean {
    return (
      PATTERNS.DOUBLE_PTR_DECL.test(code) ||
      PATTERNS.DOUBLE_PTR_INIT.test(code) ||
      PATTERNS.DOUBLE_DEREF_ASSIGN.test(code) ||
      // pp = &p도 일단 체크 (handle에서 타입 확인)
      PATTERNS.DOUBLE_PTR_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // 1. int **pp;
    const declMatch = code.match(PATTERNS.DOUBLE_PTR_DECL);
    if (declMatch) {
      return handleDoubleDecl(ctx, lineNum, code, declMatch[1], declMatch[2]);
    }

    // 2. int **pp = &p;
    const initMatch = code.match(PATTERNS.DOUBLE_PTR_INIT);
    if (initMatch) {
      return handleDoubleInit(ctx, lineNum, code, initMatch[1], initMatch[2], initMatch[3]);
    }

    // 3. pp = &p;
    const assignMatch = code.match(PATTERNS.DOUBLE_PTR_ASSIGN);
    if (assignMatch) {
      const ppName = assignMatch[1];
      const pp = ctx.variables.get(ppName);
      // 이중 포인터인지 확인
      if (pp && pp.type && pp.type.includes('**')) {
        return handleDoubleAssign(ctx, lineNum, code, assignMatch[1], assignMatch[2]);
      }
      // 이중 포인터가 아니면 다른 핸들러가 처리하도록
      return null;
    }

    // 4. **pp = value;
    const derefMatch = code.match(PATTERNS.DOUBLE_DEREF_ASSIGN);
    if (derefMatch) {
      return handleDoubleDeref(ctx, lineNum, code, derefMatch[1], derefMatch[2]);
    }

    return null;
  },
};

/**
 * 이중 포인터 선언: int **pp;
 */
function handleDoubleDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  baseType: string,
  varName: string
): Step {
  const address = ctx.allocateStack(8); // 포인터 크기

  ctx.variables.set(varName, {
    address: ctx.toHex(address),
    type: `${baseType} **`,
    size: 8,
    bytes: [0, 0, 0, 0, 0, 0, 0, 0], // NULL 포인터
    value: '0x0', // 초기화되지 않음 (NULL)
  });

  const explanation = `🔗🔗 이중 포인터 선언: ${varName}

📌 ${varName}는 포인터의 포인터입니다.
   타입: ${baseType} **
   주소: ${ctx.toHex(address)}
   값: 0 (NULL, 초기화되지 않음)

💡 이중 포인터란?
   • 포인터 변수의 주소를 저장하는 포인터
   • *${varName} → 첫 번째 포인터의 값
   • **${varName} → 최종 데이터 값

⚡ 메모리 구조:
   ${varName} → [포인터 주소] → [데이터 값]

⚠️ 사용하기 전에 반드시 초기화해야 합니다!
   예: ${varName} = &p; (p는 포인터)`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 이중 포인터 초기화: int **pp = &p;
 */
function handleDoubleInit(
  ctx: SimContext,
  lineNum: number,
  code: string,
  baseType: string,
  ppName: string,
  pName: string
): Step {
  const p = ctx.variables.get(pName);
  if (!p) {
    throw new Error(`Variable '${pName}' not found`);
  }

  const address = ctx.allocateStack(8);

  ctx.variables.set(ppName, {
    address: ctx.toHex(address),
    type: `${baseType} **`,
    size: 8,
    bytes: ctx.intToBytes(parseInt(p.address.replace('0x', ''), 16), 8),
    value: p.address, // p의 주소를 값으로 저장
    points_to: p.address, // 메타데이터
  });

  const explanation = `🔗🔗 이중 포인터 초기화: ${ppName} = &${pName}

📌 ${ppName}이 ${pName}의 주소를 가리킵니다.

메모리 상태:
   ${ppName}(${ctx.toHex(address)}) → ${p.address} (${pName}의 주소)
   ${pName}(${p.address}) → ${p.points_to || p.value}

💡 포인터 체인:
   • ${ppName} : 이중 포인터 변수
   • *${ppName} : ${pName}의 값 (주소)
   • **${ppName} : ${pName}이 가리키는 데이터

⚡ 이제 **${ppName}로 최종 데이터에 접근 가능합니다!`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 이중 포인터 할당: pp = &p;
 */
function handleDoubleAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  ppName: string,
  pName: string
): Step {
  const pp = ctx.variables.get(ppName);
  const p = ctx.variables.get(pName);

  if (!pp) {
    throw new Error(`Variable '${ppName}' not found`);
  }
  if (!p) {
    throw new Error(`Variable '${pName}' not found`);
  }

  // pp에 p의 주소 저장
  pp.value = p.address;
  pp.points_to = p.address;
  pp.bytes = ctx.intToBytes(parseInt(p.address.replace('0x', ''), 16), 8);

  const explanation = `🔗 이중 포인터 할당: ${ppName} = &${pName}

📌 ${ppName}이 이제 ${pName}의 주소를 가리킵니다.

메모리 업데이트:
   ${ppName}(${pp.address}) → ${p.address} (${pName}의 주소)
   ${pName}(${p.address}) → ${p.points_to || p.value}

💡 포인터 체인 재설정:
   • ${ppName} 변수의 값이 ${p.address}로 변경됨
   • **${ppName}로 ${pName}이 가리키는 데이터에 접근

⚡ 변경 사항:
   Before: ${ppName} → (이전 값)
   After:  ${ppName} → ${p.address}`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 이중 역참조 할당: **pp = value;
 */
function handleDoubleDeref(
  ctx: SimContext,
  lineNum: number,
  code: string,
  ppName: string,
  valueExpr: string
): Step {
  const pp = ctx.variables.get(ppName);
  if (!pp) {
    throw new Error(`${ppName} not found. Available vars: ${Array.from(ctx.variables.keys()).join(', ')}`);
  }
  if (!pp.points_to) {
    throw new Error(`${ppName} is not properly initialized. Type: ${pp.type}, Value: ${pp.value}, points_to: ${pp.points_to}`);
  }

  // 1단계: *pp → 첫 번째 포인터 찾기
  let firstPtr: Variable | undefined;
  let firstPtrName: string | undefined;
  for (const [name, v] of ctx.variables) {
    if (v.address === pp.points_to) {
      firstPtr = v;
      firstPtrName = name;
      break;
    }
  }

  if (!firstPtr || !firstPtrName) {
    throw new Error(`Invalid pointer dereference: *${ppName}`);
  }

  // 2단계: **pp → 최종 변수 찾기
  let finalVar: Variable | undefined;
  let finalVarName: string | undefined;
  if (firstPtr.points_to) {
    for (const [name, v] of ctx.variables) {
      if (v.address === firstPtr.points_to) {
        finalVar = v;
        finalVarName = name;
        break;
      }
    }
  }

  // 값 평가
  const newValue = valueExpr;

  // 최종 변수 값 업데이트
  if (finalVar && finalVarName) {
    const oldValue = finalVar.value;
    finalVar.value = newValue;

    const explanation = `🔍🔍 이중 역참조 할당: **${ppName} = ${newValue}

📌 포인터 체인을 따라 최종 변수 값을 변경합니다.

역참조 과정:
   1단계: *${ppName} → ${firstPtrName} (주소: ${firstPtr.address})
   2단계: **${ppName} → ${finalVarName} (주소: ${finalVar.address})

메모리 업데이트:
   ${finalVarName}: ${oldValue} → ${newValue}

💡 이중 역참조의 힘:
   • ${ppName}이 가리키는 포인터(${firstPtrName})를
   • 한 번 더 역참조하여 최종 변수(${finalVarName})에 접근
   • 간접적으로 값을 변경!

⚡ 체인 추적:
   ${ppName} → ${firstPtr.address} → ${finalVar.address} → ${newValue}`;

    return ctx.createStep(lineNum, code, explanation);
  } else {
    // 첫 번째 포인터가 직접 값을 가지는 경우
    const oldValue = firstPtr.value;
    firstPtr.value = newValue;

    const explanation = `🔍🔍 이중 역참조 할당: **${ppName} = ${newValue}

📌 포인터 체인을 따라 값을 변경합니다.

역참조 과정:
   1단계: *${ppName} → ${firstPtrName}
   2단계: **${ppName} → ${firstPtr.value}

메모리 업데이트:
   ${firstPtrName}: ${oldValue} → ${newValue}

💡 결과: **${ppName} = ${newValue}`;

    return ctx.createStep(lineNum, code, explanation);
  }
}

export default DoublePointerHandler;
