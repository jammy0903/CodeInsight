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
  stack?: unknown[];
  heap?: unknown[];
  stdout?: string;
  visualizationState?: unknown;
}

interface JSSimulateResponse {
  success: boolean;
  steps?: JSStepResponse[];
  error?: string;
}

type LessonMemoryBlock = NonNullable<LessonStep['stack']>[number];

function toMemoryBlock(raw: unknown): LessonMemoryBlock {
  if (!raw || typeof raw !== 'object') {
    return { value: String(raw ?? '') };
  }

  const block = raw as Record<string, unknown>;
  const rawValue = block.value ?? block.content ?? block.data ?? '';

  const result: LessonMemoryBlock = {
    value: typeof rawValue === 'string' ? rawValue : String(rawValue),
  };

  if (typeof block.name === 'string') result.name = block.name;
  if (typeof block.address === 'string') result.address = block.address;
  if (typeof block.type === 'string') result.type = block.type;
  if (typeof block.size === 'number' || typeof block.size === 'string') result.size = block.size;
  const pointsTo = block.points_to;
  if (typeof pointsTo === 'string') result.points_to = pointsTo;
  if (typeof block.explanation === 'string') result.explanation = block.explanation;
  if (typeof block.highlight === 'boolean') result.highlight = block.highlight;
  if (typeof block.isArray === 'boolean') result.isArray = block.isArray;
  if (typeof block.isExpanded === 'boolean') result.isExpanded = block.isExpanded;
  if (Array.isArray(block.bytes)) {
    result.bytes = block.bytes.filter((byte): byte is number => typeof byte === 'number');
  }
  if (
    block.segment === 'stack' ||
    block.segment === 'heap' ||
    block.segment === 'data' ||
    block.segment === 'text'
  ) {
    result.segment = block.segment;
  }
  if (Array.isArray(block.arrayElements)) {
    result.arrayElements = block.arrayElements.map(toMemoryBlock);
  }

  return result;
}

function toMemoryBlocks(raw: unknown): LessonMemoryBlock[] {
  return Array.isArray(raw) ? raw.map(toMemoryBlock) : [];
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

    if (data.success && data.steps) {
      const lessonSteps: LessonStep[] = data.steps.map((step) => ({
        line: step.line ?? 0,
        code: step.code ?? '',
        explanation: step.explanation ?? '',
        stack: toMemoryBlocks(step.stack),
        heap: toMemoryBlocks(step.heap),
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
