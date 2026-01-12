# TypeScript Rules

## FORBIDDEN
- `any` type
- `@ts-ignore` without explanation
- Implicit any

## REQUIRED
- Explicit return types for exported functions
- Interface over type for objects
- Zod for runtime validation

## Patterns
```typescript
// Good
interface UserProps {
  name: string;
  age: number;
}

// Bad
type UserProps = {
  name: any;
}
```

---

## Zod 스키마 관리 규칙 (Single Source of Truth)

### 핵심 원칙

**Zod 스키마에서 타입 추론 (z.infer 패턴)**

```typescript
// ✅ GOOD: 스키마에서 타입 추론 (한 곳에서 관리)
// schemas/course.ts
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});
export type User = z.infer<typeof UserSchema>;

// types/course.ts에서 re-export
export type { User } from '../schemas/course';

// ❌ BAD: 별도 정의 (동기화 문제 발생)
// types/user.ts
interface User { id: string; name: string; }
// schemas/user.ts
const UserSchema = z.object({ id: z.string(), name: z.string() });
// → 필드 추가 시 두 곳 모두 수정 필요 → 실수 발생!
```

### 왜 Single Source가 필요한가?

| 문제 | 원인 | 결과 |
|------|------|------|
| 런타임 Zod 에러 | 스키마만 수정, 타입은 안 수정 | API 응답 검증 실패 |
| 컴파일 OK, 런타임 실패 | TypeScript는 컴파일 타임만 검증 | 배포 후 에러 발견 |
| 필드 누락 | enum에 새 값 추가 시 스키마 수정 누락 | Invalid option 에러 |

### 체크리스트

| 상황 | 해야 할 것 |
|------|-----------|
| **API 응답 필드 추가** | 1. Zod 스키마에 필드 추가 → 타입 자동 추론됨 |
| **필드 삭제** | 1. Zod 스키마에서 삭제 → 2. 사용처 확인 (컴파일 에러로 감지) |
| **optional ↔ required 변경** | `.optional()` 추가/제거 |
| **enum 값 추가** | `z.enum([...])` 배열에 새 값 추가 |
| **새 타입 추가** | 1. schemas/ 에 스키마 작성 → 2. `z.infer` 타입 export → 3. types/에서 re-export |

### 프로젝트 구조

```
packages/shared/src/
├── schemas/
│   └── course.ts     ← Zod 스키마 + z.infer 타입 정의
└── types/
    └── course.ts     ← re-export (스키마 없는 타입만 직접 정의)
```

### 예외: 스키마 없이 타입만 있는 경우

아직 API 검증이 필요 없는 내부 타입:
- Python 시각화 타입 (Phase 4 미완성)
- 유틸리티 타입 (LessonQuery, ChapterQuery)
- 레거시 타입 (향후 제거 예정)

```typescript
// types/course.ts - 스키마 없는 타입은 직접 정의
export interface PythonMemoryState {
  names: PythonName[];
  objects: PythonObject[];
}
// TODO: Python 시뮬레이터 완성 시 스키마로 이동
```

### 리팩토링 시 주의사항

1. **스키마 수정 후 반드시 빌드**: `pnpm --filter @codeinsight/shared build`
2. **프론트엔드 타입 확인**: `npx tsc --noEmit`
3. **브라우저 콘솔 확인**: ZodError 여부 체크
