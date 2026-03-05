/**
 * Shared GDB/MI Engine
 *
 * Language-agnostic GDB process management and step-by-step snapshot collection.
 * Used by both C and C++ simulators.
 *
 * Pipeline: spawn GDB → breakpoint main → step loop → collect snapshots
 * Extension: VariableEnricher interface for language-specific variable queries
 */

import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { gdbSafeEnv } from '../../safe-env';
import {
  GdbVariable,
  GdbStackFrame,
  GdbSnapshot,
  GdbHeapBlock,
  parseLocals,
  parseStackFrames,
  parseArgs,
  parseMiValue,
} from './gdb-mi-parser';

// ============================================
// Configuration & Interfaces
// ============================================

export interface GdbEngineConfig {
  sourceFileName: string;       // 'main.c' or 'main.cpp'
  timeout?: number;             // execution timeout in ms (default 15000)
  maxSteps?: number;            // max step count (default 500)
  redirectLineSkips?: number;   // exec-next calls after hitting main (default 1)
}

export type CommandSender = (cmd: string) => void;
export type ResponseWaiter = (expectStopped?: boolean) => Promise<string[]>;

/**
 * Language-specific variable enrichment hook.
 * Called for each variable after base info (address, value, pointer) is collected.
 * Enrichers can issue additional GDB commands to populate extra fields.
 */
export interface VariableEnricher {
  enrich(
    variable: GdbVariable,
    send: CommandSender,
    wait: ResponseWaiter,
  ): Promise<void>;
}

// ============================================
// GDB Engine
// ============================================

export class GdbEngine {
  private readonly timeout: number;
  private readonly maxSteps: number;
  private readonly redirectLineSkips: number;
  private readonly sourceFileName: string;

  constructor(config: GdbEngineConfig) {
    this.sourceFileName = config.sourceFileName;
    this.timeout = config.timeout ?? 15_000;
    this.maxSteps = config.maxSteps ?? 500;
    this.redirectLineSkips = config.redirectLineSkips ?? 1;
  }

  async run(
    projectPath: string,
    sourceLines: string[],
    enricher?: VariableEnricher,
  ): Promise<GdbSnapshot[]> {
    const stdoutFile = path.join(projectPath, '_stdout.txt');

    return new Promise((resolve, reject) => {
      const gdb = spawn('gdb', [
        '--interpreter=mi2',
        '--quiet',
        '--nx',
        './a.out',
      ], { cwd: projectPath, env: gdbSafeEnv() });

      const snapshots: GdbSnapshot[] = [];
      let buffer = '';
      let stepCount = 0;
      let finished = false;

      let responseLines: string[] = [];
      let pendingResolve: ((lines: string[]) => void) | null = null;
      let waitingForStopped = false;

      const timer = setTimeout(() => {
        if (!finished) {
          finished = true;
          gdb.kill('SIGKILL');
          reject(new Error('Time Limit Exceeded (15s)'));
        }
      }, this.timeout);

      const cleanup = () => {
        clearTimeout(timer);
        if (!gdb.killed) gdb.kill('SIGKILL');
      };

      const sendCommand: CommandSender = (cmd) => {
        if (!finished && !gdb.killed) {
          gdb.stdin.write(cmd + '\n');
        }
      };

      const waitForResponse: ResponseWaiter = (expectStopped = false) => {
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

      // Detect user-defined functions from source
      const userFunctions = new Set<string>();
      for (const line of sourceLines) {
        const funcMatch = line.match(
          /^\s*(?:void|int|double|float|char|bool|auto|std::\w+|unsigned|long|short|struct\s+\w+)\s+\*?\s*(\w+)\s*\(/
        );
        if (funcMatch && funcMatch[1] !== 'main') {
          userFunctions.add(funcMatch[1]);
        }
      }

      const callsUserFunction = (codeLine: string): boolean => {
        for (const func of userFunctions) {
          if (codeLine.includes(func + '(')) return true;
        }
        return false;
      };

      const isUserFrame = (lines: string[]): boolean => {
        const output = lines.join('\n');
        return output.includes(this.sourceFileName);
      };

      const collectSnapshot = async (srcLines: string[]): Promise<GdbSnapshot | null> => {
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

        const stack: GdbStackFrame[] = [];
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

            // For complex types (empty value), evaluate expression
            if (!v.value || v.value === '') {
              sendCommand(`-data-evaluate-expression ${v.name}`);
              const valLines = await waitForResponse();
              const valOutput = valLines.join('\n');
              const parsed = parseMiValue(valOutput);
              if (parsed) v.value = parsed;
            }

            // Resolve pointer targets (type contains '*')
            if (v.type.includes('*') && !v.type.includes('std::')) {
              sendCommand(`-data-evaluate-expression "(void*)${v.name}"`);
              const ptrLines = await waitForResponse();
              const ptrOutput = ptrLines.join('\n');
              const ptrMatch = ptrOutput.match(/value="(0x[0-9a-fA-F]+)/);
              if (ptrMatch && ptrMatch[1] !== '0x0') {
                v.points_to = ptrMatch[1];
              }
            }

            // Language-specific enrichment
            if (enricher) {
              await enricher.enrich(v, sendCommand, waitForResponse);
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

        // Heap tracking: find pointer targets not on stack
        const heap: GdbHeapBlock[] = [];
        const stackAddresses = new Set<string>();
        for (const f of stack) {
          for (const v of f.variables) {
            if (v.address) stackAddresses.add(v.address);
          }
        }

        const pointerTargets = new Set<string>();
        for (const f of stack) {
          for (const v of f.variables) {
            if (v.points_to && !stackAddresses.has(v.points_to)) {
              pointerTargets.add(v.points_to);
            }
          }
        }

        for (const targetAddr of pointerTargets) {
          let sourceVar: GdbVariable | null = null;
          for (const f of stack) {
            for (const v of f.variables) {
              if (v.points_to === targetAddr) {
                sourceVar = v;
                break;
              }
            }
            if (sourceVar) break;
          }

          if (sourceVar) {
            try {
              sendCommand(`-data-evaluate-expression "*(${sourceVar.name})"`);
              const derefLines = await waitForResponse();
              const derefOutput = derefLines.join('\n');
              const derefValue = parseMiValue(derefOutput) || '?';

              let heapType = sourceVar.type.replace(/\s*\*\s*$/, '').trim();
              if (sourceVar.smartPtrInfo) {
                const innerMatch = sourceVar.type.match(/<\s*([^,>]+)/);
                if (innerMatch) heapType = innerMatch[1].trim();
              }

              heap.push({
                address: targetAddr,
                type: heapType,
                size: 0,
                value: derefValue,
                name: `*${sourceVar.name}`,
              });
            } catch {
              // Dereference failed — skip this heap block
            }
          }
        }

        const code = (line >= 1 && line <= srcLines.length) ? srcLines[line - 1] : '';
        const currentStdout = await readStdout();

        return {
          line,
          code: code.trim(),
          stack,
          heap,
          stdout: currentStdout,
          events: [],
        };
      };

      const stepLoop = async () => {
        while (stepCount < this.maxSteps && !finished) {
          const snapshot = await collectSnapshot(sourceLines);
          if (snapshot) snapshots.push(snapshot);

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

          // If stepped into library code, step back out
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
                return;
              }

              if (isUserFrame(finishLines)) break;
            }
          }
        }
      };

      const initSequence = async () => {
        try {
          // Wait for GDB initial prompt
          await waitForResponse();

          // Enable pretty-printers (useful for C++ STL, harmless for C)
          sendCommand('-enable-pretty-printing');
          await waitForResponse();

          // Breakpoint at main
          sendCommand('-break-insert main');
          await waitForResponse();

          // Run to main
          sendCommand('-exec-run');
          const runLines = await waitForResponse(true);
          const runOutput = runLines.join('\n');

          if (runOutput.includes('exited')) {
            finished = true;
            cleanup();
            resolve(snapshots);
            return;
          }

          // Skip injected redirect lines (freopen/setbuf)
          for (let i = 0; i < this.redirectLineSkips; i++) {
            sendCommand('-exec-next');
            await waitForResponse(true);
          }

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
