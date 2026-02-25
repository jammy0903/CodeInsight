# CodeInsight

**Interactive code execution visualization platform for learning programming.**

CodeInsight helps learners understand how code actually runs by visualizing memory, variables, call stacks, and data structures step-by-step. Supports **C**, **Python**, **JavaScript**, and **Java**.

## Features

- **Step-by-step visualization** - Watch variables, memory, and call stacks change as code executes
- **Two execution modes**
  - **Lesson mode** - Pre-scripted walkthroughs with guided explanations
  - **Playground mode** - Write and run your own code with real-time visualization
- **Multi-language support** - C, Python, JavaScript, Java with language-specific visualizers
- **Interactive quizzes** - Test understanding after each lesson
- **Progress tracking** - Learning streaks, achievements, and analytics
- **i18n** - Korean and English

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TailwindCSS, Zustand, React Query |
| Backend | Node.js, Fastify, Prisma ORM |
| Database | PostgreSQL |
| Auth | Firebase Authentication (Google, GitHub, Kakao) |
| Simulators | Language-specific execution engines (Docker-based) |
| Shared | TypeScript monorepo with pnpm workspaces |

## Project Structure

```
packages/
├── frontend/     # React SPA (Vite)
├── backend/      # REST API (Fastify)
├── shared/       # Shared types & schemas
```

## Getting Started

### Prerequisites

- Node.js >= 18
- pnpm >= 8
- PostgreSQL
- Docker (for simulator execution)
- Firebase project (for authentication)

### Setup

```bash
# Clone
git clone https://github.com/jammy0903/C-OSINE.git
cd C-OSINE

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL, Firebase credentials, etc.

# Set up the database
cd packages/backend
npx prisma migrate dev
npx prisma db seed
cd ../..

# Start development servers
pnpm dev
```

The frontend runs at `http://localhost:5174` and the backend at `http://localhost:3002`.

### Environment Variables

See [`.env.example`](.env.example) for all required variables. Key ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `VITE_API_URL` | Backend API URL for frontend |

## Scripts

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm test         # Run all tests
pnpm clean        # Clean build artifacts
```

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## License

[MIT](LICENSE)
