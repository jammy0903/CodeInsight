/**
 * JavaScript Console.log Handler
 *
 * console.log() 처리
 */

import type { JsCodeHandler, JsSimContext, JsStep } from '../types-new';

// console.log(x); console.log("hello");
const CONSOLE_LOG_PATTERN = /^console\.log\((.+)\);?$/;

export const ConsoleLogHandler: JsCodeHandler = {
  name: 'console-log',
  priority: 25,

  canHandle(code: string): boolean {
    return CONSOLE_LOG_PATTERN.test(code);
  },

  handle(ctx: JsSimContext, lineNum: number, code: string): JsStep | null {
    const match = code.match(CONSOLE_LOG_PATTERN);
    if (!match) return null;

    const [, args] = match;

    // 인자들을 쉼표로 분리
    const argList = splitArguments(args);

    // 각 인자를 평가하고 출력
    const values = argList.map((arg) => evaluateExpression(ctx, arg.trim()));
    const output = values.map((v) => formatForOutput(v)).join(' ');

    // stdout에 추가
    ctx.appendStdout(output + '\n');

    // 설명 생성
    const explanation = `콘솔에 "${output}" 출력`;

    return ctx.createStep(lineNum, code, explanation);
  },
};

/**
 * 인자 분리 (중첩 괄호/따옴표 고려)
 */
function splitArguments(argsStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of argsStr) {
    if (inString) {
      current += char;
      if (char === stringChar && (current.length === 0 || current[current.length - 2] !== '\\')) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true;
      stringChar = char;
      current += char;
      continue;
    }

    if (char === '(' || char === '[' || char === '{') {
      depth++;
      current += char;
      continue;
    }

    if (char === ')' || char === ']' || char === '}') {
      depth--;
      current += char;
      continue;
    }

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim()) {
    result.push(current.trim());
  }

  return result;
}

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

  // 산술 연산
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

    if (operator === '+') {
      return String(leftValue) + String(rightValue);
    }
  }

  // 기본값
  return trimmed;
}

/**
 * 출력 포맷팅 (console.log 스타일)
 */
function formatForOutput(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
