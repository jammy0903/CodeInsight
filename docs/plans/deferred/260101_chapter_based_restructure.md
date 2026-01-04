# 챕터 기반 코스 구조 변경 계획

> ⚠️ **상태: Phase 3+ 연기됨**
>
> **연기 사유**: MVP(DayPage) 완성이 최우선. DAU 50+ 달성 전까지 구조 변경 금지.
>
> **진입 조건**:
> - DAU 50명 이상
> - "Day가 너무 많아서 헷갈려요" 피드백 3건 이상
>
> **참고**: `260101_ceo_roadmap.md`

---

**날짜**: 2026-01-01
**목표**: Day 기반 코스 → Chapter 기반 코스 구조로 전환
**상태**: 🔴 연기됨 (Phase 3+)

---

## 1. 문제점 (현재 구조)

### 현재 파일 구조
```
src/data/courses/c/
├── day01.ts  # 변수 선언
├── day02.ts  # 포인터 기초
├── day03.ts  # 배열
...
├── day20.ts  # 종합 복습
└── index.ts
```

### 한계
1. **확장성 부족**: Day 1-20으로 한정, 더 많은 개념을 추가하기 어려움
2. **주제 분류 부족**: 관련 개념들이 여러 Day에 흩어짐
3. **난이도 구분 모호**: 기초/중급/고급 구분 없음
4. **ID 체계 불명확**: `day01`로는 언어 구분 안 됨

---

## 2. 새로운 구조 (Chapter 기반)

### 코스 ID 형식
```
{language}-{chapterId}-{courseId}

예시:
c-1-1   → C 언어, 챕터 1, 코스 1
c-1-2   → C 언어, 챕터 1, 코스 2
j-2-5   → Java 언어, 챕터 2, 코스 5
p-3-10  → Python 언어, 챕터 3, 코스 10
```

### 언어 코드
- `c` - C
- `j` - Java
- `p` - Python

### 파일 구조 (Option 1 - 권장)
```
src/data/courses/c/
├── c-chapter1.ts    # 챕터 1: 기초 (변수, 메모리, 포인터)
├── c-chapter2.ts    # 챕터 2: 배열과 문자열
├── c-chapter3.ts    # 챕터 3: 구조체와 파일
└── c-index.ts       # 전체 export
```

**각 챕터 파일 내용 예시**:
```typescript
// c-chapter1.ts
export const cChapter1 = {
  chapterId: 1,
  title: '메모리와 변수 기초',
  description: 'C 언어의 메모리 모델과 변수 선언을 학습합니다',
  courses: [
    {
      language: 'c',
      chapterId: 1,
      courseId: 1,
      title: '변수 선언',
      concept: 'int x = 10',
      code: '...',
      steps: [...],
      quiz: {...}
    },
    // ... 10+ courses
  ]
};
```

---

## 3. C 언어 챕터 구성

### Chapter 1: 메모리와 변수 기초 (10 courses)
- C-1-1: 변수 선언 (int x = 10)
- C-1-2: 변수 초기화
- C-1-3: 스택 메모리
- C-1-4: 포인터 기초 (int *p)
- C-1-5: 포인터와 주소
- C-1-6: 포인터 역참조
- C-1-7: NULL 포인터
- C-1-8: 이중 포인터
- C-1-9: const 포인터
- C-1-10: 포인터 산술 연산

### Chapter 2: 배열과 문자열 (10 courses)
- C-2-1: 배열 선언
- C-2-2: 배열과 포인터
- C-2-3: 다차원 배열
- C-2-4: 문자열 기초
- C-2-5: 문자열 함수 (strlen, strcpy)
- C-2-6: 문자열 포인터
- C-2-7: 문자 배열 vs 문자열 포인터
- C-2-8: 배열 매개변수
- C-2-9: 배열 반환
- C-2-10: 가변 길이 배열

### Chapter 3: 동적 메모리와 구조체 (10 courses)
- C-3-1: malloc 기초
- C-3-2: free와 메모리 해제
- C-3-3: calloc
- C-3-4: realloc
- C-3-5: 메모리 누수
- C-3-6: 구조체 선언
- C-3-7: 구조체 포인터
- C-3-8: 구조체 배열
- C-3-9: 중첩 구조체
- C-3-10: typedef

### Chapter 4: 함수와 스코프 (10 courses)
- C-4-1: 함수 선언
- C-4-2: Call by Value
- C-4-3: Call by Reference
- C-4-4: 함수 포인터
- C-4-5: 재귀 함수
- C-4-6: 전역 변수
- C-4-7: 지역 변수
- C-4-8: static 변수
- C-4-9: extern
- C-4-10: 스코프 규칙

### Chapter 5: 파일 입출력과 전처리 (10 courses)
- C-5-1: FILE 포인터
- C-5-2: fopen/fclose
- C-5-3: fread/fwrite
- C-5-4: fprintf/fscanf
- C-5-5: 파일 위치 제어
- C-5-6: #include
- C-5-7: #define
- C-5-8: 조건부 컴파일
- C-5-9: 매크로 함수
- C-5-10: 헤더 가드

---

## 4. TypeScript 타입 변경

### 현재 타입 (`types.ts`)
```typescript
export interface Day {
  day: number;
  title: string;
  concept: string;
  code: string;
  steps: Step[];
  quiz: Quiz;
}
```

### 새 타입
```typescript
export interface Course {
  language: 'c' | 'j' | 'p';
  chapterId: number;
  courseId: number;
  title: string;
  concept: string;
  code: string;
  steps: Step[];
  quiz: Quiz;
}

export interface Chapter {
  chapterId: number;
  title: string;
  description: string;
  courses: Course[];
}

export interface Language {
  code: 'c' | 'j' | 'p';
  name: string;
  chapters: Chapter[];
}
```

---

## 5. 마이그레이션 작업

### 5.1 파일 생성
- [ ] `c-chapter1.ts` 생성 (기존 day01-day10 내용 재구성)
- [ ] `c-chapter2.ts` 생성 (기존 day11-day15 내용 재구성)
- [ ] `c-chapter3.ts` 생성 (기존 day16-day20 + 신규 내용)
- [ ] `c-chapter4.ts` 생성 (신규)
- [ ] `c-chapter5.ts` 생성 (신규)

### 5.2 파일 삭제
- [ ] `day01.ts` ~ `day20.ts` 삭제 (20개 파일)

### 5.3 Index 파일 변경
```typescript
// c-index.ts (Before)
export function getCDay(dayNumber: number): Day | undefined

// c-index.ts (After)
export function getCCourse(
  chapterId: number,
  courseId: number
): Course | undefined

export function getCChapter(chapterId: number): Chapter | undefined
```

### 5.4 UI 컴포넌트 변경

#### CoursesPage.tsx
```typescript
// Before
<LanguageTabs /> → <DayGrid days={cCourse.days} />

// After
<LanguageTabs /> → <ChapterList chapters={cCourse.chapters} />
  → 챕터 클릭 → <CourseGrid courses={chapter.courses} />
```

#### 라우팅
```
Before:
/courses/c → Day 목록
/courses/c/1 → Day 1 학습

After:
/courses/c → Chapter 목록
/courses/c/1 → Chapter 1의 Course 목록
/courses/c/1/1 → Chapter 1, Course 1 학습
```

---

## 6. 진행 상태 저장 변경

### LocalStorage 키 변경
```typescript
// Before
courseProgress: {
  c: { 1: 'completed', 2: 'in-progress' }
}

// After
courseProgress: {
  'c-1-1': 'completed',
  'c-1-2': 'in-progress',
  'c-2-1': 'locked'
}
```

---

## 7. 예상 효과

### 장점
1. **확장성**: 챕터/코스 무한 추가 가능
2. **구조화**: 주제별로 관련 코스 그룹화
3. **난이도 관리**: 챕터 순서로 난이도 조절
4. **명확한 ID**: `c-1-1` 형식으로 언어/챕터/코스 구분

### 단점
1. **마이그레이션 비용**: 기존 파일 재구성 필요
2. **UI 복잡도**: 2단계 내비게이션 (챕터 → 코스)

---

## 8. 우선순위

### Phase 1 (필수)
1. C 언어 Chapter 1-3 생성
2. 타입 변경
3. 기존 day01-20 삭제
4. Index 파일 변경

### Phase 2
1. UI 컴포넌트 변경 (CoursesPage, CourseGrid)
2. 라우팅 변경
3. LocalStorage 마이그레이션

### Phase 3 (추후)
1. Java/Python 챕터 생성
2. Chapter 4-5 추가 내용 작성
3. 검색 기능 (챕터/코스 검색)

---

## 9. 체크리스트

### 데이터 레이어
- [ ] `types.ts`에 Course, Chapter, Language 타입 추가
- [ ] `c-chapter1.ts` 생성 (10 courses)
- [ ] `c-chapter2.ts` 생성 (10 courses)
- [ ] `c-chapter3.ts` 생성 (10 courses)
- [ ] `c-index.ts` 변경 (chapter export)
- [ ] `day01.ts` ~ `day20.ts` 삭제

### UI 레이어
- [ ] `ChapterList.tsx` 컴포넌트 생성
- [ ] `CourseGrid.tsx` 컴포넌트 생성 (기존 DayGrid 수정)
- [ ] `CourseCard.tsx` 컴포넌트 생성 (기존 DayCard 수정)
- [ ] `CoursesPage.tsx` 변경 (챕터 선택 UI)
- [ ] 라우팅 변경 (`/courses/c/1/1`)

### 상태 관리
- [ ] `useCourseProgress.ts` 변경 (ID 형식)
- [ ] LocalStorage 마이그레이션 스크립트

---

## 10. 참고

- 기존 Day 구조는 `17_new_direction_mvp.md` 참조
- 디자인 시스템은 MCP Memory의 "CodeInsight Design System" 참조
- 타입 정의는 `src/types/` 참조
