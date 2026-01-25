# 백엔드 아키텍처 (`C-OSINE/packages/backend/`)

이 문서는 C-OSINE 프로젝트의 Node.js 기반 백엔드 아키텍처를 설명합니다. 이 아키텍처는 모듈 기반으로 구성되어 있으며, 각 모듈은 특정 도메인이나 기능을 담당합니다.

### 주요 기술 스택
- **API 서버**: Express.js
- **ORM**: Prisma
- **데이터베이스**: SQLite (개발용), PostgreSQL (프로덕션용)
- **언어**: TypeScript

### 아키텍처 개요
- **모듈 시스템**: `src/modules` 아래에 각 기능 모듈이 위치합니다. 각 모듈은 특정 도메인(예: `problems`, `users`, `submissions`)과 관련된 라우트, 서비스, 타입 정의 등을 포함합니다.
- **메인 진입점**: `src/app.ts` 파일이 Express 앱의 메인 진입점 역할을 하며, 모든 모듈의 라우터를 등록하고 CORS, JSON 파서 등의 공통 미들웨어를 설정합니다.
- **설정 관리**: `src/config` 디렉토리에서 환경 변수를 `zod`로 검증하고, 애플리케이션 전반에 사용될 설정 객체를 생성하여 제공합니다.

### 디렉토리 구조 상세

백엔드 아키텍처는 **모듈 기반 구조**와 **공용 디렉토리 구조**를 함께 사용합니다.

- **`src/modules/`**: **핵심 원칙: 특정 도메인에 종속적인 코드를 위치시킵니다.**
  - 각 디렉토리가 하나의 기능(도메인)을 담당합니다. (예: `users`, `courses`)
  - 모듈 내에는 해당 도메인에서만 사용하는 라우트, 서비스, 타입 정의, 데이터베이스 관련 로직 등이 포함됩니다.
  - **새로운 기능을 추가할 때는 먼저 `modules` 아래에 새로운 모듈을 생성하는 것을 고려해야 합니다.**

- **`src/services/`**, **`src/utils/`**, **`src/types/`**, **`src/middleware/`** (최상위 공용 디렉토리)
  - **핵심 원칙: 둘 이상의 모듈에서 재사용되는 공통 코드를 위치시킵니다.**
  - `services/`: 여러 도메인에서 공통으로 사용되는 비즈니스 로직. (예: 통합 알림 서비스)
  - `utils/`: 특정 도메인에 종속되지 않는 순수 유틸리티 함수. (예: 날짜 포매팅, 문자열 처리)
  - `types/`: 여러 모듈에서 공통으로 사용되는 전역 타입 정의.
  - `middleware/`: 여러 라우트 또는 모듈에서 공통으로 사용되는 Express 미들웨어.

> **⚠️ 언제 공용 디렉토리를 사용해야 하나요?**
>
> 코드를 작성하기 전에 "이 로직이 다른 모듈에서도 사용될 가능성이 있는가?"를 먼저 자문해보세요.
> - **"아니오"**: 현재 작업 중인 모듈(`modules/my-module/`) 내에 작성하세요.
> - **"예"**: 최상위 공용 디렉토리(`services/`, `utils/` 등)에 작성하여 재사용성을 높이세요.

### 모듈 종류 (`src/modules`)
현재 다음과 같은 모듈들이 존재합니다:
- `admin`: 관리자 기능
- `ai`: AI 관련 기능 (코드 설명 등)
- `analytics`: 통계 데이터
- `courses`: 강좌 및 레슨 (가장 중요한 비즈니스 로직)
- `executors`: 실제 코드 실행 로직 (Docker 기반)
- `gamification`: 게임화 요소 (업적, 스트릭 등)
- `notes`: 사용자 학습 노트
- `problems`: 연습 문제 및 알고리즘 문제
- `shared`: 여러 모듈에서 공유하는 공통 로직 (Expression Evaluator 등)
- **`simulators`**: 교육용 실시간 코드 시뮬레이터 (핵심 차별화 요소)
  - `c`: C 언어 메모리/포인터 시뮬레이터 (기본 V3 엔진)
  - `python`: Python 참조 모델 시뮬레이터 (Names -> Objects)
  - `java`: Java 객체 참조/메모리 시뮬레이터
  - `javascript`: JS 엔진 동작(Event Loop, Closure 등) 시뮬레이터
- `submissions`: 제출된 코드 관리
- `users`: 사용자 프로필 및 인증 관리

#### 통합 시뮬레이터 API 패턴
모든 시뮬레이터는 다음과 같은 통일된 API 경로를 제공합니다:
- `POST /api/v1/simulators/{lang}/simulate` 또는 `trace`
- 입력: `{ code: string, stdin?: string }`
- 출력: `{ success: boolean, steps: Step[], error?: string }`

이러한 구조를 통해 프론트엔드에서는 언어에 관계없이 동일한 `simulatorService` 인터페이스를 통해 실시간 시각화 데이터를 획득할 수 있습니다.

#### Courses 모듈 상세 (`src/modules/courses`)

**핵심 원칙: DRY - 진행률 계산은 백엔드에서만**

Courses 모듈은 언어 → 챕터 → 레슨 계층 구조를 관리하며, **모든 진행률 계산은 백엔드에서 수행**합니다.

**API 설계 철학:**
- 비로그인 사용자: 코스 구조만 제공 (진행률 없음)
- 로그인 사용자: 코스 구조 + 계산된 진행률 포함
- 프론트엔드는 **절대 진행률을 계산하지 않고 표시만** 수행

**주요 API:**
```typescript
// 언어 상세 + 챕터 + 진행률 (통합 API)
GET /api/courses/:languageId
- 미들웨어: optionalDbUser (인증 선택적)
- 로그인 시: 각 챕터에 progress { total, completed, percentage } 포함
- 비로그인 시: progress 필드 없음

// 사용자 전체 진행률
GET /api/courses/progress
- 미들웨어: requireDbUser (인증 필수)
- 모든 레슨의 진행 상태 반환

// 진행 상태 업데이트
POST /api/courses/progress
- 미들웨어: requireDbUser (인증 필수)
- 레슨 완료 시 자동으로 스트릭(streak) 업데이트
```

**서비스 레이어 책임:**
- `getLanguageWithChapters(languageId, userId?)`:
  - userId 제공 시 → DB에서 진행률 조회 + 챕터별 집계 계산
  - userId 미제공 시 → 코스 구조만 반환
- `updateProgress(userId, lessonId, data)`:
  - 진행 상태 저장 + 완료 시 gamification 모듈 연동

**Why?**
- ✅ DRY: 진행률 계산 로직이 한 곳에만 존재
- ✅ 일관성: DB 직접 수정 시에도 즉시 반영
- ✅ 성능: API 호출 1번으로 모든 데이터 획득
- ✅ 유지보수: 계산 로직 변경 시 백엔드만 수정

### Prisma ORM 쿼리 규칙

**⚠️ 핵심 규칙: `select`와 `include`를 동시에 사용할 수 없습니다**

Prisma는 쿼리에서 `select`와 `include`를 동시에 사용하는 것을 허용하지 않습니다.

**규칙 설명:**
- **`select`**: 특정 스칼라 필드만 선택 (예: `id`, `name`, `email`)
- **`include`**: 관계(relation) 포함 (예: `user.posts`, `lesson.progress`)
- **제약**: 하나의 쿼리 레벨에서 둘 중 하나만 사용 가능

**❌ 잘못된 예시:**
```typescript
prisma.chapter.findMany({
  include: {
    lessons: {
      select: {        // ❌ 여기서 select 사용
        id: true,
        title: true,
      },
      include: {       // ❌ 동시에 include 사용 불가!
        progress: true,
      },
    },
  },
});
```

**에러 메시지:**
```
Please either use `include` or `select`, but not both at the same time.
```

**✅ 올바른 해결 방법:**

**Option 1: `include`만 사용 (권장)**
```typescript
prisma.chapter.findMany({
  include: {
    lessons: {
      // select 제거, 모든 필드 포함
      include: {
        progress: true,  // relation만 include
      },
    },
  },
});
```

**Option 2: `select`만 사용 (필요한 경우)**
```typescript
prisma.chapter.findMany({
  select: {
    id: true,
    title: true,
    lessons: {
      select: {  // relation도 select로 명시
        id: true,
        title: true,
        progress: {
          select: {
            status: true,
          },
        },
      },
    },
  },
});
```

**Option 3: 조건부 쿼리 분리**
```typescript
// userId 유무에 따라 완전히 다른 쿼리 실행
const query = userId
  ? { include: { lessons: { include: { progress: true } } } }
  : { include: { lessons: true } };

const data = await prisma.chapter.findMany(query);
```

**실제 적용 사례 (courses/service.ts):**
```typescript
// ❌ 이전 코드 (에러 발생)
include: {
  lessons: {
    select: { id: true, title: true },  // select 사용
    ...(userId && {
      include: { progress: true },      // include 추가 시도
    }),
  },
}

// ✅ 수정된 코드
include: {
  lessons: {
    // select 제거, lessons의 모든 필드 포함
    ...(userId && {
      include: { progress: true },
    }),
  },
}
```

**성능 고려사항:**
- `select` 없이 모든 필드를 가져와도 대부분의 경우 성능 문제 없음
- 무거운 relation(예: `content`, `quizzes`)은 자동으로 포함되지 않음 (명시적 `include` 필요)
- 진짜 성능 문제가 있다면 Option 2나 Option 3 고려

### Data Storage & Seeding

This section describes how application data, especially course content and AI configurations, is managed and initialized within the backend.

-   **`prisma/content/` Directory (V2 - Latest Source of Truth)**: This is the primary repository for the V2 lesson content used in the current version of the application.
    -   **Structure**: `prisma/content/{lang}/lessons/**/*.json`.
    -   **Content Features**: These JSON files are richer and more structured than the legacy V1 files. They include advanced pedagogical elements such as `concept`, `misconceptions`, `keyTakeaway`, and crucially, detailed `steps` with `memoryChanges` (diff-based updates) which are optimized for the visualization engine.
    -   **Usage**: The `lessonContentLoader` service reads directly from this directory to serve lesson content efficiently.

-   **`data/lessons/` Directory (V1 - Legacy)**: This directory contains older, V1 lesson content files.
    -   **Structure**: Flat structure or simple organization.
    -   **Content Features**: Simpler structure, using `memoryState` snapshots rather than changes. These files are considered legacy and should generally be ignored in favor of the V2 content in `prisma/content`.

-   **`prisma/` Directory (Seeding Scripts)**: The `prisma` directory houses scripts responsible for populating the database.
    -   **`*-seed.ts` files**: TypeScript files that read the structured JSON data (from `prisma/content`) and populate the database.
    -   **`seed.ts`**: The main orchestration script for seeding.

---

### Python 시뮬레이터 상세 (`src/modules/simulators/python`)

Python 시뮬레이터는 **Names → Objects 참조 모델**을 시각화합니다. C와 달리 Python은 변수가 메모리 공간이 아닌 **객체를 참조**하는 "이름표" 역할을 합니다.

#### 아키텍처 개요

```
simulators/python/
├── routes.ts          # API 라우트 (POST /simulate)
├── simulator.ts       # 메인 시뮬레이터 로직
├── context.ts         # PySimContext - 상태 관리
├── types.ts           # 타입 정의 (PyObject, PyName, PyStep 등)
└── handlers/          # 코드 패턴별 핸들러
    ├── index.ts       # 핸들러 레지스트리
    ├── assign.handler.ts      # 할당문: a = 10, b = a + b
    ├── function-def.handler.ts # 함수 정의: def foo():
    ├── function-call.handler.ts # 함수 호출: foo()
    ├── class-def.handler.ts    # 클래스 정의: class Foo:
    ├── instance-create.handler.ts # 인스턴스 생성: obj = Foo()
    ├── method-call.handler.ts  # 메서드 호출: obj.method()
    └── global.handler.ts       # global 선언
```

#### 핸들러 패턴

각 핸들러는 `PyCodeHandler` 인터페이스를 구현합니다:

```typescript
interface PyCodeHandler {
  name: string;
  priority: number;  // 낮을수록 먼저 매칭 시도
  canHandle(code: string): boolean;  // 이 핸들러가 처리 가능한지
  handle(ctx: PySimContext, lineNum: number, code: string): PyStep | null;
}
```

#### 지원 기능 (assign.handler.ts)

**표현식 평가 (`evaluateExpr`)**:
- 리터럴: `int`, `float`, `str`, `bool`, `None`
- 컬렉션: `list`, `tuple`, `dict`, `set`
- 변수 참조: `a`, `b` (스코프 기반 탐색)
- **산술 연산**: `+`, `-`, `*`, `/` (재귀적 평가)

**산술 연산 구현**:
```typescript
// 비탐욕적 정규식으로 왼쪽에서 오른쪽 결합
const binaryMatch = trimmed.match(/^(.+?)\s*([+\-*/])\s*(.+)$/);
// a + b + c → (a + b) + c
```

- 타입 체크: `int`/`float`만 지원
- 결과 타입: `int + float = float` (Python 동작 준수)
- 에러 처리:
  - `TypeError`: 숫자가 아닌 타입 연산 시
  - `ZeroDivisionError`: 0으로 나누기

**에러 처리**:
- `UnboundLocalError`: 함수 내 로컬 변수가 할당 전 참조될 때

#### 향후 확장 계획

- `%` (모듈로), `**` (거듭제곱), `//` (정수 나눗셈)
- 괄호 표현식: `(a + b) * c`
- 비교 연산자: `>`, `<`, `==`, `!=`
- 문자열 연결: `"hello" + " world"`
- 조건문/반복문: `if`, `for`, `while`