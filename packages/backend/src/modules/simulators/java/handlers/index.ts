/**
 * Java Handler Registry
 * 우선순위 기반 핸들러 레지스트리
 */

import { JavaHandler, HandlerResult } from './types';
import { JavaContext } from '../runtime/types';
import { VariableHandler } from './variable.handler';
import { PrintHandler } from './print.handler';

/**
 * 핸들러 레지스트리
 */
export class JavaHandlerRegistry {
  private handlers: JavaHandler[];

  constructor(customHandlers?: JavaHandler[]) {
    // 기본 핸들러들 (우선순위 순서)
    const defaultHandlers: JavaHandler[] = [
      new PrintHandler(),       // priority: 15
      new VariableHandler(),    // priority: 10
    ];

    this.handlers = customHandlers || defaultHandlers;

    // 우선순위 높은 순으로 정렬
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 라인을 처리할 수 있는 핸들러 찾기
   */
  findHandler(line: string, context: JavaContext): JavaHandler | undefined {
    return this.handlers.find(handler => handler.canHandle(line, context));
  }

  /**
   * 라인 처리
   */
  async handleLine(line: string, context: JavaContext): Promise<HandlerResult> {
    const handler = this.findHandler(line, context);

    if (!handler) {
      // 처리할 수 없는 라인
      return {
        success: false,
        explanation: `처리할 수 없는 라인: ${line}`,
        events: [],
        error: 'No handler found'
      };
    }

    return handler.handle(line, context);
  }

  /**
   * 핸들러 추가
   */
  addHandler(handler: JavaHandler): void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 등록된 핸들러 목록
   */
  getHandlers(): JavaHandler[] {
    return [...this.handlers];
  }
}

/**
 * 기본 핸들러 레지스트리 생성
 */
export function createDefaultRegistry(): JavaHandlerRegistry {
  return new JavaHandlerRegistry();
}
