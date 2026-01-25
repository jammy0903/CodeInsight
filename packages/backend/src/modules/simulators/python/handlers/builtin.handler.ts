/**
 * Python Built-in Function Handler
 *
 * 내장 함수 처리: id(), type(), len()
 *
 * 레슨에서 사용되는 핵심 내장 함수들을 지원합니다.
 * - id(x): 객체의 고유 식별자 (메모리 주소 개념)
 * - type(x): 객체의 타입
 * - len(x): 시퀀스/컬렉션의 길이
 */

import type { PyCodeHandler, PySimContext, PyStep, PyObject, PyObjectRef } from '../types';
import { resolveNameToObject } from '../context';

// Built-in 함수 호출 패턴
const BUILTIN_CALL_PATTERN = /^(id|type|len)\s*\((.+)\)\s*$/;
const ASSIGN_BUILTIN_PATTERN = /^(\w+)\s*=\s*(id|type|len)\s*\((.+)\)\s*$/;

/**
 * 객체 ID를 Python의 id()처럼 숫자로 변환
 * obj_123 → 140000000123 (시각적으로 의미있는 큰 정수)
 */
function objectIdToNumeric(objId: string): number {
  const match = objId.match(/obj_(\d+)/);
  if (match) {
    // Python id()처럼 보이게 140억대 숫자로 변환
    return 140000000000 + parseInt(match[1], 10);
  }
  // fallback: 해시 계산
  let hash = 0;
  for (let i = 0; i < objId.length; i++) {
    hash = ((hash << 5) - hash) + objId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) + 140000000000;
}

/**
 * 객체의 len() 계산
 */
function getObjectLength(obj: PyObject): number | null {
  switch (obj.type) {
    case 'str':
      return String(obj.value).length;
    case 'list':
    case 'tuple':
    case 'set':
      return Array.isArray(obj.value) ? (obj.value as PyObjectRef[]).length : 0;
    case 'dict':
      return Array.isArray(obj.value) ? obj.value.length : 0;
    default:
      return null; // len() 지원 안되는 타입
  }
}

/**
 * Python 타입 이름 반환 (type() 결과 형식)
 */
function getPythonTypeName(type: string): string {
  // Python의 type() 출력 형식: <class 'int'>
  return `<class '${type}'>`;
}

/**
 * Built-in 함수 핸들러 (단독 호출: print(id(x)))
 */
export const BuiltinFunctionHandler: PyCodeHandler = {
  name: 'builtin-function',
  priority: 28, // FunctionCallHandler(20)보다 높음

  canHandle(code: string): boolean {
    // print는 별도 핸들러
    if (code.startsWith('print(')) return false;
    return BUILTIN_CALL_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(BUILTIN_CALL_PATTERN);
    if (!match) return null;

    const [, funcName, argExpr] = match;
    return executeBuiltinCall(ctx, lineNum, code, funcName, argExpr.trim());
  },
};

/**
 * 할당 + Built-in 함수 핸들러 (result = id(x))
 */
export const AssignBuiltinHandler: PyCodeHandler = {
  name: 'assign-builtin',
  priority: 29, // BuiltinFunctionHandler보다 높음

  canHandle(code: string): boolean {
    return ASSIGN_BUILTIN_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(ASSIGN_BUILTIN_PATTERN);
    if (!match) return null;

    const [, assignVar, funcName, argExpr] = match;
    return executeBuiltinCall(ctx, lineNum, code, funcName, argExpr.trim(), assignVar);
  },
};

/**
 * Built-in 함수 실행
 */
function executeBuiltinCall(
  ctx: PySimContext,
  lineNum: number,
  code: string,
  funcName: string,
  argExpr: string,
  assignVar?: string
): PyStep | null {
  // 인자 평가 (변수명 또는 리터럴)
  const argObj = evaluateArgument(ctx, argExpr);
  if (!argObj) {
    return ctx.createStep(lineNum, code, `NameError: name '${argExpr}' is not defined`);
  }

  let resultValue: unknown;
  let resultType: 'int' | 'str';
  let explanation: string;

  switch (funcName) {
    case 'id': {
      resultValue = objectIdToNumeric(argObj.id);
      resultType = 'int';
      explanation = `id(${argExpr}) → ${resultValue} (객체 고유 식별자)`;
      break;
    }

    case 'type': {
      resultValue = getPythonTypeName(argObj.type);
      resultType = 'str';
      explanation = `type(${argExpr}) → ${resultValue}`;
      break;
    }

    case 'len': {
      const length = getObjectLength(argObj);
      if (length === null) {
        return ctx.createStep(
          lineNum,
          code,
          `TypeError: object of type '${argObj.type}' has no len()`
        );
      }
      resultValue = length;
      resultType = 'int';
      explanation = `len(${argExpr}) → ${resultValue}`;
      break;
    }

    default:
      return null;
  }

  // 결과 객체 생성
  const resultObj = ctx.createObject(resultType, resultValue as number | string);

  // 할당 변수가 있으면 바인딩
  if (assignVar) {
    const scope = ctx.getCurrentScope();
    ctx.bindName(assignVar, resultObj.id, scope);
    explanation = `${assignVar} = ${funcName}(${argExpr}) → ${resultValue}`;
  }

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 인자 표현식 평가
 */
function evaluateArgument(ctx: PySimContext, expr: string): PyObject | null {
  const trimmed = expr.trim();

  // 속성 접근 (obj.attr)
  const attrMatch = trimmed.match(/^(\w+)\.(\w+)$/);
  if (attrMatch) {
    const [, objName, attrName] = attrMatch;
    return getAttributeObject(ctx, objName, attrName);
  }

  // 단순 변수
  const result = resolveNameToObject(ctx, trimmed);
  return result?.object ?? null;
}

/**
 * 속성 객체 가져오기 (self.name, obj.attr 등)
 */
function getAttributeObject(
  ctx: PySimContext,
  objName: string,
  attrName: string
): PyObject | null {
  let instanceObj: PyObject | undefined;

  if (objName === 'self') {
    const frame = ctx.getCurrentFrame();
    if (!frame?.selfObjectId) return null;
    instanceObj = ctx.getObject(frame.selfObjectId);
  } else {
    const result = resolveNameToObject(ctx, objName);
    instanceObj = result?.object;
  }

  if (!instanceObj || instanceObj.type !== 'instance') return null;

  const instanceValue = instanceObj.value as { attributes: Record<string, string> };
  const attrObjId = instanceValue.attributes[attrName];
  if (!attrObjId) return null;

  return ctx.getObject(attrObjId) ?? null;
}

/**
 * Built-in 함수 평가 (f-string 등에서 사용)
 * @returns 평가된 값 (문자열)
 */
export function evaluateBuiltinExpression(
  ctx: PySimContext,
  funcName: string,
  argExpr: string
): string | null {
  const argObj = evaluateArgument(ctx, argExpr);
  if (!argObj) return null;

  switch (funcName) {
    case 'id':
      return String(objectIdToNumeric(argObj.id));
    case 'type':
      return getPythonTypeName(argObj.type);
    case 'len': {
      const length = getObjectLength(argObj);
      return length !== null ? String(length) : null;
    }
    default:
      return null;
  }
}
