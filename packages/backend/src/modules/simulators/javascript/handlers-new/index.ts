/**
 * JavaScript Handler Registry
 *
 * 모든 JavaScript 핸들러를 등록하고 관리
 */

import type { JsCodeHandler } from '../types-new';
import { VariableDeclarationHandler } from './variable-declaration.handler';
import { AssignmentHandler } from './assignment.handler';
import { ConsoleLogHandler } from './console-log.handler';

// 기본 핸들러 목록 (우선순위순)
const defaultHandlers: JsCodeHandler[] = [
  ConsoleLogHandler,          // priority: 25
  VariableDeclarationHandler, // priority: 20
  AssignmentHandler,          // priority: 15
];

/**
 * JavaScript 핸들러 레지스트리
 */
export class JsHandlerRegistry {
  private handlers: JsCodeHandler[] = [];

  constructor(useDefaults = true) {
    if (useDefaults) {
      this.handlers = [...defaultHandlers];
      this.sortByPriority();
    }
  }

  /**
   * 핸들러 등록
   */
  register(handler: JsCodeHandler): void {
    this.handlers.push(handler);
    this.sortByPriority();
  }

  /**
   * 핸들러 제거
   */
  unregister(name: string): void {
    this.handlers = this.handlers.filter((h) => h.name !== name);
  }

  /**
   * 코드를 처리할 수 있는 핸들러 찾기
   */
  findHandler(code: string): JsCodeHandler | null {
    for (const handler of this.handlers) {
      if (handler.canHandle(code)) {
        return handler;
      }
    }
    return null;
  }

  /**
   * 모든 핸들러 목록
   */
  getAll(): JsCodeHandler[] {
    return [...this.handlers];
  }

  /**
   * 우선순위 기준 정렬 (높은 것 먼저)
   */
  private sortByPriority(): void {
    this.handlers.sort((a, b) => b.priority - a.priority);
  }
}

// 싱글톤 인스턴스
export const jsHandlerRegistry = new JsHandlerRegistry();

// Re-exports
export { VariableDeclarationHandler } from './variable-declaration.handler';
export { AssignmentHandler } from './assignment.handler';
export { ConsoleLogHandler } from './console-log.handler';
