/**
 * ⚠️ DEPRECATED: modules/executors/c/c-executor.ts를 사용하세요
 *
 * 이 파일은 이전 버전의 executor 구현입니다.
 * 새로운 구조로 마이그레이션 완료됨.
 *
 * Before:  import { runCCode } from './executor';
 * After:   import { cExecutor } from '../executors/c';
 *          await cExecutor.run(code, stdin);
 *
 * 테스트 호환성을 위해 일시적으로 유지됩니다.
 * TODO: executor.test.ts 마이그레이션 후 제거
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { config } from '../../config';

// === 유틸리티 ===

/**
 * exec 에러에서 정보 추출 (defensive)
 *
 * WHY: Node.js exec()의 에러는 ExecException 타입이지만,
 *      런타임에 stdout/stderr/killed 속성이 없을 수 있음.
 *      특히 컴파일 에러 시 killed 속성 없음.
 * TRADEOFF: 타입 안전성 > 코드 간결성.
 *           as unknown as Record 더블 캐스팅 필요.
 * REVISIT: Node.js 타입이 개선되거나 zod 스키마 도입 시 단순화 가능.
 */
function getExecErrorInfo(error: unknown): {
  stdout: string;
  stderr: string;
  code: number;
  killed: boolean;
} {
  if (error instanceof Error) {
    // Error를 unknown으로 먼저 변환 후 Record로 캐스팅
    const e = error as unknown as Record<string, unknown>;
    return {
      stdout: typeof e.stdout === 'string' ? e.stdout : '',
      stderr: typeof e.stderr === 'string' ? e.stderr : error.message,
      code: typeof e.code === 'number' ? e.code : 1,
      killed: typeof e.killed === 'boolean' ? e.killed : false,
    };
  }
  return { stdout: '', stderr: 'Unknown error', code: 1, killed: false };
}

const execAsync = promisify(exec);

// 금지된 코드 패턴 (보안)
// 테스트: src/modules/c/executor.test.ts
export const FORBIDDEN_PATTERNS = [
  // === 프로세스/시스템 호출 ===
  /system\s*\(/,
  /exec[lvpe]*\s*\(/,
  /fork\s*\(/,
  /popen\s*\(/,
  /clone\s*\(/,           // 프로세스 복제
  /vfork\s*\(/,           // fork 변형

  // === 권한 상승 ===
  /setuid\s*\(/,
  /setgid\s*\(/,
  /seteuid\s*\(/,
  /setegid\s*\(/,
  /setreuid\s*\(/,
  /setregid\s*\(/,

  // === 디버깅/추적 ===
  /ptrace\s*\(/,          // 프로세스 추적

  // === 어셈블리 ===
  /__asm__/,
  /__asm\s+volatile/,
  /\basm\s*\(/,           // asm("...")

  // === 동적 로딩 ===
  /dlopen\s*\(/,
  /dlsym\s*\(/,

  // === 메모리 실행 ===
  /mprotect\s*\(/,        // 메모리 보호 변경
  /mmap\s*\([^)]*PROT_EXEC/,  // 실행 가능 메모리

  // === 위험한 헤더 ===
  /#\s*include\s*<\s*unistd\.h/,
  /#\s*include\s*<\s*sys\//,
  /#\s*include\s*<\s*pthread\.h/,
  /#\s*include\s*<\s*signal\.h/,
  /#\s*include\s*<\s*socket\.h/,
  /#\s*include\s*<\s*netinet\//,
  /#\s*include\s*<\s*arpa\//,
  /#\s*include\s*<\s*dlfcn\.h/,  // dlopen/dlsym
];

export interface RunResult {
  success: boolean;
  compiled: boolean;
  executed: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  error?: string;
}

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
 * 코드 보안 검사
 */
export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `금지된 패턴 감지: ${pattern.source}` };
    }
  }
  return { safe: true };
}

/**
 * 로컬 gcc로 C 코드 컴파일 및 실행
 *
 * 순서:
 * 1. 보안 검사 (FORBIDDEN_PATTERNS)
 * 2. 임시 디렉토리 생성
 * 3. 소스 파일 저장
 * 4. gcc 컴파일
 * 5. 타임아웃 포함 실행
 * 6. 결과 반환
 */
export async function runCCode(code: string, stdin: string = '', timeout: number = config.execution.defaultTimeout): Promise<RunResult> {
  const startTime = Date.now();

  // 1. 보안 검사
  const security = checkCodeSecurity(code);
  if (!security.safe) {
    return {
      success: false,
      compiled: false,
      executed: false,
      stdout: '',
      stderr: security.reason || '보안 위반',
      exitCode: 1,
      executionTimeMs: 0,
      error: 'security_violation'
    };
  }

  // 2. 임시 디렉토리 생성
  const tmpDir = path.join(os.tmpdir(), `c-runner-${crypto.randomBytes(8).toString('hex')}`);
  const srcPath = path.join(tmpDir, 'main.c');
  const binPath = path.join(tmpDir, 'a.out');
  const inputPath = path.join(tmpDir, 'input.txt');

  try {
    // 3. 소스 파일 저장
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(srcPath, code);
    await fs.writeFile(inputPath, stdin);

    // 4. gcc 컴파일
    const compileCmd = `gcc -o "${binPath}" "${srcPath}" 2>&1`;

    let compileOutput = '';
    try {
      const { stdout } = await execAsync(compileCmd, {
        timeout: 30000, // 30초
        maxBuffer: config.execution.bufferSize
      });
      compileOutput = stdout;
    } catch (error: unknown) {
      const { stderr: errOutput } = getExecErrorInfo(error);
      return {
        success: false,
        compiled: false,
        executed: false,
        stdout: '',
        stderr: errOutput || '컴파일 실패',
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        error: 'compile_error'
      };
    }

    // 5. 타임아웃 포함 실행
    const runCmd = `timeout ${timeout}s "${binPath}" < "${inputPath}"`;

    try {
      const { stdout, stderr } = await execAsync(runCmd, {
        timeout: (timeout + 5) * 1000,
        maxBuffer: config.execution.bufferSize
      });

      return {
        success: true,
        compiled: true,
        executed: true,
        stdout: stdout.trim(),
        stderr: (stderr || compileOutput).trim(),
        exitCode: 0,
        executionTimeMs: Date.now() - startTime
      };
    } catch (error: unknown) {
      const { stdout: output, stderr: errOutput, killed } = getExecErrorInfo(error);

      // 타임아웃
      if (killed) {
        return {
          success: false,
          compiled: true,
          executed: false,
          stdout: output,
          stderr: '실행 시간 초과 (Time Limit Exceeded)',
          exitCode: 124,
          executionTimeMs: Date.now() - startTime,
          error: 'timeout'
        };
      }

      // 런타임 에러
      return {
        success: false,
        compiled: true,
        executed: false,
        stdout: output,
        stderr: errOutput || '실행 오류',
        exitCode: 1,
        executionTimeMs: Date.now() - startTime,
        error: 'runtime_error'
      };
    }
  } finally {
    // 임시 파일 정리
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // 무시
    }
  }
}

/**
 * 테스트케이스로 채점
 */
export async function judgeCode(
  code: string,
  testCases: Array<{ input: string; output: string }>,
  timeout: number = config.execution.judgeTimeout
): Promise<JudgeResult> {
  const startTime = Date.now();
  const details: JudgeResult['details'] = [];
  let passed = 0;

  // 보안 검사
  const security = checkCodeSecurity(code);
  if (!security.safe) {
    return {
      success: false,
      verdict: 'compile_error',
      passed: 0,
      total: testCases.length,
      executionTimeMs: 0,
      details: [{ testCase: 0, passed: false, error: security.reason }]
    };
  }

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const result = await runCCode(code, tc.input, timeout);

    if (!result.compiled) {
      return {
        success: false,
        verdict: 'compile_error',
        passed: 0,
        total: testCases.length,
        executionTimeMs: Date.now() - startTime,
        details: [{ testCase: i + 1, passed: false, error: result.stderr }]
      };
    }

    if (result.error === 'timeout') {
      details.push({
        testCase: i + 1,
        passed: false,
        expected: tc.output.trim(),
        actual: '(시간 초과)',
        error: 'Time Limit Exceeded'
      });
      continue;
    }

    if (!result.executed || result.error) {
      details.push({
        testCase: i + 1,
        passed: false,
        expected: tc.output.trim(),
        actual: result.stdout,
        error: result.stderr || result.error
      });
      continue;
    }

    // 출력 비교 (줄바꿈, 공백 정규화)
    const expected = tc.output.trim().replace(/\r\n/g, '\n');
    const actual = result.stdout.trim().replace(/\r\n/g, '\n');
    const isCorrect = expected === actual;

    if (isCorrect) {
      passed++;
    }

    details.push({
      testCase: i + 1,
      passed: isCorrect,
      expected: expected,
      actual: actual
    });
  }

  const executionTime = Date.now() - startTime;
  let verdict: JudgeResult['verdict'];

  if (passed === testCases.length) {
    verdict = 'accepted';
  } else if (details.some(d => d.error?.includes('Time Limit'))) {
    verdict = 'time_limit';
  } else if (details.some(d => d.error && !d.error.includes('Time Limit'))) {
    verdict = 'runtime_error';
  } else {
    verdict = 'wrong_answer';
  }

  return {
    success: verdict === 'accepted',
    verdict,
    passed,
    total: testCases.length,
    executionTimeMs: executionTime,
    details
  };
}
