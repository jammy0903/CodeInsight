/**
 * GDB/MI 클라이언트 — C++ 디버거 통신
 *
 * GDB의 Machine Interface(MI) 프로토콜로 통신하여
 * 스텝별 스냅샷(라인, 변수, 스택, 힙) 수집
 *
 * stdout 캡처: 프로그램 출력을 파일로 리다이렉트하여 수집
 * (GDB/MI 모드에서 target output은 안정적으로 파싱 불가)
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================
// 타입 정의
// ============================================

export interface CppVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  children?: CppVariable[];
}

export interface CppStackFrame {
  functionName: string;
  depth: number;
  line: number;
  variables: CppVariable[];
}

export interface CppSnapshot {
  line: number;
  code: string;
  stack: CppStackFrame[];
  heap: CppHeapBlock[];
  stdout: string;
  events: any[];
}

export interface CppHeapBlock {
  address: string;
  type: string;
  size: number;
  value: string;
  name: string;
}

// ============================================
// GDB/MI 파서 유틸리티
// ============================================

function parseMiRecord(line: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+)="([^"]*?)"/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

function parseLocals(output: string): CppVariable[] {
  const variables: CppVariable[] = [];
  const blockRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;
  while ((match = blockRegex.exec(output)) !== null) {
    const block = match[1];
    const fields = parseMiRecord(block);
    if (fields.name) {
      variables.push({
        name: fields.name,
        type: fields.type || 'unknown',
        value: fields.value || '',
        address: '',
      });
    }
  }
  return variables;
}

function parseStackFrames(output: string): Array<{ func: string; level: number; line: number }> {
  const frames: Array<{ func: string; level: number; line: number }> = [];
  const frameRegex = /frame=\{([^}]+)\}/g;
  let match;
  while ((match = frameRegex.exec(output)) !== null) {
    const fields = parseMiRecord(match[1]);
    if (fields.func) {
      frames.push({
        func: fields.func,
        level: parseInt(fields.level || '0', 10),
        line: parseInt(fields.line || '0', 10),
      });
    }
  }
  return frames;
}

function parseArgs(output: string, frameLevel: number): CppVariable[] {
  const variables: CppVariable[] = [];
  const frameRegex = /frame=\{level="(\d+)",args=\[([^\]]*)\]\}/g;
  let match;
  while ((match = frameRegex.exec(output)) !== null) {
    const level = parseInt(match[1], 10);
    if (level === frameLevel) {
      const argsContent = match[2];
      const blockRegex = /\{([^}]+)\}/g;
      let argMatch;
      while ((argMatch = blockRegex.exec(argsContent)) !== null) {
        const fields = parseMiRecord(argMatch[1]);
        if (fields.name) {
          variables.push({
            name: fields.name,
            type: fields.type || 'unknown',
            value: fields.value || '',
            address: '',
          });
        }
      }
      break;
    }
  }
  return variables;
}

// ============================================
// GDB 클라이언트
// ============================================

export class GdbClient {
  private readonly EXECUTION_TIMEOUT = 15_000;
  private readonly MAX_STEPS = 500;

  async run(projectPath: string, sourceLines: string[]): Promise<CppSnapshot[]> {
    const stdoutFile = path.join(projectPath, '_stdout.txt');

    return new Promise((resolve, reject) => {
      const gdb = spawn('gdb', [
        '--interpreter=mi2',
        '--quiet',
        '--nx',
        './a.out',
      ], { cwd: projectPath });

      const snapshots: CppSnapshot[] = [];
      let buffer = '';
      let stepCount = 0;
      let finished = false;

      let responseLines: string[] = [];
      let pendingResolve: ((lines: string[]) => void) | null = null;
      let waitingForStopped = false;

      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          gdb.kill('SIGKILL');
          reject(new Error('Time Limit Exceeded (15s)'));
        }
      }, this.EXECUTION_TIMEOUT);

      const cleanup = () => {
        clearTimeout(timeout);
        if (!gdb.killed) gdb.kill('SIGKILL');
      };

      const sendCommand = (cmd: string) => {
        if (!finished && !gdb.killed) {
          gdb.stdin.write(cmd + '\n');
        }
      };

      const waitForResponse = (expectStopped = false): Promise<string[]> => {
        return new Promise((res) => {
          responseLines = [];
          waitingForStopped = expectStopped;
          pendingResolve = res;
        });
      };

      const resolveIfReady = (line: string) => {
        if (!pendingResolve) return;
        responseLines.push(line);

        if (waitingForStopped) {
          if (
            line.startsWith('*stopped') ||
            line.includes('exited') ||
            line.includes('exited-normally') ||
            line.includes('exited-signalled')
          ) {
            const r = pendingResolve;
            pendingResolve = null;
            r(responseLines);
          }
        } else {
          if (
            line.startsWith('^done') ||
            line.startsWith('^error') ||
            line === '(gdb)'
          ) {
            const r = pendingResolve;
            pendingResolve = null;
            r(responseLines);
          }
        }
      };

      const readStdout = async (): Promise<string> => {
        try {
          return await fs.readFile(stdoutFile, 'utf-8');
        } catch {
          return '';
        }
      };

      const initSequence = async () => {
        try {
          // Wait for GDB initial prompt
          await waitForResponse();

          // Enable pretty-printers for STL types
          sendCommand('-enable-pretty-printing');
          await waitForResponse();

          // Breakpoint at main
          sendCommand('-break-insert main');
          await waitForResponse();

          // Run to main (expects *stopped)
          sendCommand('-exec-run');
          const runLines = await waitForResponse(true);
          const runOutput = runLines.join('\n');

          if (runOutput.includes('exited')) {
            finished = true;
            cleanup();
            resolve(snapshots);
            return;
          }

          // Step through the freopen/setbuf redirect line injected by file-manager
          // (it's the first line after main() { )
          sendCommand('-exec-next');
          await waitForResponse(true);

          // Now stdout is redirected to _stdout.txt, start step loop
          await stepLoop();

          finished = true;
          cleanup();
          resolve(snapshots);
        } catch (err) {
          if (!finished) {
            finished = true;
            cleanup();
            reject(err);
          }
        }
      };

      // Detect if a source line calls a user function (defined in main.cpp)
      // by checking if the function name matches a definition in the source
      const userFunctions = new Set<string>();
      for (const line of sourceLines) {
        // Match function definitions like: void swap(int &a, int &b) {
        const funcMatch = line.match(/^\s*(?:void|int|double|float|char|bool|auto|std::\w+|unsigned|long|short)\s+(\w+)\s*\(/);
        if (funcMatch && funcMatch[1] !== 'main') {
          userFunctions.add(funcMatch[1]);
        }
      }

      // Check if a code line calls a user function
      const callsUserFunction = (codeLine: string): boolean => {
        for (const func of userFunctions) {
          if (codeLine.includes(func + '(')) return true;
        }
        return false;
      };

      // Check if *stopped response is in user code
      const isUserFrame = (lines: string[]): boolean => {
        const output = lines.join('\n');
        return output.includes('main.cpp');
      };

      const stepLoop = async () => {
        while (stepCount < this.MAX_STEPS && !finished) {
          const snapshot = await collectSnapshot(sourceLines);
          if (snapshot) snapshots.push(snapshot);

          // Decide step type: step-into for user function calls, step-over otherwise
          const currentCode = snapshot?.code || '';
          const useStepInto = callsUserFunction(currentCode);

          sendCommand(useStepInto ? '-exec-step' : '-exec-next');
          const resultLines = await waitForResponse(true);
          const resultStr = resultLines.join('\n');
          stepCount++;

          if (
            resultStr.includes('exited') ||
            resultStr.includes('exited-normally') ||
            resultStr.includes('exited-signalled') ||
            resultStr.includes('signal-received')
          ) {
            break;
          }

          // Safety: if we accidentally stepped into library code, step back out
          if (useStepInto && !isUserFrame(resultLines)) {
            let bounceCount = 0;
            while (bounceCount < 10) {
              sendCommand('-exec-finish');
              const finishLines = await waitForResponse(true);
              const finishStr = finishLines.join('\n');
              stepCount++;
              bounceCount++;

              if (
                finishStr.includes('exited') ||
                finishStr.includes('exited-normally') ||
                finishStr.includes('exited-signalled')
              ) {
                return; // Program ended
              }

              if (isUserFrame(finishLines)) break;
            }
          }
        }
      };

      const collectSnapshot = async (srcLines: string[]): Promise<CppSnapshot | null> => {
        sendCommand('-stack-list-frames');
        const framesLines = await waitForResponse();
        const framesOutput = framesLines.join('\n');
        const rawFrames = parseStackFrames(framesOutput);

        if (rawFrames.length === 0) return null;

        const currentFrame = rawFrames[0];
        const line = currentFrame.line;

        const userFrames = rawFrames.filter(f =>
          f.func !== '??' &&
          !f.func.startsWith('__') &&
          !f.func.startsWith('_start')
        );

        const stack: CppStackFrame[] = [];
        for (const frame of userFrames) {
          sendCommand(`-stack-select-frame ${frame.level}`);
          await waitForResponse();

          sendCommand('-stack-list-locals 2');
          const localsLines = await waitForResponse();
          const locals = parseLocals(localsLines.join('\n'));

          sendCommand('-stack-list-arguments 2');
          const argsLines = await waitForResponse();
          const args = parseArgs(argsLines.join('\n'), frame.level);

          const allVars = [...args, ...locals];

          for (const v of allVars) {
            // Get address
            sendCommand(`-data-evaluate-expression "&(${v.name})"`);
            const addrLines = await waitForResponse();
            const addrOutput = addrLines.join('\n');
            const addrMatch = addrOutput.match(/value="(0x[0-9a-fA-F]+)/);
            if (addrMatch) v.address = addrMatch[1];

            // For complex types (empty value), use -data-evaluate-expression to get pretty-printed value
            if (!v.value || v.value === '') {
              sendCommand(`-data-evaluate-expression ${v.name}`);
              const valLines = await waitForResponse();
              const valOutput = valLines.join('\n');
              // Parse value="..." — handle escaped quotes inside
              const valStart = valOutput.indexOf('value="');
              if (valStart !== -1) {
                let i = valStart + 7; // skip 'value="'
                let result = '';
                while (i < valOutput.length) {
                  if (valOutput[i] === '\\' && i + 1 < valOutput.length) {
                    result += valOutput[i] + valOutput[i + 1];
                    i += 2;
                  } else if (valOutput[i] === '"') {
                    break;
                  } else {
                    result += valOutput[i];
                    i++;
                  }
                }
                v.value = result
                  .replace(/\\"/g, '"')
                  .replace(/\\n/g, '')
                  .replace(/\\\\/g, '\\');
              }
            }
          }

          stack.push({
            functionName: frame.func,
            depth: frame.level,
            line: frame.line,
            variables: allVars,
          });
        }

        if (userFrames.length > 1) {
          sendCommand('-stack-select-frame 0');
          await waitForResponse();
        }

        const code = (line >= 1 && line <= srcLines.length) ? srcLines[line - 1] : '';
        const currentStdout = await readStdout();

        return {
          line,
          code: code.trim(),
          stack,
          heap: [],
          stdout: currentStdout,
          events: [],
        };
      };

      gdb.stdout.on('data', (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          resolveIfReady(trimmed);
        }
      });

      gdb.stderr.on('data', () => {});

      gdb.on('close', () => {
        if (!finished) {
          finished = true;
          cleanup();
          if (pendingResolve) {
            const r = pendingResolve;
            pendingResolve = null;
            r(responseLines);
          }
          resolve(snapshots);
        }
      });

      gdb.on('error', (err) => {
        if (!finished) {
          finished = true;
          cleanup();
          reject(new Error(`GDB failed to start: ${err.message}`));
        }
      });

      initSequence();
    });
  }
}
