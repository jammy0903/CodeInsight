# 레슨 URL 단순화 리팩토링

## 목표

```
Before: /courses/c/c-0/c-1-5
After:  /courses/c-1-5
```

lessonId 자체가 언어 prefix + 챕터 번호 + 레슨 번호를 모두 포함하므로,
URL에서 `:lang`과 `:chapterId`를 제거한다.

---

## 핵심 근거

- `lesson.languageId` — API 응답에 이미 포함 (lang URL 파라미터 불필요)
- `lesson.chapterId` — API 응답에 이미 포함 (chapterId URL 파라미터 불필요)
- lessonId (`c-1-5`, `js-2-3` 등)는 전역 고유 식별자

---

## 라우팅 충돌 해결 전략

`/courses/:lang`과 `/courses/:lessonId`는 동일한 1-segment 경로라 충돌 발생.

**해결**: React Router 라우트 순서 제어 + LessonPage 진입 시 guard

라우트 등록 순서:
1. `courses/:lang/:chapterId` (2-segment, 기존 유지)
2. `courses/:lang` (1-segment, 기존 유지)
3. `courses/:lessonId` (1-segment, 신규 — 반드시 `:lang` 이후에 등록)

단, React Router v6는 specificity 동점 시 **선언 순서 우선**이므로
`:lang`이 먼저면 `/courses/c-1-5`가 LanguageCoursePage로 잡힌다.

**실제 해결법**: `/courses/:lessonId` 라우트를 먼저 두되,
LessonPage 내부에서 param이 알려진 언어 ID(`c`, `java`, `python`, `javascript`, `cpp`, `python-practical`)면
LanguageCoursePage로 redirect.

```tsx
// LessonPage.tsx 상단
const LANGUAGE_IDS = new Set(['c', 'java', 'python', 'javascript', 'cpp', 'python-practical']);

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // lessonId가 언어 ID면 언어 페이지로 redirect
  if (lessonId && LANGUAGE_IDS.has(lessonId)) {
    return <Navigate to={`/courses/${lessonId}`} replace />;
    // 단, 이 경우 이중 라우트 등록이 필요 없도록 아래 라우터 구조로 정리
  }
  // ...
}
```

더 깔끔한 대안: 라우터에서 `/courses/:lessonId`를 마지막에 두고,
LessonPage에서 `useLessonData` 결과가 404면 언어 페이지로 redirect.

---

## 파일별 변경 사항

### 1. `packages/shared/src/types/course.ts`

`getLessonPath` 시그니처 변경:

```ts
// Before
export function getLessonPath(
  languageId: string,
  chapterId: string,
  lessonId: string
): string {
  return `/courses/${languageId}/${chapterId}/${lessonId}`;
}

// After
export function getLessonPath(lessonId: string): string {
  return `/courses/${lessonId}`;
}

// getChapterPath는 변경 없음 (챕터 목록 페이지 URL 유지)
```

---

### 2. `packages/frontend/src/router.tsx`

```tsx
// Before
{
  path: 'courses/:lang/:chapterId/:lessonId',
  lazy: async () => {
    const { LessonPage } = await import('./features/courses/LessonPage');
    return { Component: LessonPage };
  }
},

// After — 기존 3-segment 라우트 제거, 1-segment 추가
// 반드시 'courses/:lang' 라우트보다 앞에 등록해야 함
{
  path: 'courses/:lessonId',
  lazy: async () => {
    const { LessonPage } = await import('./features/courses/LessonPage');
    return { Component: LessonPage };
  }
},
// courses/:lang 라우트는 유지 (언어 코스 페이지)
// courses/:lang/:chapterId 라우트는 유지 (챕터 목록 페이지)
```

> **주의**: React Router v6에서 `/courses/:lessonId`를 `/courses/:lang` 보다
> 앞에 두면 `/courses/c`도 LessonPage로 잡힌다.
> LessonPage 내부에서 LANGUAGE_IDS guard로 redirect 처리해야 함.

---

### 3. `packages/frontend/src/features/courses/LessonPage.tsx`

```tsx
// Before
const { lang, chapterId, lessonId } = useParams<{
  lang: string;
  chapterId: string;
  lessonId: string;
}>();

const { lesson, isLoading, isError, error, nextLessonId, quiz } = useLessonData({
  lessonId,
  chapterId,
  lang,
});

const languageCoursePath = `/courses/${lang}`;
const nextLessonPath =
  nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

// ...
<LessonUnifiedView
  languageId={lang || 'c'}
  // ...
/>
```

```tsx
// After
const LANGUAGE_IDS = new Set(['c', 'java', 'python', 'javascript', 'cpp', 'python-practical']);

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  // 언어 ID가 lessonId로 잡힌 경우 redirect
  if (lessonId && LANGUAGE_IDS.has(lessonId)) {
    return <Navigate to={`/courses/${lessonId}`} replace />;
  }

  const { lesson, isLoading, isError, error, nextLessonId, quiz } = useLessonData({ lessonId });

  // lesson.languageId, lesson.chapterId를 URL params 대신 사용
  const lang = lesson?.languageId;
  const languageCoursePath = lang ? `/courses/${lang}` : '/courses';
  const nextLessonPath = nextLessonId ? `/courses/${nextLessonId}` : null;

  // ...
  <LessonUnifiedView
    languageId={lang || 'c'}
    // ...
  />
}
```

---

### 4. `packages/frontend/src/features/courses/hooks/useLessonData.ts`

```ts
// Before
interface UseLessonDataOptions {
  lessonId: string | undefined;
  chapterId: string | undefined;
  lang: string | undefined;
}

export function useLessonData({ lessonId, chapterId, lang }: UseLessonDataOptions) {
  const { data: chapterData } = useChapter(chapterId);
  // ...
  useEffect(() => {
    if (lesson) {
      setPageTitle(lesson.title, lesson.description, lang as SupportedLanguage);
    }
  }, [lesson, setPageTitle, lang]);
}
```

```ts
// After — lesson 로드 후 lesson.chapterId로 chapter 조회
interface UseLessonDataOptions {
  lessonId: string | undefined;
}

export function useLessonData({ lessonId }: UseLessonDataOptions) {
  const { data: lesson, isLoading, isError, error } = useLesson(lessonId);
  // lesson이 로드된 뒤 chapterId를 얻어 chapter 조회
  const { data: chapterData } = useChapter(lesson?.chapterId);

  // lang은 lesson.languageId에서 파생
  useEffect(() => {
    if (lesson) {
      setPageTitle(lesson.title, lesson.description, lesson.languageId as SupportedLanguage);
    }
  }, [lesson, setPageTitle]);
}
```

> **주의**: `useChapter(lesson?.chapterId)`는 lesson 로드 전 undefined로 호출되므로
> `useChapter` 내부에서 `enabled: !!chapterId` 처리가 되어 있는지 확인 필요.

---

### 5. `packages/frontend/src/features/courses/ChapterLessonsPage.tsx`

```tsx
// Before
onClick={() => navigate(`/courses/${lang}/${chapterId}/${lesson.id}`)}

// After
onClick={() => navigate(`/courses/${lesson.id}`)}
```

---

### 6. `packages/frontend/src/features/courses/components/LessonCard.tsx`

```tsx
// Before
navigate(`/courses/${languageId}/${chapterId}/${lesson.id}`);

// After
navigate(`/courses/${lesson.id}`);

// 이 경우 languageId, chapterId props가 불필요해지므로 제거 가능
```

---

### 7. `packages/frontend/src/layouts/Sidebar.tsx`

```ts
// Before — 3-segment URL에서 lessonId 추출
const lessonRouteMatch = location.pathname.match(/^\/courses\/[^/]+\/[^/]+\/([^/]+)$/);
const lessonId = lessonRouteMatch?.[1];

// After — 1-segment URL에서 lessonId 추출
// /courses/{lessonId} 형태 매칭 (언어 ID 제외)
const lessonRouteMatch = location.pathname.match(/^\/courses\/([^/]+-\d+-\d+.*)$/);
const lessonId = lessonRouteMatch?.[1];
```

---

### 8. `packages/frontend/src/features/courses/LessonPage.tsx` — nextLessonPath 관련

`LessonCompletedView`에 전달하는 경로:

```tsx
// Before
const nextLessonPath =
  nextLessonId && lesson ? `/courses/${lang}/${lesson.chapterId}/${nextLessonId}` : null;

// After
const nextLessonPath = nextLessonId ? `/courses/${nextLessonId}` : null;
```

---

## 기존 URL 하위 호환 처리 (선택)

이미 북마크하거나 공유된 링크를 위해 redirect 추가:

```tsx
// router.tsx에 추가
{
  path: 'courses/:lang/:chapterId/:lessonId',
  element: <LessonRedirect />,
},
```

```tsx
// LessonRedirect 컴포넌트
function LessonRedirect() {
  const { lessonId } = useParams<{ lessonId: string }>();
  return <Navigate to={`/courses/${lessonId}`} replace />;
}
```

---

## 변경 파일 요약

| 파일 | 변경 유형 |
|---|---|
| `packages/shared/src/types/course.ts` | `getLessonPath` 시그니처 단순화 |
| `packages/frontend/src/router.tsx` | 레슨 라우트 경로 변경 + 구 URL redirect 추가 |
| `packages/frontend/src/features/courses/LessonPage.tsx` | URL params 변경, lang/nextLessonPath 파생 방식 변경 |
| `packages/frontend/src/features/courses/hooks/useLessonData.ts` | chapterId/lang 파라미터 제거 |
| `packages/frontend/src/features/courses/ChapterLessonsPage.tsx` | navigate() URL 단순화 |
| `packages/frontend/src/features/courses/components/LessonCard.tsx` | navigate() URL 단순화, 불필요 props 제거 |
| `packages/frontend/src/layouts/Sidebar.tsx` | lessonId 추출 정규식 변경 |

---

## 작업 순서

1. `shared/types/course.ts` — `getLessonPath` 변경 (빌드 에러 발생 → 다음 단계로 연쇄 수정)
2. `useLessonData.ts` — chapterId/lang 파라미터 제거
3. `LessonPage.tsx` — URL params 정리, guard 추가
4. `router.tsx` — 라우트 변경 + redirect 라우트 추가
5. `ChapterLessonsPage.tsx`, `LessonCard.tsx` — navigate() 수정
6. `Sidebar.tsx` — 정규식 수정
7. 브라우저에서 검증:
   - `/courses/c-1-5` → 레슨 정상 로드
   - `/courses/c` → LanguageCoursePage 정상 표시
   - `/courses/c/c-0` → ChapterLessonsPage 정상 표시
   - `/courses/c/c-0/c-1-5` (구 URL) → `/courses/c-1-5`로 redirect
