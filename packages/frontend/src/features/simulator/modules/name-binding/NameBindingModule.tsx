/**
 * Name Binding Module
 *
 * Python 이름 바인딩 시각화.
 * binding 이벤트로 이름 → 객체 참조를 관리.
 * 핵심: "변수는 이름표일 뿐, 값은 객체에 있다"
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useNameBindingStore } from './store';
import { NameBindingView } from './NameBindingView';

export const NameBindingModule: VisualizationModule = {
  id: 'name-binding',
  name: 'Names',

  subscribes: ['binding'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    useNameBindingStore.getState().handleEvent(event);
  },

  render() {
    return <NameBindingView />;
  },

  reset() {
    useNameBindingStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'binding') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
