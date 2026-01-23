/**
 * JavaScript Assignment Handler
 *
 * 재할당 처리: x = 10;
 */

import type { JsCodeHandler, JsSimContext, JsStep } from '../types-new';

// x = 5; y = x + 1;
const ASSIGNMENT_PATTERN = /^(\w+)\s*=\s*(.+);?$/;

export const AssignmentHandler: JsCodeHandler = {
  name: 'assignment',
  priority: 15,

  canHandle(code: string): boolean {
    // 비교 연산자 제외 (==, ===, !=, !==, <=, >=)
    if (/[=!<>]=/.test(code) && !/^(\w+)\s*=\s*[^=]/.test(code)) {
      return false;
    }
    // let, const, var로 시작하면 변수 선언이므로 제외
    if (/^(let|const|var)\s/.test(code)) {
      return false;
    }
    return ASSIGNMENT_PATTERN.test(code);
  },

  handle(ctx: JsSimContext, lineNum: number, code: string): JsStep | null {
    const match = code.match(ASSIGNMENT_PATTERN);
    if (!match) return null;

    const [, varName, valueExpr] = match;
    const trimmedExpr = valueExpr.trim().replace(/;$/, '');

    // 이전 값 확인
    const oldValue = ctx.getVariable(varName);

    // 새 값 평가
    const newValue = evaluateExpression(ctx, trimmedExpr);

    // 변수 설정
    ctx.setVariable(varName, newValue);

    // 설명 생성
    let explanation: string;
    if (oldValue !== undefined) {
      explanation = `변수 '${varName}'에 새 값 ${formatValue(newValue)} 할당 (이전 값: ${formatValue(oldValue)})`;
    } else {
      explanation = `변수 '${varName}'에 값 ${formatValue(newValue)} 할당`;
    }

    return ctx.createStep(lineNum, code, explanation);
  },
};

/**
 * 표현식 평가
 */
function evaluateExpression(ctx: JsSimContext, expr: string): any {
  const trimmed = expr.trim();

  // undefined
  if (trimmed === 'undefined') return undefined;

  // null
  if (trimmed === 'null') return null;

  // boolean
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;

  // 숫자
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // 문자열
  if (/^["'`].*["'`]$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }

  // 배열
  if (/^\[.*\]$/.test(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  // 객체
  if (/^\{.*\}$/.test(trimmed)) {
    try {
      const jsonStr = trimmed.replace(/'/g, '"');
      return JSON.parse(jsonStr);
    } catch {
      return trimmed;
    }
  }

  // 변수 참조
  const varValue = ctx.getVariable(trimmed);
  if (varValue !== undefined) {
    return varValue;
  }

  // 산술 연산 (간단한 경우)
  // x + 1, y * 2 등
  const arithmeticMatch = trimmed.match(/^(\w+)\s*([+\-*/])\s*(.+)$/);
  if (arithmeticMatch) {
    const [, leftVar, operator, rightExpr] = arithmeticMatch;
    const leftValue = ctx.getVariable(leftVar);
    const rightValue = evaluateExpression(ctx, rightExpr);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      switch (operator) {
        case '+': return leftValue + rightValue;
        case '-': return leftValue - rightValue;
        case '*': return leftValue * rightValue;
        case '/': return leftValue / rightValue;
      }
    }

    // 문자열 연결
    if (operator === '+') {
      return String(leftValue) + String(rightValue);
    }
  }

  // 기본값: 문자열로 반환
  return trimmed;
}

/**
 * 값 포맷팅
 */
function formatValue(value: any): string {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
