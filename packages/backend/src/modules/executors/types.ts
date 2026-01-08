/**
 * Language Executor 공통 타입
 *
 * 구조:
 * - 모든 언어 실행기는 이 인터페이스 구현
 * - 코스 API는 언어 구분 없이 Executor 사용
 * - 새로운 언어 추가 시 구조 유지 → 통일된 API
 */

export enum Language {
  C = 'c',
  Python = 'python',
  Java = 'java',
  JavaScript = 'javascript',
}

/**
 * 코드 실행 결과
 */
export interface ExecutionResult {
  success: boolean;
  compiled: boolean;          // 컴파일 언어만 의미있음
  executed: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  error?: 'security_violation' | 'compile_error' | 'runtime_error' | 'timeout' | 'unknown';
}

/**
 * 테스트케이스 채점 결과
 */
export interface JudgeResult {
  success: boolean;
  verdict: 'accepted' | 'wrong_answer' | 'compile_error' | 'runtime_error' | 'time_limit' | 'memory_limit';
  passed: number;
  total: number;
  executionTimeMs: number;
  details: Array<{
    testCase: number;
    passed: boolean;
    expected?: string;
    actual?: string;
    error?: string;
  }>;
}

/**
 * 언어별 Executor 인터페이스
 *
 * WHY: 모든 언어가 같은 인터페이스 구현 → 코스 API 통일
 * EXAMPLE:
 *   const executor = new CExecutor();
 *   const result = await executor.run(code, stdin);
 *   // 나중에 PythonExecutor도 같은 방식 사용
 */
export interface IExecutor {
  /**
   * 코드 보안 검사
   */
  checkSecurity(code: string): { safe: boolean; reason?: string };

  /**
   * 코드 실행
   */
  run(code: string, stdin?: string, timeout?: number): Promise<ExecutionResult>;

  /**
   * 테스트케이스 채점
   */
  judge(code: string, testCases: Array<{ input: string; output: string }>, timeout?: number): Promise<JudgeResult>;
}
