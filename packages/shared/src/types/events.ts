/**
 * Event-Driven Visualization Types
 *
 * WHY: Zod 스키마에서 타입 추론 (Single Source of Truth)
 * - 스키마 수정 → 타입 자동 동기화
 * - 런타임 검증 + 컴파일타임 타입 안전성
 */

// =============================================
// Zod 기반 타입 (schemas/events.ts에서 추론)
// =============================================

export type {
  // 값 타입
  VisualizationValue,

  // 이벤트 타입 (legacy 7)
  FrameEvent,
  VariableEvent,
  PointerEvent,
  HeapEvent,
  OutputEvent,
  WarningEvent,
  HighlightEvent,

  // 이벤트 타입 (new 3)
  ScopeEvent,
  ObjectEvent,
  BindingEvent,

  // 통합 이벤트
  VisualizationEvent,
  SimulatorEvent,
  StepEvents,

  // 프론트엔드 상태
  VisualizationFrame,
  VisualizationVariable,
  VisualizationHeapBlock,
  VisualizationState,
} from '../schemas/events';

// 변환 유틸리티
export { convertMemoryChangeToEvent } from '../schemas/events';
