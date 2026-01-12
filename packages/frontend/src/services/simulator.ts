/**
 * Simulator Service - 코드 시뮬레이션 API 클라이언트
 *
 * WHY: Playground에서 코드 실행 및 메모리 트레이스를 위한 통합 서비스
 * ENDPOINTS:
 *   - /api/memory/trace: 메모리 시뮬레이션 (스텝별 상태)
 *   - /api/c/run: C 코드 실행 (결과만)
 */

import { api } from './api/axios';
import { AxiosError } from 'axios';
import type { LessonStep, MemoryBlock } from '@/types';

// =============================================
// Python 타입 정의
// =============================================

/** Python 객체 타입 */
export type PyType =
  | 'int' | 'float' | 'str' | 'bool' | 'NoneType'
  | 'list' | 'tuple' | 'dict' | 'set'
  | 'function' | 'class' | 'instance';

/** Python 객체 */
export interface PyObject {
  id: string;
  type: PyType;
  value: unknown;
  mutable: boolean;
  highlight?: boolean;
}

/** Python 이름 (변수) */
export interface PyName {
  name: string;
  scope: 'local' | 'global' | 'builtin';
  pointsTo: string;
  highlight?: boolean;
}

/** Python 실행 스텝 */
export interface PyStep {
  line: number;
  code: string;
  explanation: string;
  names: PyName[];
  objects: PyObject[];
  stdout?: string;
}

/** Python 시뮬레이션 결과 */
interface PySimulateResult {
  success: boolean;
  steps: PyStep[];
  error?: string;
}

// 지원 언어
export type SupportedLanguage = 'c' | 'python' | 'java';

// 시뮬레이션 요청
interface SimulateRequest {
  code: string;
}

// 백엔드 응답 타입 (실제 API 응답 구조)
interface BackendMemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes?: number[];
  value: string;
  points_to: string | null;
  explanation?: string;
}

interface BackendStep {
  line: number;
  code: string;
  stack: BackendMemoryBlock[];
  heap: BackendMemoryBlock[];
  explanation: string;
  rsp?: string;
  rbp?: string;
  stdout?: string;
}

interface BackendTraceResponse {
  success: boolean;
  steps: BackendStep[];
  source_lines: string[];
  message?: string;
  error?: string;
}

// 스텝별 레지스터 정보
interface StepRegisters {
  rsp?: string;
  rbp?: string;
}

// 시뮬레이션 결과
interface SimulateResult {
  success: boolean;
  steps: LessonStep[];
  /** 각 스텝별 레지스터 (rsp/rbp) */
  stepRegisters?: StepRegisters[];
  output?: string;
  error?: string;
}

/**
 * 언어별 지원 여부 확인
 * MVP: C, Python 지원
 */
export function isLanguageSupported(language: string): boolean {
  return language === 'c' || language === 'python';
}

/**
 * 백엔드 메모리 블록을 MemoryBlock으로 변환 (LessonStep 형식)
 */
function toMemoryBlock(
  block: BackendMemoryBlock
): MemoryBlock {
  return {
    name: block.name,
    address: block.address,
    value: block.value,
    type: block.type,
    size: block.size,
    points_to: block.points_to,
    explanation: block.explanation,
  };
}

/**
 * 백엔드 응답을 LessonStep[]으로 변환 (Playground용 스냅샷 형식)
 * WHY: Playground는 실시간 C 코드 실행 결과를 MemoryBlock[] 형태로 받음
 */
function toSteps(backendSteps: BackendStep[]): LessonStep[] {
  return backendSteps.map((step) => ({
    line: step.line,
    explanation: step.explanation,
    // Playground 확장 필드 (스냅샷 형식)
    stack: step.stack.map(toMemoryBlock),
    heap: step.heap.map(toMemoryBlock),
    stdout: step.stdout,
  }));
}

/**
 * 시뮬레이터 서비스
 */
export const simulatorService = {
  /**
   * 코드 시뮬레이션 실행
   * C: /api/memory/trace 호출
   * Python: /api/v1/simulators/python 호출
   */
  async simulate(
    language: string,
    request: SimulateRequest
  ): Promise<SimulateResult> {
    if (!isLanguageSupported(language)) {
      return {
        success: false,
        steps: [],
        error: `${language.toUpperCase()} 시뮬레이션은 아직 지원되지 않습니다`,
      };
    }

    try {
      // Python 언어
      if (language === 'python') {
        return this.simulatePython(request);
      }

      // C 언어: 메모리 트레이스 API 사용
      const response = await api.post<BackendTraceResponse>('/memory/trace', {
        code: request.code,
      });

      const data = response.data;

      if (data.success && data.steps) {
        // 각 스텝별 레지스터 추출
        const stepRegisters = data.steps.map((step) => ({
          rsp: step.rsp,
          rbp: step.rbp,
        }));

        return {
          success: true,
          steps: toSteps(data.steps),
          stepRegisters,
        };
      }

      return {
        success: false,
        steps: [],
        error: data.error || data.message || 'Simulation failed',
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.error || error.message;
        return {
          success: false,
          steps: [],
          error: message,
        };
      }

      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Python 시뮬레이션
   */
  async simulatePython(request: SimulateRequest): Promise<SimulateResult> {
    try {
      const response = await api.post<PySimulateResult>('/simulators/python', {
        code: request.code,
      });

      const data = response.data;

      if (data.success && data.steps) {
        // Python 스텝을 LessonStep 형태로 변환
        const lessonSteps: LessonStep[] = data.steps.map((step) => ({
          line: step.line,
          explanation: step.explanation,
          stdout: step.stdout,
          // Python 시각화 데이터
          pyNames: step.names,
          pyObjects: step.objects,
        }));

        return {
          success: true,
          steps: lessonSteps,
        };
      }

      return {
        success: false,
        steps: [],
        error: data.error || 'Python simulation failed',
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          steps: [],
          error: error.response?.data?.error || error.message,
        };
      }

      return {
        success: false,
        steps: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * 코드 실행만 (출력 확인용)
   */
  async run(
    language: string,
    request: SimulateRequest
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    if (language !== 'c') {
      return {
        success: false,
        error: `${language.toUpperCase()} 실행은 아직 지원되지 않습니다`,
      };
    }

    try {
      const response = await api.post('/c/run', {
        code: request.code,
      });

      return {
        success: response.data.success,
        output: response.data.output,
        error: response.data.error,
      };
    } catch (error) {
      if (error instanceof AxiosError) {
        return {
          success: false,
          error: error.response?.data?.error || error.message,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
