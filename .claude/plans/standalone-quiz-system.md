# Standalone Quiz System 구현 계획

**목적**: 학습 리포트, 취약 개념 분석, 통계를 위한 독립 퀴즈 시스템 구축

**브랜치 관리**:
- `no-quiz`: 기존 하드코딩 퀴즈 구조 백업 (완료)
- `main`: 새 퀴즈 테이블 구조 작업 (진행 중)

---

## Phase 1: DB 스키마 설계 (완료)

### 1.1 StandaloneQuiz 테이블

```prisma
model StandaloneQuiz {
  id            String   @id                    // "ox-c-ptr-q1" 형식

  // 분류 정보
  language      String   // "c", "javascript", "java", "python"
  quizType      String   // "ox", "multiple-choice", "fill-blank"
  chapterId     String   // "c-var", "c-ptr"
  chapterTitle  String   // "변수와 자료형"

  // 문제 내용
  question      String   // 문제 원문
  options       Json?    // 객관식 선택지 (["A", "B", "C", "D"])
  answer        String   // 정답
  explanation   String   // 해설

  // 분석용 메타데이터
  concepts      String[] // 개념 태그 ["포인터", "메모리주소"]
  difficulty    String   // "easy", "medium", "hard"
  orderNum      Int      // 챕터 내 순서

  isActive      Boolean  @default(true)
  createdAt     DateTime
  updatedAt     DateTime

  attempts      StandaloneQuizAttempt[]
}
```

### 1.2 StandaloneQuizAttempt 테이블

```prisma
model StandaloneQuizAttempt {
  id            String   @id @default(uuid())
  userId        String
  quizId        String

  // 시도 데이터
  userAnswer    String   // 사용자 답변
  isCorrect     Boolean  // 정답 여부
  timeSpent     Int?     // 풀이 시간 (초)

  // 재시도 추적
  attemptNumber Int      @default(1)  // 몇 번째 시도?

  createdAt     DateTime

  user          User
  quiz          StandaloneQuiz
}
```

### 1.3 인덱스 설계

```sql
-- StandaloneQuiz
CREATE INDEX ON standalone_quizzes(language, quiz_type);
CREATE INDEX ON standalone_quizzes(language, chapter_id);
CREATE INDEX ON standalone_quizzes(language, quiz_type, chapter_id);

-- StandaloneQuizAttempt
CREATE INDEX ON standalone_quiz_attempts(user_id, created_at);
CREATE INDEX ON standalone_quiz_attempts(user_id, is_correct);
CREATE INDEX ON standalone_quiz_attempts(quiz_id);
CREATE INDEX ON standalone_quiz_attempts(user_id, quiz_id);  -- 재시도 횟수
```

---

## Phase 2: 마이그레이션 실행 (✅ 완료)

```bash
cd packages/backend
pnpm prisma migrate dev --name add_standalone_quiz_system
pnpm prisma generate
```

**실행일**: 2026-01-27

---

## Phase 3: 퀴즈 데이터 시드 (✅ 완료)

### 3.1 시드 데이터 구조

기존 하드코딩된 퀴즈를 JSON으로 변환:

```
packages/backend/prisma/content/quizzes/
├── c/
│   ├── ox/
│   │   ├── c-var.json     # 변수와 자료형
│   │   ├── c-ptr.json     # 포인터 기초
│   │   └── c-mem.json     # 동적 메모리
│   ├── multiple-choice/
│   └── fill-blank/
├── javascript/
├── java/
└── python/
```

### 3.2 시드 파일 형식 (예: `c-var.json`)

```json
{
  "language": "c",
  "quizType": "ox",
  "chapterId": "c-var",
  "chapterTitle": "변수와 자료형",
  "quizzes": [
    {
      "id": "ox-c-var-q1",
      "question": "int 자료형은 정수를 저장한다.",
      "answer": "true",
      "explanation": "int는 integer의 약자로 정수를 저장하는 자료형입니다.",
      "concepts": ["int", "자료형", "정수"],
      "difficulty": "easy",
      "orderNum": 1
    },
    {
      "id": "ox-c-var-q2",
      "question": "char 자료형은 문자열을 저장한다.",
      "answer": "false",
      "explanation": "char는 단일 문자만 저장합니다. 문자열은 char 배열을 사용합니다.",
      "concepts": ["char", "문자", "문자열"],
      "difficulty": "easy",
      "orderNum": 2
    }
  ]
}
```

### 3.3 시드 스크립트

```typescript
// packages/backend/prisma/seed-quizzes.ts
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function seedQuizzes() {
  const quizDir = path.join(__dirname, 'content/quizzes');

  // 각 언어별 디렉토리 순회
  for (const lang of ['c', 'javascript', 'java', 'python']) {
    for (const type of ['ox', 'multiple-choice', 'fill-blank']) {
      const dir = path.join(quizDir, lang, type);
      if (!fs.existsSync(dir)) continue;

      for (const file of fs.readdirSync(dir)) {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));

        for (const quiz of data.quizzes) {
          await prisma.standaloneQuiz.upsert({
            where: { id: quiz.id },
            update: quiz,
            create: {
              ...quiz,
              language: data.language,
              quizType: data.quizType,
              chapterId: data.chapterId,
              chapterTitle: data.chapterTitle,
            },
          });
        }
      }
    }
  }
}
```

---

**완료 내용**:
- C 언어 OX 퀴즈 30개 생성 (변수, 포인터, 동적메모리)
- 시드 스크립트 작성 및 실행 완료
- 개념 태그 추가 (취약 개념 분석용)

**실행일**: 2026-01-27

---

## Phase 4: 백엔드 API (✅ 완료)

### 4.1 API 엔드포인트 (구현 완료)

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| GET | `/api/v1/standalone-quizzes/chapters` | 챕터별 통계 조회 | ✅ |
| GET | `/api/v1/standalone-quizzes` | 퀴즈 목록 (필터링) | ✅ |
| POST | `/api/v1/standalone-quizzes/attempt` | 퀴즈 시도 기록 | ✅ |
| GET | `/api/v1/standalone-quizzes/weak-concepts` | 취약 개념 분석 | ✅ |

### 4.2 API 구현 파일 (완료)

```
packages/backend/src/modules/standalone-quizzes/
└── routes.ts          # 전체 API 구현 (라우터 + 로직)
```

**주요 기능**:
- 챕터별 통계 계산 (시도한 퀴즈 수, 정답률)
- 퀴즈 필터링 (언어, 타입, 챕터, 난이도)
- 시도 기록 자동 저장 (attemptNumber 자동 증가)
- 취약 개념 분석 (오답률 기반 정렬)

**실행일**: 2026-01-27

### 4.3 주요 API 상세

#### GET /api/quizzes/chapters

**Response:**
```json
{
  "chapters": [
    {
      "language": "c",
      "quizType": "ox",
      "chapterId": "c-var",
      "chapterTitle": "변수와 자료형",
      "quizCount": 10,
      "userStats": {
        "attempted": 8,
        "correct": 6,
        "accuracy": 75,
        "lastAttemptAt": "2026-01-27T15:30:00Z"
      }
    }
  ]
}
```

#### GET /api/quizzes/weak-concepts

**Response:**
```json
{
  "weakConcepts": [
    {
      "concept": "포인터",
      "total": 15,
      "correct": 6,
      "accuracy": 40,
      "relatedChapters": ["c-ptr", "c-mem"]
    },
    {
      "concept": "동적메모리",
      "total": 10,
      "correct": 5,
      "accuracy": 50,
      "relatedChapters": ["c-mem"]
    }
  ],
  "period": "30d"
}
```

#### POST /api/quizzes/attempt

**Request:**
```json
{
  "quizId": "ox-c-ptr-q1",
  "userAnswer": "true",
  "isCorrect": true,
  "timeSpent": 12
}
```

**Response:**
```json
{
  "id": "uuid",
  "attemptNumber": 2,
  "createdAt": "2026-01-27T15:30:00Z"
}
```

---

## Phase 5: 프론트엔드 (✅ 완료)

**완료 내용**:
- 서비스 레이어 작성 (`services/standalone-quiz.ts`)
- OXQuizPage API 통합 (하드코딩 데이터 제거)
- 챕터별 통계 표시 (시도 수, 정답률)
- 이전 시도 기록 표시 (배지)
- 시도 기록 자동 저장 (타이밍 포함)
- 로딩 상태 및 에러 처리

**실행일**: 2026-01-27

### 5.1 서비스 레이어 (완료)

```typescript
// packages/frontend/src/services/standalone-quiz.ts (구현 완료)
export interface StandaloneQuiz {
  id: string;
  language: string;
  quizType: string;
  chapterId: string;
  chapterTitle: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  concepts: string[];
  difficulty: string;
}

export interface ChapterInfo {
  language: string;
  quizType: string;
  chapterId: string;
  chapterTitle: string;
  quizCount: number;
  userStats?: {
    attempted: number;
    correct: number;
    accuracy: number;
    lastAttemptAt: string;
  };
}

export async function getChapters(
  language: string,
  quizType: string
): Promise<ChapterInfo[]>;

export async function getQuizzes(
  language: string,
  quizType: string,
  chapterId: string
): Promise<StandaloneQuiz[]>;

export async function recordAttempt(
  quizId: string,
  userAnswer: string,
  isCorrect: boolean,
  timeSpent?: number
): Promise<void>;

export async function getWeakConcepts(): Promise<WeakConcept[]>;
```

### 5.2 페이지 수정

#### QuizPage.tsx (퀴즈 선택)

- 언어 선택 버튼에 **이전 결과 배지** 표시
- 각 언어별 정답률, 마지막 풀이 시간 표시

```tsx
<LanguageButton>
  ⚡ JavaScript
  <Badge>80% | 2시간 전</Badge>
</LanguageButton>
```

#### OXQuizPage.tsx (퀴즈 풀이)

- 기존: 하드코딩된 데이터 사용
- 변경: API에서 퀴즈 데이터 fetch
- 퀴즈 완료 시 `recordAttempt()` 호출

```tsx
const handleAnswer = async (userAnswer: boolean) => {
  const isCorrect = userAnswer === currentQuiz.answer;

  // 백엔드에 저장
  await recordAttempt(
    currentQuiz.id,
    String(userAnswer),
    isCorrect,
    elapsedTime
  );

  // UI 업데이트
  setQuizState(isCorrect ? 'correct' : 'incorrect');
};
```

### 5.3 결과 표시 컴포넌트

```tsx
// packages/frontend/src/features/quiz/components/QuizResultBadge.tsx
interface Props {
  attempted: number;
  correct: number;
  lastAttemptAt?: string;
}

export function QuizResultBadge({ attempted, correct, lastAttemptAt }: Props) {
  if (attempted === 0) return <span className="text-gray-400">미시도</span>;

  const accuracy = Math.round((correct / attempted) * 100);
  const timeAgo = lastAttemptAt ? formatTimeAgo(lastAttemptAt) : '';

  return (
    <div className="flex items-center gap-2">
      <span className={accuracy >= 80 ? 'text-green-500' : 'text-amber-500'}>
        {accuracy}%
      </span>
      {timeAgo && <span className="text-gray-400 text-sm">{timeAgo}</span>}
    </div>
  );
}
```

---

## Phase 6: 학습 리포트 통합 (TODO)

### 6.1 리포트 페이지 확장

`ProfilePage.tsx` 또는 별도 `ReportPage.tsx`에:

- **취약 개념 섹션**: 가장 자주 틀리는 개념 Top 5
- **언어별 진도**: 각 언어의 퀴즈 완료율
- **성장 그래프**: 주차별 정답률 변화
- **재시도 효과**: 재시도 시 정답률 향상 통계

### 6.2 취약 개념 시각화

```tsx
// 막대 그래프로 표시
<WeakConceptChart concepts={weakConcepts} />

// 예시 출력:
// 포인터      ████████░░ 40%
// 동적메모리   █████████░ 50%
// 재귀함수     ██████████████░ 70%
```

---

## 구현 순서 (체크리스트)

### ✅ 완료 (2026-01-27)
- [x] DB 스키마 설계 (StandaloneQuiz, StandaloneQuizAttempt)
- [x] Prisma 마이그레이션 실행
- [x] Prisma Client 재생성
- [x] 시드 데이터 구조 설계
- [x] C언어 OX 퀴즈 30개 JSON 생성
- [x] 시드 스크립트 작성 및 실행
- [x] 백엔드 API 구현 (CRUD, 통계, 취약 개념 분석)
- [x] 프론트엔드 서비스 레이어
- [x] 퀴즈 페이지 API 연동
- [x] 결과 배지 표시 (챕터별 통계)
- [x] 이전 시도 기록 표시

### TODO (Next)
- [ ] JavaScript, Java, Python 퀴즈 데이터 추가
- [ ] 객관식, 빈칸 채우기 퀴즈 타입 추가
- [ ] 퀴즈 난이도별 필터링 UI

### 장기 (Month)
- [ ] 취약 개념 분석 고도화
- [ ] 학습 리포트 통합
- [ ] 성장 그래프 시각화

---

## 참고: 취약 개념 분석 쿼리

```sql
-- PostgreSQL: 개념별 정답률 (취약 개념 = 정답률 낮은 순)
SELECT
  concept,
  COUNT(*) as total,
  SUM(CASE WHEN sqa.is_correct THEN 1 ELSE 0 END) as correct,
  ROUND(100.0 * SUM(CASE WHEN sqa.is_correct THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy
FROM standalone_quiz_attempts sqa
JOIN standalone_quizzes sq ON sqa.quiz_id = sq.id,
     UNNEST(sq.concepts) as concept
WHERE sqa.user_id = $1
  AND sqa.created_at > NOW() - INTERVAL '30 days'
GROUP BY concept
HAVING COUNT(*) >= 3  -- 최소 3번 이상 시도한 개념만
ORDER BY accuracy ASC
LIMIT 10;
```

---

## 참고: ID 명명 규칙

```
{quizType}-{language}-{chapterId}-q{number}

예시:
- ox-c-var-q1          # C언어 OX 퀴즈, 변수 챕터, 1번 문제
- ox-c-ptr-q5          # C언어 OX 퀴즈, 포인터 챕터, 5번 문제
- mc-js-func-q3        # JS 객관식, 함수 챕터, 3번 문제
- fb-python-loop-q2    # Python 빈칸, 반복문 챕터, 2번 문제
```

**챕터 ID 규칙:**
```
{language}-{topic}

예시:
- c-var      # 변수와 자료형
- c-ptr      # 포인터 기초
- c-mem      # 동적 메모리
- js-var     # 변수와 타입
- js-func    # 함수
- java-oop   # 객체지향
- py-loop    # 반복문
```
