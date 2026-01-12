/**
 * Python Simulator
 *
 * Python 코드를 한 줄씩 시뮬레이션하여
 * Names → Objects 참조 관계를 추적
 */

import type { PyStep, PySimContext } from './types';
import { createPyContext } from './context';
import { pyHandlerRegistry } from './handlers';

export interface PySimulateRequest {
  code: string;
  stdin?: string;
}

export interface PySimulateResult {
  success: boolean;
  steps: PyStep[];
  error?: string;
}

/**
 * Python 코드 시뮬레이션
 */
export function simulatePython(request: PySimulateRequest): PySimulateResult {
  const { code } = request;

  try {
    const ctx = createPyContext();
    const steps: PyStep[] = [];

    // 코드를 줄 단위로 분리
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i];

      // 빈 줄, 주석 스킵
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // 현재 줄 설정
      ctx.currentLine = lineNum;

      // 핸들러 찾기
      const handler = pyHandlerRegistry.findHandler(trimmed);

      if (handler) {
        const step = handler.handle(ctx, lineNum, trimmed);
        if (step) {
          steps.push(step);
        }
      } else {
        // 처리할 수 없는 코드 - 기본 스텝 생성
        steps.push(ctx.createStep(lineNum, trimmed, `실행: ${trimmed}`));
      }
    }

    return {
      success: true,
      steps,
    };
  } catch (error) {
    return {
      success: false,
      steps: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Python 시뮬레이터 클래스 (확장용)
 */
export class PySimulator {
  private ctx: PySimContext;
  private steps: PyStep[] = [];

  constructor() {
    this.ctx = createPyContext();
  }

  /**
   * 코드 실행
   */
  run(code: string): PySimulateResult {
    return simulatePython({ code });
  }

  /**
   * 한 줄 실행
   */
  step(lineNum: number, code: string): PyStep | null {
    const trimmed = code.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return null;
    }

    const handler = pyHandlerRegistry.findHandler(trimmed);
    if (handler) {
      const step = handler.handle(this.ctx, lineNum, trimmed);
      if (step) {
        this.steps.push(step);
        return step;
      }
    }

    return null;
  }

  /**
   * 현재 상태 반환
   */
  getSteps(): PyStep[] {
    return this.steps;
  }

  /**
   * 컨텍스트 접근 (테스트용)
   */
  getContext(): PySimContext {
    return this.ctx;
  }
}
