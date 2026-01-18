/**
 * useLessonVisualization - 레슨 시각화 상태 관리 Hook
 *
 * 리네임: useLessonMemory → useLessonVisualization
 * 이유: 메모리 외에 Event Loop, Closure 등 다양한 시각화 지원
 *
 * 지원 형식:
 * 1. Event-Driven: step.events 배열 → EventProcessor로 상태 구축 (권장)
 * 2. Snapshot: step.stack/heap 직접 사용 (Playground)
 * 3. MemoryChanges: memoryChanges 누적 계산 (레거시 Lesson JSON)
 * 4. JavaScript: visualizationType + visualizationState → 다양한 시각화
 */

import { useMemo } from 'react';
import type { LessonStep, StepMemoryState, StackFrame, MemoryChangeAction, MemoryBlock } from '@/types';
import type { JSVisualizationType, JSVisualizationState } from '@/features/visualizers/js/types';
import type { VisualizationEvent } from '@codeinsight/shared';
import { EventProcessor, convertToLessonMemoryState } from '@/features/visualizers/core';

// ============================================
// 메모리 상태 타입 (MemoryBlock 사용)
// ============================================

export interface LessonMemoryState {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  frames: StackFrame[];
}

// ============================================
// 통합 반환 타입
// ============================================

export interface UseLessonVisualizationReturn {
  // C 언어용 (메모리 시각화)
  memoryState: LessonMemoryState;
  changedBlocks: string[];

  // JavaScript용 (다양한 시각화)
  visualizationType: JSVisualizationType | 'memory' | null;
  visualizationState: JSVisualizationState | null;
}

// ============================================
// 기존 메모리 처리 로직 (C 언어)
// ============================================

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

function convertCumulativeFormat(
  frames: StackFrame[]
): { blocks: MemoryBlock[]; frames: StackFrame[] } {
  const blocks: MemoryBlock[] = [];
  // 스택은 높은 주소 → 낮은 주소로 자람
  // 먼저 전체 변수 개수를 세서 시작 주소 계산
  const totalVars = frames.reduce((sum, f) => sum + f.variables.length, 0);
  let stackAddr = 0x1000 + (totalVars - 1) * 4; // 첫 변수가 가장 높은 주소

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
      stackAddr -= 4; // 스택은 아래로 자람 (주소 감소)
    }
  }

  return { blocks, frames };
}

function convertToVisualFormat(
  changes: StepMemoryState | undefined
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  if (!changes) return state;

  if (changes.stack) {
    if (Array.isArray(changes.stack)) {
      const { blocks, frames } = convertCumulativeFormat(changes.stack);
      state.stack = blocks;
      state.frames = frames;
    }
  }

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

function accumulateMemoryChanges(
  steps: LessonStep[],
  upToStepIndex: number
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  const stackMap = new Map<string, MemoryBlock>();
  const heapMap = new Map<string, MemoryBlock>();
  const activeFrames: string[] = []; // 현재 활성화된 프레임 스택
  // 스택: 높은 주소 → 낮은 주소로 자람 (먼저 선언된 변수가 높은 주소)
  let stackAddr = 0x7ffc1000;
  let heapAddr = 0x8000;

  for (let i = 0; i <= upToStepIndex; i++) {
    const step = steps[i];
    if (!step?.memoryChanges || !Array.isArray(step.memoryChanges)) continue;

    for (const change of step.memoryChanges as MemoryChangeAction[]) {
      if (change.area === 'stack') {
        // 프레임 생성
        if (change.action === 'frame') {
          activeFrames.push(change.name);
          state.frames.push({ name: change.name, variables: [] });
        }
        // 변수 할당
        else if (change.action === 'allocate' || change.action === 'update') {
          // 프레임.변수명 형식으로 항상 저장 (함수별 구분)
          const frameName = change.frame || activeFrames[activeFrames.length - 1] || 'global';
          const fullName = `${frameName}.${change.name}`;
          const addr = change.address || `0x${stackAddr.toString(16)}`;

          stackMap.set(fullName, {
            name: fullName,
            address: addr,
            value: String(change.value ?? ''),
            type: change.type,
            points_to: null,
            highlight: i === upToStepIndex,
          });

          if (!change.address) stackAddr -= 4; // 스택은 아래로 자람
        }
        // 변수 해제 (free 또는 deallocate)
        else if (change.action === 'free' || change.action === 'deallocate') {
          const frameName = change.frame || activeFrames[activeFrames.length - 1] || 'global';
          const fullName = `${frameName}.${change.name}`;
          stackMap.delete(fullName);
        }
        // 프레임 종료
        else if (change.action === 'frame_end') {
          // 해당 프레임의 모든 변수 제거
          const frameName = change.name;
          for (const key of stackMap.keys()) {
            if (key.startsWith(`${frameName}.`)) {
              stackMap.delete(key);
            }
          }
          // 프레임 스택에서 제거
          const idx = activeFrames.indexOf(frameName);
          if (idx !== -1) activeFrames.splice(idx, 1);
          state.frames = state.frames.filter(f => f.name !== frameName);
        }
      } else if (change.area === 'heap') {
        if (change.action === 'allocate' || change.action === 'update') {
          const addr = change.address || `0x${heapAddr.toString(16)}`;
          heapMap.set(change.name, {
            name: change.name,
            address: addr,
            value: String(change.value ?? ''),
            type: change.type,
            points_to: null,
            highlight: i === upToStepIndex,
          });
          if (!change.address) heapAddr += 16;
        } else if (change.action === 'free' || change.action === 'deallocate') {
          heapMap.delete(change.name);
        }
      }
    }
  }

  state.stack = Array.from(stackMap.values());
  state.heap = Array.from(heapMap.values());
  return state;
}

function accumulateActionBasedChanges(
  steps: LessonStep[],
  upToStepIndex: number
): LessonMemoryState {
  const state: LessonMemoryState = { stack: [], heap: [], frames: [] };
  const stackMap = new Map<string, MemoryBlock>();
  const heapMap = new Map<string, MemoryBlock>();
  // 스택: 높은 주소 → 낮은 주소로 자람 (먼저 선언된 변수가 높은 주소)
  let stackAddr = 0x1000;
  let heapAddr = 0x8000;

  for (let i = 0; i <= upToStepIndex; i++) {
    const step = steps[i];
    const changes = step?.memoryChanges;
    if (!changes) continue;

    if (changes.stack && !Array.isArray(changes.stack)) {
      const stack = changes.stack as ActionBasedStackChange;

      if (stack.action === 'add_variable') {
        const addr = stack.address || `0x${stackAddr.toString(16)}`;
        stackMap.set(stack.name || 'unknown', {
          name: stack.name || 'unknown',
          address: addr,
          value: String(stack.value ?? '???'),
          type: stack.type,
          points_to: null,
          highlight: i === upToStepIndex,
        });
        stackAddr -= 4; // 스택은 아래로 자람
      } else if (stack.action === 'update_variable') {
        const existing = stackMap.get(stack.name || '');
        if (existing) {
          stackMap.set(stack.name || '', {
            ...existing,
            value: String(stack.newValue ?? stack.value ?? existing.value),
            highlight: i === upToStepIndex,
          });
        }
      } else if (stack.action === 'remove_variable') {
        stackMap.delete(stack.name || '');
      } else if (stack.action === 'destroy_frame') {
        if (stack.freed && Array.isArray(stack.freed)) {
          for (const name of stack.freed) {
            stackMap.delete(name);
          }
        }
      }
    }

    if (changes.heap && Array.isArray(changes.heap)) {
      for (const h of changes.heap) {
        const displayValue = h.fields
          ? JSON.stringify(h.fields)
          : String(h.value ?? '');
        const id = h.id || h.address || `heap_${heapAddr.toString(16)}`;
        heapMap.set(id, {
          name: id,
          address: h.address || `0x${heapAddr.toString(16)}`,
          value: displayValue,
          type: h.type,
          points_to: null,
          highlight: i === upToStepIndex,
        });
        heapAddr += 16;
      }
    }
  }

  state.stack = Array.from(stackMap.values());
  state.heap = Array.from(heapMap.values());
  return state;
}

function detectFormat(steps: LessonStep[]): 'event-based' | 'new-array' | 'legacy-action' | 'cumulative' | 'snapshot' | 'memoryState' | 'unknown' {
  // 0. Event-Driven 형식 체크 (step.events 배열이 있는 경우) - 최우선
  const eventStep = steps.find(s => s?.events && Array.isArray(s.events) && s.events.length > 0);
  if (eventStep) {
    return 'event-based';
  }

  // 1. snapshot 형식 체크 (step.stack이 MemoryBlock[] 배열인 경우)
  // Playground 시뮬레이터가 이 형식을 반환함
  const snapshotStep = steps.find(s => s?.stack && Array.isArray(s.stack));
  if (snapshotStep) {
    return 'snapshot';
  }

  // 2. memoryState 형식 체크 (step.memoryState.stack / heap)
  // Java, Python 등 일부 언어의 lesson이 이 형식 사용
  const memoryStateStep = steps.find(s => s?.memoryState);
  if (memoryStateStep) {
    return 'memoryState';
  }

  // 3. memoryChanges 기반 형식 체크 (Lesson JSON 데이터)
  const firstStep = steps.find(s => s?.memoryChanges);

  if (!firstStep?.memoryChanges) return 'unknown';

  const changes = firstStep.memoryChanges;

  if (Array.isArray(changes)) {
    return 'new-array';
  }

  if (changes.stack) {
    if (Array.isArray(changes.stack)) {
      return 'cumulative';
    } else if (typeof changes.stack === 'object') {
      return 'legacy-action';
    }
  }

  return 'unknown';
}

/**
 * Event-Driven 형식 처리
 * 각 스텝의 events 배열을 누적 적용하여 현재 상태 계산
 */
function processEventBasedSteps(
  steps: LessonStep[],
  upToStepIndex: number
): LessonMemoryState {
  const processor = new EventProcessor();

  // 각 스텝의 events 배열 수집
  const allStepEvents: VisualizationEvent[][] = steps.map(
    (step) => (step?.events as VisualizationEvent[]) || []
  );

  // 이벤트 적용하여 상태 구축
  const processedState = processor.applyEventsUpTo(allStepEvents, upToStepIndex);

  // 기존 형식으로 변환 (컴포넌트 호환성)
  return convertToLessonMemoryState(processedState);
}

// ============================================
// JavaScript 시각화 처리 로직
// ============================================

/**
 * 스텝에서 시각화 타입 감지
 */
function detectVisualizationType(step: LessonStep | undefined): JSVisualizationType | 'memory' | null {
  if (!step) return null;

  // 명시적 visualizationType 필드가 있으면 사용
  if (step.visualizationType) {
    return step.visualizationType as JSVisualizationType;
  }

  // 시각화 상태 필드로 타입 추론
  if (step.eventLoopState) return 'eventLoop';
  if (step.closureState) return 'closure';
  if (step.prototypeState) return 'prototype';
  if (step.thisBindState) return 'thisBind';
  if (step.hoistingState) return 'hoisting';
  if (step.callStackState) return 'callStack';
  if (step.scopeChainState) return 'scopeChain';

  // memoryChanges가 있으면 메모리 시각화
  if (step.memoryChanges) return 'memory';

  return null;
}

/**
 * 스텝에서 시각화 상태 추출
 */
function extractVisualizationState(step: LessonStep | undefined): JSVisualizationState | null {
  if (!step) return null;

  // 각 시각화 타입별 상태 추출
  if (step.eventLoopState) {
    return { type: 'eventLoop', data: step.eventLoopState };
  }
  if (step.closureState) {
    return { type: 'closure', data: step.closureState };
  }
  if (step.prototypeState) {
    return { type: 'prototype', data: step.prototypeState };
  }
  if (step.thisBindState) {
    return { type: 'thisBind', data: step.thisBindState };
  }
  if (step.hoistingState) {
    return { type: 'hoisting', data: step.hoistingState };
  }
  if (step.callStackState) {
    return { type: 'callStack', data: step.callStackState };
  }
  if (step.scopeChainState) {
    return { type: 'scopeChain', data: step.scopeChainState };
  }

  return null;
}

// ============================================
// 메인 Hook
// ============================================

export function useLessonVisualization(
  steps: LessonStep[],
  currentStepIndex: number
): UseLessonVisualizationReturn {
  const currentStep = steps[currentStepIndex];

  // 시각화 타입 감지
  const visualizationType = useMemo(
    () => detectVisualizationType(currentStep),
    [currentStep]
  );

  // JavaScript 시각화 상태
  const visualizationState = useMemo(
    () => extractVisualizationState(currentStep),
    [currentStep]
  );

  // C 메모리 시각화 상태
  const memoryState = useMemo(() => {
    // JavaScript 시각화가 있으면 메모리 상태 계산 스킵
    if (visualizationType && visualizationType !== 'memory') {
      return { stack: [], heap: [], frames: [] };
    }

    const format = detectFormat(steps);

    // DEBUG: 형식 감지 로그
    console.log('[useLessonVisualization] format:', format, 'steps:', steps.length, 'currentStepIndex:', currentStepIndex);
    if (currentStep) {
      console.log('[useLessonVisualization] currentStep.stack:', currentStep.stack);
    }

    switch (format) {
      case 'event-based':
        // Event-Driven: events 배열 처리 (권장)
        return processEventBasedSteps(steps, currentStepIndex);
      case 'snapshot':
        // Playground 시뮬레이터: step.stack/heap 직접 사용
        return {
          stack: (currentStep?.stack as MemoryBlock[]) || [],
          heap: (currentStep?.heap as MemoryBlock[]) || [],
          frames: [], // snapshot 형식엔 frames 정보 없음
        };
      case 'memoryState':
        // Java, Python 등: step.memoryState.stack/heap 형식
        // Transformer에서 직접 처리하도록 원본 형식 유지
        return {
          stack: (currentStep?.memoryState?.stack as any) || [],
          heap: (currentStep?.memoryState?.heap as any) || [],
          frames: [], // memoryState 형식엔 frames 정보 없음
        };
      case 'new-array':
        return accumulateMemoryChanges(steps, currentStepIndex);
      case 'legacy-action':
        return accumulateActionBasedChanges(steps, currentStepIndex);
      case 'cumulative':
        return convertToVisualFormat(currentStep?.memoryChanges);
      default:
        return { stack: [], heap: [], frames: [] };
    }
  }, [steps, currentStepIndex, visualizationType, currentStep]);

  // 변경된 블록 추출
  const changedBlocks = useMemo(() => {
    return memoryState.stack
      .concat(memoryState.heap)
      .filter((b) => b.highlight)
      .map((b) => b.name);
  }, [memoryState]);

  return {
    memoryState,
    changedBlocks,
    visualizationType,
    visualizationState,
  };
}

// ============================================
// 하위 호환성: useLessonMemory 별칭
// ============================================

/**
 * @deprecated useLessonVisualization을 사용하세요
 */
export function useLessonMemory(
  steps: LessonStep[],
  currentStepIndex: number
) {
  const result = useLessonVisualization(steps, currentStepIndex);
  return {
    memoryState: result.memoryState,
    changedBlocks: result.changedBlocks,
  };
}
