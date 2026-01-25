/**
 * Python Method Call Handler
 *
 * 메서드 호출 처리: obj.method(args)
 *
 * 메서드 호출 시:
 * 1. 인스턴스 객체 찾기
 * 2. 클래스에서 메서드 찾기
 * 3. 새 콜스택 프레임 생성 (self = 인스턴스)
 * 4. 인자 바인딩
 */

import type {
  PyCodeHandler,
  PySimContext,
  PyStep,
  PyInstanceValue,
  PyClassValue,
  PyFunctionValue,
  PyCallFrame,
  PyChange,
} from '../types';
import { parseFunctionCall } from '../parser/block-parser';
import { resolveNameToObject, getObjectByName } from '../context';

// 메서드 호출 패턴
const METHOD_CALL_PATTERN = /^(\w+)\.(\w+)\s*\((.*)\)$/;
const ASSIGN_METHOD_PATTERN = /^(\w+)\s*=\s*(\w+)\.(\w+)\s*\((.*)\)$/;

/**
 * 메서드 호출 핸들러 (반환값 없는 호출)
 */
export const MethodCallHandler: PyCodeHandler = {
  name: 'method-call',
  priority: 21,

  canHandle(code: string): boolean {
    // 할당문이 아닌 순수 메서드 호출
    if (ASSIGN_METHOD_PATTERN.test(code)) return false;
    return METHOD_CALL_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(METHOD_CALL_PATTERN);
    if (!match) return null;

    const [, objName, methodName, argsStr] = match;
    const args = argsStr ? splitArgs(argsStr) : [];

    return executeMethodCall(ctx, lineNum, code, objName, methodName, args);
  },
};

/**
 * 할당 + 메서드 호출 핸들러
 */
export const AssignMethodCallHandler: PyCodeHandler = {
  name: 'assign-method-call',
  priority: 27,

  canHandle(code: string): boolean {
    return ASSIGN_METHOD_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(ASSIGN_METHOD_PATTERN);
    if (!match) return null;

    const [, assignVar, objName, methodName, argsStr] = match;
    const args = argsStr ? splitArgs(argsStr) : [];

    return executeMethodCall(
      ctx,
      lineNum,
      code,
      objName,
      methodName,
      args,
      assignVar
    );
  },
};

/**
 * 메서드 호출 실행
 */
function executeMethodCall(
  ctx: PySimContext,
  lineNum: number,
  code: string,
  objName: string,
  methodName: string,
  args: string[],
  assignVar?: string
): PyStep | null {
  const changes: PyChange[] = [];

  // 인스턴스 객체 찾기
  const instanceResult = resolveNameToObject(ctx, objName);
  if (!instanceResult) {
    return ctx.createStep(lineNum, code, `알 수 없는 객체: ${objName}`);
  }

  if (instanceResult.object.type !== 'instance') {
    return ctx.createStep(
      lineNum,
      code,
      `'${objName}'는 인스턴스가 아닙니다`
    );
  }

  const instanceValue = instanceResult.object.value as PyInstanceValue;

  // 클래스 객체 찾기
  const classObj = ctx.getObject(instanceValue.classId);
  if (!classObj || classObj.type !== 'class') {
    return ctx.createStep(lineNum, code, `클래스를 찾을 수 없음`);
  }

  const classValue = classObj.value as PyClassValue;

  // 메서드 찾기
  const methodId = classValue.methods[methodName];
  if (!methodId) {
    return ctx.createStep(
      lineNum,
      code,
      `'${instanceValue.className}' 클래스에 '${methodName}' 메서드가 없음`
    );
  }

  const methodObj = ctx.getObject(methodId);
  if (!methodObj || methodObj.type !== 'function') {
    return ctx.createStep(lineNum, code, `메서드를 찾을 수 없음`);
  }

  const methodValue = methodObj.value as PyFunctionValue;

  // 새 콜스택 프레임 생성
  const frame: PyCallFrame = {
    functionName: `${instanceValue.className}.${methodName}`,
    localNames: new Map(),
    returnLine: lineNum,
    depth: ctx.callStack.length + 1,
    selfObjectId: instanceResult.object.id,
    unboundLocals: new Set(methodValue.declaredLocals || []),
    globalVars: new Set(),
  };

  ctx.pushFrame(frame);

  // self 바인딩
  ctx.bindName('self', instanceResult.object.id, frame.functionName);

  // 나머지 인자 바인딩 (self 제외)
  const params = methodValue.params.filter((p) => p.name !== 'self');
  for (let i = 0; i < params.length; i++) {
    const param = params[i];
    const argExpr = args[i]?.trim() || param.defaultValue || 'None';

    const argObj = evaluateArg(ctx, argExpr);
    ctx.bindName(param.name, argObj.id, frame.functionName);

    changes.push({
      type: 'bind',
      name: param.name,
      objectId: argObj.id,
    });
  }

  // 설명 생성
  const argsDisplay = args.join(', ');
  let explanation = `'${objName}.${methodName}(${argsDisplay})' 메서드 호출 - 새 프레임 생성`;

  if (assignVar) {
    explanation += ` (결과를 '${assignVar}'에 저장 예정)`;
  }

  const step = ctx.createStep(lineNum, code, explanation);
  step.changes = changes;

  return step;
}

/**
 * 인자 문자열 분리
 */
function splitArgs(argsStr: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of argsStr) {
    if (inString) {
      current += char;
      if (char === stringChar) {
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
 * 인자 평가
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

  // 변수 참조
  const existingObj = getObjectByName(ctx, trimmed);
  if (existingObj) {
    return existingObj;
  }

  // 알 수 없는 표현식 → 문자열로 저장
  return ctx.createObject('str', trimmed);
}
