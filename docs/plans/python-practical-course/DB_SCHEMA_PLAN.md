# Python 실무 코스 - DB 스키마 추가 계획

> **작성일**: 2026-01-15
> **목적**: Python 실무 코스를 기존 DB 구조에 추가하는 방법 정의

---

## 📊 현재 DB 구조 분석

### 코어 테이블

```
Language (언어)
  ↓
Chapter (챕터)
  ↓
Lesson (레슨)
  ↓
LessonContent (콘텐츠)
Quiz (퀴즈)
```

### Language 테이블

```prisma
model Language {
  id          String    @id              // "c", "python", "java", "javascript"
  name        String                     // "C", "Python", "Java", "JavaScript"
  description String?
  icon        String?                    // "C", "🐍", "☕", "⚡"
  color       String?                    // "#00599C", "#3776AB"
  isActive    Boolean   @default(true)
  order       Int                        // 표시 순서
  chapters    Chapter[]
}
```

### Chapter 테이블

```prisma
model Chapter {
  id          String   @id              // "c-1", "py-1"
  languageId  String                    // "c", "python"
  title       String
  description String?
  keyQuestion String?
  part        String   @default("syntax")  // "syntax" | "design"
  partLabel   String?
  order       Int
  lessons     Lesson[]
}
```

### Lesson 테이블

```prisma
model Lesson {
  id            String         @id          // "c-1-1", "py-1-1"
  chapterId     String
  title         String
  description   String?
  difficulty    String         @default("basic")  // "basic" | "intermediate" | "advanced"
  order         Int
  estimatedTime Int?
  content       LessonContent?
  quizzes       Quiz[]
}
```

### LessonContent 테이블

```prisma
model LessonContent {
  id        String   @id
  lessonId  String   @unique
  code      String                       // 전체 코드
  language  String                       // "c" | "python"
  steps     Json                         // 단계별 실행 (JSON)
}
```

**steps JSON 구조 (현재 C 코스)**:
```json
[
  {
    "line": 1,
    "title": "Step 1: 변수 선언",
    "explanation": "...",
    "memoryChanges": [...]  // C 코스 전용
  }
]
```

---

## 🎯 추가 방안 (3가지 옵션)

### ✅ 옵션 1: 새 Language 추가 (추천!)

**장점**:
- 기존 구조 그대로 사용
- 코스 선택 페이지에서 분리되어 표시
- 확장성 좋음 (다른 실무 코스 추가 시)
- 스키마 변경 불필요

**단점**:
- Language 목록이 늘어남

#### 구현 방법

```sql
-- 1. Language 추가
INSERT INTO languages (id, name, description, icon, color, "order")
VALUES (
  'python-practical',
  'Python (업무 자동화)',
  '급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화',
  '🚀',
  '#3776AB',
  5
);

-- 2. Chapter 추가
INSERT INTO chapters (id, language_id, title, description, part, "order")
VALUES
  ('py-practical-1', 'python-practical', 'Python 기초', '빠르게 시작하기', 'basics', 1),
  ('py-practical-2', 'python-practical', '엑셀 자동화', 'pandas & openpyxl', 'documents', 2),
  ('py-practical-3', 'python-practical', 'PDF 자동화', 'PyPDF2 & reportlab', 'documents', 3),
  ...

-- 3. Lesson 추가
INSERT INTO lessons (id, chapter_id, title, description, difficulty, "order", estimated_time)
VALUES
  ('py-practical-1-1', 'py-practical-1', '변수와 데이터 타입', '...', 'basic', 1, 30),
  ('py-practical-1-2', 'py-practical-1', '반복문과 조건문', '...', 'basic', 2, 30),
  ...

-- 4. LessonContent 추가
INSERT INTO lesson_contents (id, lesson_id, code, language, steps)
VALUES (
  'content-py-practical-1-1',
  'py-practical-1-1',
  'import pandas as pd\ndf = pd.read_excel("sales.xlsx")',
  'python',
  '[...]'::jsonb  -- PythonStep JSON
);
```

#### 폴더 구조

```
packages/backend/prisma/content/
├── c/
├── java/
├── javascript/
├── python/                    ← 기존 (기초 코스)
└── python-practical/          ← 새로 추가 (실무 코스)
    ├── curriculum.json
    └── lessons/
        ├── py-practical-1-1.json
        ├── py-practical-1-2.json
        └── ...
```

#### seed.ts 수정

```typescript
// seed.ts에 추가
await prisma.language.create({
  data: {
    id: 'python-practical',
    name: 'Python (업무 자동화)',
    description: '급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화',
    icon: '🚀',
    color: '#FFA500',  // 주황색으로 구분
    order: 5,
  },
});

// 커리큘럼 로드
const practicalCurriculum = loadCurriculum('python-practical');
// ... (기존 로직과 동일)
```

---

### 옵션 2: Chapter.part로 구분

**장점**:
- 같은 "Python" 언어 내에서 구분
- Language 목록 늘어나지 않음

**단점**:
- 코스 선택 페이지에서 혼재됨
- part 값이 불명확 ("syntax", "design", "practical"?)
- URL이 같아서 혼동 (`/courses/python/...`)

#### 구현 방법

```sql
-- Chapter.part를 "practical"로 설정
INSERT INTO chapters (id, language_id, title, part, "order")
VALUES
  ('py-practical-1', 'python', 'Python 기초', 'practical', 100),
  ('py-practical-2', 'python', '엑셀 자동화', 'practical', 101),
  ...
```

**문제점**:
- `/courses/python` 페이지에 기초 + 실무 챕터가 모두 표시됨
- 사용자가 혼란스러울 수 있음

---

### 옵션 3: 새 테이블 생성 (비추천)

**장점**:
- 완전히 분리된 구조

**단점**:
- 테이블 중복 (PracticalLesson, PracticalChapter...)
- 코드 중복 (API, 서비스, 프론트엔드)
- 유지보수 어려움

#### 예시 스키마 (참고만)

```prisma
model PracticalLanguage {
  id          String            @id
  name        String
  baseLanguageId String?        // "python" 참조 (선택)
  chapters    PracticalChapter[]
}

model PracticalChapter {
  id         String            @id
  languageId String
  lessons    PracticalLesson[]
}

model PracticalLesson {
  id        String   @id
  chapterId String
  // ... (Lesson과 동일한 필드)
}
```

**결론**: 불필요한 복잡도 증가. **비추천**.

---

## ✅ 최종 추천: 옵션 1

### 이유

1. **기존 구조 재사용** - 스키마 변경 불필요
2. **명확한 분리** - "Python (기초)" vs "Python (업무 자동화)"
3. **URL 구조** - `/courses/python` vs `/courses/python-practical`
4. **확장 가능** - Java 실무, JavaScript 실무 등 추가 용이
5. **구현 간단** - seed 데이터만 추가하면 끝

### 코스 선택 화면 예시

```
┌─────────────────────────────────────┐
│  어떤 언어를 배우고 싶나요?          │
├─────────────────────────────────────┤
│  [C]        시스템 프로그래밍        │
│  [🐍]       Python (기초)           │
│  [🚀]       Python (업무 자동화) ← NEW! │
│  [☕]       Java                    │
│  [⚡]       JavaScript              │
└─────────────────────────────────────┘
```

---

## 📝 LessonContent.steps JSON 구조

### C 코스 (기존)

```json
{
  "steps": [
    {
      "line": 3,
      "title": "Step 1: 변수 선언",
      "explanation": "int x = 10; 코드가 실행됩니다.",
      "memoryChanges": [
        {
          "action": "allocate",
          "type": "int",
          "name": "x",
          "value": 10,
          "address": "0x1000"
        }
      ]
    }
  ]
}
```

### Python 실무 코스 (신규)

```json
{
  "steps": [
    {
      "line": 3,
      "title": "Step 2: Excel 파일 읽기",
      "explanation": "pd.read_excel() 함수로 Excel 파일을 DataFrame으로 불러옵니다.",
      "tip": "파일 경로는 상대 경로를 사용할 수 있습니다.",
      "flowIcon": "📁",
      "flowLabel": "Excel 읽기",
      "flowDetail": "sales.xlsx",
      "dataframe": {
        "data": [
          ["홍길동", "개발", 5000000],
          ["김철수", "영업", 4500000],
          ["이영희", "개발", 5500000]
        ],
        "columns": ["이름", "부서", "급여"],
        "shape": [3, 3]
      },
      "changes": [
        "Excel 파일이 DataFrame으로 로드되었습니다",
        "3개의 행, 3개의 열"
      ]
    }
  ]
}
```

**차이점**:
- C 코스: `memoryChanges` (메모리 시각화)
- Python 실무: `dataframe`, `changes`, `flowIcon` (데이터 플로우)

---

## 🔧 구현 단계

### Phase 1: 데이터베이스 준비

1. **폴더 생성**
   ```bash
   mkdir -p packages/backend/prisma/content/python-practical/lessons
   ```

2. **curriculum.json 작성**
   ```json
   {
     "language": {
       "id": "python-practical",
       "name": "Python (업무 자동화)",
       "description": "급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화",
       "icon": "🚀",
       "color": "#FFA500"
     },
     "chapters": [...]
   }
   ```

3. **레슨 JSON 작성**
   - `py-practical-1-1.json` (변수와 데이터 타입)
   - `py-practical-1-2.json` (반복문과 조건문)
   - ...

4. **seed.ts 수정**
   ```typescript
   // Python 실무 코스 로드 추가
   const practicalCurriculum = loadCurriculum('python-practical');
   if (practicalCurriculum) {
     // 챕터 & 레슨 생성
   }
   ```

5. **seed 실행**
   ```bash
   cd packages/backend
   npx prisma db seed
   ```

---

### Phase 2: 프론트엔드 대응

#### 타입 확장

```typescript
// types/python-lesson.ts (신규)
export interface PythonStep {
  line: number;
  title: string;
  explanation: string;
  tip?: string;
  warning?: string;
  flowIcon?: string;
  flowLabel?: string;
  flowDetail?: string;
  dataframe?: {
    data: any[][];
    columns: string[];
    shape: [number, number];
  };
  changes?: string[];
}
```

#### 코스 타입 감지

```typescript
// features/courses/LessonPage.tsx
export function LessonPage() {
  const { lang, chapterId, lessonId } = useParams();

  // 언어별 렌더러 선택
  if (lang === 'python-practical') {
    return <PythonPracticalLessonPage />;
  } else if (lang === 'c') {
    return <CLessonPage />;
  }
  // ...
}
```

또는 **lesson.content.language 기반**:

```typescript
const lesson = await fetchLesson(lessonId);

if (lesson.content?.language === 'python' && lessonId.startsWith('py-practical-')) {
  return <PythonPracticalLessonPage lesson={lesson} />;
}
```

---

### Phase 3: 라우팅

```typescript
// App.tsx
<Route path="/courses/python-practical/:chapterId/:lessonId" element={<PythonPracticalLessonPage />} />
```

URL 예시:
- `/courses/python-practical` - 챕터 목록
- `/courses/python-practical/py-practical-2` - 레슨 목록
- `/courses/python-practical/py-practical-2/py-practical-2-1` - 레슨 학습

---

## 📊 데이터 흐름

```
1. Seed Script
   ↓
2. PostgreSQL
   ├── languages (python-practical)
   ├── chapters (py-practical-1, py-practical-2, ...)
   ├── lessons (py-practical-1-1, py-practical-1-2, ...)
   └── lesson_contents (steps JSON)
   ↓
3. API (/api/courses/python-practical/chapters)
   ↓
4. Frontend
   ├── CoursesPage (언어 선택)
   ├── ChaptersPage (챕터 목록)
   ├── LessonsPage (레슨 목록)
   └── PythonPracticalLessonPage (레슨 학습)
```

---

## ✅ 체크리스트

### 데이터베이스
- [ ] `python-practical` 폴더 생성
- [ ] `curriculum.json` 작성
- [ ] 레슨 JSON 작성 (14개)
- [ ] `seed.ts` 수정
- [ ] seed 실행 및 확인

### 백엔드
- [ ] API 테스트 (`/api/courses/python-practical/chapters`)
- [ ] LessonContent steps JSON 파싱 확인

### 프론트엔드
- [ ] `PythonStep` 타입 정의
- [ ] `PythonPracticalLessonPage` 컴포넌트
- [ ] `DataFrameTable` 컴포넌트
- [ ] `DataFlowDiagram` 컴포넌트
- [ ] 라우팅 추가
- [ ] 반응형 테스트

---

## 🚀 다음 단계

1. **curriculum.json 작성** (챕터/레슨 구조)
2. **샘플 레슨 1개 작성** (py-practical-2-1.json)
3. **seed 실행 테스트**
4. **프론트엔드 컴포넌트 구현**

---

**최종 결론**: **옵션 1 (새 Language 추가)** 방식으로 진행! 🎉
