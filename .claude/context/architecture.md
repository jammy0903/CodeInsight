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

## 📊 데이터 흐름 (이중 실행 구조)

### ⭐ 핵심 개념: 두 가지 실행 경로

이 앱은 **Lesson**과 **Playground** 두 가지 모드가 별개의 데이터 흐름을 가진다.

### 1. Lesson 모드 (사전 스크립팅 — 시뮬레이터 미사용)

```
┌──────────────────────────────────────────┐
│ 사용자: 레슨 선택                         │
└────────────────┬─────────────────────────┘
                 │
                 ▼
         ┌──────────────────────────┐
         │ Frontend                 │
         │ GET /api/courses/        │
         │     lessons/:lessonId    │
         └───────┬──────────────────┘
                 │
                 ▼
         ┌───────────────────────────────────┐
         │ Backend (하이브리드 로딩)           │
         │ 1. DB → 메타데이터 조회 (Prisma)   │
         │ 2. lessonContentLoader             │
         │    → JSON 파일 지연 로딩 + 캐시    │
         │ 3. DB 메타 + JSON 콘텐츠 병합      │
         └───────┬───────────────────────────┘
                 │ HTTP 200
                 │ { content: { code, steps }, quizzes }
                 ▼
         ┌───────────────────────────────────┐
         │ Frontend (언어별 시각화)            │
         │ - PyTransformer: names/objects     │
         │   → FlowStep 변환                  │
         │ - PythonFlowView: 포스트잇 렌더링  │
         │ - explanation, 퀴즈 표시            │
         └───────┬───────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ 사용자 화면   │
         │ - 단계별 학습 │
         │ - 퀴즈 풀이   │
         └───────────────┘

※ 시뮬레이터 없이 동작 — JSON에 모든 시각화 데이터가 미리 정의됨
※ 시뮬레이터 미지원 개념(yield, decorator, async 등)도 교육 가능
※ lessonContentLoader: 파일 경로만 스캔 → 요청 시 지연 로딩 → 메모리 캐시
```

### 2. Playground 모드 (동적 실행 — 시뮬레이터 사용)

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
    ┌────────────┼────────────┐
    │            │            │
   (C)         (Py)         (JS)
    │            │            │
    ▼            ▼            ▼
Emscripten   Python         Node
  검증 +      sys.trace       VM
인터프리터
    │            │            │
    └────────────┼────────────┘
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
│   ├── common/
│   │   ├── Toast/              # 중앙화된 알림 시스템 (sonner)
│   │   ├── Button, Input, Modal 등
│   │   └── VimStatusLine.tsx
│   ├── editor/
│   │   └── CodeEditor.tsx      # Monaco Editor 래퍼
│   └── lesson/
│       └── 레슨 관련 공통 컴포넌트
│
├── features/
│   ├── courses/                # 코스/레슨 페이지
│   │   ├── CoursesPage.tsx
│   │   ├── LanguageCoursePage.tsx
│   │   ├── ChapterLessonsPage.tsx
│   │   └── LessonPage.tsx      # 레슨 상세 (시각화 통합)
│   │
│   ├── playground/             # 플레이그라운드 페이지
│   │   └── PlaygroundPage.tsx
│   │
│   └── visualizers/            # ⭐ 언어별 시각화 (핵심 아키텍처)
│       ├── flow/               # 범용 플로우 시각화
│       │   ├── FlowVisualizer.tsx          # Playground 모드
│       │   ├── LessonFlowVisualizer.tsx    # Lesson 모드
│       │   ├── adapters/                   # 언어별 어댑터 (Transformer + Styler + Animator)
│       │   │   ├── base/types.ts           # IFlowAdapter, IFlowTransformer 인터페이스
│       │   │   ├── python/                 # PyTransformer.ts (names/objects → FlowStep)
│       │   │   ├── javascript/             # JSTransformer.ts
│       │   │   ├── java/                   # JavaTransformer.ts
│       │   │   ├── c/                      # CTransformer.ts
│       │   │   └── index.ts               # 어댑터 레지스트리 + 팩토리
│       │   ├── components/                 # 언어별 렌더링 컴포넌트
│       │   │   ├── PythonFlowView.tsx      # 포스트잇(이름표+객체) 시각화
│       │   │   ├── JSFlowView.tsx
│       │   │   ├── JavaFlowView.tsx
│       │   │   ├── VariableBox.tsx
│       │   │   └── ArrowLayer.tsx
│       │   └── hooks/
│       │       ├── useFlowDiff.ts
│       │       └── useAnimationQueue.ts
│       ├── memory/              # C/Java 메모리 시각화 (스택/힙)
│       ├── shared/              # 공통 (CallStackView, ScopeChainView, TerminalOutput)
│       └── c/, java/            # 언어별 특화 시각화
│
├── services/
│   ├── api/                    # API 클라이언트 (axios + Firebase 인터셉터)
│   ├── simulator/              # 시뮬레이터 서비스
│   ├── courses.ts              # 코스/레슨 API
│   ├── ai.ts                   # AI 서비스
│   ├── firebase.ts             # Firebase 인증
│   └── analytics/              # 학습 분석
│
├── stores/                     # Zustand 전역 상태
│   ├── authStore.ts            # 사용자 인증
│   ├── simulatorStore.ts       # 시뮬레이터 실행 상태
│   ├── themeStore.ts           # 테마 (다크/라이트)
│   ├── chatStore.ts            # 채팅
│   └── lessonHistoryStore.ts   # 레슨 진행 기록
│
├── hooks/                      # 커스텀 훅 (useCourses, useAuth 등)
├── lib/                        # 외부 라이브러리 설정 (firebase.ts)
└── utils/
```

### Backend

```
src/
├── modules/
│   ├── courses/                # 코스/레슨 관리 (핵심)
│   │   ├── routes.ts           # API 엔드포인트
│   │   ├── service.ts          # 비즈니스 로직 (진행률 계산)
│   │   └── types.ts
│   │
│   ├── simulators/             # 언어별 시뮬레이터 (핵심)
│   │   ├── c/                  # C (GCC + 인터프리터)
│   │   ├── python/             # Python (sys.settrace)
│   │   ├── javascript/         # JS (Node.js VM)
│   │   └── java/               # Java (JDI)
│   │
│   ├── ai/                     # AI 코드 설명 (Ollama/Gemini)
│   ├── analytics/              # 학습 분석 리포트
│   ├── users/                  # 사용자 인증 (Firebase)
│   ├── gamification/           # 게이미피케이션 (스트릭 등)
│   ├── notes/                  # 사용자 학습 노트
│   ├── problems/               # 연습 문제 (레거시)
│   ├── submissions/            # 코드 제출 관리
│   ├── executors/              # Docker 기반 코드 실행
│   ├── admin/                  # 관리자 기능
│   └── shared/                 # 공통 로직
│
├── services/
│   └── lessonContentLoader.ts  # ⭐ JSON 레슨 콘텐츠 로더 (지연 로딩 + 메모리 캐시)
│
├── middleware/
│   ├── auth.ts                 # Firebase 인증 미들웨어
│   └── error.ts
│
├── types/
│   └── lesson-content.ts       # 레슨 콘텐츠 타입 정의
│
├── config/
│   └── index.ts                # 환경 변수 (zod 검증)
│
└── app.ts                      # Express 앱 진입점
```

---

## 🐍 Python 시각화 파이프라인 (names/objects 모델)

Python은 **모든 변수가 참조(이름표)**인 언어이므로, 박스 모델(`variables[]`)이 아닌 **참조 모델(`names[]`/`objects[]`)**을 사용한다.

### 데이터 흐름

```
┌─────────────────────────────────────────────────────┐
│ Lesson JSON (pythonMemoryState)                     │
│  names: [{ name: "x", pointsTo: "int1" }]          │
│  objects: [{ id: "int1", type: "int", value: 42 }]  │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PyTransformer.transform(step)                       │
│  - names[] → FlowVariable (isReference: true)       │
│  - objects[] → FlowValue (pointsTo로 연결)          │
│  - objectMap: id → object 매핑                      │
│  - namesByObject: objectId → names[] 그루핑          │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ FlowStep (공통 포맷)                                 │
│  variables, frames, values, output, note            │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│ PythonFlowView.tsx (렌더링)                          │
│  - 포스트잇(sticky note) 메타포                      │
│  - 이름표 → 객체 화살표 연결                         │
│  - 타입별 색상: mutable(초록) / immutable(보라)       │
│  - 타입별 이모지: 🔢 int, 📝 str, 📋 list 등        │
│  - 콜 스택 프레임 렌더링 (함수 스코프)               │
└─────────────────────────────────────────────────────┘
```

### 어댑터 패턴

모든 언어는 동일한 어댑터 인터페이스(`IFlowAdapter`)를 구현한다:

```typescript
interface IFlowAdapter {
  language: string;
  transformer: IFlowTransformer;  // 데이터 변환 (PyTransformer)
  styler: IFlowStyler;            // 테마별 스타일 (PyStyler)
  animator: IFlowAnimator;        // 애니메이션 정의 (PyAnimator)
}
```

레지스트리: `getAdapter('python')` → `pythonAdapter` (싱글톤)

### names/objects 핵심 타입 (PyTransformer.ts)

```typescript
interface PyName {
  name: string;           // 변수 이름
  pointsTo: string;       // 참조하는 object.id
  highlight?: boolean;    // 현재 스텝에서 변경됨
}

interface PyObject {
  id: string;             // "int1", "list1" 등 ({type}{counter})
  type: string;           // "int", "str", "list", "function", "class", "instance"
  value: unknown;         // 42, "\"hello\"", "[1, 2, 3]"
  pyId?: string;          // "1001" (고유 식별자, 1001부터 증가)
  highlight?: boolean;
}
```

### 공유 참조 시각화

```
a ─────→ ┌──────────┐ ←───── b
          │ list1    │
          │ [1, 2, 3]│
          └──────────┘
```

같은 `pointsTo`를 가진 names → 같은 object를 가리킴 (Ch7 참조 카운팅 핵심)

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

#### GET /api/courses/lessons/:lessonId
```
응답 (하이브리드 — DB 메타 + JSON 콘텐츠 병합):
{
  "id": "py-3-1",
  "title": "Lists (Mutable)",
  "difficulty": "basic",
  "content": {
    "code": "fruits = [\"Apple\", \"Banana\"]\n...",
    "language": "python",
    "steps": [
      {
        "line": 2,
        "title": "리스트 생성",
        "explanation": "...",
        "highlight": [2],
        "visualizationType": "pythonMemory",
        "pythonMemoryState": {
          "names": [{ "name": "fruits", "pointsTo": "list1" }],
          "objects": [{ "id": "list1", "type": "list", "value": "[\"Apple\", \"Banana\"]", "pyId": "1001" }],
          "output": []
        }
      }
    ]
  },
  "quizzes": [
    { "type": "multiple_choice", "question": "...", "options": [...], "answer": "2" }
  ]
}
```

#### GET /api/courses/:languageId
```
응답:
{
  "id": "python",
  "name": "Python",
  "chapters": [
    {
      "id": "python-ch1",
      "title": "변수와 타입",
      "order": 1,
      "progress": { "total": 5, "completed": 3, "percentage": 60 }
    }
  ]
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
GitHub Repo (main branch push)
    ↓
Render (자동 배포)
    ├─ Frontend → Render Static Site
    ├─ Backend → Render Docker
    │   ├─ prisma migrate deploy
    │   ├─ prisma db seed (JSON → DB 동기화)
    │   └─ node dist/app.js
    └─ Database → Neon PostgreSQL
    ↓
프로덕션 서버

※ 레슨 JSON 파일 수정 후 push하면 자동으로 DB에 반영됨
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
