/**
 * C++ 시뮬레이터 — C++ 코드 실행 API 클라이언트
 *
 * Java simulator 패턴을 따름
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep } from '@/types';
import { handleSimulatorError } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

interface CppSimulateResponse {
  success: boolean;
  steps?: Array<Record<string, unknown>>;
  error?: string;
  message?: string;
}

function toSteps(cppSteps: Array<Record<string, unknown>>): LessonStep[] {
  return cppSteps.map((snapshot) => ({
    line: Number(snapshot.line ?? 0),
    code: String(snapshot.code ?? ''),
    explanation: String(snapshot.explanation ?? ''),
    memoryState: {
      stack: Array.isArray(snapshot.stack) ? snapshot.stack : [],
      heap: Array.isArray(snapshot.heap) ? snapshot.heap : [],
    },
    visualizationType: 'c', // C와 동일한 시각화 사용
    stdout: typeof snapshot.stdout === 'string' ? snapshot.stdout : undefined,
  }));
}

export async function simulateCpp(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<CppSimulateResponse>('/simulators/cpp/simulate', {
      code: request.code,
    });

    const data = response.data;

    if (data.success && data.steps) {
      return { success: true, steps: toSteps(data.steps) };
    }

    const errorMessage = data.error || data.message || 'C++ simulation failed';
    handleSimulatorError('C++', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    handleSimulatorError('C++', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  }
}
