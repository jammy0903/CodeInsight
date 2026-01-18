/**
 * C Memory Visualization Module
 * C 메모리 시각화 컴포넌트 및 상수
 *
 * 사용처:
 * - Playground: CMemoryView theme="dark"
 * - Lessons: CMemoryView theme="light"
 */

// 컴포넌트
export { CMemoryView } from './CMemoryView';
export { PointerArrow, PointerArrowOverlay } from './components/PointerArrow';

// Hooks
export { usePointerConnections } from './hooks/usePointerConnections';

// 타입
export type {
  MemoryBlock,
  StackRegisters,
  CMemoryViewProps,
  SegmentType,
} from './CMemoryView';

export type {
  PointerArrowProps,
  PointerArrowOverlayProps,
} from './components/PointerArrow';

export type {
  PointerConnection,
  UsePointerConnectionsResult,
} from './hooks/usePointerConnections';

// 상수
export { SEGMENT_COLORS, getPointerColor, POINTER_PALETTE } from './constants';
