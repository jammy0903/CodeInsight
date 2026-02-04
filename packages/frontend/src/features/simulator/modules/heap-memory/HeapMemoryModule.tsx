/**
 * Heap Memory Module
 *
 * C 언어 힙 세그먼트 시각화.
 * heap 이벤트로 malloc/free 동적 할당 관리.
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useHeapMemoryStore } from './store';
import { HeapMemoryView } from './HeapMemoryView';

export const HeapMemoryModule: VisualizationModule = {
  id: 'heap-memory',
  name: 'Heap',

  subscribes: ['heap', 'highlight'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    useHeapMemoryStore.getState().handleEvent(event);
  },

  render() {
    return <HeapMemoryView />;
  },

  reset() {
    useHeapMemoryStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'heap' || event.type === 'highlight') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
