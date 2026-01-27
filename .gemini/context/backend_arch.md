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

---

## 🔧 디버거 기반 시뮬레이터 아키텍처 (Debugger-Based Simulators)

### 개요

모든 언어 시뮬레이터는 **실제 디버거/인터프리터 기반** 접근 방식을 사용합니다. 패턴 매칭 시뮬레이션이 아닌, 실제 코드를 실행하며 상태를 캡처합니다.

| 언어 | 디버거 방식 | 상태 |
|------|------------|------|
| Java | JDI (Java Debug Interface) | ✅ 완료 |
| Python | `sys.settrace()` | ✅ 완료 |
| JavaScript | Node.js `vm` 모듈 + AST 계측 | ✅ 완료 |
| C | gcc + 메모리 시뮬레이션 | 유지 |

### 4단계 파이프라인 (공통 패턴)

모든 디버거 기반 시뮬레이터는 동일한 파이프라인을 따릅니다:

```
1. Setup    → 임시 디렉토리 생성 + 소스 파일 작성
2. Compile  → 언어별 컴파일/문법 검증
3. Debug    → 디버거 에이전트 실행 → 스냅샷 캡처
4. Cleanup  → 임시 파일 정리 (finally 블록에서)
```

### C 시뮬레이터 스텝 생성 구조 (2026-01-27 업데이트)

C 시뮬레이터는 다음 순서로 스텝을 생성합니다:

```
1. 전처리기 스텝 (#include 등) → createPreprocessorSteps()
2. 함수 진입 스텝 (main 포함) → createFunctionEntryStep()
3. 함수 본문 스텝들        → executeFunction()
4. 함수 호출/복귀 스텝     → executeFunction() 내부
```

**스텝 생성 흐름 예시:**
```c
#include <stdio.h>    // Step 1: 전처리기 설명

int main() {          // Step 2: main() 함수 진입 설명
    int a = 5;        // Step 3: 변수 선언
    printf("%d", a);  // Step 4: printf 출력
    return 0;         // Step 5: 함수 종료
}
```

**함수 호출 시 스텝 흐름 (간결화됨, 2026-01-27):**
```c
// main() 함수 내부에서...
int sum = add(a, b);  // Step N: 📞 함수 호출 (한 번만 설명!)
// ↓ add() 함수 내부로 바로 진입 (진입 스텝 없음)
int result = x + y;   // Step N+1: add() 변수 선언
return result;        // Step N+2: add() 종료
// ↓ 호출자로 바로 복귀 (복귀 스텝 없음)
printf("sum=%d", sum);// Step N+3: main() 다음 줄 바로 실행
```

**핵심 원칙: 함수 호출은 한 번만 설명!**
- ~~함수 진입 스텝~~ 제거 (중복)
- ~~복귀 스텝~~ 제거 (불필요)
- 호출 설명 후 바로 함수 내부 실행
- 함수 종료 후 바로 다음 줄 실행

```typescript
// 1. 호출 스텝 (호출자 컨텍스트에서, 한 번만!)
steps.push(this.createStep(lineNum, code, "📞 함수 호출..."));

// 2. 프레임 변경
this.setupFunctionFrame(calledFunc, argExprs);

// 3. 함수 본문 실행 (진입 스텝 없이 바로!)
steps.push(...innerSteps);

// 4. 프레임 정리 후 바로 다음 줄 (복귀 스텝 없음)
```

**주요 메서드 (simulator.ts):**
- `simulate()`: 메인 진입점, 전체 스텝 조합
- `createPreprocessorSteps()`: `#include` 등 전처리기 스텝 생성
- `createFunctionEntryStep()`: main 함수 진입 스텝 생성
- `executeFunction()`: 함수 본문 스텝 생성 (재귀적 함수 호출 지원)

### 통일된 스냅샷 포맷 (JSON)

```typescript
interface Snapshot {
  line: number;
  event: "STEP";
  stack: StackFrame[];
  heap: HeapObject[];
}

interface StackFrame {
  methodName: string;
  className: string;
  variables: Record<string, Value>;
}

interface HeapObject {
  address: string;      // "0xNNN"
  type: string;
  content: string;
  length?: number;      // 배열인 경우
}
```

### 에러 처리 원칙 (Critical!)

**⚠️ 재시도(Retry) 로직 없음**:
- 모든 디버거 클라이언트는 재시도 없이 에러를 즉시 반환
- 에러는 프론트엔드에서 Toast 알림으로 사용자에게 표시
- 이유: 사용자에게 빠른 피드백 제공, 불필요한 지연 방지

```typescript
// ❌ 잘못된 패턴 (재시도 로직)
async run(projectPath: string): Promise<any[]> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await this.execute(projectPath);
    } catch (e) {
      if (attempt < 2) continue;
      throw e;
    }
  }
}

// ✅ 올바른 패턴 (즉시 에러 반환)
async run(projectPath: string): Promise<any[]> {
  // 에러 발생 시 즉시 throw → 프론트엔드 Toast로 표시
  return await this.execute(projectPath);
}
```

---

### Python 시뮬레이터 상세 (`src/modules/simulators/python`)

Python 시뮬레이터는 **`sys.settrace()` 기반** 실제 디버거를 사용합니다.

#### 디렉토리 구조

```
simulators/python/
├── python-simulation.service.ts  # 메인 오케스트레이터 (4단계 파이프라인)
├── routes.ts                     # API 라우트 (POST /simulate)
├── types.ts                      # 타입 정의
├── engine/
│   ├── file-manager.ts           # 임시 파일 관리
│   └── debugger-client.ts        # Python 에이전트 실행 (spawn)
└── agent/
    └── debugger_agent.py         # sys.settrace() 기반 디버거
```

#### debugger_agent.py 핵심 로직

```python
import sys
import json

class DebuggerAgent:
    def trace_func(self, frame, event, arg):
        if event == 'line':
            # 이전 라인의 상태를 캡처 (settrace는 라인 실행 전 호출됨)
            if self.pending_line is not None:
                snapshot = self.capture(frame, self.pending_line)
                print(json.dumps(snapshot))  # stdout으로 출력
            self.pending_line = frame.f_lineno
        return self.trace_func
```

**주의사항**:
- `sys.settrace()`는 라인 실행 **전**에 호출됨
- 따라서 **이전 라인**의 상태를 캡처해야 변수 값이 올바름
- `flush_pending()` 메서드로 마지막 라인 상태 캡처

#### 지원 기능

- **Primitive 타입**: `int`, `float`, `str`, `bool`, `None`
- **컬렉션**: `list`, `dict`, `tuple`, `set`
- **객체**: 클래스 인스턴스, `__dict__` 속성 캡처
- **함수/메서드**: 콜스택 추적, 지역/전역 변수 분리
- **힙 참조**: 객체는 힙에 저장, 스택에서 참조

---

### JavaScript 시뮬레이터 상세 (`src/modules/simulators/javascript`)

JavaScript 시뮬레이터는 **Node.js `vm` 모듈 + AST 계측**을 사용합니다.

#### 디렉토리 구조

```
simulators/javascript/
├── javascript-simulation.service.ts  # 메인 오케스트레이터
├── routes.ts
├── types.ts
├── engine/
│   ├── file-manager.ts
│   └── debugger-client.ts
└── agent/
    └── debugger_agent.js             # vm 모듈 기반 디버거
```

#### debugger_agent.js 핵심 로직

**AST 계측 방식**:
```javascript
const acorn = require('acorn');
const escodegen = require('escodegen');

// AST 파싱 → 각 statement 후 __capture__ 호출 삽입
function instrument(code) {
  const ast = acorn.parse(code, { locations: true });
  // ... statement마다 캡처 코드 삽입
  return escodegen.generate(ast);
}
```

**Simple 모드 (AST 파싱 실패 시 폴백)**:
```javascript
// let/const → var 변환 (vm 컨텍스트 접근을 위해)
const transformed = code
  .replace(/\blet\s+/g, 'var ')
  .replace(/\bconst\s+/g, 'var ');
```

#### 지원 기능

- **Primitive 타입**: `number`, `string`, `boolean`, `null`, `undefined`
- **배열/객체**: 힙 참조 모델
- **함수**: 함수 객체로 힙에 저장
- **스코프**: 변수 스코프 추적

---

### Java 시뮬레이터 상세 (`src/modules/simulators/java`)

Java 시뮬레이터는 **JDI (Java Debug Interface)** 를 사용합니다.

#### 디렉토리 구조

```
simulators/java/
├── java-simulation.service.ts   # 메인 오케스트레이터
├── routes.ts
├── engine/
│   ├── file-manager.ts
│   ├── java-compiler.ts         # javac 컴파일
│   └── debugger-client.ts       # JAR 에이전트 실행
└── agent/
    ├── src/main/java/com/vis/DebuggerAgent.java  # JDI 기반 디버거
    └── build/debugger-agent.jar                  # 빌드된 에이전트
```

#### 에이전트 실행

```typescript
// debugger-client.ts
const child = spawn('java', [
  '-jar',
  this.AGENT_JAR_PATH,
  mainClass
], {
  cwd: projectPath,
});
```

---

### 공통 타입 정의 (types.ts 패턴)

각 시뮬레이터는 동일한 형식의 타입을 정의합니다:

```typescript
// 스텝 응답
interface SimulateResponse {
  success: boolean;
  steps: Step[];
  error?: string;
}

// 개별 스텝
interface Step {
  line: number;
  code: string;
  explanation: string;
  stack: StackFrame[];
  heap: HeapObject[];
  stdout?: string;
}
```