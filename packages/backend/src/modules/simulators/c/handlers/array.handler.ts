/**
 * Array Handler
 * 모든 타입의 배열 선언 및 접근 처리
 *
 * 지원 패턴:
 * - int arr[5] = {1, 2, 3, 4, 5};
 * - float arr[3] = {1.5, 2.5, 3.5};
 * - char arr[4] = {'a', 'b', 'c', 'd'};
 * - double arr[2];
 * - arr[0] = 10;
 */

import type { CodeHandler, SimContext, Step } from './types';
import { cTypeRegistry, type TypeInfo } from '../types';

// 패턴 정의 (모든 타입 지원)
const PATTERNS = {
  // type arr[5] = {values};
  ARRAY_INIT: /^(unsigned\s+)?(\w+(?:\s+\w+)?)\s+(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*\{([^}]+)\}/,
  // type arr[5];
  ARRAY_DECL: /^(unsigned\s+)?(\w+(?:\s+\w+)?)\s+(\w+)\s*\[\s*(\d+)\s*\]\s*;?\s*$/,
  // arr[0] = value;
  ARRAY_ASSIGN: /^(\w+)\s*\[\s*(\d+)\s*\]\s*=\s*(.+?)\s*;?\s*$/,
};

export const ArrayHandler: CodeHandler = {
  name: 'array',
  priority: 20, // VariableHandler보다 높은 우선순위

  canHandle(code: string): boolean {
    return (
      PATTERNS.ARRAY_INIT.test(code) ||
      PATTERNS.ARRAY_DECL.test(code) ||
      PATTERNS.ARRAY_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // type arr[5] = {values};
    const arrInit = code.match(PATTERNS.ARRAY_INIT);
    if (arrInit) {
      const unsigned = arrInit[1]?.trim() || '';
      const baseType = arrInit[2].trim();
      const fullType = unsigned ? `${unsigned}${baseType}` : baseType;
      const name = arrInit[3];
      const size = parseInt(arrInit[4]);
      const valuesStr = arrInit[5];

      return handleArrayDecl(ctx, lineNum, code, fullType, name, size, valuesStr);
    }

    // type arr[5];
    const arrDecl = code.match(PATTERNS.ARRAY_DECL);
    if (arrDecl) {
      const unsigned = arrDecl[1]?.trim() || '';
      const baseType = arrDecl[2].trim();
      const fullType = unsigned ? `${unsigned}${baseType}` : baseType;
      const name = arrDecl[3];
      const size = parseInt(arrDecl[4]);

      return handleArrayDecl(ctx, lineNum, code, fullType, name, size, null);
    }

    // arr[0] = value;
    const arrAssign = code.match(PATTERNS.ARRAY_ASSIGN);
    if (arrAssign) {
      const varName = arrAssign[1];
      const arr = ctx.variables.get(varName);
      if (arr?.is_array) {
        return handleArrayAssign(ctx, lineNum, code, varName, parseInt(arrAssign[2]), arrAssign[3]);
      }
    }

    return null;
  },
};

/**
 * 값 문자열을 파싱
 */
function parseValue(valueStr: string, typeInfo: TypeInfo): number {
  const trimmed = valueStr.trim();

  // char 타입: 'a' 형태
  if (typeInfo.category === 'char') {
    const charMatch = trimmed.match(/^'(.)'$/);
    if (charMatch) {
      return charMatch[1].charCodeAt(0);
    }
    // 숫자로도 가능 (ASCII)
    return parseInt(trimmed);
  }

  // float/double: 3.14, 1.5f 형태
  if (typeInfo.category === 'float') {
    return parseFloat(trimmed.replace(/f$/i, ''));
  }

  // 정수 타입
  return parseInt(trimmed);
}

/**
 * 배열 선언
 */
function handleArrayDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  typeName: string,
  name: string,
  size: number,
  valuesStr: string | null
): Step {
  const typeInfo = cTypeRegistry.getType(typeName);

  if (!typeInfo) {
    return ctx.createStep(lineNum, code, `❌ 지원하지 않는 타입: ${typeName}`);
  }

  const elemSize = typeInfo.size;
  const totalSize = elemSize * size;
  const addr = ctx.allocateStack(totalSize);

  let bytesList: number[] = [];
  let explanation: string;
  let displayValues: string;

  if (valuesStr) {
    // 초기화된 배열
    const valueStrings = valuesStr.split(',');
    const values: number[] = [];

    for (const vs of valueStrings) {
      values.push(parseValue(vs, typeInfo));
    }

    // 바이트 배열 생성
    for (const v of values) {
      bytesList.push(...cTypeRegistry.toBytes(typeName, v));
    }

    // 부족한 요소는 0으로 채움
    while (bytesList.length < totalSize) {
      bytesList.push(0);
    }

    // 표시용 값 생성
    if (typeInfo.category === 'char') {
      displayValues = values.map((v) => `'${String.fromCharCode(v)}'`).join(', ');
    } else if (typeInfo.category === 'float') {
      displayValues = values.map((v) => v.toFixed(2)).join(', ');
    } else {
      displayValues = values.join(', ');
    }

    explanation = `📚 배열 '${name}[${size}]' 선언 및 초기화

• 타입: ${typeName} (${elemSize}바이트 × ${size}개 = ${totalSize}바이트)
• 스택 주소: ${ctx.toHex(addr)}
• 초기값: {${displayValues}}

💡 배열은 연속된 메모리 공간!
   ${name}[0] → ${ctx.toHex(addr)}
   ${name}[1] → ${ctx.toHex(addr - elemSize)}
   ${name}[2] → ${ctx.toHex(addr - elemSize * 2)} ...`;
  } else {
    // 초기화 안 된 배열
    bytesList = new Array(totalSize).fill(0);

    explanation = `📚 배열 '${name}[${size}]' 선언 (초기화 안됨)

• 타입: ${typeName} (${elemSize}바이트 × ${size}개 = ${totalSize}바이트)
• 스택 주소: ${ctx.toHex(addr)}
• ⚠️ 초기화 안됨 → 쓰레기값 포함!

💡 ${typeInfo.category === 'char' ? '문자 배열은 문자열처럼 사용 가능' : '배열도 초기화하지 않으면 예측 불가능한 값'}`;
  }

  ctx.variables.set(name, {
    address: ctx.toHex(addr),
    type: `${typeName}[${size}]`,
    size: totalSize,
    bytes: bytesList,
    value: `[${size} elements]`,
    is_array: true,
    array_size: size,
    element_type: typeName,
    element_size: elemSize,
  });

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 배열 요소 대입
 */
function handleArrayAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  name: string,
  index: number,
  valueStr: string
): Step {
  const arr = ctx.variables.get(name);

  if (!arr?.is_array) {
    return ctx.createStep(lineNum, code, `❌ '${name}'은 배열이 아님`);
  }

  const arrSize = arr.array_size || 0;
  const elemType = arr.element_type || 'int';
  const elemSize = arr.element_size || 4;
  const baseAddr = parseInt(arr.address, 16);
  const elemAddr = baseAddr - index * elemSize;

  const typeInfo = cTypeRegistry.getType(elemType);
  if (!typeInfo) {
    return ctx.createStep(lineNum, code, `❌ 지원하지 않는 타입: ${elemType}`);
  }

  let explanation: string;

  if (index >= 0 && index < arrSize) {
    const value = parseValue(valueStr, typeInfo);
    const offset = index * elemSize;
    const newBytes = cTypeRegistry.toBytes(elemType, value);
    arr.bytes.splice(offset, elemSize, ...newBytes);

    // 표시용 값
    let displayValue: string;
    if (typeInfo.category === 'char') {
      displayValue = `'${String.fromCharCode(value)}' (ASCII: ${value})`;
    } else if (typeInfo.category === 'float') {
      displayValue = value.toFixed(6);
    } else {
      displayValue = String(value);
    }

    explanation = `✏️ 배열 요소 '${name}[${index}]' 값 변경

• ${name}[${index}] = ${displayValue}
• 요소 주소: ${ctx.toHex(elemAddr)}
• 요소 크기: ${elemSize}바이트

💡 배열 인덱스 계산:
   주소 = 시작주소 - (인덱스 × 요소크기)
   ${ctx.toHex(elemAddr)} = ${arr.address} - (${index} × ${elemSize})`;
  } else {
    const overflowBytes = (index - arrSize + 1) * elemSize;
    const direction = index >= arrSize ? '넘침 (overflow)' : '언더플로우 (underflow)';

    explanation = `🚨 버퍼 오버플로우 감지! (Buffer Overflow)

⚠️ 잘못된 배열 접근:
• ${name}[${index}]에 접근 시도
• 배열 크기: ${arrSize} (유효 인덱스: 0~${arrSize - 1})
• 인덱스 ${index}는 범위 밖! (${direction})

📊 메모리 침범:
• 할당된 영역: ${arr.address} ~ ${ctx.toHex(baseAddr - (arrSize - 1) * elemSize)}
• 접근 시도 주소: ${ctx.toHex(elemAddr)}
• 침범 크기: 약 ${overflowBytes}바이트

💥 버퍼 오버플로우의 위험:
• 다른 변수 값 덮어쓰기 (데이터 손상)
• 리턴 주소 덮어쓰기 → 악성 코드 실행
• 프로그램 크래시 (Segmentation Fault)
• 보안 취약점 #1 (CWE-120)

🔧 해결 방법:
• 항상 배열 크기 확인: if (index < ${arrSize})
• 안전한 함수 사용: strncpy() 대신 strcpy()`;
  }

  return ctx.createStep(lineNum, code, explanation);
}

export default ArrayHandler;
