/**
 * executeSimulator.ts
 *
 * 시뮬레이터 실행 로직 (백엔드)
 * - 언어별 서브프로세스 관리
 * - 타임아웃 및 에러 처리
 * - 결과 파싱 및 반환
 */

import { spawn } from 'child_process';
import { z } from 'zod';

/**
 * 입력 스키마 (Zod로 런타임 검증)
 */
const executeRequestSchema = z.object({
  code: z.string().max(10000, 'Code length exceeded'),
  language: z.enum(['c', 'python', 'js', 'java']),
  breakpoints: z.array(z.number()).optional(),
  maxSteps: z.number().default(10000),
});

type ExecuteRequest = z.infer<typeof executeRequestSchema>;

/**
 * 커스텀 에러 클래스
 * - 에러 종류를 명시적으로 분류
 * - 클라이언트에게 구체적인 정보 전달
 */
class SimulatorError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'SimulatorError';
  }
}

/**
 * 언어별 시뮬레이터 커맨드
 */
const SIMULATOR_COMMANDS = {
  c: 'python3 /app/simulators/c/agent/simulator.py',
  python: 'python3 /app/simulators/python/agent/simulator.py',
  js: 'node /app/simulators/javascript/agent/simulator.js',
  java: 'java -cp /app/simulators/java/agent JDISimulator',
};

/**
 * 실행 결과 인터페이스
 */
interface ExecutionResult {
  status: 'success' | 'error' | 'timeout';
  totalSteps: number;
  steps: Step[];
  error: string | null;
}

interface Step {
  step: number;
  line: number;
  variables: Record<string, Variable>;
  memory: MemoryState;
  callStack: StackFrame[];
}

interface Variable {
  type: string;
  value: any;
}

interface MemoryState {
  stack: MemorySegment[];
  heap: MemorySegment[];
}

interface MemorySegment {
  address: number;
  size: number;
  data: any;
}

interface StackFrame {
  function: string;
  file: string;
  line: number;
}

/**
 * 시뮬레이터 실행 함수
 *
 * @param request - 실행 요청
 * @param timeout - 타임아웃 (밀리초)
 * @returns 실행 결과
 *
 * @throws SimulatorError - 실행 중 에러 발생
 */
export const executeSimulator = async (
  request: ExecuteRequest,
  timeout: number = 5000
): Promise<ExecutionResult> => {
  // ✅ 입력 검증
  const parsed = executeRequestSchema.safeParse(request);
  if (!parsed.success) {
    throw new SimulatorError(
      'Invalid input',
      'VALIDATION_ERROR',
      400
    );
  }

  const { code, language, maxSteps } = parsed.data;
  const command = SIMULATOR_COMMANDS[language];

  return new Promise((resolve, reject) => {
    // ✅ 서브프로세스 생성
    const child = spawn('sh', ['-c', command], {
      timeout,
      maxBuffer: 1024 * 1024 * 10, // 10MB
    });

    let stdoutData = '';
    let stderrData = '';

    // ✅ 타임아웃 처리
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      reject(
        new SimulatorError(
          'Execution timeout',
          'SIMULATOR_TIMEOUT',
          408
        )
      );
    }, timeout);

    // ✅ 표준 출력 수집
    child.stdout?.on('data', (data) => {
      stdoutData += data.toString();
    });

    // ✅ 표준 에러 수집
    child.stderr?.on('data', (data) => {
      stderrData += data.toString();
    });

    // ✅ 프로세스 종료 처리
    child.on('close', (code) => {
      clearTimeout(timer);

      // 이미 타임아웃으로 reject됨
      if (timedOut) return;

      // 프로세스 에러
      if (code !== 0) {
        return reject(
          new SimulatorError(
            stderrData || `Process exited with code ${code}`,
            'EXECUTION_ERROR',
            400
          )
        );
      }

      // ✅ 결과 파싱
      try {
        const result: ExecutionResult = JSON.parse(stdoutData);

        // 단계 수 제한 검증
        if (result.totalSteps > maxSteps) {
          return reject(
            new SimulatorError(
              `Step limit exceeded (${result.totalSteps} > ${maxSteps})`,
              'STEP_LIMIT_EXCEEDED',
              400
            )
          );
        }

        resolve(result);
      } catch (error) {
        reject(
          new SimulatorError(
            'Failed to parse simulator output',
            'PARSE_ERROR',
            500
          )
        );
      }
    });

    // ✅ 에러 처리
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(
        new SimulatorError(
          error.message,
          'PROCESS_ERROR',
          500
        )
      );
    });

    // ✅ 코드 전달 (stdin)
    child.stdin?.write(JSON.stringify({ code, maxSteps }));
    child.stdin?.end();
  });
};

/**
 * 에러 핸들러
 * - 에러 종류에 따른 HTTP 응답
 */
export const handleSimulatorError = (
  error: Error
): { status: number; message: string; code: string } => {
  if (error instanceof SimulatorError) {
    return {
      status: error.statusCode,
      message: error.message,
      code: error.code,
    };
  }

  return {
    status: 500,
    message: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
  };
};

/**
 * 설계 원칙:
 *
 * 1. ✅ 입력 검증 우선
 *    - Zod로 모든 입력을 검증
 *    - 타입 안정성 보장
 *
 * 2. ✅ 타임아웃 필수
 *    - 무한 루프 방지
 *    - 리소스 누수 방지
 *
 * 3. ✅ 에러 분류
 *    - 각 에러에 고유 코드 부여
 *    - 클라이언트 처리 용이
 *
 * 4. ✅ 리소스 정리
 *    - clearTimeout() 필수
 *    - child.kill() 호출
 *
 * 5. ✅ Promise 중심 디자인
 *    - 비동기 처리 명확화
 *    - 호출자가 쉽게 사용
 */
