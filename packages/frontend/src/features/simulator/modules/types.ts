/**
 * Visualization Module Interface
 *
 * 모든 시각화 모듈이 구현해야 하는 인터페이스.
 *
 * 규칙:
 * - 모듈은 EventBus를 통해서만 이벤트를 수신한다
 * - 모듈 안에서 if (lang === 'c') 분기 금지
 * - 모듈 간 직접 참조 금지
 * - 각 모듈은 자체 Zustand 스토어로 상태 관리
 */

import type { ReactNode } from 'react';
import type { SimulatorEvent, SimulatorEventType, Language } from '../engine/types';
import type { ModuleConfig } from '../profiles/types';

export interface VisualizationModule {
  /** 고유 식별자 (프로파일에서 참조) */
  id: string;

  /** 표시 이름 (UI 헤더) */
  name: string;

  /** 이 모듈이 구독하는 이벤트 타입 목록 */
  subscribes: SimulatorEventType[];

  /** 현재 언어에 맞게 초기화 */
  init(config: ModuleConfig, lang: Language): void;

  /** 이벤트 수신 → 내부 상태 업데이트 */
  onEvent(event: SimulatorEvent): void;

  /** React 컴포넌트 렌더링 */
  render(): ReactNode;

  /** 상태 초기화 (스텝 이동 시 0부터 재생 전 호출) */
  reset(): void;

  /** 특정 스텝까지 이벤트 재생 */
  replayTo(allEvents: SimulatorEvent[][], stepIndex: number): void;

  /** 정리 (언어 변경 시 호출) */
  destroy(): void;
}
