/**
 * Python Instance Creation Handler
 *
 * 인스턴스 생성 처리: obj = MyClass(args)
 *
 * 인스턴스 생성 시:
 * 1. 클래스 찾기
 * 2. 인스턴스 객체 생성
 * 3. __init__ 메서드 호출 (있는 경우)
 * 4. 변수에 인스턴스 바인딩
 */

import type {
  PyCodeHandler,
  PySimContext,
  PyStep,
  PyClassValue,
  PyInstanceValue,
  PyFunctionValue,
  PyCallFrame,
  PyChange,
} from '../types';
import { parseAssignWithCall, parseFunctionCall } from '../parser/block-parser';
import { resolveNameToObject, getObjectByName } from '../context';

// 인스턴스 생성 패턴 (클래스명은 대문자로 시작)
const INSTANCE_CREATE_PATTERN = /^(\w+)\s*=\s*([A-Z]\w*)\s*\((.*)\)$/;

export const InstanceCreateHandler: PyCodeHandler = {
  name: 'instance-create',
  priority: 26, // assign-function-call보다 높음

  canHandle(code: string): boolean {
    const match = code.match(INSTANCE_CREATE_PATTERN);
    if (!match) return false;

    // 클래스명이 대문자로 시작하는지 확인 (Python 컨벤션)
    const className = match[2];
    return /^[A-Z]/.test(className);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(INSTANCE_CREATE_PATTERN);
    if (!match) return null;

    const [, varName, className, argsStr] = match;
    const args = argsStr ? splitArgs(argsStr) : [];
    const changes: PyChange[] = [];

    // 클래스 객체 찾기
    const classResult = resolveNameToObject(ctx, className);
    if (!classResult || classResult.object.type !== 'class') {
      return ctx.createStep(lineNum, code, `알 수 없는 클래스: ${className}`);
    }

    const classValue = classResult.object.value as PyClassValue;

    // 인스턴스 객체 생성
    const instanceValue: PyInstanceValue = {
      className,
      classId: classResult.object.id,
      attributes: {},
    };

    const instanceObj = ctx.createObject('instance', instanceValue, true);
    instanceObj.highlight = true;

    changes.push({ type: 'create', objectId: instanceObj.id });

    // __init__ 메서드가 있으면 호출 준비
    const initMethodId = classValue.methods['__init__'];
    if (initMethodId) {
      const initMethodObj = ctx.getObject(initMethodId);
      if (initMethodObj && initMethodObj.type === 'function') {
        const initValue = initMethodObj.value as PyFunctionValue;

        // 새 콜스택 프레임 생성
        const frame: PyCallFrame = {
          functionName: `${className}.__init__`,
          localNames: new Map(),
          returnLine: lineNum,
          depth: ctx.callStack.length + 1,
          selfObjectId: instanceObj.id,
          unboundLocals: new Set(initValue.declaredLocals || []),
          globalVars: new Set(),
        };

        ctx.pushFrame(frame);

        // self 바인딩
        ctx.bindName('self', instanceObj.id, frame.functionName);

        // 나머지 인자 바인딩 (self 제외)
        const params = initValue.params.filter((p) => p.name !== 'self');
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
      }
    }

    // 변수에 인스턴스 바인딩
    const pyName = ctx.bindName(varName, instanceObj.id, 'global');
    pyName.highlight = true;

    changes.push({ type: 'bind', name: varName, objectId: instanceObj.id });

    // 설명 생성
    let explanation = `'${className}' 클래스의 인스턴스 생성 → '${varName}'에 바인딩`;
    if (initMethodId) {
      explanation += ` (__init__ 호출 준비)`;
    }

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    // 하이라이트 초기화
    setTimeout(() => {
      instanceObj.highlight = false;
      pyName.highlight = false;
    }, 0);

    return step;
  },
};

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
