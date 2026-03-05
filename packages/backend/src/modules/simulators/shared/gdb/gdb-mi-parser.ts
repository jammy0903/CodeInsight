/**
 * GDB/MI Parser Utilities & Shared Types
 *
 * Language-agnostic GDB/MI protocol parsing.
 * Extracted from C++ gdb-client.ts for reuse by C and C++ simulators.
 */

// ============================================
// Shared Types
// ============================================

export interface GdbVariable {
  name: string;
  type: string;
  value: string;
  address: string;
  points_to?: string;
  // C++ enricher fields
  isReference?: boolean;
  children?: GdbVariable[];
  containerInfo?: {
    containerType: 'vector' | 'string' | 'map' | 'set' | 'array';
    size: number;
    capacity?: number;
    elements?: Array<{ index: number; value: string; type: string }>;
  };
  smartPtrInfo?: {
    ownership: 'unique' | 'shared';
    rawPointer: string;
    refCount?: number;
  };
  // C enricher fields
  structMembers?: Array<{ name: string; type: string; value: string }>;
  charElements?: string[];
  dangling?: boolean;
}

export interface GdbStackFrame {
  functionName: string;
  depth: number;
  line: number;
  variables: GdbVariable[];
}

export interface GdbHeapBlock {
  address: string;
  type: string;
  size: number;
  value: string;
  name: string;
}

export interface GdbSnapshot {
  line: number;
  code: string;
  stack: GdbStackFrame[];
  heap: GdbHeapBlock[];
  stdout: string;
  events: any[];
}

// ============================================
// MI Parser Utilities
// ============================================

/** Parse key="value" pairs from a GDB/MI record */
export function parseMiRecord(line: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /(\w+)="([^"]*?)"/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    result[match[1]] = match[2];
  }
  return result;
}

/** Parse local variables from -stack-list-locals output */
export function parseLocals(output: string): GdbVariable[] {
  const variables: GdbVariable[] = [];
  const blockRegex = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
  let match;
  while ((match = blockRegex.exec(output)) !== null) {
    const block = match[1];
    const fields = parseMiRecord(block);
    if (fields.name) {
      variables.push({
        name: fields.name,
        type: fields.type || 'unknown',
        value: fields.value || '',
        address: '',
      });
    }
  }
  return variables;
}

/** Parse stack frames from -stack-list-frames output */
export function parseStackFrames(output: string): Array<{ func: string; level: number; line: number }> {
  const frames: Array<{ func: string; level: number; line: number }> = [];
  const frameRegex = /frame=\{([^}]+)\}/g;
  let match;
  while ((match = frameRegex.exec(output)) !== null) {
    const fields = parseMiRecord(match[1]);
    if (fields.func) {
      frames.push({
        func: fields.func,
        level: parseInt(fields.level || '0', 10),
        line: parseInt(fields.line || '0', 10),
      });
    }
  }
  return frames;
}

/** Parse function arguments from -stack-list-arguments output */
export function parseArgs(output: string, frameLevel: number): GdbVariable[] {
  const variables: GdbVariable[] = [];
  const frameRegex = /frame=\{level="(\d+)",args=\[([^\]]*)\]\}/g;
  let match;
  while ((match = frameRegex.exec(output)) !== null) {
    const level = parseInt(match[1], 10);
    if (level === frameLevel) {
      const argsContent = match[2];
      const blockRegex = /\{([^}]+)\}/g;
      let argMatch;
      while ((argMatch = blockRegex.exec(argsContent)) !== null) {
        const fields = parseMiRecord(argMatch[1]);
        if (fields.name) {
          variables.push({
            name: fields.name,
            type: fields.type || 'unknown',
            value: fields.value || '',
            address: '',
          });
        }
      }
      break;
    }
  }
  return variables;
}

/** Parse a value="..." field from GDB/MI output, handling escaped quotes */
export function parseMiValue(output: string): string {
  const valStart = output.indexOf('value="');
  if (valStart === -1) return '';

  let i = valStart + 7; // skip 'value="'
  let result = '';
  while (i < output.length) {
    if (output[i] === '\\' && i + 1 < output.length) {
      result += output[i] + output[i + 1];
      i += 2;
    } else if (output[i] === '"') {
      break;
    } else {
      result += output[i];
      i++;
    }
  }
  return result
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '')
    .replace(/\\\\/g, '\\');
}
