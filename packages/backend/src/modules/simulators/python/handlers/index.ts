/**
 * Python Handler Registry
 *
 * 모든 Python 핸들러를 등록하고 관리
 */

import type { PyCodeHandler, PyBlockHandler } from '../types';
import { AssignHandler } from './assign.handler';
import { PrintHandler } from './print.handler';
import { ReturnHandler } from './return.handler';
import { FunctionCallHandler, AssignFunctionCallHandler } from './function-call.handler';
import { MethodCallHandler, AssignMethodCallHandler } from './method-call.handler';
import { InstanceCreateHandler } from './instance-create.handler';
import { AttributeAssignHandler } from './attribute.handler';
import { FunctionDefHandler } from './function-def.handler';
import { ClassDefHandler } from './class-def.handler';
import { GlobalNonlocalHandler } from './global.handler';
import { BuiltinFunctionHandler, AssignBuiltinHandler } from './builtin.handler';

// 기본 핸들러 목록 (우선순위순)
const defaultHandlers: PyCodeHandler[] = [
  ReturnHandler, // priority: 30
  AssignBuiltinHandler, // priority: 29 - id(), type(), len() 할당
  BuiltinFunctionHandler, // priority: 28 - id(), type(), len() 단독
  AssignMethodCallHandler, // priority: 27
  InstanceCreateHandler, // priority: 26
  AssignFunctionCallHandler, // priority: 25
  AttributeAssignHandler, // priority: 22
  MethodCallHandler, // priority: 21
  FunctionCallHandler, // priority: 20
  PrintHandler, // priority: 15
  AssignHandler, // priority: 10
  GlobalNonlocalHandler, // priority: 5 (global/nonlocal 선언문 스킵)
];

// 블록 핸들러 목록 (함수, 클래스 정의 등)
const defaultBlockHandlers: PyBlockHandler[] = [
  ClassDefHandler, // priority: 55
  FunctionDefHandler, // priority: 50
];

/**
 * Python 핸들러 레지스트리
 */
export class PyHandlerRegistry {
  private handlers: PyCodeHandler[] = [];
  private blockHandlers: PyBlockHandler[] = [];

  constructor(useDefaults = true) {
    if (useDefaults) {
      this.handlers = [...defaultHandlers];
      this.blockHandlers = [...defaultBlockHandlers];
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
   * 블록 핸들러 등록
   */
  registerBlock(handler: PyBlockHandler): void {
    this.blockHandlers.push(handler);
    this.sortBlockByPriority();
  }

  /**
   * 핸들러 제거
   */
  unregister(name: string): void {
    this.handlers = this.handlers.filter((h) => h.name !== name);
    this.blockHandlers = this.blockHandlers.filter((h) => h.name !== name);
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
   * 블록 핸들러 찾기
   */
  findBlockHandler(code: string): PyBlockHandler | null {
    for (const handler of this.blockHandlers) {
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
   * 모든 블록 핸들러 목록
   */
  getAllBlock(): PyBlockHandler[] {
    return [...this.blockHandlers];
  }

  /**
   * 우선순위 기준 정렬 (높은 것 먼저)
   */
  private sortByPriority(): void {
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 블록 핸들러 우선순위 정렬
   */
  private sortBlockByPriority(): void {
    this.blockHandlers.sort((a, b) => b.priority - a.priority);
  }
}

// 싱글톤 인스턴스
export const pyHandlerRegistry = new PyHandlerRegistry();

// Re-exports
export { AssignHandler } from './assign.handler';
export { PrintHandler } from './print.handler';
export { ReturnHandler } from './return.handler';
export { FunctionCallHandler, AssignFunctionCallHandler } from './function-call.handler';
export { MethodCallHandler, AssignMethodCallHandler } from './method-call.handler';
export { InstanceCreateHandler } from './instance-create.handler';
export { AttributeAssignHandler } from './attribute.handler';
export { FunctionDefHandler } from './function-def.handler';
export { ClassDefHandler } from './class-def.handler';
export { GlobalNonlocalHandler } from './global.handler';
export { BuiltinFunctionHandler, AssignBuiltinHandler, evaluateBuiltinExpression } from './builtin.handler';
