/**
 * Variable Handler (TypeRegistry 기반)
 *
 * 모든 기본 타입의 변수 선언 및 대입 처리:
 * - 정수: int, short, long, long long, unsigned 변형
 * - 부동소수점: float, double, long double
 * - 문자: char
 *
 * 사용 패턴:
 * - int x = 5;
 * - unsigned int y = 10;
 * - float f = 3.14;
 * - char c = 'A';
 * - x = 20;
 */

import type { CodeHandler, SimContext, Step } from './types';
import { cTypeRegistry, type TypeInfo } from '../types';
import { evaluateExpression as advancedEvaluate, type EvalContext } from '../../../shared/expression';

// 타입 키워드 패턴 (순서 중요: 긴 것 먼저)
const TYPE_KEYWORDS = [
  'unsigned long long',
  'unsigned long',
  'unsigned short',
  'unsigned int',
  'unsigned char',
  'long long',
  'long double',
  'long',
  'short',
  'double',
  'float',
  'char',
  'int',
];

// 타입 패턴 (정규식용)
const TYPE_PATTERN = TYPE_KEYWORDS.map((k) => k.replace(/\s+/g, '\\s+')).join('|');

// 패턴 정의
const PATTERNS = {
  // 숫자 초기화: int x = 5; float f = 3.14;
  DECL_NUM_INIT: new RegExp(`^(${TYPE_PATTERN})\\s+(\\w+)\\s*=\\s*(-?[\\d.]+(?:e[+-]?\\d+)?f?)$`, 'i'),
  // 식 초기화: int sum = a + b; int diff = x - y;
  DECL_EXPR_INIT: new RegExp(`^(${TYPE_PATTERN})\\s+(\\w+)\\s*=\\s*(.+)$`, 'i'),
  // 선언만: int x; float f;
  DECL_ONLY: new RegExp(`^(${TYPE_PATTERN})\\s+(\\w+)\\s*$`),
  // char 초기화: char c = 'A';
  CHAR_INIT: /^char\s+(\w+)\s*=\s*'(.)'$/,
  // 변수 대입: x = 10;
  VAR_ASSIGN: /^(\w+)\s*=\s*(-?[\d.]+(?:e[+-]?\d+)?f?)$/i,
  // 식 대입: x = a + b;
  EXPR_ASSIGN: /^(\w+)\s*=\s*(.+)$/,
  // char 대입: c = 'B';
  CHAR_ASSIGN: /^(\w+)\s*=\s*'(.)'$/,
};

export const VariableHandler: CodeHandler = {
  name: 'variable',
  priority: 10,

  canHandle(code: string): boolean {
    return (
      PATTERNS.DECL_NUM_INIT.test(code) ||
      PATTERNS.DECL_EXPR_INIT.test(code) ||
      PATTERNS.DECL_ONLY.test(code) ||
      PATTERNS.CHAR_INIT.test(code) ||
      PATTERNS.VAR_ASSIGN.test(code) ||
      PATTERNS.EXPR_ASSIGN.test(code) ||
      PATTERNS.CHAR_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // char c = 'A';
    const charInit = code.match(PATTERNS.CHAR_INIT);
    if (charInit) {
      return handleCharDecl(ctx, lineNum, code, charInit[1], charInit[2]);
    }

    // type var = value; (숫자 리터럴)
    const declNumInit = code.match(PATTERNS.DECL_NUM_INIT);
    if (declNumInit) {
      const typeName = declNumInit[1];
      const varName = declNumInit[2];
      const value = parseNumericValue(declNumInit[3]);
      return handleVarDecl(ctx, lineNum, code, typeName, varName, value);
    }

    // type var = expr; (식 평가)
    const declExprInit = code.match(PATTERNS.DECL_EXPR_INIT);
    if (declExprInit) {
      const typeName = declExprInit[1];
      const varName = declExprInit[2];
      const expr = declExprInit[3].trim();
      const value = evaluateExpression(ctx, expr);
      return handleExprDecl(ctx, lineNum, code, typeName, varName, expr, value);
    }

    // type var;
    const declOnly = code.match(PATTERNS.DECL_ONLY);
    if (declOnly) {
      const typeName = declOnly[1];
      const varName = declOnly[2];
      return handleVarDecl(ctx, lineNum, code, typeName, varName, null);
    }

    // c = 'B';
    const charAssign = code.match(PATTERNS.CHAR_ASSIGN);
    if (charAssign) {
      const v = ctx.variables.get(charAssign[1]);
      if (v && v.type === 'char') {
        return handleCharAssign(ctx, lineNum, code, charAssign[1], charAssign[2]);
      }
    }

    // x = 10;
    const varAssign = code.match(PATTERNS.VAR_ASSIGN);
    if (varAssign) {
      const varName = varAssign[1];
      const v = ctx.variables.get(varName);
      // 기존 변수가 있고, 배열/포인터가 아닌 경우
      if (v && !v.type.includes('*') && !v.type.includes('[')) {
        const value = parseNumericValue(varAssign[2]);
        return handleVarAssign(ctx, lineNum, code, varName, value);
      }
    }

    // x = a + b; (식 대입)
    const exprAssign = code.match(PATTERNS.EXPR_ASSIGN);
    if (exprAssign) {
      const varName = exprAssign[1];
      const v = ctx.variables.get(varName);
      if (v && !v.type.includes('*') && !v.type.includes('[')) {
        const expr = exprAssign[2].trim();
        const value = evaluateExpression(ctx, expr);
        return handleExprAssign(ctx, lineNum, code, varName, expr, value);
      }
    }

    return null;
  },
};

/**
 * 숫자 문자열 파싱
 */
function parseNumericValue(str: string): number {
  // f 접미사 제거 (float literal)
  const cleaned = str.replace(/f$/i, '');
  return parseFloat(cleaned);
}

/**
 * 변수 선언 처리 (TypeRegistry 사용)
 *
 * Phase 4: 핸들러가 직접 이벤트 추가 예시
 * ctx.addEvent()를 사용하면 diff 기반 이벤트 대신 핸들러 이벤트가 사용됨
 */
function handleVarDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  typeName: string,
  varName: string,
  value: number | null
): Step {
  const normalizedType = cTypeRegistry.normalizeType(typeName);
  const typeInfo = cTypeRegistry.getType(normalizedType);

  if (!typeInfo) {
    return ctx.createStep(lineNum, code, `⚠️ 알 수 없는 타입: ${typeName}`);
  }

  const size = typeInfo.size;
  const addr = ctx.allocateStack(size);

  // 바이트 배열 생성
  const displayValue = value !== null ? value : 0;
  const bytes = cTypeRegistry.toBytes(normalizedType, displayValue);

  // 설명 생성
  let explanation: string;
  if (value !== null) {
    explanation = generateDeclExplanation(typeInfo, varName, value, addr, bytes, ctx);
  } else {
    explanation = generateUninitExplanation(typeInfo, varName, addr, ctx);
  }

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: normalizedType,
    size,
    bytes,
    value: String(displayValue),
  });

  // Phase 4: 핸들러가 직접 이벤트 추가
  // ctx.addEvent가 있으면 (선택적 메서드) 직접 이벤트 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    ctx.addEvent({
      type: 'variable',
      action: 'declare',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: normalizedType,
      value: displayValue,
      address: ctx.toHex(addr),
      size: size,
    });
  }

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * char 변수 선언
 */
function handleCharDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  charValue: string
): Step {
  const addr = ctx.allocateStack(1);
  const byteValue = charValue.charCodeAt(0);

  const explanation = `📦 char 변수 '${varName}' 선언 및 초기화

• 스택에 1바이트 공간 할당
• 주소: ${ctx.toHex(addr)}
• 문자 '${charValue}' = ASCII ${byteValue} (0x${byteValue.toString(16).toUpperCase()})

💡 char는 1바이트 = 8비트 = 0~255 범위
   문자는 ASCII 코드로 저장됨`;

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: 'char',
    size: 1,
    bytes: [byteValue],
    value: `'${charValue}'`,
  });

  // Phase 4: 이벤트 직접 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    ctx.addEvent({
      type: 'variable',
      action: 'declare',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: 'char',
      value: byteValue,
      address: ctx.toHex(addr),
      size: 1,
    });
  }

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 변수 값 대입
 */
function handleVarAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  value: number
): Step {
  const v = ctx.variables.get(varName);
  if (!v) {
    return ctx.createStep(lineNum, code, `⚠️ 변수 '${varName}'를 찾을 수 없음`);
  }

  const oldValue = v.value;
  const typeInfo = cTypeRegistry.getType(v.type);

  v.value = String(value);
  v.bytes = typeInfo ? cTypeRegistry.toBytes(v.type, value) : ctx.intToBytes(value, v.size);

  // Phase 4: 이벤트 직접 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    ctx.addEvent({
      type: 'variable',
      action: 'assign',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: v.type,
      value: value,
      address: v.address,
      previousValue: parseFloat(oldValue) || 0,
    });
  }

  const explanation = `✏️ 변수 '${varName}' 값 변경

• ${varName} = ${value}
• 기존 값 ${oldValue} → 새 값 ${value}
• 메모리 주소 ${v.address}의 내용이 변경됨`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * char 값 대입
 */
function handleCharAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  charValue: string
): Step {
  const v = ctx.variables.get(varName);
  if (!v) {
    return ctx.createStep(lineNum, code, `⚠️ 변수 '${varName}'를 찾을 수 없음`);
  }

  const oldValue = v.value;
  const byteValue = charValue.charCodeAt(0);

  v.value = `'${charValue}'`;
  v.bytes = [byteValue];

  // Phase 4: 이벤트 직접 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    const oldCharCode = oldValue.startsWith("'") ? oldValue.charCodeAt(1) : 0;
    ctx.addEvent({
      type: 'variable',
      action: 'assign',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: 'char',
      value: byteValue,
      address: v.address,
      previousValue: oldCharCode,
    });
  }

  const explanation = `✏️ char 변수 '${varName}' 값 변경

• ${varName} = '${charValue}'
• 기존 값 ${oldValue} → 새 값 '${charValue}'
• ASCII: ${byteValue} (0x${byteValue.toString(16).toUpperCase()})`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 선언 + 초기화 설명 생성
 */
function generateDeclExplanation(
  typeInfo: TypeInfo,
  varName: string,
  value: number,
  addr: number,
  bytes: number[],
  ctx: SimContext
): string {
  const bytesHex = bytes.map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
  const categoryEmoji = getCategoryEmoji(typeInfo.category);
  const typeDesc = typeInfo.description;

  let explanation = `📦 ${typeInfo.name} 변수 '${varName}' 선언 및 초기화

• 스택에 ${typeInfo.size}바이트 공간 할당
• 주소: ${ctx.toHex(addr)}
• 값: ${value}
• 바이트: ${bytesHex}`;

  // 타입별 추가 설명
  if (typeInfo.category === 'integer') {
    explanation += `

💡 ${categoryEmoji} ${typeDesc}
   리틀 엔디안: 작은 바이트가 앞에 옴`;

    if (!typeInfo.signed) {
      explanation += `
   unsigned: 음수 없음, 0~${typeInfo.maxValue} 범위`;
    }
  } else if (typeInfo.category === 'float') {
    explanation += `

💡 ${categoryEmoji} ${typeDesc}
   IEEE 754 표준으로 저장됨`;
  }

  return explanation;
}

/**
 * 미초기화 설명 생성
 */
function generateUninitExplanation(
  typeInfo: TypeInfo,
  varName: string,
  addr: number,
  ctx: SimContext
): string {
  return `📦 ${typeInfo.name} 변수 '${varName}' 선언 (초기화 안됨)

• 스택에 ${typeInfo.size}바이트 공간 할당
• 주소: ${ctx.toHex(addr)}
• 값이 초기화되지 않아 쓰레기값 포함!

⚠️ 초기화 안 된 변수는 예측 불가능한 값을 가짐`;
}

/**
 * 카테고리별 이모지
 */
function getCategoryEmoji(category: TypeInfo['category']): string {
  switch (category) {
    case 'integer':
      return '🔢';
    case 'float':
      return '📊';
    case 'char':
      return '🔤';
    case 'pointer':
      return '👉';
    default:
      return '📦';
  }
}

/**
 * SimContext를 EvalContext로 변환하는 헬퍼
 */
function createEvalContext(ctx: SimContext): EvalContext {
  return {
    // 변수 값 조회
    getVariable: (name: string): number | null => {
      const v = ctx.variables.get(name);
      if (!v) return null;
      // char 타입은 따옴표 제거
      if (v.type === 'char' && v.value.startsWith("'")) {
        return v.value.charCodeAt(1);
      }
      return parseFloat(v.value) || 0;
    },

    // 배열 요소 조회
    getArrayElement: (name: string, index: number): number | null => {
      const v = ctx.variables.get(name);
      if (!v || !v.is_array) return null;

      // 배열 주소에서 요소 접근
      const elemSize = v.element_size || 4;
      const elemOffset = index * elemSize;

      // bytes 배열에서 직접 읽기
      if (v.bytes && elemOffset + elemSize <= v.bytes.length) {
        let value = 0;
        for (let i = 0; i < elemSize; i++) {
          value |= (v.bytes[elemOffset + i] || 0) << (i * 8);
        }
        // 부호 있는 정수 처리
        if (elemSize === 4 && value > 0x7FFFFFFF) {
          value = value - 0x100000000;
        }
        return value;
      }
      return null;
    },

    // 포인터 역참조
    derefPointer: (name: string): number | null => {
      const v = ctx.variables.get(name);
      if (!v || !v.points_to) return null;

      // points_to가 주소 문자열이면 해당 주소의 변수 찾기
      for (const [, target] of ctx.variables) {
        if (target.address === v.points_to) {
          return parseFloat(target.value) || 0;
        }
      }
      return null;
    },

    // 함수 호출 (현재 미지원 - null 반환)
    callFunction: (): number | null => {
      // TODO: 함수 호출 지원은 simulator.ts와 연동 필요
      return null;
    },
  };
}

/**
 * 식 평가 (고급 evaluator 사용)
 *
 * 지원:
 * - 산술: +, -, *, /, %
 * - 비교: <, >, <=, >=, ==, !=
 * - 논리: &&, ||, !
 * - 삼항: ? :
 * - sizeof
 * - 배열: arr[i]
 * - 포인터: *p
 * - 괄호: (expr)
 */
function evaluateExpression(ctx: SimContext, expr: string): number {
  const evalCtx = createEvalContext(ctx);
  return advancedEvaluate(expr, evalCtx);
}

/**
 * 식 초기화 선언 처리
 */
function handleExprDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  typeName: string,
  varName: string,
  expr: string,
  value: number
): Step {
  const normalizedType = cTypeRegistry.normalizeType(typeName);
  const typeInfo = cTypeRegistry.getType(normalizedType);

  if (!typeInfo) {
    return ctx.createStep(lineNum, code, `⚠️ 알 수 없는 타입: ${typeName}`);
  }

  const size = typeInfo.size;
  const addr = ctx.allocateStack(size);
  const bytes = cTypeRegistry.toBytes(normalizedType, value);

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: normalizedType,
    size,
    bytes,
    value: String(value),
  });

  // Phase 4: 이벤트 직접 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    ctx.addEvent({
      type: 'variable',
      action: 'declare',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: normalizedType,
      value: value,
      address: ctx.toHex(addr),
      size: size,
    });
  }

  const explanation = `🧮 ${typeInfo.name} 변수 '${varName}' 선언 (식 계산)

• 식: ${expr}
• 계산 결과: ${value}
• 스택에 ${size}바이트 공간 할당
• 주소: ${ctx.toHex(addr)}

💡 변수값들이 연산에 사용됨`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 식 대입 처리
 */
function handleExprAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  expr: string,
  value: number
): Step {
  const v = ctx.variables.get(varName);
  if (!v) {
    return ctx.createStep(lineNum, code, `⚠️ 변수 '${varName}'를 찾을 수 없음`);
  }

  const oldValue = v.value;
  const typeInfo = cTypeRegistry.getType(v.type);

  v.value = String(value);
  v.bytes = typeInfo ? cTypeRegistry.toBytes(v.type, value) : ctx.intToBytes(value, v.size);

  // Phase 4: 이벤트 직접 추가
  if (ctx.addEvent && ctx.getCurrentFrame) {
    ctx.addEvent({
      type: 'variable',
      action: 'assign',
      frame: ctx.getCurrentFrame(),
      name: varName,
      varType: v.type,
      value: value,
      address: v.address,
      previousValue: parseFloat(oldValue) || 0,
    });
  }

  const explanation = `🧮 변수 '${varName}' 값 변경 (식 계산)

• 식: ${expr}
• 계산 결과: ${value}
• 기존 값 ${oldValue} → 새 값 ${value}
• 메모리 주소 ${v.address}의 내용이 변경됨`;

  return ctx.createStep(lineNum, code, explanation);
}

export default VariableHandler;
