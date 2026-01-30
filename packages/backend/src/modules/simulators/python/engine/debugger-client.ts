import { spawn } from 'child_process';
import * as path from 'path';

export interface PythonSnapshot {
  line: number;
  event: 'STEP' | 'ERROR';
  stack: Array<{
    methodName: string;
    className: string;
    variables: Record<string, any>;
  }>;
  heap: Array<{
    address: string;
    type: string;
    content: string;
    length?: number;
  }>;
  stdout?: string;  // 누적 print 출력
  error?: {
    type: string;
    message: string;
  };
}

export class PythonDebuggerClient {
  private readonly AGENT_PATH = path.resolve(
    __dirname,
    '../agent/debugger_agent.py'
  );

  private readonly EXECUTION_TIMEOUT = 10000; // 10 seconds

  /**
   * Runs the Python debugger agent and captures snapshots.
   * No retry logic - errors are immediately propagated to the client for toast notification.
   * @param projectPath The project directory containing main.py
   * @returns Array of execution snapshots
   */
  async run(projectPath: string): Promise<PythonSnapshot[]> {
    const sourcePath = path.join(projectPath, 'main.py');

    const child = spawn('python3', [this.AGENT_PATH, sourcePath], {
      cwd: projectPath,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Disable output buffering
        PYTHONIOENCODING: 'utf-8',
      },
    });

    const timeout = setTimeout(() => {
      if (!child.killed) {
        child.kill('SIGKILL');
      }
    }, this.EXECUTION_TIMEOUT);

    let stdoutData = '';
    let stderrData = '';

    const stdoutPromise = new Promise<void>((resolve) => {
      child.stdout.on('data', (data) => (stdoutData += data.toString()));
      child.stdout.on('end', resolve);
    });

    const stderrPromise = new Promise<void>((resolve) => {
      child.stderr.on('data', (data) => (stderrData += data.toString()));
      child.stderr.on('end', resolve);
    });

    const exitPromise = new Promise<number>((resolve) => {
      child.on('close', (code) => resolve(code ?? 1));
    });

    await Promise.all([stdoutPromise, stderrPromise, exitPromise]);
    clearTimeout(timeout);

    const exitCode = await exitPromise;

    if (child.killed) {
      throw new Error('Time Limit Exceeded (10s)');
    }

    // Filter stderr for real errors
    const stderrLines = stderrData.trim().split('\n');
    const errorLines = stderrLines.filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Ignore common Python warnings
      if (trimmed.startsWith('Warning:')) return false;
      if (trimmed.includes('DeprecationWarning')) return false;
      if (trimmed.includes('SyntaxWarning')) return false;
      return true;
    });

    // Parse snapshots from stdout
    const snapshots: PythonSnapshot[] = [];
    const lines = stdoutData.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const snapshot = JSON.parse(line);
        snapshots.push(snapshot);
      } catch (e) {
        // Skip non-JSON output (user print statements captured by trace)
        continue;
      }
    }

    // Check for errors
    const errorSnapshot = snapshots.find((s) => s.event === 'ERROR');
    if (errorSnapshot && errorSnapshot.error) {
      throw new Error(
        `${errorSnapshot.error.type}: ${errorSnapshot.error.message}`
      );
    }

    // If we got stderr errors but no snapshots, throw
    if (errorLines.length > 0 && snapshots.length === 0) {
      throw new Error(`Syntax Error:\n${errorLines.join('\n')}`);
    }

    // If exit code was non-zero and we have no good snapshots, check stderr
    if (exitCode !== 0 && snapshots.length === 0) {
      if (stderrData.trim()) {
        throw new Error(`Runtime Error:\n${stderrData.trim()}`);
      }
      throw new Error(`Runtime Error: Process exited with code ${exitCode}`);
    }

    return snapshots.filter((s) => s.event === 'STEP');
  }
}
