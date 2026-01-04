/**
 * useLessonMemory - LessonStep.memoryChanges를 누적하여 현재 메모리 상태 계산
 *
 * WHY: useCourseMemory의 새 API 버전. StepMemoryState 형식 지원.
 * TRADEOFF: 별도 hook > 기존 수정 (레거시 호환성 + 타입 안전성)
 */

import { useMemo } from 'react';
import type { LessonStep, StepMemoryState } from '@/types';

export interface LessonMemoryBlock {
  name: string;
  address: string;
  value: string;
  points_to: string | null;
}

export interface LessonMemoryState {
  stack: LessonMemoryBlock[];
  heap: LessonMemoryBlock[];
}

/**
 * StepMemoryState를 현재 상태에 적용
 */
function applyMemoryState(
  state: LessonMemoryState,
  changes: StepMemoryState | undefined
): void {
  if (!changes) return;

  // Stack 변수 처리
  for (const v of changes.stack || []) {
    const existingIdx = state.stack.findIndex((b) => b.name === v.name);

    if (v.action === 'delete') {
      if (existingIdx !== -1) state.stack.splice(existingIdx, 1);
    } else if (v.action === 'update' && existingIdx !== -1) {
      state.stack[existingIdx].value = String(v.value ?? '');
    } else if (v.action === 'create' || existingIdx === -1) {
      state.stack.push({
        name: v.name,
        address: v.address || `0x${(0x1000 + state.stack.length * 4).toString(16)}`,
        value: String(v.value ?? ''),
        points_to: null,
      });
    }
  }

  // Heap 블록 처리
  for (const h of changes.heap || []) {
    const existingIdx = state.heap.findIndex((b) => b.name === h.id);

    if (h.action === 'delete') {
      if (existingIdx !== -1) state.heap.splice(existingIdx, 1);
    } else if (h.action === 'update' && existingIdx !== -1) {
      state.heap[existingIdx].value = String(h.value ?? '');
    } else if (h.action === 'create' || existingIdx === -1) {
      state.heap.push({
        name: h.id,
        address: h.address,
        value: String(h.value ?? ''),
        points_to: null,
      });
    }
  }

  // 포인터 연결 처리
  for (const p of changes.pointers || []) {
    const block = state.stack.find((b) => b.name === p.from) ||
                  state.heap.find((b) => b.name === p.from);
    if (block) {
      block.points_to = p.to;
    }
  }
}

/**
 * 0번 스텝부터 currentStepIndex까지 memoryChanges를 누적
 */
function buildMemoryState(
  steps: LessonStep[],
  currentStepIndex: number
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [] };

  for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
    applyMemoryState(state, steps[i].memoryChanges);
  }

  return state;
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
    return buildMemoryState(steps, currentStepIndex);
  }, [steps, currentStepIndex]);

  const changedBlocks = useMemo(() => {
    const changes = steps[currentStepIndex]?.memoryChanges;
    if (!changes) return [];

    const names: string[] = [];
    for (const v of changes.stack || []) names.push(v.name);
    for (const h of changes.heap || []) names.push(h.id);
    return names;
  }, [steps, currentStepIndex]);

  return { memoryState, changedBlocks };
}
