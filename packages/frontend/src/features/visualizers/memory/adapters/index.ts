/**
 * Memory Adapter Interface
 *
 * LessonStep을 언어별 메모리 시각화 컴포넌트 props로 변환
 */

import type { LessonStep } from '@codeinsight/shared';

export interface MemoryState {
  stack: Array<{ name: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  heap: Array<{ name?: string; type?: string; value: string; address?: string; points_to?: string | null }>;
  frames?: Array<{ name: string }>;
}

export interface ChangedBlocksType {
  stack: string[];
  heap: string[];
}

export interface MemoryAdapter {
  /**
   * LessonStep을 언어별 props로 변환
   */
  transform(
    step: LessonStep,
    memoryState?: MemoryState,
    changedBlocks?: ChangedBlocksType
  ): any;
}

import { JavaMemoryAdapter } from './JavaMemoryAdapter';
import { CMemoryAdapter } from './CMemoryAdapter';

export { JavaMemoryAdapter, CMemoryAdapter };

/**
 * 언어별 어댑터 팩토리
 */
export function createMemoryAdapter(language: string): MemoryAdapter {
  const lang = language.toLowerCase();

  switch (lang) {
    case 'java':
      return new JavaMemoryAdapter();
    case 'c':
    case 'c++':
      return new CMemoryAdapter();
    default:
      // 메모리 뷰가 없는 언어는 null을 반환하는 어댑터
      return {
        transform: () => null,
      };
  }
}
