/**
 * Simulator Service — 언어별 시뮬레이터 라우팅
 *
 * 각 언어의 실제 로직은 개별 파일에 분리:
 *   cSimulator.ts, pythonSimulator.ts, javaSimulator.ts, jsSimulator.ts
 */

import { simulateC, runC } from './cSimulator';
import { simulatePython } from './pythonSimulator';
import { simulateJava } from './javaSimulator';
import { simulateJavaScript } from './jsSimulator';
import { simulateCpp } from './cppSimulator';
import type { SimulateRequest, SimulateResult } from './types';
import { errorResult } from './types';

/**
 * 언어별 지원 여부 확인
 */
export function isLanguageSupported(language: string): boolean {
  const lang = language.toLowerCase();
  return lang === 'c'
    || lang === 'cpp' || lang === 'c++'
    || lang === 'python' || lang === 'py'
    || lang === 'javascript' || lang === 'js'
    || lang === 'java';
}

/**
 * 통합 시뮬레이터 서비스
 */
export const simulatorService = {
  async simulate(language: string, request: SimulateRequest): Promise<SimulateResult> {
    const lang = language.toLowerCase();

    if (!isLanguageSupported(lang)) {
      return errorResult(`${language.toUpperCase()} 시뮬레이션은 아직 지원되지 않습니다`);
    }

    if (lang === 'python' || lang === 'py') return simulatePython(request);
    if (lang === 'javascript' || lang === 'js') return simulateJavaScript(request);
    if (lang === 'java') return simulateJava(request);
    if (lang === 'c') return simulateC(request);
    if (lang === 'cpp' || lang === 'c++') return simulateCpp(request);

    return errorResult('Unsupported language for simulation');
  },

  async run(
    language: string,
    request: SimulateRequest
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    const lang = language.toLowerCase();
    if (lang !== 'c') {
      return { success: false, error: `${language.toUpperCase()} 실행은 아직 지원되지 않습니다` };
    }
    return runC(request);
  },
};
