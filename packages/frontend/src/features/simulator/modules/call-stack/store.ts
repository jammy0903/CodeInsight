/**
 * Call Stack Module - Internal Store
 *
 * 콜스택 모듈의 자체 상태.
 * frame 이벤트(push/pop)를 처리하여 프레임 목록을 관리한다.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';

export interface CallStackFrame {
  id: string;
  name: string;
  line?: number;
  variables: Array<{ name: string; value: unknown; type?: string }>;
  isActive: boolean;
}

interface CallStackModuleState {
  frames: CallStackFrame[];
  frameCounter: number;

  /** frame 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** variable 이벤트 처리 (프레임 내 변수 표시용) */
  handleVariableEvent: (event: SimulatorEvent) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useCallStackModuleStore = create<CallStackModuleState>((set, get) => ({
  frames: [],
  frameCounter: 0,

  handleEvent: (event) => {
    if (event.type !== 'frame') return;

    set((state) => {
      if (event.action === 'push') {
        const nextCounter = state.frameCounter + 1;
        const newFrame: CallStackFrame = {
          id: `frame-${nextCounter}`,
          name: event.name,
          variables: [],
          isActive: true,
        };
        // 기존 프레임 비활성화, 새 프레임 활성화
        return {
          frameCounter: nextCounter,
          frames: [
            ...state.frames.map(f => ({ ...f, isActive: false })),
            newFrame,
          ],
        };
      }

      if (event.action === 'pop') {
        // LIFO: 가장 위(마지막)에서 해당 이름의 프레임을 찾아 제거
        // 재귀 호출 시 같은 이름 프레임이 여러 개 있으므로 마지막 것만 제거
        const lastIdx = state.frames.findLastIndex(f => f.name === event.name);
        if (lastIdx === -1) return state;

        const newFrames = state.frames.filter((_, i) => i !== lastIdx);
        // 마지막 프레임을 활성화
        if (newFrames.length > 0) {
          newFrames[newFrames.length - 1] = {
            ...newFrames[newFrames.length - 1],
            isActive: true,
          };
        }
        return { frames: newFrames };
      }

      return state;
    });
  },

  handleVariableEvent: (event) => {
    if (event.type !== 'variable') return;

    set((state) => {
      // 재귀 시 같은 이름 프레임 여러 개 → 가장 최근(마지막) 프레임에 변수 배치
      const frameIndex = state.frames.findLastIndex(f => f.name === event.frame);
      if (frameIndex === -1) return state;

      const frames = [...state.frames];
      const frame = { ...frames[frameIndex] };
      const variables = [...frame.variables];

      if (event.action === 'declare') {
        variables.push({
          name: event.name,
          value: event.value ?? undefined,
          type: event.varType ?? 'unknown',
        });
      } else if (event.action === 'assign') {
        const varIdx = variables.findIndex(v => v.name === event.name);
        if (varIdx !== -1) {
          variables[varIdx] = { ...variables[varIdx], value: event.value };
        }
      } else if (event.action === 'destroy') {
        const varIdx = variables.findIndex(v => v.name === event.name);
        if (varIdx !== -1) {
          variables.splice(varIdx, 1);
        }
      }

      frame.variables = variables;
      frames[frameIndex] = frame;
      return { frames };
    });
  },

  reset: () => {
    set({ frames: [], frameCounter: 0 });
  },
}));
