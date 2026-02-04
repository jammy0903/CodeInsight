/**
 * Scope Chain Module - Internal Store
 *
 * JavaScript 스코프 체인을 관리한다.
 * scope 이벤트(enter/exit)를 처리하여 중첩 스코프 스택을 유지.
 *
 * 핵심 개념: JS에서 변수 접근은 스코프 체인을 따라 올라간다.
 * global → function → block 순으로 중첩되며,
 * 클로저는 외부 스코프에 대한 참조를 유지한다.
 */

import { create } from 'zustand';
import type { SimulatorEvent } from '../../engine/types';

export type ScopeType = 'global' | 'function' | 'block' | 'module' | 'class';

export interface ScopeEntry {
  name: string;
  scopeType: ScopeType;
  parentScope?: string;
  /** 이 스코프에서 선언된 변수 목록 */
  variables: Array<{ name: string; value?: unknown }>;
  isActive: boolean;
}

interface ScopeChainState {
  scopes: ScopeEntry[];

  /** scope 이벤트 처리 */
  handleEvent: (event: SimulatorEvent) => void;

  /** 스냅샷 데이터 직접 로드 */
  setSnapshot: (scopes: ScopeEntry[]) => void;

  /** 상태 초기화 */
  reset: () => void;
}

export const useScopeChainStore = create<ScopeChainState>((set) => ({
  scopes: [],

  handleEvent: (event) => {
    if (event.type === 'scope') {
      set((state) => {
        if (event.action === 'enter') {
          // 기존 스코프 비활성화, 새 스코프 활성화
          const scopes = state.scopes.map((s) => ({ ...s, isActive: false }));
          scopes.push({
            name: event.name,
            scopeType: event.scopeType,
            parentScope: event.parentScope,
            variables: [],
            isActive: true,
          });
          return { scopes };
        }

        if (event.action === 'exit') {
          // LIFO: 해당 이름의 마지막 스코프 제거
          const lastIdx = state.scopes.findLastIndex((s) => s.name === event.name);
          if (lastIdx === -1) return state;

          const scopes = state.scopes.filter((_, i) => i !== lastIdx);
          // 마지막 스코프 활성화
          if (scopes.length > 0) {
            scopes[scopes.length - 1] = {
              ...scopes[scopes.length - 1],
              isActive: true,
            };
          }
          return { scopes };
        }

        return state;
      });
    }

    // variable 이벤트로 스코프 내 변수 추적 (optional)
    if (event.type === 'variable' && event.action === 'declare') {
      set((state) => {
        // 활성 스코프(마지막)에 변수 추가
        if (state.scopes.length === 0) return state;
        const scopes = [...state.scopes];
        const active = { ...scopes[scopes.length - 1] };
        active.variables = [
          ...active.variables,
          { name: event.name, value: event.value },
        ];
        scopes[scopes.length - 1] = active;
        return { scopes };
      });
    }
  },

  setSnapshot: (scopes) => {
    set({ scopes });
  },

  reset: () => {
    set({ scopes: [] });
  },
}));
