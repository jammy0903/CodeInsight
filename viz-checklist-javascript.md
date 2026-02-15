# JavaScript Language Visualization Checklist

## Visualization Types Used
| vizType | View Component | Data Source | Transformer? |
|---------|---------------|-------------|-------------|
| `memory` | ReferenceGraphView | `step.memoryState` (stack/heap) | YES - JSTransformer |
| `jsMemory` | ReferenceGraphView | `step.memoryState` (stack/heap) | YES - JSTransformer |
| `scope` | ScopeView | `step.scopeState` | NO - direct |
| `thisBinding` | ThisBindingView | `step.thisState` | NO - direct |
| `prototype` | PrototypeChainView | `step.prototypeState` | NO - direct |
| `promise` | PromiseView | `step.promiseState` | NO - direct |
| `eventLoop` | EventLoopView | `step.eventLoopState` | NO - direct |

## Data Flow

### Memory Types (`memory`, `jsMemory`)
```
Lesson JSON step
  → useLessonVisualization (carry-forward)
  → LessonFlowVisualizer (language="javascript")
    → JSTransformer.transform() → FlowStep
    → ReferenceGraphView (language="javascript")
```

### Non-Memory Types (scope, thisBinding, prototype, promise, eventLoop)
```
Lesson JSON step
  → useLessonVisualization (carry-forward, passthrough)
  → LessonFlowVisualizer
    → isNonMemoryType check → direct render
    → ScopeView / ThisBindingView / PrototypeChainView / PromiseView / EventLoopView
```

---

## Memory Type Fields

### memoryState.stack[] (or step.stack[])

#### Format 1: Simple (Lesson JSON)
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | YES | string | Variable name |
| `value` | YES | string/number | Value (use `"@N"` for heap refs) |
| `type` | optional | string | Type name |

#### Format 2: Frame-based (Simulator)
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `methodName` | YES | string | Frame name (`__main__`, function name) |
| `className` | optional | string | Class context |
| `variables` | YES | object | `{varName: value}` or `{varName: {value, type}}` |

### memoryState.heap[] (or step.heap[])
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `address` / `id` | YES | string | Heap address (matches `@N` refs) |
| `content` / `value` | YES | string | Display value |
| `type` | optional | string | Object type (`Array`, `Object`, `Function`, etc.) |

### Heap Reference Format
- Stack value `"@1"` points to heap item with `address: "@1"`
- JSTransformer creates `pointsTo: "heap-@1"` linking to `id: "heap-@1"`

---

## Non-Memory Type Fields

### scopeState (for vizType: `scope`)
```json
{
  "scopes": [
    {
      "type": "Global" | "Function" | "Block",
      "name": "string",
      "variables": [
        { "name": "x", "value": "10", "kind": "let" | "const" | "var" }
      ]
    }
  ]
}
```

### thisState (for vizType: `thisBinding`)
```json
{
  "context": "string (description)",
  "callType": "method" | "function" | "constructor" | "arrow" | "explicit",
  "thisValue": "string (what this resolves to)",
  "explanation": "string (optional)"
}
```

### prototypeState (for vizType: `prototype`)
```json
{
  "chain": [
    {
      "name": "string",
      "type": "instance" | "prototype" | "constructor",
      "properties": [
        { "name": "string", "value": "string", "own": true|false }
      ]
    }
  ]
}
```

### promiseState (for vizType: `promise`)
```json
{
  "promises": [
    {
      "id": "string",
      "state": "pending" | "fulfilled" | "rejected",
      "value": "string (optional)",
      "label": "string"
    }
  ],
  "microtaskQueue": ["string"] (optional)
}
```

### eventLoopState (for vizType: `eventLoop`)
```json
{
  "callStack": ["string"],
  "webApis": [{ "name": "string", "delay": "string" }],
  "taskQueue": ["string"],
  "microtaskQueue": ["string"],
  "output": ["string"]
}
```
**Note**: EventLoopView detects via `hasStandardEventLoop` (callStack/webApis/taskQueue/microtaskQueue fields), NOT by vizType.

---

## LessonFlowVisualizer Routing Logic

```
1. hasStandardEventLoop? → EventLoopView
2. vizType === 'scope' && scopeState? → ScopeView
3. vizType === 'thisBinding' && thisState? → ThisBindingView
4. vizType === 'prototype' && prototypeState? → PrototypeChainView
5. vizType === 'promise' && promiseState? → PromiseView
6. vizType === 'terminal'? → TerminalStepView
7. isJavaScript? → JSTransformer → ReferenceGraphView
```

## Validation Checklist per Lesson Step

### All Steps
- [ ] `step.code` present
- [ ] `visualizationType` set to one of: `memory`, `jsMemory`, `scope`, `thisBinding`, `prototype`, `promise`, `eventLoop`

### Memory Steps (`memory`, `jsMemory`)
- [ ] `memoryState` object exists with `stack` and `heap`
- [ ] Stack items have either `{name, value}` or `{methodName, variables: {...}}`
- [ ] Heap refs (`"@N"`) in stack match `address`/`id` in heap items
- [ ] Heap items have `address`/`id` and `content`/`value`
- [ ] No `stack: []` on intermediate steps unless intentionally clearing

### Scope Steps (`scope`)
- [ ] `scopeState` object exists
- [ ] `scopeState.scopes` is non-empty array
- [ ] Each scope has `type`, `name`, `variables`
- [ ] Variables have `name`, `value`, `kind`

### ThisBinding Steps (`thisBinding`)
- [ ] `thisState` object exists
- [ ] Has `context`, `callType`, `thisValue`

### Prototype Steps (`prototype`)
- [ ] `prototypeState` object exists
- [ ] Has `chain` array
- [ ] Each chain item has `name`, `type`, `properties`

### Promise Steps (`promise`)
- [ ] `promiseState` object exists
- [ ] Has `promises` array
- [ ] Each promise has `id`, `state`

### EventLoop Steps (`eventLoop`)
- [ ] `eventLoopState` object exists
- [ ] Has at least one of: `callStack`, `webApis`, `taskQueue`, `microtaskQueue`

---

## Lessons by vizType

| vizType | Lessons |
|---------|---------|
| `memory` | js-4-1, js-4-2, js-4-3, js-5-1, js-5-2, js-7-1, js-7-2, js-7-3, js-8-1 |
| `jsMemory` | js-1-5, js-1-6, js-1-7, js-1-8, js-2-4 |
| `scope` | js-2-1, js-2-2, js-2-3 |
| `thisBinding` | js-3-1, js-3-2, js-3-3, js-3-4 |
| `prototype` | js-6-1, js-6-2, js-6-3, js-6-4 |
| `promise` | js-8-4 |
| `eventLoop` | js-1-1, js-1-2, js-1-3, js-1-4, js-4-3, js-8-2, js-8-3 |

## Known Issues
- `callStack` vizType has NO frontend renderer (broken; use `memory` instead)
- js-8-3 has non-standard eventLoopState (only warning/note fields, no standard queues)
- DEV console.logs still active in JSTransformer (harmless in production)

## Lesson File Count: 31 files
