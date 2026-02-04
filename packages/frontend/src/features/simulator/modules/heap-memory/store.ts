/**
 * Heap Memory Module - Internal Store
 *
 * 힙 메모리 블록을 관리한다.
 * heap 이벤트(allocate/free/write)를 처리하여 블록 목록 유지.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';
import type { MemoryBlock } from '../shared/types';

interface HeapMemoryState {
  blocks: MemoryBlock[];
  changedAddresses: Set<string>;

  /** heap 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 스냅샷 데이터 직접 로드 (Playground 호환) */
  setSnapshot: (blocks: MemoryBlock[]) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useHeapMemoryStore = create<HeapMemoryState>((set) => ({
  blocks: [],
  changedAddresses: new Set(),

  handleEvent: (event) => {
    if (event.type === 'heap') {
      set((state) => {
        const blocks = [...state.blocks];
        const changedAddresses = new Set(state.changedAddresses);

        if (event.action === 'allocate') {
          blocks.push({
            name: event.name || `malloc`,
            address: event.address,
            type: event.heapType || 'void*',
            value: event.value != null ? String(event.value) : '(uninitialized)',
            size: event.size,
            segment: 'heap',
          });
          changedAddresses.add(event.address);
        } else if (event.action === 'write') {
          const idx = blocks.findIndex((b) => b.address === event.address);
          if (idx !== -1) {
            blocks[idx] = {
              ...blocks[idx],
              value: event.value != null ? String(event.value) : blocks[idx].value,
            };
            changedAddresses.add(event.address);
          }
        } else if (event.action === 'free') {
          const idx = blocks.findIndex((b) => b.address === event.address);
          if (idx !== -1) {
            blocks.splice(idx, 1);
          }
          changedAddresses.delete(event.address);
        }

        return { blocks, changedAddresses };
      });
    }

    if (event.type === 'highlight' && event.target === 'heap') {
      set((state) => {
        const changedAddresses = new Set(state.changedAddresses);
        changedAddresses.add(event.name);
        return { changedAddresses };
      });
    }
  },

  setSnapshot: (blocks) => {
    set({ blocks, changedAddresses: new Set() });
  },

  reset: () => {
    set({ blocks: [], changedAddresses: new Set() });
  },
}));
