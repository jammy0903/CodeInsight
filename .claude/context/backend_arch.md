# 백엔드 아키텍처 (`C-OSINE/packages/backend/`)

이 문서는 C-OSINE 프로젝트의 Node.js 기반 백엔드 아키텍처를 설명합니다. 이 아키텍처는 모듈 기반으로 구성되어 있으며, 각 모듈은 특정 도메인이나 기능을 담당합니다.

## 주요 기술 스택

- **API 서버**: Express.js
- **ORM**: Prisma
- **데이터베이스**: PostgreSQL (NeonDB)
- **언어**: TypeScript
- **패키지 관리**: pnpm workspace (monorepo)

## 아키텍처 개요

- **모듈 시스템**: `src/modules` 아래에 각 기능 모듈이 위치합니다. 각 모듈은 특정 도메인(예: `courses`, `users`, `simulators`)과 관련된 라우트, 서비스, 타입 정의 등을 포함합니다.
- **메인 진입점**: `src/app.ts` 파일이 Express 앱의 메인 진입점 역할을 하며, 모든 모듈의 라우터를 등록하고 CORS, JSON 파서 등의 공통 미들웨어를 설정합니다.
- **설정 관리**: `src/config` 디렉토리에서 환경 변수를 `zod`로 검증하고, 애플리케이션 전반에 사용될 설정 객체를 생성하여 제공합니다.

## 디렉토리 구조

```
packages/backend/
├── src/
│   ├── app.ts                    # Express 앱 진입점
│   ├── config/                   # 환경 변수 및 설정
│   │   ├── database.ts          # Prisma 클라이언트
│   │   └── index.ts             # 앱 전역 설정
│   ├── middleware/              # 공통 미들웨어
│   │   ├── auth.ts              # 인증 미들웨어
│   │   └── error.ts             # 에러 핸들러
│   ├── modules/                 # 도메인별 모듈
│   │   ├── admin/              # 관리자 기능
│   │   ├── ai/                 # AI 기능 (코드 설명 등)
│   │   ├── analytics/          # 학습 분석 리포트
│   │   ├── courses/            # 강좌 및 레슨 (핵심)
│   │   ├── executors/          # 코드 실행 (Docker)
│   │   ├── gamification/       # 게임화 요소
│   │   ├── notes/              # 사용자 학습 노트
│   │   ├── problems/           # 연습 문제
│   │   ├── shared/             # 공통 로직
│   │   ├── simulators/         # 언어별 시뮬레이터 (핵심)
│   │   ├── submissions/        # 제출된 코드 관리
│   │   └── users/              # 사용자 인증/프로필
│   ├── services/               # 공통 서비스
│   ├── types/                  # 전역 타입 정의
│   └── utils/                  # 유틸리티 함수
├── prisma/
│   ├── schema.prisma           # DB 스키마 정의
│   ├── migrations/             # DB 마이그레이션
│   ├── seed.ts                 # 레슨 데이터 시드
│   ├── seed-quizzes.ts         # 퀴즈 데이터 시드
│   └── content/                # JSON 콘텐츠
│       ├── c/                  # C언어 레슨
│       ├── javascript/         # JS 레슨
│       ├── java/               # Java 레슨
│       ├── python/             # Python 레슨
│       └── quizzes/            # 독립 퀴즈
└── package.json
```

## 모듈 시스템

### 핵심 원칙

- **`src/modules/`**: **특정 도메인에 종속적인 코드**
  - 각 디렉토리가 하나의 기능(도메인)을 담당합니다.
  - 모듈 내에는 해당 도메인에서만 사용하는 라우트, 서비스, 타입 정의 등이 포함됩니다.
  - **새로운 기능을 추가할 때는 먼저 `modules` 아래에 새로운 모듈을 생성하는 것을 고려해야 합니다.**

- **`src/services/`, `src/utils/`, `src/types/`, `src/middleware/`**: **둘 이상의 모듈에서 재사용되는 공통 코드**
  - `services/`: 여러 도메인에서 공통으로 사용되는 비즈니스 로직
  - `utils/`: 특정 도메인에 종속되지 않는 순수 유틸리티 함수
  - `types/`: 여러 모듈에서 공통으로 사용되는 전역 타입 정의
  - `middleware/`: 여러 라우트 또는 모듈에서 공통으로 사용되는 Express 미들웨어

> **⚠️ 언제 공용 디렉토리를 사용해야 하나요?**
>
> 코드를 작성하기 전에 "이 로직이 다른 모듈에서도 사용될 가능성이 있는가?"를 먼저 자문해보세요.
> - **"아니오"**: 현재 작업 중인 모듈(`modules/my-module/`) 내에 작성하세요.
> - **"예"**: 최상위 공용 디렉토리(`services/`, `utils/` 등)에 작성하여 재사용성을 높이세요.

---

## 모듈 상세 설명

### 1. Courses 모듈 (`src/modules/courses`)

**핵심 비즈니스 로직: 언어 → 챕터 → 레슨 계층 구조 관리**

#### DRY 원칙: 진행률 계산은 백엔드에서만

**API 설계 철학:**
- 비로그인 사용자: 코스 구조만 제공 (진행률 없음)
- 로그인 사용자: 코스 구조 + 계산된 진행률 포함
- 프론트엔드는 **절대 진행률을 계산하지 않고 표시만** 수행

**주요 API:**

```typescript
// 언어 목록 (비로그인 가능)
GET /api/courses
- 모든 활성 언어 목록 반환
- 미들웨어: optionalDbUser

// 언어 상세 + 챕터 + 진행률 (통합 API)
GET /api/courses/:languageId
- 미들웨어: optionalDbUser (인증 선택적)
- 로그인 시: 각 챕터에 progress { total, completed, percentage } 포함
- 비로그인 시: progress 필드 없음

// 챕터별 레슨 목록 + 진행률
GET /api/courses/:languageId/chapters/:chapterId/lessons
- 미들웨어: optionalDbUser
- 레슨 목록 + 각 레슨의 진행 상태

// 레슨 상세 (콘텐츠 포함)
GET /api/courses/lessons/:lessonId
- 레슨 메타데이터 + 콘텐츠 (코드, 스텝, 설명)

// 사용자 전체 진행률
GET /api/courses/progress
- 미들웨어: requireDbUser (인증 필수)
- 모든 레슨의 진행 상태 반환

// 진행 상태 업데이트
POST /api/courses/progress
- 미들웨어: requireDbUser
- 레슨 완료 시 자동으로 스트릭(streak) 업데이트
```

**서비스 레이어 책임:**

```typescript
// courses/service.ts
export async function getLanguageWithChapters(languageId: string, userId?: string) {
  // userId 제공 시 → DB에서 진행률 조회 + 챕터별 집계 계산
  // userId 미제공 시 → 코스 구조만 반환
}

export async function updateProgress(userId: string, lessonId: string, data: UpdateData) {
  // 진행 상태 저장 + 완료 시 gamification 모듈 연동
}
```

**파일 구조:**

```
courses/
├── routes.ts        # API 라우트 정의
├── service.ts       # 비즈니스 로직 (진행률 계산)
└── types.ts         # 타입 정의
```

---

### 2. Simulators 모듈 (`src/modules/simulators`)

**핵심 차별화 요소: 교육용 실시간 코드 시뮬레이터**

#### 디버거 기반 아키텍처

모든 언어 시뮬레이터는 **실제 디버거 기반** 접근 방식을 사용합니다:

| 언어 | 디버거 방식 | 디렉토리 |
|------|------------|----------|
| C | gcc + 메모리 시뮬레이션 (Emscripten) | `simulators/c/` |
| Java | JDI (Java Debug Interface) | `simulators/java/` |
| Python | `sys.settrace()` | `simulators/python/` |
| JavaScript | Node.js `vm` + AST 계측 | `simulators/javascript/` |

#### 공통 4단계 파이프라인

모든 시뮬레이터는 동일한 파이프라인을 따릅니다:

```
Setup → Compile → Debug → Cleanup
  ↓       ↓         ↓        ↓
 준비    컴파일    실행추적   정리
```

#### 통합 API 패턴

모든 시뮬레이터는 다음과 같은 **통일된 API 경로**를 제공합니다:

```typescript
// 시뮬레이션 실행
POST /api/simulators/{lang}/simulate
POST /api/simulators/{lang}/trace

// 요청 형식
{
  code: string,
  stdin?: string
}

// 응답 형식
{
  success: boolean,
  steps: Step[],      // 각 실행 단계
  output?: string,    // 프로그램 출력
  error?: string      // 에러 메시지
}
```

**Step 데이터 구조 (공통):**

```typescript
interface Step {
  line: number;           // 실행 라인
  stack: Frame[];         // 콜 스택
  heap: HeapObject[];     // 힙 객체
  stdout?: string;        // 출력
  highlightRanges?: HighlightRange[];  // 하이라이트
}

interface Frame {
  name: string;           // 함수 이름
  locals: Variable[];     // 지역 변수
}

interface HeapObject {
  id: string;             // 객체 ID
  type: string;           // 타입
  value: any;             // 값
}
```

#### 에러 처리 원칙

시뮬레이터는 **재시도 없이 즉시 에러 반환**:

```typescript
// 컴파일 에러
{
  success: false,
  error: "SyntaxError: unexpected token ';' at line 5",
  errorType: "compilation"
}

// 런타임 에러
{
  success: false,
  error: "NullPointerException at line 10",
  errorType: "runtime",
  steps: [...]  // 에러 발생 직전까지의 스텝
}
```

프론트엔드는 `handleSimulatorError()`를 통해 에러를 자동 분류하여 Toast로 표시합니다.

#### 각 언어별 시뮬레이터 구조

**C 시뮬레이터:**

```
c/
├── routes.ts                  # API 엔드포인트
├── simulator.ts               # 시뮬레이션 엔진
├── simulator.test.ts          # 테스트
├── integration.test.ts        # 통합 테스트
├── parser/                    # C 코드 파싱
│   ├── index.ts
│   ├── types.ts
│   └── function-parser.ts
├── runtime/                   # 런타임 (메모리 관리)
│   ├── memory.ts
│   ├── stack.ts
│   └── heap.ts
└── handlers/                  # 명령어 핸들러
    ├── assign.handler.ts
    ├── pointer.handler.ts
    └── malloc.handler.ts
```

**Java 시뮬레이터:**

```
java/
├── routes.ts                  # API 엔드포인트
├── java-simulation.service.ts # JDI 디버거 래퍼
├── java-simulation.service.test.ts
├── index.ts
├── engine/                    # 디버거 엔진
│   ├── debugger-client.ts    # JDI 연결
│   ├── compiler.ts           # javac 래퍼
│   ├── compiler.test.ts
│   ├── file-manager.ts       # 임시 파일 관리
│   └── file-manager.test.ts
├── runtime/                   # 런타임 타입
│   ├── stack.ts
│   ├── heap.ts
│   └── types.ts
├── parser/                    # 소스 코드 파싱
│   └── class-parser.ts
├── evaluator/                 # 표현식 평가
│   └── expression-evaluator.ts
└── handlers/                  # 이벤트 핸들러
    ├── types.ts
    ├── index.ts
    ├── variable.handler.ts
    └── print.handler.ts
```

**Python 시뮬레이터:**

```
python/
├── routes.ts
├── python-simulation.service.ts
├── python-simulation.service.test.ts
├── index.ts
├── types.ts
├── context.ts                # 실행 컨텍스트
├── engine/                   # 디버거 엔진
│   ├── debugger-client.ts   # sys.settrace() 래퍼
│   └── file-manager.ts
├── parser/                   # AST 파싱
│   ├── index.ts
│   └── block-parser.ts
└── handlers/                 # 이벤트 핸들러
    ├── index.ts
    ├── assign.handler.ts
    ├── function-def.handler.ts
    ├── function-call.handler.ts
    ├── class-def.handler.ts
    ├── instance-create.handler.ts
    ├── method-call.handler.ts
    ├── attribute.handler.ts
    ├── print.handler.ts
    ├── return.handler.ts
    ├── global.handler.ts
    └── builtin.handler.ts
```

**JavaScript 시뮬레이터:**

```
javascript/
├── routes.ts
├── javascript-simulation.service.ts
├── javascript-simulation.service.test.ts
├── engine/                   # VM 엔진
│   ├── debugger-client.ts   # Node.js vm 래퍼
│   └── file-manager.ts
└── (handlers 및 parser 구조 동일)
```

---

### 3. Analytics 모듈 (`src/modules/analytics`)

**학습 분석 리포트 및 통계 데이터 수집**

#### 주요 기능

1. **레슨 체류 시간 추적** (`LessonActivity`)
2. **퀴즈 시도 기록** (`QuizAttempt`)
3. **AI 질문 히스토리** (`ChatHistory`)
4. **사용자 노트** (`UserNote`)
5. **세션 컨텍스트** (디바이스, 네트워크 정보)
6. **스텝별 행동 추적** (시각화 호버, AI 질문 등)

#### API 엔드포인트

```typescript
// 레슨 활동 시작/종료
POST /api/analytics/activity
- Body: { lessonId, action: 'start' | 'end' }
- 체류 시간 자동 계산

// 레슨 활동 종료 (sendBeacon용)
POST /api/analytics/activity/end
- Body: { activityId }
- 페이지 언로드 시 사용

// 퀴즈 시도 기록
POST /api/analytics/quiz-attempt
- Body: { quizId, userAnswer, isCorrect, timeSpent }

// 분석 데이터 요약
GET /api/analytics/summary?period=30d
- Response: {
    totalStudyTime,
    quizStats: { total, correct, accuracy },
    weakConcepts: { "포인터": 5, ... },
    dailyActivity: { "2026-01-27": 3600, ... }
  }

// 프로필 (온보딩 설문)
GET /api/analytics/profile
POST /api/analytics/profile
- Body: { ageGroup, occupation, programmingExp, learningGoal }

// 세션 컨텍스트 저장
POST /api/analytics/session-context
- Body: { screenWidth, orientation, connectionType, ... }

// 스텝별 활동 기록
POST /api/analytics/step-activity
POST /api/analytics/step-activities (배치)
- Body: { lessonActivityId, stepIndex, duration, visHoverCount, ... }
```

#### AI 리포트 분석

```typescript
// AI 기반 학습 리포트 생성
POST /api/ai/analyze-report
- Body: ReportAnalysisRequest (학습 데이터 요약)
- Response: { analysis: string, provider: string }
- Timeout: 180초 (LLM 응답 대기)
```

**파일 구조:**

```
analytics/
├── routes.ts        # API 라우트
└── (서비스 로직은 routes.ts에 통합)
```

---

### 4. AI 모듈 (`src/modules/ai`)

**AI 기반 코드 설명 및 질문 답변**

#### 프로바이더 시스템

```
ai/
├── routes.ts
├── providers/
│   ├── ollama.ts         # Ollama (로컬)
│   ├── gemini.ts         # Google Gemini
│   └── types.ts          # 공통 인터페이스
└── prompts/              # 프롬프트 템플릿
```

#### API

```typescript
// 코드 설명
POST /api/ai/explain
- Body: { code, language }
- Response: { explanation }

// 질문 답변
POST /api/ai/ask
- Body: { question, context }
- Response: { answer }

// 프로바이더 상태
GET /api/ai/status
- Response: { available: boolean, provider: string }
```

---

### 5. Gamification 모듈 (`src/modules/gamification`)

**게임화 요소: 스트릭, 업적 등**

```
gamification/
├── routes.ts
└── service.ts
```

#### API

```typescript
// 스트릭 조회
GET /api/gamification/streak
- Response: { currentStreak, longestStreak, lastActiveAt }

// 스트릭 업데이트 (자동 호출)
POST /api/gamification/streak
- Body: { userId }
- 레슨 완료 시 courses 모듈에서 자동 호출
```

---

### 6. Notes 모듈 (`src/modules/notes`)

**사용자 학습 노트 관리**

```typescript
// 노트 생성
POST /api/notes
- Body: { lessonId, quizId?, concept, content, isFromWrong }

// 노트 목록
GET /api/notes
- Query: { lessonId?, concept? }

// 노트 수정/삭제
PUT /api/notes/:id
DELETE /api/notes/:id
```

---

### 7. Users 모듈 (`src/modules/users`)

**사용자 인증 및 프로필 관리**

#### Firebase Authentication 연동

```typescript
// Firebase ID 토큰으로 로그인
POST /api/users/auth/firebase
- Body: { idToken }
- Response: { user, dbUser }

// 현재 사용자 조회
GET /api/users/me
- Header: Authorization: Bearer <firebase_token>
```

---

### 8. Problems & Submissions 모듈

**알고리즘 문제 및 제출 관리** (현재 미사용, 레거시)

```
problems/
└── routes.ts

submissions/
└── routes.ts
```

---

### 9. Executors 모듈 (`src/modules/executors`)

**Docker 기반 코드 실행** (샌드박스 환경)

```typescript
POST /api/executors/run
- Body: { code, language, stdin }
- Docker 컨테이너에서 실행
- 타임아웃/메모리 제한 적용
```

---

### 10. Admin 모듈 (`src/modules/admin`)

**관리자 대시보드 API**

```typescript
GET /api/admin/stats
- 전체 사용자 통계
- 미들웨어: requireAdmin
```

---

### 11. Shared 모듈 (`src/modules/shared`)

**여러 모듈에서 공유하는 공통 로직**

```
shared/
└── expression/
    └── evaluator.ts    # 수식 평가기 (시뮬레이터 공용)
```

---

## 데이터베이스 스키마 (`prisma/schema.prisma`)

### 핵심 모델

#### 사용자 관련

```prisma
model User {
  id            String   @id @default(uuid())
  nickname      String   @unique
  role          String   @default("user")

  // 관계
  oauthAccounts          OAuthAccount[]
  progress               UserProgress[]
  activities             LessonActivity[]
  chatHistories          ChatHistory[]
  quizAttempts           QuizAttempt[]
  standaloneQuizAttempts StandaloneQuizAttempt[]
  notes                  UserNote[]
  profile                UserProfile?
  streak                 UserStreak?
}

model OAuthAccount {
  id         String   @id @default(uuid())
  userId     String
  provider   String   // "google", "github"
  providerId String
  email      String?
}
```

#### 코스 관련

```prisma
model Language {
  id           String    @id  // "c", "javascript", "java", "python"
  name         String
  isActive     Boolean   @default(true)
  isSequential Boolean   @default(true)  // 순차 잠금 여부
  order        Int
  chapters     Chapter[]
}

model Chapter {
  id          String   @id
  languageId  String
  title       String
  part        String   @default("syntax")  // "syntax", "advanced", "project"
  partLabel   String?
  order       Int
  lessons     Lesson[]
}

model Lesson {
  id            String   @id
  chapterId     String
  title         String
  difficulty    String   @default("basic")
  order         Int
  estimatedTime Int?

  content       LessonContent?
  quizzes       Quiz[]
  progress      UserProgress[]
}

model LessonContent {
  id        String   @id
  lessonId  String   @unique
  code      String   // 실습 코드
  language  String
  steps     Json     // 스텝별 설명
}

model UserProgress {
  id          String    @id @default(uuid())
  userId      String
  lessonId    String
  status      String    @default("not_started")  // "in_progress", "completed"
  currentStep Int       @default(0)
  quizScore   Int?
  quizTotal   Int?
  startedAt   DateTime?
  completedAt DateTime?
}
```

#### 퀴즈 시스템

**레슨 내 퀴즈 (기존):**

```prisma
model Quiz {
  id          String   @id
  lessonId    String
  type        String   // "ox", "multiple-choice"
  question    String
  options     Json?
  answer      String
  explanation String?
  order       Int

  attempts    QuizAttempt[]
}

model QuizAttempt {
  id         String   @id @default(uuid())
  userId     String
  quizId     String
  userAnswer String
  isCorrect  Boolean
  timeSpent  Int?
  createdAt  DateTime @default(now())
}
```

**독립 퀴즈 시스템 (2026-01-27 추가):**

```prisma
model StandaloneQuiz {
  id            String   @id          // "ox-c-ptr-q1"

  // 분류
  language      String                // "c", "javascript"
  quizType      String                // "ox", "multiple-choice", "fill-blank"
  chapterId     String                // "c-var", "c-ptr"
  chapterTitle  String                // "변수와 자료형"

  // 문제
  question      String
  options       Json?
  answer        String
  explanation   String

  // 분석용
  concepts      String[]              // ["포인터", "메모리주소"]
  difficulty    String                // "easy", "medium", "hard"
  orderNum      Int

  isActive      Boolean  @default(true)
  attempts      StandaloneQuizAttempt[]
}

model StandaloneQuizAttempt {
  id            String   @id @default(uuid())
  userId        String
  quizId        String

  userAnswer    String
  isCorrect     Boolean
  timeSpent     Int?

  // 재시도 추적
  attemptNumber Int      @default(1)

  createdAt     DateTime @default(now())
}
```

#### 분석 리포트 관련

```prisma
model LessonActivity {
  id        String    @id @default(uuid())
  userId    String
  lessonId  String
  startedAt DateTime
  endedAt   DateTime?
  duration  Int?      // 초 단위
}

model ChatHistory {
  id        String   @id @default(uuid())
  userId    String
  lessonId  String?
  context   String?   // "lesson", "playground"
  question  String
  answer    String
  tokens    Int?
  createdAt DateTime @default(now())
}

model UserNote {
  id          String   @id @default(uuid())
  userId      String
  quizId      String?
  lessonId    String
  source      String   // "quiz", "lesson", "manual"
  concept     String   // "포인터", "malloc"
  content     String
  isFromWrong Boolean  @default(false)
}

model UserProfile {
  userId              String   @unique
  ageGroup            String?
  occupation          String?
  programmingExp      String?
  learningGoal        String?
  onboardingCompleted Boolean  @default(false)
}

model SessionContext {
  id               String   @id @default(uuid())
  userId           String
  lessonActivityId String?

  // 디바이스 정보
  screenWidth      Int?
  screenHeight     Int?
  orientation      String?
  inputMethod      String?

  // 네트워크 정보
  connectionType   String?
  effectiveType    String?

  // 시간 컨텍스트
  localHour        Int?
  localWeekday     Int?
  timezone         String?
}

model StepActivity {
  id               String   @id @default(uuid())
  userId           String
  lessonActivityId String
  lessonId         String
  stepIndex        Int

  duration         Int?
  wentBack         Boolean  @default(false)

  // 상호작용
  visHoverCount    Int?
  visClickCount    Int?
  aiQuestionCount  Int?
  codeSelections   Int?
  scrollEvents     Int?
}
```

#### 게이미피케이션

```prisma
model UserStreak {
  id            String    @id @default(uuid())
  userId        String    @unique
  currentStreak Int       @default(0)
  longestStreak Int       @default(0)
  lastActiveAt  DateTime?
}
```

---

## 환경 변수 설정 (`.env`)

```bash
# 데이터베이스
DATABASE_URL="postgresql://..."

# Firebase (인증)
FIREBASE_PROJECT_ID="..."
FIREBASE_PRIVATE_KEY="..."
FIREBASE_CLIENT_EMAIL="..."

# AI Provider (선택)
OLLAMA_HOST="http://localhost:11434"
GEMINI_API_KEY="..."

# 서버
PORT=3002
NODE_ENV="development"
```

---

## 스크립트 명령어

```bash
# 개발 서버 (hot reload)
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start

# 데이터베이스 시드
pnpm seed           # 레슨 데이터
pnpm seed:quizzes   # 퀴즈 데이터

# 테스트
pnpm test
pnpm test:watch
pnpm test:coverage
```

---

## API 버전 관리

현재 버전: **v1**

```
/api/v1/simulators/...
/api/v1/courses/...
```

일부 레거시 엔드포인트는 버전 없이 `/api/...` 형식 사용.

---

## 에러 처리 패턴

### 시뮬레이터

```typescript
try {
  const result = await simulator.run(code);
  return res.json({ success: true, ...result });
} catch (error) {
  // 재시도 없이 즉시 반환
  return res.status(500).json({
    success: false,
    error: error.message,
    errorType: "compilation" | "runtime"
  });
}
```

### 일반 API

```typescript
try {
  const data = await service.getData();
  return res.json(data);
} catch (error) {
  logger.error('Failed to get data:', error);
  return res.status(500).json({
    error: 'Failed to get data',
    message: error instanceof Error ? error.message : 'Unknown error'
  });
}
```

---

## 미들웨어

### 인증 미들웨어 (`src/middleware/auth.ts`)

```typescript
// 인증 필수
export const requireAuth: RequestHandler = async (req, res, next) => {
  // Firebase ID 토큰 검증
  // req.user에 Firebase 사용자 정보 설정
}

// DB 사용자 필수
export const requireDbUser: RequestHandler = async (req, res, next) => {
  // Firebase 인증 + Prisma User 조회
  // req.user.dbUser에 DB 사용자 정보 설정
}

// 인증 선택적 (비로그인 사용자도 접근 가능)
export const optionalAuth: RequestHandler = async (req, res, next) => {
  // 토큰 있으면 검증, 없어도 통과
}

export const optionalDbUser: RequestHandler = async (req, res, next) => {
  // DB 사용자 조회, 없어도 통과
}
```

---

## 콘텐츠 관리 (`prisma/content/`)

### JSON 기반 콘텐츠 시스템

```
content/
├── c/
│   ├── curriculum.json      # C언어 커리큘럼 정의
│   └── lessons/
│       ├── c-1-1.json       # 챕터1 레슨1
│       ├── c-1-2.json
│       └── ...
├── javascript/
│   ├── curriculum.json
│   └── lessons/
├── java/
│   ├── curriculum.json
│   └── lessons/
├── python/
│   ├── curriculum.json
│   └── lessons/
└── quizzes/                 # 독립 퀴즈 (2026-01-27 추가)
    ├── c/
    │   └── ox/
    │       ├── c-var.json   # 변수와 자료형
    │       ├── c-ptr.json   # 포인터 기초
    │       └── c-mem.json   # 동적 메모리
    ├── javascript/
    ├── java/
    └── python/
```

### 레슨 JSON 형식

```json
{
  "id": "c-1-1",
  "title": "변수와 메모리",
  "description": "...",
  "difficulty": "basic",
  "estimatedTime": 15,
  "language": "c",
  "code": "int x = 5;\nint y = x + 10;",
  "steps": [
    {
      "line": 1,
      "title": "변수 선언",
      "description": "int x = 5;는 정수형 변수 x를 선언하고..."
    }
  ],
  "quizzes": [
    {
      "type": "ox",
      "question": "변수는 메모리에 저장되는가?",
      "answer": "true",
      "explanation": "..."
    }
  ]
}
```

### 퀴즈 JSON 형식

```json
{
  "language": "c",
  "quizType": "ox",
  "chapterId": "c-var",
  "chapterTitle": "변수와 자료형",
  "quizzes": [
    {
      "id": "ox-c-var-q1",
      "question": "int 자료형은 정수를 저장한다.",
      "answer": "true",
      "explanation": "...",
      "concepts": ["int", "자료형", "정수"],
      "difficulty": "easy",
      "orderNum": 1
    }
  ]
}
```

---

## 배포 아키텍처

### 개발 환경

- Database: PostgreSQL (NeonDB)
- AI Provider: Ollama (로컬)
- Port: 3002

### 프로덕션 환경

- Database: PostgreSQL (NeonDB)
- AI Provider: Google Gemini
- CORS: 프론트엔드 도메인만 허용

---

## 참고 문서

- **프론트엔드 아키텍처**: `.claude/context/frontend_arch.md`
- **C 시뮬레이터 상세**: `.claude/context/c-simulator-hybrid.md`
- **리팩토링 규칙**: `.claude/rules/REFACTORING.md`
- **데이터 스키마 확장**: `.claude/rules/DATA_SCHEMA.md`
- **버전 관리**: `.claude/rules/VERSION_CONTROL.md`
- **독립 퀴즈 시스템 계획**: `.claude/plans/standalone-quiz-system.md`
