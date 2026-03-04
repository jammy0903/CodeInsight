import type {
  DebuggerPausedEvent,
  InspectorPropertyReader,
  InspectorRemoteObject,
} from './inspector-client';

interface ThisObjectProperty {
  key: string;
  value: string;
}

interface ThisObjectEntry {
  name: string;
  properties: ThisObjectProperty[];
}

interface ThisState {
  context: string;
  thisValue?: string;
  callStack: string[];
  binding?: {
    method?: string;
    thisIs?: string;
  };
  objects?: ThisObjectEntry[];
  isStrict: boolean;
}

export class JavaScriptThisStateTracker {
  async build(
    paused: DebuggerPausedEvent,
    reader: InspectorPropertyReader
  ): Promise<ThisState | null> {
    const topFrame = paused.params.callFrames[0];
    if (!topFrame) return null;

    const callStack = paused.params.callFrames
      .map((frame) => frame.functionName || '__anonymous__')
      .slice(0, 6);

    const thisObject = topFrame.this;
    const thisValue = formatThisValue(thisObject);
    const methodName = topFrame.functionName || undefined;

    const state: ThisState = {
      context: inferContext(topFrame.functionName, thisObject),
      thisValue,
      callStack,
      binding: {
        method: methodName,
        thisIs: thisValue,
      },
      isStrict: false,
    };

    if (thisObject?.objectId) {
      const props = await reader.getProperties(thisObject.objectId, {
        ownProperties: true,
        accessorPropertiesOnly: false,
        generatePreview: true,
      });

      const visibleProps = props
        .filter((prop) => prop?.value && prop.name && !prop.name.startsWith('__'))
        .slice(0, 8)
        .map((prop) => ({
          key: prop.name,
          value: formatPropertyValue(prop.value!),
        }));

      state.objects = [
        {
          name: thisValue || thisObject.className || thisObject.description || 'this',
          properties: visibleProps,
        },
      ];
    }

    return state;
  }
}

function inferContext(functionName: string, thisObject?: InspectorRemoteObject): string {
  if (!thisObject || thisObject.type === 'undefined') return 'function call';
  if (functionName?.startsWith('bound ')) return 'explicit bind';
  if (functionName && /^[A-Z]/.test(functionName)) return 'constructor';
  return 'method call';
}

function formatThisValue(thisObject?: InspectorRemoteObject): string {
  if (!thisObject) return 'undefined';
  if (thisObject.type === 'undefined') return 'undefined';
  if (thisObject.unserializableValue) return thisObject.unserializableValue;
  if (thisObject.value !== undefined && thisObject.value !== null) return String(thisObject.value);
  if (thisObject.className) return thisObject.className;
  if (thisObject.description) return thisObject.description;
  return thisObject.type || 'Object';
}

function formatPropertyValue(value: InspectorRemoteObject): string {
  if (value.unserializableValue) return value.unserializableValue;
  if (value.type === 'undefined') return 'undefined';
  if (value.value !== undefined && value.value !== null) return String(value.value);
  if (value.description) return value.description;
  if (value.className) return value.className;
  return value.type || 'unknown';
}
