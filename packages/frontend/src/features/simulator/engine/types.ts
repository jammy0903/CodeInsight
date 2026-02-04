/**
 * Simulator Engine Types
 *
 * 기존 @codeinsight/shared의 VisualizationEvent를 확장하여
 * Python/Java/JS 시각화에 필요한 이벤트 타입을 추가한다.
 *
 * 설계 원칙:
 * 1. 기존 이벤트 (frame, variable, pointer, heap, output, warning, highlight) 유지
 * 2. 새 이벤트 (scope, binding, object, gc, async) 추가
 * 3. 모든 이벤트는 하나의 atomic 변경을 표현
 * 4. 각 모듈은 자기가 구독하는 이벤트만 처리
 */

// 기존 + 신규 이벤트 재export (shared에서 가져옴)
export type {
  VisualizationEvent as LegacyEvent,
  FrameEvent,
  VariableEvent,
  PointerEvent,
  HeapEvent,
  OutputEvent,
  WarningEvent,
  HighlightEvent,
  VisualizationValue,
  ScopeEvent,
  ObjectEvent,
  BindingEvent,
} from '@codeinsight/shared';

/** GC 이벤트 (Java, JS, Python 가비지 컬렉션) */
export interface GCEvent {
  type: 'gc';
  action: 'refcount-inc' | 'refcount-dec' | 'mark' | 'sweep' | 'collect';
  objectId: string;
  refCount?: number;
  reachable?: boolean;
}

/** 비동기 이벤트 (JS 이벤트 루프) */
export interface AsyncEvent {
  type: 'async';
  action: 'enqueue-task' | 'enqueue-microtask' | 'dequeue' | 'await-start' | 'await-resume';
  callbackName: string;
  queue?: 'task' | 'microtask';
}

// ============================================
// 통합 이벤트 타입
// ============================================

import type { SimulatorEvent as SharedSimulatorEventType } from '@codeinsight/shared';

/** 확장된 시뮬레이터 이벤트 (shared 10종 + 로컬 GCEvent, AsyncEvent) */
export type SimulatorEvent =
  | SharedSimulatorEventType
  | GCEvent
  | AsyncEvent;

/** 이벤트 타입 문자열 리터럴 */
export type SimulatorEventType = SimulatorEvent['type'];

/** 정규화된 스텝 (백엔드 → 프론트엔드) */
export interface NormalizedStep {
  line: number;
  events: SimulatorEvent[];
  stdout?: string;
  explanation?: string;
}

// ============================================
// 언어 타입
// ============================================

export type Language = 'c' | 'python' | 'java' | 'javascript';
