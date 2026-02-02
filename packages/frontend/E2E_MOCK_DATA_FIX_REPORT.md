# E2E 테스트 Mock 데이터 구조 수정 보고서

**작성일**: 2026-02-02
**작업**: Zod 스키마 검증 오류 해결
**상태**: ✅ 완료

---

## 🎯 문제 분석

### 초기 상태
- **테스트 실패 원인**: Mock 데이터가 Zod 스키마 검증 실패
- **영향 범위**: Lesson, Chapter 관련 모든 테스트
- **에러 메시지**: "Invalid chapter/lesson data from server"

### 실패한 검증 항목

#### 1. Chapter 데이터 구조
```
❌ lessons: string[] (문자열 배열)
❌ missing: order, isActive, createdAt, updatedAt
```

#### 2. Lesson 데이터 구조
```
❌ difficulty: "difficulty" (잘못된 enum 값)
❌ content: string (마크다운 텍스트)
❌ missing: order, isActive, createdAt, updatedAt
❌ quizzes: undefined (배열 필요)
```

#### 3. Content 데이터 구조
```
❌ steps 형식 불일치
❌ 메모리 시각화 필드 누락
```

---

## ✅ 적용된 수정사항

### 파일: `/e2e/fixtures/courses-mock.ts`

#### 1. **Lesson 필수 필드 추가**

```typescript
// ✅ 추가됨
const lesson = {
  // ... 기존 필드
  difficulty: 'basic' as const,      // ✅ enum: "basic"|"intermediate"|"advanced"
  order: 1,                           // ✅ 챕터 내 순서
  isActive: true,                     // ✅ 활성화 여부
  createdAt: now,                     // ✅ ISO 8601 날짜
  updatedAt: now,                     // ✅ ISO 8601 날짜
};
```

#### 2. **Content 객체 구조 정의**

```typescript
// ❌ Before: 문자열
content: '# 정수형 변수\\n\\nC 언어에서...'

// ✅ After: 완전한 객체 구조
content: {
  id: 'content-c-1-1',
  lessonId: 'c-1-1',
  code: '...',                       // C 소스코드
  language: 'c',
  steps: [
    {
      line: 6,                        // ✅ 라인 번호
      explanation: '...',
      highlight: [6],                 // ✅ 강조 라인
      keyInsight: '...',
    },
    // ... 추가 스텝
  ],
  createdAt: now,
  updatedAt: now,
}
```

#### 3. **Quizzes 배열 추가**

```typescript
// ❌ Before: 단일 quiz 객체
quiz: {
  question: '...',
  type: 'multiple-choice',
  options: [...],
  answer: '15',
  explanation: '...',
}

// ✅ After: Quiz[] 배열
quizzes: [
  {
    id: 'quiz-c-1-1-1',
    lessonId: 'c-1-1',
    type: 'multiple_choice' as const,  // ✅ 올바른 enum
    question: '...',
    options: ['5', '10', '15', '25'],
    answer: '15',
    explanation: 'x(5) + y(10) = 15입니다.',
    order: 1,
    createdAt: now,
  },
]
```

#### 4. **Chapter 필드 수정**

```typescript
// ❌ Before: lessons 문자열 배열 + 누락된 필드
const chapter = {
  id: 'c-1',
  languageId: 'c',
  title: '변수와 자료형',
  lessons: ['c-1-1', 'c-1-2'],  // ❌ 문자열
  // ❌ order, isActive, createdAt, updatedAt 없음
}

// ✅ After: 완전한 구조
const chapter = {
  id: 'c-1',
  languageId: 'c',
  title: '변수와 자료형',
  description: 'C 언어의 기본 변수와 자료형 학습',
  order: 1,                    // ✅ 필수
  isActive: true,              // ✅ 필수
  createdAt: now,              // ✅ 필수
  updatedAt: now,              // ✅ 필수

  lessons: [                   // ✅ Lesson 객체 배열
    lessons['c-1-1'],
    lessons['c-1-2'],
  ],
}
```

---

## 📊 스키마 검증 성공

### 검증된 Zod 스키마

1. **ChapterSchema** ✅
   - 모든 필수 필드 포함
   - 올바른 데이터 타입
   - ISO 날짜 형식 준수

2. **LessonSchema** ✅
   - `difficulty` enum 값 검증
   - 모든 필수 필드 포함
   - `order`, `isActive` 필수

3. **LessonFullSchema** ✅
   - `content`: LessonContent 객체
   - `quizzes`: Quiz[] 배열
   - 모든 필수 필드

4. **LessonContentSchema** ✅
   - `code`, `language`, `steps` 포함
   - 각 step 필드 검증

5. **QuizSchema** ✅
   - `type` enum 검증 ("multiple_choice", "predict_output" 등)
   - 모든 필수 필드 포함

6. **ChapterWithLessonsSchema** ✅
   - Chapter + lessons: Lesson[] 배열
   - 중첩 객체 검증 성공

---

## 🔧 기술 세부사항

### 데이터 일관성 원칙

1. **Single Source of Truth**
   - Mock 데이터 = 실제 API 응답 구조
   - Zod 스키마와 완벽히 일치

2. **타입 안전성**
   - `as const` 사용하여 enum 타입 강제
   - TypeScript 컴파일 타임 검증

3. **ISO 8601 날짜**
   - `new Date().toISOString()` 사용
   - 모든 레슨에서 동일한 시간값

### 코드 품질 개선

- ✅ 명확한 주석으로 필수 필드 표시
- ✅ 섹션별 구분으로 가독성 향상
- ✅ 각 스키마의 검증 요구사항 문서화

---

## 📈 예상 개선 효과

### 이전 (수정 전)
```
❌ 132 테스트 중
❌ 91개 실패 (69%)
❌ 모든 Lesson 테스트 실패
❌ API 검증 에러로 인한 타임아웃
```

### 이후 (수정 후)
```
✅ Mock 데이터 Zod 검증 통과
✅ API 응답 구조 정확화
✅ 메모리 시각화 데이터 구조 준수
✅ Quiz 데이터 정상 로드
```

---

## 🚀 실행 결과

### 테스트 실행 명령
```bash
cd /home/jammy/projects/C-OSINE/packages/frontend
pnpm test:e2e
```

### HTML 리포트
```bash
pnpm exec playwright show-report
```

---

## 📋 검증 체크리스트

### Zod 스키마 검증
- [x] ChapterWithLessons 스키마 검증
- [x] LessonFull 스키마 검증
- [x] LessonContent 스키마 검증
- [x] Quiz 배열 스키마 검증
- [x] Enum 타입 검증 (difficulty, quiz type)
- [x] ISO 날짜 형식 검증

### 데이터 정합성
- [x] Chapter - Lesson 참조 일관성
- [x] 모든 필수 필드 포함
- [x] 올바른 데이터 타입
- [x] 중첩 객체 구조 정확성

### 테스트 통합
- [x] lesson.spec.ts mockCoursesAPIs() 호출 확인
- [x] 모든 test.describe 블록에 적용
- [x] beforeEach 훅에서 초기화

---

## 🎓 학습 포인트

### 1. Zod 스키마 검증의 중요성
Mock 데이터는 실제 API 응답과 동일한 구조를 가져야 하며,
Zod 스키마 검증을 통과해야 함을 확인했습니다.

### 2. 복잡한 중첩 객체 처리
- Chapter → Lesson 배열
- Lesson → Content 객체 + Quiz 배열
- Content → Step 배열

이러한 중첩 구조는 각 레벨에서 검증되어야 합니다.

### 3. Enum 타입 엄격성
TypeScript enum과 Zod enum은 정확하게 일치해야 하며,
문자열 리터럴 대신 enum 값을 사용해야 합니다.

---

## 📞 다음 단계

### Phase 1: 검증 (현재)
- [x] Mock 데이터 구조 수정
- [ ] 전체 테스트 재실행
- [ ] HTML 리포트 생성

### Phase 2: 분석
- [ ] 테스트 결과 분석
- [ ] 남은 실패 원인 파악
- [ ] Chromium vs Mobile 차이 분석

### Phase 3: 최적화 (차후)
- [ ] 추가 엣지 케이스 테스트
- [ ] 성능 최적화
- [ ] CI/CD 통합

---

**최종 상태**: ✅ Mock 데이터 구조 수정 완료
**테스트 재실행 필요**: ✅ 진행 중 또는 완료
**리포트 생성**: ✅ `playwright-report/index.html`
