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

export interface UseLessonMemoryReturn {
  memoryState: LessonMemoryState;
  changedBlocks: string[];
}

/**
 * memoryChanges 배열을 누적해서 현재 스텝까지의 메모리 상태 계산
 */
function accumulateMemoryChanges(
  steps: LessonStep[],
  upToStepIndex: number
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  const stackMap = new Map<string, LessonMemoryBlock>();
  const heapMap = new Map<string, LessonMemoryBlock>();

  // 0번부터 현재 스텝까지 memoryChanges 누적
  for (let i = 0; i <= upToStepIndex; i++) {
    const step = steps[i];
    if (!step?.memoryChanges || !Array.isArray(step.memoryChanges)) continue;

    for (const change of step.memoryChanges) {
      if (change.area === 'stack') {
        if (change.action === 'allocate' || change.action === 'update') {
          stackMap.set(change.name, {
            name: change.name,
            address: change.address,
            value: String(change.value),
            type: change.type,
            points_to: null,
            highlight: i === upToStepIndex, // 현재 스텝에서 변경된 것만 하이라이트
          });
        } else if (change.action === 'free') {
          stackMap.delete(change.name);
        }
      } else if (change.area === 'heap') {
        if (change.action === 'allocate' || change.action === 'update') {
          heapMap.set(change.name, {
            name: change.name,
            address: change.address,
            value: String(change.value),
            type: change.type,
            points_to: null,
            highlight: i === upToStepIndex,
          });
        } else if (change.action === 'free') {
          heapMap.delete(change.name);
        }
      }
    }
  }

  state.stack = Array.from(stackMap.values());
  state.heap = Array.from(heapMap.values());

  return state;
}

export function useLessonMemory(
  steps: LessonStep[],
  currentStepIndex: number
): UseLessonMemoryReturn {
  const memoryState = useMemo(() => {
    // 새 형식: memoryChanges 배열을 누적
    if (steps[0]?.memoryChanges && Array.isArray(steps[0].memoryChanges)) {
      return accumulateMemoryChanges(steps, currentStepIndex);
    }
    // 레거시 형식: 기존 방식
    const currentStep = steps[currentStepIndex];
    return convertToVisualFormat(currentStep?.memoryChanges);
  }, [steps, currentStepIndex]);

  const changedBlocks = useMemo(() => {
    // 현재 스텝에서 변경된 블록만 추출
    return memoryState.stack
      .concat(memoryState.heap)
      .filter((b) => b.highlight)
      .map((b) => b.name);
  }, [memoryState]);

  return { memoryState, changedBlocks };
}
