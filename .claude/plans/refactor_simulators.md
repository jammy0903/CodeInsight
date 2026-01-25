# Refactoring Plan: Unifying Simulator Modules

> **상태**: ✅ **완료** (2026-01-26)
>
> Python, JavaScript 시뮬레이터가 디버거 기반으로 재구현되었습니다.
> - Python: `sys.settrace()` 기반
> - JavaScript: Node.js `vm` 모듈 + AST 계측
> - 공통 4단계 파이프라인: Setup → Compile → Debug → Cleanup

## 🎯 Goal
Consolidate all language simulator-related backend modules under a unified `packages/backend/src/modules/simulators/` directory for improved clarity, consistency, and maintainability.

## 📈 Current State (Problem)
C-language related functionalities are fragmented across three locations:
- `packages/backend/src/modules/c/`: Legacy C code executor.
- `packages/backend/src/modules/memory/`: Legacy C memory simulator.
- `packages/backend/src/modules/simulators/c/`: Newer, more comprehensive C simulator.

This fragmentation leads to:
- Lack of consistency and poor discoverability for C-language features.
- Potential for duplication and confusion regarding which module to use.
- Reliance on implicit knowledge for developers to understand the module roles.

## ✅ Proposed Unified Structure
All language simulator modules will reside under `packages/backend/src/modules/simulators/`.

```
packages/backend/src/modules/
├── simulators/
│   ├── c/         # Unified C-language simulator module
│   │   ├── runtime/
│   │   ├── executor/  # To house relevant logic from old `modules/c`
│   │   └── memory/    # To house relevant logic from old `modules/memory`
│   ├── java/
│   ├── javascript/
│   └── python/
└── ... (other modules)
```

## 🚀 Refactoring Steps

### Phase 1: Dependency Analysis
1.  **Identify Frontend Dependencies**: Analyze `packages/frontend/src/services/simulator.ts` to understand how it interacts with `/api/memory/trace` and `/c/run`.
    *   Current finding: `simulator.ts` uses `/memory/trace` for C-language memory simulation and `/c/run` for C-language code execution.
2.  **Identify Backend Route Conflicts/Usage**: Investigate `packages/backend/src/modules/memory/routes.ts` and `packages/backend/src/modules/simulators/c/routes.ts` to understand their respective roles for `/api/memory/trace`.
3.  **Identify Internal Backend Dependencies**: Search for any internal backend modules or files importing from `packages/backend/src/modules/c/` or `packages/backend/src/modules/memory/`.

### Phase 2: Code Migration & Consolidation
1.  **Evaluate Existing Simulators**:
    *   Determine if the new `packages/backend/src/modules/simulators/c/` can fully replace the functionalities of `packages/backend/src/modules/c/` and `packages/backend/src/modules/memory/`.
    *   If not a direct replacement, identify specific functions/logic from the legacy modules that are still required.
2.  **Migrate Functionalities**:
    *   Move necessary code (files, functions, types) from `packages/backend/src/modules/c/` into a new `executor/` subdirectory within `packages/backend/src/modules/simulators/c/`. Use `git mv` to preserve history.
    *   Move necessary code from `packages/backend/src/modules/memory/` into a new `memory/` subdirectory within `packages/backend/src/modules/simulators/c/`. Use `git mv` to preserve history.
3.  **Update Import Paths**: For all files identified in Phase 1 (frontend and backend), update their import paths to point to the new consolidated locations under `packages/backend/src/modules/simulators/c/`.

### Phase 3: Route Refactoring
1.  **Consolidate Routes**: Ensure that the unified C simulator module (`packages/backend/src/modules/simulators/c/`) handles all C-related API routes (e.g., `/api/memory/trace`, `/c/run`, and any new ones).
2.  **Update `app.ts`**: Modify `packages/backend/src/app.ts` to register only the unified C simulator routes and remove references to the old `c` and `memory` modules.

### Phase 4: Cleanup & Verification
1.  **Remove Legacy Modules**: Once all functionalities are migrated and all references are updated, remove the empty (or no longer needed) `packages/backend/src/modules/c/` and `packages/backend/src/modules/memory/` directories.
2.  **Comprehensive Testing**:
    *   Run all existing unit and integration tests.
    *   Manually test C-language code execution and memory simulation in the Playground to ensure full functionality.
    *   Verify that no 404 errors or console errors appear in the browser.
