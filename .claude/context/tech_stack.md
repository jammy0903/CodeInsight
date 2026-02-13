# CodeInsight 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Frontend | React, Vite, TypeScript, Framer Motion, TailwindCSS, Zustand | 18+, 5+, 5.9+, 11+, 3+, 4+ |
| Backend | Node.js, Fastify, TypeScript, Prisma | 18+, 4+, 5.9+, 5+ |
| Database | PostgreSQL | 15+ (Neon) |
| Simulators | GCC, Python, Node.js VM, JDI | - |
| Auth | Firebase Auth | 10+ (Google/GitHub OAuth) |
| DevOps | Docker, Render | - |

## Quick Links
- **Dependencies**: See `package.json` files
- **Monorepo**: `packages/{frontend,backend,shared,simulators}`
- **API**: See `.claude/rules/API_ROUTES.md`
- **Deployment**: Render (Static Site + Docker)

## Commands
```bash
pnpm dev          # Start dev server
pnpm build        # Build all
pnpm test         # Run tests
```
