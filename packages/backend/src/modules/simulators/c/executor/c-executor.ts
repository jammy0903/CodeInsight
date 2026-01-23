/**
 * C 코드 실행기
 *
 * 기능:
 * - 로컬 gcc로 C 코드 컴파일 및 실행
 * - 보안 검사 (FORBIDDEN_PATTERNS)
 * - 타임아웃 관리
 * - 테스트케이스 채점
 *
 * WHY: Docker 제거 → 3배 빠름
 * ARCHITECTURE: IExecutor 구현 → 다른 언어와 통일
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import { config } from '../../../../config';
import type { ExecutionResult, IExecutor, JudgeResult } from '../../../executors/types';
import { checkCodeSecurity } from './security';

const execAsync = promisify(exec);

/**
 * exec 에러에서 정보 추출 (defensive)
 *
 * WHY: Node.js exec()의 에러는 ExecException 타입이지만,
 *      런타임에 stdout/stderr/killed 속성이 없을 수 있음.
 * TRADEOFF: 타입 안전성 > 코드 간결성.
 */
function getExecErrorInfo(error: unknown): {
  stdout: string;
  stderr: string;
  code: number;
  killed: boolean;
} {
  if (error instanceof Error) {
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

export class CExecutor implements IExecutor {
  checkSecurity(code: string): { safe: boolean; reason?: string } {
    return checkCodeSecurity(code);
  }

  async run(code: string, stdin: string = '', timeout: number = config.execution.defaultTimeout): Promise<ExecutionResult> {
    const startTime = Date.now();

    // 1. 보안 검사
    const security = this.checkSecurity(code);
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

  async judge(
    code: string,
    testCases: Array<{ input: string; output: string }>,
    timeout: number = config.execution.judgeTimeout
  ): Promise<JudgeResult> {
    const startTime = Date.now();
    const details: JudgeResult['details'] = [];
    let passed = 0;

    // 보안 검사
    const security = this.checkSecurity(code);
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
      const result = await this.run(code, tc.input, timeout);

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
}

// 싱글톤 인스턴스
export const cExecutor = new CExecutor();
