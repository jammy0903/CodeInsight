# Contributing to CodeInsight

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

1. Fork and clone the repo
2. Install dependencies: `pnpm install`
3. Copy `.env.example` to `.env` and fill in your values
4. Set up the database: `cd packages/backend && npx prisma migrate dev`
5. Start dev servers: `pnpm dev`

## Code Standards

- **TypeScript** - Strict types, avoid `any`
- **React** - Functional components with named exports
- **Styling** - TailwindCSS only (no inline styles)
- **Imports** - Use path aliases (`@/`, `@codeinsight/`)
- **Validation** - Zod for all input validation on the backend

## How to Contribute

### Reporting Bugs

Open an [issue](https://github.com/jammy0903/C-OSINE/issues/new?template=bug_report.md) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS info
- Screenshots if applicable

### Suggesting Features

Open an [issue](https://github.com/jammy0903/C-OSINE/issues/new?template=feature_request.md) describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

### Submitting Changes

1. Create a branch from `main`: `git checkout -b feat/my-feature`
2. Make your changes
3. Ensure the build passes: `pnpm build`
4. Run tests: `pnpm test`
5. Commit using [conventional commits](#commit-messages)
6. Push and open a Pull Request

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new visualization for linked lists
fix: correct memory leak in playground mode
refactor: simplify quiz scoring logic
docs: update API documentation
test: add unit tests for user service
chore: update dependencies
```

## Project Architecture

```
packages/
├── frontend/     # React SPA - UI components, state management, visualizers
├── backend/      # Fastify API - routes, services, database access
├── shared/       # Shared TypeScript types and Zod schemas
```

### Key Concepts

- **Lessons** use pre-scripted JSON to drive visualizations (no simulator needed)
- **Playground** sends user code to language-specific simulators that return execution traces
- **Visualizers** render execution state (memory, variables, call stack) as interactive diagrams

## Getting Help

- Open a [Discussion](https://github.com/jammy0903/C-OSINE/discussions) for questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
