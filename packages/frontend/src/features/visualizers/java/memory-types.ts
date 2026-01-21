/**
 * Java Memory View Types
 * Stack + Heap 메모리 시각화용 타입 정의
 */

export type JavaPrimitiveType = 'int' | 'double' | 'boolean' | 'char' | 'String' | 'void';
export type JavaReferenceType = 'Object' | 'Array';
export type JavaType = JavaPrimitiveType | JavaReferenceType | string;

export interface JavaValue {
  type: JavaType;
  value: number | string | boolean | null;
  objectId?: string;
  isReference: boolean;
}

export interface JavaObject {
  id: string;
  className: string;
  fields: [string, JavaValue][]; // Map을 배열로 변환
  shallowSize: number;
  isArray: boolean;
  arrayLength?: number;
  arrayElements?: JavaValue[];
  arrayElementType?: JavaType;
}

export interface StackFrame {
  methodName: string;
  localVariables: [string, JavaValue][]; // Map을 배열로 변환
  depth: number;
  lineNumber?: number;
  parameters?: [string, JavaValue][];
}

export interface HeapSnapshot {
  objects: JavaObject[];
  totalSize: number;
}

export interface StackSnapshot {
  frames: StackFrame[];
  currentDepth: number;
}

export type JavaEventType =
  | 'FrameEvent'
  | 'VariableEvent'
  | 'ObjectEvent'
  | 'ArrayEvent'
  | 'FieldEvent'
  | 'OutputEvent'
  | 'HighlightEvent';

export interface JavaEvent {
  type: JavaEventType;
  action: string;
  target?: string;
  value?: JavaValue;
  message?: string;
}

export interface JavaStep {
  lineNumber: number;
  code: string;
  stack: StackSnapshot;
  heap: HeapSnapshot;
  explanation: string;
  events: JavaEvent[];
  stdout?: string;
  callDepth?: number;
}

export interface JavaSimulationResult {
  success: boolean;
  steps: JavaStep[];
  sourceLines: string[];
  error?: string;
}
