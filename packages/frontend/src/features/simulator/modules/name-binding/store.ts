/**
 * Name Binding Module - Internal Store
 *
 * Python 이름 바인딩을 관리한다.
 * binding 이벤트(bind/rebind/unbind)를 처리하여 이름 목록 유지.
 *
 * 핵심 개념: Python에서 변수는 "이름"이고, 값은 "객체".
 * 이름은 객체를 가리키는 참조(바인딩)일 뿐이다.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';

export interface NameBinding {
  name: string;
  scope: string;
  objectId: string;
  objectType: string;
  highlight: boolean;
}

interface NameBindingState {
  names: NameBinding[];

  /** binding 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 스냅샷 데이터 직접 로드 (pythonMemoryState.names 호환) */
  setSnapshot: (names: Array<{ name: string; scope?: string; pointsTo: string; highlight?: boolean }>) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useNameBindingStore = create<NameBindingState>((set) => ({
  names: [],

  handleEvent: (event) => {
    if (event.type !== 'binding') return;

    set((state) => {
      const names = [...state.names];

      if (event.action === 'bind') {
        // 기존 동일 이름+스코프 바인딩이 있으면 업데이트, 없으면 추가
        const idx = names.findIndex(
          (n) => n.name === event.name && n.scope === event.scope
        );
        const binding: NameBinding = {
          name: event.name,
          scope: event.scope,
          objectId: event.objectId,
          objectType: event.objectType,
          highlight: true,
        };

        if (idx !== -1) {
          names[idx] = binding;
        } else {
          names.push(binding);
        }
      } else if (event.action === 'rebind') {
        const idx = names.findIndex(
          (n) => n.name === event.name && n.scope === event.scope
        );
        if (idx !== -1) {
          names[idx] = {
            ...names[idx],
            objectId: event.objectId,
            objectType: event.objectType,
            highlight: true,
          };
        }
      } else if (event.action === 'unbind') {
        const idx = names.findIndex(
          (n) => n.name === event.name && n.scope === event.scope
        );
        if (idx !== -1) {
          names.splice(idx, 1);
        }
      }

      return { names };
    });
  },

  setSnapshot: (pyNames) => {
    set({
      names: pyNames.map((n) => ({
        name: n.name,
        scope: n.scope || 'global',
        objectId: n.pointsTo,
        objectType: '',
        highlight: n.highlight || false,
      })),
    });
  },

  reset: () => {
    set({ names: [] });
  },
}));
