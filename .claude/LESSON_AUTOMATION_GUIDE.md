# Lesson Automation Guide (All Languages)

**Purpose**: YAML -> JSON -> DB lesson automation for all supported languages

---

## Overview

All languages follow the same automation pipeline:

```
YAML Template -> Simulator Execution -> JSON Generation -> DB Import
```

**Pipeline**: `pnpm run automate:<language>`

---

## Directory Structure

```
packages/backend/
├── lesson-templates/<language>/    # YAML templates
│   ├── <lang>-1-1.yaml
│   └── ...
├── scripts/
│   ├── automate-python-lessons.ts
│   ├── automate-c-lessons.ts
│   ├── automate-js-lessons.ts
│   ├── automate-java-lessons.ts
│   └── lib/lesson-automation.ts    # Shared automation logic
└── prisma/content/<language>/lessons/  # Generated JSON
    ├── <lang>-1-1.json
    └── ...
```

---

## YAML Template Structure

All languages use the same YAML schema:

```yaml
lessonId: "<lang>-<chapter>-<lesson>"
title: "Lesson Title"
concept: "Core concept explanation"

code: |
  # Language-specific code here

annotations:
  - line: 1
    title: "Step title"
    explanation: |
      Markdown explanation of this line

quiz:
  question: "Quiz question?"
  options: ["A", "B", "C", "D"]
  correctIndex: 0
  explanation: "Why this answer is correct"

misconceptions:
  - wrong: "Common misconception"
    correct: "Correct understanding"
    why: "Explanation"

keyTakeaway: "One-line summary"
```

---

## Language-Specific Differences

| Language | Simulator | Memory State Key | Visualization Type | Lesson ID Prefix |
|----------|-----------|------------------|--------------------|-----------------|
| Python | PythonSimulationService | pythonMemoryState | pythonMemory | py- |
| C | CSimulationService | cMemoryState | cMemory | c- |
| JavaScript | JsSimulationService | jsMemoryState | jsMemory | js- |
| Java | JavaSimulationService | javaMemoryState | javaMemory | java- |

### Chapter ID Parsing

- **Python**: `py-1-1` -> chapter 1
- **C**: `c-1-1` -> chapter 1
- **JavaScript**: `js-1-1` -> chapter 1
- **Java**: `java-1-1` -> chapter 1

---

## Running Automation

```bash
cd packages/backend

# Run for specific language
pnpm run automate:python
pnpm run automate:c
pnpm run automate:js
pnpm run automate:java
```

### Expected Output

```
Step 1: Find YAML files
Step 2: YAML -> JSON conversion (runs simulator)
Step 3: JSON -> DB import
Final stats: N files processed, M succeeded, K failed
```

---

## Troubleshooting

### "Lesson not found in DB" (skipped)

Lesson metadata doesn't exist in DB. Create the lesson entry first via Prisma.

### Simulation failed

1. Check simulator service for the language
2. Verify compiler/runtime is installed (GCC for C, JDK for Java, etc.)
3. Check code syntax in YAML template

### Type mismatch

Ensure `visualizationType` and memory state keys match the language config.

---

## Checklist for Adding a New Language

1. Create `lesson-templates/<language>/` directory
2. Write YAML templates following the schema above
3. Create `automate-<language>-lessons.ts` (or add config to shared lib)
4. Add `automate:<language>` script to `package.json`
5. Run and verify: `pnpm run automate:<language>`
6. Check browser: lessons appear in course page
