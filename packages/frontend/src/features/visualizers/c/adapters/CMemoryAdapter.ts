/**
 * CMemoryAdapter
 *
 * LessonStep → MemoryPanel props 변환
 */

import type { LessonStep } from '@codeinsight/shared';
import type { MemoryAdapter, MemoryState, ChangedBlocksType } from '../../shared/adapters/types';

export class CMemoryAdapter implements MemoryAdapter {
  transform(
    _step: LessonStep,
    memoryState?: MemoryState,
    changedBlocks?: ChangedBlocksType
  ) {
    // MemoryPanel이 기대하는 props 구조로 변환
    return {
      stack: memoryState?.stack || [],
      heap: memoryState?.heap || [],
      changedBlocks: changedBlocks || { stack: [], heap: [] },
      frames: memoryState?.frames,
      showRegisters: true,
    };
  }
}
