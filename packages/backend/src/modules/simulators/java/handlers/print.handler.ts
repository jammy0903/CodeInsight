/**
 * Print Handler
 * System.out.println / System.out.print 처리
 *
 * 패턴:
 * - System.out.println(x);
 * - System.out.println("Hello");
 * - System.out.print(a + b);
 */

import { JavaHandler, HandlerResult } from './types';
import { JavaContext, JavaEvent } from '../runtime/types';
import { ExpressionEvaluator } from '../evaluator/expression-evaluator';
import { CallStack } from '../runtime/stack';
import { HeapManager } from '../runtime/heap';

export class PrintHandler implements JavaHandler {
  priority = 15;

  /**
   * System.out.print / println 패턴 확인
   */
  canHandle(line: string, context: JavaContext): boolean {
    return line.includes('System.out.print');
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

    // println인지 print인지 확인
    const isPrintln = line.includes('System.out.println');
    const printType = isPrintln ? 'println' : 'print';

    // System.out.println(expr); 또는 System.out.print(expr);
    const match = line.match(/System\.out\.print(?:ln)?\s*\(\s*(.+?)\s*\)\s*;?/);
    if (!match) {
      return {
        success: false,
        explanation: `${printType} 파싱 실패`,
        events: [],
        error: `Invalid ${printType} syntax`
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

      // println은 줄바꿈 추가, print는 줄바꿈 없음
      context.stdout += isPrintln ? outputStr + '\n' : outputStr;

      events.push({
        type: 'OutputEvent',
        action: printType,
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
