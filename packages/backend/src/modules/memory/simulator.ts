/**
 * 교육용 C 메모리 시뮬레이터
 * - 플러그인 기반 핸들러 시스템
 * - 가상 메모리 주소
 * - 교육적 설명 포함
 */

import {
  registry,
  type SimContext,
  type Step,
  type MemoryBlock,
  type Variable,
  type HeapBlock,
} from './handlers';

class CSimulator implements SimContext {
  // 메모리 주소
  stackBase = 0x7fffffffde00;
  heapBase = 0x555555559000;
  stackOffset = 0;
  heapOffset = 0;

  // 저장소
  variables: Map<string, Variable> = new Map();
  heapBlocks: Map<string, HeapBlock> = new Map();

  // stdin
  stdinBuffer: string[] = [];
  stdinIndex = 0;

  /**
   * 코드 시뮬레이션 실행
   */
  simulate(
    code: string,
    stdin = ''
  ): { success: boolean; steps: Step[]; source_lines: string[]; message: string } {
    // stdin 파싱
    this.stdinBuffer = stdin
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);
    this.stdinIndex = 0;

    const lines = code.trim().split('\n');
    const steps: Step[] = [];
    let inMain = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // main 함수 진입 감지
      if (line.includes('int main') || line.includes('void main')) {
        inMain = true;
        continue;
      }

      if (!inMain) continue;

      const stripped = line.trim();
      if (!stripped || stripped === '{' || stripped === '}') continue;

      // return 처리
      if (stripped.startsWith('return')) {
        steps.push(this.createStep(i + 1, stripped, '프로그램 종료'));
        break;
      }

      // 주석 무시
      if (stripped.startsWith('//')) continue;

      // 핸들러에 위임
      const cleanCode = stripped.replace(/;$/, '').trim();
      const step = this.analyzeLine(i + 1, cleanCode);
      if (step) steps.push(step);
    }

    return { success: true, steps, source_lines: lines, message: '' };
  }

  /**
   * 한 줄 분석 - 핸들러에 위임
   */
  private analyzeLine(lineNum: number, code: string): Step | null {
    const handler = registry.findHandler(code);
    if (handler) {
      return handler.handle(this, lineNum, code);
    }
    return null;
  }

  // === SimContext 인터페이스 구현 ===

  toHex(n: number): string {
    return '0x' + n.toString(16);
  }

  intToBytes(value: number, size: number): number[] {
    const bytes: number[] = [];
    if (value < 0) {
      value = value >>> 0;
    }
    for (let i = 0; i < size; i++) {
      bytes.push((value >> (i * 8)) & 0xff);
    }
    return bytes;
  }

  allocateStack(size: number): number {
    const addr = this.stackBase - this.stackOffset;
    this.stackOffset += size;
    return addr;
  }

  allocateHeap(size: number): number {
    const addr = this.heapBase + this.heapOffset;
    this.heapOffset += size;
    return addr;
  }

  createStep(lineNum: number, code: string, explanation: string): Step {
    const stack: MemoryBlock[] = [];
    for (const [name, v] of this.variables) {
      stack.push({
        name,
        address: v.address,
        type: v.type,
        size: v.size,
        bytes: v.bytes,
        value: v.value,
        points_to: v.points_to || null,
        explanation: '',
      });
    }

    const heap: MemoryBlock[] = [];
    for (const [name, block] of this.heapBlocks) {
      heap.push({
        name: `*${name}`,
        address: block.address,
        type: block.type,
        size: block.size,
        bytes: block.bytes,
        value: block.value,
        points_to: null,
        explanation: '',
      });
    }

    return {
      line: lineNum,
      code,
      stack,
      heap,
      explanation,
      rsp: this.toHex(this.stackBase - this.stackOffset),
      rbp: this.toHex(this.stackBase),
    };
  }
}

/**
 * 코드 시뮬레이션 함수 (외부 API)
 */
export function simulateCode(
  code: string,
  stdin = ''
): {
  success: boolean;
  steps: Step[];
  source_lines: string[];
  error?: string;
  message?: string;
} {
  try {
    const sim = new CSimulator();
    return sim.simulate(code, stdin);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return {
      success: false,
      steps: [],
      source_lines: [],
      error: 'simulation_error',
      message,
    };
  }
}

// 타입 re-export
export type { Step, MemoryBlock } from './handlers';
