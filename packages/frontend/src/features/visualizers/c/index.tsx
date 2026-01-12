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

// 타입
export type {
  MemoryBlock,
  StackRegisters,
  CMemoryViewProps,
  SegmentType,
} from './CMemoryView';

// 상수
export { SEGMENT_COLORS, getPointerColor, POINTER_PALETTE } from './constants';
