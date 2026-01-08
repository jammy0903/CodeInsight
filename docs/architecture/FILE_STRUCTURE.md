# 📁 CodeInsight 프로젝트 파일 구조

> 작성일: 2026-01-04
> 목적: 전체 파일 구조 및 설계 패턴 문서화

---

## 🗂️ Backend (Node.js + Express + Prisma)

```
backend/
│
├── prisma/
│   ├── schema.prisma              # DB 스키마 정의 (User, Course, Lesson, Quiz 등)
│   ├── seed.ts                    # DB 시드 데이터 (C언어 10챕터 × 62레슨)
│   ├── crawl-solvedac.ts          # 백준 문제 크롤러 (레거시)
│   └── enrich-problems.ts         # 문제 데이터 보강 (레거시)
│
├── src/
│   ├── app.ts                     # Express 앱 진입점 (미들웨어, 라우터 등록)
│   │
│   ├── config/
│   │   ├── env.ts                 # 환경변수 검증 (Zod 스키마)
│   │   ├── database.ts            # Prisma Client 인스턴스
│   │   ├── firebase.ts            # Firebase Admin SDK 초기화
│   │   ├── swagger.ts             # Swagger API 문서 설정
│   │   └── index.ts               # Config 통합 export
│   │
│   ├── middleware/
│   │   ├── auth.ts                # Firebase 토큰 인증 미들웨어
│   │   ├── adminAuth.ts           # Admin 권한 체크 미들웨어
│   │   ├── rateLimit.ts           # Rate Limiting (요청 제한)
│   │   └── index.ts               # 미들웨어 통합 export
│   │
│   └── modules/
│       │
│       ├── users/
│       │   └── routes.ts          # 사용자 API (닉네임 확인, 등록, /me)
│       │
│       ├── admin/
│       │   ├── admin.routes.ts    # Admin API 라우터
│       │   ├── admin.service.ts   # Admin 비즈니스 로직 (통계, 설정)
│       │   └── admin.controller.ts# Admin 컨트롤러
│       │
│       ├── courses/               # 🆕 코스 시스템 (NEW!)
│       │   ├── routes.ts          # 코스 API 라우터
│       │   ├── service.ts         # 코스 비즈니스 로직
│       │   └── index.ts           # 모듈 export
│       │
│       ├── ai/
│       │   ├── routes.ts          # AI 해설자 API (/chat)
│       │   ├── settings.ts        # AI Provider 설정 관리
│       │   └── providers/
│       │       ├── types.ts       # AI Provider 인터페이스
│       │       ├── ollama.provider.ts   # Ollama (qwen2.5-coder)
│       │       ├── deepseek.provider.ts # DeepSeek API
│       │       ├── gemini.provider.ts   # Google Gemini
│       │       └── index.ts       # Provider 팩토리 패턴
│       │
│       ├── c/
│       │   ├── executor.ts        # C 코드 실행 (Docker sandbox)
│       │   ├── executor.test.ts   # 보안 패턴 테스트 (vitest)
│       │   └── routes.ts          # C 실행 API (/run)
│       │
│       ├── memory/
│       │   ├── simulator.ts       # 메모리 시뮬레이터 (AST 분석)
│       │   ├── routes.ts          # 메모리 트레이스 API
│       │   ├── types/
│       │   │   └── ast.types.ts   # AST 노드 타입
│       │   └── handlers/          # 타입별 메모리 처리
│       │       ├── int.handler.ts      # int 변수
│       │       ├── pointer.handler.ts  # 포인터
│       │       ├── array.handler.ts    # 배열
│       │       ├── malloc.handler.ts   # 동적 메모리
│       │       ├── io.handler.ts       # printf
│       │       ├── types.ts            # Handler 타입
│       │       └── index.ts
│       │
│       ├── problems/
│       │   └── routes.ts          # 문제 API (레거시)
│       │
│       └── submissions/
│           └── routes.ts          # 제출 API (레거시)
│
├── data/
│   └── ai-settings.json           # AI Provider 설정 파일
│
├── package.json
├── tsconfig.json
└── vitest.config.ts               # 테스트 설정
```

---

## 🎨 Frontend (React + TypeScript + Zustand)

```
frontend/
│
├── src/
│   ├── main.tsx                   # React 앱 진입점
│   ├── router.tsx                 # React Router 설정
│   ├── index.css                  # Tailwind CSS import
│   │
│   ├── config/
│   │   ├── env.ts                 # 환경변수 (Vite import.meta.env)
│   │   ├── theme.ts               # 다크/라이트 테마 설정
│   │   └── index.ts
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── ... (13개)
│   │   │
│   │   ├── NicknameModal.tsx      # 닉네임 등록 모달
│   │   ├── PixelAvatar.tsx        # 픽셀 아트 아바타
│   │   └── ThemeToggle.tsx        # 다크/라이트 토글
│   │
│   ├── layouts/
│   │   ├── MainLayout.tsx         # 전체 레이아웃 (TopBar + Sidebar + Content)
│   │   ├── TopBar.tsx             # 상단 네비게이션
│   │   ├── Sidebar.tsx            # 좌측 사이드바
│   │   └── components/
│   │       └── UserMenu.tsx       # 사용자 메뉴 (로그아웃, 프로필)
│   │
│   ├── features/                  # Feature-based 구조 (Domain-Driven)
│   │   │
│   │   ├── home/
│   │   │   ├── HomePage.tsx       # 홈 페이지
│   │   │   └── index.ts
│   │   │
│   │   ├── courses/               # 🎓 코스 학습 기능
│   │   │   ├── CoursesPage.tsx    # 언어 선택 페이지 (/courses)
│   │   │   ├── ChaptersPage.tsx   # 챕터 목록 (/courses/:lang)
│   │   │   ├── LessonsPage.tsx    # 레슨 목록 (/courses/:lang/:chapterId)
│   │   │   ├── LessonPage.tsx     # 레슨 학습 (/courses/:lang/:chapterId/:lessonId)
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── day/
│   │   │   │   │   ├── CodeViewer.tsx         # 코드 에디터 (Monaco)
│   │   │   │   │   ├── StepExplanation.tsx    # 스텝 설명
│   │   │   │   │   ├── StepControls.tsx       # 이전/다음 버튼
│   │   │   │   │   └── SelectedCodeBadge.tsx  # 선택된 코드 표시
│   │   │   │   └── memory/
│   │   │   │       └── CourseMemoryView.tsx   # 메모리 시각화 테이블
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useLessonNavigation.ts     # 스텝/퀴즈 네비게이션
│   │   │   │   ├── useLessonMemory.ts         # 메모리 상태 계산
│   │   │   │   └── useCodeSelection.ts        # 코드 선택 상태
│   │   │   │
│   │   │   ├── types.ts           # 코스 관련 타입
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/                  # 💬 AI 해설자
│   │   │   ├── components/
│   │   │   │   ├── ChatQA.tsx             # Q&A 챗봇
│   │   │   │   └── MessageContent.tsx     # 메시지 렌더링 (마크다운)
│   │   │   ├── hooks/
│   │   │   │   └── useChatQA.ts           # 채팅 로직
│   │   │   └── index.ts
│   │   │
│   │   ├── visualizers/           # 🎨 메모리 시각화
│   │   │   └── c/
│   │   │       ├── constants.ts   # 색상, 애니메이션 설정
│   │   │       └── index.tsx      # C 메모리 시각화 컴포넌트
│   │   │
│   │   └── admin/                 # 🔧 관리자 페이지
│   │       ├── AdminPage.tsx
│   │       ├── components/
│   │       │   ├── AdminRoute.tsx          # Admin 권한 체크
│   │       │   └── AIProviderToggle.tsx    # AI Provider 전환
│   │       └── index.ts
│   │
│   ├── services/                  # API 클라이언트
│   │   ├── api/
│   │   │   ├── axios.ts           # Axios 인스턴스 (인증 인터셉터)
│   │   │   ├── errors.ts          # 에러 핸들링
│   │   │   └── types.ts           # API 응답 타입
│   │   │
│   │   ├── courses.ts             # 코스 API 클라이언트
│   │   ├── ai.ts                  # AI 해설자 API
│   │   ├── crunner.ts             # C 코드 실행 API
│   │   ├── tracer.ts              # 메모리 트레이스 API
│   │   ├── user.ts                # 사용자 API
│   │   ├── admin.ts               # Admin API
│   │   └── firebase.ts            # Firebase Auth 초기화
│   │
│   ├── stores/
│   │   └── store.ts               # Zustand 전역 상태 (firebaseUser, appUser)
│   │
│   ├── types/
│   │   ├── index.ts               # 공통 타입
│   │   ├── common.ts              # 기본 타입
│   │   ├── memory.ts              # 메모리 시각화 타입
│   │   └── course-schema.ts       # 코스 스키마 타입 (DB 1:1 매핑)
│   │
│   ├── hooks/
│   │   └── useTheme.ts            # 다크/라이트 테마 훅
│   │
│   ├── lib/
│   │   └── utils.ts               # 유틸리티 함수 (cn, 날짜 등)
│   │
│   └── styles/
│       └── theme.ts               # 테마 색상 정의
│
├── package.json
├── vite.config.ts                 # Vite 설정 (path alias @/)
└── tailwind.config.js             # Tailwind CSS 설정
```

---

## 🏗️ 디자인 설계 구조

### 1️⃣ 아키텍처 패턴

#### Backend: Layered Architecture (계층형 아키텍처)

```
┌─────────────────────────────────────┐
│  Routes (라우터)                     │ ← API 엔드포인트 정의
│  - URL 매핑                          │
│  - 요청/응답 검증                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Service (비즈니스 로직)              │ ← 핵심 로직
│  - 도메인 규칙                       │
│  - 트랜잭션 관리                      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Prisma ORM (데이터 접근)            │ ← DB CRUD
│  - 타입 안전 쿼리                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  SQLite Database                    │
└─────────────────────────────────────┘
```

**예시:**

```typescript
// routes.ts (Controller)
router.get('/lessons/:id', async (req, res) => {
  const lesson = await service.getLessonById(req.params.id);
  res.json(lesson);
});

// service.ts (Business Logic)
async function getLessonById(id: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id },
    include: { content: true, quizzes: true },
  });
  return lesson;
}
```

---

#### Frontend: Feature-Based Structure + Atomic Design

```
features/                    ← Domain별 모듈화
├── courses/
│   ├── CoursesPage.tsx      ← Page (라우트 컴포넌트)
│   ├── components/          ← Organisms (재사용 컴포넌트)
│   ├── hooks/               ← Custom Hooks (로직 분리)
│   └── types.ts             ← 도메인 타입

components/ui/               ← Atoms (기본 UI)
└── button.tsx, card.tsx...

services/                    ← API Layer (백엔드 통신)
└── courses.ts

stores/                      ← State Management
└── store.ts (Zustand)
```

**데이터 흐름:**

```
User Action
    ↓
Component (useLessonNavigation hook)
    ↓
Service (courses.ts API call)
    ↓
Backend API
    ↓
Prisma → SQLite
    ↓
Response
    ↓
Zustand Store 업데이트 (선택적)
    ↓
Component 리렌더링
```

---

### 2️⃣ 디자인 패턴

#### ✅ Provider Pattern (AI 모듈)

```typescript
// providers/types.ts
interface AIProvider {
  chat(messages: Message[]): Promise<string>;
}

// providers/ollama.provider.ts
class OllamaProvider implements AIProvider {
  /* ... */
}

// providers/gemini.provider.ts
class GeminiProvider implements AIProvider {
  /* ... */
}

// providers/index.ts (팩토리)
export function getAIProvider(type: string): AIProvider {
  switch (type) {
    case 'ollama':
      return new OllamaProvider();
    case 'gemini':
      return new GeminiProvider();
  }
}
```

**장점**: AI 제공자 교체가 쉬움 (확장성)

---

#### ✅ Strategy Pattern (메모리 핸들러)

```typescript
// handlers/types.ts
interface MemoryHandler {
  canHandle(node: ASTNode): boolean;
  handle(node: ASTNode, state: State): MemoryChange[];
}

// handlers/int.handler.ts
class IntHandler implements MemoryHandler {
  /* ... */
}

// handlers/pointer.handler.ts
class PointerHandler implements MemoryHandler {
  /* ... */
}

// simulator.ts
const handlers = [IntHandler, PointerHandler, ArrayHandler /* ... */];
for (const handler of handlers) {
  if (handler.canHandle(node)) {
    return handler.handle(node, state);
  }
}
```

**장점**: 타입별 로직 분리, 새 타입 추가 쉬움

---

#### ✅ Repository Pattern (Prisma)

```typescript
// Prisma가 이미 Repository 역할
prisma.lesson.findMany(); // Repository
prisma.user.create(); // Repository

// Service에서 사용
async function getLessons(chapterId: string) {
  return prisma.lesson.findMany({
    where: { chapterId },
  });
}
```

**장점**: DB 접근 추상화, 테스트 용이

---

#### ✅ Custom Hooks Pattern (React)

```typescript
// hooks/useLessonNavigation.ts
export function useLessonNavigation(steps: Step[]) {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));

  return { currentStep, nextStep, prevStep, isLast };
}

// LessonPage.tsx
const { currentStep, nextStep } = useLessonNavigation(lesson.steps);
```

**장점**: 로직 재사용, 컴포넌트 간결

---

### 3️⃣ 핵심 설계 원칙

| 원칙                             | 적용 사례                                                 |
| -------------------------------- | --------------------------------------------------------- |
| **Single Responsibility**        | 각 파일이 하나의 역할만 (routes ≠ service)               |
| **Dependency Injection**         | `getAIProvider()` 팩토리로 의존성 주입                    |
| **Type Safety**                  | TypeScript + Zod 스키마 검증                              |
| **Separation of Concerns**       | UI(components) ↔ Logic(hooks) ↔ Data(services) 분리      |
| **DRY (Don't Repeat Yourself)**  | shadcn/ui 재사용, Custom Hooks                            |

---

### 4️⃣ 보안 설계

```typescript
// 1. 환경변수 검증 (Zod)
const envSchema = z.object({
  FIREBASE_ADMIN_KEY: z.string(),
  OLLAMA_MODEL: z.string(),
});

// 2. 인증 미들웨어 체인
router.get('/admin', auth, adminAuth, controller);

// 3. C 코드 샌드박스 (Docker)
docker run --rm --network=none --memory=128m ...

// 4. Rate Limiting
rateLimit({ windowMs: 60000, max: 100 })
```

---

### 5️⃣ 확장성 설계

#### ✅ 새 언어 추가 (Python, Java)

```sql
-- 1. DB에 INSERT만 하면 끝!
INSERT INTO languages VALUES ('python', 'Python', ...);
INSERT INTO chapters VALUES (...);

-- 2. 코드 수정 불필요!
```

#### ✅ 새 AI Provider 추가

```typescript
// 1. providers/claude.provider.ts 생성
class ClaudeProvider implements AIProvider {
  /* ... */
}

// 2. providers/index.ts에 추가
case 'claude':
  return new ClaudeProvider();

// 3. 끝!
```

---

## 📊 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                     User (Browser)                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React SPA)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │    Hooks     │  │   Services   │  │
│  │  (UI Logic)  │  │ (State Mgmt) │  │  (API Call)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                  ↓                  ↓         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Zustand Store (Global State)            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓ HTTP/REST
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Routes     │→ │   Service    │→ │   Prisma     │  │
│  │ (API Layer)  │  │ (Biz Logic)  │  │ (ORM Layer)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         ↓                  ↓                  ↓         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Middleware  │  │  AI Provider │  │  C Executor  │  │
│  │ (Auth, Rate) │  │  (Strategy)  │  │  (Docker)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│               SQLite Database (Prisma)                  │
│  Users | Lessons | Chapters | Languages | Progress     │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 External Services                       │
│  Firebase Auth | Ollama AI | Docker | Gemini AI        │
└─────────────────────────────────────────────────────────┘
```

---

## 💡 핵심 Insight

### 좋은 아키텍처의 특징 (이 프로젝트에서 구현된 것)

1. **계층 분리**: UI ↔ Logic ↔ Data (테스트 쉬움)
2. **모듈화**: features/ 구조로 도메인별 분리
3. **확장성**: Provider 패턴으로 새 기능 추가 쉬움
4. **타입 안전**: TypeScript + Prisma로 런타임 에러 최소화
5. **보안 우선**: 인증, 샌드박스, Rate Limit 기본 탑재

---

## 📈 프로젝트 통계

| 항목            | 수량 |
| --------------- | ---- |
| Languages       | 1    |
| Chapters        | 10   |
| Lessons         | 62   |
| Backend Routes  | 12   |
| Frontend Pages  | 8    |
| UI Components   | 20+  |
| Custom Hooks    | 6    |
| Design Patterns | 5    |

---

_마지막 업데이트: 2026-01-04_
