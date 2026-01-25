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

/** Python 콜스택 프레임 스냅샷 */
export interface PyCallFrameSnapshot {
  functionName: string;
  depth: number;
  localNames: PyName[];
}

/** Python 실행 스텝 */
export interface PyStep {
  line: number;
  code: string;
  explanation: string;
  names: PyName[];
  objects: PyObject[];
  stdout?: string;
  callStack?: PyCallFrameSnapshot[];
}

/** Python 시뮬레이션 결과 */
interface PySimulateResult {
  success: boolean;
  steps: PyStep[];
  error?: string;
}

// 지원 언어
export type SupportedLanguage = 'c' | 'python' | 'java' | 'javascript';

// 시뮬레이션 요청
interface SimulateRequest {
  code: string;
}

// Java 시뮬레이션 응답 타입
interface JavaSimulateResponse {
  success: boolean;
  snapshots?: any[]; // 백엔드가 snapshots로 반환
  error?: string;
  message?: string;
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
 * 지원: C, Python, JavaScript, Java
 */
export function isLanguageSupported(language: string): boolean {
  const lang = language.toLowerCase();
  return lang === 'c'
    || lang === 'python' || lang === 'py'
    || lang === 'javascript' || lang === 'js'
    || lang === 'java';
}

/**
 * BackendMemoryBlock -> MemoryBlock 변환 (C 시뮬레이터 전용)
 */
function cMemoryBlock(block: BackendMemoryBlock): MemoryBlock {
  return {
    name: block.name,
    address: block.address,
    value: block.value,
    type: block.type,
    size: block.size,
    bytes: block.bytes,
    points_to: block.points_to,
    explanation: block.explanation,
  };
}

/**
 * BackendStep -> LessonStep 변환 (C 시뮬레이터 전용)
 */
function cSimulator(backendSteps: BackendStep[]): LessonStep[] {
  return backendSteps.map((step) => ({
    line: step.line,
    code: step.code,
    explanation: step.explanation,
    stack: step.stack.map(cMemoryBlock),
    heap: step.heap.map(cMemoryBlock),
    stdout: step.stdout,
  }));
}

/**
 * PyStep -> LessonStep 변환 (Python 시뮬레이터 전용)
 */
function pythonSimulator(pySteps: PyStep[]): LessonStep[] {
  return pySteps.map((step) => ({
    line: step.line,
    code: step.code,
    explanation: step.explanation,
    stdout: step.stdout,
    // Python 시각화 데이터 (Names-Objects 모델)
    pyNames: step.names,
    pyObjects: step.objects,
    // Python 콜스택 (함수 호출 시각화)
    callStack: step.callStack,
    visualizationType: 'python',
  }));
}

/**
 * Java 단계별 상태 -> LessonStep 변환 (Java 시뮬레이터 전용)
 */
function javaSimulator(javaSteps: any[]): LessonStep[] {
  return javaSteps.map((snapshot) => ({
    line: snapshot.line || snapshot.lineNumber || 0,
    code: snapshot.code || '',
    explanation: snapshot.explanation || `Java 한 줄 실행 (Line ${snapshot.line || snapshot.lineNumber})`,
    // Java 시각화 데이터 (Stack-Heap 참조 모델)
    memoryState: {
      stack: snapshot.stack || [],
      heap: snapshot.heap || [],
    },
    visualizationType: 'java',
    stdout: snapshot.stdout,
  }));
}

/**
 * Simulator Service - 코드 시뮬레이션 통합 서비스
 */
export const simulatorService = {
  async simulate(
    language: string,
    request: SimulateRequest
  ): Promise<SimulateResult> {
    const lang = language.toLowerCase();

    if (!isLanguageSupported(lang)) {
      return {
        success: false,
        steps: [],
        error: `${language.toUpperCase()} 시뮬레이션은 아직 지원되지 않습니다`,
      };
    }

    try {
      // Python 언어
      if (lang === 'python' || lang === 'py') {
        return this.simulatePython(request);
      }

      // JavaScript 언어
      if (lang === 'javascript' || lang === 'js') {
        return this.simulateJavaScript(request);
      }

      // Java 언어
      if (lang === 'java') {
        return this.simulateJava(request);
      }

      // C 언어: 메모리 트레이스 API 사용
      if (lang === 'c') {
        const response = await api.post<BackendTraceResponse>('/simulators/c/trace', {
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
            steps: cSimulator(data.steps),
            stepRegisters,
          };
        }

        return {
          success: false,
          steps: [],
          error: data.error || data.message || 'Simulation failed',
        };
      }

      return {
        success: false,
        steps: [],
        error: 'Unsupported language for simulation',
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
      const response = await api.post<PySimulateResult>('/simulators/python/simulate', {
        code: request.code,
      });

      const data = response.data;

      if (data.success && data.steps) {
        return {
          success: true,
          steps: pythonSimulator(data.steps),
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
   * JavaScript 시뮬레이션
   */
  async simulateJavaScript(request: SimulateRequest): Promise<SimulateResult> {
    try {
      const response = await api.post<any>('/simulators/javascript/simulate', {
        code: request.code,
      });

      const data = response.data;

      if (data.success && data.steps) {
        const lessonSteps: LessonStep[] = data.steps.map((step: any) => ({
          line: step.line,
          code: step.code,
          explanation: step.explanation,
          stack: step.stack,
          heap: step.heap,
          stdout: step.stdout,
          visualizationType: 'javascript',
          visualizationState: step.visualizationState,
        }));

        return {
          success: true,
          steps: lessonSteps,
        };
      }

      return {
        success: false,
        steps: [],
        error: data.error || 'JavaScript simulation failed',
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
   * Java 시뮬레이션
   */
  async simulateJava(request: SimulateRequest): Promise<SimulateResult> {
    try {
      const response = await api.post<JavaSimulateResponse>('/simulators/java/simulate', {
        sourceCode: request.code,
      });

      const data = response.data;

      if (data.success && (data as any).steps) {
        return {
          success: true,
          steps: javaSimulator((data as any).steps),
        };
      }

      return {
        success: false,
        steps: [],
        error: data.error || data.message || 'Java simulation failed',
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
    const lang = language.toLowerCase();
    if (lang !== 'c') {
      return {
        success: false,
        error: `${language.toUpperCase()} 실행은 아직 지원되지 않습니다`,
      };
    }

    try {
      const response = await api.post('/simulators/c/simulate', {
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
