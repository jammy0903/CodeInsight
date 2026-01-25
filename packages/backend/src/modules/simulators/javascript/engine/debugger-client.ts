import { spawn } from 'child_process';
import * as path from 'path';

export interface JavaScriptSnapshot {
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
  error?: {
    type: string;
    message: string;
  };
}

export class JavaScriptDebuggerClient {
  private readonly AGENT_PATH = path.resolve(
    __dirname,
    '../agent/debugger_agent.js'
  );

  private readonly EXECUTION_TIMEOUT = 10000; // 10 seconds
  private readonly MAX_RETRIES = 1;

  /**
   * Runs the JavaScript debugger agent and captures snapshots.
   * @param projectPath The project directory containing main.js
   * @returns Array of execution snapshots
   */
  async run(projectPath: string): Promise<JavaScriptSnapshot[]> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await this.executeOnce(projectPath);
      } catch (error: any) {
        lastError = error;
        console.warn(
          `JavaScript execution attempt ${attempt + 1} failed: ${error.message}`
        );

        // Don't retry timeout errors
        if (error.message.includes('Time Limit Exceeded')) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.MAX_RETRIES) {
          await this.sleep(500);
        }
      }
    }

    throw lastError || new Error('JavaScript execution failed after retries');
  }

  /**
   * Single execution attempt
   */
  private async executeOnce(projectPath: string): Promise<JavaScriptSnapshot[]> {
    const sourcePath = path.join(projectPath, 'main.js');

    const child = spawn('node', [this.AGENT_PATH, sourcePath], {
      cwd: projectPath,
      env: {
        ...process.env,
        NODE_OPTIONS: '--no-warnings',
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
      // Ignore common Node.js warnings
      if (trimmed.startsWith('(node:')) return false;
      if (trimmed.includes('ExperimentalWarning')) return false;
      if (trimmed.includes('DeprecationWarning')) return false;
      return true;
    });

    // Parse snapshots from stdout
    const snapshots: JavaScriptSnapshot[] = [];
    const lines = stdoutData.split('\n').filter((line) => line.trim());

    for (const line of lines) {
      try {
        const snapshot = JSON.parse(line);
        snapshots.push(snapshot);
      } catch (e) {
        // Skip non-JSON output
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

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
