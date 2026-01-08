# 코스 데이터 구조 (레거시)

> ⚠️ **레거시 문서**: 이 문서는 `data/courses/`의 정적 데이터 구조를 설명합니다.
>
> **새 구조**: `types/course-schema.ts`의 DB 기반 구조로 마이그레이션 예정
> ```
> Language → Chapter → Lesson → (Content + Quiz)
> ```
>
> 새 구조에 대한 자세한 내용은 `docs/architecture/SYSTEM_OVERVIEW.md`를 참조하세요.

---

## 폴더 구조

```
frontend/src/data/courses/
├── index.ts              # 통합 export + 유틸리티 함수
├── types.ts              # 공통 타입 정의
│
├── c/                    # C 언어
│   ├── _meta.ts          # 언어 메타 정보
│   ├── day01.ts          # Day 1: 변수와 메모리 주소
│   ├── day02.ts          # Day 2: 포인터는 값이다
│   ├── day03.ts          # Day 3: 포인터 역참조
│   └── index.ts          # C 코스 export
│
├── java/                 # Java
│   ├── _meta.ts
│   ├── day01.ts          # Day 1: 참조 타입
│   └── index.ts
│
└── python/               # Python
    ├── _meta.ts
    ├── day01.ts          # Day 1: 변수는 이름표다
    └── index.ts
```

---

## 타입 정의

### Language (지원 언어)

```typescript
type Language = 'c' | 'java' | 'python';
```

### LanguageMeta (언어 메타 정보)

```typescript
interface LanguageMeta {
  id: Language;
  name: string;           // "C", "Java", "Python"
  icon: string;           // 이모지 or 아이콘
  description: string;    // 짧은 설명
  codeBlockLang: string;  // 마크다운 코드 블록용
  totalDays: number;      // 전체 Day 수
}
```

### Day (개별 학습 단위)

```typescript
interface Day {
  day: number;                    // Day 번호 (1부터)
  title: string;                  // "포인터 역참조"
  concept: string;                // 핵심 개념 한 줄
  code: string;                   // 전체 코드
  steps: Step[];                  // 시뮬레이션 스텝
  quiz: Quiz;                     // 퀴즈
  commonMistakes: string[];       // 흔한 착각 포인트들
}
```

### Step (시뮬레이션 스텝)

```typescript
interface Step {
  stepIndex: number;              // 0부터 시작
  line: number;                   // 코드 줄 번호 (1부터)
  explanation: string;            // 이 스텝에서 무슨 일이 일어나는지
  memoryChanges?: MemoryChange[]; // 메모리 변화 (optional)
}

interface MemoryChange {
  type: 'stack' | 'heap';
  action: 'create' | 'update' | 'delete';
  name: string;                   // 변수명
  value?: string | number;        // 새 값
  address?: string;               // 주소 (예: "0x1000")
  pointsTo?: string;              // 포인터가 가리키는 대상
}
```

### Quiz (퀴즈)

```typescript
interface Quiz {
  question: string;               // "실행 후 a의 값은?"
  options: QuizOption[];          // 선택지
  correctIndex: number;           // 정답 인덱스 (0부터)
  explanation: string;            // 정답 해설
}

interface QuizOption {
  label: string;                  // "20"
  value: string;                  // 내부 값
}
```

---

## 사용법

### Import

```typescript
import {
  getCourse,
  getDay,
  getAllLanguages,
  getLanguageMeta,
  getTotalDays,
} from '@/data/courses';
```

### 모든 언어 목록 가져오기

```typescript
const languages = getAllLanguages();
// → [
//   { id: 'c', name: 'C', icon: '🔧', ... },
//   { id: 'java', name: 'Java', icon: '☕', ... },
//   { id: 'python', name: 'Python', icon: '🐍', ... },
// ]
```

### 특정 코스 가져오기

```typescript
const cCourse = getCourse('c');
// → {
//   language: { id: 'c', name: 'C', ... },
//   days: [day01, day02, day03, ...]
// }
```

### 특정 Day 가져오기

```typescript
const day3 = getDay('c', 3);
// → {
//   day: 3,
//   title: '포인터 역참조',
//   concept: '*p = "p가 가리키는 곳의 값"',
//   code: 'int a = 10;\nint *p = &a;\n*p = 20;',
//   steps: [...],
//   quiz: {...},
//   commonMistakes: [...]
// }
```

### 언어 메타 정보 가져오기

```typescript
const meta = getLanguageMeta('c');
// → { id: 'c', name: 'C', icon: '🔧', totalDays: 10, ... }
```

---

## 새 언어 추가 방법

### 1. 폴더 생성

```bash
mkdir frontend/src/data/courses/{language}
```

### 2. _meta.ts 작성

```typescript
// data/courses/{language}/_meta.ts

import type { LanguageMeta } from '../types';

export const {language}Meta: LanguageMeta = {
  id: '{language}',
  name: '언어명',
  icon: '이모지',
  description: '언어 설명',
  codeBlockLang: '{language}',
  totalDays: N,
};
```

### 3. Day 파일 작성

```typescript
// data/courses/{language}/day01.ts

import type { Day } from '../types';

export const day01: Day = {
  day: 1,
  title: '제목',
  concept: '핵심 개념',
  code: `코드`,
  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: '설명',
      memoryChanges: [...],
    },
  ],
  quiz: {
    question: '퀴즈 질문',
    options: [...],
    correctIndex: 0,
    explanation: '해설',
  },
  commonMistakes: ['착각 포인트'],
};
```

### 4. index.ts 작성

```typescript
// data/courses/{language}/index.ts

import type { Course, Day } from '../types';
import { {language}Meta } from './_meta';
import { day01 } from './day01';

const days: Day[] = [day01];

export const {language}Course: Course = {
  language: {language}Meta,
  days,
};

export { {language}Meta } from './_meta';
export { day01 } from './day01';

export function get{Language}Day(dayNumber: number): Day | undefined {
  return days.find((d) => d.day === dayNumber);
}
```

### 5. 상위 index.ts에 등록

```typescript
// data/courses/index.ts

// 1. import 추가
import { {language}Course, {language}Meta, get{Language}Day } from './{language}';

// 2. allCourses에 추가
const allCourses: Record<Language, Course> = {
  c: cCourse,
  java: javaCourse,
  python: pythonCourse,
  {language}: {language}Course,  // 추가
};

// 3. allLanguages에 추가
const allLanguages: LanguageMeta[] = [cMeta, javaMeta, pythonMeta, {language}Meta];

// 4. getDay switch case 추가
export function getDay(language: Language, dayNumber: number): Day | undefined {
  switch (language) {
    case 'c':
      return getCDay(dayNumber);
    case 'java':
      return getJavaDay(dayNumber);
    case 'python':
      return getPythonDay(dayNumber);
    case '{language}':
      return get{Language}Day(dayNumber);  // 추가
    default:
      return undefined;
  }
}
```

### 6. types.ts에 언어 추가

```typescript
// data/courses/types.ts

export type Language = 'c' | 'java' | 'python' | '{language}';
```

---

## Day 데이터 예시

```typescript
// C Day 3: 포인터 역참조

export const day03: Day = {
  day: 3,
  title: '포인터 역참조',
  concept: '*p = "p가 가리키는 곳의 값"',

  code: `int a = 10;
int *p = &a;
*p = 20;`,

  steps: [
    {
      stepIndex: 0,
      line: 1,
      explanation: 'a에 10을 저장합니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'a', value: 10, address: '0x1000' },
      ],
    },
    {
      stepIndex: 1,
      line: 2,
      explanation: 'p에 a의 주소를 저장합니다.',
      memoryChanges: [
        { type: 'stack', action: 'create', name: 'p', value: '0x1000', address: '0x1004', pointsTo: 'a' },
      ],
    },
    {
      stepIndex: 2,
      line: 3,
      explanation: '*p는 "p가 가리키는 곳"입니다. a가 20으로 바뀝니다.',
      memoryChanges: [
        { type: 'stack', action: 'update', name: 'a', value: 20, address: '0x1000' },
      ],
    },
  ],

  quiz: {
    question: '마지막 줄 실행 후 a의 값은?',
    options: [
      { label: '10', value: '10' },
      { label: '20', value: '20' },
      { label: '0x1000', value: '0x1000' },
    ],
    correctIndex: 1,
    explanation: '*p = 20은 p가 가리키는 a의 값을 20으로 변경합니다.',
  },

  commonMistakes: [
    '*p = 20이 p의 값을 바꾼다고 착각하는 경우가 많아요. p는 여전히 0x1000입니다.',
    '*는 "역참조 연산자"입니다. p에 저장된 주소로 가서 그 값을 읽거나 쓰라는 뜻이에요.',
  ],
};
```

---

*작성일: 2025-12-28*
