# Mega Report API 계획서

> **상태**: 📋 **계획 중** (2026-01-27)
>
> AI 기반 학습 분석 보고서 API 확장 계획

---

## 🎯 Goal

사용자의 학습 데이터(코드 실행, AI 질문, 진도 등)를 종합 분석하여 **개인화된 학습 인사이트 보고서**를 생성하는 올인원 API 구축

---

## 📚 연구 기반 (Academic Foundation)

| 출처 | 핵심 개념 |
|------|----------|
| EDM 2024 | Help-seeking behavior classification |
| ACM ICER 2024 | Misconception detection in programming |
| LAK 2024 | Learning analytics dashboards |
| CHI 2023 | Dialogue-based tutoring systems |

---

## 📈 Current State

### 기존 구조
```
packages/backend/src/modules/ai/
├── routes.ts           # /api/v1/ai/chat, /api/v1/ai/analyze-report (기본)
├── providers/
│   ├── ollama.provider.ts
│   └── deepseek.provider.ts
└── service.ts
```

### 기존 데이터 모델 (Prisma)
```prisma
model ChatHistory {
  id        String   @id @default(uuid())
  userId    String
  lessonId  String?
  context   String?  // "lesson", "playground", "general"
  question  String
  answer    String
  tokens    Int?
  createdAt DateTime @default(now())
}

model UserProgress {
  id              String   @id @default(uuid())
  userId          String
  lessonId        String
  completedAt     DateTime?
  codeSnapshots   Json?    // 코드 실행 히스토리
}
```

---

## 🏗️ 아키텍처 설계

### 핵심 원칙
1. **Service Layer 분리**: 단일 거대 함수 금지
2. **Data Limit**: 메모리 과부하 방지
3. **Caching**: 반복 계산 최소화
4. **Error Isolation**: 부분 실패 허용

### 제안 구조
```
packages/backend/src/modules/ai/
├── routes.ts
├── service.ts
├── providers/
└── report/                      # 🆕 보고서 전용 모듈
    ├── index.ts                 # 메인 진입점
    ├── collectors/              # 데이터 수집기
    │   ├── chat-history.collector.ts
    │   ├── progress.collector.ts
    │   └── code-execution.collector.ts
    ├── analyzers/               # 분석 엔진
    │   ├── help-seeking.analyzer.ts
    │   ├── misconception.analyzer.ts
    │   ├── learning-style.analyzer.ts
    │   └── dialogue.analyzer.ts
    ├── prompt-builder.ts        # AI 프롬프트 생성
    └── types.ts                 # 타입 정의
```

---

## 📊 분석 기능 명세

### 1. Help-Seeking Behavior (도움 요청 패턴)

**분류 기준:**
| 유형 | 키워드 패턴 | 의미 |
|------|------------|------|
| `conceptual` | "뭐야", "왜", "어떻게 동작" | 개념 이해 부족 |
| `procedural` | "어떻게 써", "사용법", "방법" | 사용법 질문 |
| `debugging` | "에러", "안돼", "왜 안", "오류" | 디버깅 도움 요청 |
| `validation` | "맞아?", "이렇게 해도", "확인" | 정답 확인 |

**출력 예시:**
```json
{
  "helpSeekingPattern": {
    "dominant": "debugging",
    "distribution": {
      "conceptual": 20,
      "procedural": 15,
      "debugging": 45,
      "validation": 20
    },
    "insight": "디버깅 관련 질문이 많아요. 에러 메시지 읽는 법을 연습해보세요!"
  }
}
```

### 2. Misconception Detection (오개념 탐지)

**탐지 방법:**
- 동일 토픽 반복 질문 (3회 이상)
- 틀린 가정이 포함된 질문
- 연관 키워드 클러스터링

**출력 예시:**
```json
{
  "misconceptions": [
    {
      "topic": "포인터",
      "frequency": 5,
      "relatedQuestions": ["포인터가 뭐야?", "*ptr이 뭐야?", "포인터 왜 써?"],
      "suggestion": "포인터는 메모리 주소를 저장해요. 시각화로 다시 학습해보세요!"
    }
  ]
}
```

### 3. Learning Style Classification (학습 스타일)

**분류:**
| 스타일 | 특징 |
|--------|------|
| `visual` | 시각화 많이 사용, 그림 요청 |
| `sequential` | 순서대로 진행, 단계별 질문 |
| `global` | 전체 그림 먼저, "왜 필요해?" 질문 |
| `active` | 바로 실행, 짧은 질문 |

### 4. Dialogue Sequence Analysis (대화 흐름)

**분석 항목:**
- 질문 간 시간 간격
- 질문 깊이 변화 (표면적 → 심층)
- 대화 종료 패턴 (이해 완료 vs 포기)

---

## 🔄 API 설계

### Endpoint
```
POST /api/v1/ai/analyze-report
```

### Request
```typescript
interface AnalyzeReportRequest {
  userId: string;
  options?: {
    timeRange?: 'week' | 'month' | 'all';  // 기본: month
    includeCodeAnalysis?: boolean;          // 기본: true
    maxHistoryItems?: number;               // 기본: 100
  };
}
```

### Response
```typescript
interface MegaReportResponse {
  summary: {
    totalQuestions: number;
    totalLessonsCompleted: number;
    studyDays: number;
    avgQuestionsPerDay: number;
  };

  helpSeeking: {
    dominant: HelpSeekingType;
    distribution: Record<HelpSeekingType, number>;
    trend: 'improving' | 'stable' | 'needs_attention';
  };

  misconceptions: Array<{
    topic: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
  }>;

  learningStyle: {
    primary: LearningStyleType;
    secondary: LearningStyleType | null;
    confidence: number;
  };

  codePatterns?: {
    preferredLanguage: string;
    avgExecutionsPerLesson: number;
    commonErrors: string[];
  };

  aiInsight: string;  // AI가 생성한 종합 인사이트 (3-5문장)

  recommendations: string[];  // 3-5개 추천 액션

  metadata: {
    generatedAt: string;
    dataRange: { from: string; to: string };
    processingTimeMs: number;
  };
}
```

---

## 🚀 구현 Phase

### Phase 1: 데이터 수집 레이어 (Data Collectors)

**파일:** `report/collectors/chat-history.collector.ts`
```typescript
export async function collectChatHistory(
  userId: string,
  options: { limit: number; from?: Date; to?: Date }
): Promise<ChatHistoryData[]> {
  return prisma.chatHistory.findMany({
    where: {
      userId,
      createdAt: {
        gte: options.from,
        lte: options.to,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit,  // 메모리 보호
  });
}
```

**성능 고려사항:**
- `take` 제한으로 대량 데이터 방지
- 인덱스 활용: `@@index([userId, createdAt])`
- 필요한 필드만 select

### Phase 2: 분석 엔진 (Analyzers)

**파일:** `report/analyzers/help-seeking.analyzer.ts`
```typescript
const PATTERNS: Record<HelpSeekingType, RegExp[]> = {
  conceptual: [/뭐야/i, /왜/i, /어떻게.*동작/i, /원리/i],
  procedural: [/어떻게.*써/i, /사용법/i, /방법/i, /쓰는.*법/i],
  debugging: [/에러/i, /안돼/i, /오류/i, /왜.*안/i, /실패/i],
  validation: [/맞아/i, /이렇게.*해도/i, /확인/i, /괜찮/i],
};

export function analyzeHelpSeeking(
  questions: string[]
): HelpSeekingAnalysis {
  const counts = { conceptual: 0, procedural: 0, debugging: 0, validation: 0 };

  for (const q of questions) {
    for (const [type, patterns] of Object.entries(PATTERNS)) {
      if (patterns.some(p => p.test(q))) {
        counts[type as HelpSeekingType]++;
        break;  // 하나의 분류만
      }
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const dominant = Object.entries(counts)
    .sort(([,a], [,b]) => b - a)[0][0] as HelpSeekingType;

  return {
    dominant,
    distribution: counts,
    percentage: Object.fromEntries(
      Object.entries(counts).map(([k, v]) => [k, total ? Math.round(v / total * 100) : 0])
    ),
  };
}
```

### Phase 3: 프롬프트 빌더 (Prompt Builder)

**파일:** `report/prompt-builder.ts`
```typescript
export function buildReportPrompt(data: CollectedData): string {
  return `당신은 프로그래밍 학습 분석 전문가입니다.

## 학습자 데이터 요약
- 총 질문 수: ${data.totalQuestions}개
- 완료 레슨: ${data.completedLessons}개
- 주요 질문 패턴: ${data.helpSeeking.dominant}
- 반복 질문 토픽: ${data.misconceptions.map(m => m.topic).join(', ')}

## 최근 질문 샘플 (최대 10개)
${data.recentQuestions.slice(0, 10).map((q, i) => `${i+1}. ${q}`).join('\n')}

## 요청사항
위 데이터를 바탕으로:
1. 학습자의 강점 1가지
2. 개선이 필요한 부분 1가지
3. 구체적인 학습 추천 2가지

**한국어로, 친근한 말투로, 총 5문장 이내로 작성해주세요.**`;
}
```

### Phase 4: 메인 서비스 통합

**파일:** `report/index.ts`
```typescript
export async function generateMegaReport(
  userId: string,
  options: ReportOptions = {}
): Promise<MegaReportResponse> {
  const startTime = Date.now();
  const { timeRange = 'month', maxHistoryItems = 100 } = options;

  // 날짜 범위 계산
  const dateRange = calculateDateRange(timeRange);

  // 1. 데이터 수집 (병렬 실행)
  const [chatHistory, progress, codeExecutions] = await Promise.allSettled([
    collectChatHistory(userId, { limit: maxHistoryItems, ...dateRange }),
    collectProgress(userId, dateRange),
    collectCodeExecutions(userId, { limit: 50, ...dateRange }),
  ]);

  // 2. 실패한 수집 처리 (부분 실패 허용)
  const safeHistory = chatHistory.status === 'fulfilled' ? chatHistory.value : [];
  const safeProgress = progress.status === 'fulfilled' ? progress.value : [];

  // 3. 분석 실행
  const questions = safeHistory.map(h => h.question);
  const helpSeeking = analyzeHelpSeeking(questions);
  const misconceptions = detectMisconceptions(questions);
  const learningStyle = classifyLearningStyle(safeHistory, safeProgress);

  // 4. AI 인사이트 생성
  const prompt = buildReportPrompt({
    totalQuestions: questions.length,
    completedLessons: safeProgress.filter(p => p.completedAt).length,
    helpSeeking,
    misconceptions,
    recentQuestions: questions.slice(0, 10),
  });

  const aiResponse = await aiService.chat({ message: prompt });

  // 5. 응답 조합
  return {
    summary: {
      totalQuestions: questions.length,
      totalLessonsCompleted: safeProgress.filter(p => p.completedAt).length,
      studyDays: calculateStudyDays(safeHistory),
      avgQuestionsPerDay: calculateAvgPerDay(safeHistory),
    },
    helpSeeking,
    misconceptions,
    learningStyle,
    aiInsight: aiResponse.content,
    recommendations: generateRecommendations(helpSeeking, misconceptions),
    metadata: {
      generatedAt: new Date().toISOString(),
      dataRange: dateRange,
      processingTimeMs: Date.now() - startTime,
    },
  };
}
```

### Phase 5: 라우트 연결

**파일:** `routes.ts` (기존 파일 수정)
```typescript
// 기존 import에 추가
import { generateMegaReport } from './report';

// 기존 /analyze-report 확장
router.post('/analyze-report', async (req, res) => {
  const { userId, options } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    const report = await generateMegaReport(userId, options);
    res.json(report);
  } catch (error) {
    console.error('[MegaReport Error]', error);
    res.status(500).json({ error: 'Report generation failed' });
  }
});
```

---

## ⚡ 성능 최적화 전략

### 1. 데이터 제한
| 항목 | 제한 | 이유 |
|------|------|------|
| ChatHistory | 100건 | 메모리 보호, 최근 데이터 중심 |
| CodeExecutions | 50건 | 분석 정확도와 성능 균형 |
| 시간 범위 | 최대 3개월 | 데이터 신선도 유지 |

### 2. 병렬 처리
```typescript
// ✅ Good: 병렬 수집
const [a, b, c] = await Promise.allSettled([
  collectChatHistory(...),
  collectProgress(...),
  collectCodeExecutions(...),
]);

// ❌ Bad: 순차 수집
const a = await collectChatHistory(...);
const b = await collectProgress(...);
const c = await collectCodeExecutions(...);
```

### 3. 캐싱 전략 (추후)
```typescript
// Redis 또는 메모리 캐시
const cacheKey = `report:${userId}:${timeRange}`;
const cached = await cache.get(cacheKey);
if (cached) return cached;

const report = await generateMegaReport(...);
await cache.set(cacheKey, report, { ttl: 3600 }); // 1시간
```

---

## 🔒 에러 처리 전략

### Promise.allSettled 활용
```typescript
// 부분 실패 허용
const results = await Promise.allSettled([task1, task2, task3]);

results.forEach((result, i) => {
  if (result.status === 'rejected') {
    console.warn(`Task ${i} failed:`, result.reason);
  }
});
```

### Graceful Degradation
```typescript
// AI 호출 실패 시 기본 메시지
let aiInsight = '분석 데이터가 부족합니다.';
try {
  aiInsight = (await aiService.chat({ message: prompt })).content;
} catch (e) {
  console.warn('AI insight generation failed:', e);
}
```

---

## 📋 구현 체크리스트

### Phase 1: 기초 구조 (Day 1)
- [ ] `report/` 디렉토리 생성
- [ ] `types.ts` 타입 정의
- [ ] `collectors/` 데이터 수집기 구현

### Phase 2: 분석 로직 (Day 2)
- [ ] `help-seeking.analyzer.ts`
- [ ] `misconception.analyzer.ts`
- [ ] `learning-style.analyzer.ts`

### Phase 3: 통합 (Day 3)
- [ ] `prompt-builder.ts`
- [ ] `index.ts` 메인 서비스
- [ ] `routes.ts` 연결

### Phase 4: 검증 (Day 4)
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 성능 벤치마크 (100명 동시 요청)

---

## ⚠️ 주의사항 (Critical Review)

### 성능 리스크
1. **대량 사용자**: 1000명 이상 동시 요청 시 DB 부하
   - 해결: Connection pooling, 요청 큐잉

2. **AI 병목**: Ollama 응답 시간 5-10초
   - 해결: 백그라운드 생성, 캐싱

### 유지보수 리스크
1. **분류 로직 하드코딩**: 패턴 변경 시 코드 수정 필요
   - 해결: 설정 파일 분리 (JSON/YAML)

2. **다국어 확장**: 현재 한국어만 지원
   - 해결: i18n 패턴 적용

### 확장성 리스크
1. **새 분석 유형 추가**: Analyzer 인터페이스 필요
   - 해결: Strategy 패턴 적용

---

## 📚 참고 문서

- `C-OSINE/.claude/context/backend_arch.md`
- `packages/backend/prisma/schema.prisma`
- `packages/backend/src/modules/ai/routes.ts`
