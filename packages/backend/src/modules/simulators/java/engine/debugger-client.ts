import { spawn } from 'child_process';
import * as path from 'path';

export class DebuggerClient {
  // 빌드된 Java Agent의 JAR 파일 경로 (경로는 프로젝트 구조에 따라 조정 필요)
  private readonly AGENT_JAR_PATH = path.resolve(
    __dirname,
    '../agent/build/debugger-agent.jar'
  );

  // 타임아웃 설정 (ms)
  private readonly EXECUTION_TIMEOUT = 15000; // 15초
  private readonly MAX_RETRIES = 2; // 최대 재시도 횟수

  /**
   * Java Agent를 실행하여 사용자 코드를 디버깅하고 스냅샷을 가져옵니다.
   * @param projectPath 컴파일된 코드가 있는 폴더
   * @param mainClass 실행할 메인 클래스 이름 (보통 'Main')
   */
  async run(projectPath: string, mainClass: string = 'Main'): Promise<any[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.executeOnce(projectPath, mainClass);
      } catch (error: any) {
        lastError = error;
        console.warn(`Java execution attempt ${attempt + 1} failed: ${error.message}`);

        // 타임아웃이 아닌 다른 에러는 재시도하지 않음
        if (!error.message.includes('Time Limit Exceeded')) {
          throw error;
        }

        // 마지막 시도가 아니면 잠시 대기 후 재시도
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(500);
        }
      }
    }

    throw lastError || new Error('Java execution failed after retries');
  }

  /**
   * 단일 실행 시도
   */
  private async executeOnce(projectPath: string, mainClass: string): Promise<any[]> {
    const child = spawn('java', [
      '-jar',
      this.AGENT_JAR_PATH,
      mainClass
    ], {
      cwd: projectPath,
    });

    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill();
      }
    }, this.EXECUTION_TIMEOUT);

    let stdoutData = '';
    let stderrData = '';

    const stdoutPromise = new Promise<void>(resolve => {
      child.stdout.on('data', data => (stdoutData += data.toString()));
      child.stdout.on('end', resolve);
    });

    const stderrPromise = new Promise<void>(resolve => {
      child.stderr.on('data', data => (stderrData += data.toString()));
      child.stderr.on('end', resolve);
    });

    const exitPromise = new Promise<number>((resolve) => {
      child.on('close', code => resolve(code ?? 1));
    });

    // Wait for all streams to close and the process to exit
    await Promise.all([stdoutPromise, stderrPromise, exitPromise]);
    clearTimeout(timeout);

    const exitCode = await exitPromise;

    if (child.killed) {
      throw new Error('Time Limit Exceeded (15s)');
    }

    // stderr를 실제 에러와 경고로 구분 처리
    const stderrLines = stderrData.trim().split('\n');
    const errorLines = stderrLines.filter(line => {
      const trimmed = line.trim();
      // Warning, Info 메시지는 무시
      if (trimmed.startsWith('Warning:')) return false;
      if (trimmed.startsWith('(node:')) return false; // Node.js 경고 무시
      if (trimmed.includes('SECURITY WARNING:')) return false;
      if (trimmed.startsWith('In the next major version')) return false;
      if (trimmed.startsWith('To prepare for this change:')) return false;
      if (trimmed.startsWith('- If you want')) return false;
      if (trimmed.startsWith('See https://')) return false;
      if (trimmed.startsWith('(Use `node')) return false;
      return trimmed.length > 0;
    });

    // 실제 에러가 있는 경우에만 예외 발생
    if (errorLines.length > 0) {
      throw new Error(`Runtime Error:\n${errorLines.join('\n')}`);
    }

    if (exitCode !== 0) {
      throw new Error(`Runtime Error: Process exited with code ${exitCode}`);
    }

    try {
      return stdoutData
        .split('\n')
        .filter(line => line.trim())
        .map(line => JSON.parse(line));
    } catch (e: any) {
      throw new Error(`Failed to parse simulation output: ${e.message}\nReceived: ${stdoutData}`);
    }
  }

  /**
   * 대기 유틸리티
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}