# CodeInsight 프로젝트 컨텍스트

이 문서는 'CodeInsight' 프로젝트에만 해당하는 기술 스택, 아키텍처, 개발 현황 등의 정보를 담고 있습니다. AI 에이전트는 이 프로젝트 관련 작업을 수행할 때 이 문서를 최우선으로 참고해야 합니다.

---

## 1. 기술 스택 (Technology Stack)

### Frontend
- **Framework**: React 18 + TypeScript
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Editor**: Monaco Editor
- **Animation**: Framer Motion

### Backend
- **Framework**: Node.js + Express + TypeScript
- **ORM**: Prisma
- **Database**: SQLite (초기), PostgreSQL (확장 예정)
- **Execution Environment**: Docker (C 코드 실행용)

### AI
- **Primary Model**: Ollama (qwen2.5-coder:7b)
- **Backup Model**: DeepSeek API

---

## 2. 포트 설정 (Port Configuration)

| 서비스 | 포트 | 실행 명령어 (`cd` 후) |
|----------|---------|--------------------|
| Backend | `3002` | `npm run dev` |
| Frontend | `5174` | `npm run dev` |

---

## 3. 프로젝트 구조 (Project Structure)

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # 환경변수 관리 (Zod)
│   │   └── database.ts
│   ├── modules/
│   │   ├── c/                  # C 코드 실행 관련 모듈
│   │   ├── memory/             # 메모리 시뮬레이션 모듈
│   │   └── ai/                 # AI 해설자 모듈
│   └── app.ts
├── prisma/schema.prisma
└── .env.example

frontend/
├── src/
│   ├── features/
│   │   ├── visualizers/        # 메모리 시각화 컴포넌트 (언어별)
│   │   │   └── c/
│   │   ├── chat/               # AI 해설자 (Q&A) 컴포넌트
│   │   └── courses/            # 개념 코스 관련 컴포넌트
│   ├── data/courses/           # (레거시) 정적 코스 데이터 (DB로 마이그레이션 예정)
│   ├── types/                  # 프로젝트 전역 타입 정의
│   ├── services/               # API 클라이언트 (axios 등)
│   ├── components/ui/          # shadcn/ui 컴포넌트
│   └── stores/                 # Zustand 스토어
└── .env.example
```

### 새 기능 추가 구조
새로운 기능은 `frontend/src/features/` 디렉토리 하위에 모듈 단위로 추가합니다.
```
frontend/src/features/
└── new-feature/
    ├── index.ts           # Public exports
    ├── NewFeature.tsx     # Main component
    ├── components/        # Internal components
    ├── hooks/             # Feature-specific hooks
    └── types.ts           # Feature-specific types
```

---

## 4. API 엔드포인트 (API Endpoints)

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/courses/languages` | 지원하는 언어 목록 조회 |
| GET | `/api/courses/:lang/chapters` | 해당 언어의 챕터 목록 조회 |
| GET | `/api/courses/chapters/:id` | 특정 챕터의 상세 정보 및 레슨 목록 조회 |
| GET | `/api/courses/lessons/:id` | 특정 레슨의 상세 정보 (콘텐츠, 퀴즈 포함) 조회 |
| POST | `/api/courses/progress` | 사용자 학습 진행 상태 업데이트 |
| POST | `/api/c/run` | C 코드 실행 요청 |
| POST | `/api/memory/trace` | 코드에 대한 메모리 상태 변화 추적 요청 |
| POST | `/api/ai/chat` | AI 해설자에게 질문 |
| GET | `/api/ai/health` | AI 모델 서버 상태 확인 |

---

## 5. 구현 현황 (2026-01-03 기준)

### 5.1 완료된 기능
- **사용자 시스템**: 닉네임 기반 가입, 다중 OAuth(Google, GitHub, Kakao) 지원
- **코스 시스템 (DB 기반)**: 언어/챕터/레슨 조회 API 및 페이지
- **Lesson 학습 컴포넌트**: 코드 뷰어, 스텝별 설명, 컨트롤러 등
- **퀴즈 시스템**: 퀴즈 카드 및 결과 표시
- **메모리 시각화**: C언어 코드 실행에 따른 메모리 상태 시각화
- **AI 해설자**: 코스 내용과 연동된 Q&A 채팅 기능
- **백엔드 인프라**: C 코드 실행/추적 서비스, 인증/보안 미들웨어, 테스트 환경(vitest)

### 5.2 다음 개발 단계
1.  **프론트엔드 인증 연동**: 로그인/로그아웃 및 사용자 상태 관리 로직 구현
2.  **학습 진행 상태 서버 저장**: 현재 localStorage 기반인 진행 상태를 DB에 저장하도록 마이그레이션
3.  **실습 문제 연동**: 코스 내에 실습 문제(Problem)를 통합
4.  **Python/Java 코스 확장**: C언어 외 다른 언어 지원 추가

---

## 6. 주요 참고 문서

| 문서 경로 | 설명 |
|-----------|------|
| `docs/architecture/SYSTEM_OVERVIEW.md` | 시스템 전체 구조 (기능, API, DB, 보안) |
| `docs/plans/TODO.md` | 현재 진행 중인 작업 및 리팩토링 계획 |
| `docs/reference/CURRICULUM.md` | C언어 개념 커리큘럼 상세 내용 |
| `.claude/KEEP_FILES.md` | **삭제 금지 파일 목록** (Phase 2에서 사용할 예정) |
