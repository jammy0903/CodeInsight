/**
 * Python Return Handler
 *
 * return 문 처리: return value
 *
 * return 시:
 * 1. 반환값 평가
 * 2. 현재 프레임 팝
 * 3. 반환값을 호출자에게 전달
 */

import type {
  PyCodeHandler,
  PySimContext,
  PyStep,
  PyChange,
  PyObject,
  PyCallFrame,
} from '../types';
import { getObjectByName } from '../context';

// return 패턴
const RETURN_PATTERN = /^return(?:\s+(.+))?$/;

export const ReturnHandler: PyCodeHandler = {
  name: 'return',
  priority: 30,

  canHandle(code: string): boolean {
    return RETURN_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(RETURN_PATTERN);
    if (!match) return null;

    const returnExpr = match[1]?.trim();
    const changes: PyChange[] = [];

    // 현재 프레임 확인
    const currentFrame = ctx.getCurrentFrame();
    if (!currentFrame) {
      return ctx.createStep(
        lineNum,
        code,
        'return 문은 함수 내에서만 사용 가능'
      );
    }

    // 반환값 평가 (프레임 팝 전에 해야 로컬 변수 접근 가능)
    let returnObj: PyObject | null = null;
    let returnValueStr = 'None';

    if (returnExpr) {
      returnObj = evaluateReturnExpr(ctx, returnExpr, currentFrame);
      returnValueStr = formatReturnValue(returnObj);
    } else {
      // return만 있으면 None 반환
      returnObj = ctx.createObject('NoneType', null);
    }

    const funcName = currentFrame.functionName;

    // 프레임 팝
    ctx.popFrame();

    // 설명 생성
    const explanation = `함수 '${funcName}'에서 ${returnValueStr} 반환 - 프레임 제거`;

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    // 반환값 객체를 step에 첨부 (호출자가 사용할 수 있도록)
    if (returnObj) {
      (step as any).returnValue = returnObj;
    }

    return step;
  },
};

/**
 * 반환 표현식 평가
 */
function evaluateReturnExpr(ctx: PySimContext, expr: string, frame: PyCallFrame): PyObject {
  const trimmed = expr.trim();

  // None
  if (trimmed === 'None') {
    return ctx.createObject('NoneType', null);
  }

  // bool
  if (trimmed === 'True') {
    return ctx.createObject('bool', true);
  }
  if (trimmed === 'False') {
    return ctx.createObject('bool', false);
  }

  // 정수
  if (/^-?\d+$/.test(trimmed)) {
    return ctx.createObject('int', parseInt(trimmed, 10));
  }

  // 실수
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return ctx.createObject('float', parseFloat(trimmed));
  }

  // 문자열
  if (/^["'].*["']$/.test(trimmed)) {
    const str = trimmed.slice(1, -1);
    return ctx.createObject('str', str);
  }

  // 문자열 연결: "text" + var 또는 var + "text"
  const strConcatMatch1 = trimmed.match(/^["'](.*)["']\s*\+\s*(\w+)$/);
  if (strConcatMatch1) {
    const [, strPart, varName] = strConcatMatch1;
    const varObj = getObjectFromFrame(ctx, varName, frame);
    if (varObj) {
      const varValue = varObj.type === 'str' ? varObj.value : String(varObj.value);
      return ctx.createObject('str', strPart + varValue);
    }
  }

  const strConcatMatch2 = trimmed.match(/^(\w+)\s*\+\s*["'](.*)["']$/);
  if (strConcatMatch2) {
    const [, varName, strPart] = strConcatMatch2;
    const varObj = getObjectFromFrame(ctx, varName, frame);
    if (varObj) {
      const varValue = varObj.type === 'str' ? varObj.value : String(varObj.value);
      return ctx.createObject('str', varValue + strPart);
    }
  }

  // 간단한 산술 연산 (a + b, a - b 등)
  const arithMatch = trimmed.match(/^(\w+)\s*([+\-*/])\s*(\w+)$/);
  if (arithMatch) {
    const [, left, op, right] = arithMatch;
    const leftVal = getNumericValueWithFrame(ctx, left, frame);
    const rightVal = getNumericValueWithFrame(ctx, right, frame);

    if (leftVal !== null && rightVal !== null) {
      let result: number;
      switch (op) {
        case '+':
          result = leftVal + rightVal;
          break;
        case '-':
          result = leftVal - rightVal;
          break;
        case '*':
          result = leftVal * rightVal;
          break;
        case '/':
          result = leftVal / rightVal;
          break;
        default:
          result = 0;
      }

      // 결과가 정수면 int, 아니면 float
      if (Number.isInteger(result)) {
        return ctx.createObject('int', result);
      }
      return ctx.createObject('float', result);
    }
  }

  // 변수 참조 (프레임 로컬 변수 우선)
  const existingObj = getObjectFromFrame(ctx, trimmed, frame);
  if (existingObj) {
    return existingObj;
  }

  // 알 수 없는 표현식 → 문자열로 저장
  return ctx.createObject('str', trimmed);
}

/**
 * 프레임의 로컬 변수에서 객체 가져오기
 */
function getObjectFromFrame(ctx: PySimContext, name: string, frame: PyCallFrame): PyObject | null {
  // 1. 프레임 로컬 변수에서 찾기
  const localName = frame.localNames.get(name);
  if (localName) {
    const obj = ctx.getObject(localName.pointsTo);
    if (obj) return obj;
  }

  // 2. 글로벌에서 찾기
  const globalObj = getObjectByName(ctx, name);
  if (globalObj) return globalObj;

  return null;
}

/**
 * 숫자 값 가져오기 (변수 또는 리터럴) - 프레임 우선
 */
function getNumericValueWithFrame(ctx: PySimContext, expr: string, frame: PyCallFrame): number | null {
  const trimmed = expr.trim();

  // 숫자 리터럴
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // 변수 (프레임 로컬 → 글로벌)
  const obj = getObjectFromFrame(ctx, trimmed, frame);
  if (obj && (obj.type === 'int' || obj.type === 'float')) {
    return obj.value as number;
  }

  return null;
}

/**
 * 반환값 포맷
 */
function formatReturnValue(obj: PyObject): string {
  switch (obj.type) {
    case 'int':
    case 'float':
      return String(obj.value);
    case 'str':
      return `"${obj.value}"`;
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
    default:
      return String(obj.value);
  }
}
