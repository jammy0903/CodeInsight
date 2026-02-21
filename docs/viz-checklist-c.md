# C Language Visualization Checklist

## Visualization Types Used
| vizType | View Component | Data Source |
|---------|---------------|-------------|
| `cMemory` | FlowVisualizer + ArrowLayer | `step.stack`, `step.heap` |
| `terminal` | TerminalStepView | `step.explanation`, `step.stdout` |

## Data Flow
```
Lesson JSON step
  → useLessonVisualization (resolvedStep, carry-forward)
  → LessonDesktopLayout (memoryState prop + step prop)
  → LessonFlowVisualizer (language="c")
    → CTransformer.transform() → FlowStep
    → FlowVisualizer + ArrowLayer
```

## CTransformer Required Fields

### Stack Item (step.stack[])
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | YES | string | Variable name (or `frame.name` for dot-format) |
| `value` | YES | string/number/array | Variable value |
| `type` | optional | string | C type (e.g., `int`, `int*`, `char[]`) |
| `address` | optional | string | Memory address (hex) |
| `points_to` | optional | string | Target variable name or hex address |
| `highlight` | optional | boolean | Whether to animate as "updating" |
| `frame` | optional | string | Frame name (alternative to dot-format) |
| `type: "frame"` | special | - | Frame marker (not a variable) |

### Heap Item (step.heap[])
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | optional | string | Label for heap block |
| `value` | YES | string/number/array | Value |
| `type` | optional | string | C type |
| `address` | YES | string | Heap address |
| `points_to` | optional | string | For linked structures |
| `highlight` | optional | boolean | Animation marker |
| `size` | optional | number | Allocated size |
| `label` | optional | string | Display label |
| `dangling` | optional | boolean | Dangling pointer marker |

### Complex Values (arrays/structs)
- **Array**: `value: ["10", "20", "30"]` → displays as `[10, 20, 30]`
- **Struct**: `value: [{key: "x", value: "10"}, ...]` → displays as `{x: 10, ...}`
- **Char array**: `value: ["H", "e", "l", "l", "o", "\\0"]` → special char rendering

### Terminal Steps
| Field | Required | Description |
|-------|----------|-------------|
| `visualizationType` | YES | Must be `"terminal"` |
| `explanation` | YES | Text to display |
| `stdout` | optional | Terminal output text |

## Rendering Pipeline

### FlowVisualizer (C only)
- Renders variables in colored boxes (stack left, heap right)
- Groups by frame (main, global, heap)
- Shows type badge and value

### ArrowLayer (C only)
- Draws SVG arrows from pointer variables to targets
- Matches via `variable.pointsTo` → target `variable.id`
- `CTransformer.resolvePointsTo()` converts raw `points_to` to variable IDs

## Validation Checklist per Lesson Step

- [ ] `step.code` present (for line matching)
- [ ] `visualizationType` set (`cMemory` or `terminal`)
- [ ] For `cMemory`: at least one of `stack` or `heap` is non-empty
- [ ] Stack items have `name` and `value`
- [ ] Pointer variables have `points_to` matching a heap item's `address`
- [ ] Frame markers (`type: "frame"`) appear before their variables
- [ ] No `stack: []` on intermediate steps unless intentionally clearing
- [ ] For `terminal`: `explanation` is present

## Known Issues
- None currently identified for C lessons

## Lesson File Count: 39 files
