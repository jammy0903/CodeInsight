/**
 * Java 시뮬레이터 — Java 코드 실행 API 클라이언트
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep } from '@/types';
import { handleSimulatorError } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

interface JavaSimulateResponse {
  success: boolean;
  steps?: Array<Record<string, unknown>>;
  snapshots?: Array<Record<string, unknown>>;
  error?: string;
  message?: string;
}

function toSteps(javaSteps: Array<Record<string, unknown>>): LessonStep[] {
  return javaSteps.map((snapshot) => ({
    line: Number(snapshot.line ?? snapshot.lineNumber ?? 0),
    code: String(snapshot.code ?? ''),
    explanation: String(snapshot.explanation ?? ''),
    memoryState: {
      stack: Array.isArray(snapshot.stack) ? snapshot.stack : [],
      heap: Array.isArray(snapshot.heap) ? snapshot.heap : [],
    },
    visualizationType: 'java',
    stdout: typeof snapshot.stdout === 'string' ? snapshot.stdout : undefined,
  }));
}

export async function simulateJava(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<JavaSimulateResponse>(
      '/simulators/java/simulate',
      { sourceCode: request.code },
      request.signal ? { signal: request.signal } : undefined,
    );

    const data = response.data;

    if (data.success && data.steps) {
      return { success: true, steps: toSteps(data.steps) };
    }

    const errorMessage = data.error || data.message || 'Java simulation failed';
    handleSimulatorError('Java', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    handleSimulatorError('Java', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  }
}
