# Architecture Patterns

## Handler Pattern (Memory Simulator)
```typescript
interface CodeHandler {
  name: string;
  priority: number;
  canHandle(code: string): boolean;
  handle(code: string, state: State): Result;
}
```
- Higher priority = checked first
- First matching handler wins

## Registry Pattern
```typescript
class TypeRegistry {
  register(type: TypeInfo): void;
  get(typeName: string): TypeInfo | undefined;
}
```
- Centralized type management
- Singleton instance

## Feature Slice Pattern (Frontend)
- Each feature is self-contained
- Minimal cross-feature imports
- Shared code in `components/` or `hooks/`
