# Reddit Post Drafts

---

## r/learnprogramming

**Title:** I built a free platform that visualizes how C/Python/JS/Java code actually runs — memory, variables, and call stacks step by step

**Body:**

Hey everyone,

When I was learning C, the hardest part wasn't syntax — it was understanding what actually happens when code runs. What does the stack look like? Where do variables live? What's a pointer really pointing to?

So I built **CodeInsight** — a free platform that visualizes code execution step by step. You write code (or follow guided lessons), and it shows you exactly how memory, variables, and the call stack change at each line.

**What it does:**
- Step-by-step execution with line highlighting
- Visual memory layout (Stack, Heap, BSS, DATA, TEXT segments for C)
- Variable tracking with real-time value changes
- Event loop visualization for JavaScript
- Prototype chain, scope chain, `this` binding for JS
- JVM memory model for Java
- AI explanations at each step
- Quizzes after each lesson

**Languages:** C, C++, Python, JavaScript, Java

**Two modes:**
- **Lesson mode** — Guided curriculum with pre-built visualizations
- **Playground mode** — Write your own code and see it visualized

It's completely free and open source: https://github.com/jammy0903/CodeInsight

Live demo: https://codeinsight.online

I'd love to hear your feedback. What features would make this more useful for learning?

---

## r/programming

**Title:** CodeInsight — Open-source code execution visualizer for C/Python/JS/Java with memory layout, call stacks, and step-by-step debugging

**Body:**

I've been working on an open-source platform that visualizes how code executes at a low level. It's aimed at CS students and self-taught developers who want to understand what's actually happening under the hood.

**Key features:**
- Real memory layout visualization (Stack/Heap/BSS/DATA/TEXT for C)
- Step-by-step execution with variable tracking
- JS-specific: Event loop, prototype chain, scope chain, Promise visualization
- Java: JVM memory model with object references
- AI-powered explanations per execution step
- Interactive quizzes

**Tech stack:** React 19, Node.js/Fastify, PostgreSQL, Docker sandboxed execution

**Links:**
- Live: https://codeinsight.online
- GitHub: https://github.com/jammy0903/CodeInsight
- MIT licensed

Looking for feedback on the visualization approach and feature suggestions.

---

## r/webdev

**Title:** I built an open-source code visualizer with React 19 — shows memory, event loops, and execution step by step

**Body:**

Side project I've been working on: **CodeInsight** visualizes how code runs, specifically targeting the "I can write code but don't understand what's happening" problem.

The JavaScript visualizer is probably most relevant here — it shows:
- **Event loop** (call stack, microtask queue, macrotask queue)
- **Scope chain** and closures
- **Prototype chain**
- **Promise** resolution flow
- **`this` binding** in different contexts

Also supports C (full memory layout), Python, and Java.

Built with React 19 + Vite + TailwindCSS + Zustand on the frontend, Fastify + Prisma on the backend.

Free and open source: https://github.com/jammy0903/CodeInsight
Live: https://codeinsight.online

Would love feedback from the community.

---

## r/cscareerquestions (optional — career angle)

**Title:** I built an open-source code visualization platform as a portfolio project — got feedback?

**Body:**

I've been building CodeInsight as a solo full-stack project. It visualizes code execution (C/Python/JS/Java) step by step — showing memory layout, variables, and call stacks.

Tech: React 19, Node.js, PostgreSQL, Docker, TypeScript monorepo

Before I start applying to jobs, I wanted to get feedback:
1. Is this the kind of project that stands out in interviews?
2. What would you add to make it more impressive?
3. Any EdTech companies that might be interested in this?

Live: https://codeinsight.online
GitHub: https://github.com/jammy0903/CodeInsight

---

# Posting Tips

1. **Best times to post on Reddit:** Tuesday-Thursday, 8-10 AM EST (한국시간 밤 10시~자정)
2. **Don't post to all subreddits at once** — spread over 2-3 days
3. **Reply to every comment** within the first 2 hours
4. **Don't be overly promotional** — ask for feedback, be genuine
5. **Recommended order:** r/learnprogramming (Day 1) → r/programming (Day 2) → r/webdev (Day 3)
