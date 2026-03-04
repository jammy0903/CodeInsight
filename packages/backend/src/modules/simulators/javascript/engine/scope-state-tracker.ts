import type {
  DebuggerPausedEvent,
  InspectorPropertyReader,
  InspectorRemoteObject,
} from './inspector-client';

type ScopeType = 'global' | 'function' | 'block' | 'module';

interface ScopeVariable {
  name: string;
  value?: unknown;
  keyword?: string;
}

interface ScopeEntry {
  name: string;
  type: ScopeType;
  variables: ScopeVariable[];
  children?: ScopeEntry[];
}

interface ScopeState {
  scopes: ScopeEntry[];
}

const SKIP_NAMES = new Set([
  'exports',
  'require',
  'module',
  '__filename',
  '__dirname',
  'global',
  'process',
]);

export class JavaScriptScopeStateTracker {
  async build(
    paused: DebuggerPausedEvent,
    reader: InspectorPropertyReader
  ): Promise<ScopeState | null> {
    const topFrame = paused.params.callFrames[0];
    if (!topFrame) return null;

    const entries: ScopeEntry[] = [];
    for (const scope of topFrame.scopeChain) {
      const scopeType = mapScopeType(scope.type);
      if (!scopeType) continue;
      const objectId = scope.object.objectId;
      if (!objectId) continue;

      const props = await reader.getProperties(objectId, {
        ownProperties: true,
        accessorPropertiesOnly: false,
        generatePreview: true,
      });

      const variables: ScopeVariable[] = [];
      for (const prop of props) {
        if (!prop?.value) continue;
        if (!prop.name || SKIP_NAMES.has(prop.name) || prop.name.startsWith('__')) continue;
        variables.push({
          name: prop.name,
          value: toDisplayValue(prop.value),
          keyword: inferKeyword(scope.type),
        });
      }

      entries.push({
        name: resolveScopeName(scope.type, topFrame.functionName),
        type: scopeType,
        variables,
      });
    }

    if (entries.length === 0) return null;
    const nested = nestScopes(entries.reverse());
    return { scopes: nested };
  }
}

function mapScopeType(raw: string): ScopeType | null {
  if (raw === 'global' || raw === 'script') return 'global';
  if (raw === 'module') return 'module';
  if (raw === 'local' || raw === 'closure' || raw === 'with') return 'function';
  if (raw === 'block' || raw === 'catch') return 'block';
  return null;
}

function resolveScopeName(raw: string, functionName: string): string {
  if (raw === 'global' || raw === 'script') return '__main__';
  if (raw === 'module') return 'module';
  if (raw === 'local' || raw === 'closure') return functionName || '__anonymous__';
  if (raw === 'block' || raw === 'catch') return 'block';
  return raw;
}

function inferKeyword(raw: string): string | undefined {
  if (raw === 'global' || raw === 'script' || raw === 'module') return 'var';
  if (raw === 'local' || raw === 'closure') return 'let';
  if (raw === 'block' || raw === 'catch') return 'let';
  return undefined;
}

function nestScopes(entries: ScopeEntry[]): ScopeEntry[] {
  if (entries.length <= 1) return entries;
  let root = entries[0];
  let current = root;
  for (let i = 1; i < entries.length; i++) {
    const next = entries[i];
    current.children = [next];
    current = next;
  }
  return [root];
}

function toDisplayValue(value: InspectorRemoteObject): unknown {
  if (value.unserializableValue === 'NaN') return 'NaN';
  if (value.unserializableValue === 'Infinity') return 'Infinity';
  if (value.unserializableValue === '-Infinity') return '-Infinity';
  if (value.type === 'undefined') return 'undefined';
  if (value.type === 'boolean' || value.type === 'number' || value.type === 'string') {
    return value.value;
  }
  if (value.type === 'object' && value.value === null) return null;
  if (value.objectId) {
    return value.description || value.className || value.subtype || 'Object';
  }
  return value.description || value.value || null;
}
