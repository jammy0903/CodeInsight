/**
 * Python Print Handler
 *
 * print() 함수 처리
 */

import type { PyCodeHandler, PySimContext, PyStep } from '../types';
import { getObjectByName } from '../context';

// print 패턴
const PRINT_PATTERN = /^print\s*\((.*)\)$/;

export const PrintHandler: PyCodeHandler = {
  name: 'print',
  priority: 15,

  canHandle(code: string): boolean {
    return PRINT_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(PRINT_PATTERN);
    if (!match) return null;

    const argsStr = match[1].trim();

    // 인자 평가
    const output = evaluatePrintArgs(ctx, argsStr);

    // stdout에 추가
    ctx.appendStdout(output + '\n');

    return ctx.createStep(lineNum, code, `출력: ${output}`);
  },
};

/**
 * print 인자 평가
 */
function evaluatePrintArgs(ctx: PySimContext, argsStr: string): string {
  if (!argsStr) {
    return '';
  }

  // 간단한 구현: 콤마로 분리하고 각각 평가
  const args = splitPrintArgs(argsStr);
  const values = args.map((arg) => evaluateArg(ctx, arg.trim()));

  return values.join(' ');
}

/**
 * 개별 인자 평가
 */
function evaluateArg(ctx: PySimContext, arg: string): string {
  // 문자열 리터럴
  if (/^["'].*["']$/.test(arg)) {
    return arg.slice(1, -1);
  }

  // 숫자
  if (/^-?\d+(\.\d+)?$/.test(arg)) {
    return arg;
  }

  // True/False/None
  if (arg === 'True') return 'True';
  if (arg === 'False') return 'False';
  if (arg === 'None') return 'None';

  // 변수 참조
  const obj = getObjectByName(ctx, arg);
  if (obj) {
    return formatObjectValue(obj);
  }

  // f-string (간단한 형태)
  if (/^f["']/.test(arg)) {
    return evaluateFString(ctx, arg);
  }

  return arg;
}

/**
 * 객체 값 포맷
 */
function formatObjectValue(obj: { type: string; value: unknown }): string {
  switch (obj.type) {
    case 'str':
      return String(obj.value);
    case 'int':
    case 'float':
      return String(obj.value);
    case 'bool':
      return obj.value ? 'True' : 'False';
    case 'NoneType':
      return 'None';
    case 'list':
      return '[...]';
    case 'tuple':
      return '(...)';
    case 'dict':
      return '{...}';
    case 'set':
      return '{...}';
    default:
      return String(obj.value);
  }
}

/**
 * f-string 평가 (간단한 형태)
 */
function evaluateFString(ctx: PySimContext, fstr: string): string {
  // f"Hello {name}" → "Hello " + name
  const inner = fstr.slice(2, -1); // f" ... " 제거

  let result = '';
  let i = 0;

  while (i < inner.length) {
    if (inner[i] === '{') {
      const endIdx = inner.indexOf('}', i);
      if (endIdx === -1) {
        result += inner.slice(i);
        break;
      }

      const varName = inner.slice(i + 1, endIdx).trim();
      const obj = getObjectByName(ctx, varName);
      if (obj) {
        result += formatObjectValue(obj);
      } else {
        result += `{${varName}}`;
      }
      i = endIdx + 1;
    } else {
      result += inner[i];
      i++;
    }
  }

  return result;
}

/**
 * print 인자 분리 (문자열 내 콤마 무시)
 */
function splitPrintArgs(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of str) {
    if (inString) {
      current += char;
      if (char === stringChar && current[current.length - 2] !== '\\') {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
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
