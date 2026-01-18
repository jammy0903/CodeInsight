# 진행 중: 학습 분석 시스템

> **마지막 업데이트**: 2026-01-18
> **포함 계획**: 퀴즈 시스템, 데이터 수집, AI 학습 분석 리포트

---

## 목차

1. [퀴즈 시스템](#1-퀴즈-시스템)
2. [데이터 수집](#2-데이터-수집)
3. [AI 학습 분석 리포트](#3-ai-학습-분석-리포트)

---

## 1. 퀴즈 시스템

### 1.1 퀴즈 유형 (3종류)

| 유형 | type 값 | 설명 | 난이도 |
|------|---------|------|--------|
| OX 퀴즈 | `ox` | 참/거짓 선택 | 기본 |
| 객관식 | `multiple_choice` | 4지선다 | 중급 |
| 빈칸 코드 입력 | `fill_blank` | 코드 빈칸 직접 입력 | 고급 |

### 1.2 퀴즈 데이터 구조

```typescript
// OX 퀴즈
{
  type: "ox",
  question: "포인터 변수는 메모리 주소를 저장한다.",
  answer: "O",
  explanation: "포인터는 메모리 주소를 저장합니다."
}

// 객관식
{
  type: "multiple_choice",
  question: "다음 중 포인터 선언으로 올바른 것은?",
  options: ["int p;", "int *p;", "int &p;", "pointer p;"],
  answer: "1",
  explanation: "포인터는 자료형 뒤에 *를 붙여 선언합니다."
}

// 빈칸 코드 입력
{
  type: "fill_blank",
  question: "포인터 p가 변수 x를 가리키도록 빈칸을 채우세요.",
  code: "int x = 10;\nint *p = ____;",
  answer: "&x",
  acceptedAnswers: ["&x", "& x", "&(x)"],
  explanation: "&x는 변수 x의 주소를 의미합니다."
}
```

### 1.3 API

```
POST /api/quizzes/:quizId/attempt
  Body: { userAnswer: string, timeSpent: number }
  Response: { isCorrect: boolean, explanation: string }

GET /api/lessons/:lessonId/quizzes
  Response: Quiz[]
```

---

## 2. 데이터 수집

### 2.1 수집 대상 (4종)

| 모델 | 데이터 | 수집 시점 |
|------|--------|----------|
| `LessonActivity` | 체류 시간 | 레슨 진입/이탈 |
| `ChatHistory` | AI 질문 | AI 질문 시 |
| `QuizAttempt` | 퀴즈 시도 | 답변 제출 시 |
| `UserNote` | 개념 노트 | 노트 추가 클릭 |

### 2.2 체류 시간 수집

```typescript
// LessonPage.tsx
useEffect(() => {
  let activityId: string | null = null;

  // 페이지 진입 시 시작
  startLessonActivity(lessonId).then(id => activityId = id);

  // 페이지 이탈 시 종료
  const handleUnload = () => {
    if (activityId) {
      navigator.sendBeacon('/api/analytics/activity/end', 
        JSON.stringify({ activityId }));
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  return () => {
    handleUnload();
    window.removeEventListener('beforeunload', handleUnload);
  };
}, [lessonId]);
```

### 2.3 퀴즈 시도 + 시간 측정

```typescript
const handleAnswerSubmit = async (selectedAnswer: string) => {
  const isCorrect = selectedAnswer === quiz.answer;
  const timeSpent = Math.floor((Date.now() - startTime) / 1000);

  await recordQuizAttempt({
    quizId: quiz.id,
    userAnswer: selectedAnswer,
    isCorrect,
    timeSpent,
  });
};
```

### 2.4 구현 우선순위

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| 1 | 백엔드 API (activity, quiz-attempt, notes) | 2-3시간 |
| 2 | 프론트 서비스 (analytics.ts, notes.ts) | 1시간 |
| 3 | 데이터 수집 연동 (LessonPage, QuizCard) | 2-3시간 |
| 4 | 분석 리포트 연동 | 1-2시간 |

---

## 3. AI 학습 분석 리포트

### 3.1 수집 범위

**자동 수집 (권한 없음, 8개)**
| 항목 | API | 용도 |
|------|-----|------|
| Screen Orientation | `screen.orientation` | 모바일 vs 데스크탑 |
| Network Info | `navigator.connection` | 네트워크 환경 |
| Visibility | `visibilitychange` | 집중도/이탈 감지 |
| Touch vs Mouse | `touchstart/click` | 입력 방식 |
| Screen Size | `window.innerWidth/Height` | 디바이스 크기 |
| 시간대/요일 | `Date` | 학습 시간 패턴 |
| User-Agent | `navigator.userAgent` | 브라우저/OS |
| Language | `navigator.language` | 언어 설정 |

**온보딩 설문 (4개)**
- 나이대: 10대, 20대, 30대, 40대+
- 신분/직업: 학생(중/고/대), 취준생, 직장인, 기타
- 프로그래밍 경험: 없음, 1년 미만, 1-3년, 3년+
- 학습 목표: 기초 이해, 취업 준비, 실무 향상, 호기심

**행동 데이터 (3단계)**
- 🔴 **Phase 0 (필수)**: 스텝 체류 시간, 뒤로가기, 퀴즈 정답/시간, AI 질문 횟수
- 🟡 **Phase 1 (권장)**: AI 질문 유형, 시각화 호버/클릭, 오답 후 행동, 코드 실행
- 🟢 **Phase 2 (심화)**: 시각화 줌/패닝, 코드 수정, 코드 선택, 스크롤 패턴

### 3.2 분석 알고리즘

**취약 개념 분석**
```typescript
function analyzeWeakness(quizAttempts: QuizAttempt[]): WeaknessReport {
  // 1. 챕터별 정답률 계산
  // 2. 70% 미만인 챕터 = 약점
  // 3. 같은 문제 2회 이상 틀림 = 반복 실수
  // 4. 소요 시간 평균 대비 2배 이상 = 어려워하는 개념
}
```

**추천 학습 생성**
```typescript
function generateRecommendation(user: User): Recommendation[] {
  // 1. 약점 챕터의 이전 레슨부터 복습 추천
  // 2. 완료하지 않은 레슨 중 난이도 순 정렬
  // 3. 오래된 완료 레슨 복습 추천 (망각 곡선)
}
```

### 3.3 리포트 UI (나의 현황 탭)

```
┌─────────────────────────────────────────────┐
│  📊 나의 학습 현황                           │
├─────────────────────────────────────────────┤
│                                             │
│  [요약 카드]                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 학습 레슨 │ │ 퀴즈 정답률│ │ 연속 학습 │  │
│  │   12개   │ │   78%    │ │  5일    │      │
│  └─────────┘ └─────────┘ └─────────┘       │
│                                             │
│  [강점 / 약점 분석]                          │
│  ✅ 강점: 변수, 연산자, 조건문               │
│  ⚠️ 약점: 포인터, 메모리 관리                │
│                                             │
│  [추천 학습]                                │
│  → 포인터 기초 복습하기                      │
│  → 동적 메모리 할당 레슨 도전                │
│                                             │
│  [퀴즈 유형별 정답률]                        │
│  OX: 85% ████████░░                         │
│  객관식: 72% ███████░░░                     │
│  빈칸 입력: 65% ██████░░░░                  │
└─────────────────────────────────────────────┘
```

### 3.4 DB 스키마

```prisma
model UserProfile {
  id              String   @id @default(uuid())
  userId          String   @unique
  ageGroup        String?  // 10s, 20s, 30s, 40+
  occupation      String?  // student_middle, student_high, student_uni, job_seeker, worker, other
  experience      String?  // none, less_1y, 1_3y, more_3y
  learningGoal    String?  // basics, job_prep, skill_up, curiosity
  createdAt       DateTime @default(now())
  @@map("user_profiles")
}

model SessionContext {
  id              String   @id @default(uuid())
  userId          String
  sessionId       String
  deviceType      String   // mobile, tablet, desktop
  screenSize      String   // 1920x1080
  networkType     String?  // 4g, wifi
  timezone        String
  dayOfWeek       Int
  hourOfDay       Int
  createdAt       DateTime @default(now())
  @@map("session_contexts")
}

model StepActivity {
  id              String   @id @default(uuid())
  userId          String
  lessonId        String
  stepIndex       Int
  timeSpent       Int      // seconds
  wentBack        Boolean  @default(false)
  aiQuestionCount Int      @default(0)
  createdAt       DateTime @default(now())
  @@map("step_activities")
}
```

### 3.5 분석 API

```
GET /api/analytics/me
  Response: {
    summary: { lessonsCompleted, quizAccuracy, currentStreak },
    weakChapters: Chapter[],
    strongChapters: Chapter[],
    recommendations: Recommendation[]
  }

GET /api/analytics/me/weekly
  Response: { dailyStats: DailyStats[] }

GET /api/analytics/me/quiz-breakdown
  Response: {
    byType: { ox: number, multiple_choice: number, fill_blank: number },
    byChapter: { [chapterId]: number }
  }
```

### 3.6 구현 순서

| 순서 | 작업 | 의존성 | 상태 |
|------|------|--------|------|
| 1 | DB 스키마 추가 | - | ⏳ |
| 2 | 백엔드 API 추가/수정 | 1 | ⏳ |
| 3 | 프론트 온보딩 UI | 1 | ⏳ |
| 4 | 프론트 데이터 수집 연동 | 2 | ⏳ |
| 5 | 리포트 UI (대시보드) | 2, 4 | ⏳ |

---

## 참고 문서

- `docs/plans/AI_LEARNING_REPORT.md` - 이론적 배경 + 상세 설계
- `docs/plans/QUIZ_AND_ANALYTICS_SYSTEM.md` - 퀴즈 시스템 + 기존 분석 설계
- `docs/plans/ANALYTICS_DATA_COLLECTION.md` - 데이터 수집 구현 계획

---

*마지막 업데이트: 2026-01-18*
