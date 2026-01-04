# CodeInsight 시스템 아키텍처

> 마지막 업데이트: 2026-01-03

---

## 1. 프로젝트 개요

**CodeInsight**는 코드 실행 원리를 시각적으로 학습하는 플랫폼입니다.

### 핵심 가치
- 코드를 한 줄씩 실행하며 메모리 변화를 **눈으로 확인**
- AI가 **왜 이렇게 동작하는지** 설명
- 코스 기반 **체계적 학습**

### 이 앱은 무엇이 아닌가
| ❌ 아닌 것 | 이유 |
|-----------|------|
| 코딩테스트 플랫폼 | 로직/알고리즘 중심 |
| 문제은행 (BOJ, LeetCode) | 정답 맞추기 중심 |
| IDE | 결과만 보여줌 |

---

## 2. 기능 목록

| 기능 | 상태 | 설명 |
|------|------|------|
| **코드 시뮬레이터** | ✅ 완료 | C 코드 단계별 실행, 메모리 시각화 |
| **AI 해설자** | ✅ 완료 | 현재 줄 자동 해설 + Q&A 대화 |
| **개념 코스** | ✅ 완료 | Day별 학습 (C/Python/Java) |
| **결과 예측 퀴즈** | ✅ 완료 | 코스 내 퀴즈 |
| **사용자 인증** | ✅ 완료 | Google 로그인 (Firebase) |
| **실습 문제** | 📋 계획 | 코스별 연습 문제 + 채점 |
| **진행률 추적** | 📋 계획 | 학습 완료 현황 |

---

## 3. 기술 스택

### Backend
| 기술 | 용도 |
|------|------|
| Node.js + Express | API 서버 |
| TypeScript | 타입 안전성 |
| Prisma + SQLite | ORM + 데이터베이스 |
| Docker | C 코드 샌드박스 실행 |
| Firebase Admin | 토큰 검증 |
| Zod | 스키마 검증 |
| Vitest | 테스트 |

### Frontend
| 기술 | 용도 |
|------|------|
| React 18 | UI 프레임워크 |
| TypeScript | 타입 안전성 |
| Zustand | 상태 관리 |
| Tailwind CSS | 스타일링 |
| shadcn/ui | UI 컴포넌트 |
| Monaco Editor | 코드 에디터 |
| Framer Motion | 애니메이션 |
| Firebase Auth | 인증 |

### AI
| 기술 | 용도 |
|------|------|
| Ollama (qwen2.5-coder:7b) | 로컬 LLM (기본) |
| DeepSeek API | 백업 |

### 포트 설정
| 서비스 | 포트 |
|--------|------|
| Backend | 3002 |
| Frontend | 5174 |

---

## 4. 백엔드 구조

### 디렉토리
```
backend/src/
├── app.ts                 # Express 앱 진입점
├── config/
│   ├── env.ts             # 환경변수 (Zod)
│   ├── index.ts           # 설정 객체
│   ├── database.ts        # Prisma 클라이언트
│   ├── firebase.ts        # Firebase Admin SDK
│   └── swagger.ts         # API 문서
├── middleware/
│   ├── auth.ts            # Firebase 토큰 검증
│   ├── rateLimit.ts       # 요청 제한
│   └── index.ts
└── modules/
    ├── c/                 # C 코드 실행
    ├── memory/            # 메모리 트레이스
    ├── ai/                # AI 해설자
    ├── users/             # 사용자 관리
    ├── problems/          # 실습 문제
    └── submissions/       # 제출 기록
```

### 모듈별 역할

#### c/ - C 코드 실행
- Docker 컨테이너에서 gcc 컴파일 + 실행
- 보안: FORBIDDEN_PATTERNS로 위험 코드 차단
- 테스트: `executor.test.ts` (47개 보안 테스트)

#### memory/ - 메모리 트레이스
- C 코드 실행 시 메모리 상태 추적
- Stack/Heap 변수, 포인터 관계 시뮬레이션

#### ai/ - AI 해설자
- Provider 패턴: Ollama, DeepSeek, Claude
- 자동 해설 (GET /explain) + Q&A (POST /chat)

#### users/ - 사용자 관리
- Firebase 토큰 기반 인증
- `/me` 패턴으로 현재 사용자 정보 조회

#### problems/ - 실습 문제
- 코스와 연결된 연습 문제
- 테스트케이스 기반 채점

#### submissions/ - 제출 기록
- 사용자별 제출 이력 저장
- 진행률 추적용

### API 엔드포인트

| 엔드포인트 | 메서드 | 인증 | Rate Limit | 설명 |
|-----------|--------|------|------------|------|
| `/api/courses/languages` | GET | ❌ | 100/min | 언어 목록 |
| `/api/courses/:lang/chapters` | GET | ❌ | 100/min | 챕터 목록 |
| `/api/courses/chapters/:id` | GET | ❌ | 100/min | 챕터 상세 (레슨 포함) |
| `/api/courses/chapters/:id/progress` | GET | ✅ | 100/min | 챕터 진행 상태 |
| `/api/courses/lessons/:id` | GET | ❌ | 100/min | 레슨 상세 (콘텐츠+퀴즈) |
| `/api/courses/progress` | GET | ✅ | 100/min | 내 전체 진행 상태 |
| `/api/courses/progress` | POST | ✅ | 100/min | 진행 상태 업데이트 |
| `/api/c/run` | POST | ❌ | 30/min | C 코드 실행 |
| `/api/c/judge` | POST | ❌ | 30/min | 테스트케이스 채점 |
| `/api/memory/trace` | POST | ❌ | 30/min | 메모리 트레이스 |
| `/api/ai/chat` | POST | ❌ | 20/min | AI Q&A |
| `/api/ai/explain` | GET | ❌ | 20/min | 줄 해설 |
| `/api/users/nickname/check` | GET | ✅ | 30/min | 닉네임 중복 확인 |
| `/api/users/register` | POST | ✅ | 10/min | 닉네임으로 사용자 등록 |
| `/api/users/me` | GET | ✅ | 10/min | 내 정보 (AppUser) |
| `/api/users/me/role` | GET | ✅ | 10/min | 내 권한 |
| `/api/problems` | GET | ❌ | 100/min | 문제 목록 |
| `/api/problems/:id` | GET | ❌ | 100/min | 문제 상세 |
| `/api/submissions` | POST | ✅ | 100/min | 제출 생성 |
| `/api/submissions/me` | GET | ✅ | 100/min | 내 제출 기록 |
| `/api/submissions/me/solved` | GET | ✅ | 100/min | 푼 문제 목록 |

---

## 5. 프론트엔드 구조

### 디렉토리
```
frontend/src/
├── App.tsx                # 라우터 설정
├── main.tsx               # 진입점
├── config/
│   ├── env.ts             # 환경변수 (Zod)
│   ├── index.ts           # 설정 객체
│   └── theme.ts           # 테마 설정
├── components/ui/         # shadcn/ui 컴포넌트
├── layouts/
│   ├── TopBar.tsx         # 헤더 + 네비게이션
│   └── components/
├── features/
│   ├── visualizers/c/     # 메모리 시각화
│   ├── courses/           # 코스 학습
│   └── chat/              # AI 채팅 (TODO)
├── data/courses/          # 레거시 (정적 데이터, 마이그레이션 예정)
│   ├── c/
│   ├── python/
│   └── java/
├── services/
│   ├── firebase.ts        # 인증
│   ├── courses.ts         # 코스 API (Language/Chapter/Lesson)
│   ├── crunner.ts         # C 실행 API
│   ├── tracer.ts          # 메모리 트레이스 API
│   └── ai.ts              # AI 해설 API
├── stores/
│   └── store.ts           # Zustand 전역 상태
└── types/
    ├── index.ts           # 공통 타입
    ├── course-schema.ts   # 코스 타입 (Language/Chapter/Lesson/Quiz)
    └── memory.ts          # 메모리 시각화 타입
```

### 페이지 라우팅

| 경로 | 컴포넌트 | 상태 |
|------|----------|------|
| `/` | HomePage | ✅ |
| `/simulator` | SimulatorPage | ✅ |
| `/courses` | CoursesPage | ✅ |
| `/courses/:lang` | ChaptersPage | ✅ |
| `/courses/:lang/:chapterId` | LessonsPage | ✅ |
| `/courses/:lang/:chapterId/:lessonId` | LessonPage | ✅ |
| `/chat` | ChatPage | 📋 TODO |

### 상태 관리 (Zustand)

```typescript
interface Store {
  // 사용자 인증 (Firebase + Backend 분리)
  firebaseUser: FirebaseUser | null;  // Firebase Auth 상태
  appUser: AppUser | null;            // 백엔드 사용자 정보
  needsRegistration: boolean;         // 닉네임 등록 필요 여부
  authLoading: boolean;

  // 채팅
  messages: Message[];
  isAiLoading: boolean;

  // 시뮬레이터
  code: string;
  result: RunResult | null;
  isRunning: boolean;

  // 시뮬레이션 스텝
  steps: Step[];
  currentStep: number;
}

// AppUser 타입 (백엔드에서 조회)
interface AppUser {
  nickname: string;           // PK, 고유 식별자
  role: 'user' | 'admin';
  oauthAccounts: OAuthAccount[];
  createdAt: string;
}

interface OAuthAccount {
  provider: 'google' | 'github' | 'kakao';
  email: string | null;
}
```

> **인증 흐름**: Firebase 로그인 → `firebaseUser` 설정 → 백엔드 `/users/me` 조회 →
> 등록된 사용자면 `appUser` 설정, 미등록이면 `needsRegistration: true` → 닉네임 모달 표시

---

## 6. 데이터베이스 스키마

### ERD - 사용자 & 문제

```
┌─────────────────┐       ┌─────────────┐       ┌─────────────┐
│      User       │       │   Problem   │       │ Submission  │
├─────────────────┤       ├─────────────┤       ├─────────────┤
│ nickname (PK)   │───┐   │ id          │───┐   │ id          │
│ role            │   │   │ number      │   │   │ userNickname│──┐
│ createdAt       │   │   │ title       │   │   │ problemId   │──┼─┐
└─────────────────┘   │   │ description │   │   │ code        │  │ │
        │             │   │ difficulty  │   │   │ verdict     │  │ │
        │ 1:N         │   │ tags        │   │   │ execTime    │  │ │
        ▼             │   │ testCases   │   │   │ createdAt   │  │ │
┌─────────────────┐   │   │ lessonId*   │   │   └─────────────┘  │ │
│  OAuthAccount   │   │   └─────────────┘   │                    │ │
├─────────────────┤   │                     │                    │ │
│ provider        │   │                     │                    │ │
│ providerId (PK) │   └─────────────────────┼────────────────────┘ │
│ userNickname(FK)│                         └──────────────────────┘
│ email           │
└─────────────────┘
```

### ERD - 코스 시스템

```
┌─────────────────┐
│    Language     │
├─────────────────┤
│ id (PK)         │  'c', 'java', 'python'
│ name            │
│ description     │
│ icon            │
│ color           │
│ isActive        │
│ order           │
└────────┬────────┘
         │ 1:N
         ▼
┌─────────────────┐
│    Chapter      │
├─────────────────┤
│ id (PK)         │
│ languageId (FK) │──────────────────────────┐
│ title           │                          │
│ description     │                          │
│ keyQuestion     │  '변수는 어디에 저장되는가?'
│ order           │                          │
│ isActive        │                          │
└────────┬────────┘                          │
         │ 1:N                               │
         ▼                                   │
┌─────────────────┐       ┌─────────────────┐│
│     Lesson      │       │  LessonContent  ││
├─────────────────┤       ├─────────────────┤│
│ id (PK)         │──1:1──│ id (PK)         ││
│ chapterId (FK)  │       │ lessonId (FK)   ││
│ title           │       │ code            ││
│ description     │       │ language        ││
│ difficulty      │       │ steps (JSON)    ││
│ order           │       └─────────────────┘│
│ estimatedTime   │                          │
│ isActive        │                          │
└────────┬────────┘                          │
         │ 1:N                               │
         ▼                                   │
┌─────────────────┐       ┌─────────────────┐│
│      Quiz       │       │  UserProgress   ││
├─────────────────┤       ├─────────────────┤│
│ id (PK)         │       │ id (PK)         ││
│ lessonId (FK)   │       │ userNickname(FK)│┘
│ type            │       │ lessonId (FK)   │
│ question        │       │ status          │
│ options (JSON)  │       │ currentStep     │
│ answer          │       │ quizScore       │
│ explanation     │       │ completedAt     │
│ order           │       └─────────────────┘
└─────────────────┘

구조: Language → Chapter → Lesson → (Content + Quiz)
```

### 테이블 상세

#### User (닉네임 기반)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| nickname | String | PK, 고유 식별자 (2-20자) |
| role | String | "user" \| "admin" |
| createdAt | DateTime | 가입일 |

#### OAuthAccount (1:N with User)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| provider | String | "google" \| "github" \| "kakao" |
| providerId | String | OAuth 제공자의 사용자 ID |
| userNickname | String | FK → User.nickname |
| email | String? | OAuth 이메일 (nullable) |

> **복합 Unique Key**: `(provider, providerId)` - 동일 OAuth 계정 중복 등록 방지
> **다중 OAuth 지원**: 한 User가 여러 OAuthAccount 연결 가능

#### Problem
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK (예: "c-ch1-swap") |
| number | Int | 문제 번호 (unique) |
| title | String | 제목 |
| description | String | 설명 (Markdown) |
| difficulty | String | 난이도 |
| tags | JSON String | 태그 배열 |
| hints | JSON String | 힌트 배열 |
| solution | String? | 정답 코드 |
| testCases | JSON String | [{input, output}] |
| timeLimit | Int | 시간 제한 (ms) |
| memoryLimit | Int | 메모리 제한 (MB) |
| lessonId | String? | FK → Lesson (레슨 연동) |

#### Submission
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| userNickname | String | FK → User.nickname |
| problemId | String | FK → Problem |
| code | String | 제출 코드 |
| verdict | String | 채점 결과 |
| executionTime | Int? | 실행 시간 (ms) |
| createdAt | DateTime | 제출일 |

#### Draft
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| userNickname | String | FK → User.nickname |
| problemId | String | FK → Problem |
| code | String | 임시 저장 코드 |
| savedAt | DateTime | 저장일 |

#### Language
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK ('c', 'java', 'python') |
| name | String | 표시 이름 ('C', 'Java', 'Python') |
| description | String? | 설명 |
| icon | String? | 아이콘 URL 또는 이모지 |
| color | String? | 테마 색상 (#hex) |
| isActive | Boolean | 활성화 여부 |
| order | Int | 정렬 순서 |

#### Chapter
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK |
| languageId | String | FK → Language |
| title | String | 챕터 제목 |
| description | String? | 설명 |
| keyQuestion | String? | 핵심 질문 |
| order | Int | 정렬 순서 |
| isActive | Boolean | 활성화 여부 |

#### Lesson
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK |
| chapterId | String | FK → Chapter |
| title | String | 레슨 제목 |
| description | String? | 설명 |
| difficulty | String | 'basic' \| 'intermediate' \| 'advanced' |
| order | Int | 정렬 순서 |
| estimatedTime | Int? | 예상 소요 시간 (분) |
| isActive | Boolean | 활성화 여부 |

#### LessonContent
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK |
| lessonId | String | FK → Lesson (1:1) |
| code | String | 메인 코드 |
| language | String | 프로그래밍 언어 |
| steps | JSON | LessonStep[] (스텝 배열) |

#### Quiz
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK |
| lessonId | String | FK → Lesson |
| type | String | 'multiple_choice' \| 'predict_output' \| 'fill_blank' \| 'code_fix' |
| question | String | 문제 |
| options | JSON? | 선택지 배열 (객관식) |
| answer | String | 정답 |
| explanation | String? | 해설 |
| order | Int | 정렬 순서 |

#### UserProgress
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | String | PK |
| userNickname | String | FK → User.nickname |
| lessonId | String | FK → Lesson |
| status | String | 'not_started' \| 'in_progress' \| 'completed' |
| currentStep | Int | 현재 스텝 |
| quizScore | Int? | 퀴즈 점수 |
| quizTotal | Int? | 퀴즈 총점 |
| completedAt | DateTime? | 완료일 |

---

## 7. 데이터 흐름

```
[사용자]
    │
    ▼
[프론트엔드 - React]
    │
    ├─ 코스 API ─── GET /api/courses/* ──────► [백엔드] ──► [SQLite]
    │   - GET /courses/languages         (언어 목록)
    │   - GET /courses/:lang/chapters    (챕터 목록)
    │   - GET /courses/chapters/:id      (챕터+레슨)
    │   - GET /courses/lessons/:id       (레슨+콘텐츠+퀴즈)
    │   - POST /courses/progress         (진행 상태 저장)
    │
    ├─ 코드 실행 ─── POST /api/c/run ──────► [백엔드] ──► [Docker gcc]
    │
    ├─ 메모리 트레이스 ─── POST /api/memory/trace ──► [백엔드 시뮬레이터]
    │
    ├─ AI 질문 ─── POST /api/ai/chat ──────► [백엔드] ──► [Ollama/DeepSeek]
    │
    ├─ 로그인 ─── signInWithPopup ──────────► [Firebase Auth]
    │                    │
    │                    ▼
    │               ID Token (JWT)
    │                    │
    ├─ 인증 API ─── Authorization: Bearer <token> ──► [백엔드]
    │                                                     │
    │                                                     ▼
    │                                            Firebase Admin 검증
    │                                                     │
    │                                                     ▼
    └─ DB 조회/저장 ─────────────────────────────────► [SQLite]
```

---

## 8. 보안

### C 코드 실행 보안
- **FORBIDDEN_PATTERNS**: 28개 위험 패턴 차단
  - 프로세스: system, exec, fork, clone, vfork
  - 권한: setuid, setgid, ptrace
  - 어셈블리: asm, __asm__
  - 동적 로딩: dlopen, dlsym
  - 메모리: mprotect, mmap+PROT_EXEC
  - 위험 헤더: unistd.h, sys/*, pthread.h 등

- **Docker 샌드박스**:
  - `--network none`: 네트워크 차단
  - `--read-only`: 읽기 전용
  - `--memory 128m`: 메모리 제한
  - `--cpus 0.5`: CPU 제한
  - `--pids-limit 50`: 프로세스 수 제한

### API 보안
- **Firebase 토큰 검증**: 인증 필요 엔드포인트
- **Rate Limiting**: 엔드포인트별 요청 제한
- **/me 패턴**: URL에 사용자 ID 노출 방지

---

## 9. 개발 명령어

```bash
# 백엔드
cd backend
npm run dev          # 개발 서버 (localhost:3002)
npm test             # 테스트 실행
npm run test:watch   # 테스트 워치 모드
npm run build        # 프로덕션 빌드

# 프론트엔드
cd frontend
npm run dev          # 개발 서버 (localhost:5174)
npm run build        # 프로덕션 빌드
```

---

## 10. 환경변수

### Backend (.env)
```bash
# Server
PORT=3002
NODE_ENV=development
CORS_ORIGINS=http://localhost:5174

# Docker
DOCKER_IMAGE=gcc:latest
DOCKER_MEMORY_LIMIT=128m

# AI
OLLAMA_URL=http://localhost:5044
OLLAMA_MODEL=qwen2.5-coder:7b
DEEPSEEK_API_KEY=xxx

# Firebase Admin (프로덕션 필수)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_PRIVATE_KEY="-----BEGIN..."
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3002

# Firebase Client
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
```
