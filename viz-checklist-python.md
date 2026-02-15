# Python Language Visualization Checklist

## Visualization Types Used
| vizType | View Component | Data Source |
|---------|---------------|-------------|
| `pythonMemory` | ReferenceGraphView | `step.pythonMemoryState` (names/objects) |
| `terminal` | TerminalStepView | `step.explanation`, `step.stdout` |

## Data Flow
```
Lesson JSON step
  → useLessonVisualization (resolvedStep, carry-forward)
  → LessonDesktopLayout (step prop)
  → LessonFlowVisualizer (language="python")
    → PyTransformer.transform() → FlowStep
    → ReferenceGraphView (language="python")
```

## PyTransformer Required Fields

### pythonMemoryState (primary data source)
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `names` | YES | PyName[] | Variable bindings (references) |
| `objects` | YES | PyObject[] | Heap objects (values) |
| `callStack` | optional | PyCallFrameSnapshot[] | Dynamic call frames |
| `output` | optional | string/string[] | Terminal output |

### PyName (names[])
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | YES | string | Variable name |
| `pointsTo` | YES | string | Object ID this name references |
| `scope` | optional | string | `"global"`, `"__main__"`, `"local"`, or function name |
| `highlight` | optional | boolean | Animation marker |

### PyObject (objects[])
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | YES | string | Unique object identifier |
| `type` | YES | string | Python type: `int`, `str`, `list`, `dict`, `tuple`, `set`, `function`, `class`, `instance`, `NoneType`, `bool` |
| `value` | YES | varies | Object value (see below) |
| `mutable` | optional | boolean | Whether object is mutable |
| `highlight` | optional | boolean | Animation marker |
| `pyId` | optional | string | Python id() value |

### Object Value Formats
| Type | Value Format | Example |
|------|-------------|---------|
| `int` | number | `42` |
| `str` | string | `"hello"` |
| `bool` | boolean | `true` |
| `NoneType` | null | `null` |
| `list` | `[{objectId: "..."}]` | `[{objectId: "obj3"}, {objectId: "obj4"}]` |
| `tuple` | `[{objectId: "..."}]` | same as list |
| `set` | `[{objectId: "..."}]` | same as list |
| `dict` | `[{key: {objectId}, value: {objectId}}]` | `[{key: {objectId: "k1"}, value: {objectId: "v1"}}]` |
| `function` | `{name, params, startLine?, ...}` | `{name: "foo", params: [{name: "x"}]}` |
| `class` | `{name, methods?, classAttributes?}` | `{name: "MyClass", methods: {...}}` |
| `instance` | `{className, attributes}` | `{className: "MyClass", attributes: {x: "1"}}` |

### Legacy Fields (also supported)
| Field | Maps To |
|-------|---------|
| `step.pyNames` | `pythonMemoryState.names` |
| `step.pyObjects` | `pythonMemoryState.objects` |
| `step.names` | `pythonMemoryState.names` |
| `step.objects` | `pythonMemoryState.objects` |

### Terminal Steps
| Field | Required | Description |
|-------|----------|-------------|
| `visualizationType` | YES | Must be `"terminal"` |
| `explanation` | YES | Text to display |
| `stdout` | optional | Terminal output text |

## ReferenceGraphView Rendering
- **Left column**: Names (variables) with arrow to referenced object
- **Right column**: Objects (heap values) with type badge
- **Frames**: `global` → `__main__` → function frames
- **Arrows**: Name → Object via `pointsTo`

## Validation Checklist per Lesson Step

- [ ] `step.code` present
- [ ] `visualizationType` set (`pythonMemory` or `terminal`)
- [ ] For `pythonMemory`:
  - [ ] `pythonMemoryState.names` array exists and non-empty (or intentionally empty)
  - [ ] `pythonMemoryState.objects` array exists
  - [ ] Every `name.pointsTo` references a valid `object.id`
  - [ ] Every object has `id`, `type`, `value`
  - [ ] Collection objects (list/dict/tuple/set) have `{objectId}` refs that match existing objects
- [ ] No orphaned objects (objects with no name pointing to them — OK for nested collections)
- [ ] For `terminal`: `explanation` present

## Known Issues
- None currently identified for Python lessons

## Lesson File Count: ~40 files (python + python-practical)
