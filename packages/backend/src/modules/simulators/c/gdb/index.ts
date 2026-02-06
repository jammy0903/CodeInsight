/**
 * GDB 기반 C 시뮬레이터 모듈
 *
 * 사용법:
 *   import { GdbTracer } from './gdb';
 *   const tracer = new GdbTracer();
 *   const result = await tracer.trace(code, stdin);
 */

export { GdbTracer } from './gdb-tracer';
export { GdbSession } from './gdb-session';
export { HeapTracker } from './heap-tracker';
export { StepBuilder } from './step-builder';
export { generateExplanation } from './explanation-generator';
export * from './types';
export * from './constants';
