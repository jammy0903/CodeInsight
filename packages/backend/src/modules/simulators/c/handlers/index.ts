/**
 * Handler Registry
 * 모든 핸들러를 등록하고 관리
 */

import type { CodeHandler } from './types';
import { VariableHandler } from './variable.handler';
import { ArrayHandler } from './array.handler';
import { PointerHandler } from './pointer.handler';
import { MallocHandler } from './malloc.handler';
import { IOHandler } from './io.handler';
import { FunctionCallHandler } from './function.handler';
import { StructHandler } from './struct.handler';
import { BitwiseHandler } from './bitwise.handler';
import { FunctionPointerHandler } from './function-pointer.handler';
import { DoublePointerHandler } from './double-pointer.handler';

// 기본 핸들러 목록 (우선순위순으로 정렬됨)
const defaultHandlers: CodeHandler[] = [
  MallocHandler, // priority: 30
  FunctionPointerHandler, // priority: 27 (NEW!)
  DoublePointerHandler, // priority: 26 (NEW!)
  PointerHandler, // priority: 25
  StructHandler, // priority: 22 (struct 정의/선언/멤버접근)
  ArrayHandler, // priority: 20
  BitwiseHandler, // priority: 18 (비트 연산 시각화)
  IOHandler, // priority: 15
  VariableHandler, // priority: 10 (모든 primitive 타입: int, float, double, char, unsigned 등)
  FunctionCallHandler, // priority: 5 (가장 낮음 - 일반 함수 호출)
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
   * 참고: 핸들러가 canHandle=true지만 handle이 null을 반환할 수 있음
   *       이 경우 findHandlerWithFallback 사용 권장
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
   * 핸들러 찾기 (폴백 지원)
   * handle()이 null을 반환하면 다음 핸들러 시도
   */
  findHandlerWithFallback(code: string, ctx: { variables: Map<string, unknown> }): CodeHandler | null {
    for (const handler of this.handlers) {
      if (handler.canHandle(code)) {
        // 포인터/배열 구분을 위해 변수 타입 확인
        if (handler.name === 'pointer') {
          const match = code.match(/^(\w+)\s*\[/);
          if (match) {
            const varName = match[1];
            const variable = ctx.variables.get(varName) as { is_array?: boolean } | undefined;
            if (variable?.is_array) {
              continue; // 배열이면 다음 핸들러 시도
            }
          }
        }
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
export { VariableHandler } from './variable.handler';
export { ArrayHandler } from './array.handler';
export { PointerHandler } from './pointer.handler';
export { MallocHandler } from './malloc.handler';
export { IOHandler } from './io.handler';
export { FunctionCallHandler } from './function.handler';
export { StructHandler } from './struct.handler';
export { BitwiseHandler } from './bitwise.handler';
export { FunctionPointerHandler } from './function-pointer.handler';
export { DoublePointerHandler } from './double-pointer.handler';

// TypeRegistry re-export
export { cTypeRegistry, TypeRegistry, type TypeInfo } from '../types';
