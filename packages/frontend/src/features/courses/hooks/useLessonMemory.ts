/**
 * useLessonMemory - LessonStep.memoryChanges를 시각화용 형식으로 변환
 *
 * WHY: 통일된 스냅샷 형식(stack frames + heap objects)을 시각화 컴포넌트용으로 변환
 * 각 스텝의 memoryChanges는 해당 시점의 전체 메모리 상태를 나타냄
 */

import { useMemo } from 'react';
import type { LessonStep, StepMemoryState, StackFrame } from '@/types';

export interface LessonMemoryBlock {
  name: string;
  address: string;
  value: string;
  type?: string;
  points_to: string | null;
  highlight?: boolean;
}

export interface LessonMemoryState {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
  frames: StackFrame[];  // 원본 프레임 데이터
}

/**
 * 현재 스텝의 memoryChanges를 시각화용 형식으로 변환
 */
function convertToVisualFormat(
  changes: StepMemoryState | undefined
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  if (!changes) return state;

  // Stack frames 처리
  if (changes.stack) {
    state.frames = changes.stack;
    let stackAddr = 0x1000;

    for (const frame of changes.stack) {
      for (const v of frame.variables) {
        state.stack.push({
          name: `${frame.name}.${v.name}`,
          address: `0x${stackAddr.toString(16)}`,
          value: String(v.value ?? ''),
          type: v.type,
          points_to: v.ref || null,
          highlight: v.highlight,
        });
        stackAddr += 4;
      }
    }
  }

  // Heap objects 처리
  if (changes.heap && Array.isArray(changes.heap)) {
    let heapAddr = 0x8000;

    for (const h of changes.heap) {
      const displayValue = h.fields
        ? JSON.stringify(h.fields)
        : String(h.value ?? '');

      state.heap.push({
        name: h.id || h.address || `heap_${heapAddr.toString(16)}`,
        address: h.address || `0x${heapAddr.toString(16)}`,
        value: displayValue,
        type: h.type,
        points_to: null,
        highlight: h.highlight,
      });
      heapAddr += 16;
    }
  }

  return state;
}

/**
 * 현재 스텝에서 변경된 블록 이름 추출 (highlight된 것들)
 */
function getChangedBlockNames(changes: StepMemoryState | undefined): string[] {
  if (!changes) return [];

  const names: string[] = [];

  // Stack에서 highlight된 변수
  if (changes.stack) {
    for (const frame of changes.stack) {
      for (const v of frame.variables) {
        if (v.highlight) {
          names.push(`${frame.name}.${v.name}`);
        }
      }
    }
  }

  // Heap에서 highlight된 객체
  if (changes.heap && Array.isArray(changes.heap)) {
    for (const h of changes.heap) {
      if (h.highlight) {
        names.push(h.id || h.address || '');
      }
    }
  }

  return names;
}

export interface UseLessonMemoryReturn {
  memoryState: LessonMemoryState;
  changedBlocks: string[];
}

export function useLessonMemory(
  steps: LessonStep[],
  currentStepIndex: number
): UseLessonMemoryReturn {
  const memoryState = useMemo(() => {
    const currentStep = steps[currentStepIndex];
    return convertToVisualFormat(currentStep?.memoryChanges);
  }, [steps, currentStepIndex]);

  const changedBlocks = useMemo(() => {
    const currentStep = steps[currentStepIndex];
    return getChangedBlockNames(currentStep?.memoryChanges);
  }, [steps, currentStepIndex]);

  return { memoryState, changedBlocks };
}
