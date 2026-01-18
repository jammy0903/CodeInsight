/**
 * Call Stack Manager
 * 함수 호출 스택 관리
 *
 * 역할:
 * - 함수 호출 시 새 프레임 push
 * - return 시 프레임 pop
 * - 현재 실행 위치 추적
 */

import type { CallFrame, Scope, Variable } from './types';

export class CallStack {
  private frames: CallFrame[] = [];
  private stackBase = 0x7fffffffde00;
  private stackPointer = 0;

  /**
   * 함수 호출 - 새 프레임 push
   */
  push(functionName: string, returnLine: number, startLine: number): Scope {
    // 새 스코프 생성
    const scope: Scope = {
      functionName,
      variables: new Map(),
      stackBase: this.stackBase - this.stackPointer,
      stackOffset: 0,
    };

    const frame: CallFrame = {
      functionName,
      returnLine,
      scope,
      currentLine: startLine,
    };

    this.frames.push(frame);

    // 스택 포인터 조정 (함수 프레임 공간)
    this.stackPointer += 64; // 기본 프레임 크기

    return scope;
  }

  /**
   * 함수 복귀 - 프레임 pop
   * @returns 복귀할 라인 번호
   */
  pop(): number {
    const frame = this.frames.pop();
    if (!frame) {
      throw new Error('Call stack underflow');
    }

    // 스택 포인터 복원
    this.stackPointer -= 64;

    return frame.returnLine;
  }

  /**
   * 현재 프레임 조회
   */
  current(): CallFrame | null {
    return this.frames.length > 0 ? this.frames[this.frames.length - 1] : null;
  }

  /**
   * 현재 스코프 조회
   */
  currentScope(): Scope | null {
    const frame = this.current();
    return frame ? frame.scope : null;
  }

  /**
   * 현재 함수 이름
   */
  currentFunction(): string {
    const frame = this.current();
    return frame ? frame.functionName : 'global';
  }

  /**
   * 콜 스택 깊이
   */
  depth(): number {
    return this.frames.length;
  }

  /**
   * 현재 라인 업데이트
   */
  setCurrentLine(line: number): void {
    const frame = this.current();
    if (frame) {
      frame.currentLine = line;
    }
  }

  /**
   * 현재 라인 조회
   */
  getCurrentLine(): number {
    const frame = this.current();
    return frame ? frame.currentLine : 0;
  }

  /**
   * 스택이 비어있는지 확인
   */
  isEmpty(): boolean {
    return this.frames.length === 0;
  }

  /**
   * RSP (스택 포인터) 값
   */
  getRsp(): string {
    return '0x' + (this.stackBase - this.stackPointer).toString(16);
  }

  /**
   * RBP (베이스 포인터) 값
   */
  getRbp(): string {
    const scope = this.currentScope();
    return scope ? '0x' + scope.stackBase.toString(16) : '0x0';
  }

  /**
   * 모든 스코프의 변수 수집 (스택 메모리 표시용)
   * @returns [name, variable][] 배열 (name = "함수명.변수명" 형식)
   */
  getAllVariables(): Array<[string, Variable]> {
    const allVars: Array<[string, Variable]> = [];
    for (const frame of this.frames) {
      const funcName = frame.functionName;
      for (const [name, variable] of frame.scope.variables.entries()) {
        // "main.x", "swap.temp" 형식으로 반환 (프레임 오버레이 구분용)
        allVars.push([`${funcName}.${name}`, variable]);
      }
    }
    return allVars;
  }

  /**
   * 스택 메모리 할당
   */
  allocateStack(size: number): number {
    const scope = this.currentScope();
    if (!scope) {
      throw new Error('No active scope');
    }

    const addr = scope.stackBase - scope.stackOffset;
    scope.stackOffset += size;
    this.stackPointer += size;

    return addr;
  }

  /**
   * 콜 스택 상태 문자열 (디버깅용)
   */
  toString(): string {
    return this.frames
      .map((f, i) => `${i}: ${f.functionName} (line ${f.currentLine})`)
      .reverse()
      .join('\n');
  }

  /**
   * 주소로 변수 찾기 (크로스 프레임 지원)
   * 모든 프레임을 탐색하여 해당 주소를 가진 변수를 찾음
   * @returns { frameName, variableName, variable } 또는 null
   */
  findVariableByAddress(address: string): {
    frameName: string;
    variableName: string;
    variable: Variable;
  } | null {
    for (const frame of this.frames) {
      for (const [name, variable] of frame.scope.variables.entries()) {
        if (variable.address === address) {
          return {
            frameName: frame.functionName,
            variableName: name,
            variable,
          };
        }
      }
    }
    return null;
  }
}
