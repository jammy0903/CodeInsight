# Testing Rules

## Unit Tests (Vitest)
- Location: same folder as source, *.test.ts
- Run: `pnpm test`

## E2E Tests (Playwright)
- Location: packages/frontend/e2e/
- Run: `pnpm test:e2e`

## Before PR
- All tests must pass
- No console.log in production code
