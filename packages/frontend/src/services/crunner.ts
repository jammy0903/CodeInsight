/**
 * C 코드 실행 API (자체 백엔드)
 * Node.js 백엔드 + Docker 샌드박스
 * axios 기반으로 리팩토링됨
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';

// 테스트 케이스 결과 타입
export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  time?: string;
}

// 백엔드 Judge API 응답의 details 타입
interface JudgeResultDetail {
  testCase: number;
  passed: boolean;
  expected?: string;
  actual?: string;
  error?: string;
}

// 테스트 케이스 입력 타입
interface TestCaseInput {
  input: string;
  output: string;
}

// 테스트 결과 반환 타입
interface TestCasesResult {
  results: TestCaseResult[];
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
}

/**
 * 에러 발생 시 기본 테스트 결과 생성
 */
function createErrorTestResults(
  testCases: TestCaseInput[],
  errorMessage: string
): TestCasesResult {
  return {
    results: testCases.map((tc) => ({
      input: tc.input,
      expected: tc.output,
      actual: errorMessage,
      passed: false,
      error: errorMessage,
    })),
    allPassed: false,
    passedCount: 0,
    totalCount: testCases.length,
  };
}

/**
 * C 코드 실행
 */
export async function runCode(
  code: string,
  stdin = ''
): Promise<{
  success: boolean;
  output: string;
  time?: string;
  memory?: string;
}> {
  try {
    const response = await api.post(config.api.endpoints.cRun, {
      code,
      stdin,
      timeout: config.api.timeout.run,
    });

    const result = response.data;

    // 백엔드 응답 형식: { success, data: { compiled, executed, stdout, stderr, ... } }
    if (result.success && result.data) {
      return {
        success: true,
        output: result.data.stdout || '(출력 없음)',
        time: result.data.execution_time_ms ? `${result.data.execution_time_ms}ms` : undefined,
      };
    }

    // 컴파일 에러 또는 실행 에러
    return {
      success: false,
      output: result.data?.stderr || result.error || '실행 실패',
    };
  } catch (err) {
    const error = handleError(err);
    return {
      success: false,
      output: `네트워크 오류: ${error.message}`,
    };
  }
}

/**
 * 테스트 케이스 채점
 */
export async function runTestCases(
  code: string,
  testCases: TestCaseInput[]
): Promise<TestCasesResult> {
  try {
    const response = await api.post(config.api.endpoints.cJudge, {
      code,
      testCases,
      timeout: config.api.timeout.judge,
    });

    const result = response.data;

    // 백엔드 응답 형식: { success, data: { verdict, passed, total, details } }
    if (result.data) {
      const details: JudgeResultDetail[] = result.data.details || [];
      return {
        results: details.map((d, idx) => ({
          input: testCases[idx]?.input || '',
          expected: d.expected || testCases[idx]?.output || '',
          actual: d.actual || '',
          passed: d.passed,
          error: d.error,
          time: result.data.execution_time_ms
            ? `${Math.round(result.data.execution_time_ms / details.length)}ms`
            : undefined,
        })),
        allPassed: result.data.verdict === 'accepted',
        passedCount: result.data.passed || 0,
        totalCount: result.data.total || testCases.length,
      };
    }

    throw new Error('Invalid response format');
  } catch (err) {
    const error = handleError(err);
    return createErrorTestResults(testCases, error.message);
  }
}
