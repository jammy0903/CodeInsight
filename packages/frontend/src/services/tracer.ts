/**
 * Node.js 백엔드 메모리 트레이서 API
 * C 코드 시뮬레이션 및 메모리 상태 추적
 * axios 기반으로 리팩토링됨
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import type { TraceResult } from '@/types/memory';

// Re-export types for consumers
export type { MemoryBlock, Step, TraceResult } from '@/types/memory';

export async function traceCode(code: string, stdin = ''): Promise<TraceResult> {
  try {
    const response = await api.post<TraceResult>(
      config.api.endpoints.memoryTrace,
      {
        code,
        stdin,
        timeout: config.api.timeout.trace,
      }
    );

    return response.data;
  } catch (err) {
    const error = handleError(err);

    return {
      success: false,
      steps: [],
      source_lines: [],
      error: error.code === 'NETWORK_ERROR' ? 'network_error' : 'api_error',
      message: error.message,
    };
  }
}
