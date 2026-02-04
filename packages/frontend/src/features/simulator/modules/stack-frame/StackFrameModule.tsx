/**
 * Stack Frame Module
 *
 * C 언어 스택 세그먼트 시각화.
 * variable 이벤트로 지역변수 관리, pointer 이벤트로 포인터 값 갱신.
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useStackFrameStore } from './store';
import { StackFrameView } from './StackFrameView';

export const StackFrameModule: VisualizationModule = {
  id: 'stack-frame',
  name: 'Stack',

  subscribes: ['variable', 'pointer', 'highlight'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    useStackFrameStore.getState().handleEvent(event);
  },

  render() {
    return <StackFrameView />;
  },

  reset() {
    useStackFrameStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'variable' || event.type === 'pointer' || event.type === 'highlight') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
