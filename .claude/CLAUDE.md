# CodeInsight - Core Project Guide

## 📌 Project
**Visualization platform for code execution** (C, Python, JS, Java)

**Dual execution modes:**
- **Lesson**: Pre-scripted JSON (no simulator needed)
- **Playground**: User code → Simulator → Dynamic visualization

**Tech**: React/Vite, Node.js/Fastify, PostgreSQL, Language-specific simulators

## ⚡ Key Rules
1. **Explain Why**: Context + Reasoning, not just code
2. **Verify First**: Read files before assuming
3. **End-to-End**: Track data flow completely before answering
4. **Goal-Focused**: Ask what user is trying to solve first
5. **Diagnose**: Analyze before proposing solutions

## 🏗️ Structure
```
packages/
├── frontend/     (React Vite)
├── backend/      (Node.js API)
├── shared/       (Types)
└── simulators/   (Language implementations)
```

## 🔧 Commands
```bash
pnpm dev           # Dev server
pnpm build        # Build all
pnpm test         # Run tests
pnpm --filter @codeinsight/frontend dev
```

## 📚 Reference
- `context/project_overview.md` - Project details
- `context/tech_stack.md` - Technology
- `context/architecture.md` - System design
- `rules/` - Coding standards, API routes, DB schema
