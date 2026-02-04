/**
 * Pointer Graph Module
 *
 * C 언어 포인터 관계 시각화.
 * pointer 이벤트로 포인터 → 대상 주소 관계를 추적.
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { usePointerGraphStore } from './store';
import { PointerGraphView } from './PointerGraphView';

export const PointerGraphModule: VisualizationModule = {
  id: 'pointer-graph',
  name: 'Pointers',

  subscribes: ['pointer'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    usePointerGraphStore.getState().handleEvent(event);
  },

  render() {
    return <PointerGraphView />;
  },

  reset() {
    usePointerGraphStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'pointer') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
