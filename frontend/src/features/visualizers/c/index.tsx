/**
 * Memory Visualization Module
 * 메모리 시각화 컴포넌트 내보내기
 */

export { ProcessMemoryVisualization } from './ProcessMemoryVisualization';

// Components
export { ProcessMemoryView } from './components/ProcessMemoryView';
export { StackDetailView } from './components/StackDetailView';
export { HeapDetailView } from './components/HeapDetailView';
export { MemorySegment } from './components/MemorySegment';

// Hooks
export { useStepTransition } from './hooks/useStepTransition';

// Types
export type {
  Step,
  MemoryBlock,
  ViewMode,
  AnimationSpeed,
  SegmentType,
  MemorySegment as MemorySegmentType,
  AnimationState,
  PointerConnection,
} from './types';

// Utils
export {
  formatAddress,
  parseAddress,
  getChangedBlocks,
  isPointerType,
  sortBlocksByAddress,
  toBlockId,
} from './utils';

// Constants
export {
  ANIMATION_DURATION,
  SEGMENT_COLORS,
  REGISTER_COLORS,
  POINTER_COLORS,
  DEFAULT_CODE,
  getRoleLabel,
  SEGMENT_DESCRIPTIONS,
  PULSE_VARIANTS,
  ARROW_CONFIG,
  POINTER_PALETTE,
  getPointerColor,
} from './constants';
