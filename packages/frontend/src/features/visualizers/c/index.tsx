/**
 * C Language Visualization Module
 *
 * Flow (변수/프레임/제어흐름) + Memory (Stack/Heap) 시각화
 */

// Flow Visualizer
export { FlowVisualizer } from './CFlowVisualizer';

// Flow Components
export { VariableBox, ArrowLayer, FunctionFrame, ControlFlowOverlay, LoopTrack } from './components';

// Flow Hooks
export { useAnimationQueue, useFlowDiff, calculateFlowDiff } from './hooks';

// C Adapters
export { cAdapter, createCAdapter, CTransformer, CStyler, CAnimator, CMemoryAdapter } from './adapters';

// Memory View
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
