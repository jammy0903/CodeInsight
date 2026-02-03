/**
 * Simulator 공유 타입 정의
 */

import type { LessonStep } from '@/types';

// 시뮬레이션 요청
export interface SimulateRequest {
  code: string;
}

// 시뮬레이션 결과
export interface SimulateResult {
  success: boolean;
  steps: LessonStep[];
  /** 각 스텝별 레지스터 (rsp/rbp) — C 전용 */
  stepRegisters?: StepRegisters[];
  output?: string;
  error?: string;
}

// 스텝별 레지스터 정보
export interface StepRegisters {
  rsp?: string;
  rbp?: string;
}

// 에러 결과 헬퍼
export function errorResult(error: string): SimulateResult {
  return { success: false, steps: [], error };
}
