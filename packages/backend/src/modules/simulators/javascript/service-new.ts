/**
 * JavaScript Simulator (Line-by-line execution)
 *
 * Python 방식과 유사하게 줄 단위로 실행
 */

import type { JsStep } from './types-new';
import { createJsContext } from './context-new';
import { jsHandlerRegistry } from './handlers-new';

export interface JsSimulateRequest {
  code: string;
}

export interface JsSimulateResult {
  success: boolean;
  steps: JsStep[];
  error?: string;
}

/**
 * JavaScript 코드 시뮬레이션
 */
export function simulateJavaScript(request: JsSimulateRequest): JsSimulateResult {
  const { code } = request;

  try {
    const ctx = createJsContext();
    const steps: JsStep[] = [];

    // 초기 스텝 추가
    steps.push(ctx.createStep(0, '', '시뮬레이션 시작'));

    // 코드를 줄 단위로 분리
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // 빈 줄, 주석 스킵
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      // 현재 줄 설정
      ctx.currentLine = lineNum;

      // 핸들러 찾기
      const handler = jsHandlerRegistry.findHandler(trimmed);

      if (handler) {
        // 핸들러로 처리
        const step = handler.handle(ctx, lineNum, trimmed);
        if (step) {
          steps.push(step);
        }
      } else {
        // 핸들러가 없는 경우 기본 스텝 추가 (스킵)
        steps.push(
          ctx.createStep(
            lineNum,
            trimmed,
            `처리되지 않은 코드: ${trimmed.substring(0, 50)}${trimmed.length > 50 ? '...' : ''}`
          )
        );
      }
    }

    return {
      success: true,
      steps,
    };
  } catch (error: any) {
    return {
      success: false,
      steps: [],
      error: error.message || 'JavaScript simulation failed',
    };
  }
}
