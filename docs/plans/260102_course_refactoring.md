# 코스 시스템 리팩토링 계획

> 작성: 2026-01-02
> 목표: Day 기반 정적 데이터 → Chapter-Lesson DB 기반 구조로 마이그레이션

---

## 1. 현재 구조 vs 새 구조

| 현재 | 새 구조 |
|------|---------|
| Language → Day (1-20) | Language → Chapter (1-35) → Lesson (1-10) |
| 정적 파일 (`day01.ts`) | DB 테이블 (`lessons`) |
| localStorage 진행 상태 | DB `user_progress` 테이블 |

---

## 2. 재사용 가능한 코드 (✅ 유지)

### 2.1 프론트엔드 컴포넌트

| 컴포넌트 | 변경 사항 |
|---------|----------|
| `DayPage.tsx` | `getDay()` → API 호출로 변경, `LessonPage`로 rename |
| `CodeViewer.tsx` | 그대로 유지 (코드 렌더링) |
| `StepExplanation.tsx` | 그대로 유지 |
| `StepControls.tsx` | 그대로 유지 |
| `CourseMemoryView.tsx` | 그대로 유지 |
| `QuizCard.tsx` | 그대로 유지 |
| `QuizResult.tsx` | 그대로 유지 |
| `DayCard.tsx` | `LessonCard`로 rename, props 변경 |
| `DayGrid.tsx` | `LessonGrid`로 rename |

### 2.2 프론트엔드 훅

| 훅 | 변경 사항 |
|----|----------|
| `useDayNavigation.ts` | rename → `useLessonNavigation`, 로직 동일 |
| `useCourseMemory.ts` | 그대로 유지 (순수 계산 로직) |
| `useCodeSelection.ts` | 그대로 유지 |
| `useCourseProgress.ts` | localStorage → API 호출로 변경 |

### 2.3 백엔드 모듈

| 모듈 | 상태 |
|------|------|
| `modules/ai/` | 그대로 유지 |
| `modules/c/` | 그대로 유지 |
| `modules/users/` | 그대로 유지 |
| `modules/admin/` | 그대로 유지 |

### 2.4 서비스

| 서비스 | 상태 |
|--------|------|
| `services/ai.ts` | 그대로 유지 |
| `services/crunner.ts` | 그대로 유지 |
| `services/api/axios.ts` | 그대로 유지 |

---

## 3. 삭제할 코드 (🗑️ Dead Code)

### 3.1 정적 데이터 파일 (DB 마이그레이션 후)

```
frontend/src/data/courses/
├── c/
│   ├── day01.ts ~ day20.ts  # 🗑️ DB로 이동 후 삭제
│   ├── _meta.ts             # 🗑️ DB languages 테이블로 이동
│   └── index.ts             # 🗑️ 삭제
├── java/
│   ├── day01.ts             # 🗑️ DB로 이동
│   ├── _meta.ts             # 🗑️ 삭제
│   └── index.ts             # 🗑️ 삭제
├── python/
│   └── ...                  # 🗑️ 동일
├── index.ts                 # 🗑️ API 서비스로 대체
└── types.ts                 # ⚠️ course.ts로 통합 후 삭제
```

### 3.2 레거시 타입 (통합 후)

```
frontend/src/types/
├── course.ts         # ⚠️ course-schema.ts와 통합
└── course-schema.ts  # ✅ 유지 (새 구조)
```

### 3.3 미사용 백엔드 코드

```
backend/src/modules/
└── memory/           # ⚠️ 사용 여부 확인 필요 (trace API)
```

---

## 4. 새로 생성할 코드 (🆕 New)

### 4.1 백엔드 API 모듈

```
backend/src/modules/courses/
├── index.ts          # 라우터 등록
├── routes.ts         # API 엔드포인트
├── service.ts        # 비즈니스 로직
└── types.ts          # 요청/응답 타입
```

**엔드포인트:**

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/courses/languages` | 언어 목록 |
| GET | `/api/courses/:lang/chapters` | 챕터 목록 |
| GET | `/api/courses/:lang/:chapterId/lessons` | 레슨 목록 |
| GET | `/api/courses/lessons/:lessonId` | 레슨 상세 (콘텐츠 + 퀴즈) |
| GET | `/api/courses/progress` | 사용자 진행 상태 |
| POST | `/api/courses/progress` | 진행 상태 업데이트 |

### 4.2 프론트엔드 서비스

```
frontend/src/services/courses.ts  # 🆕 코스 API 클라이언트
```

### 4.3 프론트엔드 페이지 (기존 리팩토링)

```
frontend/src/features/courses/
├── CoursesPage.tsx      # 언어 선택 (유지)
├── ChaptersPage.tsx     # 🆕 챕터 목록 (새로 생성)
├── LessonsPage.tsx      # 🆕 레슨 목록 (DayGrid 리팩토링)
└── LessonPage.tsx       # DayPage 리팩토링
```

---

## 5. 마이그레이션 단계

### Phase 1: 백엔드 API (Day 1)

1. `modules/courses/` 생성
2. Prisma 쿼리 작성
3. API 엔드포인트 구현
4. 테스트

### Phase 2: 시드 데이터 (Day 1)

1. 기존 `day01.ts ~ day20.ts` → DB INSERT 스크립트
2. C 언어 챕터 1-2개 샘플 데이터
3. 데이터 검증

### Phase 3: 프론트엔드 서비스 (Day 2)

1. `services/courses.ts` 생성
2. API 타입 정의
3. 기존 `getDay()` → API 호출로 교체

### Phase 4: 프론트엔드 페이지 (Day 2-3)

1. `ChaptersPage.tsx` 생성
2. `LessonsPage.tsx` 생성 (DayGrid 리팩토링)
3. `LessonPage.tsx` 생성 (DayPage 리팩토링)
4. 라우팅 업데이트

### Phase 5: 진행 상태 마이그레이션 (Day 3)

1. `useCourseProgress` → API 기반으로 변경
2. localStorage 데이터 마이그레이션 (선택적)

### Phase 6: 정리 (Day 4)

1. 정적 데이터 파일 삭제
2. 레거시 타입 통합
3. Dead code 제거
4. 문서 업데이트

---

## 6. 컴포넌트 매핑 (현재 → 새 구조)

| 현재 | → | 새 구조 | 변경 사항 |
|------|---|---------|----------|
| `CoursesPage` | → | `CoursesPage` | 언어 클릭 → ChaptersPage로 이동 |
| (없음) | → | `ChaptersPage` | 🆕 챕터 카드 그리드 |
| `DayGrid` + `DayCard` | → | `LessonsPage` | 레슨 카드 그리드 |
| `DayPage` | → | `LessonPage` | 레슨 학습 화면 |

---

## 7. URL 구조 변경

| 현재 | → | 새 구조 |
|------|---|---------|
| `/courses` | → | `/courses` (언어 선택) |
| `/courses/:lang` | → | `/courses/:lang` (챕터 목록) |
| (없음) | → | `/courses/:lang/:chapterId` (레슨 목록) |
| `/courses/:lang/:day` | → | `/courses/:lang/:chapterId/:lessonId` (레슨 학습) |

---

## 8. 데이터 마이그레이션 스크립트

```typescript
// scripts/migrate-courses.ts

import { PrismaClient } from '@prisma/client';
import { cCourse } from '../frontend/src/data/courses/c';

const prisma = new PrismaClient();

async function migrateCourse() {
  // 1. Language 생성
  await prisma.language.create({
    data: {
      id: 'c',
      name: 'C',
      description: cCourse.language.description,
      icon: cCourse.language.icon,
      color: '#00599C',
      order: 1,
    },
  });

  // 2. Chapter 생성 (Day를 Chapter로 그룹핑)
  // Day 1-5 → Chapter 1: 기초
  // Day 6-10 → Chapter 2: 포인터
  // ...

  // 3. Lesson + Content + Quiz 생성
  for (const day of cCourse.days) {
    // Day → Lesson 변환
  }
}
```

---

## 9. 리스크 및 대응

| 리스크 | 대응 |
|--------|------|
| 기존 사용자 진행 상태 손실 | localStorage → DB 마이그레이션 스크립트 |
| URL 변경으로 인한 북마크 깨짐 | 리다이렉트 라우트 추가 |
| Day 20개 → Chapter-Lesson 구조 매핑 | 수동 그룹핑 필요 |

---

## 10. 완료 조건

- [ ] 백엔드 API 6개 엔드포인트 구현
- [ ] C 언어 전체 데이터 DB 마이그레이션
- [ ] 프론트엔드 3개 페이지 (Chapters, Lessons, Lesson)
- [ ] 진행 상태 API 연동
- [ ] 정적 데이터 파일 삭제
- [ ] 레거시 타입 통합
- [ ] E2E 테스트 통과
