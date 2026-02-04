/**
 * Stack Frame Module - Internal Store
 *
 * 스택 프레임 내 변수들을 관리한다.
 * variable 이벤트(declare/assign/destroy)를 처리하여 블록 목록 유지.
 * highlight 이벤트로 변경 강조 표시.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';
import type { MemoryBlock, StackRegisters } from '../shared/types';

interface StackFrameState {
  blocks: MemoryBlock[];
  registers: StackRegisters;
  changedNames: Set<string>;

  /** variable 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 스냅샷 데이터 직접 로드 (Playground 호환) */
  setSnapshot: (blocks: MemoryBlock[], registers?: StackRegisters) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useStackFrameStore = create<StackFrameState>((set) => ({
  blocks: [],
  registers: {},
  changedNames: new Set(),

  handleEvent: (event) => {
    if (event.type === 'variable') {
      set((state) => {
        const blocks = [...state.blocks];
        const changedNames = new Set(state.changedNames);

        if (event.action === 'declare') {
          blocks.push({
            name: event.name,
            address: event.address || '0x???',
            type: event.varType || 'unknown',
            value: event.value != null ? String(event.value) : '?',
            size: event.size,
            segment: 'stack',
          });
          changedNames.add(event.name);
        } else if (event.action === 'assign') {
          const idx = blocks.findIndex(
            (b) => b.name === event.name
          );
          if (idx !== -1) {
            blocks[idx] = {
              ...blocks[idx],
              value: event.value != null ? String(event.value) : blocks[idx].value,
            };
            changedNames.add(event.name);
          }
        } else if (event.action === 'destroy') {
          const idx = blocks.findIndex(
            (b) => b.name === event.name
          );
          if (idx !== -1) {
            blocks.splice(idx, 1);
          }
          changedNames.delete(event.name);
        }

        return { blocks, changedNames };
      });
    }

    if (event.type === 'highlight' && event.target === 'variable') {
      set((state) => {
        const changedNames = new Set(state.changedNames);
        changedNames.add(event.name);
        return { changedNames };
      });
    }

    // pointer:assign 이벤트로 points_to 업데이트
    if (event.type === 'pointer' && event.action === 'assign') {
      set((state) => {
        const idx = state.blocks.findIndex((b) => b.name === event.pointer);
        if (idx === -1) return state;

        const blocks = [...state.blocks];
        blocks[idx] = {
          ...blocks[idx],
          points_to: event.targetAddress,
          value: event.targetAddress,
        };
        const changedNames = new Set(state.changedNames);
        changedNames.add(event.pointer);
        return { blocks, changedNames };
      });
    }
  },

  setSnapshot: (blocks, registers) => {
    set({
      blocks,
      registers: registers || {},
      changedNames: new Set(),
    });
  },

  reset: () => {
    set({ blocks: [], registers: {}, changedNames: new Set() });
  },
}));
