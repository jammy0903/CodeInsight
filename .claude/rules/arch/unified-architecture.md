# 통합 아키텍처 원칙

> **WHY**: Admin 페이지와 C Simulator가 같은 설계 원칙 적용
> **RESULT**: 일관된 코드 구조, 학습 곡선 감소, 유지보수성 향상

---

## 🎯 공통 설계 원칙

| 원칙 | Admin 예시 | Simulator 예시 | 설명 |
|------|-----------|---------------|------|
| **Single Responsibility** | UsersSection은 사용자 UI만 | ExpressionEvaluator는 식 평가만 | 한 파일은 한 가지 일만 |
| **Dependency Injection** | Hook을 Section에 주입 | Evaluator를 Handler에 주입 | 의존성을 외부에서 주입 |
| **Composition over Inheritance** | DataTable + BaseModal 조합 | Evaluator + ParameterSetup 조합 | 상속보다 조합 선호 |
| **DRY (Don't Repeat Yourself)** | DataTable 재사용 | ExpressionEvaluator 재사용 | 중복 코드 제거 |
| **Separation of Concerns** | UI / 로직 / 데이터 분리 | 파싱 / 평가 / 실행 분리 | 관심사 분리 |

---

## 📊 패턴 비교표

### 1. 파일 크기 감소

| 모듈 | Before | After | 감소율 |
|------|--------|-------|--------|
| **AdminPage.tsx** | 367 lines | ~100 lines | **-73%** |
| **simulator.ts** | 906 lines | ~200 lines | **-78%** |

### 2. 모듈 분리 패턴

```
Admin (UI Layer)                  Simulator (Logic Layer)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AdminPage.tsx (orchestrator)      simulator.ts (orchestrator)
├── sections/                     ├── evaluator/
│   ├── UsersSection              │   ├── ExpressionEvaluator
│   ├── StatsSection              │   └── operators/
│   └── SystemSection             │
├── components/                   ├── execution/
│   ├── DataTable                 │   ├── FunctionExecutor
│   ├── BaseModal                 │   ├── ParameterSetup
│   └── SearchInput               │   └── FrameManager
├── hooks/                        ├── handlers/
│   ├── useUserManagement         │   ├── pointer.handler
│   └── useAdminStats             │   └── variable.handler
├── services/                     └── runtime/
│   └── users.api.ts                  └── call-stack.ts
```

**공통 구조**:
- **Orchestrator** (얇게 유지): AdminPage, simulator.ts
- **큰 블록** (독립 기능): sections/, execution/
- **재사용 유닛** (범용): components/, evaluator/
- **로직 분리** (비즈니스): hooks/, handlers/
- **외부 연동** (I/O): services/, runtime/

---

## 🔥 핵심 패턴 적용 예시

### Pattern 1: 공통 유틸 추출

#### Admin: DataTable (범용 테이블)
```typescript
// ❌ Before: 테이블 로직 3번 복사
<UserTable />      // 200 lines
<SubmissionTable /> // 200 lines
<ProgressTable />   // 200 lines

// ✅ After: DataTable 1개 재사용
<DataTable data={users} columns={userColumns} />
<DataTable data={submissions} columns={subColumns} />
<DataTable data={progress} columns={progColumns} />
```

#### Simulator: ExpressionEvaluator (식 평가)
```typescript
// ❌ Before: 식 평가 로직 각 핸들러마다 복사
pointer.handler.ts:   const value = parseInt(expr);
variable.handler.ts:  const value = parseInt(expr);
array.handler.ts:     const value = parseInt(expr);

// ✅ After: Evaluator 1개 재사용
const result = evaluator.evaluate(expr);  // 모든 핸들러에서 사용
```

---

### Pattern 2: Dependency Injection

#### Admin: Hook 주입
```typescript
// sections/UsersSection.tsx
export function UsersSection() {
  const { users, updateNickname, deleteUser } = useUserManagement(); // DI

  return <DataTable data={users} />;
}
```

#### Simulator: Evaluator 주입
```typescript
// handlers/pointer.handler.ts
export function handlePointer(ctx: SimContext, ...) {
  const evalResult = ctx.evaluator.evaluate('&x');  // DI

  // evalResult 사용
}
```

**공통점**: 외부에서 주입받아 사용 → 테스트 용이, 결합도 낮음

---

### Pattern 3: Strategy Pattern (타입별 분기)

#### Admin: 테이블 컬럼 전략
```typescript
const userColumns: Column<UserInfo>[] = [
  { key: 'nickname', render: (v) => <Avatar name={v} /> },
  { key: 'role', render: (v) => <RoleBadge role={v} /> },
];

const submissionColumns: Column<Submission>[] = [
  { key: 'verdict', render: (v) => <VerdictBadge verdict={v} /> },
];

// DataTable은 columns 전략에 따라 렌더링
<DataTable columns={userColumns} />
```

#### Simulator: 파라미터 타입별 전략
```typescript
setup(param: { type: string }, arg: string): Result {
  if (param.type.includes('*')) {
    return this.setupPointerParam(param, arg);
  }
  if (param.type.includes('[')) {
    return this.setupArrayParam(param, arg);
  }
  return this.setupValueParam(param, arg);
}

// ParameterSetup은 타입에 따라 전략 선택
```

**공통점**: 조건별 다른 전략 → 새 타입 추가 시 전략만 추가

---

## 📐 계층 구조

### Admin (3계층)
```
Presentation (UI)
├── Sections        ← 페이지 블록
└── Components      ← 재사용 UI

Logic (Business)
├── Hooks           ← State + 비즈니스 로직
└── Utils           ← 순수 함수

Data (I/O)
└── Services        ← API 호출
```

### Simulator (3계층)
```
Orchestration (진입점)
└── simulator.ts    ← 얇은 진입점

Business Logic (핵심)
├── evaluator/      ← 식 평가
├── execution/      ← 함수 실행
└── handlers/       ← 라인별 처리

Infrastructure (기반)
├── runtime/        ← 메모리, 스택
└── parser/         ← 코드 파싱
```

**공통점**: 3계층 분리 → 각 계층 독립 테스트 가능

---

## 🚀 확장 시나리오 비교

### Admin: "진도 초기화" 기능 추가

```
1. ResetProgressModal.tsx 생성 (BaseModal 사용)  - 30분
2. useUserManagement에 resetProgress 추가       - 15분
3. UsersSection에서 버튼 연결                    - 10분
───────────────────────────────────────────────────────
총 1시간 (기존 4시간 → 75% 단축)
```

### Simulator: "함수 포인터" 기능 추가

```
1. evaluator/operators/function-ptr.ts 생성      - 30분
2. ParameterSetup에 전략 추가                    - 20분
3. ExpressionEvaluator에 케이스 추가             - 10분
───────────────────────────────────────────────────────
총 1시간 (기존 4시간 → 75% 단축)
```

**공통점**: 새 기능 추가 시간 75% 단축 (기존 코드 수정 최소화)

---

## 🎨 공통 파일 명명 규칙

| 타입 | Admin 예시 | Simulator 예시 | 규칙 |
|------|-----------|---------------|------|
| **진입점** | AdminPage.tsx | simulator.ts | 도메인명 + Page/ts |
| **큰 블록** | UsersSection.tsx | function-executor.ts | 명사 + Section/ts |
| **재사용 컴포넌트** | DataTable.tsx | expression-evaluator.ts | 명사 (범용명) |
| **로직 모듈** | useUserManagement.ts | parameter-setup.ts | 동사 + 명사 |
| **API/I/O** | users.api.ts | call-stack.ts | 명사.api/ts |
| **타입** | admin.types.ts | runtime/types.ts | 도메인.types.ts |

---

## 📝 폴더 구조 규칙

### 공통 규칙
```
feature-name/
├── index.ts                  # Public exports만
├── {Name}Page.tsx / main.ts  # 진입점 (얇게)
├── large-blocks/             # 큰 기능 블록 (독립적)
├── reusable/                 # 재사용 가능 유닛 (범용)
├── logic/                    # 비즈니스 로직 (순수 함수)
├── external/                 # 외부 연동 (API, DB, I/O)
├── types/                    # TypeScript 타입
└── utils/                    # 유틸 함수
```

### Admin 적용
```
admin/
├── index.ts
├── AdminPage.tsx             ← 진입점
├── sections/                 ← large-blocks
├── components/               ← reusable
├── hooks/                    ← logic
├── services/                 ← external
├── types/
└── utils/
```

### Simulator 적용
```
simulators/c/
├── index.ts
├── simulator.ts              ← 진입점
├── execution/                ← large-blocks
├── evaluator/                ← reusable
├── handlers/                 ← logic
├── runtime/                  ← external
├── parser/                   ← external
└── types.ts
```

---

## ✅ 체크리스트 (새 모듈 추가 시)

### 1. 파일 크기
- [ ] 파일이 300줄 이하인가?
- [ ] 한 파일이 2개 이상 역할을 하지 않는가?

### 2. 재사용성
- [ ] 이 로직을 다른 곳에서도 쓸 수 있는가?
- [ ] 그렇다면 공통 모듈로 추출했는가?

### 3. 의존성
- [ ] 필요한 의존성을 외부에서 주입받는가?
- [ ] 하드코딩된 값이 없는가? (constants로 분리)

### 4. 테스트
- [ ] 이 모듈을 독립적으로 테스트할 수 있는가?
- [ ] Mock 없이 테스트 가능한가? (순수 함수 선호)

### 5. 타입
- [ ] types/ 폴더에 타입을 정의했는가?
- [ ] any 타입을 사용하지 않았는가?

---

## 🎯 마이그레이션 우선순위

| 우선순위 | 모듈 | 이유 | 예상 시간 |
|---------|------|------|----------|
| **P0** | Admin 공통 컴포넌트 | 즉시 효과, 낮은 위험 | 5시간 |
| **P0** | Simulator Evaluator | 버그 많음, 재사용 필요 | 8시간 |
| **P1** | Admin Sections 분리 | 가독성 향상 | 4시간 |
| **P1** | Simulator Execution 분리 | 테스트 용이성 | 6시간 |
| **P2** | Admin Services 분리 | API 변경 시 편함 | 3시간 |
| **P2** | Simulator Handlers 개선 | Evaluator 먼저 필요 | 4시간 |

---

## 💡 통합 아키텍처의 장점

### 1. 학습 곡선 감소
- Admin 패턴을 익히면 → Simulator도 쉽게 이해
- 일관된 폴더 구조 → 파일 찾기 쉬움

### 2. 코드 리뷰 효율
- 같은 패턴 반복 → 리뷰어가 익숙함
- "이건 왜 Service로 안 뺐어?" 같은 질문 감소

### 3. 버그 추적 용이
- 문제 발생 시 계층별 격리 → 원인 파악 빠름
- 예: "API 문제? services/ 확인", "UI 버그? components/ 확인"

### 4. 신입 온보딩 시간 단축
- 한 번 패턴 설명 → 모든 모듈 이해
- "이 프로젝트는 3계층 구조야" → 끝

---

## 🚨 안티패턴 (피해야 할 것)

### ❌ God Component/Module
```typescript
// AdminPage.tsx - 1000 lines
// - API 호출
// - State 관리
// - UI 렌더링
// - 유효성 검증
// - 포맷팅
```

### ❌ 과도한 추상화
```typescript
// 모든 것을 받는 범용 컴포넌트
<GenericComponent
  type="user|stats|submission"
  mode="view|edit|delete"
  config={...}
  data={...}
  handlers={...}
/>
```

### ❌ 순환 참조
```typescript
// services/users.api.ts
import { UsersSection } from '../sections/UsersSection';

// sections/UsersSection.tsx
import { usersApi } from '../services/users.api';
```

### ✅ 올바른 방향
- 작은 파일 (200~300줄)
- 명확한 책임 (한 가지 일만)
- 단방향 의존성 (상위 → 하위)

---

## 📚 참고 문서

- React Architecture: https://react.dev/learn/thinking-in-react
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID
- Design Patterns: https://refactoring.guru/design-patterns

---

## 🎓 다음 단계

1. ✅ 통합 아키텍처 가이드 작성 (현재 문서)
2. ⏳ Admin 리팩토링 실행 (docs/plans/ADMIN_ARCHITECTURE.md)
3. ⏳ Simulator 리팩토링 실행 (사용자 제안안 기반)
4. ⏳ 다른 모듈도 같은 패턴 적용 (Courses, Quiz, etc.)

**목표**: 모든 모듈이 같은 설계 원칙 따르기 → 일관된 코드베이스
