/**
 * Java Stack (Call Stack) 관리자
 * 메서드 호출 프레임 및 지역 변수 관리
 */

import {
  StackFrame,
  StackSnapshot,
  JavaValue,
  createNullValue
} from './types';

/**
 * Call Stack 관리자
 */
export class CallStack {
  private frames: StackFrame[];

  constructor() {
    this.frames = [];
  }

  /**
   * 새 메서드 프레임 푸시
   * @param methodName 메서드명
   * @param parameters 파라미터들 (선택적)
   */
  pushFrame(methodName: string, parameters?: Map<string, JavaValue>): void {
    const frame: StackFrame = {
      methodName,
      localVariables: new Map(parameters || []),
      depth: this.frames.length,
      parameters: parameters ? new Map(parameters) : undefined
    };

    this.frames.push(frame);
  }

  /**
   * 현재 프레임 팝
   */
  popFrame(): StackFrame | undefined {
    return this.frames.pop();
  }

  /**
   * 현재 프레임 가져오기 (peek)
   */
  getCurrentFrame(): StackFrame | undefined {
    if (this.frames.length === 0) {
      return undefined;
    }
    return this.frames[this.frames.length - 1];
  }

  /**
   * 모든 프레임 가져오기
   */
  getAllFrames(): StackFrame[] {
    return [...this.frames];
  }

  /**
   * 현재 깊이
   */
  get depth(): number {
    return this.frames.length;
  }

  /**
   * Stack이 비어있는지
   */
  get isEmpty(): boolean {
    return this.frames.length === 0;
  }

  /**
   * 현재 프레임에 변수 선언/할당
   */
  setVariable(name: string, value: JavaValue): void {
    const frame = this.getCurrentFrame();
    if (!frame) {
      throw new Error('No active frame to set variable');
    }

    frame.localVariables.set(name, value);
  }

  /**
   * 현재 프레임에서 변수 가져오기
   */
  getVariable(name: string): JavaValue | undefined {
    const frame = this.getCurrentFrame();
    if (!frame) {
      return undefined;
    }

    return frame.localVariables.get(name);
  }

  /**
   * 변수가 존재하는지 확인
   */
  hasVariable(name: string): boolean {
    const frame = this.getCurrentFrame();
    if (!frame) {
      return false;
    }

    return frame.localVariables.has(name);
  }

  /**
   * 현재 프레임의 모든 변수 가져오기
   */
  getAllVariables(): Map<string, JavaValue> {
    const frame = this.getCurrentFrame();
    if (!frame) {
      return new Map();
    }

    return new Map(frame.localVariables);
  }

  /**
   * 현재 실행 라인 설정
   */
  setCurrentLine(lineNumber: number): void {
    const frame = this.getCurrentFrame();
    if (frame) {
      frame.lineNumber = lineNumber;
    }
  }

  /**
   * 현재 실행 라인 가져오기
   */
  getCurrentLine(): number | undefined {
    const frame = this.getCurrentFrame();
    return frame?.lineNumber;
  }

  /**
   * Stack 스냅샷 생성 (시각화용)
   */
  snapshot(): StackSnapshot {
    return {
      frames: this.frames.map(frame => this.cloneFrame(frame)),
      currentDepth: this.frames.length
    };
  }

  /**
   * 프레임 복사 (불변성 보장)
   */
  private cloneFrame(frame: StackFrame): StackFrame {
    return {
      ...frame,
      localVariables: new Map(frame.localVariables),
      parameters: frame.parameters ? new Map(frame.parameters) : undefined
    };
  }

  /**
   * Stack 초기화
   */
  clear(): void {
    this.frames = [];
  }

  /**
   * 디버그용 출력
   */
  debug(): void {
    console.log('=== Stack State ===');
    console.log(`Depth: ${this.frames.length}`);

    for (let i = this.frames.length - 1; i >= 0; i--) {
      const frame = this.frames[i];
      console.log(`  [${i}] ${frame.methodName}()`);

      if (frame.parameters && frame.parameters.size > 0) {
        console.log('    Parameters:');
        frame.parameters.forEach((value, name) => {
          console.log(`      ${name}: ${this.formatValue(value)}`);
        });
      }

      if (frame.localVariables.size > 0) {
        console.log('    Local Variables:');
        frame.localVariables.forEach((value, name) => {
          // 파라미터는 이미 출력했으므로 스킵
          if (!frame.parameters?.has(name)) {
            console.log(`      ${name}: ${this.formatValue(value)}`);
          }
        });
      }
    }
  }

  /**
   * 값 포맷팅 (디버그용)
   */
  private formatValue(value: JavaValue): string {
    if (value.isReference) {
      return value.objectId ? `@${value.objectId}` : 'null';
    }
    return `${value.value} (${value.type})`;
  }

  /**
   * 특정 메서드 프레임 찾기
   */
  findFrame(methodName: string): StackFrame | undefined {
    return this.frames.find(frame => frame.methodName === methodName);
  }

  /**
   * 프레임 개수
   */
  get size(): number {
    return this.frames.length;
  }

  /**
   * 전체 로컬 변수 개수
   */
  get totalVariables(): number {
    return this.frames.reduce((sum, frame) => sum + frame.localVariables.size, 0);
  }
}

/**
 * 메서드 파라미터 설정 유틸리티
 */
export class ParameterSetup {
  /**
   * 메서드 호출 시 파라미터 매핑
   * @param paramNames 파라미터 이름들
   * @param paramTypes 파라미터 타입들
   * @param argValues 인자 값들
   */
  static setupParameters(
    paramNames: string[],
    paramTypes: string[],
    argValues: JavaValue[]
  ): Map<string, JavaValue> {
    const parameters = new Map<string, JavaValue>();

    if (paramNames.length !== argValues.length) {
      throw new Error(
        `Parameter count mismatch: expected ${paramNames.length}, got ${argValues.length}`
      );
    }

    for (let i = 0; i < paramNames.length; i++) {
      const name = paramNames[i];
      const expectedType = paramTypes[i];
      const value = argValues[i];

      // 타입 체크 (간단한 버전)
      if (!this.isCompatibleType(value.type, expectedType)) {
        console.warn(
          `Type mismatch for parameter '${name}': expected ${expectedType}, got ${value.type}`
        );
      }

      parameters.set(name, value);
    }

    return parameters;
  }

  /**
   * 타입 호환성 체크 (간단한 버전)
   */
  private static isCompatibleType(actualType: string, expectedType: string): boolean {
    // 정확히 같으면 OK
    if (actualType === expectedType) return true;

    // int와 double은 서로 호환 (교육용 간략화)
    if ((actualType === 'int' && expectedType === 'double') ||
        (actualType === 'double' && expectedType === 'int')) {
      return true;
    }

    // 모든 객체는 Object로 할당 가능
    if (expectedType === 'Object' && actualType !== 'int' &&
        actualType !== 'double' && actualType !== 'boolean') {
      return true;
    }

    return false;
  }
}
