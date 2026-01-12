/**
 * Bitwise Handler
 * 비트 연산 시각화
 *
 * 처리하는 패턴:
 * - int c = a & b;  (AND)
 * - int c = a | b;  (OR)
 * - int c = a ^ b;  (XOR)
 * - int c = a << 2; (LEFT SHIFT)
 * - int c = a >> 2; (RIGHT SHIFT)
 * - int c = ~a;     (NOT)
 * - x = x & 0xF;    (대입)
 */

import type { CodeHandler, SimContext, Step } from './types';
import { cTypeRegistry } from '../types';

// 비트 연산 패턴
const PATTERNS = {
  // int c = a & b; (이항 연산)
  DECL_BINARY: /^(int|unsigned\s+int)\s+(\w+)\s*=\s*(\w+)\s*([&|^]|<<|>>)\s*(\w+|\d+)\s*$/,
  // int c = ~a; (단항 연산)
  DECL_UNARY: /^(int|unsigned\s+int)\s+(\w+)\s*=\s*~\s*(\w+)\s*$/,
  // x = x & 0xF; (대입 이항)
  ASSIGN_BINARY: /^(\w+)\s*=\s*(\w+)\s*([&|^]|<<|>>)\s*(\w+|\d+)\s*$/,
  // x = ~x; (대입 단항)
  ASSIGN_UNARY: /^(\w+)\s*=\s*~\s*(\w+)\s*$/,
};

// 연산자 이름 매핑
const OP_NAMES: Record<string, string> = {
  '&': 'AND',
  '|': 'OR',
  '^': 'XOR',
  '<<': 'LEFT SHIFT',
  '>>': 'RIGHT SHIFT',
  '~': 'NOT',
};

export const BitwiseHandler: CodeHandler = {
  name: 'bitwise',
  priority: 18, // VariableHandler보다 높음

  canHandle(code: string): boolean {
    return (
      PATTERNS.DECL_BINARY.test(code) ||
      PATTERNS.DECL_UNARY.test(code) ||
      PATTERNS.ASSIGN_BINARY.test(code) ||
      PATTERNS.ASSIGN_UNARY.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // int c = a & b;
    const declBinary = code.match(PATTERNS.DECL_BINARY);
    if (declBinary) {
      return handleBinaryDecl(
        ctx,
        lineNum,
        code,
        declBinary[1],
        declBinary[2],
        declBinary[3],
        declBinary[4],
        declBinary[5]
      );
    }

    // int c = ~a;
    const declUnary = code.match(PATTERNS.DECL_UNARY);
    if (declUnary) {
      return handleUnaryDecl(ctx, lineNum, code, declUnary[1], declUnary[2], declUnary[3]);
    }

    // x = x & 0xF;
    const assignBinary = code.match(PATTERNS.ASSIGN_BINARY);
    if (assignBinary) {
      return handleBinaryAssign(
        ctx,
        lineNum,
        code,
        assignBinary[1],
        assignBinary[2],
        assignBinary[3],
        assignBinary[4]
      );
    }

    // x = ~x;
    const assignUnary = code.match(PATTERNS.ASSIGN_UNARY);
    if (assignUnary) {
      return handleUnaryAssign(ctx, lineNum, code, assignUnary[1], assignUnary[2]);
    }

    return null;
  },
};

/**
 * 값을 숫자로 변환 (변수 참조 또는 리터럴)
 */
function getValue(ctx: SimContext, valueStr: string): number {
  // 16진수 리터럴
  if (/^0x[0-9a-fA-F]+$/i.test(valueStr)) {
    return parseInt(valueStr, 16);
  }
  // 10진수 리터럴
  if (/^-?\d+$/.test(valueStr)) {
    return parseInt(valueStr, 10);
  }
  // 변수 참조
  const v = ctx.variables.get(valueStr);
  if (v) {
    return parseInt(v.value, 10) || 0;
  }
  return 0;
}

/**
 * 숫자를 8비트 2진수 문자열로 변환
 */
function toBinary(n: number, bits = 8): string {
  const unsigned = n >>> 0;
  return unsigned.toString(2).padStart(bits, '0').slice(-bits);
}

/**
 * 이항 비트 연산 수행
 */
function performBinaryOp(left: number, op: string, right: number): number {
  switch (op) {
    case '&':
      return left & right;
    case '|':
      return left | right;
    case '^':
      return left ^ right;
    case '<<':
      return left << right;
    case '>>':
      return left >> right;
    default:
      return 0;
  }
}

/**
 * 비트 연산 시각화 생성
 */
function visualizeBinaryOp(left: number, op: string, right: number, result: number): string {
  const leftBin = toBinary(left);
  const rightBin = toBinary(right);
  const resultBin = toBinary(result);
  const opName = OP_NAMES[op] || op;

  if (op === '<<' || op === '>>') {
    return `📊 비트 ${opName} 시각화:

   ${left.toString().padStart(3)} = ${leftBin}
   ${op} ${right}
   ─────────────────
   ${result.toString().padStart(3)} = ${resultBin}

💡 ${op === '<<' ? '왼쪽으로' : '오른쪽으로'} ${right}비트 이동
   빈 자리는 0으로 채워짐`;
  }

  return `📊 비트 ${opName} 시각화:

       ${left.toString().padStart(3)} = ${leftBin}
   ${op}  ${right.toString().padStart(3)} = ${rightBin}
   ─────────────────────────
       ${result.toString().padStart(3)} = ${resultBin}

💡 각 비트를 개별적으로 ${opName} 연산`;
}

/**
 * 이항 비트 연산 선언
 */
function handleBinaryDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  typeName: string,
  varName: string,
  leftOp: string,
  op: string,
  rightOp: string
): Step {
  const left = getValue(ctx, leftOp);
  const right = getValue(ctx, rightOp);
  const result = performBinaryOp(left, op, right);
  const opName = OP_NAMES[op] || op;

  const normalizedType = typeName.replace(/\s+/g, ' ').trim();
  const typeInfo = cTypeRegistry.getType(normalizedType === 'unsigned int' ? 'unsigned int' : 'int');
  const size = typeInfo?.size || 4;
  const addr = ctx.allocateStack(size);
  const bytes = ctx.intToBytes(result, size);

  const visualization = visualizeBinaryOp(left, op, right, result);

  const explanation = `🔢 비트 연산: ${varName} = ${leftOp} ${op} ${rightOp}

${visualization}

• 결과: ${result} (0x${result.toString(16).toUpperCase()})
• 주소: ${ctx.toHex(addr)}`;

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: normalizedType,
    size,
    bytes,
    value: String(result),
  });

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 단항 비트 연산 (NOT)
 */
function handleUnaryDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  typeName: string,
  varName: string,
  operand: string
): Step {
  const value = getValue(ctx, operand);
  const result = ~value;

  const normalizedType = typeName.replace(/\s+/g, ' ').trim();
  const size = 4;
  const addr = ctx.allocateStack(size);
  const bytes = ctx.intToBytes(result, size);

  const valueBin = toBinary(value);
  const resultBin = toBinary(result);

  const explanation = `🔢 비트 NOT 연산: ${varName} = ~${operand}

📊 비트 NOT 시각화:

      ${value.toString().padStart(3)} = ${valueBin}
   ~  ─────────────────
      ${result.toString().padStart(3)} = ${resultBin}

💡 모든 비트 반전 (0↔1)
• 결과: ${result} (0x${(result >>> 0).toString(16).toUpperCase()})
• 주소: ${ctx.toHex(addr)}`;

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: normalizedType,
    size,
    bytes,
    value: String(result),
  });

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 이항 비트 연산 대입
 */
function handleBinaryAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  leftOp: string,
  op: string,
  rightOp: string
): Step {
  const v = ctx.variables.get(varName);
  if (!v) {
    return ctx.createStep(lineNum, code, `⚠️ 변수 '${varName}'를 찾을 수 없음`);
  }

  const left = getValue(ctx, leftOp);
  const right = getValue(ctx, rightOp);
  const result = performBinaryOp(left, op, right);
  const oldValue = v.value;

  v.value = String(result);
  v.bytes = ctx.intToBytes(result, v.size);

  const visualization = visualizeBinaryOp(left, op, right, result);

  const explanation = `🔢 비트 연산 대입: ${varName} = ${leftOp} ${op} ${rightOp}

${visualization}

• 이전 값: ${oldValue}
• 새 값: ${result} (0x${result.toString(16).toUpperCase()})`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 단항 비트 연산 대입
 */
function handleUnaryAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  operand: string
): Step {
  const v = ctx.variables.get(varName);
  if (!v) {
    return ctx.createStep(lineNum, code, `⚠️ 변수 '${varName}'를 찾을 수 없음`);
  }

  const value = getValue(ctx, operand);
  const result = ~value;
  const oldValue = v.value;

  v.value = String(result);
  v.bytes = ctx.intToBytes(result, v.size);

  const valueBin = toBinary(value);
  const resultBin = toBinary(result);

  const explanation = `🔢 비트 NOT 대입: ${varName} = ~${operand}

📊 비트 NOT 시각화:

      ${value.toString().padStart(3)} = ${valueBin}
   ~  ─────────────────
      ${result.toString().padStart(3)} = ${resultBin}

• 이전 값: ${oldValue}
• 새 값: ${result}`;

  return ctx.createStep(lineNum, code, explanation);
}

export default BitwiseHandler;
