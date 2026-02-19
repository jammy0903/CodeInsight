/**
 * Java Visualizer
 *
 * 구성:
 * - JavaMemoryView: Stack/Heap 메모리 시각화 (호버 애니메이션)
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
