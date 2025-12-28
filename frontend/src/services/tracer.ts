/**
 * Node.js 백엔드 메모리 트레이서 API
 * C 코드 시뮬레이션 및 메모리 상태 추적
 */

import { config } from '@/config';
import type { TraceResult } from '@/types/memory';

// Re-export types for consumers
export type { MemoryBlock, Step, TraceResult } from '@/types/memory';

export async function traceCode(code: string, stdin = ''): Promise<TraceResult> {
  try {
    const response = await fetch(`${config.api.baseUrl}${config.api.endpoints.memoryTrace}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        stdin,
        timeout: config.api.timeout.trace,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        steps: [],
        source_lines: [],
        error: 'api_error',
        message: errorData.detail || `HTTP ${response.status}`,
      };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      steps: [],
      source_lines: [],
      error: 'network_error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
