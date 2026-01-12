/**
 * Scope Manager
 * 변수 스코프 관리
 *
 * 역할:
 * - 변수 선언/조회/수정
 * - 스코프 체인 탐색 (로컬 → 글로벌)
 */

import type { Scope, Variable } from './types';
import { CallStack } from './call-stack';

export class ScopeManager {
  private callStack: CallStack;
  private globalScope: Scope;

  constructor(callStack: CallStack) {
    this.callStack = callStack;
    this.globalScope = {
      functionName: 'global',
      variables: new Map(),
      stackBase: 0x7fffffffde00,
      stackOffset: 0,
    };
  }

  /**
   * 현재 스코프 (로컬 또는 글로벌)
   */
  current(): Scope {
    return this.callStack.currentScope() || this.globalScope;
  }

  /**
   * 변수 선언 (현재 스코프)
   */
  declare(name: string, variable: Variable): void {
    const scope = this.current();
    scope.variables.set(name, variable);
  }

  /**
   * 변수 조회 (스코프 체인 탐색)
   * 로컬 → 글로벌 순서로 찾음
   */
  get(name: string): Variable | undefined {
    // 현재 스코프에서 찾기
    const scope = this.current();
    if (scope.variables.has(name)) {
      return scope.variables.get(name);
    }

    // 글로벌 스코프에서 찾기
    if (this.globalScope.variables.has(name)) {
      return this.globalScope.variables.get(name);
    }

    return undefined;
  }

  /**
   * 변수 존재 확인
   */
  has(name: string): boolean {
    return this.get(name) !== undefined;
  }

  /**
   * 변수 값 수정
   */
  set(name: string, value: string, bytes?: number[]): boolean {
    const variable = this.get(name);
    if (!variable) return false;

    variable.value = value;
    if (bytes) {
      variable.bytes = bytes;
    }

    return true;
  }

  /**
   * 포인터 대상 설정
   */
  setPointsTo(name: string, pointsTo: string | undefined): boolean {
    const variable = this.get(name);
    if (!variable) return false;

    variable.points_to = pointsTo;
    return true;
  }

  /**
   * 현재 스코프의 모든 변수
   */
  getLocalVariables(): Variable[] {
    const scope = this.current();
    return Array.from(scope.variables.values());
  }

  /**
   * 모든 변수 (콜 스택 전체)
   */
  getAllVariables(): Array<[string, Variable]> {
    return this.callStack.getAllVariables();
  }

  /**
   * 변수 맵 (핸들러 호환용)
   */
  getVariablesMap(): Map<string, Variable> {
    return this.current().variables;
  }

  /**
   * 주소로 변수 찾기
   */
  findByAddress(address: string): Variable | undefined {
    for (const [, variable] of this.callStack.getAllVariables()) {
      if (variable.address === address) {
        return variable;
      }
    }
    return undefined;
  }
}
