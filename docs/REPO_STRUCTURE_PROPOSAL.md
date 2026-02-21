# Repository Structure Proposal

## Goal

Keep the current monorepo model, reduce confusion at the repository root, and make onboarding faster.

## Current Assessment

- Core workspace is consistent:
  - `packages/backend`
  - `packages/frontend`
  - `packages/shared`
- Workspace definition is clear in `pnpm-workspace.yaml` (`packages/*`).
- Main inconsistency is at root level:
  - Non-workspace artifacts and helper files are mixed with source entry points.
  - A root `frontend/` directory exists while actual frontend source is in `packages/frontend/`.

## Proposed Target Structure

```text
/
├── packages/
│   ├── backend/
│   ├── frontend/
│   └── shared/
├── docs/
├── scripts/
├── assets/
├── screenshots/              # optional, if kept in git
├── .claude/                  # agent/project operating docs
├── android/                  # mobile shell app
└── (minimal root config files only)
```

## Action Plan

1. Remove naming collision at root:
- Delete root `frontend/` if it is only build output and not needed.
- If it must remain for external tooling, rename to `artifacts/frontend-dist/`.

2. Separate artifacts from source:
- Move root-level screenshots like `mobile-screenshot-*.png` into `screenshots/mobile/`.
- Move one-off HTML assets like `icon-designs.html` into `docs/design/`.

3. Clarify script ownership:
- Keep shared/global scripts in root `scripts/`.
- Keep backend-only scripts in `packages/backend/scripts/`.
- Add a short `scripts/README.md` describing when to use each location.

4. Keep root clean:
- Root should contain only repo-level configs and entry docs.
- Feature docs and reports should live in `docs/` or the owning package folder.

5. Tighten ignore policy:
- Ensure generated artifacts are gitignored unless intentionally versioned.
- Keep workspace package build outputs ignored where possible.

## Backend Consistency Plan

### Target (`packages/backend`)

```text
packages/backend/
├── src/
│   ├── app.ts
│   ├── config/
│   ├── plugins/
│   ├── modules/
│   ├── services/
│   ├── types/
│   └── utils/
├── prisma/
│   ├── migrations/
│   ├── content/
│   └── scripts/
├── scripts/                 # backend maintenance/admin scripts
├── tests/                   # integration/e2e/debuggable test runners
└── (minimal package configs)
```

### Issues Found

- Fastify-first codebase, but legacy dependencies still present (`express`, `cors`, related `@types/*`).
- Test/debug/check scripts are scattered in package root (`test-*.mjs`, `debug-*.js`, `check-*.js`).
- Route file naming is mixed:
  - `*.routes.ts` style and plain `routes.ts` both exist.
- Barrel usage (`index.ts`) is inconsistent across modules.

### Backend Actions

1. Remove dead framework deps:
- Verify no runtime imports of `express`/`cors`.
- Remove `express`, `cors`, `@types/express`, `@types/cors`, `@types/swagger-ui-express` if unused.

2. Consolidate root scripts/tests:
- Move root debug/check/test utilities into:
  - `packages/backend/tests/integration/` for runnable API tests
  - `packages/backend/tests/debug/` for ad-hoc diagnostics
  - `packages/backend/scripts/` for maintenance utilities

3. Normalize routing naming:
- Pick one style and apply consistently:
  - Option A: `routes.ts` inside each module folder
  - Option B: `<module>.routes.ts` inside each module folder
- Recommended: Option A (`routes.ts`) for shorter imports and predictable discovery.

4. Standardize module export policy:
- Either require `index.ts` barrel in all top-level modules, or avoid barrels completely.
- Recommended: barrel only when module has >1 public entry.

5. Keep generated/ephemeral files out:
- Ensure `logs/`, `tmp/`, coverage outputs remain ignored.
- Keep screenshots/debug dumps outside source paths.

## Suggested Conventions

- Naming:
- Use `kebab-case` for markdown docs and scripts.
- Prefer explicit suffixes: `*-report.md`, `*-plan.md`, `*-checklist.md`.

- Placement:
- Code near owner package.
- Cross-cutting docs in `docs/`.
- Temporary outputs in `tmp/` (gitignored).

## Minimal Migration Order

1. Handle root `frontend/`.
2. Move screenshot and design artifacts to dedicated folders.
3. Add `scripts/README.md`.
4. Backend pass:
- remove unused legacy backend deps
- move backend root debug/test scripts into `tests/` and `scripts/`
- normalize backend route naming and module export policy
5. Update `.gitignore` for any newly moved artifact folders.
6. Optional: add a CI check to prevent accidental root clutter.

## Notes

- This proposal keeps your current architecture intact.
- It focuses on reducing ambiguity, not a disruptive refactor.
