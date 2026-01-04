/**
 * C 코드 실행 모듈
 * - Docker 컨테이너 기반 샌드박스 실행
 * - gcc 컴파일 + 실행
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
 * Docker로 C 코드 컴파일 및 실행
 */
export async function runCCode(code: string, stdin: string = '', timeout: number = config.execution.defaultTimeout): Promise<RunResult> {
  const startTime = Date.now();

  // 보안 검사
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

  // 임시 디렉토리 생성
  const tmpDir = path.join(os.tmpdir(), `c-runner-${crypto.randomBytes(8).toString('hex')}`);

  try {
    await fs.mkdir(tmpDir, { recursive: true });

    // 소스 파일 저장
    const srcPath = path.join(tmpDir, 'main.c');
    const inputPath = path.join(tmpDir, 'input.txt');

    await fs.writeFile(srcPath, code);
    await fs.writeFile(inputPath, stdin);

    // Docker 명령어 구성
    // 쉘 명령어는 따옴표로 감싸야 함
    const shellCmd = `cp /code/main.c /tmp/main.c && gcc -o /tmp/a.out /tmp/main.c 2>&1 && timeout ${timeout}s /tmp/a.out < /code/input.txt`;
    const dockerCmd = [
      'docker', 'run',
      '--rm',
      '--network', 'none',           // 네트워크 차단
      '--memory', config.docker.memoryLimit,
      '--cpus', config.docker.cpuLimit,
      '--pids-limit', String(config.docker.pidLimit),
      '--read-only',                 // 읽기 전용
      '--tmpfs', `/tmp:size=${config.docker.tmpfsSize},exec`,
      '--security-opt', 'no-new-privileges:true',
      '-v', `${tmpDir}:/code:ro`,    // 코드 마운트 (읽기 전용)
      '-w', '/tmp',
      config.docker.image,
      '/bin/sh', '-c',
      `"${shellCmd}"`
    ].join(' ');

    try {
      const { stdout, stderr } = await execAsync(dockerCmd, {
        timeout: (timeout + 5) * 1000,
        maxBuffer: config.execution.bufferSize
      });

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        compiled: true,
        executed: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        exitCode: 0,
        executionTimeMs: executionTime
      };
    } catch (error: unknown) {
      const executionTime = Date.now() - startTime;

      // exec 에러 정보 추출 (defensive)
      const { stdout: output, stderr: errOutput, code, killed } = getExecErrorInfo(error);

      // 컴파일 에러 감지
      if (errOutput.includes('error:') || errOutput.includes('undefined reference')) {
        return {
          success: false,
          compiled: false,
          executed: false,
          stdout: output,
          stderr: errOutput,
          exitCode: code,
          executionTimeMs: executionTime,
          error: 'compile_error'
        };
      }

      // 타임아웃
      if (killed || errOutput.includes('timeout')) {
        return {
          success: false,
          compiled: true,
          executed: false,
          stdout: output,
          stderr: '실행 시간 초과 (Time Limit Exceeded)',
          exitCode: 124,
          executionTimeMs: timeout * 1000,
          error: 'timeout'
        };
      }

      // 런타임 에러
      return {
        success: false,
        compiled: true,
        executed: false,
        stdout: output,
        stderr: errOutput,
        exitCode: code,
        executionTimeMs: executionTime,
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
