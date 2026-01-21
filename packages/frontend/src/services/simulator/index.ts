/**
 * Simulator Service
 * 다언어 시뮬레이터 통합 서비스
 *
 * 지원 언어: C, Python, Java
 */

import type { LessonStep } from '@/types';
import type { StackRegisters } from '@/features/visualizers/c';
import type { JavaSimulationResult } from '@/features/visualizers/java';

export type SupportedLanguage = 'c' | 'python' | 'java' | 'javascript';

interface SimulateOptions {
  code: string;
  stdin?: string;
}

interface SimulateResult {
  success: boolean;
  steps: LessonStep[];
  stepRegisters?: StackRegisters[];
  error?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

/**
 * 지원 언어 체크
 */
export function isLanguageSupported(language: string): boolean {
  return ['c', 'python', 'java'].includes(language);
}

/**
 * C 시뮬레이션 (레거시 API)
 */
async function simulateC(code: string): Promise<SimulateResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/memory/trace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!data.success) {
    return {
      success: false,
      steps: [],
      error: data.message || 'C simulation failed',
    };
  }

  return {
    success: true,
    steps: data.steps || [],
    stepRegisters: data.step_registers,
  };
}

/**
 * Python 시뮬레이션
 */
async function simulatePython(code: string): Promise<SimulateResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulators/python`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!data.success) {
    return {
      success: false,
      steps: [],
      error: data.error || 'Python simulation failed',
    };
  }

  return {
    success: true,
    steps: data.steps || [],
  };
}

/**
 * Java 시뮬레이션
 *
 * Java 결과를 LessonStep 형식으로 변환
 */
async function simulateJava(code: string): Promise<SimulateResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/simulators/java`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });

  const data: JavaSimulationResult = await response.json();

  if (!data.success) {
    return {
      success: false,
      steps: [],
      error: data.error || 'Java simulation failed',
    };
  }

  // Java Step을 LessonStep으로 변환
  const lessonSteps: LessonStep[] = data.steps.map((javaStep) => ({
    line: javaStep.lineNumber,
    code: javaStep.code,
    explanation: javaStep.explanation,

    // Java 전용 데이터 (확장 필드)
    javaStack: javaStep.stack,
    javaHeap: javaStep.heap,
    javaEvents: javaStep.events,

    // 기본 필드 (호환성)
    stack: [],
    heap: [],
    data: [],
  }));

  return {
    success: true,
    steps: lessonSteps,
  };
}

/**
 * 시뮬레이션 서비스
 */
export const simulatorService = {
  async simulate(language: SupportedLanguage, options: SimulateOptions): Promise<SimulateResult> {
    try {
      switch (language) {
        case 'c':
          return await simulateC(options.code);

        case 'python':
          return await simulatePython(options.code);

        case 'java':
          return await simulateJava(options.code);

        default:
          return {
            success: false,
            steps: [],
            error: `${language} is not supported yet`,
          };
      }
    } catch (error: any) {
      console.error('Simulation error:', error);
      return {
        success: false,
        steps: [],
        error: error.message || 'Simulation failed',
      };
    }
  },
};
