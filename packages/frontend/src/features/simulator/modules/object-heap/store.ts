/**
 * Object Heap Module - Internal Store
 *
 * 힙 위의 객체를 관리한다.
 * object 이벤트(create/update/destroy)를 처리하여 객체 목록 유지.
 *
 * 공유 모듈: Python, Java, JavaScript에서 사용.
 * - Python: id() 기반 객체 (int1, list1 등)
 * - Java: 인스턴스 객체 (참조 타입)
 * - JS: 힙 객체 (Object, Array 등)
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';

export interface HeapObject {
  id: string;
  type: string;
  value: unknown;
  mutable?: boolean;
  highlight: boolean;
}

interface ObjectHeapState {
  objects: HeapObject[];

  /** object 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 스냅샷 데이터 직접 로드 (pythonMemoryState.objects 호환) */
  setSnapshot: (objects: Array<{
    id: string;
    type: string;
    value: unknown;
    mutable?: boolean;
    highlight?: boolean;
  }>) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useObjectHeapStore = create<ObjectHeapState>((set) => ({
  objects: [],

  handleEvent: (event) => {
    if (event.type !== 'object') return;

    set((state) => {
      const objects = [...state.objects];

      if (event.action === 'create') {
        // 중복 방지: 같은 ID 객체가 이미 있으면 업데이트
        const idx = objects.findIndex((o) => o.id === event.objectId);
        const obj: HeapObject = {
          id: event.objectId,
          type: event.className || 'object',
          value: event.properties ?? null,
          highlight: true,
        };

        if (idx !== -1) {
          objects[idx] = obj;
        } else {
          objects.push(obj);
        }
      } else if (event.action === 'update') {
        const idx = objects.findIndex((o) => o.id === event.objectId);
        if (idx !== -1) {
          objects[idx] = {
            ...objects[idx],
            value: event.properties ?? objects[idx].value,
            highlight: true,
          };
        }
      } else if (event.action === 'destroy') {
        const idx = objects.findIndex((o) => o.id === event.objectId);
        if (idx !== -1) {
          objects.splice(idx, 1);
        }
      } else if (event.action === 'access') {
        const idx = objects.findIndex((o) => o.id === event.objectId);
        if (idx !== -1) {
          objects[idx] = { ...objects[idx], highlight: true };
        }
      }

      return { objects };
    });
  },

  setSnapshot: (pyObjects) => {
    set({
      objects: pyObjects.map((o) => ({
        id: o.id,
        type: o.type,
        value: o.value,
        mutable: o.mutable,
        highlight: o.highlight || false,
      })),
    });
  },

  reset: () => {
    set({ objects: [] });
  },
}));
