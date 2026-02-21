# Java Language Visualization Checklist

## Visualization Types Used
| vizType | View Component | Data Source |
|---------|---------------|-------------|
| `javaMemory` | ReferenceGraphView + banners | `step.javaMemoryState` |
| `memory` | ReferenceGraphView | `step.memoryState` (ch10 only) |

## Data Flow
```
Lesson JSON step
  → useLessonVisualization (resolvedStep, carry-forward)
  → LessonDesktopLayout (step prop)
  → LessonFlowVisualizer (language="java")
    → JavaTransformer.transform() → FlowStep
    → comparison/warning banners (if present)
    → ReferenceGraphView (language="java")
```

## JavaTransformer Data Sources (priority order)
```
1. (step as any).javaMemoryState?.stack  (primary - 41/45 lessons)
2. step.memoryState?.stack              (fallback - ch10 lessons)
3. step.stack                           (simulator output)
```

---

## javaMemoryState Fields

### RENDERED (handled by frontend)

| Field | Type | Transformer | View Component |
|-------|------|------------|----------------|
| `stack` | array | JavaTransformer → FlowVariable[] | ReferenceGraphView main frame |
| `heap` | array | JavaTransformer → FlowVariable[] | ReferenceGraphView heap frame |
| `stringPool` | array | JavaTransformer → FlowVariable[] | ReferenceGraphView "String Pool" frame |
| `output` | string[] | JavaTransformer → terminalOutput | Terminal overlay (diffMode) |
| `comparison` | string | LessonFlowVisualizer | Blue banner above ReferenceGraphView |
| `warning` | string | LessonFlowVisualizer | Yellow banner above ReferenceGraphView |

### NOT RENDERED (in JSON but no frontend handler)

| Field | Type | Used In | Description | Action Needed |
|-------|------|---------|-------------|---------------|
| `cache` | object | java-1-3, java-1-4 | Integer cache visualization `{name, range, highlight}` | Need renderer |
| `hashSet` | object | java-1-5 | HashSet bucket visualization `{buckets: [{index, content, searched?}]}` | Need renderer |
| `note` | string | many lessons | General informational text | Need renderer |
| `error` | string | java-2-4, java-5-4, java-9-4 | Error message (e.g., NPE, OOM) | Need renderer |
| `sameRef` | boolean | java-1-1~1-3 | Marker that variable references same object | Need renderer |
| `new` | boolean | java-1-1~1-4 | Marker that heap object is newly created | Need renderer |
| `refCount` | number | java-1-1, java-1-2 | Reference count on heap objects | Need renderer |
| `hashCode` | string | java-1-5 | Hash code display on heap objects | Need renderer |

---

## Stack Item Formats

### Format 1: Simple (Lesson JSON)
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | YES | string | Variable name |
| `value` | YES | string | Value (use `"-> 0x001"` for heap refs, `"-> Cache[127]"` for cache refs) |
| `type` | optional | string | Java type |
| `sameRef` | optional | boolean | Same reference marker (NOT RENDERED) |

### Format 2: Frame-based (Simulator)
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `methodName` | YES | string | Method name |
| `variables` | YES | object | `{varName: value}` or `{varName: {value, type, id?, displayValue?}}` |

## Heap Item Format
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `address` / `id` | YES | string | Heap address (e.g., `"0x001"`) |
| `content` / `value` | YES | string | Display value (e.g., `"\"hello\""`, `"Integer(128)"`) |
| `type` | optional | string | Java type |
| `new` | optional | boolean | Newly created marker (NOT RENDERED) |
| `refCount` | optional | number | Reference count (NOT RENDERED) |
| `hashCode` | optional | string | Hash code (NOT RENDERED) |

## String Pool Item Format
| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `address` | YES | string | Pool address (e.g., `"Pool:0x100"`) |
| `value` | YES | string | String value |

## Reference Format
- Stack value `"-> 0x001"` → `extractPointsTo()` → `"0x001"` → `pointsTo: "heap-0x001"`
- Stack value `"-> Cache[127]"` → `extractPointsTo()` → `"Cache[127]"` → `pointsTo: "heap-Cache[127]"`

---

## LessonFlowVisualizer Java-specific Logic

```tsx
if (language === 'java') {
  const jms = (step as any).javaMemoryState;
  // 1. Render comparison banner (blue)
  // 2. Render warning banner (yellow)
  // 3. Render ReferenceGraphView
}
```

---

## Delta Format Considerations

- 42/45 Java lessons use `deltaFormat: true`
- `javaMemoryState` is in `DEEP_MERGE_FIELDS` → sub-field level merge
- **CRITICAL**: `"stack": []` in delta = explicitly empty (clears inherited stack)
- **CRITICAL**: `"heap": []` in delta = explicitly empty (clears inherited heap)
- Omitting `stack` in delta = inherit from previous step (desired for comparison steps)
- `null` value = explicit removal (e.g., `"comparison": null` removes comparison banner)

---

## Validation Checklist per Lesson Step

### All Steps
- [ ] `step.code` present
- [ ] `visualizationType` set (`javaMemory` or `memory`)

### Memory Steps
- [ ] `javaMemoryState` (or `memoryState` for ch10) exists
- [ ] At least one of `stack`, `heap`, or `stringPool` is non-empty (or intentionally empty)
- [ ] Stack items have `name` and `value`
- [ ] Reference values (`"-> 0x001"`) have matching heap items with that `address`
- [ ] Cache references (`"-> Cache[127]"`) — note: no matching heap item needed (cache not rendered)

### Comparison Steps (with output)
- [ ] `comparison` field present (or null to clear)
- [ ] `output` array tracks cumulative output
- [ ] **MUST NOT have `"stack": []`** — should inherit from previous step via delta
- [ ] **MUST NOT have `"heap": []`** — should inherit from previous step via delta
- [ ] Stack variables should still be visible during comparison

### Warning Steps
- [ ] `warning` field present (or null to clear)

### String Pool Steps
- [ ] `stringPool` array has items with `address` and `value`
- [ ] Stack refs point to pool addresses correctly

### Output Steps
- [ ] `output` array contains cumulative output strings

---

## Lessons by Chapter

| Chapter | Lessons | Special Features |
|---------|---------|-----------------|
| ch1 (== vs equals) | java-1-1~1-8 | comparison, warning, cache, stringPool, hashSet, sameRef, new, refCount, hashCode |
| ch2 (Immutable) | java-2-1~2-4 | note, error, Optional handling |
| ch3 (Generic) | java-3-1~3-5 | Generic type erasure |
| ch4 (String) | java-4-1~4-4 | stringPool, comparison, warning |
| ch5 (Static) | java-5-1~5-4 | error (static context) |
| ch6 (Exception) | java-6-1~6-5 | try-catch-finally, AutoCloseable |
| ch7 (Collections) | java-7-1~7-4 | ArrayList, LinkedList, Iterator |
| ch8 (Map/Set) | java-8-1~8-4 | HashMap, HashSet, LinkedList |
| ch9 (GC/Memory) | java-9-1~9-4 | GC phases, OOM error |
| ch10 (Thread) | java-10-1~10-4 | Uses `memoryState` (not `javaMemoryState`), `vizType: "memory"` |

---

## Unrendered Fields Priority

### High Priority (affects UX significantly)
1. **`note`** — Many lessons have contextual notes that should display
2. **`error`** — Error states should be prominently displayed
3. **`sameRef` / `new`** — Visual markers help understanding

### Medium Priority
4. **`cache`** — Integer cache diagram (complex, only 2 lessons)
5. **`hashSet`** — HashSet bucket diagram (complex, only 1 lesson)
6. **`hashCode`** — Only java-1-5

### Low Priority
7. **`refCount`** — Reference counting (informational)

---

## Bug Fixes Applied (2026-02)
- [x] `stack: []` removed from comparison steps in java-1-1, java-1-2, java-1-3, java-1-4
- [x] `heap: []` removed from comparison steps
- [x] `stack: []` removed from java-4-3, java-4-4 comparison steps
- [x] `stack: []` removed from java-1-5 equals/HashSet steps
- [ ] `cache` field rendering not yet implemented
- [ ] `hashSet` field rendering not yet implemented
- [ ] `note` field rendering not yet implemented
- [ ] `error` field rendering not yet implemented

## Lesson File Count: 45 files
