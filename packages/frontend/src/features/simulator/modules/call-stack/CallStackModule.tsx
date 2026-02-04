/**
 * Call Stack Module
 *
 * 4개 언어 공통 — 유일한 진짜 "공통" 모듈.
 * frame 이벤트(push/pop)와 variable 이벤트(declare/assign/destroy)를 구독.
 *
 * frame → 프레임 생성/소멸
 * variable → 프레임 내 변수 표시 (선택적, 교육용)
 */

import type { VisualizationModule } from '../types';
import type { SimulatorEvent, SimulatorEventType, Language } from '../../engine/types';
import type { ModuleConfig } from '../../profiles/types';
import { useCallStackModuleStore } from './store';
import { CallStackModuleView } from './CallStackView';

export const CallStackModule: VisualizationModule = {
  id: 'call-stack',
  name: 'Call Stack',

  subscribes: ['frame', 'variable'] as SimulatorEventType[],

  init(_config: ModuleConfig, _lang: Language) {
    this.reset();
  },

  onEvent(event: SimulatorEvent) {
    const store = useCallStackModuleStore.getState();

    if (event.type === 'frame') {
      store.handleEvent(event);
    } else if (event.type === 'variable') {
      store.handleVariableEvent(event);
    }
  },

  render() {
    return <CallStackModuleView />;
  },

  reset() {
    useCallStackModuleStore.getState().reset();
  },

  replayTo(allEvents: SimulatorEvent[][], stepIndex: number) {
    this.reset();
    for (let i = 0; i <= stepIndex && i < allEvents.length; i++) {
      const stepEvents = allEvents[i];
      if (!stepEvents) continue;
      for (const event of stepEvents) {
        if (event.type === 'frame' || event.type === 'variable') {
          this.onEvent(event);
        }
      }
    }
  },

  destroy() {
    this.reset();
  },
};
