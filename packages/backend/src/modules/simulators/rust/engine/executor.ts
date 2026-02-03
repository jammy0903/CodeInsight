/**
 * RustExecutor - Rust 코드 컴파일 및 실행
 *
 * 역할:
 * - cargo build로 컴파일
 * - cargo run으로 실행
 * - stdout/stderr 캡처
 */

import { spawn } from 'child_process';

export interface RustExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class RustExecutor {
  private readonly timeout: number = 30000; // 30초

  /**
   * Rust 프로젝트 실행
   *
   * @param projectPath Cargo 프로젝트 경로
   * @returns 실행 결과 (stdout, stderr, exitCode)
   */
  async execute(projectPath: string): Promise<RustExecutionResult> {
    return new Promise((resolve, reject) => {
      // cargo run 실행
      const process = spawn('cargo', ['run', '--quiet'], {
        cwd: projectPath,
        timeout: this.timeout,
      });

      let stdout = '';
      let stderr = '';

      // stdout 캡처
      process.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      // stderr 캡처
      process.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      // 프로세스 종료
      process.on('close', (exitCode) => {
        resolve({
          success: exitCode === 0,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: exitCode || 0,
        });
      });

      // 에러 처리
      process.on('error', (error) => {
        reject(new Error(`Failed to execute Rust code: ${error.message}`));
      });

      // 타임아웃 처리
      setTimeout(() => {
        process.kill();
        reject(new Error('Rust execution timeout (30s)'));
      }, this.timeout);
    });
  }
}
