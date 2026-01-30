/**
 * JavaMemoryAdapter
 *
 * LessonStep → JavaMemoryView props 변환
 */

import type { LessonStep } from '@codeinsight/shared';
import { toJavaMemoryViewProps } from '@/features/visualizers/java/adapters';
import type { MemoryAdapter, MemoryState, ChangedBlocksType } from './index';

export class JavaMemoryAdapter implements MemoryAdapter {
  transform(
    step: LessonStep,
    _memoryState?: MemoryState,
    _changedBlocks?: ChangedBlocksType
  ) {
    // 기존 toJavaMemoryViewProps 재사용
    return toJavaMemoryViewProps(step);
  }
}
