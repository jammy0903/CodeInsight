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
6. **Hot Reload First**: 프론트 UI/스타일 수정 중에는 `pnpm build`를 자동 실행하지 말고, 사용자가 명시적으로 요청할 때만 빌드 실행
7. **Bug Claims Need Proof**: 버그 제보/반박 시 즉시 수정하지 말고 재현, 코드 근거, 영향 범위를 먼저 확인한 뒤 변경할 것

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

## 🚫 Do Not Delete
Root-level AI agent config files must NOT be deleted or moved:
- `AGENTS.md`, `SOUL.md`, `IDENTITY.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `USER.md`, `TOOLS.md`
- `.ralphrc`, `.ralph/`

These belong to another AI agent (Ralph) and are required to stay in the project root.

## 📚 Reference
- `context/project_overview.md` - Project details
- `context/tech_stack.md` - Technology
- `context/architecture.md` - System design
- `rules/` - Coding standards, API routes, DB schema
