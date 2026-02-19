/**
 * Shared Visualizers Module
 * 공통 시각화 컴포넌트 및 타입 export
 */

// 스타일
export {
  FLOW_THEMES,
  FLOW_SIZES,
  FLOW_ANIMATION,
  getBoxStyle,
  getArrowStyle,
  type FlowTheme,
} from './styles';

// 어댑터 타입
export type {
  BoxStyle,
  ArrowStyle,
  IFlowTransformer,
  IFlowStyler,
  IFlowAnimator,
  IFlowAdapter,
} from './adapters/types';

// 훅
export { useStepGestures, type UseStepGesturesOptions, type UseStepGesturesReturn } from './hooks/useStepGestures';
export { useLessonTerminal } from './hooks/useLessonTerminal';

// 컴포넌트
export { StepNavigationArrows } from './components/StepNavigationArrows';
export { CodeMirrorEditor, type CodeSelection } from './components/CodeMirrorEditor';
export {
  TerminalOutput,
  type TerminalLine,
  type TerminalLineType,
} from './components/TerminalOutput';
export { ReferenceGraphView } from './components/ReferenceGraphView';
export { TerminalStepView } from './components/TerminalStepView';

