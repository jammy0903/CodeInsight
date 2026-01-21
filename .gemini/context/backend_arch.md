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

### 모듈 구조 (`src/modules`)
현재 다음과 같은 모듈들이 존재합니다:
- `admin`: 관리자 기능
- `ai`: AI 관련 기능 (코드 설명 등)
- `analytics`: 통계 데이터
- `c`: C 언어 실행 관련 시뮬레이터
- `courses`: 강좌 및 레슨
- `executors`: 코드 실행 로직
- `gamification`: 게임화 요소 (업적 등)
- `memory`: C 언어 메모리 시뮬레이터 (레거시)
- `notes`: 사용자 노트
- `problems`: 문제
- `shared`: 여러 모듈에서 공유하는 로직
- `simulators`: Python 등 다른 언어 시뮬레이터
- `submissions`: 제출된 코드
- `users`: 사용자 관리

`memory` 모듈은 내부에 `handlers`, `types`, `simulator.ts` 등을 포함하며, C 코드 실행 시 메모리 상태를 시뮬레이션하는 역할을 합니다.