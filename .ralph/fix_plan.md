# CodeInsight Platform Completion Plan

## Phase D: Bug Fixes & Cleanup (do FIRST) ✅ COMPLETE
- [x] #18 FIX: Simulators generate blank line steps → state misalignment (fix ALL 4 simulators)
- [x] #19 CLEANUP: Remove stale config endpoints (frontend config/index.ts)
- [x] #20 CLEANUP: Register submissions routes in backend app.ts
- [x] #21 FIX: Broken legacy redirect /api/c → /api/v1/simulators/c

## Phase A: Quick Wins + Verification
- [ ] #1 Verify Python Core lessons (py-1-1 ~ py-1-5) — 5 files
- [ ] #6 C: Enable GDB/MI tracer (USE_GDB_TRACER=true)
- [ ] #2 Verify Python Practical lessons (py-practical-*) — 13 files
- [ ] #7 Python Phase 1: return/exception handlers (41%→63%)

## Phase B: JS Gaps
- [ ] #3a Verify JS lessons group A (js-1 ~ js-3) — ~12 files
- [ ] #9 JS: Promise/async-await tracer
- [ ] #3b Verify JS lessons group B (js-4 ~ js-6) — ~9 files
- [ ] #10 JS: Generator yield/resume support
- [ ] #11 JS: Prototype chain visualization
- [ ] #3c Verify JS lessons group C (js-7 ~ js-9) — ~10 files
- [ ] #12 JS: Proxy/Reflect handler tracing

## Phase C: Java Gaps
- [ ] #4a Verify Java lessons group A (java-1 ~ java-4) — ~17 files
- [ ] #13 Java: Generics visualizer (type erasure demo)
- [ ] #4b Verify Java lessons group B (java-5 ~ java-7) — ~13 files
- [ ] #14 Java: Collections internal view (HashMap, LinkedList)
- [ ] #4c Verify Java lessons group C (java-8 ~ java-10) — ~12 files
- [ ] #15 Java: GC simulation (simplified heap model)
- [ ] #16 Java: Thread state tracker

## Phase E: Final Polish
- [ ] #5 Re-verify C lessons — 46 files
- [ ] #8 Python Phase 2: lambda, decorator, kwargs (63%→80%)
- [ ] #17 Python Phase 3: Generator + async (80%→91%)

---

## Lesson-Only Concepts (Cannot Simulate)

These stay in Lesson mode only. Add UI indicator for users:
- JS Ch.7: V8 Hidden Classes, Inline Caching
- JS Ch.8: Browser rendering pipeline, rAF
- Java Ch.9: Real JVM GC algorithm internals (simplified version IS feasible)
- Java Ch.10: True concurrent thread scheduling (deterministic demo IS feasible)

## Common Verification Issues to Watch For

1. **Wrong line numbers** - blank lines/comments shift line numbers
2. **Missing intermediate steps** - variable assignments without a step
3. **Output not cumulative** - output[] should grow, not reset
4. **Stack/heap inconsistency** - variables disappearing between steps
5. **Wrong execution order** - especially function calls and loops
6. **highlight[] mismatch** - highlight doesn't match step.line

## Learnings (update as you go)

1. **C regex simulator already handles blank lines** at `simulator.ts:458` with `if (!stripped) continue`
2. **C GDB tracer did NOT handle blank lines** - fixed in `gdb-tracer.ts:collectAndBuildStep()`
3. **Python/JS/Java simulators**: blank line filter added to `processSnapshots()` / post-processing
4. **Frontend stale endpoints**: `cRun`, `cJudge`, `memoryTrace`, `problems`, `submissions` were never referenced in code
5. **submissions/routes.ts** was valid Fastify code but never imported/registered in app.ts
