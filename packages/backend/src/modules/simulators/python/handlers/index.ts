/**
 * Python Handler Registry
 *
 * 모든 Python 핸들러를 등록하고 관리
 */

import type { PyCodeHandler } from '../types';
import { AssignHandler } from './assign.handler';
import { PrintHandler } from './print.handler';

// 기본 핸들러 목록 (우선순위순)
const defaultHandlers: PyCodeHandler[] = [
  PrintHandler, // priority: 15
  AssignHandler, // priority: 10
];

/**
 * Python 핸들러 레지스트리
 */
export class PyHandlerRegistry {
  private handlers: PyCodeHandler[] = [];

  constructor(useDefaults = true) {
    if (useDefaults) {
      this.handlers = [...defaultHandlers];
      this.sortByPriority();
    }
  }

  /**
   * 핸들러 등록
   */
  register(handler: PyCodeHandler): void {
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
  findHandler(code: string): PyCodeHandler | null {
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
  getAll(): PyCodeHandler[] {
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
export const pyHandlerRegistry = new PyHandlerRegistry();

// Re-exports
export { AssignHandler } from './assign.handler';
export { PrintHandler } from './print.handler';
