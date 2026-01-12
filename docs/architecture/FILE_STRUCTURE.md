# 📁 CodeInsight 프로젝트 파일 구조

> 작성일: 2026-01-04
> **최종 업데이트: 2026-01-11** (실제 구조 검증 완료)

---

## 🗂️ Backend (Node.js + Express + Prisma)

```
backend/
│
├── prisma/
│   ├── schema.prisma              # DB 스키마 정의 (User, Course, Lesson, Quiz 등)
│   ├── seed.ts                    # DB 시드 데이터 (C언어 10챕터 × 62레슨)
│   ├── content-seed.ts            # 콘텐츠 시드 (JSON → DB)
│   ├── content/                   # 레슨 JSON 파일들
│   │   ├── c/lessons/             # C 언어 레슨 콘텐츠
│   │   ├── javascript/lessons/    # JavaScript 레슨 콘텐츠
│   │   └── python/                # Python 레슨 콘텐츠 (예정)
│   └── migrations/                # Prisma 마이그레이션
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
│       ├── courses/
│       │   ├── routes.ts          # 코스 API 라우터
│       │   ├── service.ts         # 코스 비즈니스 로직
│       │   └── index.ts           # 모듈 export
│       │
│       ├── ai/
│       │   ├── routes.ts          # AI 해설자 API (/chat, /chat/stream)
│       │   ├── settings.ts        # AI Provider 설정 관리
│       │   └── providers/
│       │       ├── types.ts       # AI Provider 인터페이스
│       │       ├── ollama.provider.ts   # Ollama (qwen2.5-coder)
│       │       ├── deepseek.provider.ts # DeepSeek API (스트리밍 지원)
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
│       │       ├── int.handler.ts
│       │       ├── pointer.handler.ts
│       │       ├── array.handler.ts
│       │       ├── malloc.handler.ts
│       │       ├── io.handler.ts
│       │       ├── types.ts
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
│   │   │   ├── textarea.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── badge.tsx
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
│   │   │   ├── MatrixRain.tsx     # 매트릭스 효과 배경
│   │   │   └── index.ts
│   │   │
│   │   ├── courses/               # 🎓 코스 학습 기능 (상세 구조는 아래 참조)
│   │   │   └── ...
│   │   │
│   │   ├── chat/                  # 💬 AI 해설자
│   │   │   ├── components/
│   │   │   │   ├── ChatQA.tsx             # Q&A 챗봇 (스트리밍 지원)
│   │   │   │   └── MessageContent.tsx     # 메시지 렌더링 (마크다운)
│   │   │   ├── hooks/
│   │   │   │   └── useChatQA.ts           # 채팅 로직 (localStorage 저장)
│   │   │   └── index.ts
│   │   │
│   │   ├── visualizers/           # 🎨 시각화 컴포넌트
│   │   │   ├── c/
│   │   │   │   ├── constants.ts   # 색상, 애니메이션 설정
│   │   │   │   ├── CMemoryView.tsx# C 메모리 시각화
│   │   │   │   └── index.tsx
│   │   │   └── js/
│   │   │       ├── JSVisualizerView.tsx  # JavaScript 시각화 통합
│   │   │       ├── EventLoopView.tsx     # 이벤트 루프 시각화
│   │   │       ├── ClosureView.tsx       # 클로저 시각화
│   │   │       └── index.ts
│   │   │
│   │   ├── playground/            # 🎮 플레이그라운드
│   │   │   ├── PlaygroundPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── StepControls.tsx
│   │   │   │   └── VisualizerPanel.tsx
│   │   │   ├── stores/
│   │   │   │   └── playgroundStore.ts
│   │   │   └── index.ts
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
│   │   ├── ai.ts                  # AI 해설자 API (스트리밍 SSE)
│   │   ├── crunner.ts             # C 코드 실행 API
│   │   ├── tracer.ts              # 메모리 트레이스 API
│   │   ├── simulator.ts           # 시뮬레이터 서비스
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

## 🎓 Courses 모듈 상세 구조

> **위치**: `frontend/src/features/courses/`

```
courses/
│
├── index.ts                       # 모듈 Public API
│
├── CoursesPage.tsx                # 언어 선택 페이지 (/courses)
├── LanguageCoursePage.tsx         # 챕터 목록 (/courses/:lang)
├── ChapterLessonsPage.tsx         # 레슨 목록 (/courses/:lang/:chapterId)
├── LessonPage.tsx                 # 레슨 학습 (/courses/:lang/:chapterId/:lessonId)
│
├── components/
│   ├── index.ts                   # 컴포넌트 Public API
│   │
│   ├── CourseGrid.tsx             # 반응형 그리드 레이아웃
│   ├── ChapterCard.tsx            # 챕터 카드 (진행률 표시)
│   ├── LessonCard.tsx             # 레슨 카드 (난이도 표시)
│   │
│   ├── day/                       # 학습 화면 컴포넌트
│   │   ├── CodeViewer.tsx         # 코드 뷰어 (하이라이트, 선택)
│   │   ├── StepExplanation.tsx    # 스텝 설명 (마크다운 lite)
│   │   ├── StepControls.tsx       # 이전/다음/퀴즈 버튼
│   │   └── SelectedCodeBadge.tsx  # 선택된 코드 표시
│   │
│   └── memory/                    # 메모리 시각화
│       ├── index.ts               # 메모리 컴포넌트 export
│       ├── CourseMemoryView.tsx   # 통합 메모리 뷰 (오케스트레이터)
│       ├── MemoryPanel.tsx        # 메모리 블록 패널 (Stack/Heap)
│       └── VariablesPanel.tsx     # 변수 태그 패널
│
├── hooks/
│   ├── useLessonNavigation.ts     # 스텝/퀴즈/완료 네비게이션
│   ├── useLessonVisualization.ts  # 메모리+JS 시각화 상태 (통합)
│   ├── useLessonMemory.ts         # ⚠️ DEPRECATED (useLessonVisualization 사용)
│   └── useCodeSelection.ts        # 코드 선택 상태
│
└── types.ts                       # CodeSelection 인터페이스
```

### ⚠️ 데드코드 (삭제 예정)

```
❌ components/ChapterAccordion.tsx  # 레거시 아코디언 (미사용)
❌ components/LessonItem.tsx        # 레거시 리스트 아이템 (미사용)
```

### ⚠️ 존재하지 않는 export (index.ts 수정 필요)

```
❌ components/day/DayHeader.tsx     # 파일 없음
❌ components/quiz/QuizCard.tsx     # 폴더 없음
❌ components/quiz/QuizResult.tsx   # 폴더 없음
```

---

## 📊 컴포넌트 의존성 그래프

```
LessonPage.tsx (메인)
├─→ CodeViewer (코드 표시)
├─→ StepExplanation (설명)
├─→ SelectedCodeBadge (선택 코드)
├─→ CourseMemoryView (메모리 오케스트레이터)
│   ├─→ VariablesPanel (변수 태그)
│   └─→ MemoryPanel (메모리 블록)
├─→ JSVisualizerView (JS 시각화, lang=javascript일 때)
├─→ ChatQA (AI 대화)
│
├─→ useLessonNavigation (네비게이션 상태)
├─→ useLessonVisualization (시각화 상태)
└─→ useCodeSelection (코드 선택)

LanguageCoursePage.tsx
├─→ CourseGrid
└─→ ChapterCard

ChapterLessonsPage.tsx
├─→ CourseGrid
└─→ LessonCard
```

---

## 🌐 Multi-Language Memory Simulator Architecture

> **목표**: 함수 재사용성 극대화 + 언어별 계층 분리
> **지원 언어**: C (MVP) → Python → Java → Go → JavaScript

### 설계 원칙

| 원칙 | 설명 |
|------|------|
| **Interface First** | 공통 인터페이스를 먼저 정의, 언어별 구현은 이를 따름 |
| **Shared Core** | 시각화, 스텝 관리, 메모리 블록은 공유 |
| **Language Adapter** | 언어별 차이점만 Adapter 패턴으로 분리 |
| **Registry Pattern** | 타입, 핸들러를 동적으로 등록/조회 |

---

### 📦 Backend Memory Module 구조 (목표)

```
backend/src/modules/memory/
│
├── index.ts                    # Public API (언어 선택 팩토리)
├── simulator.ts                # 언어별 시뮬레이터 통합 진입점
├── routes.ts                   # API 라우트
│
├── shared/                     # 🔄 공유 레이어 (모든 언어 공통)
│   │
│   ├── interfaces/             # 핵심 인터페이스 정의
│   │   ├── step.interface.ts        # Step: 실행 단위
│   │   ├── memory-block.interface.ts# MemoryBlock: 메모리 블록
│   │   ├── variable.interface.ts    # Variable: 변수 상태
│   │   ├── handler.interface.ts     # CodeHandler: 코드 처리기
│   │   └── index.ts
│   │
│   ├── context/                # 시뮬레이션 컨텍스트
│   │   ├── base-context.ts          # BaseSimContext: 공통 상태 관리
│   │   ├── memory-manager.ts        # 메모리 할당/해제 관리
│   │   └── index.ts
│   │
│   ├── registry/               # 레지스트리 패턴
│   │   ├── handler-registry.ts      # 핸들러 등록/조회
│   │   ├── type-registry.ts         # 타입 등록/조회 (베이스)
│   │   └── index.ts
│   │
│   └── utils/                  # 공통 유틸리티
│       ├── byte-utils.ts            # 바이트 변환 (리틀/빅 엔디안)
│       ├── format-utils.ts          # 주소/값 포맷팅
│       └── index.ts
│
├── languages/                  # 🌍 언어별 구현
│   │
│   ├── c/                      # C 언어
│   │   ├── index.ts                 # C 시뮬레이터 export
│   │   ├── c-simulator.ts           # C 전용 시뮬레이터
│   │   ├── c-context.ts             # C 전용 컨텍스트 (Stack/Heap)
│   │   │
│   │   ├── types/                   # C 타입 시스템
│   │   │   ├── c-types.ts           # int, float, char, pointer 등
│   │   │   ├── c-type-registry.ts   # C 타입 레지스트리
│   │   │   └── index.ts
│   │   │
│   │   └── handlers/                # C 코드 핸들러
│   │       ├── variable.handler.ts  # 변수 선언/대입
│   │       ├── array.handler.ts     # 배열 처리
│   │       ├── pointer.handler.ts   # 포인터 처리
│   │       ├── malloc.handler.ts    # malloc/free
│   │       ├── struct.handler.ts    # struct (TODO)
│   │       ├── function.handler.ts  # 함수 호출
│   │       ├── io.handler.ts        # printf/scanf
│   │       └── index.ts
│   │
│   ├── python/                 # Python (Phase 2)
│   │   ├── index.ts
│   │   ├── py-simulator.ts          # Python 시뮬레이터
│   │   ├── py-context.ts            # Reference Counting 컨텍스트
│   │   │
│   │   ├── types/
│   │   │   ├── py-types.ts          # int, float, str, list, dict
│   │   │   └── py-type-registry.ts
│   │   │
│   │   └── handlers/
│   │       ├── variable.handler.ts  # 변수 (Reference)
│   │       ├── list.handler.ts      # 리스트
│   │       ├── dict.handler.ts      # 딕셔너리
│   │       └── gc.handler.ts        # 가비지 컬렉션
│   │
│   ├── java/                   # Java (Phase 3)
│   │   ├── index.ts
│   │   ├── java-simulator.ts        # Java 시뮬레이터
│   │   ├── java-context.ts          # JVM Heap 컨텍스트
│   │   │
│   │   ├── types/
│   │   │   ├── java-types.ts        # primitive, Object, Array
│   │   │   └── java-type-registry.ts
│   │   │
│   │   └── handlers/
│   │       ├── primitive.handler.ts # int, double, boolean
│   │       ├── object.handler.ts    # Object 생성
│   │       ├── array.handler.ts     # 배열 (length 속성)
│   │       └── gc.handler.ts        # GC 시뮬레이션
│   │
│   ├── go/                     # Go (Phase 4)
│   │   └── ...
│   │
│   └── javascript/             # JavaScript (Phase 5)
│       ├── index.ts
│       ├── js-simulator.ts          # JS 시뮬레이터
│       ├── js-context.ts            # Closure/Scope 컨텍스트
│       │
│       ├── types/
│       │   └── js-types.ts          # primitive, object, function
│       │
│       └── handlers/
│           ├── variable.handler.ts  # let/const/var
│           ├── closure.handler.ts   # 클로저
│           ├── prototype.handler.ts # 프로토타입 체인
│           └── event-loop.handler.ts# 이벤트 루프
│
└── adapters/                   # 🔌 언어 어댑터 (팩토리)
    ├── simulator-factory.ts         # 언어별 시뮬레이터 생성
    ├── language-config.ts           # 언어별 설정 (타입 크기, 엔디안 등)
    └── index.ts
```

---

### 📊 Shared Interfaces (핵심 재사용)

```typescript
// shared/interfaces/step.interface.ts
export interface Step {
  line: number;           // 실행 줄 번호
  code: string;           // 실행된 코드
  explanation: string;    // 설명 (마크다운)
  variables: Variable[];  // 현재 변수 상태
  memory: MemoryBlock[];  // 메모리 블록 상태
  highlight?: string[];   // 하이라이트 변수명
}

// shared/interfaces/memory-block.interface.ts
export interface MemoryBlock {
  address: string;        // "0x7FFE1234"
  region: 'stack' | 'heap' | 'static' | 'gc'; // 언어별 확장 가능
  bytes: number[];        // 바이트 배열
  label?: string;         // 변수명 또는 설명
  size: number;           // 바이트 크기
}

// shared/interfaces/handler.interface.ts
export interface CodeHandler {
  name: string;
  priority: number;
  canHandle(code: string): boolean;
  handle(ctx: SimContext, line: number, code: string): Step | null;
}
```

---

### 🔄 언어별 메모리 모델 비교

| 특성 | C | Python | Java | Go | JavaScript |
|------|---|--------|------|----|----|
| **메모리 관리** | 수동 | GC + RefCount | GC | GC | GC |
| **영역** | Stack/Heap | Heap 중심 | Stack(primitive)/Heap | Stack/Heap | Heap |
| **포인터** | ✅ 명시적 | ❌ | ❌ | ✅ 제한적 | ❌ |
| **타입 크기** | 플랫폼 의존 | 동적 | 고정 | 고정 | 동적 |
| **특수 시각화** | 포인터 화살표 | Reference Count | Object Graph | Goroutine | Closure/Event Loop |

---

### 📐 Frontend Visualizers 구조 (목표)

```
frontend/src/features/visualizers/
│
├── shared/                     # 🔄 공유 컴포넌트
│   ├── components/
│   │   ├── MemoryGrid.tsx           # 메모리 블록 그리드 (공통)
│   │   ├── VariableTag.tsx          # 변수 태그 (공통)
│   │   ├── AddressLabel.tsx         # 주소 레이블
│   │   ├── ByteCell.tsx             # 바이트 셀
│   │   └── StepControls.tsx         # 스텝 컨트롤 (공통)
│   │
│   ├── hooks/
│   │   ├── useStepNavigation.ts     # 스텝 네비게이션 (공통)
│   │   └── useMemoryState.ts        # 메모리 상태 관리 (공통)
│   │
│   └── types/
│       └── visualizer.types.ts      # Step, MemoryBlock 타입 (Backend 공유)
│
├── c/                          # C 언어 시각화
│   ├── CMemoryView.tsx              # C 메모리 뷰
│   ├── PointerArrow.tsx             # 포인터 화살표
│   ├── StackHeapDivider.tsx         # Stack/Heap 구분선
│   └── constants.ts                 # C 전용 색상/설정
│
├── python/                     # Python 시각화 (Phase 2)
│   ├── PyMemoryView.tsx
│   ├── ReferenceCount.tsx           # Reference Count 표시
│   └── ObjectGraph.tsx              # 객체 참조 그래프
│
├── java/                       # Java 시각화 (Phase 3)
│   ├── JavaMemoryView.tsx
│   ├── HeapObjectView.tsx           # Heap 객체 시각화
│   └── GCIndicator.tsx              # GC 상태 표시
│
├── go/                         # Go 시각화 (Phase 4)
│   └── ...
│
└── javascript/                 # JavaScript 시각화
    ├── JSVisualizerView.tsx
    ├── ClosureView.tsx              # 클로저 시각화
    ├── EventLoopView.tsx            # 이벤트 루프
    └── PrototypeChain.tsx           # 프로토타입 체인
```

---

### 🔌 팩토리 패턴 사용 예시

```typescript
// backend/src/modules/memory/adapters/simulator-factory.ts
import { CSimulator } from '../languages/c';
import { PySimulator } from '../languages/python';
import { JavaSimulator } from '../languages/java';

export function createSimulator(language: SupportedLanguage): BaseSimulator {
  switch (language) {
    case 'c':
      return new CSimulator();
    case 'python':
      return new PySimulator();
    case 'java':
      return new JavaSimulator();
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// API 라우트에서 사용
app.post('/api/memory/trace', (req, res) => {
  const { code, language = 'c' } = req.body;
  const simulator = createSimulator(language);
  const steps = simulator.trace(code);
  res.json({ steps });
});
```

---

### 🛠️ 마이그레이션 계획

#### Phase 1: Shared Layer 추출 (현재 → shared/)
```
기존: handlers/types.ts, handlers/index.ts
목표: shared/interfaces/, shared/registry/
```

#### Phase 2: C 언어 분리 (현재 → languages/c/)
```
기존: handlers/*.handler.ts, types/*.ts
목표: languages/c/handlers/, languages/c/types/
```

#### Phase 3: 팩토리 + 어댑터 추가
```
목표: adapters/simulator-factory.ts, language-config.ts
```

#### Phase 4: Python 구현
#### Phase 5: Java 구현
#### Phase 6: Go, JavaScript 구현

---

## 🔧 리팩토링 TODO

### 🧹 정리 작업 (즉시)
- [ ] `ChapterAccordion.tsx` 삭제
- [ ] `LessonItem.tsx` 삭제
- [ ] `components/index.ts` 수정 (없는 export 제거)
- [ ] `courses/index.ts` 수정 (useLessonVisualization export 추가)

---

### 🌐 다중언어 아키텍처 구축 (Memory Module)

#### Phase 1: TypeRegistry 기반 기본 타입 ✅
- [x] `types/c-types.ts` 생성 - 모든 C 타입 정의
- [x] `types/type-registry.ts` 생성 - TypeRegistry 클래스
- [x] `variable.handler.ts` 통합 - IntHandler + PrimitiveHandler 대체
- [x] 테스트: int, float, double, char, unsigned 변형 지원

#### Phase 2: 모든 타입 배열 지원
- [ ] `array.handler.ts` 확장 - char[], float[], double[] 등
- [ ] 배열 인덱싱 표현: arr[0], arr[1], ...
- [ ] 배열 초기화: int arr[] = {1, 2, 3};

#### Phase 3: struct 지원
- [ ] `struct.handler.ts` 생성
- [ ] 멤버 접근: s.field, ptr->field
- [ ] 중첩 struct 지원
- [ ] struct 배열 지원

#### Phase 4: 함수 매개변수 전달
- [ ] `function.handler.ts` 확장
- [ ] 값 복사 시각화 (call by value)
- [ ] 포인터 전달 시각화 (call by address)
- [ ] 스택 프레임 표현

#### Phase 5: 오류 감지 + 비트연산
- [ ] 배열 범위 초과 감지
- [ ] 미초기화 변수 경고
- [ ] 포인터 NULL 접근 경고
- [ ] 비트 연산 시각화 (&, |, ^, ~, <<, >>)

---

### 🔀 Shared Layer 추출 (다중언어 준비)

#### Phase 6: Shared 인터페이스 분리
- [ ] `shared/interfaces/step.interface.ts` 생성
- [ ] `shared/interfaces/memory-block.interface.ts` 생성
- [ ] `shared/interfaces/handler.interface.ts` 생성
- [ ] `shared/registry/handler-registry.ts` 이동

#### Phase 7: C 언어 모듈 분리
- [ ] `languages/c/` 폴더 구조 생성
- [ ] 기존 handlers → `languages/c/handlers/`
- [ ] 기존 types → `languages/c/types/`
- [ ] `c-simulator.ts`, `c-context.ts` 생성

#### Phase 8: 어댑터 + 팩토리 패턴
- [ ] `adapters/simulator-factory.ts` 생성
- [ ] `adapters/language-config.ts` 생성
- [ ] API 라우트 language 파라미터 지원

---

### 🐍 Python/Java 확장 (장기 계획)

#### Phase 9: Python 시뮬레이터
- [ ] `languages/python/` 구조 생성
- [ ] Reference Counting 시각화
- [ ] list, dict, tuple 지원

#### Phase 10: Java 시뮬레이터
- [ ] `languages/java/` 구조 생성
- [ ] primitive vs Object 구분
- [ ] GC 시각화

---

### 📐 Frontend 구조 개선

#### UI 컴포넌트
- [ ] `LessonFooter.tsx` 추가 (하단 고정 푸터)
- [ ] `QuizCard.tsx` 분리 (LessonPage에서 추출)
- [ ] `LessonLayout.tsx` 추가 (55/45 레이아웃 재사용)

#### Visualizer 공유 레이어
- [ ] `visualizers/shared/components/` 생성
- [ ] `MemoryGrid.tsx` 공통 컴포넌트
- [ ] `VariableTag.tsx` 공통 컴포넌트

---

_마지막 업데이트: 2026-01-11 (다중언어 아키텍처 계획 추가)_
