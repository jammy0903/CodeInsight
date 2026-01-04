/**
 * Array Handler
 * 배열 선언 및 접근 처리
 *
 * 처리하는 패턴:
 * - int arr[5] = {1, 2, 3, 4, 5};
 * - int arr[5];
 * - arr[0] = 10;
 */

import type { CodeHandler, SimContext, Step } from './types';

// 패턴 정의
const PATTERNS = {
  // int arr[5] = {1, 2, 3, 4, 5};
  ARRAY_INIT: /^int\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*\{([^}]+)\}/,
  // int arr[5];
  ARRAY_DECL: /^int\s+(\w+)\s*\[\s*(\d+)\s*\]/,
  // arr[0] = 10;
  ARRAY_ASSIGN: /^(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(-?\d+)/,
};

export const ArrayHandler: CodeHandler = {
  name: 'array',
  priority: 20, // int보다 높은 우선순위 (더 구체적)

  canHandle(code: string): boolean {
    return (
      PATTERNS.ARRAY_INIT.test(code) ||
      PATTERNS.ARRAY_DECL.test(code) ||
      PATTERNS.ARRAY_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // int arr[5] = {1, 2, 3, 4, 5};
    const arrInit = code.match(PATTERNS.ARRAY_INIT);
    if (arrInit) {
      const values = arrInit[3].split(',').map((v) => parseInt(v.trim()));
      return handleArrayDecl(ctx, lineNum, code, arrInit[1], parseInt(arrInit[2]), values);
    }

    // int arr[5];
    const arrDecl = code.match(PATTERNS.ARRAY_DECL);
    if (arrDecl) {
      return handleArrayDecl(ctx, lineNum, code, arrDecl[1], parseInt(arrDecl[2]), null);
    }

    // arr[0] = 10;
    const arrAssign = code.match(PATTERNS.ARRAY_ASSIGN);
    if (arrAssign) {
      const varName = arrAssign[1];
      const arr = ctx.variables.get(varName);
      // 배열인지 확인
      if (arr?.is_array) {
        return handleArrayAssign(
          ctx,
          lineNum,
          code,
          varName,
          parseInt(arrAssign[2]),
          parseInt(arrAssign[3])
        );
      }
    }

    return null;
  },
};

// 배열 선언
function handleArrayDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  size: number,
  values: number[] | null
): Step {
  const totalSize = 4 * size;
  const addr = ctx.allocateStack(totalSize);

  let bytesList: number[];
  let explanation: string;

  if (values) {
    bytesList = [];
    for (const v of values) {
      bytesList.push(...ctx.intToBytes(v, 4));
    }
    while (bytesList.length < totalSize) {
      bytesList.push(0);
    }

    const valuesStr = values.join(', ');
    explanation = `📚 배열 '${name}[${size}]' 선언 및 초기화

• 스택에 ${totalSize}바이트 연속 공간 할당 (int 4바이트 × ${size}개)
• 시작 주소: ${ctx.toHex(addr)}
• 초기값: {${valuesStr}}

💡 배열은 연속된 메모리 공간!
   ${name}[0] → ${ctx.toHex(addr)}
   ${name}[1] → ${ctx.toHex(addr - 4)}
   ${name}[2] → ${ctx.toHex(addr - 8)} ...

• 배열 이름 '${name}'은 첫 번째 요소의 주소 (${ctx.toHex(addr)})`;
  } else {
    bytesList = new Array(totalSize).fill(0);
    explanation = `📚 배열 '${name}[${size}]' 선언 (초기화 안됨)

• 스택에 ${totalSize}바이트 연속 공간 할당
• 시작 주소: ${ctx.toHex(addr)}
• 초기화 안됨 → 쓰레기값 포함!

⚠️ 배열도 초기화하지 않으면 예측 불가능한 값`;
  }

  ctx.variables.set(name, {
    address: ctx.toHex(addr),
    type: `int[${size}]`,
    size: totalSize,
    bytes: bytesList,
    value: `[${size} elements]`,
    is_array: true,
    array_size: size,
  });

  return ctx.createStep(lineNum, code, explanation);
}

// 배열 요소 대입
function handleArrayAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  index: number,
  value: number
): Step {
  const arr = ctx.variables.get(name);

  if (arr?.is_array) {
    const arrSize = arr.array_size || 0;
    const baseAddr = parseInt(arr.address, 16);
    const elemAddr = baseAddr - index * 4;

    let explanation: string;

    if (index >= 0 && index < arrSize) {
      const offset = index * 4;
      const newBytes = ctx.intToBytes(value, 4);
      arr.bytes.splice(offset, 4, ...newBytes);

      explanation = `✏️ 배열 요소 '${name}[${index}]' 값 변경

• ${name}[${index}] = ${value}
• 요소 주소: ${ctx.toHex(elemAddr)} (시작주소 - ${index}×4)
• 새 값: ${value}

💡 배열 인덱스 계산:
   주소 = 시작주소 + (인덱스 × 요소크기)
   ${ctx.toHex(elemAddr)} = ${arr.address} + (${index} × 4)`;
    } else {
      explanation = `⚠️ 배열 범위 초과!

• ${name}[${index}]에 접근 시도
• 배열 크기: ${arrSize} (유효 인덱스: 0~${arrSize - 1})
• 인덱스 ${index}는 범위 밖!

❌ 버퍼 오버플로우 - 보안 취약점의 주요 원인`;
    }

    return ctx.createStep(lineNum, code, explanation);
  }

  return ctx.createStep(lineNum, code, `배열 '${name}'을 찾을 수 없음`);
}

export default ArrayHandler;
