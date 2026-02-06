/**
 * 힙 메모리 추적기
 *
 * malloc/free 브레이크포인트를 설정하여 동적 메모리 할당을 추적합니다.
 * GDB가 malloc/free에 멈출 때 인자와 반환값을 읽어 블록을 관리합니다.
 */

import type { GdbSession } from './gdb-session';
import type { TrackedHeapBlock } from './types';
import { logger } from '../../../../utils/logger';

export class HeapTracker {
  private blocks = new Map<string, TrackedHeapBlock>();
  private mallocBpNum: string | null = null;
  private freeBpNum: string | null = null;

  /**
   * GDB 세션에 malloc/free 브레이크포인트 설정
   */
  async setup(session: GdbSession): Promise<void> {
    try {
      const mallocBp = await session.setBreakpoint('malloc');
      if (mallocBp) {
        this.mallocBpNum = mallocBp.number;
      }

      const freeBp = await session.setBreakpoint('free');
      if (freeBp) {
        this.freeBpNum = freeBp.number;
      }
    } catch (err) {
      // malloc/free 심볼이 없는 경우 (정적 링크 등)
      logger.warn('HeapTracker: Could not set malloc/free breakpoints', err);
    }
  }

  /**
   * 브레이크포인트 번호로 malloc/free 히트인지 판별
   */
  isMallocBreakpoint(bpNum: string): boolean {
    return this.mallocBpNum !== null && bpNum === this.mallocBpNum;
  }

  isFreeBreakpoint(bpNum: string): boolean {
    return this.freeBpNum !== null && bpNum === this.freeBpNum;
  }

  /**
   * malloc 브레이크포인트 히트 처리
   *
   * 흐름:
   *  1. malloc에서 멈춤 → 인자($rdi = size) 기록
   *  2. finish로 malloc 완료까지 실행
   *  3. 반환값($rax = 할당된 주소) 기록
   */
  async onMallocHit(session: GdbSession, currentLine?: number): Promise<void> {
    try {
      // 1. malloc 인자 (크기) 가져오기 — x86-64 ABI: 첫째 인자 = $rdi
      const sizeStr = await session.evaluate('$rdi');
      const size = parseInt(sizeStr, 10) || 0;

      // 2. malloc 완료까지 실행
      await session.finish();

      // 3. 반환값 (할당된 주소) 가져오기 — x86-64 ABI: 반환값 = $rax
      const addrStr = await session.evaluate('(void*)$rax');
      const address = this.normalizeAddress(addrStr);

      if (address && address !== '0x0') {
        this.blocks.set(address, {
          address,
          size,
          allocLine: currentLine,
          freed: false,
        });
      }
    } catch (err) {
      logger.warn('HeapTracker: malloc tracking failed', err);
      // malloc 내부에 갇히지 않도록 finish 시도
      try { await session.finish(); } catch { /* ignore */ }
    }
  }

  /**
   * free 브레이크포인트 히트 처리
   *
   * 흐름:
   *  1. free에서 멈춤 → 인자($rdi = 주소) 기록
   *  2. finish로 free 완료까지 실행
   *  3. 블록을 freed 표시
   */
  async onFreeHit(session: GdbSession, currentLine?: number): Promise<void> {
    try {
      // 1. free 인자 (주소) 가져오기
      const addrStr = await session.evaluate('(void*)$rdi');
      const address = this.normalizeAddress(addrStr);

      // 2. free 완료까지 실행
      await session.finish();

      // 3. 블록 해제 표시
      if (address && this.blocks.has(address)) {
        const block = this.blocks.get(address)!;
        block.freed = true;
        block.freeLine = currentLine;
      }
    } catch (err) {
      logger.warn('HeapTracker: free tracking failed', err);
      try { await session.finish(); } catch { /* ignore */ }
    }
  }

  /**
   * 현재 활성 힙 블록 목록 (freed되지 않은 것)
   */
  getActiveBlocks(): TrackedHeapBlock[] {
    return [...this.blocks.values()].filter(b => !b.freed);
  }

  /**
   * 메모리 누수 블록 (프로그램 종료 시 freed되지 않은 것)
   */
  getLeakedBlocks(): TrackedHeapBlock[] {
    return this.getActiveBlocks();
  }

  /**
   * 전체 블록 (디버그용)
   */
  getAllBlocks(): TrackedHeapBlock[] {
    return [...this.blocks.values()];
  }

  /**
   * 주소 문자열 정규화
   * GDB가 반환하는 형식: "0x555555559260", "(void *) 0x555555559260" 등
   */
  private normalizeAddress(raw: string): string {
    const match = raw.match(/(0x[0-9a-fA-F]+)/);
    return match ? match[1] : raw;
  }
}
