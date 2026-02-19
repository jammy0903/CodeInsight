/**
 * LessonMemoryVisualizer - 통합 메모리 시각화 컴포넌트
 *
 * 모든 언어의 메모리 시각화를 단일 인터페이스로 제공
 *
 * 사용법:
 * <LessonMemoryVisualizer
 *   step={currentStep}
 *   language="java"
 *   memoryState={memoryState}
 *   changedBlocks={changedBlocks}
 * />
 */

import { memo, useMemo } from 'react';
import type { ComponentProps } from 'react';
import type { LessonStep } from '@codeinsight/shared';
import { JavaMemoryView } from '@/features/visualizers/java';
import { MemoryPanel } from '@/features/courses/components/memory/MemoryPanel';
import type { MemoryState, ChangedBlocksType, MemoryAdapter } from './shared/adapters/types';
import { CMemoryAdapter } from './c/adapters/CMemoryAdapter';
import { JavaMemoryAdapter } from './java/adapters/JavaMemoryAdapter';

function createMemoryAdapter(language: string): MemoryAdapter {
  const lang = language.toLowerCase();
  switch (lang) {
    case 'java':
      return new JavaMemoryAdapter();
    case 'c':
    case 'c++':
      return new CMemoryAdapter();
    default:
      return { transform: () => null };
  }
}

// ============================================
// 타입 정의
// ============================================

export interface LessonMemoryVisualizerProps {
  /** 현재 LessonStep */
  step: LessonStep;
  /** 이전 LessonStep (변경 감지용) */
  prevStep?: LessonStep | null;
  /** 언어 */
  language: string;
  /** 계산된 메모리 상태 (C 언어에서 필요) */
  memoryState?: MemoryState;
  /** 변경된 블록 (C 언어에서 필요) */
  changedBlocks?: ChangedBlocksType;
  /** 클래스명 */
  className?: string;
}

// ============================================
// 메인 컴포넌트
// ============================================

export const LessonMemoryVisualizer = memo(function LessonMemoryVisualizer({
  step,
  language,
  memoryState,
  changedBlocks,
  className = '',
}: LessonMemoryVisualizerProps) {
  // 어댑터로 변환
  const adapter = useMemo(() => createMemoryAdapter(language), [language]);
  const props = useMemo(
    () => adapter.transform(step, memoryState, changedBlocks),
    [adapter, step, memoryState, changedBlocks]
  );

  // props가 null이면 메모리 뷰 없음 (Python, JavaScript 등)
  if (!props) {
    return null;
  }

  // Java
  if (language.toLowerCase() === 'java') {
    return (
      <div className={className}>
        <JavaMemoryView {...(props as unknown as ComponentProps<typeof JavaMemoryView>)} />
      </div>
    );
  }

  // C
  if (language.toLowerCase() === 'c' || language.toLowerCase() === 'c++') {
    return (
      <div className={className}>
        <MemoryPanel {...(props as unknown as ComponentProps<typeof MemoryPanel>)} />
      </div>
    );
  }

  // 기타 언어는 메모리 뷰 없음
  return null;
});

export default LessonMemoryVisualizer;
