# CodeInsight 아키텍처

## 🏗️ 시스템 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                     사용자 브라우저                           │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────▼────┐   ┌──────▼──────┐  ┌────▼────┐
   │ 에디터  │   │시각화 엔진  │  │ 콘솔   │
   └────┬────┘   └──────┬──────┘  └────┬────┘
        │                │              │
        └────────────────┼──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │  API Gateway (Express)      │
          │  - 라우팅                   │
          │  - 인증/인가               │
          │  - 에러 처리               │
          └──────────────┬──────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼─────┐   ┌──────▼────┐   ┌──────▼────┐
   │ 사용자   │   │ 레슨      │   │ 시뮬      │
   │ 관리     │   │ 관리      │   │ 레이터   │
   │ 서비스   │   │ 서비스    │   │ 서비스   │
   └────┬─────┘   └──────┬────┘   └──────┬────┘
        │                │               │
        └────────────────┼───────────────┘
                         │
          ┌──────────────▼──────────────┐
          │   Prisma ORM               │
          │   (데이터 계층)             │
          └──────────────┬──────────────┘
                         │
          ┌──────────────▼──────────────┐
          │  PostgreSQL Database        │
          │  (Neon Cloud)              │
          └─────────────────────────────┘

        (별도 프로세스)
        ┌──────────────────────────────┐
        │   Simulator Processes        │
        │  ┌──────────────────────┐   │
        │  │ C Simulator (GCC)    │   │
        │  ├──────────────────────┤   │
        │  │ Python Simulator     │   │
        │  ├──────────────────────┤   │
        │  │ JS Simulator (VM)    │   │
        │  ├──────────────────────┤   │
        │  │ Java Simulator (JDI) │   │
        │  └──────────────────────┘   │
        └──────────────────────────────┘
```

---

## 📊 데이터 흐름

### 1. 코드 실행 흐름

```
┌─────────────────────────────────────┐
│ 사용자: 코드 입력 + Execute 클릭     │
└────────────────┬────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Frontend      │
         │ (React)       │
         │ - 코드 캡처   │
         │ - 언어 감지   │
         └───────┬───────┘
                 │ POST /api/v1/execute
                 │ { code, language }
                 ▼
         ┌───────────────────────┐
         │ Backend Validator     │
         │ - 코드 유효성 검사    │
         │ - 길이 제한 확인      │
         │ - 보안 검사           │
         └───────┬───────────────┘
                 │
         ┌───────▼──────────┐
         │ 시뮬레이터 선택  │
         │ (언어별)         │
         └───────┬──────────┘
                 │
    ┌────────────┼────────────┬──────────┐
    │            │            │          │
   (C)         (Py)         (JS)        (Java)
    │            │            │          │
    ▼            ▼            ▼          ▼
 GCC          Python         Node        JDI
  +             +              +          +
디버거        sys.trace       VM        디버거
    │            │            │          │
    └────────────┼────────────┴──────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Backend       │
         │ - 결과 수집   │
         │ - JSON 변환   │
         │ - DB 저장     │
         └───────┬───────┘
                 │ HTTP 200
                 │ { steps, ... }
                 ▼
         ┌───────────────┐
         │ Frontend      │
         │ - 파싱        │
         │ - 시각화      │
         │ - 애니메이션  │
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │ 사용자 화면   │
         │ - 메모리      │
         │ - 스택        │
         │ - 콘솔        │
         └───────────────┘
```

---

## 🔄 컴포넌트 아키텍처

### Frontend

```
src/
├── components/
│   ├── Layout
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   │
│   ├── Editor
│   │   ├── CodeEditor.tsx        # Monaco Editor 래퍼
│   │   ├── LanguageSwitcher.tsx
│   │   └── ControlBar.tsx
│   │
│   ├── Visualizer
│   │   ├── VisualizerContainer.tsx
│   │   ├── MemoryView.tsx        # 메모리 그리드
│   │   ├── StackView.tsx         # 콜 스택
│   │   ├── HeapView.tsx          # 힙 객체
│   │   └── StepNavigator.tsx     # 이전/다음 버튼
│   │
│   ├── Common
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Toast.tsx             # 중앙화된 알림
│   │
│   └── Lesson
│       ├── LessonContent.tsx
│       ├── LessonEditor.tsx
│       └── ProgressBar.tsx
│
├── features/
│   ├── playground/
│   │   ├── PlaygroundPage.tsx    # 메인 페이지
│   │   ├── usePlayground.ts
│   │   └── playground.store.ts
│   │
│   ├── lessons/
│   │   ├── LessonsPage.tsx
│   │   ├── LessonDetailPage.tsx
│   │   └── lessons.store.ts
│   │
│   └── courses/
│       ├── CoursesPage.tsx
│       └── courses.store.ts
│
├── services/
│   ├── api.ts                   # API 클라이언트
│   ├── simulator.ts             # 시뮬레이터 호출
│   └── parser.ts                # 응답 파싱
│
├── stores/
│   ├── usePlaygroundStore.ts   # Zustand
│   ├── useLessonStore.ts
│   └── useUIStore.ts
│
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts
```

### Backend

```
src/
├── modules/
│   ├── simulators/
│   │   ├── c.ts                # C 실행
│   │   ├── python.ts           # Python 실행
│   │   ├── javascript.ts       # JS 실행
│   │   ├── java.ts             # Java 실행
│   │   └── types.ts            # 공통 타입
│   │
│   ├── users/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── types.ts
│   │
│   ├── lessons/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   └── types.ts
│   │
│   └── submissions/
│       ├── routes.ts
│       ├── service.ts
│       └── types.ts
│
├── services/
│   ├── validation.ts           # Zod 검증
│   ├── error-handler.ts        # 에러 처리
│   ├── subprocess.ts           # 프로세스 관리
│   └── parser.ts               # 결과 파싱
│
├── middleware/
│   ├── auth.ts
│   ├── error.ts
│   └── cors.ts
│
├── config/
│   ├── database.ts
│   ├── env.ts
│   └── constants.ts
│
└── app.ts                      # Express 앱
```

---

## 🔄 상태 관리 (Zustand)

### PlaygroundStore

```typescript
interface ExecutionStep {
  step: number;
  line: number;
  column: number;
  variables: Record<string, Variable>;
  memory: MemoryState;
  callStack: StackFrame[];
}

interface PlaygroundStore {
  // 상태
  code: string;
  language: 'c' | 'python' | 'js' | 'java';
  isExecuting: boolean;
  steps: ExecutionStep[];
  currentStep: number;

  // 액션
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  execute: () => Promise<void>;
  nextStep: () => void;
  prevStep: () => void;
  jumpToStep: (step: number) => void;
}
```

---

## 🔌 API 설계

### 주요 엔드포인트

#### POST /api/v1/execute
```
요청:
{
  "code": "int x = 5;",
  "language": "c",
  "breakpoints": [1, 3]
}

응답:
{
  "status": "success",
  "executionId": "uuid",
  "totalSteps": 42,
  "steps": [
    {
      "step": 1,
      "line": 1,
      "variables": { ... },
      "memory": { ... }
    }
  ],
  "error": null
}
```

#### GET /api/v1/lessons
```
응답:
{
  "lessons": [
    {
      "id": 1,
      "title": "변수와 타입",
      "language": "c",
      "difficulty": "easy"
    }
  ]
}
```

#### POST /api/v1/submissions
```
요청:
{
  "lessonId": 1,
  "code": "...",
  "language": "c"
}

응답:
{
  "submissionId": "uuid",
  "passed": true,
  "testResults": [...]
}
```

---

## 🔐 보안 계층

```
┌─────────────────────────┐
│   사용자 요청           │
└────────────┬────────────┘
             │
    ┌────────▼────────┐
    │ CORS 검증       │
    │ (middleware)    │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 인증 (JWT)      │
    │ (middleware)    │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 입력 검증       │
    │ (Zod)          │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 비즈니스 로직   │
    │ (Service)       │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 데이터 접근     │
    │ (Prisma)        │
    └────────┬────────┘
             │
    ┌────────▼────────┐
    │ 데이터베이스    │
    └─────────────────┘
```

---

## 🚀 배포 아키텍처

```
GitHub Repo
    ↓
GitHub Actions (CI)
    ├─ 테스트
    ├─ 빌드
    └─ 검증
    ↓
Railway (CD)
    ├─ Frontend → Vercel
    ├─ Backend → Railway
    └─ Database → Neon
    ↓
프로덕션 서버
```

---

## 📈 확장성 계획

### 단기 (1-3개월)
- 더 많은 언어 지원 (Go, Rust, etc)
- 소셜 기능 (공유, 협업)

### 중기 (3-6개월)
- 웹소켓 실시간 협업
- 고급 시각화 (그래프, 트리)
- AI 기반 피드백

### 장기 (6개월+)
- 모바일 앱 (React Native)
- 오프라인 지원
- 기관용 LMS 통합
