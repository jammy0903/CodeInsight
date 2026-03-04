/**
 * JavaScript 시뮬레이터 — JS 코드 실행 API 클라이언트
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep } from '@/types';
import { handleSimulatorError } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

interface JSStepResponse {
  line?: number;
  code?: string;
  explanation?: string;
  visualizationType?: string;
  eventLoopState?: unknown;
  scopeState?: unknown;
  thisState?: unknown;
  prototypeState?: unknown;
  promiseState?: unknown;
  stack?: unknown[];
  heap?: unknown[];
  stdout?: string;
  visualizationState?: unknown;
}

interface JSSimulateResponse {
  success: boolean;
  engine?: 'legacy' | 'inspector';
  steps?: JSStepResponse[];
  normalizedSteps?: unknown[];
  meta?: {
    durationMs: number;
    stepCount: number;
    truncated?: boolean;
  };
  error?: string | {
    code?: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

function parseErrorPayload(error: JSSimulateResponse['error']): {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
} {
  if (!error) {
    return { message: 'JavaScript simulation failed' };
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return {
    message: error.message || 'JavaScript simulation failed',
    code: error.code,
    details: error.details,
  };
}

export async function simulateJavaScript(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<JSSimulateResponse>(
      '/simulators/javascript/simulate',
      { code: request.code },
      request.signal ? { signal: request.signal } : undefined,
    );

    const data = response.data;

    if (import.meta.env.DEV) {
      console.log('[simulateJavaScript] API response:', JSON.stringify(data, null, 2));
    }

    if (data.success && Array.isArray(data.steps)) {
      const lessonSteps: LessonStep[] = data.steps.map((step) => ({
        line: step.line ?? 0,
        code: step.code ?? '',
        explanation: step.explanation ?? '',
        // Keep simulator's original JS snapshot shape.
        // JSTransformer/useLessonVisualization expect frame objects (methodName + variables),
        // and flattening to MemoryBlock loses variable information.
        stack: (Array.isArray(step.stack) ? step.stack : []) as LessonStep['stack'],
        heap: (Array.isArray(step.heap) ? step.heap : []) as LessonStep['heap'],
        stdout: step.stdout,
        visualizationType: step.visualizationType ?? 'javascript',
        visualizationState: step.visualizationState,
        eventLoopState: step.eventLoopState,
        scopeState: step.scopeState,
        thisState: step.thisState,
        prototypeState: step.prototypeState,
        promiseState: step.promiseState,
      }));

      return { success: true, steps: lessonSteps };
    }

    const errorInfo = parseErrorPayload(data.error);
    const errorMessage = errorInfo.message;
    handleSimulatorError('JavaScript', errorMessage);
    return { success: false, steps: [], error: errorMessage, errorInfo };
  } catch (error) {
    const responseData = error instanceof AxiosError
      ? (error.response?.data as JSSimulateResponse | undefined)
      : undefined;
    const parsed = responseData
      ? parseErrorPayload(responseData.error)
      : { message: error instanceof Error ? error.message : 'Unknown error' };
    const errorMessage = parsed.message;

    handleSimulatorError('JavaScript', errorMessage);
    return { success: false, steps: [], error: errorMessage, errorInfo: parsed };
  }
}
