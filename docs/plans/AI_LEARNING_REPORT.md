# AI 학습 리포트 분석 시스템 설계

> **목표**: 수집된 학습 데이터를 AI로 분석하여 개인화된 학습 인사이트 제공
> **작성일**: 2026-01-17
> **상태**: 계획 단계

---

## 1. 개요

### 1.1 관련 문서

| 문서 | 역할 |
|------|------|
| `QUIZ_AND_ANALYTICS_SYSTEM.md` | DB 스키마, 퀴즈 시스템, 기본 분석 |
| `ANALYTICS_DATA_COLLECTION.md` | 프론트/백엔드 데이터 수집 구현 |
| **본 문서** | AI 기반 고급 분석, 이론적 배경, 구현 순서 |

### 1.2 핵심 질문

```
"단순 통계 나열이 아닌, 학습자의 행동 변화를 유도하는 인사이트를 어떻게 제공할까?"
```

---

## 2. 이론적 배경 (Research Foundation)

### 2.1 인지과학 & 신경과학

| 이론 | 핵심 개념 | CodeInsight 적용 |
|------|----------|-----------------|
| **Cognitive Load Theory** | 작업 기억 용량 제한 → 청킹 필요 | 시각화로 외부 기억 보조, 인지 부하 추정 |
| **Memory Consolidation** | 해마 → 피질로 장기기억 형성 | 최적 복습 타이밍 추천 |
| **Spacing Effect** | 간격 반복이 집중 반복보다 효과적 | Spaced Repetition 알고리즘 |
| **Working Memory in Tracing** | 프로그램 추적 시 변수 상태 유지 부담 | 메모리 시각화 = 인지 부하 감소 |

**핵심 참고 논문:**
- [The Role of Working Memory in Program Tracing (CHI 2021)](https://arxiv.org/abs/2101.06305)
- [Cognitive Load Theory in Computing Education (ACM 2021)](https://dl.acm.org/doi/10.1145/3483843)
- [Spacing Effect Review (Sage 2016)](https://journals.sagepub.com/doi/abs/10.1177/2372732215624708)

### 2.2 심리학: Flow & 자기결정이론

#### Flow Theory (Csikszentmihalyi)

```
                 불안 (Anxiety)
                    ↑
    도전 수준      │    ★ FLOW ZONE ★
    (Challenge)    │   (최적 학습 영역)
                    │
                    └────────────────→
                         기술 수준 (Skill)
                    지루함 (Boredom)
```

**Flow 조건 3가지:**
1. 명확한 목표
2. 즉각적 피드백
3. 도전-기술 균형

**적용:**
- 퀴즈 정답률 90%+ → "너무 쉬움" → 다음 챕터 권장
- 퀴즈 정답률 30%- → "너무 어려움" → 이전 개념 복습 권장
- 퀴즈 정답률 50-80% → "Flow Zone" → 최적 상태

#### Self-Determination Theory

| 욕구 | 설명 | 적용 |
|------|------|------|
| **자율성** | 스스로 선택 | 다음 레슨 선택권 |
| **유능감** | 잘하고 있다는 느낌 | 진행률, 숙달도 표시 |
| **관계성** | 연결감 | (향후) 커뮤니티 |

**핵심 참고 논문:**
- [SRLAgent: Self-Regulated Learning (2025)](https://hf.co/papers/2506.09968)

### 2.3 행동경제학: Nudge Theory

| 넛지 유형 | 설명 | 적용 |
|----------|------|------|
| **Default** | 기본값을 바람직한 쪽으로 | 다음 레슨 자동 추천 |
| **Feedback** | 결과 즉시 표시 | 퀴즈 후 즉각 해설 |
| **Social Proof** | 다른 사람들도 이렇게 함 | "83%가 이 레슨 후 Chapter 2로" |
| **Commitment** | 작은 약속 → 큰 행동 | 일일 목표, 학습 알림 |
| **Salience** | 중요 정보 강조 | 취약 개념 하이라이트 |

**핵심:**
- 리포트는 단순 통계 나열 ❌
- 행동 유도 메시지 포함 ⭕

### 2.4 망각 곡선 (Ebbinghaus)

```
기억
100% │ ████
 80% │ ███        ← 1차 복습
 60% │ ██              ← 2차 복습
 40% │ █                    ← 3차 복습
 20% │ ·
  0% │────────────────────────────────→ 시간
      1일  3일  7일  14일  30일
```

**최적 복습 간격:**
- 1차: 1일 후
- 2차: 3일 후
- 3차: 7일 후
- 4차: 14일 후
- 5차: 30일 후

### 2.5 Knowledge Tracing (지식 추적)

**핵심 논문:**
- [Deep Knowledge Tracing with Learning Curves](https://hf.co/papers/2008.01169)
- [PSI-KT: Predictive, Scalable, Interpretable KT](https://hf.co/papers/2403.13179)
- [TRAVER: Trace-and-Verify for Coding Tutoring](https://hf.co/papers/2502.13311)

**적용:**
- 다음 퀴즈 예상 정답률 예측
- 개념별 숙달도 추정
- 취약 개념 자동 식별

### 2.6 게이미피케이션

| 요소 | 심리적 효과 | 적용 |
|------|-----------|------|
| **Progress Bar** | 완료 욕구 (Zeigarnik Effect) | 챕터 진행률 |
| **Streaks** | 손실 회피 + 습관 형성 | 연속 학습일 |
| **Badges** | 성취감 + 수집 욕구 | 개념 마스터 뱃지 |
| **Levels** | 성장 가시화 | "포인터 마스터 Lv.3" |

**주의:** CodeInsight는 경쟁보다 자기 성장에 초점
- 리더보드 ❌
- 개인 성장 그래프 ⭕

### 2.7 에듀테크 사례 연구

#### Duolingo

| 전략 | 설명 |
|------|------|
| Spaced Repetition | 틀린 문제 최적 간격 재출제 |
| Streak System | 연속 학습일 압박 |
| Skill Decay | 안 하면 실력 녹슬기 표시 |
| A/B Testing | 모든 기능 데이터 기반 결정 |

#### Khan Academy

| 전략 | 설명 |
|------|------|
| Mastery Learning | 이해할 때까지 다음 단계 안 감 |
| Knowledge Map | 개념 간 연결 시각화 |
| Khanmigo (AI) | GPT 기반 1:1 튜터 |

**참고:**
- [Duolingo EDM 2021 Case Study](https://research.duolingo.com/papers/portnoff.edm21.pdf)
- [CodeAid: LLM Programming Assistant (CHI 2024)](https://hf.co/papers/2401.11314)

---

## 3. 분석 항목 설계

### 3.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                    CodeInsight 학습 리포트                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🧠 인지 분석 (Cognitive)                                         │
│ ├─ 인지 부하 추정                                               │
│ ├─ 시각화 의존도                                                │
│ └─ 최적 복습 시점                                               │
│                                                                 │
│ 🎯 숙달도 분석 (Mastery)                                         │
│ ├─ Knowledge Tracing (예상 정답률)                              │
│ ├─ 개념별 숙달도                                                │
│ └─ Flow Zone 진단                                               │
│                                                                 │
│ 📊 행동 패턴 (Behavioral)                                        │
│ ├─ 학습 스트릭                                                  │
│ ├─ 학습 시간대 패턴                                             │
│ ├─ 세션 길이                                                    │
│ └─ AI 해설자 활용                                               │
│                                                                 │
│ 💡 맞춤 추천 (Personalized)                                      │
│ ├─ 다음 학습 레슨                                               │
│ ├─ 복습 필요 개념                                               │
│ └─ 학습 넛지 메시지                                             │
│                                                                 │
│ 🏆 성취 & 동기부여 (Achievement)                                 │
│ ├─ 획득 배지                                                    │
│ ├─ 성장 그래프                                                  │
│ └─ 마일스톤 진행률                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 인지 분석 (Cognitive Analysis)

#### 측정 지표

| 지표 | 데이터 소스 | 의미 |
|------|-----------|------|
| 스텝당 평균 체류 시간 | LessonActivity | 길수록 인지 부하 높음 |
| 뒤로 가기 빈도 | LessonActivity | 재확인 필요 = 이해 부족 |
| 시각화 확대/축소 빈도 | (신규) | 시각화 의존도 |
| 힌트 요청 빈도 | ChatHistory | 어려움 정도 |
| 퀴즈 재시도 횟수 | QuizAttempt | 개념 미숙달 |

#### 인지 부하 점수 계산 (예시)

```typescript
function calculateCognitiveLoad(activity: LessonActivity): number {
  const avgStepTime = activity.totalTime / activity.steps;
  const backtrackRatio = activity.backtrackCount / activity.steps;
  const hintRatio = activity.hintCount / activity.steps;

  // 0-100 점수 (높을수록 부하 높음)
  return Math.min(100,
    (avgStepTime / 30) * 40 +      // 스텝당 30초 기준
    backtrackRatio * 100 * 30 +     // 뒤로가기 비율
    hintRatio * 100 * 30            // 힌트 비율
  );
}
```

#### 시각화 의존도 분석

```
의존도 높음 (70%+): "아직 내재화 진행 중. 시각화 없이 떠올려보는 연습 권장"
의존도 중간 (30-70%): "개념 이해 중. 꾸준히 진행하세요"
의존도 낮음 (30%-): "개념 내재화 완료! 다음 단계로 도전해보세요"
```

### 3.3 숙달도 분석 (Mastery Analysis)

#### Knowledge Tracing 간소화 버전

```typescript
// 베이지안 지식 추적 (BKT) 간소화
interface KnowledgeState {
  conceptId: string;
  mastery: number;      // 0-1 숙달 확률
  lastAttempt: Date;
  attempts: number;
  correctRate: number;
}

function updateMastery(
  state: KnowledgeState,
  isCorrect: boolean
): KnowledgeState {
  const learningRate = 0.1;   // 학습 속도
  const guessRate = 0.25;     // 추측 정답 확률
  const slipRate = 0.1;       // 실수 확률

  if (isCorrect) {
    // 정답: 숙달도 증가
    state.mastery = state.mastery + (1 - state.mastery) * learningRate;
  } else {
    // 오답: 숙달도 감소 (망각 + 미숙달)
    state.mastery = state.mastery * (1 - slipRate);
  }

  return state;
}
```

#### Flow Zone 진단

```typescript
function diagnoseFlowZone(correctRate: number): FlowDiagnosis {
  if (correctRate >= 0.9) {
    return {
      zone: 'boredom',
      message: '너무 쉬워요! 다음 챕터에 도전해보세요.',
      recommendation: 'advance'
    };
  } else if (correctRate <= 0.3) {
    return {
      zone: 'anxiety',
      message: '조금 어려운 것 같아요. 이전 개념을 복습해볼까요?',
      recommendation: 'review'
    };
  } else {
    return {
      zone: 'flow',
      message: '최적의 학습 상태예요! 계속 진행하세요.',
      recommendation: 'continue'
    };
  }
}
```

### 3.4 행동 패턴 분석 (Behavioral Analysis)

#### 스트릭 계산

```typescript
function calculateStreak(dailyStats: DailyStats[]): StreakInfo {
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // 날짜순 정렬 후 연속 학습일 계산
  const sorted = dailyStats.sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].lessonsCompleted > 0 || sorted[i].quizzesAttempted > 0) {
      tempStreak++;
      if (i === 0) currentStreak = tempStreak;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 0;
      if (i === 0) currentStreak = 0;
    }
  }

  return { currentStreak, longestStreak };
}
```

#### 학습 시간대 패턴

```typescript
function analyzeStudyTimePattern(sessions: LearningSession[]): TimePattern {
  const hourCounts = new Array(24).fill(0);

  sessions.forEach(session => {
    const hour = new Date(session.startedAt).getHours();
    hourCounts[hour]++;
  });

  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  return {
    peakHour,
    pattern: peakHour < 12 ? 'morning' : peakHour < 18 ? 'afternoon' : 'evening',
    message: `주로 ${peakHour}시에 학습하시네요!`
  };
}
```

### 3.5 맞춤 추천 (Personalized Recommendations)

#### 복습 추천 (Spaced Repetition)

```typescript
function getReviewRecommendations(
  progress: UserProgress[],
  masteryStates: KnowledgeState[]
): Recommendation[] {
  const now = new Date();
  const recommendations: Recommendation[] = [];

  masteryStates.forEach(state => {
    const daysSinceLastAttempt =
      (now.getTime() - state.lastAttempt.getTime()) / (1000 * 60 * 60 * 24);

    // 숙달도에 따른 최적 복습 간격
    const optimalInterval = getOptimalInterval(state.mastery);

    if (daysSinceLastAttempt >= optimalInterval) {
      recommendations.push({
        type: 'review',
        conceptId: state.conceptId,
        priority: state.mastery < 0.5 ? 'high' : 'medium',
        message: `${state.conceptId} 복습할 때가 되었어요!`
      });
    }
  });

  return recommendations.sort((a, b) =>
    a.priority === 'high' ? -1 : 1
  );
}

function getOptimalInterval(mastery: number): number {
  // 숙달도가 높을수록 복습 간격 길어짐
  if (mastery < 0.3) return 1;   // 1일
  if (mastery < 0.5) return 3;   // 3일
  if (mastery < 0.7) return 7;   // 7일
  if (mastery < 0.9) return 14;  // 14일
  return 30;                      // 30일
}
```

#### 넛지 메시지 생성

```typescript
function generateNudgeMessage(analytics: UserAnalytics): string {
  // 스트릭 기반
  if (analytics.currentStreak >= 5) {
    return `🔥 ${analytics.currentStreak}일 연속 학습 중! 대단해요!`;
  }

  // 정답률 기반
  const accuracy = analytics.correctQuizzes / analytics.totalQuizzes;
  if (accuracy > 0.8) {
    return `✨ 퀴즈 정답률 ${Math.round(accuracy * 100)}%! 실력이 늘고 있어요.`;
  }

  // 약점 기반
  if (analytics.weakChapters.length > 0) {
    return `💡 ${analytics.weakChapters[0]} 한 번 더 복습하면 90%+ 가능!`;
  }

  // 기본
  return `📚 오늘도 코드의 원리를 이해해볼까요?`;
}
```

### 3.6 AI 기반 심층 분석 (Phase 2)

#### LLM 프롬프트 설계

```typescript
const ANALYSIS_PROMPT = `
당신은 프로그래밍 학습 분석 전문가입니다.
다음 학습 데이터를 분석하여 개인화된 피드백을 제공하세요.

## 학습 데이터
- 완료 레슨: {completedLessons}
- 퀴즈 정답률: {quizAccuracy}%
- 취약 개념: {weakConcepts}
- 강점 개념: {strongConcepts}
- 학습 패턴: {studyPattern}

## 분석 요청
1. 학습자의 현재 수준 평가 (한 문장)
2. 가장 시급히 보완할 개념 (1개)
3. 다음 학습 추천 (구체적 레슨명)
4. 동기부여 메시지 (격려하되 과하지 않게)

JSON 형식으로 응답하세요.
`;
```

---

## 4. 구현 순서

### Phase 1: 기본 분석 (MVP)

> 예상 소요: 3-4일

#### 1.1 백엔드 API

```
[ ] GET /api/analytics/summary
    - 기본 통계 (완료 레슨, 퀴즈 정답률, 스트릭)
    - 취약/강점 챕터

[ ] GET /api/analytics/weekly
    - 주간 학습 그래프 데이터

[ ] GET /api/analytics/recommendations
    - 복습 추천 (Spaced Repetition 기반)
    - 다음 학습 추천
```

#### 1.2 프론트엔드 UI

```
[ ] AnalyticsSummaryCard.tsx
    - 핵심 지표 3개 (레슨, 정답률, 스트릭)

[ ] WeeklyChart.tsx
    - 주간 학습량 차트 (recharts)

[ ] RecommendationList.tsx
    - 복습/다음 학습 추천 목록
```

#### 1.3 데이터 수집 연동

```
[ ] ANALYTICS_DATA_COLLECTION.md 구현 완료 선행
    - LessonActivity 수집
    - QuizAttempt 수집
    - ChatHistory 수집
```

### Phase 2: 숙달도 분석

> 예상 소요: 2-3일

```
[ ] KnowledgeState 모델 추가 (DB)
[ ] BKT 알고리즘 구현 (backend)
[ ] 숙달도 시각화 UI
[ ] Flow Zone 진단 UI
```

### Phase 3: 인지 분석

> 예상 소요: 2-3일

```
[ ] 인지 부하 점수 계산 로직
[ ] 시각화 의존도 측정 (프론트 이벤트 추가)
[ ] 인지 분석 UI 컴포넌트
```

### Phase 4: 게이미피케이션

> 예상 소요: 2일

```
[ ] Badge 모델 (DB)
[ ] 배지 획득 로직
[ ] 배지 UI 컴포넌트
[ ] 레벨 시스템 (선택)
```

### Phase 5: AI 심층 분석

> 예상 소요: 2-3일

```
[ ] LLM 프롬프트 설계 완료
[ ] /api/analytics/ai-insight API
[ ] AI 인사이트 UI 컴포넌트
```

---

## 5. 기술 스택

### 5.1 추가 라이브러리

| 용도 | 라이브러리 | 설치 |
|------|-----------|------|
| 차트 | recharts | `pnpm add recharts` |
| 날짜 | date-fns | (이미 설치됨) |
| 배치 | node-cron | `pnpm add node-cron` |

### 5.2 DB 스키마 추가 (Phase 2+)

```prisma
// 개념별 숙달도 상태
model KnowledgeState {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  conceptId   String   @map("concept_id")
  mastery     Float    @default(0)
  attempts    Int      @default(0)
  correctRate Float    @default(0) @map("correct_rate")
  lastAttempt DateTime? @map("last_attempt") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, conceptId])
  @@map("knowledge_states")
}

// 배지 시스템
model Badge {
  id          String @id
  name        String
  description String
  icon        String
  condition   Json   // 획득 조건

  userBadges UserBadge[]

  @@map("badges")
}

model UserBadge {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  badgeId   String   @map("badge_id")
  earnedAt  DateTime @default(now()) @map("earned_at") @db.Timestamptz

  user  User  @relation(fields: [userId], references: [id])
  badge Badge @relation(fields: [badgeId], references: [id])

  @@unique([userId, badgeId])
  @@map("user_badges")
}
```

---

## 6. UI 와이어프레임

### 6.1 학습 리포트 메인

```
┌─────────────────────────────────────────────────────────────┐
│  📊 나의 학습 현황                            [이번 주 ▼]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  📚 완료     │ │  ✅ 정답률   │ │  🔥 연속     │           │
│  │   12개      │ │    78%      │ │   5일       │           │
│  │  레슨       │ │   퀴즈      │ │   학습      │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  📈 주간 학습량                                        │ │
│  │  ████████░░ 월 (2레슨)                                │ │
│  │  ████░░░░░░ 화 (1레슨)                                │ │
│  │  ██████████ 수 (3레슨)                                │ │
│  │  ░░░░░░░░░░ 목 (0레슨)                                │ │
│  │  ██████░░░░ 금 (2레슨)                                │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  💡 AI 분석                                           │ │
│  │                                                       │ │
│  │  "포인터 개념을 70% 이해하셨어요!                      │ │
│  │   한 번 더 복습하면 90%+ 달성 가능합니다."             │ │
│  │                                                       │ │
│  │  ✅ 강점: 변수, 연산자, 조건문                         │ │
│  │  ⚠️ 약점: 포인터, 메모리 할당                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  🎯 추천 학습                                         │ │
│  │                                                       │ │
│  │  1. [복습] 포인터 기초 (3일 전 학습)                   │ │
│  │  2. [다음] 동적 메모리 할당                           │ │
│  │  3. [복습] 배열과 포인터 관계                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 숙달도 상세 (Phase 2)

```
┌─────────────────────────────────────────────────────────────┐
│  🎯 개념별 숙달도                                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Chapter 1: 변수와 자료형                                   │
│  ████████████████████ 95% ✅                               │
│                                                             │
│  Chapter 2: 연산자                                          │
│  ██████████████████░░ 85% ✅                               │
│                                                             │
│  Chapter 3: 제어문                                          │
│  ████████████████░░░░ 78% ✅                               │
│                                                             │
│  Chapter 4: 포인터           ⚠️ Flow Zone: 불안 영역        │
│  ████████░░░░░░░░░░░░ 42%                                  │
│  → 이전 개념 복습 권장                                      │
│                                                             │
│  Chapter 5: 메모리 관리      🔒 잠김 (Chapter 4 완료 필요)  │
│  ░░░░░░░░░░░░░░░░░░░░ 0%                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. 성공 지표 (KPI)

### 7.1 학습 효과

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 퀴즈 정답률 향상 | +10% (1개월) | 월별 평균 비교 |
| 복습 권장 클릭률 | 30%+ | 추천 → 실제 학습 |
| 개념 숙달 시간 단축 | -20% | 동일 숙달도 도달 시간 |

### 7.2 사용자 참여

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 리포트 페이지 방문율 | 50%+ DAU | 페이지뷰 / DAU |
| 평균 스트릭 | 5일+ | 전체 사용자 평균 |
| 배지 획득률 | 3개+/사용자 | 평균 배지 수 |

---

## 8. 참고 자료 목록

### 8.1 핵심 논문

| 분야 | 논문 | 링크 |
|------|------|------|
| Knowledge Tracing | Deep KT with Learning Curves | [HF](https://hf.co/papers/2008.01169) |
| Working Memory | CHI 2021 - Program Tracing | [arXiv](https://arxiv.org/abs/2101.06305) |
| Cognitive Load | CLT in Computing Education | [ACM](https://dl.acm.org/doi/10.1145/3483843) |
| LLM Tutoring | CodeAid (CHI 2024) | [HF](https://hf.co/papers/2401.11314) |
| Self-Regulated Learning | SRLAgent (2025) | [HF](https://hf.co/papers/2506.09968) |
| Gamification | Gamified LA Dashboard | [Wiley](https://onlinelibrary.wiley.com/doi/10.1111/jcal.12853) |

### 8.2 에듀테크 사례

| 서비스 | 참고 포인트 | 링크 |
|--------|-----------|------|
| Duolingo | Spaced Repetition, Streaks | [EDM 2021](https://research.duolingo.com/papers/portnoff.edm21.pdf) |
| Khan Academy | Mastery Learning, AI Tutor | [Case Study](https://www.analyticsvidhya.com/blog/2023/05/generative-ai-in-education-a-case-study-of-khan-academy/) |

### 8.3 이론 자료

| 이론 | 자료 | 링크 |
|------|------|------|
| Flow Theory | Csikszentmihalyi TED | [TED](https://www.ted.com/talks/mihaly_csikszentmihalyi_flow_the_secret_to_happiness) |
| Nudge Theory | Wikipedia | [Wiki](https://en.wikipedia.org/wiki/Nudge_theory) |
| Spacing Effect | Sage Journal | [Sage](https://journals.sagepub.com/doi/abs/10.1177/2372732215624708) |

---

## 9. 학습자 행동 심층 분석 프레임워크

> 다양한 학습 상황에서 사람의 행동을 이해하고 적절히 대응하기 위한 체계

### 9.1 학습자 상태 분류 (Learner States)

#### 상태 정의

| 상태 | 설명 | 감지 신호 |
|------|------|----------|
| **🟢 정상 (Normal)** | 꾸준히 학습 중, 적절한 진행 | 정기적 로그인, 퀴즈 50-85% 정답 |
| **🟡 고원 (Plateau)** | 진행이 멈춤, 같은 레벨에서 정체 | 3일+ 같은 레슨, 정답률 변화 없음 |
| **🟠 혼란 (Confusion)** | 개념을 이해 못함, 헤매는 중 | 뒤로가기 많음, 힌트 과다 요청 |
| **🔴 좌절 (Frustration)** | 반복 실패로 포기 직전 | 같은 퀴즈 3회+ 오답, 세션 짧아짐 |
| **😴 지루함 (Boredom)** | 너무 쉬움, 도전 부족 | 정답률 95%+, 스킵 많음, 체류 시간 짧음 |
| **🔥 번아웃 위험 (Burnout)** | 과도한 학습, 지침 | 하루 3시간+, 연속 10일+, 정답률 하락 |
| **⚪ 이탈 위험 (Churn Risk)** | 활동 감소, 이탈 조짐 | 로그인 간격 증가, 세션 짧아짐 |
| **⬛ 비활성 (Inactive)** | 7일+ 미접속 | 마지막 활동 7일+ 전 |
| **🔄 복귀 (Returning)** | 비활성 후 돌아옴 | 7일+ 비활성 후 로그인 |

#### 상태 전이 다이어그램

```
                    ┌─────────────────┐
                    │                 │
    ┌───────────────▼─────────────────┴───────────────┐
    │                    정상 (Normal)                 │
    └───┬───────┬────────┬────────┬────────┬─────────┘
        │       │        │        │        │
        ▼       ▼        ▼        ▼        ▼
    ┌───────┐ ┌────┐ ┌─────┐ ┌─────┐ ┌────────┐
    │ 고원  │ │혼란│ │좌절 │ │지루함│ │번아웃  │
    └───┬───┘ └──┬─┘ └──┬──┘ └──┬──┘ └───┬────┘
        │        │      │       │        │
        └────────┴──────┼───────┴────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  이탈 위험   │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐        ┌─────────┐
                 │   비활성    │◄───────│  복귀   │
                 └──────┬──────┘        └────▲────┘
                        │                    │
                        └────────────────────┘
```

#### 상태 감지 알고리즘

```typescript
interface LearnerState {
  state: 'normal' | 'plateau' | 'confusion' | 'frustration' |
         'boredom' | 'burnout' | 'churn_risk' | 'inactive' | 'returning';
  confidence: number;  // 0-1
  since: Date;
  triggers: string[];  // 감지된 신호들
}

function detectLearnerState(
  activity: RecentActivity,
  history: LearningHistory
): LearnerState {

  // 1. 비활성 체크 (최우선)
  const daysSinceLastActivity = getDaysSince(activity.lastActiveAt);
  if (daysSinceLastActivity >= 7) {
    return {
      state: 'inactive',
      confidence: 1.0,
      since: activity.lastActiveAt,
      triggers: [`${daysSinceLastActivity}일간 미접속`]
    };
  }

  // 2. 복귀 체크
  if (activity.isReturning && daysSinceLastActivity >= 7) {
    return {
      state: 'returning',
      confidence: 0.95,
      since: new Date(),
      triggers: ['7일+ 비활성 후 복귀']
    };
  }

  // 3. 번아웃 위험 체크
  if (activity.dailyHours >= 3 && activity.consecutiveDays >= 10) {
    const recentAccuracyTrend = calculateAccuracyTrend(history, 7);
    if (recentAccuracyTrend < -0.05) { // 정답률 5%+ 하락
      return {
        state: 'burnout',
        confidence: 0.85,
        since: new Date(),
        triggers: ['일 3시간+ 학습', '10일+ 연속', '정답률 하락']
      };
    }
  }

  // 4. 지루함 체크
  if (activity.recentAccuracy >= 0.95 && activity.skipRate >= 0.3) {
    return {
      state: 'boredom',
      confidence: 0.8,
      since: new Date(),
      triggers: ['정답률 95%+', '스킵 30%+']
    };
  }

  // 5. 좌절 체크
  if (activity.sameQuizFailCount >= 3 || activity.sessionLengthTrend < -0.3) {
    return {
      state: 'frustration',
      confidence: 0.85,
      since: new Date(),
      triggers: ['같은 퀴즈 3회+ 오답', '세션 길이 감소']
    };
  }

  // 6. 혼란 체크
  if (activity.backtrackRate >= 0.4 || activity.hintRequestRate >= 0.5) {
    return {
      state: 'confusion',
      confidence: 0.75,
      since: new Date(),
      triggers: ['뒤로가기 40%+', '힌트 요청 50%+']
    };
  }

  // 7. 고원 체크
  if (activity.sameLesson >= 3 && activity.accuracyVariance < 0.05) {
    return {
      state: 'plateau',
      confidence: 0.7,
      since: new Date(),
      triggers: ['같은 레슨 3일+', '정답률 변화 없음']
    };
  }

  // 8. 이탈 위험 체크
  if (activity.loginIntervalTrend > 0.5 || activity.sessionLengthTrend < -0.2) {
    return {
      state: 'churn_risk',
      confidence: 0.6,
      since: new Date(),
      triggers: ['로그인 간격 증가', '세션 길이 감소']
    };
  }

  // 9. 정상
  return {
    state: 'normal',
    confidence: 0.9,
    since: activity.lastActiveAt,
    triggers: []
  };
}
```

### 9.2 감정 상태 감지 (Affective State Detection)

> 참고: D'Mello & Graesser (2012) - AutoTutor 연구

#### 4가지 핵심 학습 감정

| 감정 | 설명 | 학습 영향 | 감지 방법 |
|------|------|----------|----------|
| **🌊 Flow (몰입)** | 완전히 집중, 시간 가는 줄 모름 | ⬆️ 긍정적 | 긴 세션, 안정적 페이스 |
| **❓ Confusion (혼란)** | 이해 안 됨, 혼란스러움 | ↔️ 중립~부정 | 반복 읽기, 뒤로가기 |
| **😤 Frustration (좌절)** | 막힘, 화남, 포기 직전 | ⬇️ 부정적 | 빠른 클릭, 오답 후 빠른 재시도 |
| **😑 Boredom (지루함)** | 흥미 없음, 무관심 | ⬇️ 부정적 | 빠른 스킵, 긴 비활성 |

#### 감정-학습 관계 (연구 기반)

```
Confusion (혼란)
    │
    ├── 해결됨 → Flow (몰입) → 학습 효과 ⬆️
    │
    └── 해결 안 됨 → Frustration (좌절) → 학습 효과 ⬇️
                         │
                         └── 지속 → Boredom (포기) → 이탈
```

**핵심 인사이트:**
- **혼란은 학습의 일부** - 적절한 혼란은 깊은 학습으로 이어짐
- **혼란 → 몰입 전환이 핵심** - 이 전환을 도와주는 게 시스템의 역할
- **좌절 → 지루함 방지** - 좌절이 지속되면 포기로 이어짐

#### 감정 상태 추정 알고리즘

```typescript
interface AffectiveState {
  primary: 'flow' | 'confusion' | 'frustration' | 'boredom';
  intensity: 'low' | 'medium' | 'high';
  confidence: number;
}

function estimateAffectiveState(
  session: CurrentSession,
  patterns: BehaviorPatterns
): AffectiveState {

  const metrics = {
    avgStepTime: session.totalTime / session.steps,
    backtrackRatio: session.backtracks / session.steps,
    hintUsage: session.hints / session.steps,
    skipRatio: session.skips / session.steps,
    errorStreak: session.consecutiveErrors,
    paceVariance: calculatePaceVariance(session.stepTimes),
  };

  // Flow 감지: 안정적 페이스, 적절한 체류 시간, 낮은 뒤로가기
  if (metrics.paceVariance < 0.3 &&
      metrics.avgStepTime >= 10 && metrics.avgStepTime <= 60 &&
      metrics.backtrackRatio < 0.1) {
    return {
      primary: 'flow',
      intensity: metrics.paceVariance < 0.15 ? 'high' : 'medium',
      confidence: 0.8
    };
  }

  // Boredom 감지: 빠른 진행, 높은 스킵, 짧은 체류
  if (metrics.avgStepTime < 5 || metrics.skipRatio > 0.3) {
    return {
      primary: 'boredom',
      intensity: metrics.skipRatio > 0.5 ? 'high' : 'medium',
      confidence: 0.75
    };
  }

  // Frustration 감지: 연속 오답, 빠른 재시도
  if (metrics.errorStreak >= 3) {
    return {
      primary: 'frustration',
      intensity: metrics.errorStreak >= 5 ? 'high' : 'medium',
      confidence: 0.85
    };
  }

  // Confusion 감지: 높은 뒤로가기, 힌트 사용, 느린 진행
  if (metrics.backtrackRatio > 0.2 || metrics.hintUsage > 0.3 ||
      metrics.avgStepTime > 90) {
    return {
      primary: 'confusion',
      intensity: metrics.backtrackRatio > 0.4 ? 'high' : 'medium',
      confidence: 0.7
    };
  }

  // 기본: 낮은 강도의 Flow
  return {
    primary: 'flow',
    intensity: 'low',
    confidence: 0.5
  };
}
```

### 9.3 학습자 유형 분류 (Learner Personas)

#### 행동 기반 페르소나

| 페르소나 | 특징 | 강점 | 약점 | 최적 지원 |
|----------|------|------|------|----------|
| **🐢 꾸준이** | 매일 조금씩, 규칙적 | 습관, 장기 기억 | 느린 진도 | 마일스톤 축하 |
| **🐆 몰아치기** | 간헐적 집중 학습 | 빠른 진도 | 망각, 번아웃 위험 | 복습 알림 강화 |
| **🔍 탐구자** | 모든 것 깊이 파악 | 깊은 이해 | 완벽주의, 느림 | "충분히 이해했어요" 확인 |
| **⚡ 속도광** | 빠르게 진행, 스킵 많음 | 효율적 | 이해 부족 | 핵심 퀴즈 강제 |
| **📚 이론가** | 설명 위주, 코드 실행 적음 | 개념 이해 | 실습 부족 | 실습 유도 |
| **💻 실습파** | 코드 먼저, 설명 나중 | 체험 학습 | 개념 누락 | 핵심 개념 하이라이트 |

#### 페르소나 분류 알고리즘

```typescript
interface LearnerPersona {
  primary: 'steady' | 'intensive' | 'explorer' | 'speedster' |
           'theorist' | 'practitioner';
  secondary?: LearnerPersona['primary'];
  traits: string[];
}

function classifyPersona(history: LearningHistory): LearnerPersona {
  const metrics = {
    // 학습 패턴
    sessionsPerWeek: history.avgSessionsPerWeek,
    avgSessionLength: history.avgSessionMinutes,
    sessionLengthVariance: calculateVariance(history.sessionLengths),

    // 진행 스타일
    skipRate: history.totalSkips / history.totalSteps,
    avgStepTime: history.totalTime / history.totalSteps,
    backtrackRate: history.totalBacktracks / history.totalSteps,

    // 학습 선호
    codeExecutionRate: history.codeExecutions / history.totalSteps,
    explanationViewRate: history.explanationViews / history.totalSteps,
  };

  // 꾸준이 vs 몰아치기
  const isStready = metrics.sessionLengthVariance < 0.3 &&
                    metrics.sessionsPerWeek >= 4;
  const isIntensive = metrics.sessionLengthVariance > 0.7 ||
                      metrics.avgSessionLength > 60;

  // 탐구자 vs 속도광
  const isExplorer = metrics.avgStepTime > 45 && metrics.backtrackRate > 0.2;
  const isSpeedster = metrics.avgStepTime < 15 && metrics.skipRate > 0.2;

  // 이론가 vs 실습파
  const isTheorist = metrics.explanationViewRate > 0.8 &&
                     metrics.codeExecutionRate < 0.3;
  const isPractitioner = metrics.codeExecutionRate > 0.7 &&
                         metrics.explanationViewRate < 0.4;

  // 주요 페르소나 결정
  let primary: LearnerPersona['primary'] = 'steady';
  if (isIntensive) primary = 'intensive';
  if (isExplorer) primary = 'explorer';
  if (isSpeedster) primary = 'speedster';
  if (isTheorist) primary = 'theorist';
  if (isPractitioner) primary = 'practitioner';

  return {
    primary,
    traits: [
      isStready ? '규칙적 학습' : '비규칙적 학습',
      isExplorer ? '꼼꼼히 학습' : isSpeedster ? '빠른 진행' : '보통 페이스',
      isTheorist ? '설명 선호' : isPractitioner ? '코드 선호' : '균형적'
    ]
  };
}
```

### 9.4 상황별 개입 전략 (Intervention Strategies)

#### 상태별 개입 메시지

| 상태 | 메시지 톤 | 예시 메시지 | 추천 액션 |
|------|----------|------------|----------|
| **정상** | 격려 | "잘 하고 있어요! 오늘 목표까지 2개 남았어요." | 다음 레슨 추천 |
| **고원** | 새 도전 제안 | "같은 개념에서 막혔나요? 다른 관점으로 접근해볼까요?" | 유사 레슨, 실습 문제 |
| **혼란** | 도움 제안 | "어려운 부분이 있나요? 힌트를 확인하거나 질문해보세요." | AI 해설자 유도, 이전 레슨 |
| **좌절** | 공감 + 격려 | "많이 힘드셨죠. 한 번 쉬고, 쉬운 문제로 자신감을 회복해볼까요?" | 쉬운 문제, 휴식 권유 |
| **지루함** | 도전 제안 | "너무 쉬운가요? 더 도전적인 개념으로 넘어가볼까요?" | 다음 챕터, 심화 문제 |
| **번아웃** | 휴식 권유 | "정말 열심히 하고 있어요! 오늘은 충분히 쉬어도 괜찮아요." | 휴식, 가벼운 복습만 |
| **이탈 위험** | 소프트 넛지 | "요즘 바쁘셨나요? 5분만 투자하면 스트릭 유지돼요!" | 가벼운 퀴즈 |
| **비활성** | 재참여 유도 | "돌아와서 반가워요! 마지막으로 배운 건 포인터였어요." | 마지막 진행 요약 |
| **복귀** | 환영 + 안내 | "다시 오셨군요! 어디서부터 이어할까요?" | 복습 or 이어서 선택 |

#### 개입 타이밍

```typescript
interface InterventionTiming {
  trigger: string;
  delay: number;  // seconds
  channel: 'in-app' | 'push' | 'email';
  frequency: 'once' | 'daily' | 'weekly';
}

const INTERVENTION_TIMINGS: Record<string, InterventionTiming> = {
  // 즉시 개입
  'frustration_high': {
    trigger: '같은 퀴즈 3회 연속 오답',
    delay: 0,
    channel: 'in-app',
    frequency: 'once'
  },

  // 세션 중 개입
  'confusion_detected': {
    trigger: '뒤로가기 3회 연속',
    delay: 10,
    channel: 'in-app',
    frequency: 'once'
  },

  // 세션 종료 시
  'burnout_warning': {
    trigger: '학습 시간 2시간 도달',
    delay: 0,
    channel: 'in-app',
    frequency: 'daily'
  },

  // 다음 날
  'churn_risk_nudge': {
    trigger: '예상 로그인 시간 + 2시간 미로그인',
    delay: 0,
    channel: 'push',
    frequency: 'daily'
  },

  // 비활성 후
  'reengagement_email': {
    trigger: '3일 미접속',
    delay: 0,
    channel: 'email',
    frequency: 'weekly'
  }
};
```

#### 개입 메시지 생성기

```typescript
function generateInterventionMessage(
  state: LearnerState,
  affect: AffectiveState,
  persona: LearnerPersona,
  context: LearningContext
): InterventionMessage {

  // 상태 기반 기본 메시지
  let baseMessage = STATE_MESSAGES[state.state];

  // 페르소나에 맞게 조정
  if (persona.primary === 'speedster' && state.state === 'confusion') {
    baseMessage = "빠르게 진행하다 보니 놓친 게 있을 수 있어요. " + baseMessage;
  }

  if (persona.primary === 'explorer' && state.state === 'plateau') {
    baseMessage = "충분히 깊이 이해하셨어요! " + baseMessage;
  }

  // 감정에 맞게 조정
  if (affect.primary === 'frustration' && affect.intensity === 'high') {
    baseMessage = "정말 힘드셨죠. " + baseMessage;
  }

  // 맥락 추가
  const contextAddition = generateContextualAddition(context);

  return {
    message: baseMessage,
    context: contextAddition,
    actions: generateRecommendedActions(state, persona),
    priority: calculatePriority(state, affect)
  };
}
```

### 9.5 특수 상황 처리

#### 9.5.1 고원 현상 (Plateau) 돌파

```typescript
interface PlateauAnalysis {
  duration: number;      // 일수
  stuckConcept: string;  // 막힌 개념
  attemptCount: number;  // 시도 횟수
  strategies: PlateauBreakthroughStrategy[];
}

type PlateauBreakthroughStrategy =
  | 'different_explanation'   // 다른 설명 방식
  | 'analogies'               // 비유/예시 추가
  | 'decompose'               // 더 작은 단위로 분해
  | 'prerequisite_review'     // 선수지식 복습
  | 'practical_application'   // 실습 문제
  | 'peer_learning'           // (향후) 다른 학습자 풀이 보기
  | 'break_and_return';       // 휴식 후 재도전

function suggestPlateauBreakthrough(analysis: PlateauAnalysis): PlateauBreakthroughStrategy[] {
  const strategies: PlateauBreakthroughStrategy[] = [];

  // 3일 이상 막혀있으면 다른 설명 방식
  if (analysis.duration >= 3) {
    strategies.push('different_explanation');
  }

  // 5회 이상 시도했으면 더 작은 단위로
  if (analysis.attemptCount >= 5) {
    strategies.push('decompose');
  }

  // 선수지식 연관 개념이 있으면 복습 제안
  if (hasPrerequisiteGap(analysis.stuckConcept)) {
    strategies.push('prerequisite_review');
  }

  // 이론형 페르소나면 실습 추천
  strategies.push('practical_application');

  return strategies;
}
```

#### 9.5.2 복귀 사용자 온보딩

```typescript
interface ReturningUserContext {
  inactiveDays: number;
  lastLesson: string;
  lastProgress: number;  // 0-100
  knowledgeDecay: number;  // 추정 망각률
}

function createReturningUserPlan(ctx: ReturningUserContext): ReturningPlan {
  // 망각률 기반 복습 범위 결정
  const reviewScope = calculateReviewScope(ctx.knowledgeDecay);

  // 복습 vs 이어서 선택지 제공
  const options = [
    {
      label: '빠르게 복습하고 이어서',
      description: `${reviewScope.lessonCount}개 핵심 퀴즈로 복습 (약 ${reviewScope.estimatedMinutes}분)`,
      action: 'quick_review'
    },
    {
      label: '처음부터 다시',
      description: '기초부터 탄탄하게',
      action: 'restart'
    },
    {
      label: '바로 이어서',
      description: `${ctx.lastLesson}부터 계속`,
      action: 'continue'
    }
  ];

  return {
    greeting: `${ctx.inactiveDays}일 만이네요! 돌아와서 반가워요.`,
    summary: generateProgressSummary(ctx),
    options,
    recommendedOption: ctx.inactiveDays > 14 ? 'quick_review' : 'continue'
  };
}
```

#### 9.5.3 번아웃 예방 시스템

```typescript
interface BurnoutRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  recommendation: string;
}

function assessBurnoutRisk(activity: RecentActivity): BurnoutRisk {
  const factors: string[] = [];
  let riskScore = 0;

  // 일일 학습 시간
  if (activity.todayMinutes >= 180) {
    factors.push('오늘 3시간+ 학습');
    riskScore += 30;
  } else if (activity.todayMinutes >= 120) {
    factors.push('오늘 2시간+ 학습');
    riskScore += 15;
  }

  // 연속 학습일
  if (activity.consecutiveDays >= 14) {
    factors.push('14일+ 연속 학습');
    riskScore += 25;
  } else if (activity.consecutiveDays >= 10) {
    factors.push('10일+ 연속 학습');
    riskScore += 15;
  }

  // 정답률 추이
  if (activity.accuracyTrend < -0.1) {
    factors.push('정답률 10%+ 하락');
    riskScore += 20;
  }

  // 세션 시간 추이 (늦은 시간 학습)
  if (activity.avgStartHour >= 23 || activity.avgStartHour <= 4) {
    factors.push('늦은 시간 학습');
    riskScore += 10;
  }

  let level: BurnoutRisk['level'] = 'low';
  let recommendation = '계속 좋은 페이스로 진행하세요!';

  if (riskScore >= 60) {
    level = 'critical';
    recommendation = '오늘은 쉬는 것이 좋겠어요. 내일 더 효율적으로 학습할 수 있어요.';
  } else if (riskScore >= 40) {
    level = 'high';
    recommendation = '열심히 하고 있어요! 오늘은 가볍게 복습만 하고 쉬어도 괜찮아요.';
  } else if (riskScore >= 20) {
    level = 'medium';
    recommendation = '꾸준히 잘 하고 있어요. 적당히 쉬어가며 하세요.';
  }

  return { level, factors, recommendation };
}
```

### 9.6 데이터 수집 포인트

#### 필요한 추가 이벤트

| 이벤트 | 데이터 | 용도 |
|--------|-------|------|
| `step_view` | stepId, duration, isBacktrack | 스텝 체류 시간, 뒤로가기 감지 |
| `hint_request` | lessonId, stepId, type | 힌트 사용 패턴 |
| `code_execute` | lessonId, code, result | 코드 실행 빈도 |
| `quiz_attempt` | quizId, answer, isCorrect, timeSpent | 퀴즈 시도 상세 |
| `skip_action` | lessonId, skippedSteps | 스킵 패턴 |
| `session_start` | timestamp, source | 세션 시작 |
| `session_end` | timestamp, duration, lessonsCompleted | 세션 종료 |
| `visualization_interact` | action (zoom/pan/expand), target | 시각화 상호작용 |

#### 집계 테이블 추가

```prisma
// 학습자 상태 히스토리
model LearnerStateHistory {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  state       String   // 'normal', 'plateau', etc.
  confidence  Float
  triggers    Json     // 감지된 신호들
  detectedAt  DateTime @default(now()) @map("detected_at") @db.Timestamptz

  user User @relation(fields: [userId], references: [id])

  @@index([userId, detectedAt])
  @@map("learner_state_history")
}

// 개입 기록
model InterventionLog {
  id            String    @id @default(uuid()) @db.Uuid
  userId        String    @map("user_id") @db.Uuid
  state         String    // 개입 시점의 상태
  interventionType String @map("intervention_type")
  message       String
  channel       String    // 'in-app', 'push', 'email'
  deliveredAt   DateTime  @default(now()) @map("delivered_at") @db.Timestamptz
  clickedAt     DateTime? @map("clicked_at") @db.Timestamptz
  resultAction  String?   @map("result_action") // 사용자가 취한 행동

  user User @relation(fields: [userId], references: [id])

  @@index([userId, deliveredAt])
  @@map("intervention_logs")
}
```

---

## 10. Phase 2+ 구현 순서 (행동 분석)

### Phase 2.1: 기본 상태 감지 (3-4일)

```
[ ] 이벤트 수집 확장 (step_view, skip_action 등)
[ ] 학습자 상태 감지 API
[ ] 상태 히스토리 저장
[ ] 기본 개입 메시지 시스템
```

### Phase 2.2: 감정 상태 추정 (2-3일)

```
[ ] 세션 내 행동 패턴 분석
[ ] 감정 상태 추정 알고리즘
[ ] 감정 기반 개입 메시지
```

### Phase 2.3: 페르소나 분류 (2일)

```
[ ] 학습 히스토리 기반 페르소나 분류
[ ] 페르소나별 맞춤 메시지
[ ] 대시보드에 페르소나 표시
```

### Phase 2.4: 특수 상황 처리 (3-4일)

```
[ ] 고원 현상 감지 및 돌파 전략
[ ] 복귀 사용자 온보딩 플로우
[ ] 번아웃 예방 시스템
[ ] 이탈 방지 재참여 시스템
```

### Phase 2.5: 개입 효과 측정 (2일)

```
[ ] A/B 테스트 프레임워크
[ ] 개입 효과 분석 대시보드
[ ] 개입 전략 자동 최적화
```

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-01-17 | 초안 작성 (이론적 배경 + 구현 순서) |
| 2026-01-17 | 학습자 행동 심층 분석 프레임워크 추가 (상태/감정/페르소나/개입) |
