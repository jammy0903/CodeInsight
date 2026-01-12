# 퀴즈 시스템 & 학습 분석 설계

> **목표**: 다양한 퀴즈 유형 지원 + 사용자 학습 데이터 분석 + 개인화 레포트

---

## 1. 인증 정책

### 1.1 localStorage 미사용 원칙

```
❌ 기존 방식 (문제점)
- 로그인 시 localStorage에 토큰/사용자 정보 저장
- XSS 공격에 취약
- 탭 간 동기화 문제

✅ 새로운 방식
- Firebase Auth 세션만 사용 (메모리 + IndexedDB 자동 관리)
- 앱 상태는 Zustand store (메모리)
- 학습 진행 상태는 무조건 DB에서 조회
```

### 1.2 인증 흐름

```
1. 앱 시작 → Firebase onAuthStateChanged 감지
2. Firebase User 있음 → 백엔드 /users/me 호출
3. 백엔드에서 DB 조회 → appUser 반환
4. Zustand store에 저장 (메모리만)
5. 페이지 새로고침 → 1번부터 다시 시작 (localStorage 읽기 없음)
```

### 1.3 구현 체크리스트

- [ ] localStorage에서 사용자 정보 읽는 코드 제거
- [ ] 학습 진행 상태 localStorage → DB 마이그레이션
- [ ] 오프라인 지원 필요 시 IndexedDB 사용 (localStorage 아님)

---

## 2. 퀴즈 시스템

### 2.1 퀴즈 유형 (3종류)

| 유형 | type 값 | 설명 | 예시 |
|------|---------|------|------|
| **OX 퀴즈** | `ox` | 참/거짓 선택 | "포인터는 메모리 주소를 저장한다 (O/X)" |
| **객관식** | `multiple_choice` | 4지선다 | "다음 중 포인터 선언으로 올바른 것은?" |
| **빈칸 코드 입력** | `fill_blank` | 코드 빈칸에 직접 입력 | "int *p = ____;" |

### 2.2 퀴즈 데이터 구조

```typescript
// OX 퀴즈
{
  type: "ox",
  question: "포인터 변수는 다른 변수의 메모리 주소를 저장한다.",
  answer: "O",
  explanation: "포인터는 메모리 주소를 저장하는 변수입니다."
}

// 객관식
{
  type: "multiple_choice",
  question: "다음 중 포인터 선언으로 올바른 것은?",
  options: ["int p;", "int *p;", "int &p;", "pointer p;"],
  answer: "1",  // 0-indexed
  explanation: "포인터는 자료형 뒤에 *를 붙여 선언합니다."
}

// 빈칸 코드 입력
{
  type: "fill_blank",
  question: "포인터 p가 변수 x를 가리키도록 빈칸을 채우세요.",
  code: "int x = 10;\nint *p = ____;",
  answer: "&x",
  acceptedAnswers: ["&x", "& x", "&(x)"],  // 허용되는 답변들 (공백, 괄호 등 변형)
  explanation: "&x는 변수 x의 주소를 의미합니다."
}
```

### 2.3 난이도 시스템

```
기본 (basic)     → OX 퀴즈
중급 (intermediate) → 객관식
고급 (advanced)  → 빈칸 코드 입력
```

---

## 3. 학습 분석 & 레포트

### 3.1 수집 데이터

| 데이터 | 용도 |
|--------|------|
| 퀴즈 정답률 | 취약 개념 파악 |
| 퀴즈 소요 시간 | 이해도 측정 |
| 오답 패턴 | 반복 실수 분석 |
| 레슨 완료율 | 진도 추적 |
| 재학습 횟수 | 복습 필요 영역 파악 |
| 코드 실행 횟수 | 실습 참여도 |

### 3.2 레포트 구성 (나의 현황 탭)

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
│  [주간 학습 그래프]                          │
│  ████████░░ 월                              │
│  ████░░░░░░ 화                              │
│  ██████████ 수                              │
│  ...                                        │
│                                             │
│  [퀴즈 유형별 정답률]                        │
│  OX: 85% ████████░░                         │
│  객관식: 72% ███████░░░                     │
│  빈칸 입력: 65% ██████░░░░                  │
│                                             │
└─────────────────────────────────────────────┘
```

### 3.3 분석 알고리즘

```typescript
// 취약 개념 분석
function analyzeWeakness(quizAttempts: QuizAttempt[]): WeaknessReport {
  // 1. 챕터별 정답률 계산
  // 2. 70% 미만인 챕터 = 약점
  // 3. 같은 문제 2회 이상 틀림 = 반복 실수
  // 4. 소요 시간 평균 대비 2배 이상 = 어려워하는 개념
}

// 추천 학습 생성
function generateRecommendation(user: User): Recommendation[] {
  // 1. 약점 챕터의 이전 레슨부터 복습 추천
  // 2. 완료하지 않은 레슨 중 난이도 순 정렬
  // 3. 오래된 완료 레슨 복습 추천 (망각 곡선)
}
```

---

## 4. DB 스키마 재설계

### 4.1 새로운 모델

```prisma
// =============================================
// 퀴즈 시스템 확장
// =============================================

model Quiz {
  id              String   @id
  lessonId        String   @map("lesson_id")
  type            String   // ox, multiple_choice, fill_blank (3종류만)
  question        String   @db.Text
  code            String?  @db.Text           // 빈칸 코드 입력용 (____가 포함된 코드)
  options         Json?                       // 객관식 선택지
  answer          String                      // 정답
  acceptedAnswers Json?    @map("accepted_answers")  // 빈칸 입력 허용 답변들
  explanation     String?  @db.Text           // 해설
  difficulty      String   @default("basic")  // basic, intermediate, advanced
  order           Int
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz

  lesson   Lesson         @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  attempts QuizAttempt[]

  @@index([lessonId, order])
  @@index([type])
  @@map("quizzes")
}

// =============================================
// 퀴즈 시도 기록 (분석용)
// =============================================

model QuizAttempt {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  quizId      String   @map("quiz_id")
  userAnswer  String   @map("user_answer")
  isCorrect   Boolean  @map("is_correct")
  timeSpent   Int?     @map("time_spent")  // 소요 시간 (초)
  attemptedAt DateTime @default(now()) @map("attempted_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])
  quiz Quiz @relation(fields: [quizId], references: [id])

  @@index([userId])
  @@index([quizId])
  @@index([userId, isCorrect])
  @@index([attemptedAt])
  @@map("quiz_attempts")
}

// =============================================
// 학습 세션 (시간 추적)
// =============================================

model LearningSession {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  lessonId  String    @map("lesson_id")
  startedAt DateTime  @default(now()) @map("started_at") @db.Timestamptz
  endedAt   DateTime? @map("ended_at") @db.Timestamptz
  duration  Int?      // 총 학습 시간 (초)

  user   User   @relation(fields: [userId], references: [id])
  lesson Lesson @relation(fields: [lessonId], references: [id])

  @@index([userId])
  @@index([lessonId])
  @@index([startedAt])
  @@map("learning_sessions")
}

// =============================================
// 일별 학습 통계 (집계 테이블)
// =============================================

model DailyStats {
  id              String   @id @default(uuid()) @db.Uuid
  userId          String   @map("user_id") @db.Uuid
  date            DateTime @db.Date
  lessonsCompleted Int     @default(0) @map("lessons_completed")
  quizzesAttempted Int     @default(0) @map("quizzes_attempted")
  quizzesCorrect   Int     @default(0) @map("quizzes_correct")
  totalTime        Int     @default(0) @map("total_time")  // 초
  codeExecutions   Int     @default(0) @map("code_executions")

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, date])
  @@index([userId])
  @@index([date])
  @@map("daily_stats")
}

// =============================================
// 사용자 분석 캐시 (빠른 조회용)
// =============================================

model UserAnalytics {
  id                String   @id @default(uuid()) @db.Uuid
  userId            String   @unique @map("user_id") @db.Uuid
  totalLessons      Int      @default(0) @map("total_lessons")
  completedLessons  Int      @default(0) @map("completed_lessons")
  totalQuizzes      Int      @default(0) @map("total_quizzes")
  correctQuizzes    Int      @default(0) @map("correct_quizzes")
  totalLearningTime Int      @default(0) @map("total_learning_time")  // 초
  currentStreak     Int      @default(0) @map("current_streak")  // 연속 학습일
  longestStreak     Int      @default(0) @map("longest_streak")
  lastActiveAt      DateTime? @map("last_active_at") @db.Timestamptz
  weakChapters      Json     @default("[]") @map("weak_chapters")  // 취약 챕터 ID 배열
  strongChapters    Json     @default("[]") @map("strong_chapters")
  updatedAt         DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@map("user_analytics")
}

// =============================================
// User 모델 업데이트
// =============================================

model User {
  id        String   @id @default(uuid()) @db.Uuid
  nickname  String   @unique
  role      String   @default("user")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  // 기존 관계
  oauthAccounts OAuthAccount[]
  drafts        Draft[]
  submissions   Submission[]
  progress      UserProgress[]

  // 새로운 관계
  quizAttempts     QuizAttempt[]
  learningSessions LearningSession[]
  dailyStats       DailyStats[]
  analytics        UserAnalytics?

  @@map("users")
}
```

### 4.2 ERD 요약

```
User (사용자)
  ├── OAuthAccount (소셜 로그인)
  ├── UserProgress (레슨 진행 상태)
  ├── QuizAttempt (퀴즈 시도 기록)
  ├── LearningSession (학습 세션)
  ├── DailyStats (일별 통계)
  └── UserAnalytics (분석 캐시)

Language (언어)
  └── Chapter (챕터)
       └── Lesson (레슨)
            ├── LessonContent (코드 + 스텝)
            ├── Quiz (퀴즈)
            │    └── QuizAttempt
            ├── UserProgress
            └── LearningSession
```

### 4.3 인덱스 전략

```sql
-- 자주 사용되는 쿼리 최적화
CREATE INDEX idx_quiz_attempts_user_date ON quiz_attempts(user_id, attempted_at);
CREATE INDEX idx_daily_stats_user_range ON daily_stats(user_id, date);
CREATE INDEX idx_learning_sessions_user_recent ON learning_sessions(user_id, started_at DESC);
```

---

## 5. API 설계

### 5.1 퀴즈 API

```
POST /api/quizzes/:quizId/attempt
  Body: { userAnswer: string, timeSpent: number }
  Response: { isCorrect: boolean, explanation: string }

GET /api/lessons/:lessonId/quizzes
  Response: Quiz[]
```

### 5.2 분석 API

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

---

## 6. 구현 우선순위

### Phase 1: 기반 작업
- [ ] localStorage 사용 코드 제거
- [ ] DB 마이그레이션 (새 테이블)
- [ ] Quiz 모델 확장

### Phase 2: 퀴즈 시스템
- [ ] QuizAttempt 저장 로직
- [ ] 퀴즈 유형별 UI 컴포넌트
- [ ] 퀴즈 결과 피드백 UI

### Phase 3: 학습 분석
- [ ] LearningSession 추적
- [ ] DailyStats 집계 (배치/트리거)
- [ ] UserAnalytics 계산

### Phase 4: 레포트 UI
- [ ] Dashboard 페이지 구현
- [ ] 차트 컴포넌트 (recharts 등)
- [ ] 추천 학습 알고리즘

---

## 7. 기술 스택 추가

| 용도 | 라이브러리 |
|------|-----------|
| 차트 | recharts 또는 chart.js |
| 날짜 계산 | date-fns |
| 배치 작업 | node-cron (통계 집계) |

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-12 | 초안 작성 |
| 2026-01-12 | 퀴즈 유형 5개 → 3개로 축소 (OX, 객관식, 빈칸 코드 입력) |
