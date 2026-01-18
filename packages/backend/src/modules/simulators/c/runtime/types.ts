/**
 * Runtime Types
 * 실행 런타임을 위한 타입 정의
 */

import type { FunctionDef } from '../parser/types';

/** 변수 정보 (핸들러 호환) */
export interface Variable {
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to?: string;
  // 배열 관련
  is_array?: boolean;
  array_size?: number;
  element_type?: string; // 배열 요소 타입 (e.g., 'int', 'char', 'float')
  element_size?: number; // 배열 요소 크기 (바이트)
  // 구조체 관련
  is_struct?: boolean;
  struct_name?: string; // 구조체 타입명 (e.g., 'Point')
}

/** 힙 블록 (핸들러 호환) */
export interface HeapBlock {
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  is_heap?: boolean;  // 핸들러 호환용
}

/** 스코프 (함수별 지역 변수 영역) */
export interface Scope {
  functionName: string;
  variables: Map<string, Variable>;
  stackBase: number;
  stackOffset: number;
}

/** 콜 스택 프레임 */
export interface CallFrame {
  functionName: string;
  returnLine: number;      // 복귀할 라인 (호출자의 다음 라인)
  scope: Scope;
  currentLine: number;     // 현재 실행 중인 라인
}

/** 실행 상태 */
export interface ExecutionState {
  callStack: CallFrame[];
  heapBlocks: Map<string, HeapBlock>;
  currentFunction: string;
  currentLine: number;
  isRunning: boolean;
  error?: string;
}

/** 메모리 블록 (출력용) */
export interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;
  explanation: string;
}

/** 실행 스텝 */
export interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;
  rsp: string;
  rbp: string;
  functionName?: string;  // 현재 함수 이름
  callDepth?: number;     // 콜 스택 깊이
  stdout?: string;        // 현재 스텝까지의 누적 stdout 출력
  /**
   * Event-Driven Visualization용 이벤트 배열
   * 있으면 프론트엔드가 snapshot 대신 이벤트 적용
   */
  events?: import('@codeinsight/shared').VisualizationEvent[];
}
