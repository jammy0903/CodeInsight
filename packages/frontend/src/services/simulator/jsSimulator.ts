/**
 * JavaScript 시뮬레이터 — JS 코드 실행 API 클라이언트
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep } from '@/types';
import { handleSimulatorError } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

export async function simulateJavaScript(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<any>('/simulators/javascript/simulate', {
      code: request.code,
    });

    const data = response.data;

    if (import.meta.env.DEV) {
      console.log('[simulateJavaScript] API response:', JSON.stringify(data, null, 2));
    }

    if (data.success && data.steps) {
      const lessonSteps: LessonStep[] = data.steps.map((step: any) => ({
        line: step.line,
        code: step.code,
        explanation: step.explanation,
        stack: step.stack,
        heap: step.heap,
        stdout: step.stdout,
        visualizationType: 'javascript',
        visualizationState: step.visualizationState,
      }));

      return { success: true, steps: lessonSteps };
    }

    const errorMessage = data.error || 'JavaScript simulation failed';
    handleSimulatorError('JavaScript', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    handleSimulatorError('JavaScript', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  }
}
