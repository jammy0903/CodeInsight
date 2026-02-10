/**
 * Flow Visualizer Module
 *
 * "코드가 살아 움직이는 시각화"
 *
 * 사용법:
 * ```tsx
 * import { FlowVisualizer } from '@/features/visualizers/flow';
 *
 * <FlowVisualizer
 *   step={currentFlowStep}
 *   prevStep={previousFlowStep}
 *   theme="light"
 *   onVariableClick={(v) => console.log(v)}
 * />
 * ```
 */

// Main Components
export { FlowVisualizer } from './FlowVisualizer';
export { LessonFlowVisualizer } from './LessonFlowVisualizer';

// Hooks
export { useAnimationQueue } from './hooks/useAnimationQueue';
export { useFlowDiff, calculateFlowDiff, useFlowDiffStatus } from './hooks/useFlowDiff';

// Components
export { VariableBox } from './components/VariableBox';
export { ArrowLayer } from './components/ArrowLayer';
export { FunctionFrame } from './components/FunctionFrame';
export { ControlFlowOverlay } from './components/ControlFlowOverlay';
export { LoopTrack } from './components/LoopTrack';
// Adapters
export {
  getAdapter,
  createAdapter,
  getSupportedLanguages,
  isLanguageSupported,
  cAdapter,
  createCAdapter,
} from './adapters';
export type { IFlowAdapter, IFlowTransformer, IFlowStyler, IFlowAnimator } from './adapters';

// Styles
export {
  FLOW_THEMES,
  FLOW_SIZES,
  FLOW_ANIMATION,
  getBoxStyle,
  getFrameStyle,
  getArrowStyle,
  type FlowTheme,
} from './styles';

// Re-export types from shared for convenience
export type {
  FlowStep,
  FlowVariable,
  FlowVariableState,
  FlowAnimation,
  FlowAnimationType,
  FlowDiff,
  FlowFrame,
  FlowValue,
  FlowLanguage,
  ControlFlow,
  ControlFlowType,
  TerminalOutput,
  Position,
} from '@codeinsight/shared';
