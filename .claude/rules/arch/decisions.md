# Architecture Decision Records

## ADR-001: TypeRegistry for C Types
- Date: 2026-01-11
- Status: Implemented
- Decision: Centralized type registry instead of per-handler type logic
- Why: Single source of truth, easier to extend
- Tradeoff: Slight indirection

## ADR-002: Handler Priority System
- Date: 2026-01-11
- Status: Implemented
- Decision: Priority-based handler matching
- Why: Specific handlers (malloc) before generic (variable)
- Tradeoff: Order matters, can be confusing

## ADR-003: Multi-language Architecture
- Date: 2026-01-08
- Status: Planning
- Decision: shared/ + languages/{c,python,java}/ + adapters/
- Why: Code reuse, consistent interface
- See: docs/architecture/FILE_STRUCTURE.md
