/**
 * Execution Module Types
 * 함수 실행 시스템의 타입 정의
 */

import type { Variable } from '../runtime/types';
import type { VisualizationEvent } from '@codeinsight/shared';

/**
 * 파라미터 설정 결과
 */
export interface ParameterResult {
  /** 생성된 변수 */
  variable: Variable;
  /** 시각화 이벤트 */
  events: VisualizationEvent[];
}

/**
 * 프레임 진입 결과
 */
export interface FrameEnterResult {
  /** 생성된 스코프 */
  scopeVariables: Map<string, Variable>;
  /** 프레임 push 이벤트 */
  events: VisualizationEvent[];
}

/**
 * 프레임 종료 결과
 */
export interface FrameExitResult {
  /** 복귀할 라인 번호 */
  returnLine: number;
  /** 제거된 변수 목록 (프레임.변수명 형식) */
  removedVars: string[];
  /** 프레임 pop + 변수 destroy 이벤트 */
  events: VisualizationEvent[];
}

/**
 * 함수 실행 결과
 */
export interface FunctionExecutionResult {
  /** 반환값 (void면 undefined) */
  returnValue?: number;
  /** 함수 실행 중 생성된 스텝들 */
  steps: import('../runtime/types').Step[];
}

/**
 * 파라미터 정보
 */
export interface ParameterInfo {
  name: string;
  type: string;
}

/**
 * SimContext 확장 인터페이스 (execution 모듈용)
 */
export interface ExecutionContext {
  // 메모리 할당
  allocateStack(size: number): number;
  toHex(n: number): string;
  intToBytes(value: number, size: number): number[];
  getTypeSize(typeName: string): number;

  // 프레임 정보
  getCurrentFrame(): string;

  // 이벤트 추가
  addEvent(event: VisualizationEvent): void;
}
