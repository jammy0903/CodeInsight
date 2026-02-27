/**
 * C 시뮬레이터 — 메모리 트레이스 API 클라이언트
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep, MemoryBlock } from '@/types';
import { handleSimulatorError, notifySimulator } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

// 백엔드 응답 타입
interface BackendMemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes?: number[];
  value: string;
  points_to: string | null;
  explanation?: string;
}

interface BackendStep {
  line: number;
  code: string;
  stack: BackendMemoryBlock[];
  heap: BackendMemoryBlock[];
  explanation: string;
  rsp?: string;
  rbp?: string;
  stdout?: string;
}

interface BackendTraceResponse {
  success: boolean;
  steps: BackendStep[];
  source_lines: string[];
  message?: string;
  error?: string;
  details?: string[];
  warnings?: string[];
}

function toMemoryBlock(block: BackendMemoryBlock): MemoryBlock {
  return {
    name: block.name,
    address: block.address,
    value: block.value,
    type: block.type,
    size: block.size,
    bytes: block.bytes,
    points_to: block.points_to,
    explanation: block.explanation,
  };
}

function toSteps(backendSteps: BackendStep[]): LessonStep[] {
  return backendSteps.map((step) => ({
    line: step.line,
    code: step.code,
    explanation: step.explanation,
    stack: step.stack.map(toMemoryBlock),
    heap: step.heap.map(toMemoryBlock),
    stdout: step.stdout,
  }));
}

export async function simulateC(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<BackendTraceResponse>(
      '/simulators/c/trace',
      {
        code: request.code,
        ...(request.stdin ? { stdin: request.stdin } : {}),
      },
      request.signal ? { signal: request.signal } : undefined,
    );

    const data = response.data;

    if (data.success && data.steps) {
      const stepRegisters = data.steps.map((step) => ({
        rsp: step.rsp,
        rbp: step.rbp,
      }));

      return {
        success: true,
        steps: toSteps(data.steps),
        stepRegisters,
      };
    }

    // 컴파일 에러 (Emscripten 검증 실패)
    if (data.error === 'compilation_error' && data.details && data.details.length > 0) {
      notifySimulator.compilationErrors('C', data.details);
      return { success: false, steps: [], error: data.message || '컴파일 에러' };
    }

    const errorMessage = data.error || data.message || 'Simulation failed';
    handleSimulatorError('C', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      const errorData = error.response.data;

      if (errorData.error === 'compilation_error' && errorData.details && errorData.details.length > 0) {
        notifySimulator.compilationErrors('C', errorData.details);
        return { success: false, steps: [], error: errorData.message || '컴파일 에러' };
      }

      const errorMessage = errorData.error || errorData.message || error.message;
      handleSimulatorError('C', errorMessage);
      return { success: false, steps: [], error: errorMessage };
    }

    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    handleSimulatorError('C', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  }
}

/** C 코드 실행만 (출력 확인용) */
export async function runC(request: SimulateRequest): Promise<{ success: boolean; output?: string; error?: string }> {
  try {
    const response = await api.post('/simulators/c/simulate', {
      code: request.code,
    });

    return {
      success: response.data.success,
      output: response.data.output,
      error: response.data.error,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return { success: false, error: error.response?.data?.error || error.message };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
