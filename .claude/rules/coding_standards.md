# CodeInsight 코딩 규칙

## 🎨 Frontend 규칙

### TypeScript
```typescript
// ✅ Good
interface User {
  id: number;
  name: string;
  email: string;
}

const handleSubmit = async (data: SubmitData): Promise<void> => {
  // ...
};

// ❌ Bad
const handleSubmit: any = (data) => {
  // ...
};
```

### React 컴포넌트
```typescript
// ✅ Good - 파일명: UserCard.tsx
interface UserCardProps {
  user: User;
  onEdit: (id: number) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      {/* ... */}
    </div>
  );
};

// ❌ Bad - 파일명: usercard.tsx
export default function usercard(props) {
  return <div>{props.name}</div>;
}
```

### 폴더 구조
- `components/` - 재사용 가능한 UI (Button, Input, Card)
- `features/` - 페이지 수준 컴포넌트 (PlaygroundPage)
- `stores/` - Zustand 스토어
- `services/` - API, 외부 통신
- `utils/` - 순수 함수

### Styling (TailwindCSS)
```typescript
// ✅ Good
<div className="flex items-center justify-between gap-4 p-4 bg-slate-100 rounded-lg">
  {/* ... */}
</div>

// ❌ Bad - 인라인 스타일 금지
<div style={{ display: 'flex', justifyContent: 'space-between' }}>
  {/* ... */}
</div>
```

### 상태 관리 (Zustand)
```typescript
// ✅ Good
const useStore = create<State>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// ❌ Bad - 비동기 로직이 스토어에
const useStore = create((set) => ({
  fetchData: async () => {
    const data = await fetch(...);
  },
}));
```

### 에러 처리
```typescript
// ✅ Good
try {
  const response = await executeCode(code);
  return response;
} catch (error) {
  handleSimulatorError('C', error);
}

// ❌ Bad - console.error 금지
catch (error) {
  console.error(error);
}
```

---

## ⚙️ Backend 규칙

### TypeScript
```typescript
// ✅ Good
interface ExecuteRequest {
  code: string;
  language: string;
}

const executeCode = async (req: ExecuteRequest): Promise<ExecuteResponse> => {
  // ...
};

// ❌ Bad
const executeCode = (req) => {
  // ...
};
```

### Express 라우터
```typescript
// ✅ Good
router.post(
  '/execute',
  validateInput(executeSchema),
  authenticate,
  (req, res) => {
    // ...
  }
);

// ❌ Bad
router.post('/execute', (req, res) => {
  if (!req.body.code) {
    res.status(400).send('error');
  }
  // ...
});
```

### 에러 처리
```typescript
// ✅ Good
throw new ValidationError('Invalid code', { code: 'INVALID_CODE' });

// ❌ Bad
throw new Error('Invalid code');
```

### Prisma 사용
```typescript
// ✅ Good
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: { id: true, name: true }, // 필요한 필드만
});

// ❌ Bad
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { submissions: { include: { ... } } }, // 과도한 관계 로드
});
```

### 환경 변수
```typescript
// ✅ Good
const config = {
  databaseUrl: process.env.DATABASE_URL,
  nodeEnv: process.env.NODE_ENV,
};

// ❌ Bad - 하드코드 금지
const databaseUrl = 'postgresql://localhost/db';
```

---

## 📁 Import 경로

### Alias 사용
```typescript
// ✅ Good
import { ExecuteService } from '@/services/execute';
import { User } from '@codeinsight/shared';

// ❌ Bad
import { ExecuteService } from '../../../services/execute';
import { User } from '../../shared';
```

### TypeScript paths (tsconfig.json)
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@codeinsight/*": ["../../shared/*"]
    }
  }
}
```

---

## ✅ 커밋 메시지

```bash
# ✅ Good
git commit -m "feat: Add code step navigator component"
git commit -m "fix: Handle subprocess timeout error"
git commit -m "refactor: Extract API client to service layer"

# ❌ Bad
git commit -m "update"
git commit -m "fixed bug"
git commit -m "wip"
```

### 포맷
```
<type>: <subject>

<body>

<footer>
```

**type**: feat, fix, refactor, style, test, docs, chore

---

## 🧪 테스트

### 네이밍
```typescript
// ✅ Good
describe('CodeEditor', () => {
  it('should highlight syntax errors', () => {
    // ...
  });

  it('should not render when hidden prop is true', () => {
    // ...
  });
});

// ❌ Bad
describe('test', () => {
  it('works', () => {
    // ...
  });
});
```

### 커버리지
- 최소 80% 목표
- 비즈니스 로직 우선

---

## 📝 주석

### 언제 다는가
```typescript
// ✅ Good - 왜(Why)를 설명
// 시뮬레이터 결과가 대용량이므로 스트리밍 처리
const stream = fs.createReadStream(resultFile);

// ❌ Bad - 자명한 코드에 주석
// userId를 가져온다
const userId = user.id;
```

---

## 🔄 코드 리뷰 체크리스트

### Frontend PR
- [ ] TypeScript 타입 오류 없음
- [ ] TailwindCSS만 사용 (인라인 스타일 없음)
- [ ] 에러는 Toast로 표시
- [ ] 로딩 상태 처리됨
- [ ] 모바일 반응형 확인
- [ ] 테스트 커버리지 80% 이상

### Backend PR
- [ ] 입력 검증 (Zod)
- [ ] 에러 처리 (try-catch)
- [ ] 데이터베이스 쿼리 최적화
- [ ] 환경 변수 사용
- [ ] 테스트 작성됨

---

## 🚀 성능 가이드

### Frontend
- 번들 크기 < 500KB
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### Backend
- API 응답 < 500ms
- 데이터베이스 쿼리 < 100ms
- 시뮬레이터 실행 < 5s
