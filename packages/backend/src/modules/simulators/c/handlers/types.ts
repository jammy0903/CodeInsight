/**
 * Handler System Types
 * 핸들러 플러그인 시스템을 위한 타입 정의
 *
 * Note: 핵심 타입은 runtime/types.ts에서 정의
 * 여기서는 핸들러 전용 타입만 정의
 */

import type {
  MemoryBlock,
  Step,
  Variable,
  HeapBlock,
} from '../runtime/types';

// runtime 타입 re-export
export type { MemoryBlock, Step, Variable, HeapBlock };

// 시뮬레이터 컨텍스트 (핸들러가 접근하는 공유 상태)
export interface SimContext {
  // 메모리 주소
  stackBase: number;
  heapBase: number;
  stackOffset: number;
  heapOffset: number;

  // 저장소
  variables: Map<string, Variable>;
  heapBlocks: Map<string, HeapBlock>;

  // stdin
  stdinBuffer: string[];
  stdinIndex: number;

  // stdout (printf 출력 누적)
  stdoutBuffer: string;
  appendStdout(text: string): void;

  // 유틸리티 메서드
  toHex(n: number): string;
  intToBytes(value: number, size: number): number[];
  allocateStack(size: number): number;
  allocateHeap(size: number): number;
  createStep(lineNum: number, code: string, explanation: string): Step;
}

// 핸들러 인터페이스
export interface CodeHandler {
  // 핸들러 이름 (디버깅용)
  name: string;

  // 우선순위 (높을수록 먼저 체크)
  priority: number;

  // 이 핸들러가 처리할 수 있는 코드인지 확인
  canHandle(code: string): boolean;

  // 코드 처리 및 Step 반환
  handle(ctx: SimContext, lineNum: number, code: string): Step | null;
}

// 핸들러 등록 함수 타입
export type HandlerFactory = () => CodeHandler;
