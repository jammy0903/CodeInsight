/**
 * Print Handler
 * System.out.println 처리
 *
 * 패턴:
 * - System.out.println(x);
 * - System.out.println("Hello");
 * - System.out.println(a + b);
 */

import { JavaHandler, HandlerResult } from './types';
import { JavaContext, JavaEvent } from '../runtime/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { CallStack } from '../runtime/stack';
import { HeapManager } from '../runtime/heap';

export class PrintHandler implements JavaHandler {
  priority = 15;

  /**
   * System.out.println 패턴 확인
   */
  canHandle(line: string, context: JavaContext): boolean {
    return line.includes('System.out.println');
  }

  /**
   * 출력 처리
   */
  async handle(line: string, context: JavaContext): Promise<HandlerResult> {
    const stack = new CallStack();
    stack['frames'] = context.stack;

    const heap = new HeapManager();
    heap['objects'] = new Map(context.heap);

    const evaluator = new ExpressionEvaluator(stack, heap);
    const events: JavaEvent[] = [];

    // System.out.println(expr);
    const match = line.match(/System\.out\.println\s*\(\s*(.+?)\s*\)\s*;?/);
    if (!match) {
      return {
        success: false,
        explanation: 'println 파싱 실패',
        events: [],
        error: 'Invalid println syntax'
      };
    }

    const expr = match[1].trim();

    try {
      const value = evaluator.evaluate(expr);

      let outputStr: string;
      if (value.isReference) {
        if (value.objectId) {
          // 객체 출력 - 간단한 toString
          const obj = heap.getObject(value.objectId);
          if (obj?.isArray) {
            outputStr = `[배열 @${value.objectId}]`;
          } else {
            outputStr = `${obj?.className}@${value.objectId}`;
          }
        } else {
          outputStr = 'null';
        }
      } else {
        outputStr = String(value.value);
      }

      context.stdout += outputStr + '\n';

      events.push({
        type: 'OutputEvent',
        action: 'println',
        target: 'stdout',
        message: outputStr
      });

      return {
        success: true,
        explanation: `"${outputStr}"를 출력합니다.`,
        events
      };
    } catch (error: any) {
      return {
        success: false,
        explanation: '출력 실패',
        events: [],
        error: error.message
      };
    }
  }
}
