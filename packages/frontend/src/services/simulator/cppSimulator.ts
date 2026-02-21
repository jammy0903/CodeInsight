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

interface CppSnapshotFrame {
  functionName: string;
  depth: number;
  line: number;
  variables: Array<{
    name: string;
    type: string;
    value: string;
    address: string;
    points_to?: string;
    isReference?: boolean;
    containerInfo?: Record<string, unknown>;
    smartPtrInfo?: Record<string, unknown>;
  }>;
}

function toSteps(cppSteps: Array<Record<string, unknown>>): LessonStep[] {
  return cppSteps.map((snapshot) => {
    const rawStack = Array.isArray(snapshot.stack) ? snapshot.stack : [];
    const rawHeap = Array.isArray(snapshot.heap) ? snapshot.heap : [];

    // Flatten CppStackFrame[] → flat MemoryBlock[] with frame markers
    const stack: Array<Record<string, unknown>> = [];

    for (const frame of rawStack as CppSnapshotFrame[]) {
      if (frame.functionName && Array.isArray(frame.variables)) {
        // Frame marker
        stack.push({ type: 'frame', func: frame.functionName, name: frame.functionName });
        // Variables flattened
        for (const v of frame.variables) {
          const block: Record<string, unknown> = {
            name: v.name,
            value: v.value,
            type: v.type,
            address: v.address,
            points_to: v.points_to ?? null,
            frame: frame.functionName,
          };
          if (v.isReference) {
            block.isReference = true;
          }
          if (v.containerInfo) {
            block.metadata = { containerInfo: v.containerInfo };
          }
          if (v.smartPtrInfo) {
            block.metadata = {
              ...(block.metadata as Record<string, unknown> || {}),
              isSmartPtr: true,
              ...(v.smartPtrInfo as Record<string, unknown>),
            };
          }
          stack.push(block);
        }
      } else {
        // Already flat (fallback)
        stack.push(frame as unknown as Record<string, unknown>);
      }
    }

    // Heap blocks — pass through as-is
    const heap = rawHeap.map((h: Record<string, unknown>) => ({
      name: String(h.name || `[${h.address || '?'}]`),
      address: String(h.address || ''),
      type: String(h.type || 'unknown'),
      size: Number(h.size || 0),
      value: String(h.value || ''),
      points_to: h.points_to ?? null,
    }));

    return {
      line: Number(snapshot.line ?? 0),
      code: String(snapshot.code ?? ''),
      explanation: String(snapshot.explanation ?? ''),
      stack: stack as LessonStep['stack'],
      heap: heap as LessonStep['heap'],
      visualizationType: 'cpp',
      stdout: typeof snapshot.stdout === 'string' ? snapshot.stdout : undefined,
    };
  });
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
