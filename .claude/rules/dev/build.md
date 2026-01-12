# Build Rules

## Development
- NEVER run `pnpm build` during development
- Use HMR via `pnpm dev`
- See: dev/server.md

## Production Build
```bash
pnpm build        # TypeScript check + Vite build
docker compose up # Deploy
```

## When to Build
- Before PR merge
- After package.json changes
- CI/CD only
