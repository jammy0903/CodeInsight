// TODO: Implement Step and other related types
export interface JsStep {
  line: number;
  code: string;
  explanation: string;
  stack: JsStackFrame[];
  heap: JsHeapObject[];
}

export interface JsStackFrame {
  functionName: string;
  variables: Record<string, any>;
}

export interface JsHeapObject {
  id: string;
  type: 'Object' | 'Array' | 'Function';
  value: Record<string, any> | any[];
}
