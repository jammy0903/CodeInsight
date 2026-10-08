# CodeInsight 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, Framer Motion, i18next (ko/en/zh) | 19, 7, 5.9, 4, 5, 5, 12, 25 |
| Backend | Node.js, Fastify, TypeScript, Prisma, Zod | 22, 5, 5.9, 7, 4 |
| Database | PostgreSQL | Neon (레슨 콘텐츠만) |
| Simulators | C: gcc + GDB/MI · Python: sys.settrace · JS: V8 Inspector (Node 22 global WebSocket) · Java: JDI 에이전트 | - |
| Test | Vitest (frontend/backend), Playwright (e2e) | - |
| Deploy | Vercel (frontend), Fly.io Docker (backend) | - |

인증 없음 (2026-10 포트폴리오 전환 시 Firebase 제거).

## Quick Links
- **Dependencies**: See `package.json` files
- **Monorepo**: `packages/{frontend,backend,shared}`
- **API**: See `.claude/rules/API_ROUTES.md`
- **Deployment**: See `.claude/deployment_info.md`

## Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build all
pnpm test         # Run tests (C 시뮬레이터 테스트는 gdb 필요)
```
