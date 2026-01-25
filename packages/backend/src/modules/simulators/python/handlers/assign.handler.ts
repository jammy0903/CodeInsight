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

    // UnboundLocalError 체크 (표현식에서 참조하는 변수가 unbound local인지)
    const unboundVar = checkUnboundLocalInExpr(ctx, trimmedExpr);
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

    // 이전 바인딩 확인 (재할당 감지)
    const oldName = getName(ctx, varName);
    const oldObjectId = oldName?.pointsTo;

    // 표현식 평가 → 객체 생성 또는 참조
    const obj = evaluateExpr(ctx, trimmedExpr);

    // 이름 바인딩 스코프 결정
    // - global 선언된 변수 → 전역 스코프
    // - 그 외 → 현재 스코프 (함수 내부면 로컬, 아니면 글로벌)
    const frame = ctx.getCurrentFrame();
    const isGlobalVar = frame?.globalVars?.has(varName);
    const scope = isGlobalVar ? 'global' : ctx.getCurrentScope();
    const pyName = ctx.bindName(varName, obj.id, scope);
    pyName.highlight = true;
    obj.highlight = true;

    // unboundLocals에서 제거 (변수가 바인딩되었으므로)
    if (frame?.unboundLocals) {
      frame.unboundLocals.delete(varName);
    }

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

  // 산술 연산: +, -, *, /, %, **, //
  // 비탐욕적 매칭으로 왼쪽에서 오른쪽 결합 (left-to-right associativity)
  // 예: a + b + c → (a + b) + c
  // 2글자 연산자(**,//)를 먼저 매칭하고, 그 다음 1글자 연산자 매칭
  const binaryMatch = trimmed.match(/^(.+?)\s*(\*\*|\/\/|[+\-*/%])\s*(.+)$/);
  if (binaryMatch) {
    const [, leftExpr, operator, rightExpr] = binaryMatch;

    // 재귀적으로 좌변, 우변 평가
    const leftObj = evaluateExpr(ctx, leftExpr.trim());
    const rightObj = evaluateExpr(ctx, rightExpr.trim());

    // 타입 체크: 숫자 타입만 산술 연산 지원
    if (!isNumeric(leftObj) || !isNumeric(rightObj)) {
      const leftType = leftObj.type;
      const rightType = rightObj.type;
      throw new Error(
        `TypeError: unsupported operand type(s) for ${operator}: '${leftType}' and '${rightType}'`
      );
    }

    // 연산 수행
    const leftVal = leftObj.value as number;
    const rightVal = rightObj.value as number;
    const result = performArithmetic(leftVal, operator, rightVal);

    // 결과 타입 결정: int + float = float (Python 동작)
    const resultType = (leftObj.type === 'float' || rightObj.type === 'float')
      ? 'float'
      : 'int';

    return ctx.createObject(resultType, result);
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
 * 컨텍스트에서 객체 가져오기 (프레임 로컬 우선, global 선언 고려)
 */
function getObjectFromContext(ctx: PySimContext, name: string): PyObject | null {
  const frame = ctx.getCurrentFrame();

  // global 선언된 변수는 전역에서만 찾기
  if (frame?.globalVars?.has(name)) {
    return getObjectByName(ctx, name) || null;
  }

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

/**
 * 표현식에서 UnboundLocalError 체크
 * 표현식에 사용된 변수 중 unbound local이 있으면 해당 변수명 반환
 *
 * Python 동작:
 * - 함수 본문에서 할당되는 변수는 "로컬"로 간주됨
 * - 해당 변수가 할당 전에 참조되면 UnboundLocalError
 */
function checkUnboundLocalInExpr(ctx: PySimContext, expr: string): string | null {
  const frame = ctx.getCurrentFrame();
  if (!frame?.unboundLocals || frame.unboundLocals.size === 0) {
    return null;
  }

  // 표현식에서 변수명 추출 (간단한 패턴)
  // 리터럴(숫자, 문자열, bool, None)이 아닌 식별자
  const trimmed = expr.trim();

  // 리터럴 체크
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return null;  // 숫자
  if (/^["'].*["']$/.test(trimmed)) return null;     // 문자열
  if (['True', 'False', 'None'].includes(trimmed)) return null;
  if (/^[\[\(\{]/.test(trimmed)) return null;        // 컬렉션

  // 단순 변수 참조
  if (/^\w+$/.test(trimmed)) {
    if (frame.unboundLocals.has(trimmed)) {
      return trimmed;
    }
    return null;
  }

  // 복합 표현식 (a + b, func(x) 등)에서 변수 추출
  const identifiers = trimmed.match(/\b([a-zA-Z_]\w*)\b/g) || [];
  for (const id of identifiers) {
    // 예약어 및 내장 함수 제외
    if (['True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple'].includes(id)) {
      continue;
    }
    if (frame.unboundLocals.has(id)) {
      return id;
    }
  }

  return null;
}

/**
 * 숫자 타입 체크 (int 또는 float)
 */
function isNumeric(obj: PyObject): boolean {
  return obj.type === 'int' || obj.type === 'float';
}

/**
 * 산술 연산 수행
 * @throws ZeroDivisionError (0으로 나눌 때)
 */
function performArithmetic(left: number, op: string, right: number): number {
  switch (op) {
    case '+':
      return left + right;
    case '-':
      return left - right;
    case '*':
      return left * right;
    case '/':
      if (right === 0) {
        throw new Error('ZeroDivisionError: division by zero');
      }
      return left / right;
    case '%':
      if (right === 0) {
        throw new Error('ZeroDivisionError: integer modulo by zero');
      }
      // Python의 % 연산자는 항상 right와 같은 부호의 결과를 반환
      return ((left % right) + right) % right;
    case '**':
      return Math.pow(left, right);
    case '//':
      if (right === 0) {
        throw new Error('ZeroDivisionError: integer floor division by zero');
      }
      // Python의 // 연산자는 floor division (음수 방향으로 내림)
      return Math.floor(left / right);
    default:
      throw new Error(`Unknown operator: ${op}`);
  }
}
