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

// 타입
export interface StackRegisters {
  /** Stack Pointer - 스택 최상단 */
  rsp?: string;
  /** Base Pointer - 현재 함수 프레임 시작 */
  rbp?: string;
}
