/**
 * Java Visualizer
 *
 * 2-탭 구조:
 * 1. Reference 탭: 메모 스티커 비유 (변수 → 객체 참조)
 * 2. Messages 탭: 리모컨 비유 (다형성)
 */

export { JavaMessagesView } from './JavaMessagesView';
export { JavaReferenceView } from './JavaReferenceView';
export type {
  JavaMessageEvent,
  PolymorphismInfo,
  RemoteControl,
  JavaDevice,
  JavaMethodInfo,
  JavaFieldInfo,
  MessageFlow,
  DeviceColor,
  MessageAnimation,
  JavaVariable,
  JavaObject,
  JavaReferenceState,
} from './types';
