/**
 * Python Assign Handler
 *
 * 할당문 처리: a = 10, b = a, x = [1, 2, 3]
 *
 * C와의 핵심 차이:
 * - C: 값을 메모리 공간에 복사
 * - Python: 이름을 객체에 바인딩 (참조)
 */

import type { PyCodeHandler, PySimContext, PyStep, PyObject, PyType, PyChange } from '../types';
import { getName, getObjectByName } from '../context';

// 기본 할당 패턴: name = expression
const ASSIGN_PATTERN = /^(\w+)\s*=\s*(.+)$/;

export const AssignHandler: PyCodeHandler = {
  name: 'assign',
  priority: 10,

  canHandle(code: string): boolean {
    // 비교 연산자 제외 (==, !=, <=, >=)
    if (/[=!<>]=/.test(code)) {
      return false;
    }
    return ASSIGN_PATTERN.test(code);
  },

  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null {
    const match = code.match(ASSIGN_PATTERN);
    if (!match) return null;

    const [, varName, expr] = match;
    const trimmedExpr = expr.trim();

    // 이전 바인딩 확인 (재할당 감지)
    const oldName = getName(ctx, varName);
    const oldObjectId = oldName?.pointsTo;

    // 표현식 평가 → 객체 생성 또는 참조
    const obj = evaluateExpr(ctx, trimmedExpr);

    // 이름 바인딩 (현재 스코프: 함수 내부면 로컬, 아니면 글로벌)
    const scope = ctx.getCurrentScope();
    const pyName = ctx.bindName(varName, obj.id, scope);
    pyName.highlight = true;
    obj.highlight = true;

    // 변경 사항 추적
    const changes: PyChange[] = [];
    if (oldObjectId && oldObjectId !== obj.id) {
      changes.push({ type: 'rebind', name: varName, objectId: obj.id, oldObjectId });
    } else if (!oldObjectId) {
      changes.push({ type: 'bind', name: varName, objectId: obj.id });
    }

    // 설명 생성
    const explanation = generateExplanation(varName, obj, !!oldObjectId);

    const step = ctx.createStep(lineNum, code, explanation);
    step.changes = changes;

    // 하이라이트 초기화 (다음 스텝용)
    setTimeout(() => {
      pyName.highlight = false;
      obj.highlight = false;
    }, 0);

    return step;
  },
};

/**
 * 표현식 평가
 * 리터럴 → 새 객체 생성
 * 변수명 → 기존 객체 참조
 */
function evaluateExpr(ctx: PySimContext, expr: string): PyObject {
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

  // 문자열 (따옴표)
  if (/^["'].*["']$/.test(trimmed)) {
    const str = trimmed.slice(1, -1);
    return ctx.createObject('str', str);
  }

  // 리스트 (간단한 형태: [1, 2, 3])
  if (/^\[.*\]$/.test(trimmed)) {
    return parseList(ctx, trimmed);
  }

  // 튜플 (간단한 형태: (1, 2, 3))
  if (/^\(.*\)$/.test(trimmed)) {
    return parseTuple(ctx, trimmed);
  }

  // 딕셔너리 (간단한 형태: {"a": 1})
  if (/^\{.*:.*\}$/.test(trimmed)) {
    return parseDict(ctx, trimmed);
  }

  // 셋 (간단한 형태: {1, 2, 3})
  if (/^\{[^:]+\}$/.test(trimmed) && trimmed !== '{}') {
    return parseSet(ctx, trimmed);
  }

  // 빈 딕셔너리
  if (trimmed === '{}') {
    return ctx.createObject('dict', []);
  }

  // 변수 참조 (현재 프레임 로컬 → 글로벌 순서로 탐색)
  const existingObj = getObjectFromContext(ctx, trimmed);
  if (existingObj) {
    return existingObj;
  }

  // 알 수 없는 표현식 → 문자열로 저장
  return ctx.createObject('str', trimmed);
}

/**
 * 리스트 파싱 [1, 2, 3]
 */
function parseList(ctx: PySimContext, expr: string): PyObject {
  const inner = expr.slice(1, -1).trim();
  if (!inner) {
    return ctx.createObject('list', []);
  }

  const elements = splitByComma(inner);
  const refs = elements.map((el) => {
    const obj = evaluateExpr(ctx, el.trim());
    return { objectId: obj.id };
  });

  return ctx.createObject('list', refs);
}

/**
 * 튜플 파싱 (1, 2, 3)
 */
function parseTuple(ctx: PySimContext, expr: string): PyObject {
  const inner = expr.slice(1, -1).trim();
  if (!inner) {
    return ctx.createObject('tuple', []);
  }

  const elements = splitByComma(inner);
  const refs = elements.map((el) => {
    const obj = evaluateExpr(ctx, el.trim());
    return { objectId: obj.id };
  });

  return ctx.createObject('tuple', refs);
}

/**
 * 딕셔너리 파싱 {"a": 1}
 */
function parseDict(ctx: PySimContext, expr: string): PyObject {
  const inner = expr.slice(1, -1).trim();
  if (!inner) {
    return ctx.createObject('dict', []);
  }

  // 간단한 key:value 파싱
  const pairs = splitByComma(inner);
  const entries = pairs.map((pair) => {
    const colonIdx = pair.indexOf(':');
    if (colonIdx === -1) return null;

    const keyExpr = pair.slice(0, colonIdx).trim();
    const valExpr = pair.slice(colonIdx + 1).trim();

    const keyObj = evaluateExpr(ctx, keyExpr);
    const valObj = evaluateExpr(ctx, valExpr);

    return {
      key: { objectId: keyObj.id },
      value: { objectId: valObj.id },
    };
  }).filter(Boolean);

  return ctx.createObject('dict', entries as any);
}

/**
 * 셋 파싱 {1, 2, 3}
 */
function parseSet(ctx: PySimContext, expr: string): PyObject {
  const inner = expr.slice(1, -1).trim();
  if (!inner) {
    return ctx.createObject('set', []);
  }

  const elements = splitByComma(inner);
  const refs = elements.map((el) => {
    const obj = evaluateExpr(ctx, el.trim());
    return { objectId: obj.id };
  });

  return ctx.createObject('set', refs);
}

/**
 * 콤마로 분리 (중첩 괄호 고려)
 */
function splitByComma(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';

  for (const char of str) {
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

    if (char === '[' || char === '(' || char === '{') {
      depth++;
      current += char;
      continue;
    }

    if (char === ']' || char === ')' || char === '}') {
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
 * 설명 생성
 */
function generateExplanation(varName: string, obj: PyObject, isRebind: boolean): string {
  const typeKor = getTypeKorean(obj.type);
  const valueStr = formatValue(obj);

  if (isRebind) {
    return `'${varName}' 이름이 새로운 ${typeKor} 객체 ${valueStr}를 참조하도록 변경`;
  }

  return `'${varName}' 이름이 ${typeKor} 객체 ${valueStr}를 참조`;
}

function getTypeKorean(type: PyType): string {
  const map: Record<PyType, string> = {
    int: '정수',
    float: '실수',
    str: '문자열',
    bool: '불리언',
    NoneType: 'None',
    list: '리스트',
    tuple: '튜플',
    dict: '딕셔너리',
    set: '셋',
    function: '함수',
    class: '클래스',
    instance: '인스턴스',
  };
  return map[type] || type;
}

function formatValue(obj: PyObject): string {
  if (obj.type === 'str') {
    return `"${obj.value}"`;
  }
  if (obj.type === 'NoneType') {
    return 'None';
  }
  if (obj.type === 'bool') {
    return obj.value ? 'True' : 'False';
  }
  if (obj.type === 'list' || obj.type === 'tuple' || obj.type === 'set') {
    return `(${(obj.value as any[]).length}개 요소)`;
  }
  if (obj.type === 'dict') {
    return `(${(obj.value as any[]).length}개 쌍)`;
  }
  return String(obj.value);
}

/**
 * 컨텍스트에서 객체 가져오기 (프레임 로컬 우선)
 */
function getObjectFromContext(ctx: PySimContext, name: string): PyObject | null {
  const frame = ctx.getCurrentFrame();

  // 1. 현재 프레임의 로컬 변수에서 찾기
  if (frame) {
    const localName = frame.localNames.get(name);
    if (localName) {
      const obj = ctx.getObject(localName.pointsTo);
      if (obj) return obj;
    }
  }

  // 2. 글로벌에서 찾기
  return getObjectByName(ctx, name) || null;
}
