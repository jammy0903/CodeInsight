import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { nodeSafeEnv } from '../../safe-env';

export interface InspectorRunnerOptions {
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface InspectorSession {
  projectPath: string;
  sourcePath: string;
  wsUrl: string;
  port: number;
  child: ChildProcessWithoutNullStreams;
  stop: () => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 10000;
const INSPECTOR_URL_PATTERN = /(ws:\/\/[^\s]+)/;

export class JavaScriptInspectorRunner {
  async launch(
    projectPath: string,
    options: InspectorRunnerOptions = {}
  ): Promise<InspectorSession> {
    const sourcePath = path.join(projectPath, 'main.js');
    const runtimeHookPath = path.join(projectPath, 'ci-runtime-hook.js');
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const args = ['--inspect-brk=0'];
    if (fs.existsSync(runtimeHookPath)) {
      args.push('--require', runtimeHookPath);
    }
    args.push(sourcePath);

    const child = spawn('node', args, {
      cwd: projectPath,
      env: nodeSafeEnv(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const wsUrl = await this.waitForInspectorWsUrl(child, timeoutMs, options.signal);
    const port = extractInspectorPort(wsUrl);

    return {
      projectPath,
      sourcePath,
      wsUrl,
      port,
      child,
      stop: () => stopChildProcess(child),
    };
  }

  private waitForInspectorWsUrl(
    child: ChildProcessWithoutNullStreams,
    timeoutMs: number,
    signal?: AbortSignal
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let stderrBuffer = '';
      let settled = false;

      const timeout = setTimeout(() => {
        cleanup();
        void stopChildProcess(child);
        reject(new Error(`Inspector endpoint timeout (${timeoutMs}ms)`));
      }, timeoutMs);

      const onAbort = () => {
        cleanup();
        void stopChildProcess(child);
        reject(new Error('Inspector launch aborted'));
      };

      const onClose = (code: number | null) => {
        if (settled) return;
        cleanup();
        reject(
          new Error(
            `Inspector process exited before endpoint was ready (code: ${code ?? 'null'})\n${stderrBuffer}`
          )
        );
      };

      const onStderr = (chunk: Buffer) => {
        if (settled) return;
        const text = chunk.toString();
        stderrBuffer += text;

        const match = stderrBuffer.match(INSPECTOR_URL_PATTERN);
        if (!match) return;

        settled = true;
        cleanup();
        resolve(match[1]);
      };

      const cleanup = () => {
        clearTimeout(timeout);
        child.stderr.off('data', onStderr);
        child.off('close', onClose);
        if (signal) {
          signal.removeEventListener('abort', onAbort);
        }
      };

      child.stderr.on('data', onStderr);
      child.on('close', onClose);

      if (signal) {
        if (signal.aborted) {
          onAbort();
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }
}

function extractInspectorPort(wsUrl: string): number {
  const parsed = new URL(wsUrl);
  return Number(parsed.port);
}

async function stopChildProcess(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;

  try {
    child.kill('SIGTERM');
  } catch {
    return;
  }
  await waitForClose(child, 500);

  if (child.exitCode === null && child.signalCode === null) {
    try {
      child.kill('SIGKILL');
    } catch {
      return;
    }
    await waitForClose(child, 500);
  }
}

function waitForClose(
  child: ChildProcessWithoutNullStreams,
  timeoutMs: number
): Promise<void> {
  return new Promise<void>((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }

    let done = false;
    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        resolve();
      }
    }, timeoutMs);

    child.once('close', () => {
      if (done) return;
      done = true;
      clearTimeout(timeout);
      resolve();
    });
  });
}
