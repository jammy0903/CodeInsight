/**
 * useCourseMemory - CourseStep.memoryChanges를 누적하여 현재 메모리 상태 계산
 *
 * WHY: CourseStep.memoryChanges는 delta(변화)만 기록.
 *      시각화를 위해 현재까지의 전체 상태가 필요함.
 * TRADEOFF: 매 스텝마다 처음부터 누적 계산 (O(n)) vs 복잡한 캐싱.
 *           스텝 수가 적으므로 (보통 3-5개) 단순한 방식 선택.
 * REVISIT: 스텝 수가 많아지면 useMemo 의존성 최적화 필요.
 */

import { useMemo } from 'react';
import type { CourseStep, MemoryChange } from '@/types/course';

export interface CourseMemoryBlock {
  name: string;
  address: string;
  value: string;
  points_to: string | null;
}

export interface CourseMemoryState {
  stack: CourseMemoryBlock[];
  heap: CourseMemoryBlock[];
}

/**
 * 주소 생성 (실제 주소가 없을 때 사용)
 */
function generateAddress(index: number, type: 'stack' | 'heap'): string {
  const base = type === 'stack' ? 0x1000 : 0x2000;
  return `0x${(base + index * 4).toString(16)}`;
}

/**
 * MemoryChange를 현재 상태에 적용
 */
function applyChange(state: CourseMemoryState, change: MemoryChange): void {
  const target = change.type === 'stack' ? state.stack : state.heap;
  const existingIdx = target.findIndex((b) => b.name === change.name);

  switch (change.action) {
    case 'create':
      if (existingIdx === -1) {
        target.push({
          name: change.name,
          address: change.address ?? generateAddress(target.length, change.type),
          value: String(change.value ?? ''),
          points_to: change.pointsTo ?? null,
        });
      }
      break;

    case 'update':
      if (existingIdx !== -1) {
        target[existingIdx].value = String(change.value ?? target[existingIdx].value);
        if (change.pointsTo !== undefined) {
          target[existingIdx].points_to = change.pointsTo;
        }
      }
      break;

    case 'delete':
      if (existingIdx !== -1) {
        target.splice(existingIdx, 1);
      }
      break;
  }
}

/**
 * 0번 스텝부터 currentStepIndex까지 memoryChanges를 누적
 */
function buildMemoryState(
  steps: CourseStep[],
  currentStepIndex: number
): CourseMemoryState {
  const state: CourseMemoryState = { stack: [], heap: [] };

  for (let i = 0; i <= currentStepIndex && i < steps.length; i++) {
    const changes = steps[i].memoryChanges ?? [];
    for (const change of changes) {
      applyChange(state, change);
    }
  }

  return state;
}

export interface UseCourseMemoryReturn {
  memoryState: CourseMemoryState;
  changedBlocks: string[]; // 현재 스텝에서 변경된 블록 이름
}

export function useCourseMemory(
  steps: CourseStep[],
  currentStepIndex: number
): UseCourseMemoryReturn {
  const memoryState = useMemo(() => {
    return buildMemoryState(steps, currentStepIndex);
  }, [steps, currentStepIndex]);

  const changedBlocks = useMemo(() => {
    const currentChanges = steps[currentStepIndex]?.memoryChanges ?? [];
    return currentChanges.map((c) => c.name);
  }, [steps, currentStepIndex]);

  return { memoryState, changedBlocks };
}
