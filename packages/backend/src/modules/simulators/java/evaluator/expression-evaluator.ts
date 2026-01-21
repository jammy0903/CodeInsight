/**
 * Java Expression Evaluator
 * 간단한 표현식 평가기 (교육용)
 *
 * 지원:
 * - 산술 연산: +, -, *, /, %
 * - 비교 연산: ==, !=, <, >, <=, >=
 * - 논리 연산: &&, ||, !
 * - 변수 참조
 * - 리터럴: 숫자, 문자열, true, false, null
 */

import {
  JavaValue,
  JavaContext,
  createPrimitiveValue,
  createNullValue,
  createReferenceValue
} from '../runtime/types';
import { CallStack } from '../runtime/stack';
import { HeapManager } from '../runtime/heap';

export class ExpressionEvaluator {
  private stack: CallStack;
  private heap: HeapManager;

  constructor(stack: CallStack, heap: HeapManager) {
    this.stack = stack;
    this.heap = heap;
  }

  /**
   * 표현식 평가
   */
  evaluate(expr: string): JavaValue {
    expr = expr.trim();

    // null 리터럴
    if (expr === 'null') {
      return createNullValue();
    }

    // boolean 리터럴
    if (expr === 'true') {
      return createPrimitiveValue('boolean', true);
    }
    if (expr === 'false') {
      return createPrimitiveValue('boolean', false);
    }

    // 숫자 리터럴
    if (/^-?\d+$/.test(expr)) {
      return createPrimitiveValue('int', parseInt(expr));
    }
    if (/^-?\d+\.\d+$/.test(expr)) {
      return createPrimitiveValue('double', parseFloat(expr));
    }

    // 문자열 리터럴
    if (/^".*"$/.test(expr)) {
      const strValue = expr.substring(1, expr.length - 1);
      return createPrimitiveValue('String', strValue);
    }
    if (/^'.'$/.test(expr)) {
      const charValue = expr.substring(1, expr.length - 1);
      return createPrimitiveValue('char', charValue);
    }

    // 배열 생성: new int[5]
    if (expr.startsWith('new ') && expr.includes('[')) {
      return this.evaluateArrayCreation(expr);
    }

    // 객체 생성: new Person()
    if (expr.startsWith('new ') && expr.includes('(')) {
      return this.evaluateObjectCreation(expr);
    }

    // 배열 접근: arr[0]
    if (expr.includes('[') && expr.includes(']')) {
      return this.evaluateArrayAccess(expr);
    }

    // 필드 접근: obj.field
    if (expr.includes('.') && !expr.includes('(')) {
      return this.evaluateFieldAccess(expr);
    }

    // 메서드 호출: obj.method()
    if (expr.includes('.') && expr.includes('(')) {
      throw new Error('Method call evaluation not yet implemented');
    }

    // 산술 연산
    if (this.hasOperator(expr, ['+', '-', '*', '/', '%'])) {
      return this.evaluateArithmetic(expr);
    }

    // 비교 연산
    if (this.hasOperator(expr, ['==', '!=', '<=', '>=', '<', '>'])) {
      return this.evaluateComparison(expr);
    }

    // 논리 연산
    if (this.hasOperator(expr, ['&&', '||'])) {
      return this.evaluateLogical(expr);
    }

    // 단순 변수 참조
    const varValue = this.stack.getVariable(expr);
    if (varValue) {
      return varValue;
    }

    // 평가 실패
    throw new Error(`Cannot evaluate expression: ${expr}`);
  }

  /**
   * 배열 생성 평가: new int[5]
   */
  private evaluateArrayCreation(expr: string): JavaValue {
    // new int[5] → type: int, length: 5
    const match = expr.match(/new\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(\d+)\s*\]/);
    if (!match) {
      throw new Error(`Invalid array creation: ${expr}`);
    }

    const elementType = match[1];
    const length = parseInt(match[2]);

    const arrayId = this.heap.createArray(elementType, length);
    return createReferenceValue(`${elementType}[]`, arrayId);
  }

  /**
   * 객체 생성 평가: new Person()
   */
  private evaluateObjectCreation(expr: string): JavaValue {
    // new Person() → className: Person
    const match = expr.match(/new\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (!match) {
      throw new Error(`Invalid object creation: ${expr}`);
    }

    const className = match[1];
    const objectId = this.heap.createObject(className);
    return createReferenceValue(className, objectId);
  }

  /**
   * 배열 접근 평가: arr[0]
   */
  private evaluateArrayAccess(expr: string): JavaValue {
    const match = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\[\s*(.+?)\s*\]$/);
    if (!match) {
      throw new Error(`Invalid array access: ${expr}`);
    }

    const arrayName = match[1];
    const indexExpr = match[2];

    // 배열 변수 가져오기
    const arrayValue = this.stack.getVariable(arrayName);
    if (!arrayValue || !arrayValue.isReference || !arrayValue.objectId) {
      throw new Error(`Not an array: ${arrayName}`);
    }

    // 인덱스 평가
    const indexValue = this.evaluate(indexExpr);
    if (indexValue.type !== 'int' || typeof indexValue.value !== 'number') {
      throw new Error(`Array index must be int: ${indexExpr}`);
    }

    const index = indexValue.value;

    // Heap에서 배열 요소 가져오기
    return this.heap.getArrayElement(arrayValue.objectId, index);
  }

  /**
   * 필드 접근 평가: obj.field
   */
  private evaluateFieldAccess(expr: string): JavaValue {
    const parts = expr.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid field access: ${expr}`);
    }

    const objName = parts[0].trim();
    const fieldName = parts[1].trim();

    // 객체 변수 가져오기
    const objValue = this.stack.getVariable(objName);
    if (!objValue || !objValue.isReference || !objValue.objectId) {
      throw new Error(`Not an object: ${objName}`);
    }

    // Heap에서 필드 가져오기
    const fieldValue = this.heap.getField(objValue.objectId, fieldName);
    if (!fieldValue) {
      // 필드가 없으면 기본값 반환 (null)
      return createNullValue();
    }

    return fieldValue;
  }

  /**
   * 산술 연산 평가
   */
  private evaluateArithmetic(expr: string): JavaValue {
    // 간단한 이항 연산만 지원
    const operators = ['+', '-', '*', '/', '%'];

    for (const op of operators) {
      const parts = this.splitByOperator(expr, op);
      if (parts.length === 2) {
        const left = this.evaluate(parts[0]);
        const right = this.evaluate(parts[1]);

        if (typeof left.value !== 'number' || typeof right.value !== 'number') {
          throw new Error(`Arithmetic requires numbers: ${expr}`);
        }

        let result: number;
        switch (op) {
          case '+':
            result = left.value + right.value;
            break;
          case '-':
            result = left.value - right.value;
            break;
          case '*':
            result = left.value * right.value;
            break;
          case '/':
            result = Math.floor(left.value / right.value);
            break;
          case '%':
            result = left.value % right.value;
            break;
          default:
            throw new Error(`Unknown operator: ${op}`);
        }

        const resultType = left.type === 'double' || right.type === 'double' ? 'double' : 'int';
        return createPrimitiveValue(resultType, result);
      }
    }

    throw new Error(`Cannot evaluate arithmetic: ${expr}`);
  }

  /**
   * 비교 연산 평가
   */
  private evaluateComparison(expr: string): JavaValue {
    const operators = ['==', '!=', '<=', '>=', '<', '>'];

    for (const op of operators) {
      const parts = this.splitByOperator(expr, op);
      if (parts.length === 2) {
        const left = this.evaluate(parts[0]);
        const right = this.evaluate(parts[1]);

        let result: boolean;

        if (typeof left.value === 'number' && typeof right.value === 'number') {
          switch (op) {
            case '==':
              result = left.value === right.value;
              break;
            case '!=':
              result = left.value !== right.value;
              break;
            case '<':
              result = left.value < right.value;
              break;
            case '>':
              result = left.value > right.value;
              break;
            case '<=':
              result = left.value <= right.value;
              break;
            case '>=':
              result = left.value >= right.value;
              break;
            default:
              throw new Error(`Unknown operator: ${op}`);
          }
        } else {
          // 객체 비교는 참조 비교
          if (op === '==') {
            result = left.objectId === right.objectId;
          } else if (op === '!=') {
            result = left.objectId !== right.objectId;
          } else {
            throw new Error(`Cannot compare non-numbers with ${op}`);
          }
        }

        return createPrimitiveValue('boolean', result);
      }
    }

    throw new Error(`Cannot evaluate comparison: ${expr}`);
  }

  /**
   * 논리 연산 평가
   */
  private evaluateLogical(expr: string): JavaValue {
    // && 연산
    if (expr.includes('&&')) {
      const parts = expr.split('&&').map(p => p.trim());
      const left = this.evaluate(parts[0]);
      const right = this.evaluate(parts[1]);

      if (typeof left.value !== 'boolean' || typeof right.value !== 'boolean') {
        throw new Error(`Logical && requires boolean: ${expr}`);
      }

      return createPrimitiveValue('boolean', left.value && right.value);
    }

    // || 연산
    if (expr.includes('||')) {
      const parts = expr.split('||').map(p => p.trim());
      const left = this.evaluate(parts[0]);
      const right = this.evaluate(parts[1]);

      if (typeof left.value !== 'boolean' || typeof right.value !== 'boolean') {
        throw new Error(`Logical || requires boolean: ${expr}`);
      }

      return createPrimitiveValue('boolean', left.value || right.value);
    }

    throw new Error(`Cannot evaluate logical: ${expr}`);
  }

  /**
   * 표현식에 연산자가 포함되어 있는지 확인
   */
  private hasOperator(expr: string, operators: string[]): boolean {
    return operators.some(op => expr.includes(op));
  }

  /**
   * 연산자로 표현식 분리
   */
  private splitByOperator(expr: string, operator: string): string[] {
    const parts = expr.split(operator);
    if (parts.length === 2) {
      return [parts[0].trim(), parts[1].trim()];
    }
    return [];
  }
}
