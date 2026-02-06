/**
 * GDB 기반 C 코드 트레이서 — 메인 오케스트레이터
 *
 * 전체 흐름:
 *  1. 보안 검사 (기존 checkCodeSecurity 재사용)
 *  2. gcc -g -O0 컴파일
 *  3. GDB 세션 시작 + HeapTracker 설정
 *  4. 스텝별 실행 + 상태 수집
 *  5. StepBuilder로 기존 Step[] 포맷 변환
 *  6. 정리 + 결과 반환
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { GdbSession } from './gdb-session';
import { HeapTracker } from './heap-tracker';
import { StepBuilder, type RawStepData } from './step-builder';
import { generateExplanation } from './explanation-generator';
import { DEFAULT_MAX_STEPS, DEFAULT_TIMEOUT, SKIP_FUNCTIONS, USER_SOURCE_FILE, getTypeSize } from './constants';
import type { TraceResult, EnrichedVariable, GdbSessionOptions, StepResult } from './types';
import type { Step } from '../runtime/types';
import { checkCodeSecurity } from '../executor/security';
import { logger } from '../../../../utils/logger';

const execAsync = promisify(exec);

export class GdbTracer {
  private options: Required<GdbSessionOptions>;

  constructor(options: GdbSessionOptions = {}) {
    this.options = {
      gdbPath: options.gdbPath ?? 'gdb',
      maxSteps: options.maxSteps ?? DEFAULT_MAX_STEPS,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
      debug: options.debug ?? false,
    };
  }

  /**
   * C 코드를 GDB로 트레이싱하여 Step[] 반환
   */
  async trace(code: string, stdin?: string): Promise<TraceResult> {
    const workDir = path.join('/tmp', `gdb-trace-${crypto.randomUUID()}`);
    let session: GdbSession | null = null;

    try {
      // ──────────────────────────────────────
      // Phase 1: 보안 검사 (기존 로직 재사용)
      // ──────────────────────────────────────
      const security = checkCodeSecurity(code);
      if (!security.safe) {
        return {
          success: false,
          error: 'security_violation',
          message: security.reason,
          steps: [],
          source_lines: code.split('\n'),
        };
      }

      // ──────────────────────────────────────
      // Phase 2: 컴파일
      // ──────────────────────────────────────
      await fs.mkdir(workDir, { recursive: true });
      const sourceFile = path.join(workDir, 'main.c');
      const binaryFile = path.join(workDir, 'a.out');
      const stdinFile = stdin ? path.join(workDir, 'stdin.txt') : undefined;

      await fs.writeFile(sourceFile, code);
      if (stdinFile && stdin) {
        await fs.writeFile(stdinFile, stdin);
      }

      // gcc -g (디버그 심볼) -O0 (최적화 끄기) -Wall (경고)
      const compileResult = await this.compile(sourceFile, binaryFile);

      if (!compileResult.success) {
        return {
          success: false,
          error: 'compile_error',
          details: compileResult.errors,
          warnings: compileResult.warnings,
          steps: [],
          source_lines: code.split('\n'),
        };
      }

      // ──────────────────────────────────────
      // Phase 3: GDB 세션 시작
      // ──────────────────────────────────────
      session = new GdbSession(this.options);
      await session.start(binaryFile);

      // HeapTracker 설정 (malloc/free 브레이크포인트)
      const heapTracker = new HeapTracker();
      await heapTracker.setup(session);

      // main에 브레이크포인트 → 실행
      await session.setBreakpoint('main');

      // stdin 리다이렉션
      if (stdinFile) {
        await session.send(`set args < ${stdinFile}`);
      }

      const startResult = await session.run();

      // main에 도달하지 못한 경우
      if (startResult.reason === 'exited-normally' || startResult.reason === 'exited') {
        return {
          success: true,
          steps: [],
          source_lines: code.split('\n'),
          message: 'Program exited before reaching main',
        };
      }

      // ──────────────────────────────────────
      // Phase 4: 스텝별 실행 + 데이터 수집
      // ──────────────────────────────────────
      const sourceLines = code.split('\n');
      const steps: Step[] = [];
      const stepBuilder = new StepBuilder();
      let stepCount = 0;
      const startTime = Date.now();

      // 첫 스텝 (main 진입)
      await this.collectAndBuildStep(
        session, heapTracker, stepBuilder, sourceLines, steps
      );
      stepCount++;

      while (stepCount < this.options.maxSteps) {
        // 타임아웃 체크
        if (Date.now() - startTime > this.options.timeout) {
          logger.warn(`GDB trace timeout after ${stepCount} steps`);
          break;
        }

        // 다음 라인 실행
        const stepResult = await this.executeNextStep(session, heapTracker);

        // 프로그램 종료
        if (this.isTerminated(stepResult)) {
          break;
        }

        // 시그널 수신 (SIGSEGV 등)
        if (stepResult.signal) {
          steps.push({
            line: stepResult.frame?.line ?? 0,
            code: sourceLines[(stepResult.frame?.line ?? 1) - 1] ?? '',
            stack: [],
            heap: [],
            explanation: `⚠️ ${stepResult.signal.name}: ${stepResult.signal.meaning}`,
            rsp: '0x0',
            rbp: '0x0',
            stdout: session.getStdout() || undefined,
          });
          break;
        }

        // 사용자 코드가 아닌 경우 스킵
        if (!this.isUserCode(stepResult)) {
          try {
            await session.finish();
          } catch {
            // finish 실패 시 (이미 반환된 경우 등) next로 진행
            try { await session.next(); } catch { break; }
          }
          continue;
        }

        // 상태 수집 + Step 생성
        await this.collectAndBuildStep(
          session, heapTracker, stepBuilder, sourceLines, steps
        );
        stepCount++;
      }

      // ──────────────────────────────────────
      // Phase 5: 메모리 누수 감지
      // ──────────────────────────────────────
      const leaks = heapTracker.getLeakedBlocks();
      if (leaks.length > 0 && steps.length > 0) {
        const lastStep = steps[steps.length - 1];
        steps.push(stepBuilder.buildLeakWarningStep(leaks, lastStep));
      }

      return {
        success: true,
        steps,
        source_lines: sourceLines,
        message: `Traced ${steps.length} steps via GDB`,
        warnings: [
          ...(compileResult.warnings ?? []),
          ...(leaks.length > 0 ? [`Memory leak: ${leaks.length} block(s) not freed`] : []),
        ],
      };

    } catch (err) {
      logger.error('GDB trace error:', err);
      return {
        success: false,
        error: 'internal_error',
        message: err instanceof Error ? err.message : 'Unknown GDB error',
        steps: [],
        source_lines: code.split('\n'),
      };
    } finally {
      // 정리
      await session?.kill();
      try {
        await fs.rm(workDir, { recursive: true, force: true });
      } catch { /* ignore */ }
    }
  }

  // ============================================
  // 컴파일
  // ============================================

  private async compile(sourceFile: string, binaryFile: string): Promise<{
    success: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const { stderr } = await execAsync(
        `gcc -g -O0 -Wall -Wextra -o "${binaryFile}" "${sourceFile}" -lm 2>&1`,
        { timeout: 30_000 }
      );

      const warnings = stderr
        ? stderr.split('\n').filter(l => l.includes('warning:')).map(l => l.trim())
        : undefined;

      return { success: true, warnings };
    } catch (err: unknown) {
      const error = err as { stderr?: string; message?: string };
      const stderr = error.stderr ?? error.message ?? 'Compilation failed';
      const errors = stderr.split('\n')
        .filter(l => l.includes('error:'))
        .map(l => {
          // "main.c:5:3: error: message" → "Line 5: message"
          const match = l.match(/:(\d+):\d+:\s*error:\s*(.+)/);
          return match ? `Line ${match[1]}: ${match[2]}` : l.trim();
        });

      return { success: false, errors };
    }
  }

  // ============================================
  // 스텝 실행 로직
  // ============================================

  /**
   * 다음 스텝 실행
   * - 사용자 함수 → step (진입)
   * - 라이브러리 함수 → next (스킵)
   */
  private async executeNextStep(
    session: GdbSession,
    heapTracker: HeapTracker,
  ): Promise<StepResult> {
    // step into (함수 진입 시도)
    const result = await session.step();

    // malloc/free 브레이크포인트 히트 처리
    if (result.reason === 'breakpoint-hit' && result.frame) {
      const func = result.frame.func;

      if (func === 'malloc' || func === 'calloc' || func === 'realloc') {
        await heapTracker.onMallocHit(session, result.frame.line);
        // malloc에서 빠져나온 후 다음 스텝
        return session.next();
      }

      if (func === 'free') {
        await heapTracker.onFreeHit(session, result.frame.line);
        return session.next();
      }
    }

    // 라이브러리 함수에 진입한 경우 → finish로 빠져나옴
    if (result.frame && SKIP_FUNCTIONS.has(result.frame.func)) {
      try {
        return await session.finish();
      } catch {
        return result;
      }
    }

    return result;
  }

  /**
   * 현재 상태를 수집하고 Step 생성
   */
  private async collectAndBuildStep(
    session: GdbSession,
    heapTracker: HeapTracker,
    stepBuilder: StepBuilder,
    sourceLines: string[],
    steps: Step[],
  ): Promise<void> {
    // 상태 수집 (병렬 쿼리)
    const [locals, args, frames] = await Promise.all([
      session.getLocals(),
      session.getArgs(),
      session.getFrames(),
    ]);

    const currentFrame = frames[0];
    const line = currentFrame?.line ?? 0;
    const code = sourceLines[line - 1] ?? '';

    // 빈 줄 스텝 스킵 (공백만 있는 라인)
    if (code.trim() === '') {
      return;
    }

    // 변수 enrichment (주소, 바이트 데이터)
    const enrichedLocals = await this.enrichVariables(session, locals);
    const enrichedArgs = await this.enrichVariables(session, args);

    // 포인터 타겟 해석
    await this.resolvePointerTargets(session, [...enrichedLocals, ...enrichedArgs]);

    // 힙 블록 바이트 데이터 수집
    const heapBytes = await this.collectHeapBytes(session, heapTracker);

    // Step 생성
    const rawData: RawStepData = {
      line,
      code,
      frames,
      locals: enrichedLocals,
      args: enrichedArgs,
      heapBlocks: heapTracker.getActiveBlocks(),
      heapBytes,
      stdout: session.getStdout(),
    };

    const step = stepBuilder.buildStep(rawData);

    // 설명 생성
    const prevStep = steps.length > 0 ? steps[steps.length - 1] : null;
    step.explanation = generateExplanation(code, prevStep, step, step.events ?? []);

    steps.push(step);
  }

  // ============================================
  // 변수 enrichment
  // ============================================

  /**
   * GDB 변수에 주소, 크기, 바이트 데이터 추가
   */
  private async enrichVariables(
    session: GdbSession,
    vars: { name: string; type: string; value: string }[],
  ): Promise<EnrichedVariable[]> {
    const enriched: EnrichedVariable[] = [];

    for (const v of vars) {
      try {
        // 주소 가져오기
        const addrRaw = await session.evaluate(`(void*)&${v.name}`);
        const address = this.normalizeAddress(addrRaw);

        // 크기 계산
        const size = getTypeSize(v.type);

        // 바이트 데이터 읽기
        const bytes = await session.readMemory(address, size);

        enriched.push({
          ...v,
          address,
          size,
          bytes,
        });
      } catch {
        // 최적화로 사라진 변수 등
        enriched.push({
          ...v,
          address: '0x0',
          size: getTypeSize(v.type),
          bytes: [],
        });
      }
    }

    return enriched;
  }

  /**
   * 포인터 변수의 타겟 주소 해석
   */
  private async resolvePointerTargets(
    session: GdbSession,
    vars: EnrichedVariable[],
  ): Promise<void> {
    for (const v of vars) {
      if (v.type.includes('*') && v.value && v.value !== '0x0') {
        v.pointsTo = this.normalizeAddress(v.value);
      }
    }
  }

  /**
   * 활성 힙 블록의 바이트 데이터 수집
   */
  private async collectHeapBytes(
    session: GdbSession,
    heapTracker: HeapTracker,
  ): Promise<Map<string, { bytes: number[]; type: string }>> {
    const result = new Map<string, { bytes: number[]; type: string }>();

    for (const block of heapTracker.getActiveBlocks()) {
      try {
        // 최대 64바이트만 읽기 (성능)
        const readSize = Math.min(block.size, 64);
        const bytes = await session.readMemory(block.address, readSize);
        result.set(block.address, { bytes, type: block.type ?? 'void' });
      } catch {
        // 읽기 실패 시 빈 데이터
      }
    }

    return result;
  }

  // ============================================
  // 헬퍼
  // ============================================

  private isTerminated(result: StepResult): boolean {
    return result.reason === 'exited-normally'
      || result.reason === 'exited'
      || result.reason === 'exited-signalled';
  }

  private isUserCode(result: StepResult): boolean {
    if (!result.frame) return false;
    const file = result.frame.file ?? result.frame.fullname ?? '';
    return file.includes(USER_SOURCE_FILE);
  }

  private normalizeAddress(raw: string): string {
    const match = raw.match(/(0x[0-9a-fA-F]+)/);
    return match ? match[1] : raw;
  }
}
