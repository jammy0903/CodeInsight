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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasList(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function createMemoryAdapter(language: string): MemoryAdapter {
  const lang = language.toLowerCase();
  switch (lang) {
    case 'java':
      return new JavaMemoryAdapter();
    case 'c':
    case 'cpp':
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

  const stepRecord = step as Record<string, unknown>;
  const javaState = isRecord(stepRecord.javaMemoryState) ? stepRecord.javaMemoryState : undefined;
  const genericMemoryState = isRecord(stepRecord.memoryState) ? stepRecord.memoryState : undefined;
  const isComparisonOrOutputStep = (
    hasText(javaState?.comparison) ||
    hasText(genericMemoryState?.comparison) ||
    hasList(javaState?.output) ||
    hasList(genericMemoryState?.output) ||
    hasText(javaState?.warning) ||
    hasText(javaState?.note) ||
    hasText(stepRecord.stdout)
  );
  const emptyMessage = isComparisonOrOutputStep
    ? '이 단계는 비교/출력 중심이라 메모리 스냅샷을 생략했어요.'
    : undefined;

  // Java
  if (language.toLowerCase() === 'java') {
    return (
      <div className={className}>
        <JavaMemoryView
          {...(props as unknown as ComponentProps<typeof JavaMemoryView>)}
          emptyMessage={emptyMessage}
        />
      </div>
    );
  }

  // C
  if (language.toLowerCase() === 'c' || language.toLowerCase() === 'cpp' || language.toLowerCase() === 'c++') {
    return (
      <div className={className}>
        <MemoryPanel
          {...(props as unknown as ComponentProps<typeof MemoryPanel>)}
          emptyMessage={emptyMessage}
        />
      </div>
    );
  }

  // 기타 언어는 메모리 뷰 없음
  return null;
});

export default LessonMemoryVisualizer;
