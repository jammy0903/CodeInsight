/**
 * GDB/MI 세션 관리자
 *
 * GDB 프로세스를 child_process로 생성하고 MI 프로토콜로 통신합니다.
 * 모든 명령은 비동기 Promise 기반이며, 응답 대기 + 타임아웃을 관리합니다.
 */

import { spawn, type ChildProcess } from 'child_process';
import {
  parseMiOutput,
  findResult,
  findStopped,
  getString,
  getNumber,
} from './gdb-mi-parser';
import { GDB_INIT_COMMANDS, MI_COMMAND_TIMEOUT } from './constants';
import type {
  MiRecord,
  MiTuple,
  GdbVariable,
  GdbFrame,
  GdbBreakpoint,
  StepResult,
  StopReason,
  GdbSessionOptions,
} from './types';
import { logger } from '../../../../utils/logger';

export class GdbSession {
  private process: ChildProcess | null = null;
  private buffer = '';
  private pendingResolve: ((records: MiRecord[]) => void) | null = null;
  private allTargetOutput = '';
  private debug: boolean;

  constructor(private options: GdbSessionOptions = {}) {
    this.debug = options.debug ?? false;
  }

  // ============================================
  // 세션 라이프사이클
  // ============================================

  /**
   * GDB 프로세스 시작 및 초기화
   */
  async start(binaryPath: string): Promise<void> {
    const gdbPath = this.options.gdbPath ?? 'gdb';

    this.process = spawn(gdbPath, [
      '--interpreter=mi',  // MI 프로토콜 모드
      '--quiet',           // 배너 생략
      '--nx',              // .gdbinit 무시
      binaryPath,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...globalThis.process.env, TERM: 'dumb' },
    });

    // stdout 수신
    this.process.stdout!.on('data', (chunk: Buffer) => {
      this.onData(chunk.toString());
    });

    // stderr 수신 (GDB 자체 에러)
    this.process.stderr!.on('data', (chunk: Buffer) => {
      if (this.debug) {
        logger.debug(`[GDB stderr] ${chunk.toString().trim()}`);
      }
    });

    // 초기 프롬프트 대기
    await this.waitForPrompt();

    // 초기 설정 명령 실행
    for (const cmd of GDB_INIT_COMMANDS) {
      await this.sendRaw(cmd);
    }
  }

  /**
   * GDB 프로세스 종료
   */
  async kill(): Promise<void> {
    if (!this.process) return;

    try {
      // GDB에 종료 명령
      this.process.stdin!.write('-gdb-exit\n');
    } catch {
      // 이미 종료된 경우 무시
    }

    // 강제 종료 타이머
    const forceKill = setTimeout(() => {
      this.process?.kill('SIGKILL');
    }, 2000);

    return new Promise<void>((resolve) => {
      this.process!.on('exit', () => {
        clearTimeout(forceKill);
        this.process = null;
        resolve();
      });

      // 이미 종료된 경우
      if (this.process!.exitCode !== null) {
        clearTimeout(forceKill);
        this.process = null;
        resolve();
      }
    });
  }

  // ============================================
  // MI 명령 전송
  // ============================================

  /**
   * MI 명령 전송 후 응답 대기
   */
  async send(command: string): Promise<MiRecord[]> {
    if (!this.process || this.process.exitCode !== null) {
      throw new Error('GDB session is not running');
    }

    if (this.debug) {
      logger.debug(`[GDB →] ${command}`);
    }

    return new Promise<MiRecord[]>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResolve = null;
        reject(new Error(`GDB command timeout: ${command}`));
      }, this.options.timeout ?? MI_COMMAND_TIMEOUT);

      this.pendingResolve = (records) => {
        clearTimeout(timeout);
        if (this.debug) {
          for (const r of records) {
            logger.debug(`[GDB ←] ${r.raw}`);
          }
        }
        resolve(records);
      };

      this.buffer = '';
      this.process!.stdin!.write(command + '\n');
    });
  }

  /**
   * 간단한 명령 전송 (설정 등, 결과 무시)
   */
  private async sendRaw(command: string): Promise<void> {
    await this.send(command);
  }

  // ============================================
  // 실행 제어
  // ============================================

  /** 브레이크포인트 설정 */
  async setBreakpoint(location: string): Promise<GdbBreakpoint | null> {
    const records = await this.send(`-break-insert ${location}`);
    const result = findResult(records);
    if (result?.class === 'done' && result.data.bkpt) {
      const bkpt = result.data.bkpt as MiTuple;
      return {
        number: getString(bkpt, 'number') ?? '',
        type: getString(bkpt, 'type') ?? '',
        disp: getString(bkpt, 'disp') ?? '',
        enabled: getString(bkpt, 'enabled') ?? '',
        addr: getString(bkpt, 'addr') ?? '',
        func: getString(bkpt, 'func'),
        file: getString(bkpt, 'file'),
        line: getNumber(bkpt, 'line'),
      };
    }
    return null;
  }

  /** 프로그램 실행 (첫 브레이크포인트까지) */
  async run(stdinFile?: string): Promise<StepResult> {
    const cmd = stdinFile
      ? `-exec-run < ${stdinFile}`
      : '-exec-run';
    const records = await this.send(cmd);
    return this.parseStopResult(records);
  }

  /** 한 줄 실행 — 함수 내부로 진입하지 않음 (step over) */
  async next(): Promise<StepResult> {
    const records = await this.send('-exec-next');
    return this.parseStopResult(records);
  }

  /** 한 줄 실행 — 함수 내부로 진입 (step into) */
  async step(): Promise<StepResult> {
    const records = await this.send('-exec-step');
    return this.parseStopResult(records);
  }

  /** 현재 함수가 반환될 때까지 실행 (step out) */
  async finish(): Promise<StepResult> {
    const records = await this.send('-exec-finish');
    return this.parseStopResult(records);
  }

  /** 다음 브레이크포인트까지 계속 실행 */
  async continue(): Promise<StepResult> {
    const records = await this.send('-exec-continue');
    return this.parseStopResult(records);
  }

  // ============================================
  // 상태 조회
  // ============================================

  /** 현재 스코프의 로컬 변수 목록 */
  async getLocals(): Promise<GdbVariable[]> {
    const records = await this.send('-stack-list-locals --all-values');
    const result = findResult(records);
    if (result?.class !== 'done') return [];

    return this.parseVariableList(result.data.locals);
  }

  /** 현재 함수 인자 목록 */
  async getArgs(): Promise<GdbVariable[]> {
    const records = await this.send('-stack-list-arguments --all-values 0 0');
    const result = findResult(records);
    if (result?.class !== 'done') return [];

    // stack-args → frame → args
    const stackArgs = result.data['stack-args'];
    if (!Array.isArray(stackArgs) || stackArgs.length === 0) return [];

    const frame0 = stackArgs[0] as MiTuple;
    const args = frame0?.args;
    return this.parseVariableList(args);
  }

  /** 콜 스택 프레임 목록 */
  async getFrames(): Promise<GdbFrame[]> {
    const records = await this.send('-stack-list-frames');
    const result = findResult(records);
    if (result?.class !== 'done') return [];

    const stack = result.data.stack;
    if (!Array.isArray(stack)) return [];

    return stack.map(item => {
      const f = (item as MiTuple).frame as MiTuple | undefined;
      const tuple = f ?? item as MiTuple;
      return {
        level: getNumber(tuple, 'level') ?? 0,
        func: getString(tuple, 'func') ?? '??',
        file: getString(tuple, 'file'),
        fullname: getString(tuple, 'fullname'),
        line: getNumber(tuple, 'line'),
        addr: getString(tuple, 'addr') ?? '0x0',
      };
    });
  }

  /** 표현식 평가 (주소 가져오기, sizeof 등) */
  async evaluate(expression: string): Promise<string> {
    const records = await this.send(`-data-evaluate-expression ${expression}`);
    const result = findResult(records);
    if (result?.class === 'done') {
      return (result.data.value as string) ?? '';
    }
    return '';
  }

  /** 메모리 바이트 읽기 */
  async readMemory(address: string, size: number): Promise<number[]> {
    if (size <= 0) return [];

    const records = await this.send(
      `-data-read-memory-bytes ${address} ${size}`
    );
    const result = findResult(records);
    if (result?.class !== 'done') return new Array(size).fill(0);

    // memory → [{begin, offset, end, contents}]
    const memory = result.data.memory;
    if (!Array.isArray(memory) || memory.length === 0) return new Array(size).fill(0);

    const block = memory[0] as MiTuple;
    const contents = getString(block, 'contents') ?? '';

    // hex 문자열 → 바이트 배열
    const bytes: number[] = [];
    for (let i = 0; i < contents.length; i += 2) {
      bytes.push(parseInt(contents.slice(i, i + 2), 16));
    }
    return bytes;
  }

  /** 누적된 프로그램 stdout */
  getStdout(): string {
    return this.allTargetOutput;
  }

  // ============================================
  // 내부 헬퍼
  // ============================================

  /** GDB stdout 데이터 수신 처리 */
  private onData(data: string): void {
    this.buffer += data;

    // target output (@"...") 누적 — 프로그램 stdout
    for (const line of data.split('\n')) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@"')) {
        const text = trimmed.slice(2, -1)
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
        this.allTargetOutput += text;
      }
    }

    // (gdb) 프롬프트가 나타나면 응답 완료
    if (this.buffer.includes('(gdb)')) {
      const records = parseMiOutput(this.buffer);
      this.buffer = '';

      if (this.pendingResolve) {
        const resolve = this.pendingResolve;
        this.pendingResolve = null;
        resolve(records);
      }
    }
  }

  /** 초기 프롬프트 대기 */
  private waitForPrompt(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('GDB start timeout'));
      }, 10_000);

      this.pendingResolve = () => {
        clearTimeout(timeout);
        resolve();
      };
    });
  }

  /** *stopped 레코드에서 StepResult 파싱 */
  private parseStopResult(records: MiRecord[]): StepResult {
    const stopped = findStopped(records);

    if (!stopped) {
      // 프로그램이 바로 종료된 경우 result에서 확인
      const result = findResult(records);
      if (result?.class === 'exit') {
        return { reason: 'exited-normally' };
      }
      return { reason: 'exited-normally' };
    }

    const reason = (getString(stopped.data as MiTuple, 'reason') ?? 'end-stepping-range') as StopReason;

    // 프레임 정보
    let frame: GdbFrame | undefined;
    const frameTuple = stopped.data.frame as MiTuple | undefined;
    if (frameTuple) {
      frame = {
        level: getNumber(frameTuple, 'level') ?? 0,
        func: getString(frameTuple, 'func') ?? '??',
        file: getString(frameTuple, 'file'),
        fullname: getString(frameTuple, 'fullname'),
        line: getNumber(frameTuple, 'line'),
        addr: getString(frameTuple, 'addr') ?? '0x0',
      };
    }

    // 시그널 정보 (SIGSEGV 등)
    let signal: StepResult['signal'];
    const signalName = getString(stopped.data as MiTuple, 'signal-name');
    if (signalName) {
      signal = {
        name: signalName,
        meaning: getString(stopped.data as MiTuple, 'signal-meaning') ?? '',
      };
    }

    // 종료 코드
    const exitCode = getNumber(stopped.data as MiTuple, 'exit-code');

    return { reason, frame, signal, exitCode };
  }

  /** 변수 리스트 파싱 */
  private parseVariableList(raw: unknown): GdbVariable[] {
    if (!Array.isArray(raw)) return [];

    return raw.map(item => {
      const tuple = item as MiTuple;
      return {
        name: getString(tuple, 'name') ?? '',
        type: getString(tuple, 'type') ?? '',
        value: getString(tuple, 'value') ?? '',
      };
    }).filter(v => v.name !== '');
  }
}
