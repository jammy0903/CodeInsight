/**
 * StepBuilder — GDB 데이터를 기존 Step/MemoryBlock 포맷으로 변환
 *
 * 핵심 역할: GDB에서 추출한 원시 데이터를 프론트엔드가 기대하는
 * 기존 인터페이스(Step, MemoryBlock)로 변환합니다.
 * 프론트엔드는 전혀 변경할 필요가 없습니다.
 */

import type { Step, MemoryBlock } from '../runtime/types';
import type { EnrichedVariable, GdbFrame, TrackedHeapBlock } from './types';
import type { VisualizationEvent } from '@codeinsight/shared';
import { getTypeSize } from './constants';

/** StepBuilder에 전달되는 원시 데이터 */
export interface RawStepData {
  line: number;
  code: string;
  frames: GdbFrame[];
  locals: EnrichedVariable[];
  args: EnrichedVariable[];
  heapBlocks: TrackedHeapBlock[];
  heapBytes: Map<string, { bytes: number[]; type: string }>;
  stdout: string;
}

export class StepBuilder {
  private previousStep: Step | null = null;
  private previousVarMap = new Map<string, string>(); // name → value (이전 스텝)

  /**
   * GDB 데이터 → 기존 Step 포맷 변환
   */
  buildStep(raw: RawStepData): Step {
    const currentFrame = raw.frames[0];

    // 스택 변수 → MemoryBlock[]
    const stackBlocks = this.buildStackBlocks(raw.locals, raw.args, currentFrame);

    // 힙 블록 → MemoryBlock[]
    const heapBlocks = this.buildHeapBlocks(raw.heapBlocks, raw.heapBytes);

    // 이벤트 생성 (이전 스텝과 비교)
    const events = this.buildEvents(raw, stackBlocks, heapBlocks);

    // RSP/RBP (최상위 프레임 주소)
    const rsp = currentFrame?.addr ?? '0x0';

    const step: Step = {
      line: raw.line,
      code: raw.code,
      stack: stackBlocks,
      heap: heapBlocks,
      explanation: '', // ExplanationGenerator가 별도로 채움
      rsp,
      rbp: rsp, // GDB에서 별도 쿼리하지 않으면 같은 값 사용
      functionName: currentFrame?.func,
      callDepth: raw.frames.length,
      stdout: raw.stdout || undefined,
      events: events.length > 0 ? events : undefined,
    };

    // 다음 비교를 위해 현재 상태 저장
    this.updatePreviousState(stackBlocks);
    this.previousStep = step;

    return step;
  }

  /**
   * 메모리 누수 경고 스텝 생성
   */
  buildLeakWarningStep(leaks: TrackedHeapBlock[], lastStep: Step): Step {
    const events: VisualizationEvent[] = leaks.map(block => ({
      type: 'warning' as const,
      code: 'memory_leak' as const,
      message: `메모리 누수: ${block.address} (${block.size}바이트)가 해제되지 않았습니다.`,
      address: block.address,
    }));

    return {
      ...lastStep,
      explanation: `⚠️ 프로그램 종료 시 ${leaks.length}개의 메모리 블록이 해제되지 않았습니다.`,
      events,
    };
  }

  // ============================================
  // 스택 변수 변환
  // ============================================

  private buildStackBlocks(
    locals: EnrichedVariable[],
    args: EnrichedVariable[],
    frame?: GdbFrame,
  ): MemoryBlock[] {
    const allVars = [...args, ...locals];

    return allVars.map(v => this.variableToMemoryBlock(v, frame));
  }

  private variableToMemoryBlock(v: EnrichedVariable, frame?: GdbFrame): MemoryBlock {
    return {
      name: v.name,
      address: v.address,
      type: v.type,
      size: v.size || getTypeSize(v.type),
      bytes: v.bytes ?? [],
      value: this.formatValue(v.type, v.value),
      points_to: v.pointsTo ?? this.extractPointerTarget(v.type, v.value),
      explanation: '',
    };
  }

  // ============================================
  // 힙 블록 변환
  // ============================================

  private buildHeapBlocks(
    blocks: TrackedHeapBlock[],
    heapBytes: Map<string, { bytes: number[]; type: string }>,
  ): MemoryBlock[] {
    return blocks
      .filter(b => !b.freed)
      .map(block => {
        const data = heapBytes.get(block.address);
        return {
          name: `heap@${block.address}`,
          address: block.address,
          type: data?.type ?? `void[${block.size}]`,
          size: block.size,
          bytes: data?.bytes ?? [],
          value: this.formatHeapValue(block, data?.bytes),
          points_to: null,
          explanation: '',
        };
      });
  }

  // ============================================
  // 이벤트 생성 (상태 diff)
  // ============================================

  private buildEvents(
    raw: RawStepData,
    _stackBlocks: MemoryBlock[],
    _heapBlocks: MemoryBlock[],
  ): VisualizationEvent[] {
    const events: VisualizationEvent[] = [];
    const currentFrame = raw.frames[0];

    // 프레임 변경 감지
    if (this.previousStep && currentFrame) {
      const prevFunc = this.previousStep.functionName;
      const currFunc = currentFrame.func;

      if (prevFunc !== currFunc) {
        const prevDepth = this.previousStep.callDepth ?? 0;
        const currDepth = raw.frames.length;

        if (currDepth > prevDepth) {
          // 함수 진입
          events.push({
            type: 'frame',
            action: 'push',
            name: currFunc,
          });
        } else if (currDepth < prevDepth) {
          // 함수 복귀
          events.push({
            type: 'frame',
            action: 'pop',
            name: prevFunc ?? '',
          });
        }
      }
    }

    // 변수 변경 감지
    const allVars = [...raw.args, ...raw.locals];
    for (const v of allVars) {
      const key = `${currentFrame?.func ?? 'global'}.${v.name}`;
      const prevValue = this.previousVarMap.get(key);

      if (prevValue === undefined) {
        // 새 변수
        events.push({
          type: 'variable',
          action: 'declare',
          frame: currentFrame?.func ?? 'global',
          name: v.name,
          varType: v.type,
          value: this.parseNumericValue(v.value),
          address: v.address,
          size: v.size,
        });
      } else if (prevValue !== v.value) {
        // 값 변경
        events.push({
          type: 'variable',
          action: 'assign',
          frame: currentFrame?.func ?? 'global',
          name: v.name,
          value: this.parseNumericValue(v.value),
          previousValue: this.parseNumericValue(prevValue),
        });
      }
    }

    return events;
  }

  // ============================================
  // 헬퍼
  // ============================================

  /** GDB 값 포맷팅 */
  private formatValue(type: string, value: string): string {
    if (!value) return '?';

    // 포인터 타입: 주소 표시
    if (type.includes('*')) {
      return this.normalizeAddress(value);
    }

    // 문자형: 'A' (65) → "A"
    if (type === 'char' || type === 'signed char' || type === 'unsigned char') {
      const charMatch = value.match(/(\d+)\s+'(.*)'/);
      if (charMatch) return `'${charMatch[2]}'`;
      const numMatch = value.match(/^(\d+)$/);
      if (numMatch) {
        const code = parseInt(numMatch[1], 10);
        if (code >= 32 && code <= 126) return `'${String.fromCharCode(code)}'`;
      }
    }

    // 배열: {1, 2, 3}
    if (value.startsWith('{')) {
      return value;
    }

    return value;
  }

  /** 힙 블록 값 포맷팅 */
  private formatHeapValue(block: TrackedHeapBlock, bytes?: number[]): string {
    if (!bytes || bytes.length === 0) return `[${block.size} bytes]`;

    // 4바이트 이하면 int로 해석
    if (bytes.length <= 4) {
      let val = 0;
      for (let i = bytes.length - 1; i >= 0; i--) {
        val = (val << 8) | bytes[i];
      }
      return val.toString();
    }

    return `[${block.size} bytes]`;
  }

  /** 포인터 값에서 타겟 주소 추출 */
  private extractPointerTarget(type: string, value: string): string | null {
    if (!type.includes('*')) return null;
    const addr = this.normalizeAddress(value);
    if (addr === '0x0' || addr === '(nil)') return null;
    return addr;
  }

  /** 주소 정규화 */
  private normalizeAddress(raw: string): string {
    const match = raw.match(/(0x[0-9a-fA-F]+)/);
    return match ? match[1] : raw;
  }

  /** 값을 숫자 또는 문자열로 파싱 */
  private parseNumericValue(value: string): string | number {
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;
    return value;
  }

  /** 이전 상태 업데이트 */
  private updatePreviousState(stackBlocks: MemoryBlock[]): void {
    this.previousVarMap.clear();
    for (const block of stackBlocks) {
      this.previousVarMap.set(block.name, block.value);
    }
  }
}
