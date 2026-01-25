/**
 * Python Attribute Handler
 *
 * 속성 할당 처리: self.attr = value, obj.attr = value
 *
 * 인스턴스 속성 설정:
 * 1. 인스턴스 객체 찾기
 * 2. 값 평가
 * 3. 속성에 값 저장
 */

import type {
  PyCodeHandler,
  PySimContext,
  PyStep,
  PyInstanceValue,
  PyChange,
} from '../types';
import { resolveNameToObject, getObjectByName } from '../context';

// 속성 할당 패턴: obj.attr = value
const ATTR_ASSIGN_PATTERN = /^(\w+)\.(\w+)\s*=\s*(.+)$/;

// 속성 접근 패턴: obj.attr (읽기)
const ATTR_ACCESS_PATTERN = /^(\w+)\.(\w+)$/;

export const AttributeAssignHandler: PyCodeHandler = {
  name: 'attribute-assign',
  priority: 22,

  canHandle(code: string): boolean {
    // 비교 연산자 제외
    if (/[=!<>]=/.test(code)) {
      return false;
    }
    return ATTR_ASSIGN_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(ATTR_ASSIGN_PATTERN);
    if (!match) return null;

    const [, objName, attrName, valueExpr] = match;
    const changes: PyChange[] = [];

    // 객체 찾기 (self 또는 다른 인스턴스)
    let instanceObj;
    let instanceValue: PyInstanceValue;

    if (objName === 'self') {
      // 현재 프레임에서 self 찾기
      const frame = ctx.getCurrentFrame();
      if (!frame?.selfObjectId) {
        return ctx.createStep(lineNum, code, `'self'를 찾을 수 없음`);
      }

      instanceObj = ctx.getObject(frame.selfObjectId);
    } else {
      // 일반 변수에서 찾기
      const result = resolveNameToObject(ctx, objName);
      if (!result) {
        return ctx.createStep(lineNum, code, `알 수 없는 객체: ${objName}`);
      }
      instanceObj = result.object;
    }

    if (!instanceObj || instanceObj.type !== 'instance') {
      return ctx.createStep(
        lineNum,
        code,
        `'${objName}'는 인스턴스가 아닙니다`
      );
    }

    instanceValue = instanceObj.value as PyInstanceValue;

    // 값 평가
    const valueObj = evaluateExpr(ctx, valueExpr.trim());

    // 속성에 값 저장
    const oldAttrId = instanceValue.attributes[attrName];
    instanceValue.attributes[attrName] = valueObj.id;

    // 변경 사항 추적
    if (oldAttrId) {
      changes.push({
        type: 'rebind',
        name: `${objName}.${attrName}`,
        objectId: valueObj.id,
        oldObjectId: oldAttrId,
      });
    } else {
      changes.push({
        type: 'bind',
        name: `${objName}.${attrName}`,
        objectId: valueObj.id,
      });
    }

    // 설명 생성
    const valueStr = formatValue(valueObj);
    const explanation = oldAttrId
      ? `'${objName}.${attrName}' 속성이 새로운 값 ${valueStr}를 참조하도록 변경`
      : `'${objName}.${attrName}' 속성에 ${valueStr} 바인딩`;

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    return step;
  },
};

/**
 * 표현식 평가 (현재 프레임의 로컬 변수 우선)
 */
function evaluateExpr(ctx: PySimContext, expr: string): { id: string; type: string; value: unknown } {
  const trimmed = expr.trim();
  const currentFrame = ctx.getCurrentFrame();

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

  // 문자열 연결: "text" + var
  const concatMatch = trimmed.match(/^["'](.*)["']\s*\+\s*(\w+)$/);
  if (concatMatch) {
    const [, strPart, varName] = concatMatch;
    const varObj = getObjectFromContext(ctx, varName, currentFrame);
    if (varObj) {
      const varValue = varObj.type === 'str' ? varObj.value : String(varObj.value);
      return ctx.createObject('str', strPart + varValue);
    }
    return ctx.createObject('str', strPart + varName);
  }

  // 변수 참조 (현재 프레임 로컬 → 글로벌)
  const existingObj = getObjectFromContext(ctx, trimmed, currentFrame);
  if (existingObj) {
    return existingObj;
  }

  // 알 수 없는 표현식 → 문자열로 저장
  return ctx.createObject('str', trimmed);
}

/**
 * 컨텍스트에서 객체 가져오기 (프레임 로컬 우선)
 */
function getObjectFromContext(
  ctx: PySimContext,
  name: string,
  frame?: { localNames: Map<string, { pointsTo: string }> }
): ReturnType<typeof ctx.getObject> | null {
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
 * 값 포맷
 */
function formatValue(obj: { type: string; value: unknown }): string {
  switch (obj.type) {
    case 'str':
      return `"${obj.value}"`;
    case 'int':
    case 'float':
      return String(obj.value);
    case 'bool':
      return obj.value ? 'True' : 'False';
    case 'NoneType':
      return 'None';
    default:
      return String(obj.value);
  }
}
