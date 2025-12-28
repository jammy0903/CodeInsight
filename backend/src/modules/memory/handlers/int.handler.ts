/**
 * Int Handler
 * 정수 변수 선언 및 대입 처리
 *
 * 처리하는 패턴:
 * - int x = 5;
 * - int x;
 * - x = 10;
 */

import type { CodeHandler, SimContext, Step } from './types';

// 패턴 정의
const PATTERNS = {
  // int x = 5;
  INT_DECL_INIT: /^int\s+(\w+)\s*=\s*(-?\d+)$/,
  // int x;
  INT_DECL_ONLY: /^int\s+(\w+)\s*$/,
  // x = 10; (단, 배열이나 포인터가 아닌 경우)
  VAR_ASSIGN: /^(\w+)\s*=\s*(-?\d+)$/,
};

export const IntHandler: CodeHandler = {
  name: 'int',
  priority: 10, // 기본 우선순위

  canHandle(code: string): boolean {
    return (
      PATTERNS.INT_DECL_INIT.test(code) ||
      PATTERNS.INT_DECL_ONLY.test(code) ||
      PATTERNS.VAR_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // int x = 5;
    const declInit = code.match(PATTERNS.INT_DECL_INIT);
    if (declInit) {
      return handleIntDecl(ctx, lineNum, code, declInit[1], parseInt(declInit[2]));
    }

    // int x;
    const declOnly = code.match(PATTERNS.INT_DECL_ONLY);
    if (declOnly) {
      return handleIntDecl(ctx, lineNum, code, declOnly[1], null);
    }

    // x = 10;
    const varAssign = code.match(PATTERNS.VAR_ASSIGN);
    if (varAssign) {
      const varName = varAssign[1];
      // 이미 존재하는 변수인지 확인 (배열, 포인터 제외)
      const v = ctx.variables.get(varName);
      if (v && v.type === 'int') {
        return handleVarAssign(ctx, lineNum, code, varName, parseInt(varAssign[2]));
      }
      // 존재하지 않으면 이 핸들러가 처리하지 않음
      return null;
    }

    return null;
  },
};

// 정수 변수 선언
function handleIntDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  value: number | null
): Step {
  const addr = ctx.allocateStack(4);

  let bytesList: number[];
  let explanation: string;

  if (value !== null) {
    bytesList = ctx.intToBytes(value, 4);
    const bytesHex = bytesList
      .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
      .join(' ');

    explanation = `📦 정수 변수 '${name}' 선언 및 초기화

• 스택에 4바이트 공간 할당
• 주소: ${ctx.toHex(addr)}
• 값 ${value}를 리틀 엔디안으로 저장
• 바이트 순서: ${bytesHex} (역순!)

💡 리틀 엔디안: 작은 바이트가 앞에 옴
   5 = 0x00000005 → 메모리에 05 00 00 00으로 저장`;
  } else {
    value = 0;
    bytesList = [0, 0, 0, 0];
    explanation = `📦 정수 변수 '${name}' 선언 (초기화 안됨)

• 스택에 4바이트 공간 할당
• 주소: ${ctx.toHex(addr)}
• 값이 초기화되지 않아 쓰레기값 포함!

⚠️ 초기화 안 된 변수는 예측 불가능한 값을 가짐`;
  }

  ctx.variables.set(name, {
    address: ctx.toHex(addr),
    type: 'int',
    size: 4,
    bytes: bytesList,
    value: String(value),
  });

  return ctx.createStep(lineNum, code, explanation);
}

// 변수 값 대입
function handleVarAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  value: number
): Step {
  const v = ctx.variables.get(name);

  if (v) {
    const oldValue = v.value;
    v.value = String(value);
    v.bytes = ctx.intToBytes(value, 4);

    const explanation = `✏️ 변수 '${name}' 값 변경

• ${name} = ${value}
• 기존 값 ${oldValue} → 새 값 ${value}
• 메모리 주소 ${v.address}의 내용이 변경됨`;

    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(lineNum, code, `변수 '${name}'에 값 ${value} 대입`);
}

export default IntHandler;
