/**
 * Java Visualizer
 *
 * 구성:
 * - JavaMemoryView: Stack/Heap 메모리 시각화 (호버 애니메이션)
 * - JavaMessagesView: 다형성 시각화 (향후 기능)
 * - Flow: LessonFlowVisualizer + JavaTransformer 사용
 */

// 메모리 시각화 (Stack/Heap)
export { JavaMemoryView } from './JavaMemoryView';
export type {
  JavaVariable,
  JavaStackFrame,
  JavaHeapObject,
  JavaMemoryViewProps,
} from './JavaMemoryView';

// 어댑터 (시뮬레이터 데이터 → 뷰 props 변환)
export { toJavaMemoryViewProps } from './adapters';

// 다형성 시각화 (향후 기능)
export { JavaMessagesView } from './JavaMessagesView';

// JavaMessagesView에서 사용하는 타입만 export
export type {
  JavaMessageEvent,
  PolymorphismInfo,
  RemoteControl,
  JavaDevice,
  JavaMethodInfo,
  JavaFieldInfo,
  DeviceColor,
} from './types';
