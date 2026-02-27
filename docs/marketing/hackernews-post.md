# Hacker News — Show HN Post

---

## Title (80자 이내)

```
Show HN: CodeInsight – Visualize how C/Python/JS/Java code executes step by step
```

## URL

```
https://codeinsight.online
```

## First Comment (반드시 작성 — HN 관례)

Hi HN, I'm the developer behind CodeInsight.

I built this because when I was learning C, I couldn't visualize what was happening in memory. Textbooks showed static diagrams, but I wanted to see variables being created, pointers moving, and the stack growing — in real time.

**What it does:**

CodeInsight takes code in C, Python, JavaScript, or Java and visualizes each execution step. You can see:

- Memory layout (Stack, Heap, BSS, DATA, TEXT segments for C)
- Variable values changing in real time
- Call stack frames being pushed/popped
- For JavaScript: event loop, microtask/macrotask queues, prototype chains
- For Java: JVM memory model

There are two modes:

1. **Lesson mode** — Pre-built curriculum with guided explanations and AI commentary
2. **Playground mode** — Write your own code and watch it execute

**Technical details:**

- Frontend: React 19 + Vite + TailwindCSS + Zustand
- Backend: Node.js + Fastify + Prisma + PostgreSQL
- Code execution: Docker-sandboxed per-language simulators
- AI: DeepSeek for step-by-step explanations
- TypeScript monorepo with pnpm workspaces

The simulators parse code into execution traces (AST-based for lessons, Docker-sandboxed for playground). Each trace step includes line number, variable state, memory state, and output — which the frontend renders as interactive visualizations.

**Open source:** https://github.com/jammy0903/CodeInsight (MIT)

I'd love technical feedback on the visualization approach, and suggestions for what languages or concepts to add next.

---

# HN Posting Tips

1. **Best time:** Tuesday-Thursday, 8-10 AM EST (한국시간 밤 10시~자정)
2. **Title format:** "Show HN: Name – one-line description"
3. **URL은 라이브 데모로** (GitHub 말고 codeinsight.online)
4. **첫 코멘트 필수** — 위 내용 바로 달기
5. **기술적 질문에 빠르게 답변** — HN은 기술 깊이를 중시함
6. **겸손하게** — "I built this" not "revolutionary platform"
7. **투표 조작 절대 금지** — HN은 즉시 감지하고 ban함
