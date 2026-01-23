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

### Data Storage & Seeding

This section describes how application data, especially course content and AI configurations, is managed and initialized within the backend.

-   **`data/` Directory**: This directory serves as a repository for static content and configuration files that are crucial for the application's functionality.
    -   **`ai-settings.json`**: Stores configurations for AI-related features, such as model parameters or prompt templates.
    -   **`lessons/**/*.json`**: Contains the raw, structured content for various programming language lessons (e.g., C, Python, Java). These JSON files define the lesson structure, problem statements, example codes, and other pedagogical elements.

-   **`prisma/` Directory (Seeding Scripts)**: The `prisma` directory, in addition to defining the database schema (`schema.prisma`), houses scripts responsible for populating the database with initial and content-related data.
    -   **`*-seed.ts` files (e.g., `c-json-content-seed.ts`, `java-content-seed.ts`)**: These TypeScript files read the structured JSON data from the `data/lessons` directory and use Prisma Client to insert this content into the corresponding database tables (e.g., `Courses`, `Lessons`, `Problems`). They are essential for setting up development environments and deploying new content.
    -   **`seed.ts`**: The main seeding script that orchestrates the execution of all individual `*-seed.ts` files, ensuring the database is fully populated with necessary content upon initialization.