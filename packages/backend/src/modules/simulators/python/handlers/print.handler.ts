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

    // UnboundLocalError 체크
    const unboundVar = checkUnboundLocalInExpr(ctx, argsStr);
    if (unboundVar) {
      const step = ctx.createStep(
        lineNum,
        code,
        `UnboundLocalError: 로컬 변수 '${unboundVar}'가 할당 전에 참조됨`
      );
      step.error = {
        type: 'UnboundLocalError',
        message: `local variable '${unboundVar}' referenced before assignment`,
        variable: unboundVar,
      };
      return step;
    }

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

  // 속성 접근 (self.name, obj.attr 등)
  const attrMatch = arg.match(/^(\w+)\.(\w+)$/);
  if (attrMatch) {
    const [, objName, attrName] = attrMatch;
    const attrValue = evaluateAttribute(ctx, objName, attrName);
    if (attrValue !== null) {
      return attrValue;
    }
  }

  // 변수 참조 (현재 프레임 로컬 → 글로벌)
  const obj = getObjectFromContext(ctx, arg);
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
 * 컨텍스트에서 객체 가져오기 (프레임 로컬 우선)
 */
function getObjectFromContext(ctx: PySimContext, name: string): ReturnType<typeof ctx.getObject> | null {
  const frame = ctx.getCurrentFrame();

  // 1. 현재 프레임의 로컬 변수에서 찾기
  if (frame) {
    const localName = frame.localNames.get(name);
    if (localName) {
      const obj = ctx.getObject(localName.pointsTo);
      if (obj) return obj;
    }
  }

  // 2. 일반적인 방법으로 찾기 (글로벌 포함)
  return getObjectByName(ctx, name) || null;
}

/**
 * 속성 값 평가 (self.name, obj.attr 등)
 */
function evaluateAttribute(ctx: PySimContext, objName: string, attrName: string): string | null {
  let instanceObj;

  if (objName === 'self') {
    // 현재 프레임에서 self 찾기
    const frame = ctx.getCurrentFrame();
    if (!frame?.selfObjectId) return null;
    instanceObj = ctx.getObject(frame.selfObjectId);
  } else {
    // 일반 변수에서 찾기
    instanceObj = getObjectFromContext(ctx, objName);
  }

  if (!instanceObj || instanceObj.type !== 'instance') return null;

  // 인스턴스 속성에서 값 찾기
  const instanceValue = instanceObj.value as { attributes: Record<string, string> };
  const attrObjId = instanceValue.attributes[attrName];
  if (!attrObjId) return null;

  const attrObj = ctx.getObject(attrObjId);
  if (!attrObj) return null;

  return formatObjectValue(attrObj);
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

/**
 * 표현식에서 UnboundLocalError 체크
 */
function checkUnboundLocalInExpr(ctx: PySimContext, expr: string): string | null {
  const frame = ctx.getCurrentFrame();
  if (!frame?.unboundLocals || frame.unboundLocals.size === 0) {
    return null;
  }

  const trimmed = expr.trim();

  // 리터럴 체크
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  if (/^["'].*["']$/.test(trimmed)) return null;
  if (['True', 'False', 'None'].includes(trimmed)) return null;
  if (/^[\[\(\{]/.test(trimmed)) return null;

  // 단순 변수
  if (/^\w+$/.test(trimmed)) {
    if (frame.unboundLocals.has(trimmed)) {
      return trimmed;
    }
    return null;
  }

  // 복합 표현식
  const identifiers = trimmed.match(/\b([a-zA-Z_]\w*)\b/g) || [];
  const reserved = ['True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'];
  for (const id of identifiers) {
    if (reserved.includes(id)) continue;
    if (frame.unboundLocals.has(id)) {
      return id;
    }
  }

  return null;
}
