/**
 * Memory Visualization Types (Shared)
 *
 * Canonical type definitions for memory tracing and visualization.
 * Used by: tracer service, memory-viz components, backend handlers
 */

// Memory block representing a variable in stack or heap
export interface MemoryBlock {
  name: string;
  address: string;
  type: string;
  size: number;
  bytes: number[];
  value: string;
  points_to: string | null;
  explanation?: string;
}

// Execution step with memory state
export interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  explanation: string;
  rsp: string;
  rbp: string;
}

// Trace API result
export interface TraceResult {
  success: boolean;
  steps: Step[];
  source_lines: string[];
  error?: string;
  message?: string;
}
