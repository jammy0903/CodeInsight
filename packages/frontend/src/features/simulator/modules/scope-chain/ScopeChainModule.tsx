/**
 * Scope Chain Module
 *
 * JavaScript 스코프 체인 시각화.
 * scope 이벤트로 중첩 스코프를 추적.
 * variable 이벤트로 스코프 내 변수를 표시.
 *
 * 핵심: "변수는 어떤 스코프에서 선언되었는가"
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useScopeChainStore } from './store';
import { ScopeChainView } from './ScopeChainView';

export const ScopeChainModule: VisualizationModule = {
  id: 'scope-chain',
  name: 'Scope Chain',

  subscribes: ['scope', 'variable'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    useScopeChainStore.getState().handleEvent(event);
  },

  render() {
    return <ScopeChainView />;
  },

  reset() {
    useScopeChainStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'scope' || event.type === 'variable') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
