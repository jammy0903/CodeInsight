/**
 * Pointer Graph Module - Internal Store
 *
 * 포인터 관계를 추적한다.
 * pointer 이벤트(assign/deref_read/deref_write)를 처리하여
 * 포인터 → 대상 관계를 유지.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';

export interface PointerRelation {
  /** 포인터 변수명 */
  source: string;
  /** 포인터가 속한 프레임 */
  sourceFrame?: string;
  /** 가리키는 주소 */
  targetAddress: string;
  /** 타겟 변수명 (알려진 경우) */
  targetName?: string;
  /** 타겟이 속한 프레임 */
  targetFrame?: string;
  /** 포인터 타입 */
  pointerType: 'single' | 'double' | 'function';
  /** 최근 역참조된 포인터 */
  recentlyDereferenced: boolean;
}

interface PointerGraphState {
  relations: PointerRelation[];

  /** pointer 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const usePointerGraphStore = create<PointerGraphState>((set) => ({
  relations: [],

  handleEvent: (event) => {
    if (event.type !== 'pointer') return;

    set((state) => {
      // 새 이벤트마다 이전 deref 플래그 클리어
      const relations = state.relations.map((r) =>
        r.recentlyDereferenced ? { ...r, recentlyDereferenced: false } : r
      );

      if (event.action === 'assign') {
        // 기존 관계 업데이트 또는 새 관계 생성
        const idx = relations.findIndex((r) => r.source === event.pointer);
        const relation: PointerRelation = {
          source: event.pointer,
          sourceFrame: event.frame,
          targetAddress: event.targetAddress,
          targetName: event.targetName,
          targetFrame: event.targetFrame,
          pointerType: 'single',
          recentlyDereferenced: false,
        };

        if (idx !== -1) {
          relations[idx] = relation;
        } else {
          relations.push(relation);
        }
      } else if (event.action === 'deref_read' || event.action === 'deref_write') {
        // 역참조 표시
        const idx = relations.findIndex((r) => r.source === event.pointer);
        if (idx !== -1) {
          relations[idx] = {
            ...relations[idx],
            recentlyDereferenced: true,
          };
        }
      }

      return { relations };
    });
  },

  reset: () => {
    set({ relations: [] });
  },
}));
