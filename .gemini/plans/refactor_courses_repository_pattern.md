# Refactoring Plan: Courses 모듈에 Repository 패턴 적용

## 1. 🎯 목표 (Goal)
`packages/backend/src/modules/courses` 모듈의 `service.ts`에 집중된 데이터베이스 쿼리 로직과 비즈니스 로직을 분리합니다. 이를 위해 `repository.ts`라는 데이터베이스 접근 전용 계층을 도입하여, 코드의 단일 책임 원칙(SRP)을 강화하고, 테스트 용이성을 높이며, 쿼리 성능 최적화를 용이하게 합니다.

## 2. 📈 현상 및 문제점 (Current State)

현재 구조는 `Service`가 DB 쿼리, 비즈니스 로직, 데이터 변환 등 너무 많은 책임을 가지고 있는 "Fat Service" 패턴입니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        📁 현재 구조 (Fat Service)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   routes.ts ──────► service.ts                                      │
│                     ├─ Prisma 쿼리 (복잡/비효율적)                     │
│                     ├─ 진행률 계산 (비즈니스 로직)                     │
│                     └─ 데이터 변환 (프론트엔드 모델)                   │
│                                                                     │
│   ⚠️ 문제: 테스트 어려움, 책임 혼합, 쿼리 최적화 어려움               │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. ✅ 제안 구조 및 기대 효과 (Proposed Structure)

`Repository` 계층을 도입하여 각 파일의 책임을 명확하게 분리하는 "Layered Architecture"로 변경합니다.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      📁 제안 구조 (Layered)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   routes.ts ──► service.ts ──► repository.ts ──► Prisma            │
│                 ├─ 진행률 계산    │                                 │
│                 └─ 데이터 변환    ├─ findLanguageLight()            │
│                                  ├─ findChaptersWithLessonCount()   │
│                                  └─ findProgressCounts()            │
│                                                                     │
│   ✅ 장점: 단일 책임, 쿼리 최적화 쉬움, 테스트 용이                   │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. 🚀 리팩토링 실행 계획 (Step-by-step Plan)

### Phase 1: 신규 파일 생성 및 준비

1.  **`repository.ts` 파일 생성**:
    - **경로**: `packages/backend/src/modules/courses/repository.ts`
    - **역할**: 데이터베이스 쿼리(Prisma 호출)만을 전담합니다.

2.  **`types.ts` 파일 정의**:
    - **경로**: `packages/backend/src/modules/courses/types.ts`
    - **역할**: 계층 간 데이터 전송에 사용될 DTO(Data Transfer Object) 타입을 정의합니다. (예: `ChapterWithLessonCount`)

### Phase 2: Repository 계층 구현 (`repository.ts`)

- `repository.ts`에 최적화된 쿼리 함수들을 구현합니다.

```typescript
// packages/backend/src/modules/courses/repository.ts
import { prisma } from '@/services/db.service';

/**
 * 언어의 기본 정보만 가볍게 조회합니다.
 */
export async function findLanguageLight(id: string) {
  return prisma.language.findUnique({
    where: { id },
    select: { id: true, isSequential: true },
  });
}

/**
 * 특정 언어에 속한 모든 챕터의 정보와, 각 챕터에 속한 활성화된 레슨의 총 개수를 조회합니다.
 */
export async function findChaptersWithLessonCount(languageId: string) {
  return prisma.chapter.findMany({
    where: { languageId, isActive: true },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      title: true,
      _count: { select: { lessons: { where: { isActive: true } } } },
    },
  });
}

/**
 * 특정 사용자가 주어진 챕터들 내에서 완료한 레슨들의 ID를 조회합니다.
 */
export async function findCompletedLessonIds(userId: string, chapterIds: string[]) {
  const progress = await prisma.userProgress.findMany({
    where: {
      userId,
      status: 'completed',
      lesson: {
        chapterId: { in: chapterIds },
      },
    },
    select: {
      lessonId: true,
    },
  });
  return progress.map(p => p.lessonId);
}
```
*(참고: `findProgressCounts`는 서비스단에서 가공하기 쉽도록 `findCompletedLessonIds`로 변경하여 구현)*

### Phase 3: Service 계층 리팩토링 (`service.ts`)

- 기존의 복잡한 쿼리를 제거하고, `repository`의 함수들을 호출하여 비즈니스 로직을 수행하도록 재구성합니다.

```typescript
// packages/backend/src/modules/courses/service.ts
import * as repository from './repository'; // 🆕 Repository import
import { prisma } from '@/services/db.service'; // lessonId로 chapterId를 찾기 위해 임시 사용

export async function getLanguageWithChapters(languageId: string, userId?: string) {
  // 1. DB 조회는 Repository에 모두 위임
  const language = await repository.findLanguageLight(languageId);
  if (!language) throw new Error('Language not found');

  const chaptersData = await repository.findChaptersWithLessonCount(languageId);
  const chapterIds = chaptersData.map(c => c.id);

  const lessonChapterMap = new Map<string, string>();
  const allLessons = await prisma.lesson.findMany({
      where: { chapterId: { in: chapterIds } },
      select: { id: true, chapterId: true },
  });
  allLessons.forEach(l => lessonChapterMap.set(l.id, l.chapterId));

  let completedLessonsByChapter = new Map<string, number>();

  if (userId) {
    const completedLessonIds = await repository.findCompletedLessonIds(userId, chapterIds);
    
    // 2. ✨ 순수 비즈니스 로직 ✨: 가져온 데이터를 조합하여 진행률 계산
    for (const lessonId of completedLessonIds) {
      const chapterId = lessonChapterMap.get(lessonId);
      if (chapterId) {
        completedLessonsByChapter.set(chapterId, (completedLessonsByChapter.get(chapterId) || 0) + 1);
      }
    }
  }

  const chaptersWithProgress = chaptersData.map(chapter => {
    const total = chapter._count.lessons;
    const completed = completedLessonsByChapter.get(chapter.id) || 0;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      id: chapter.id,
      title: chapter.title,
      progress: userId ? { total, completed, percentage } : null,
    };
  });
  
  // 3. 최종 데이터 조합하여 반환
  return {
    ...language,
    chapters: chaptersWithProgress,
  };
}
```

### Phase 4: 최종 검증

1.  **API 응답 비교**: 리팩토링 전후의 `GET /api/courses/:languageId` API 응답 본문이 100% 동일한지 비교하여 기능적 회귀(regression)가 없음을 보장합니다.
2.  **단위/통합 테스트 작성**:
    - **Repository 단위 테스트**: `repository.ts`의 각 함수가 예상된 Prisma 쿼리를 호출하는지 검증합니다.
    - **Service 단위 테스트**: `repository`를 Mocking하여, DB 의존성 없이 순수 진행률 계산 로직(`(2/5)*100 = 40`)이 정확한지 검증합니다.
    - **통합 테스트**: API 엔드포인트를 직접 호출하여 전체 흐름이 올바르게 동작하는지 최종 확인합니다.
