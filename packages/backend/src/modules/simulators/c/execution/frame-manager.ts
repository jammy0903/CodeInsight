/**
 * Frame Manager
 * 함수 스택 프레임 생명주기 관리
 *
 * 역할:
 * - 함수 진입 시 프레임 생성 (push)
 * - 함수 복귀 시 프레임 정리 (pop + 변수 제거)
 * - 크로스 프레임 변수 검색 지원
 */

import { CallStack } from '../runtime/call-stack';
import type { Variable, Scope } from '../runtime/types';
import type { VisualizationEvent } from '@codeinsight/shared';
import type { FrameEnterResult, FrameExitResult } from './types';

export class FrameManager {
  constructor(private callStack: CallStack) {}

  /**
   * 함수 진입 - 새 프레임 생성
   * @param funcName 함수 이름
   * @param returnLine 복귀할 라인 번호
   * @param startLine 함수 시작 라인
   * @returns 생성된 스코프와 이벤트
   */
  enter(funcName: string, returnLine: number, startLine: number): FrameEnterResult {
    const scope = this.callStack.push(funcName, returnLine, startLine);

    return {
      scopeVariables: scope.variables,
      events: [{
        type: 'frame',
        action: 'push',
        name: funcName,
      }],
    };
  }

  /**
   * 함수 복귀 - 프레임 정리
   * - 현재 프레임의 모든 지역 변수 제거
   * - 콜 스택에서 프레임 pop
   * @returns 복귀 정보와 이벤트
   */
  exit(): FrameExitResult {
    const currentFrame = this.callStack.currentFunction();
    const currentScope = this.callStack.currentScope();

    // 제거될 변수 목록 수집 (이벤트 생성용)
    const removedVars: string[] = [];
    const destroyEvents: VisualizationEvent[] = [];

    if (currentScope) {
      for (const [name] of currentScope.variables) {
        const fullName = `${currentFrame}.${name}`;
        removedVars.push(fullName);

        // 변수 제거 이벤트
        destroyEvents.push({
          type: 'variable',
          action: 'destroy',
          frame: currentFrame,
          name,
        });
      }
    }

    // 콜 스택에서 pop
    const returnLine = this.callStack.pop();

    // 이벤트: 변수 제거 → 프레임 pop
    const events: VisualizationEvent[] = [
      ...destroyEvents,
      {
        type: 'frame',
        action: 'pop',
        name: currentFrame,
      },
    ];

    return { returnLine, removedVars, events };
  }

  /**
   * 현재 스코프의 변수 맵 반환
   * 파라미터/지역변수 추가 시 사용
   */
  getCurrentVariables(): Map<string, Variable> {
    const scope = this.callStack.currentScope();
    if (!scope) {
      throw new Error('No active scope');
    }
    return scope.variables;
  }

  /**
   * 현재 함수 이름 반환
   */
  getCurrentFrame(): string {
    return this.callStack.currentFunction();
  }

  /**
   * 콜 스택 깊이 반환
   */
  getDepth(): number {
    return this.callStack.depth();
  }

  /**
   * 부모 스코프로 전환 (pop 후 사용)
   * @returns 부모 스코프의 변수 맵 또는 null
   */
  getParentVariables(): Map<string, Variable> | null {
    const scope = this.callStack.currentScope();
    return scope ? scope.variables : null;
  }

  /**
   * RSP (스택 포인터) 값
   */
  getRsp(): string {
    return this.callStack.getRsp();
  }

  /**
   * RBP (베이스 포인터) 값
   */
  getRbp(): string {
    return this.callStack.getRbp();
  }

  /**
   * 모든 프레임의 변수 수집
   * 스택 메모리 시각화용
   */
  getAllVariables(): Array<[string, Variable]> {
    return this.callStack.getAllVariables();
  }

  /**
   * 주소로 변수 찾기 (크로스 프레임 지원)
   * 포인터 역참조 시 타겟 변수가 다른 프레임에 있는지 감지
   */
  findVariableByAddress(address: string): {
    frameName: string;
    variableName: string;
    variable: Variable;
  } | null {
    return this.callStack.findVariableByAddress(address);
  }

  /**
   * 스택 메모리 할당
   */
  allocateStack(size: number): number {
    return this.callStack.allocateStack(size);
  }
}
