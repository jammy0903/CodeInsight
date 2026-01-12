# 분석 리포트 데이터 수집 구현 계획

> 작성일: 2026-01-12
> 목표: DB에 저장된 4개 모델에 실제 데이터를 수집하는 로직 구현

---

## 1. 개요

### 수집할 데이터 (4종)

| 모델 | 데이터 | 수집 시점 |
|------|--------|----------|
| `LessonActivity` | 체류 시간 | 레슨 페이지 진입/이탈 시 |
| `ChatHistory` | AI 질문 | AI에게 질문할 때마다 |
| `QuizAttempt` | 퀴즈 시도 | 퀴즈 답변 제출 시 |
| `UserNote` | 개념 노트 | "노트에 추가" 버튼 클릭 시 |

---

## 2. LessonActivity (체류 시간)

### 2.1 백엔드 API

```typescript
// POST /api/analytics/activity
// 레슨 활동 시작/종료 기록

interface CreateActivityRequest {
  lessonId: string;
  action: 'start' | 'end';
}

interface CreateActivityResponse {
  id: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
}
```

**엔드포인트:**
- `POST /api/analytics/activity` - 활동 시작/종료

**로직:**
1. `action: 'start'` → 새 LessonActivity 레코드 생성, ID 반환
2. `action: 'end'` → 기존 레코드 업데이트 (endedAt, duration 계산)

### 2.2 프론트엔드

**파일:** `services/analytics.ts` (신규)

```typescript
export async function startLessonActivity(lessonId: string): Promise<string>;
export async function endLessonActivity(activityId: string): Promise<void>;
```

**수집 로직 (LessonPage.tsx):**
```typescript
useEffect(() => {
  let activityId: string | null = null;

  // 페이지 진입 시 시작
  startLessonActivity(lessonId).then(id => activityId = id);

  // 페이지 이탈 시 종료
  const handleUnload = () => {
    if (activityId) {
      navigator.sendBeacon('/api/analytics/activity/end', JSON.stringify({ activityId }));
    }
  };

  window.addEventListener('beforeunload', handleUnload);
  return () => {
    handleUnload();
    window.removeEventListener('beforeunload', handleUnload);
  };
}, [lessonId]);
```

**고려사항:**
- `navigator.sendBeacon()` 사용 (페이지 닫힘에도 전송 보장)
- 비정상 종료 대비: 5분 이상 미종료 시 자동 종료 처리 (백엔드 cron)

---

## 3. ChatHistory (AI 질문)

### 3.1 백엔드 API

**기존 `/api/ai/chat` 수정:**

```typescript
// POST /api/ai/chat
interface ChatRequest {
  message: string;
  lessonId?: string;  // 추가
  context?: 'lesson' | 'playground' | 'general';  // 추가
}

interface ChatResponse {
  response: string;
  tokens?: number;  // 추가 (AI 토큰 사용량)
}
```

**로직:**
1. AI 응답 생성
2. ChatHistory 레코드 자동 저장 (question, answer, lessonId, context, tokens)

### 3.2 프론트엔드

**기존 `services/ai.ts` 수정:**

```typescript
export async function chat(
  message: string,
  options?: { lessonId?: string; context?: string }
): Promise<ChatResponse>;
```

**수집 로직:**
- 기존 채팅 API 호출에 `lessonId`, `context` 추가 전달
- 백엔드에서 자동 저장하므로 프론트 추가 작업 없음

---

## 4. QuizAttempt (퀴즈 시도)

### 4.1 백엔드 API

```typescript
// POST /api/analytics/quiz-attempt
interface CreateQuizAttemptRequest {
  quizId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;  // 문제 풀이 시간 (초)
}

interface CreateQuizAttemptResponse {
  id: string;
  createdAt: string;
}
```

### 4.2 프론트엔드

**파일:** `services/analytics.ts`

```typescript
export async function recordQuizAttempt(data: {
  quizId: string;
  userAnswer: string;
  isCorrect: boolean;
  timeSpent?: number;
}): Promise<void>;
```

**수집 로직 (QuizCard.tsx 또는 LessonPage.tsx):**

```typescript
const handleAnswerSubmit = async (selectedAnswer: string) => {
  const isCorrect = selectedAnswer === quiz.answer;

  // 기존 로직...

  // 시도 기록 저장
  await recordQuizAttempt({
    quizId: quiz.id,
    userAnswer: selectedAnswer,
    isCorrect,
    timeSpent: elapsedTime,
  });
};
```

**시간 측정:**
```typescript
const [startTime, setStartTime] = useState<number>(Date.now());

// 퀴즈 시작 시
useEffect(() => setStartTime(Date.now()), [quiz.id]);

// 제출 시
const timeSpent = Math.floor((Date.now() - startTime) / 1000);
```

---

## 5. UserNote (개념 노트)

### 5.1 백엔드 API

```typescript
// POST /api/notes
interface CreateNoteRequest {
  lessonId: string;
  quizId?: string;
  concept: string;
  content: string;
  source: 'quiz' | 'lesson' | 'manual';
  isFromWrong?: boolean;
}

// GET /api/notes
interface GetNotesResponse {
  notes: UserNote[];
  total: number;
}

// DELETE /api/notes/:id
```

### 5.2 프론트엔드

**파일:** `services/notes.ts` (신규)

```typescript
export async function createNote(data: CreateNoteRequest): Promise<UserNote>;
export async function getNotes(params?: { lessonId?: string; concept?: string }): Promise<UserNote[]>;
export async function deleteNote(noteId: string): Promise<void>;
```

**UI 컴포넌트:** `components/AddToNoteButton.tsx` (신규)

```tsx
interface AddToNoteButtonProps {
  lessonId: string;
  quizId?: string;
  concept: string;
  defaultContent?: string;
  isFromWrong?: boolean;
}

export function AddToNoteButton({ ... }: AddToNoteButtonProps) {
  // 클릭 시 노트 추가 모달 or 바로 저장
}
```

**사용 위치:**
- `QuizCard.tsx` - 퀴즈 위에 "내 노트에 추가" 버튼
- 오답 시 자동으로 `isFromWrong: true`

---

## 6. 구현 순서

### Phase 1: 백엔드 API (우선)

1. [ ] `modules/analytics/routes.ts` 생성
2. [ ] `POST /api/analytics/activity` - 체류 시간
3. [ ] `POST /api/analytics/quiz-attempt` - 퀴즈 시도
4. [ ] `modules/notes/routes.ts` 생성
5. [ ] `POST /api/notes` - 노트 CRUD
6. [ ] `/api/ai/chat` 수정 - ChatHistory 자동 저장

### Phase 2: 프론트엔드 서비스

1. [ ] `services/analytics.ts` 생성
2. [ ] `services/notes.ts` 생성
3. [ ] 기존 `services/ai.ts` 수정

### Phase 3: 데이터 수집 연동

1. [ ] `LessonPage.tsx` - 체류 시간 수집
2. [ ] `QuizCard.tsx` - 퀴즈 시도 + 시간 측정
3. [ ] `AddToNoteButton.tsx` 컴포넌트 생성
4. [ ] `ChatQA.tsx` - context 전달

### Phase 4: 분석 리포트 실제 연동

1. [ ] `GET /api/analytics/summary` - 분석 데이터 조회 API
2. [ ] `AnalyticsSection.tsx` - 실제 데이터로 교체
3. [ ] AI 분석 API 연동

---

## 7. 파일 구조 (예상)

```
backend/src/modules/
├── analytics/
│   ├── routes.ts        # /api/analytics/*
│   ├── handlers/
│   │   ├── activity.ts  # 체류 시간
│   │   └── quiz.ts      # 퀴즈 시도
│   └── types.ts
├── notes/
│   ├── routes.ts        # /api/notes/*
│   └── handlers/
│       └── crud.ts
└── ai/
    └── routes.ts        # ChatHistory 저장 추가

frontend/src/
├── services/
│   ├── analytics.ts     # 신규
│   └── notes.ts         # 신규
├── components/
│   └── AddToNoteButton.tsx  # 신규
└── features/
    └── notes/           # 신규 (내 노트 페이지)
        ├── NotesPage.tsx
        └── index.ts
```

---

## 8. 예상 소요 시간

| 단계 | 예상 시간 |
|------|----------|
| Phase 1 (백엔드) | 2-3시간 |
| Phase 2 (서비스) | 1시간 |
| Phase 3 (연동) | 2-3시간 |
| Phase 4 (분석) | 1-2시간 |
| **총합** | **6-9시간** |

---

## 9. 주의사항

1. **인증 필수**: 모든 API는 로그인 사용자만 접근 가능
2. **Rate Limiting**: 체류 시간 API 남용 방지
3. **데이터 정리**: 오래된 데이터 자동 삭제 cron job 필요
4. **에러 처리**: 데이터 수집 실패해도 사용자 경험에 영향 없어야 함
