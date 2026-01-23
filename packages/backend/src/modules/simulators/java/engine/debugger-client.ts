import { spawn } from 'child_process';
import * as path from 'path';

export class DebuggerClient {
  // 빌드된 Java Agent의 JAR 파일 경로 (경로는 프로젝트 구조에 따라 조정 필요)
  private readonly AGENT_JAR_PATH = path.resolve(
    __dirname,
    '../agent/build/debugger-agent.jar'
  );

  /**
   * Java Agent를 실행하여 사용자 코드를 디버깅하고 스냅샷을 가져옵니다.
   * @param projectPath 컴파일된 코드가 있는 폴더
   * @param mainClass 실행할 메인 클래스 이름 (보통 'Main')
   */
  async run(projectPath: string, mainClass: string = 'Main'): Promise<any[]> {
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
    }, 5000);

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
      throw new Error('Time Limit Exceeded (5s)');
    }

    // Prioritize stderr for error reporting, as the JVM might exit with code 0 even after an exception.
    if (stderrData.trim()) {
      throw new Error(`Runtime Error:\n${stderrData.trim()}`);
    }

    if (exitCode !== 0) {
      throw new Error(`Runtime Error: Process exited with code ${exitCode}`);
    }

    if (stdoutData.trim() === '' && stderrData.trim() !== '') {
        throw new Error(`Simulation resulted in an error:\n${stderrData}`);
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
}