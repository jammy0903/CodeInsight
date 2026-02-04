/**
 * Python 시뮬레이터 — Python 코드 실행 API 클라이언트
 */

import { AxiosError } from 'axios';
import { api } from '../api/axios';
import type { LessonStep } from '@/types';
import { handleSimulatorError } from '@/components/common/Toast';
import type { SimulateRequest, SimulateResult } from './types';

// Python 타입 (내부 전용 — 공개 타입은 @/types/py-simulator.ts)
interface PyName {
  name: string;
  scope: 'local' | 'global' | 'builtin';
  pointsTo: string;
  highlight?: boolean;
}

interface PyObject {
  id: string;
  type: string;
  value: unknown;
  mutable: boolean;
  highlight?: boolean;
}

interface PyCallFrameSnapshot {
  functionName: string;
  depth: number;
  localNames: PyName[];
}

interface PyStep {
  line: number;
  code: string;
  explanation: string;
  names: PyName[];
  objects: PyObject[];
  stdout?: string;
  callStack?: PyCallFrameSnapshot[];
}

interface PySimulateResult {
  success: boolean;
  steps: PyStep[];
  error?: string;
}

function toSteps(pySteps: PyStep[]): LessonStep[] {
  return pySteps.map((step) => ({
    line: step.line,
    code: step.code,
    explanation: step.explanation || '',
    stdout: step.stdout,
    pyNames: step.names,
    pyObjects: step.objects,
    callStack: step.callStack,
    visualizationType: 'python',
  }));
}

export async function simulatePython(request: SimulateRequest): Promise<SimulateResult> {
  try {
    const response = await api.post<PySimulateResult>('/simulators/python/simulate', {
      code: request.code,
    });

    const data = response.data;

    if (data.success && data.steps) {
      return { success: true, steps: toSteps(data.steps) };
    }

    const errorMessage = data.error || 'Python simulation failed';
    handleSimulatorError('Python', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  } catch (error) {
    const errorMessage = error instanceof AxiosError
      ? error.response?.data?.error || error.message
      : error instanceof Error ? error.message : 'Unknown error';

    handleSimulatorError('Python', errorMessage);
    return { success: false, steps: [], error: errorMessage };
  }
}
