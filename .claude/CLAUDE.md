# CodeInsight: 코드 실행 원리 학습 플랫폼

> **"AI가 대신 짜준 코드조차 이해하지 못하는 사람을, 스스로 설명할 수 있는 개발자로 만드는 앱"**

---

## ⚠️ 최우선 규칙: 사용자 확인 필수

**코드 변경 전 반드시 사용자 확인을 받아야 합니다.**

### 적용 대상
- 리팩토링
- 새 구조/파일 생성
- 코드 삭제
- 기능 추가/수정

### 프로세스
```
1. 무엇을 할 것인지 설명
2. 왜 이렇게 하는지 이유 설명
3. 사용자가 "이해", "이해했어", "ㅇㅋ" 등 확인 응답
4. 확인 받은 후에만 실제 코드 작성/수정/삭제
```

### 예시
```
❌ 잘못된 방식:
"파일을 수정하겠습니다" → 바로 Edit 실행

✅ 올바른 방식:
"ProcessMemoryView.tsx를 visualizers/c/로 옮기려 합니다.
이유: 계획서의 모듈형 구조에 맞추기 위함입니다.
import 경로도 @/features/visualizers/c로 변경됩니다.
이해하셨나요?"
→ 사용자: "이해"
→ 그 후 Edit 실행
```

### 삭제 시 특별 주의
- 왜 삭제하는지 명확히 설명
- 삭제로 인한 영향 범위 설명
- 대체 코드가 있다면 함께 설명

---

## 1. 프로젝트 정체성

### 1.1 한 줄 정의

```
코드를 써보면서, 눈으로 원리를 이해하는 프로그래밍 학습 앱
```

### 1.2 이 앱은 무엇이 아닌가

| ❌ 아닌 것 | 이유 |
|-----------|------|
| 코딩테스트 플랫폼 | 로직/알고리즘 중심 |
| 문제은행 (BOJ, LeetCode) | 정답 맞추기 중심 |
| GPT 튜터 | 말로만 설명 |
| IDE | 결과만 보여줌 |
| 점수/랭킹 시스템 | 경쟁 유도 |

### 1.3 이 앱은 무엇인가

| ⭕ 요소 | 의미 |
|---------|------|
| 코드 시뮬레이터 | 한 줄씩 실행, 상태 변화 시각화 |
| AI 해설자 | 코드 생성 ❌, 착각 포인트 설명 ⭕ |
| 개념 코스 | 하루 1개, 5~10분 |
| 미세 실습 | 결과 예측, 한 줄 수정 |

---

## 2. 타겟 사용자

### 2.1 핵심 타겟

#### ① 문법·원리를 외워서 코딩하는 사람
- 포인터, 참조, 객체 헷갈림
- "그냥 된다" 느낌으로 코딩
- 조금만 바뀌면 못 고침

#### ② AI로 복붙 코딩하는 사람
- ChatGPT/Copilot 의존
- 코드가 왜 되는지 모름
- 에러 나면 또 AI에게 물어봄

### 2.2 공통 문제

| 증상 | 원인 |
|------|------|
| 코드가 왜 되는지 모름 | 실행 모델 없음 |
| 에러 나면 멈춤 | 내부 상태 상상 불가 |
| 조금만 바뀌면 못 고침 | 원리 이해 부족 |

---

## 3. 핵심 기능 (4개)

### 3.1 코드 시뮬레이터 (심장)

```
코드 → 한 줄씩 실행 → 상태 변화 시각화
```

- Stack/Heap 메모리 블록
- 변수 값 변화 애니메이션
- 포인터/참조 화살표
- 객체 생성/소멸

**지원 언어**: C (MVP) → Python → Java

### 3.2 AI 해설자 (자동 해설 + Q&A)

```
현재 줄 기준 → 왜 이렇게 동작하는지 설명
질문 입력 → 개념/동작에 대한 대화형 답변
```

#### ⭕ 할 수 있는 것
- 현재 줄의 동작 자동 설명
- 흔한 착각 포인트 집어줌
- 사용자 질문에 대한 답변 (Q&A)
- 비유/예시로 개념 설명

#### ❌ 하면 안 되는 것
- 코드 생성/수정
- 퀴즈 정답 직접 알려주기

### 3.3 개념 코스

```
Day N → 오늘의 개념 → 5~10분 학습
```

- 하루 1개 개념
- 짧은 코드 + 시뮬레이션 + 미세 실습

### 3.4 미세 실습

| 형태 | 예시 |
|------|------|
| 결과 예측 | "실행 후 a의 값은?" |
| 상태 예측 | "메모리 상태는?" |
| 참조 예측 | "같은 객체인가?" |
| 한 줄 수정 | "b가 영향 안 받게 고쳐라" |

---

## 4. MVP 범위

### 4.1 포함

- C 코드 시뮬레이터 (단계별 실행)
- 메모리 시각화 (Stack/Heap/포인터)
- C 개념 10개 코스
- 결과 예측 퀴즈
- AI 해설자

### 4.2 제외 (Phase 2+)

- Python/Java 시뮬레이터
- 알림 시스템
- 언어별 비교 뷰
- 이해도 히스토리
- 사용자 인증

---

## 5. 기술 스택

### Frontend
- React 18 + TypeScript
- Zustand (상태 관리)
- Tailwind CSS + shadcn/ui
- Monaco Editor
- Framer Motion

### Backend
- Node.js + Express + TypeScript
- Prisma + SQLite
- Docker (C 코드 실행)

### AI
- Ollama (qwen2.5-coder:7b)
- DeepSeek API (백업)

### 포트 설정

| 프로젝트 | Backend | Frontend |
|----------|---------|----------|
| C-OSINE | 3001 | 5173 |
| **CodeInsight** | **3002** | **5174** |

```bash
# CodeInsight 실행
cd backend && npm run dev   # localhost:3002
cd frontend && npm run dev  # localhost:5174
```

---

## 6. 프로젝트 구조

```
backend/
├── src/
│   ├── config/
│   │   ├── env.ts              # 환경변수 (Zod)
│   │   └── database.ts
│   ├── modules/
│   │   ├── c/                  # C 코드 실행
│   │   ├── memory/             # 메모리 시뮬레이션
│   │   └── ai/                 # AI 해설자
│   └── app.ts
├── prisma/schema.prisma
└── .env.example

frontend/
├── src/
│   ├── features/
│   │   ├── visualizers/        # 메모리 시각화 (언어별)
│   │   │   └── c/              # C 언어 시각화
│   │   ├── chat/               # AI 해설자
│   │   └── courses/            # 개념 코스
│   ├── data/courses/           # 코스 데이터 (C, Python, Java)
│   ├── types/                  # 공유 타입
│   ├── services/               # API 클라이언트
│   ├── components/ui/          # shadcn/ui
│   └── stores/
└── .env.example

docs/
├── plans/
│   ├── 17_new_direction_mvp.md
│   ├── 18_refactoring_plan.md
│   └── 19_learn_page_implementation.md
└── reference/
    ├── CURRICULUM.md
    └── COURSE_DATA_STRUCTURE.md
```

---

## 7. 개발 가이드

### 7.1 환경변수

모든 환경변수는 Zod 스키마로 관리. `process.env` 직접 사용 금지.

```typescript
// backend-node/src/config/env.ts
import { env } from '../config/env';
console.log(env.OLLAMA_MODEL);  // Type-safe
```

### 7.2 새 기능 추가

```
frontend/src/features/
└── new-feature/
    ├── index.ts           # Public exports
    ├── NewFeature.tsx     # Main component
    ├── components/        # Internal components
    ├── hooks/             # Feature hooks
    └── types.ts           # TypeScript types
```

### 7.3 코드 스타일

- `@/` path alias 사용 (상대경로 금지)
- `any` 타입 금지
- 하드코딩 금지 → `config/env.ts` 사용
- 작은 컴포넌트 선호

### 7.4 설계 의도 문서화

```
❌ "나중에 고치자"
✅ "왜 이렇게 했는지 적어두고, 나중에 판단하자"
```

모듈화, 추상화, 패턴 선택 시 주석으로 기록:

```typescript
// WHY: 왜 이렇게 설계했는지
// TRADEOFF: 어떤 것을 희생했는지 (있다면)
// REVISIT: 언제 다시 검토해야 하는지 (조건)
```

**예시:**
```typescript
// WHY: exec 에러는 ExecException 타입이지만 런타임에 속성이 없을 수 있음
// TRADEOFF: 타입 안전성 > 코드 간결성
// REVISIT: Node.js가 ExecException 타입을 개선하면 제거 가능
function getExecErrorInfo(error: unknown) { ... }
```

---

## 8. API Endpoints

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/c/run` | C 코드 실행 |
| POST | `/api/memory/trace` | 메모리 시뮬레이션 |
| POST | `/api/ai/chat` | AI 해설자 |
| GET | `/api/ai/health` | AI 상태 확인 |

### curl 예시

```bash
# C 코드 실행
curl -X POST http://localhost:3000/api/c/run \
  -H "Content-Type: application/json" \
  -d '{"code": "#include <stdio.h>\nint main() { int x = 10; return 0; }"}'

# 메모리 트레이스
curl -X POST http://localhost:3000/api/memory/trace \
  -H "Content-Type: application/json" \
  -d '{"code": "int main() { int *p = malloc(4); return 0; }"}'

# AI 해설
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "포인터가 뭐야?"}'
```

---

## 9. 커밋 가이드

- Claude 서명 금지 (`Generated with Claude Code` 등)
- Co-Authored-By 금지
- 한글 커밋 메시지 OK

---

## 10. 참고 문서

### 필수 문서 (먼저 읽기)
| 문서 | 설명 |
|------|------|
| `docs/architecture/SYSTEM_OVERVIEW.md` | **시스템 전체 구조** (기능, API, DB, 보안) |

### 계획 문서
| 문서 | 설명 |
|------|------|
| `docs/plans/20_remaining_tasks.md` | **남은 작업 계획** (2025-12-28) |
| `docs/plans/17_new_direction_mvp.md` | MVP 상세 계획 |
| `docs/plans/18_refactoring_plan.md` | 리팩토링 계획 |
| `docs/plans/19_learn_page_implementation.md` | LearnPage 구현 계획 |

### 참조 문서
| 문서 | 설명 |
|------|------|
| `docs/reference/CURRICULUM.md` | C 개념 커리큘럼 |
| `docs/reference/COURSE_DATA_STRUCTURE.md` | 코스 데이터 구조 |

---

## 11. 구현 현황 (2025-12-28)

### 11.1 완료된 기능

| 기능 | 위치 | 상태 |
|------|------|------|
| 코스 데이터 구조 | `data/courses/` | ✅ 완료 |
| C 코스 Day 1-3 | `data/courses/c/` | ✅ 완료 |
| Java 코스 Day 1 | `data/courses/java/` | ✅ 완료 |
| Python 코스 Day 1 | `data/courses/python/` | ✅ 완료 |
| CoursesPage (LearnPage) | `features/courses/` | ✅ 완료 |
| AI 해설자 API 분리 | `backend/modules/ai/` | ✅ 완료 |
| C 메모리 시각화 | `features/visualizers/c/` | ✅ 완료 |
| 메모리 타입 정의 | `types/memory.ts` | ✅ 완료 |
| C 실행/트레이스 서비스 | `services/crunner.ts, tracer.ts` | ✅ 완료 |
| 테스트 인프라 (vitest) | `backend/vitest.config.ts` | ✅ 완료 |
| 보안 패턴 테스트 | `backend/modules/c/executor.test.ts` | ✅ 완료 |
| Firebase Admin 인증 | `backend/config/firebase.ts` | ✅ 완료 |
| 인증 미들웨어 | `backend/middleware/auth.ts` | ✅ 완료 |
| Rate Limiting | `backend/middleware/rateLimit.ts` | ✅ 완료 |
| /me 패턴 API | `backend/modules/users,submissions/` | ✅ 완료 |

### 11.2 CoursesPage 컴포넌트

```
features/courses/
├── index.ts
├── CoursesPage.tsx
├── hooks/
│   └── useCourseProgress.ts    # localStorage 진행 상태
└── components/
    ├── LanguageTabs.tsx        # C/Java/Python 탭
    ├── CourseHeader.tsx        # 언어 설명 + 진행률
    ├── DayGrid.tsx             # Day 카드 그리드
    └── DayCard.tsx             # 개별 Day 카드
```

### 11.3 Visualizers 구조 (C 메모리 시각화)

```
features/visualizers/c/
├── index.tsx                   # 모듈 export
├── ProcessMemoryVisualization.tsx
├── constants.ts                # 색상, 애니메이션 설정
├── types.ts                    # 시각화 타입
├── utils.ts                    # 유틸 함수
├── components/
│   ├── ProcessMemoryView.tsx   # 전체 메모리 레이아웃
│   ├── MemorySegment.tsx       # 세그먼트 컴포넌트
│   ├── StackDetailView.tsx     # Stack 상세
│   └── HeapDetailView.tsx      # Heap 상세
└── hooks/
    └── useStepTransition.ts    # 스텝 전환 애니메이션
```

### 11.4 라우팅

| 경로 | 컴포넌트 | 상태 |
|------|----------|------|
| `/courses` | CoursesPage | ✅ 완료 |
| `/courses/:lang` | CoursesPage | ✅ 완료 |
| `/courses/:lang/:day` | DayPage | ⏳ TODO |

### 11.5 다음 단계

1. **DayPage 구현** - Day 학습 화면 (시뮬레이터 + 퀴즈 + AI 해설)
2. **시뮬레이터 연동** - 코스 데이터의 steps와 메모리 시각화 연결
3. **퀴즈 컴포넌트** - 결과 예측 퀴즈 UI
4. **실습 문제 연동** - Problem을 코스 Day에 연결
5. **프론트엔드 인증 연동** - user.ts, submission.ts 서비스 구현

---

## 12. Repository Info

- Repo: `git@github.com:jammy0903/CodeInsight.git`
- Branch: `codeinsight`
- GitHub: jammy0903
- Email: fuso3367@kakao.com

```bash
# Push to this branch
git push origin codeinsight
```
