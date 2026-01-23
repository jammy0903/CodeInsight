/**
 * JavaScript Variable Declaration Handler
 *
 * let, const, var 선언 처리
 */

import type { JsCodeHandler, JsSimContext, JsStep } from '../types-new';

// let x = 5; const y = "hello"; var z = true;
const VAR_DECL_PATTERN = /^(let|const|var)\s+(\w+)\s*=\s*(.+);?$/;

export const VariableDeclarationHandler: JsCodeHandler = {
  name: 'variable-declaration',
  priority: 20,

  canHandle(code: string): boolean {
    return VAR_DECL_PATTERN.test(code);
  },

  handle(ctx: JsSimContext, lineNum: number, code: string): JsStep | null {
    const match = code.match(VAR_DECL_PATTERN);
    if (!match) return null;

    const [, keyword, varName, valueExpr] = match;
    const trimmedExpr = valueExpr.trim().replace(/;$/, '');

    // 값 평가
    const value = evaluateExpression(ctx, trimmedExpr);

    // 변수 설정
    ctx.setVariable(varName, value);

    // 설명 생성
    const explanation = `${keyword} 키워드로 변수 '${varName}' 선언, 값 ${formatValue(value)} 할당`;

    return ctx.createStep(lineNum, code, explanation);
  },
};

/**
 * 표현식 평가 (간단한 버전)
 */
function evaluateExpression(ctx: JsSimContext, expr: string): any {
  const trimmed = expr.trim();

  // undefined
  if (trimmed === 'undefined') {
    return undefined;
  }

  // null
  if (trimmed === 'null') {
    return null;
  }

  // boolean
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }

  // 숫자
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // 문자열 (따옴표)
  if (/^["'`].*["'`]$/.test(trimmed)) {
    return trimmed.slice(1, -1);
  }

  // 배열 [1, 2, 3]
  if (/^\[.*\]$/.test(trimmed)) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  // 객체 { key: value }
  if (/^\{.*\}$/.test(trimmed)) {
    try {
      // JSON.parse는 작은따옴표를 지원하지 않으므로 큰따옴표로 변환
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

  // 산술 연산 (간단한 경우만)
  if (/^[\d\s+\-*/()]+$/.test(trimmed)) {
    try {
      return eval(trimmed);
    } catch {
      return trimmed;
    }
  }

  // 기본값: 문자열로 반환
  return trimmed;
}

/**
 * 값 포맷팅
 */
function formatValue(value: any): string {
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (Array.isArray(value)) {
    return `[${value.join(', ')}]`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
