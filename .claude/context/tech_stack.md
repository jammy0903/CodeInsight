# CodeInsight 기술 스택

## 🎯 전체 스택

| 영역 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **Frontend** | React | 18+ | UI 프레임워크 |
| | Vite | 5+ | 빌드 도구 |
| | TypeScript | 5.9+ | 타입 안정성 |
| | Framer Motion | 11+ | 애니메이션 |
| | TailwindCSS | 3+ | 스타일링 |
| | Zustand | - | 상태 관리 |
| **Backend** | Node.js | 18+ | 런타임 |
| | Express | 4+ | 웹 프레임워크 |
| | TypeScript | 5.9+ | 타입 안정성 |
| | Prisma | 5+ | ORM |
| **Database** | PostgreSQL | 15+ | 주 DB (Neon) |
| **Simulators** | GCC | - | C 컴파일러 |
| | Python | 3.10+ | Python 인터프리터 |
| | Node.js VM | - | JavaScript VM |
| | JDI | - | Java 디버거 |
| **Testing** | Vitest | 4+ | 단위 테스트 |
| | Playwright | - | E2E 테스트 |
| **DevOps** | Docker | - | 컨테이너화 |
| | Railway | - | 호스팅 |

---

## 🔌 주요 라이브러리

### Frontend Dependencies
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "framer-motion": "^11.x",
  "zustand": "^4.x",
  "tailwindcss": "^3.4.0",
  "lucide-react": "^0.x",
  "@monaco-editor/react": "^4.x"
}
```

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "@prisma/client": "^5.x",
  "zod": "^3.x",
  "dotenv": "^16.0.0"
}
```

---

## 📦 패키지 구조

### monorepo 구성 (pnpm workspaces)
```
codeinsight-monorepo/
├── packages/
│   ├── frontend/              # React 앱
│   │   ├── src/
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── backend/               # Node.js API
│   │   ├── src/
│   │   ├── prisma/schema.prisma
│   │   └── package.json
│   │
│   ├── shared/                # 공유 타입
│   │   ├── src/
│   │   │   ├── types.ts
│   │   │   └── schemas.ts
│   │   └── package.json
│   │
│   └── simulators/            # 언어별 시뮬레이터
│       ├── c/
│       ├── python/
│       ├── javascript/
│       ├── java/
│       └── package.json
│
├── pnpm-workspace.yaml
└── package.json
```

---

## 🔧 개발 환경

### 필수 도구
- **Node.js**: 18 이상
- **pnpm**: 8 이상
- **Git**: 기본 설정
- **Docker** (선택): 로컬 DB 실행

### 로컬 개발 세팅
```bash
# 1. 클론
git clone https://github.com/jammy0903/CodeInsight.git
cd CodeInsight

# 2. 의존성 설치
pnpm install

# 3. 환경 변수 설정
cp .env.example .env

# 4. DB 마이그레이션 (선택)
cd packages/backend
pnpm prisma migrate dev

# 5. 개발 서버 시작
cd ../../
pnpm dev
```

---

## 🚀 빌드 및 배포

### 빌드 프로세스
```bash
# 전체 빌드
pnpm build

# 결과
packages/frontend/dist/        # HTML + JS + CSS
packages/backend/dist/         # Node.js 실행 가능
```

### 환경별 설정
```
.env              # 로컬 개발 (git ignored)
.env.production   # 프로덕션 (Railway env vars)
.env.staging      # 스테이징 (테스트)
```

---

## 🔌 API 버저닝

### 현재 버전
```
GET /api/v1/health
POST /api/v1/execute
GET /api/v1/lessons
```

### 향후 확장
```
/api/v2/...  # 새 버전 호환성 유지
```

---

## 📱 프론트엔드 기술 상세

### 상태 관리 (Zustand)
```typescript
// stores/usePlaygroundStore.ts
interface PlaygroundStore {
  code: string;
  language: 'c' | 'python' | 'js' | 'java';
  steps: ExecutionStep[];
  currentStep: number;
  setCode: (code: string) => void;
  execute: () => Promise<void>;
}
```

### 애니메이션 (Framer Motion)
- 단계별 전환: variants 기반
- 메모리 업데이트: spring animation
- 모달 진입/이탈: 스케일 + 페이드

### 스타일링 (TailwindCSS)
- 다크모드 지원
- 반응형 디자인
- 커스텀 색상 팔레트

---

## 🔧 백엔드 기술 상세

### Express 미들웨어
```typescript
// 인증, 에러 처리, CORS, 로깅
app.use(cors());
app.use(express.json());
app.use(errorHandler);
```

### Prisma ORM
```prisma
// 타입 안전한 데이터베이스 쿼리
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { lessons: true }
});
```

### 에러 처리
```typescript
// 중앙화된 에러 처리
try {
  // 비즈니스 로직
} catch (error) {
  handleError(error);  // 자동 분류 및 응답
}
```

---

## 📊 성능 메트릭 목표

| 메트릭 | 목표 | 현재 |
|--------|------|------|
| Frontend Bundle | < 500KB | - |
| 초기 로딩 시간 | < 2초 | - |
| API 응답 시간 | < 500ms | - |
| 시뮬레이터 실행 | < 5초 | - |

---

## 🔒 보안 기술

### 인증
- JWT 토큰 (Bearer)
- HttpOnly 쿠키 (향후)

### 인가
- Role-based Access Control (RBAC)
- User → Lesson → Submission 소유권 검증

### 데이터 보호
- HTTPS (프로덕션)
- SQL Injection 방지 (Prisma)
- XSS 방지 (React)

---

## 🧪 테스트 구성

### 단위 테스트 (Vitest)
```
packages/frontend/__tests__/
packages/backend/__tests__/
```

### E2E 테스트 (Playwright)
```
packages/frontend/e2e/tests/
```

### 실행
```bash
pnpm test              # 모든 테스트
pnpm --filter frontend test
pnpm --filter backend test
```

---

## 🔄 CI/CD 파이프라인

### GitHub Actions
- 푸시 시 테스트 자동 실행
- PR 병합 전 빌드 검증
- Railway 자동 배포

---

## 📚 학습 리소스

### 공식 문서
- [React 18](https://react.dev)
- [Vite](https://vitejs.dev)
- [Prisma](https://www.prisma.io)
- [Express](https://expressjs.com)

### 커뮤니티
- [React Korea](https://github.com/reactjs)
- [Node.js](https://nodejs.org)
