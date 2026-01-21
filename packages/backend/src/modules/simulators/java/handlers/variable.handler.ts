/**
 * Variable Handler
 * 변수 선언 및 할당 처리
 *
 * 패턴:
 * - int x = 10;
 * - String name = "Alice";
 * - int x;  (선언만)
 * - x = 20; (재할당)
 */

import { JavaHandler, HandlerResult } from './types';
import { JavaContext, JavaEvent, getDefaultValue } from '../runtime/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { CallStack } from '../runtime/stack';
import { HeapManager } from '../runtime/heap';

export class VariableHandler implements JavaHandler {
  priority = 10;

  /**
   * 변수 선언/할당 패턴 확인
   */
  canHandle(line: string, context: JavaContext): boolean {
    // 선언과 할당: int x = 10;
    const declareAndAssign = /^(int|double|boolean|char|String|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+);?\s*$/;

    // 선언만: int x;
    const declareOnly = /^(int|double|boolean|char|String|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;?\s*$/;

    // 재할당: x = 20;
    const reassign = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+);?\s*$/;

    return declareAndAssign.test(line) || declareOnly.test(line) || reassign.test(line);
  }

  /**
   * 변수 선언/할당 처리
   */
  async handle(line: string, context: JavaContext): Promise<HandlerResult> {
    const stack = new CallStack();
    stack['frames'] = context.stack;

    const heap = new HeapManager();
    heap['objects'] = new Map(context.heap);

    const evaluator = new ExpressionEvaluator(stack, heap);
    const events: JavaEvent[] = [];

    line = line.replace(/;$/, '').trim();

    // 선언과 할당: int x = 10;
    const declareAndAssignMatch = line.match(
      /^(int|double|boolean|char|String|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/
    );

    if (declareAndAssignMatch) {
      const type = declareAndAssignMatch[1];
      const varName = declareAndAssignMatch[2];
      const expr = declareAndAssignMatch[3].trim();

      try {
        // 표현식 평가
        const value = evaluator.evaluate(expr);
        stack.setVariable(varName, value);

        // Heap 변경사항 반영
        context.heap = heap['objects'];

        events.push({
          type: 'VariableEvent',
          action: 'declare',
          target: varName,
          value,
          message: `변수 ${varName} 선언 및 초기화`
        });

        const explanation = this.explainDeclaration(type, varName, value);

        return {
          success: true,
          explanation,
          events
        };
      } catch (error: any) {
        return {
          success: false,
          explanation: `변수 ${varName} 초기화 실패`,
          events: [],
          error: error.message
        };
      }
    }

    // 선언만: int x;
    const declareOnlyMatch = line.match(
      /^(int|double|boolean|char|String|[A-Z][a-zA-Z0-9_]*)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*$/
    );

    if (declareOnlyMatch) {
      const type = declareOnlyMatch[1];
      const varName = declareOnlyMatch[2];

      const defaultValue = getDefaultValue(type);
      stack.setVariable(varName, defaultValue);

      events.push({
        type: 'VariableEvent',
        action: 'declare',
        target: varName,
        value: defaultValue,
        message: `변수 ${varName} 선언 (기본값)`
      });

      const explanation = `변수 ${varName}을 ${type} 타입으로 선언하고 기본값으로 초기화합니다.`;

      return {
        success: true,
        explanation,
        events
      };
    }

    // 재할당: x = 20;
    const reassignMatch = line.match(
      /^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/
    );

    if (reassignMatch) {
      const varName = reassignMatch[1];
      const expr = reassignMatch[2].trim();

      if (!stack.hasVariable(varName)) {
        return {
          success: false,
          explanation: `변수 ${varName}이 선언되지 않았습니다.`,
          events: [],
          error: `Undeclared variable: ${varName}`
        };
      }

      try {
        const value = evaluator.evaluate(expr);
        stack.setVariable(varName, value);

        // Heap 변경사항 반영
        context.heap = heap['objects'];

        events.push({
          type: 'VariableEvent',
          action: 'assign',
          target: varName,
          value,
          message: `변수 ${varName}에 값 할당`
        });

        const explanation = this.explainAssignment(varName, value);

        return {
          success: true,
          explanation,
          events
        };
      } catch (error: any) {
        return {
          success: false,
          explanation: `변수 ${varName} 할당 실패`,
          events: [],
          error: error.message
        };
      }
    }

    return {
      success: false,
      explanation: '변수 처리 실패',
      events: [],
      error: 'No matching pattern'
    };
  }

  /**
   * 선언 설명 생성
   */
  private explainDeclaration(type: string, varName: string, value: any): string {
    const valueStr = value.isReference
      ? (value.objectId ? `참조 @${value.objectId}` : 'null')
      : `${value.value}`;

    return `${type} 타입의 변수 ${varName}을 선언하고 ${valueStr}로 초기화합니다.`;
  }

  /**
   * 할당 설명 생성
   */
  private explainAssignment(varName: string, value: any): string {
    const valueStr = value.isReference
      ? (value.objectId ? `참조 @${value.objectId}` : 'null')
      : `${value.value}`;

    return `변수 ${varName}에 ${valueStr}를 할당합니다.`;
  }
}
