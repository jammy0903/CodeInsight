import type { JavaScriptSnapshot } from './debugger-client';
import type {
  DebuggerPausedEvent,
  InspectorPropertyDescriptor,
  InspectorPropertyReader,
  InspectorRemoteObject,
} from './inspector-client';

type HeapObject = JavaScriptSnapshot['heap'][number];

const SCOPE_PRIORITY = ['local', 'closure', 'block', 'script', 'global'];
const MAX_HEAP_CONTENT_LENGTH = 160;
const SKIP_VARIABLE_NAMES = new Set([
  'exports',
  'require',
  'module',
  '__filename',
  '__dirname',
  'global',
  'clearImmediate',
  'setImmediate',
  'clearInterval',
  'clearTimeout',
  'setInterval',
  'setTimeout',
  'queueMicrotask',
  'structuredClone',
  'atob',
  'btoa',
  'fetch',
  'process',
]);

export class JavaScriptInspectorSnapshotBuilder {
  async build(
    paused: DebuggerPausedEvent,
    reader: InspectorPropertyReader,
    options: { stdout?: string } = {}
  ): Promise<JavaScriptSnapshot> {
    const topFrame = paused.params.callFrames[0];
    const line = topFrame ? topFrame.location.lineNumber + 1 : 1;

    const heap = new Map<string, HeapObject>();
    const stack: JavaScriptSnapshot['stack'] = [];
    const rootScopeVariables: Record<string, unknown> = {};

    const totalFrames = paused.params.callFrames.length;
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      const frame = paused.params.callFrames[frameIndex];
      const variables: Record<string, unknown> = {};
      const isRootFrame = frameIndex === totalFrames - 1;
      const isOnlyFrame = totalFrames === 1;

      const sortedScopes = [...frame.scopeChain].sort((a, b) => {
        return scopePriority(a.type) - scopePriority(b.type);
      });

      for (const scope of sortedScopes) {
        const route = decideScopeRoute(scope.type, isRootFrame, isOnlyFrame, frame.functionName);
        if (route === 'skip') continue;
        const objectId = scope.object.objectId;
        if (!objectId) continue;

        const props = await reader.getProperties(objectId, {
          ownProperties: true,
          accessorPropertiesOnly: false,
          generatePreview: true,
        });

        for (const prop of props) {
          if (!isUsableProperty(prop)) continue;
          if (!shouldIncludeVariableName(prop.name)) continue;
          const serializedValue = toSerializableValue(prop.value!, heap);
          if (route === 'root') {
            if (rootScopeVariables[prop.name] === undefined) {
              rootScopeVariables[prop.name] = serializedValue;
            }
            continue;
          }

          if (variables[prop.name] !== undefined) continue;
          variables[prop.name] = serializedValue;
        }
      }

      if (isRootFrame) {
        Object.entries(rootScopeVariables).forEach(([name, value]) => {
          if (variables[name] === undefined) {
            variables[name] = value;
          }
        });
      }

      stack.push({
        methodName: resolveFrameName(frame.functionName, isRootFrame),
        className: frameIndex === 0 ? 'Main' : 'Function',
        variables,
      });
    }

    return {
      line,
      event: 'STEP',
      stack,
      heap: Array.from(heap.values()),
      stdout: options.stdout,
    };
  }
}

function scopePriority(scopeType: string): number {
  const idx = SCOPE_PRIORITY.indexOf(scopeType);
  return idx === -1 ? SCOPE_PRIORITY.length : idx;
}

function decideScopeRoute(
  scopeType: string,
  isRootFrame: boolean,
  isOnlyFrame: boolean,
  functionName?: string
): 'frame' | 'root' | 'skip' {
  if (isOnlyFrame) {
    return 'frame';
  }

  if (isRootFrame) {
    return scopeType === 'script' || scopeType === 'global' || scopeType === 'module'
      ? 'root'
      : 'skip';
  }

  // For active function/callback frames, keep local execution context only.
  if (scopeType === 'local' || scopeType === 'closure' || scopeType === 'block') {
    return 'frame';
  }

  if (!functionName || functionName === 'main') {
    return scopeType === 'script' || scopeType === 'global' || scopeType === 'module'
      ? 'root'
      : 'skip';
  }

  // Route script/global scopes from active frames into root (__main__) instead
  // of polluting the active frame.
  if (scopeType === 'script' || scopeType === 'global' || scopeType === 'module') {
    return 'root';
  }

  return 'skip';
}

function resolveFrameName(functionName: string | undefined, isRootFrame: boolean): string {
  if (functionName && functionName.trim()) return functionName;
  return isRootFrame ? '__main__' : '__anonymous__';
}

function isUsableProperty(prop: InspectorPropertyDescriptor): boolean {
  return (
    !!prop.value &&
    prop.name !== '__proto__' &&
    prop.name !== 'constructor' &&
    prop.enumerable !== false
  );
}

function shouldIncludeVariableName(name: string): boolean {
  if (!name) return false;
  if (SKIP_VARIABLE_NAMES.has(name)) return false;
  if (name.startsWith('__')) return false;
  return true;
}

function toSerializableValue(
  value: InspectorRemoteObject,
  heap: Map<string, HeapObject>
): unknown {
  if (value.unserializableValue === 'NaN') return NaN;
  if (value.unserializableValue === 'Infinity') return Infinity;
  if (value.unserializableValue === '-Infinity') return -Infinity;
  if (value.unserializableValue === '-0') return -0;

  if (value.type === 'undefined') return undefined;
  if (value.type === 'boolean' || value.type === 'number' || value.type === 'string') {
    return value.value;
  }
  if (value.type === 'bigint') {
    return value.unserializableValue ?? String(value.value ?? '0n');
  }
  if (value.type === 'object' && value.value === null) {
    return null;
  }

  if (value.type === 'function') {
    const label = formatFunctionLabel(value.description);
    const objectId = value.objectId;
    if (!objectId) {
      return label;
    }

    const address = `@${objectId}`;
    if (!heap.has(objectId)) {
      heap.set(objectId, {
        id: objectId,
        address,
        type: 'Function',
        content: label,
      });
    }

    return {
      id: address,
      class: 'Function',
      displayValue: label,
    };
  }

  const objectId = value.objectId;
  if (!objectId) {
    return value.description ?? value.value ?? null;
  }

  const address = `@${objectId}`;
  if (!heap.has(objectId)) {
    heap.set(objectId, {
      id: objectId,
      address,
      type: value.className || value.subtype || value.type || 'Object',
      content: truncateContent(value.description || value.className || value.type || 'Object'),
    });
  }

  return {
    id: address,
    class: value.className || value.subtype || value.type || 'Object',
  };
}

function truncateContent(content: string): string {
  if (content.length <= MAX_HEAP_CONTENT_LENGTH) return content;
  return `${content.slice(0, MAX_HEAP_CONTENT_LENGTH)}...`;
}

function formatFunctionLabel(description?: string): string {
  if (!description) return 'f anonymous()';

  const functionMatch = description.match(/function\s*([A-Za-z_$][\w$]*)?\s*\(/);
  if (functionMatch) {
    const name = functionMatch[1] || 'anonymous';
    return `f ${name}()`;
  }

  const classMatch = description.match(/class\s+([A-Za-z_$][\w$]*)/);
  if (classMatch) {
    return `class ${classMatch[1]}`;
  }

  if (description.includes('=>')) {
    return 'f arrow()';
  }

  return 'f anonymous()';
}
