/**
 * Object Heap Module
 *
 * Python/Java/JS 힙 객체 시각화.
 * object 이벤트로 객체 생성/수정/삭제를 관리.
 *
 * 공유 모듈: 3개 언어 프로파일에서 참조.
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useObjectHeapStore } from './store';
import { ObjectHeapView } from './ObjectHeapView';

export const ObjectHeapModule: VisualizationModule = {
  id: 'object-heap',
  name: 'Objects',

  subscribes: ['object'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    useObjectHeapStore.getState().handleEvent(event);
  },

  render() {
    return <ObjectHeapView />;
  },

  reset() {
    useObjectHeapStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'object') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
