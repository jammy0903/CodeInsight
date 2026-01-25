/**
 * Python Function Call Handler
 *
 * 함수 호출 처리: result = func(args) 또는 func(args)
 *
 * 함수 호출 시:
 * 1. 새 콜스택 프레임 생성
 * 2. 인자를 파라미터에 바인딩
 * 3. 함수 본문 실행
 * 4. 반환값 처리
 */

import type {
  PyCodeHandler,
  PySimContext,
  PyStep,
  PyFunctionValue,
  PyCallFrame,
  PyChange,
} from '../types';
import { parseFunctionCall, parseAssignWithCall } from '../parser/block-parser';
import { getName, getObjectByName, resolveNameToObject } from '../context';

// 함수 호출 패턴
const FUNCTION_CALL_PATTERN = /^\w+\s*\(.*\)$/;
const ASSIGN_CALL_PATTERN = /^\w+\s*=\s*\w+\s*\(.*\)$/;

/**
 * 함수 호출 핸들러 (반환값 없는 호출)
 */
export const FunctionCallHandler: PyCodeHandler = {
  name: 'function-call',
  priority: 20,

  canHandle(code: string): boolean {
    // 할당문이 아닌 순수 함수 호출
    if (ASSIGN_CALL_PATTERN.test(code)) return false;
    // print는 별도 핸들러에서 처리
    if (code.startsWith('print(')) return false;
    return FUNCTION_CALL_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const parsed = parseFunctionCall(code);
    if (!parsed) return null;

    // 일반 함수 호출만 처리 (메서드는 별도 핸들러)
    if (parsed.type === 'method') return null;

    return executeFunctionCall(ctx, lineNum, code, parsed.funcName, parsed.args);
  },
};

/**
 * 할당 + 함수 호출 핸들러
 */
export const AssignFunctionCallHandler: PyCodeHandler = {
  name: 'assign-function-call',
  priority: 25, // assign보다 높은 우선순위

  canHandle(code: string): boolean {
    if (!ASSIGN_CALL_PATTERN.test(code)) return false;
    // print 제외
    if (/=\s*print\(/.test(code)) return false;
    // 클래스 인스턴스화는 별도 핸들러
    const parsed = parseAssignWithCall(code);
    if (!parsed?.call) return false;
    return parsed.call.type === 'function';
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const parsed = parseAssignWithCall(code);
    if (!parsed?.call || parsed.call.type !== 'function') return null;

    return executeFunctionCall(
      ctx,
      lineNum,
      code,
      parsed.call.funcName,
      parsed.call.args,
      parsed.assignVar
    );
  },
};

/**
 * 함수 호출 실행
 */
function executeFunctionCall(
  ctx: PySimContext,
  lineNum: number,
  code: string,
  funcName: string,
  args: string[],
  assignVar?: string
): PyStep | null {
  // 함수 객체 찾기
  const funcResult = resolveNameToObject(ctx, funcName);
  if (!funcResult || funcResult.object.type !== 'function') {
    // 함수가 없으면 기본 스텝 반환
    return ctx.createStep(lineNum, code, `알 수 없는 함수: ${funcName}`);
  }

  const funcValue = funcResult.object.value as PyFunctionValue;
  const changes: PyChange[] = [];

  // 인자를 먼저 평가 (현재 프레임 컨텍스트에서)
  const evaluatedArgs: { id: string }[] = [];
  for (let i = 0; i < funcValue.params.length; i++) {
    const param = funcValue.params[i];
    const argExpr = args[i]?.trim() || param.defaultValue || 'None';
    evaluatedArgs.push(evaluateArg(ctx, argExpr));
  }

  // 새 콜스택 프레임 생성
  // unboundLocals: 함수 본문에서 할당되는 변수들 (아직 값이 없는 상태)
  // globalVars: 빈 Set으로 초기화, 'global' 문 실행 시 추가됨
  const frame: PyCallFrame = {
    functionName: funcName,
    localNames: new Map(),
    returnLine: lineNum,
    depth: ctx.callStack.length + 1,
    unboundLocals: new Set(funcValue.declaredLocals || []),
    globalVars: new Set(),
  };

  ctx.pushFrame(frame);

  // 평가된 인자를 파라미터에 바인딩
  for (let i = 0; i < funcValue.params.length; i++) {
    const param = funcValue.params[i];
    const argObj = evaluatedArgs[i];

    // 파라미터 이름에 바인딩 (현재 프레임의 로컬 스코프)
    ctx.bindName(param.name, argObj.id, funcName);

    changes.push({
      type: 'bind',
      name: param.name,
      objectId: argObj.id,
    });
  }

  // 설명 생성
  const argsStr = args.join(', ');
  let explanation = `함수 '${funcName}(${argsStr})' 호출 - 새 프레임 생성`;

  if (assignVar) {
    explanation += ` (결과를 '${assignVar}'에 저장 예정)`;
  }

  const step = ctx.createStep(lineNum, code, explanation);
  step.changes = changes;

  // 주의: 실제 함수 본문 실행은 simulator에서 처리
  // 여기서는 프레임만 설정

  return step;
}

/**
 * 인자 표현식 평가
 */
function evaluateArg(ctx: PySimContext, expr: string): { id: string } {
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

  // 속성 접근 (self.name, obj.attr 등)
  const attrMatch = trimmed.match(/^(\w+)\.(\w+)$/);
  if (attrMatch) {
    const [, objName, attrName] = attrMatch;
    const attrObj = getAttributeObject(ctx, objName, attrName);
    if (attrObj) {
      return attrObj;
    }
  }

  // 변수 참조 (현재 프레임 로컬 우선)
  const existingObj = getObjectFromContext(ctx, trimmed);
  if (existingObj) {
    return existingObj;
  }

  // 알 수 없는 표현식 → 문자열로 저장
  return ctx.createObject('str', trimmed);
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
 * 속성 객체 가져오기 (self.name, obj.attr 등)
 */
function getAttributeObject(
  ctx: PySimContext,
  objName: string,
  attrName: string
): ReturnType<typeof ctx.getObject> | null {
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

  return ctx.getObject(attrObjId) || null;
}

/**
 * 함수 본문에서 실행할 줄 가져오기
 */
export function getFunctionBodyLines(
  ctx: PySimContext,
  funcName: string
): { lineNum: number; code: string }[] | null {
  const funcResult = resolveNameToObject(ctx, funcName);
  if (!funcResult || funcResult.object.type !== 'function') {
    return null;
  }

  const funcValue = funcResult.object.value as PyFunctionValue;
  return funcValue.bodyLines.map((l) => ({
    lineNum: l.lineNum,
    code: l.code,
  }));
}
