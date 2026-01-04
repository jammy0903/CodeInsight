/**
 * Handler Registry
 * 모든 핸들러를 등록하고 관리
 */

import type { CodeHandler } from './types';
import { IntHandler } from './int.handler';
import { ArrayHandler } from './array.handler';
import { PointerHandler } from './pointer.handler';
import { MallocHandler } from './malloc.handler';
import { IOHandler } from './io.handler';

// 기본 핸들러 목록 (우선순위순으로 정렬됨)
const defaultHandlers: CodeHandler[] = [
  MallocHandler, // priority: 30
  PointerHandler, // priority: 25
  ArrayHandler, // priority: 20
  IOHandler, // priority: 15
  IntHandler, // priority: 10
];

/**
 * 핸들러 레지스트리 클래스
 * - 핸들러 등록/제거
 * - 우선순위 기반 정렬
 * - 코드에 맞는 핸들러 찾기
 */
export class HandlerRegistry {
  private handlers: CodeHandler[] = [];

  constructor(useDefaults = true) {
    if (useDefaults) {
      this.handlers = [...defaultHandlers];
      this.sortByPriority();
    }
  }

  /**
   * 핸들러 등록
   */
  register(handler: CodeHandler): void {
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
  findHandler(code: string): CodeHandler | null {
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
  getAll(): CodeHandler[] {
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
export const registry = new HandlerRegistry();

// 타입 및 핸들러 re-export
export * from './types';
export { IntHandler } from './int.handler';
export { ArrayHandler } from './array.handler';
export { PointerHandler } from './pointer.handler';
export { MallocHandler } from './malloc.handler';
export { IOHandler } from './io.handler';
