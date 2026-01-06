/**
 * useLessonMemory - LessonStep.memoryChanges를 시각화용 형식으로 변환
 *
 * 두 가지 형식 지원:
 * 1. 누적 형식: stack: [{ name: 'main', variables: [...] }]
 * 2. 액션 형식: stack: { action: 'add_variable', name: 'a', ... }
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
  frames: StackFrame[];
}

// 액션 기반 memoryChanges 형식 (seed 데이터)
interface ActionBasedStackChange {
  action: string;
  name?: string;
  frame?: string;
  type?: string;
  size?: number;
  value?: string | number;
  address?: string;
  oldValue?: string | number;
  newValue?: string | number;
  scope?: string;
  reason?: string;
  freed?: string[];
}

/**
 * 액션 기반 형식을 시각화용으로 변환
 */
function convertActionBasedFormat(
  stack: ActionBasedStackChange | undefined
): LessonMemoryBlock[] {
  if (!stack) return [];

  const blocks: LessonMemoryBlock[] = [];

  // add_variable, update_variable 액션 처리
  if (stack.action === 'add_variable' || stack.action === 'update_variable') {
    blocks.push({
      name: stack.name || 'unknown',
      address: stack.address || '0x????',
      value: String(stack.value ?? stack.newValue ?? ''),
      type: stack.type,
      points_to: null,
      highlight: true,
    });
  }

  return blocks;
}

/**
 * 누적 형식(StackFrame[])을 시각화용으로 변환
 */
function convertCumulativeFormat(
  frames: StackFrame[]
): { blocks: LessonMemoryBlock[]; frames: StackFrame[] } {
  const blocks: LessonMemoryBlock[] = [];
  let stackAddr = 0x1000;

  for (const frame of frames) {
    for (const v of frame.variables) {
      blocks.push({
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

  return { blocks, frames };
}

/**
 * 현재 스텝의 memoryChanges를 시각화용 형식으로 변환
 */
function convertToVisualFormat(
  changes: StepMemoryState | undefined
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  if (!changes) return state;

  // Stack 처리 - 배열인지 객체인지 확인
  if (changes.stack) {
    if (Array.isArray(changes.stack)) {
      // 누적 형식: [{ name: 'main', variables: [...] }]
      const { blocks, frames } = convertCumulativeFormat(changes.stack);
      state.stack = blocks;
      state.frames = frames;
    } else if (typeof changes.stack === 'object') {
      // 액션 형식: { action: 'add_variable', ... }
      state.stack = convertActionBasedFormat(changes.stack as ActionBasedStackChange);
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
 * 현재 스텝에서 변경된 블록 이름 추출
 */
function getChangedBlockNames(changes: StepMemoryState | undefined): string[] {
  if (!changes) return [];

  const names: string[] = [];

  if (changes.stack) {
    if (Array.isArray(changes.stack)) {
      // 누적 형식
      for (const frame of changes.stack) {
        for (const v of frame.variables) {
          if (v.highlight) {
            names.push(`${frame.name}.${v.name}`);
          }
        }
      }
    } else if (typeof changes.stack === 'object') {
      // 액션 형식 - 액션이 있으면 해당 변수가 변경된 것
      const stack = changes.stack as ActionBasedStackChange;
      if (stack.name && (stack.action === 'add_variable' || stack.action === 'update_variable')) {
        names.push(stack.name);
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
