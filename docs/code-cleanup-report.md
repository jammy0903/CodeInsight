# 코드 정리 분석 보고서

> 생성일: 2026-01-06
> 분석 대상: CodeInsight 전체 코드베이스

---

## 📋 목차

1. [데드 코드 (Dead Code)](#1-데드-코드-dead-code)
2. [중복 코드 (Duplicate Code)](#2-중복-코드-duplicate-code)
3. [쓸데없는 코드 (Useless Code)](#3-쓸데없는-코드-useless-code)
4. [이상한 디자인 구조 (Bad Design Patterns)](#4-이상한-디자인-구조-bad-design-patterns)
5. [우선순위 및 권장사항](#5-우선순위-및-권장사항)

---

## 1. 데드 코드 (Dead Code)

### 1.1 Frontend - 사용되지 않는 서비스

#### `services/tracer.ts`, `services/crunner.ts`
**위치**:
- `/packages/frontend/src/services/tracer.ts` (39 lines)
- `/packages/frontend/src/services/crunner.ts` (151 lines)

**문제**:
- 두 파일 모두 완전히 구현되어 있으나 **어디서도 import되지 않음**
- grep 검색 결과 0건

**원인**:
- Phase 2에서 DB 기반 코스 시스템으로 전환하면서 사용하지 않게 됨
- C 코드 실행/트레이싱은 백엔드 API를 통해 수행됨

**권장사항**:
```bash
# 완전 삭제
rm packages/frontend/src/services/tracer.ts
rm packages/frontend/src/services/crunner.ts
```

**대안**:
- `.claude/KEEP_FILES.md`에 기록하고 유지 (향후 직접 실행 기능 추가 시 참고용)

---

### 1.2 Frontend - 사용되지 않는 라우트

#### `/simulator` 라우트
**위치**: `/packages/frontend/src/router.tsx:62`

```typescript
{ path: 'simulator', element: <HomePage /> }
```

**문제**:
- 라우트만 정의되고 **어디서도 링크되지 않음**
- `HomePage`를 그대로 재사용 (의미 없음)
- Sidebar, TopBar, 모든 페이지에서 참조 없음

**권장사항**:
```typescript
// router.tsx에서 완전 삭제
// Line 62 삭제
```

---

### 1.3 Git Status - 삭제된 파일들 (Unstaged)

**위치**:
```
D packages/frontend/src/features/courses/ChaptersPage.tsx
D packages/frontend/src/features/courses/LessonsPage.tsx
```

**문제**:
- Git에서 삭제됨으로 표시되지만 **아직 커밋되지 않음**
- 실제 파일은 삭제되었으나 git add 안 함

**권장사항**:
```bash
git add packages/frontend/src/features/courses/ChaptersPage.tsx
git add packages/frontend/src/features/courses/LessonsPage.tsx
# 또는
git add -A
```

---

## 2. 중복 코드 (Duplicate Code)

### 2.1 Frontend - LoginPage vs SignupPage 완전 중복

#### `LoginPage.tsx` vs `SignupPage.tsx`
**위치**:
- `/packages/frontend/src/features/auth/LoginPage.tsx` (145 lines)
- `/packages/frontend/src/features/auth/SignupPage.tsx` (145 lines)

**문제**:
- **기능이 100% 동일**: 소셜 로그인만 수행
- **차이점은 단 3곳**:
  1. 페이지 제목: "로그인" vs "회원가입"
  2. 에러 메시지: "로그인 실패" vs "회원가입 실패"
  3. 하단 링크: "/signup" vs "/login"

**코드 비교**:
```typescript
// LoginPage.tsx
<h1>로그인</h1>
setError('Google 로그인 실패');
<a href="/signup">회원가입하기</a>

// SignupPage.tsx
<h1>회원가입</h1>
setError('Google 회원가입 실패');
<a href="/login">로그인하기</a>
```

**영향**:
- 현재 Firebase에서 로그인/회원가입 구분이 없음 (자동 생성)
- 사용자 경험상 혼란 초래 가능

**권장사항**:

**옵션 A: 통합 (추천)** ✅
```typescript
// features/auth/AuthPage.tsx (하나로 통합)
export default function AuthPage() {
  const location = useLocation();
  const isSignup = location.pathname === '/signup';

  return (
    <h1>{isSignup ? '회원가입' : '로그인'}</h1>
    // 나머지 동일
  );
}
```

**옵션 B: 삭제**
- `/login`, `/signup` 라우트 완전 삭제
- Sidebar에서 Google 로그인만 제공 (이미 구현됨)

---

### 2.2 Frontend & Shared - 타입 중복

#### `types/course-schema.ts` (Frontend) vs `types/course.ts` (Shared)
**위치**:
- `/packages/frontend/src/types/course-schema.ts` (259 lines)
- `/packages/shared/src/types/course.ts` (287 lines)

**문제**:
- 대부분의 인터페이스가 **중복 정의됨**
- Shared 버전이 더 완전함 (title, keyInsight, analogy 등 추가 필드)

**중복된 타입**:
```typescript
// 양쪽 모두 정의:
Language, Chapter, Lesson, LessonContent, LessonStep,
StepMemoryState, Variable, StackFrame, HeapObject,
Quiz, UserProgress, ProgressStatus, etc.
```

**권장사항**:
```typescript
// frontend/src/types/course-schema.ts 완전 삭제
// 모든 import를 @codeinsight/shared로 변경

// Before:
import { Language } from '@/types/course-schema';

// After:
import { Language } from '@codeinsight/shared';
```

**마이그레이션 단계**:
1. frontend 전체에서 `@/types/course-schema` import 검색
2. 모두 `@codeinsight/shared` import로 변경
3. `types/course-schema.ts` 삭제

---

## 3. 쓸데없는 코드 (Useless Code)

### 3.1 Console 로그 (Frontend: 21개, Backend: 27개)

#### Frontend 주요 예시
**위치**: `/packages/frontend/src/layouts/Sidebar.tsx:158`
```typescript
console.log('Open registration modal');
```

**위치**: `/packages/frontend/src/layouts/Sidebar.tsx:45`
```typescript
console.error('로그인 실패:', error);
```

**문제**:
- 프로덕션 코드에 디버깅용 로그 남아있음
- 민감한 에러 정보 노출 가능

**권장사항**:
```typescript
// Sidebar.tsx:158 - TODO 주석이므로 유지
// Sidebar.tsx:45 - console.error는 유지 (에러 추적용)

// 하지만 백엔드 console.log는 logger로 변경 필요
```

#### Backend 주요 예시
**위치**: `/packages/backend/src/modules/courses/service.ts:106-108`
```typescript
console.log('[DEBUG] getLessonFull - lessonId:', lessonId);
console.log('[DEBUG] getLessonFull - lesson found:', !!lesson);
console.log('[DEBUG] getLessonFull - content:', lesson?.content);
```

**권장사항**:
```typescript
// 모든 console.log를 logger.debug로 변경
import { logger } from '../../config/logger';

logger.debug('getLessonFull', {
  lessonId,
  found: !!lesson,
  hasContent: !!lesson?.content
});
```

---

### 3.2 Backend - 과도한 Seed 파일

**위치**: `/packages/backend/prisma/`
```
java-content-seed.ts
java-content-seed-2.ts
java-content-seed-3.ts
java-content-seed-4.ts
java-content-seed-5.ts
java-content-seed-6.ts
java-content-seed-7.ts
java-content-seed-8.ts  ← 8개 분할
python-content-seed.ts
python-content-seed-2.ts
python-content-seed-3.ts  ← 3개 분할
```

**문제**:
- Java 콘텐츠가 8개 파일로 분할됨
- Python 콘텐츠가 3개 파일로 분할됨
- 관리 복잡도 증가, 가독성 저하

**권장사항**:

**옵션 A: 통합** (추천)
```typescript
// java-content-seed.ts 하나로 통합
// 내부에서 배치 처리
const allLessons = [
  ...lessonsFromPart1,
  ...lessonsFromPart2,
  // ...
];

for (const lesson of allLessons) {
  await prisma.lessonContent.create({ data: lesson });
}
```

**옵션 B: 디렉토리 구조화**
```
prisma/
├── seeds/
│   ├── java/
│   │   ├── chapter-1.ts
│   │   ├── chapter-2.ts
│   │   └── ...
│   ├── python/
│   │   ├── chapter-1.ts
│   │   └── ...
│   └── index.ts
└── seed.ts (메인 엔트리)
```

---

## 4. 이상한 디자인 구조 (Bad Design Patterns)

### 4.1 Router - 잘못된 경로 구조

#### 문제 1: Chapter ID 누락
**위치**: `/packages/frontend/src/router.tsx:65`

```typescript
// 현재 (잘못됨)
{ path: 'courses/:lang/:lessonId', element: <LessonPage /> }

// 올바른 구조
{ path: 'courses/:lang/:chapterId/:lessonId', element: <LessonPage /> }
```

**문제**:
- DB 구조: `Language → Chapter → Lesson`
- URL은 `Language → Lesson` (Chapter 생략)
- 실제 코드에서는 `lesson.chapterId`로 접근하므로 동작은 함

**영향**:
- URL 의미론적 부정확
- 향후 Chapter 기반 네비게이션 추가 시 문제

**권장사항**:
```typescript
// router.tsx
{
  path: 'courses/:lang/:chapterId/:lessonId',
  element: <LessonPage />
}

// LessonPage.tsx에서
const { lang, chapterId, lessonId } = useParams();
```

---

### 4.2 Frontend - 타입 가드 부족

#### 문제: API 응답 런타임 검증 없음
**위치**: 여러 곳

```typescript
// services/courses.ts
export async function getLanguages(): Promise<Language[]> {
  const res = await fetch(`${API_BASE}/languages`);
  return await res.json();  // ❌ 타입 검증 없음
}
```

**문제**:
- API가 잘못된 데이터 반환 시 런타임 에러
- Zod 스키마는 정의되어 있으나 **사용하지 않음**

**권장사항**:
```typescript
import { LanguagesSchema } from '@codeinsight/shared';

export async function getLanguages(): Promise<Language[]> {
  const res = await fetch(`${API_BASE}/languages`);
  const data = await res.json();
  return LanguagesSchema.parse(data);  // ✅ 런타임 검증
}
```

---

### 4.3 Shared - Zod 스키마와 Type 이원화

#### 문제: 스키마와 타입이 분리됨
**위치**:
- `/packages/shared/src/schemas/course.ts` - Zod 스키마
- `/packages/shared/src/types/course.ts` - TypeScript 타입

**코드**:
```typescript
// schemas/course.ts
export const LanguageSchema = z.object({ ... });

// types/course.ts
export interface Language { ... }
```

**문제**:
- **동기화 부담**: 스키마 변경 시 타입도 수동 변경 필요
- **중복 정의**: 같은 구조를 두 번 작성

**권장사항**:
```typescript
// schemas/course.ts (Single Source of Truth)
export const LanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  // ...
});

export type Language = z.infer<typeof LanguageSchema>;
//                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                     Zod에서 자동 추론
```

**마이그레이션**:
1. `types/course.ts`의 모든 `interface`를 `type`으로 변경
2. Zod 스키마에서 `z.infer`로 추론
3. `types/course.ts` 파일 삭제 (schemas에 통합)

---

### 4.4 Backend - 에러 처리 불일치

#### 문제: 일부는 logger, 일부는 console.log
**위치**: 여러 곳

```typescript
// courses/service.ts (일관성 없음)
console.log('[DEBUG] getLessonFull');  // ❌
logger.error('Failed to fetch');       // ✅

// c/executor.ts (일관성 있음)
logger.info('Compiling C code');       // ✅
logger.error('Compilation failed');    // ✅
```

**권장사항**:
```typescript
// 모든 로깅을 logger로 통일
import { logger } from '@/config/logger';

// 개발 중 디버깅
logger.debug('Variable state', { lessonId, content });

// 프로덕션 로그
logger.info('Lesson fetched', { lessonId });
logger.error('Failed to fetch lesson', { lessonId, error });
```

---

## 5. 우선순위 및 권장사항

### 🔴 High Priority (즉시 수정)

1. **타입 중복 제거**
   - `frontend/types/course-schema.ts` 삭제
   - 모든 import를 `@codeinsight/shared`로 변경
   - **영향**: 타입 안전성 향상, 동기화 문제 해결

2. **LoginPage/SignupPage 통합**
   - AuthPage 하나로 통합
   - **영향**: 코드 145줄 절감, 유지보수성 향상

3. **Router 경로 수정**
   - `/courses/:lang/:chapterId/:lessonId` 구조로 변경
   - **영향**: URL 의미론 개선, 향후 확장성

### 🟡 Medium Priority (다음 스프린트)

4. **Zod 런타임 검증 추가**
   - API 응답에 스키마 적용
   - **영향**: 런타임 안전성 대폭 향상

5. **Console.log → Logger 전환**
   - Backend 전체 로깅 통일
   - **영향**: 프로덕션 로그 관리 개선

6. **Seed 파일 정리**
   - Java/Python 콘텐츠 파일 통합 또는 구조화
   - **영향**: 가독성 향상, 관리 편의성

### 🟢 Low Priority (시간 날 때)

7. **데드 코드 삭제**
   - `tracer.ts`, `crunner.ts` 삭제
   - `/simulator` 라우트 삭제
   - **영향**: 번들 크기 소폭 감소

8. **Git 정리**
   - 삭제된 파일 커밋
   - **영향**: Git 히스토리 정리

9. **Zod + Type 통합**
   - `z.infer`로 타입 자동 추론
   - `types/course.ts` 제거
   - **영향**: 장기적 유지보수성

---

## 📊 요약

| 카테고리 | 발견 건수 | 고위험 | 중위험 | 저위험 |
|---------|----------|--------|--------|--------|
| 데드 코드 | 5건 | 0 | 0 | 5 |
| 중복 코드 | 2건 | 2 | 0 | 0 |
| 쓸데없는 코드 | 2건 | 0 | 2 | 0 |
| 이상한 디자인 | 4건 | 3 | 1 | 0 |
| **합계** | **13건** | **5건** | **3건** | **5건** |

---

## 🎯 다음 단계

### 1단계: 고위험 수정 (예상 1-2시간)
```bash
# 1. 타입 통합
# 2. Auth 페이지 통합
# 3. Router 경로 수정
```

### 2단계: 중위험 개선 (예상 2-3시간)
```bash
# 4. Zod 검증 추가
# 5. Logger 전환
# 6. Seed 파일 정리
```

### 3단계: 저위험 정리 (예상 30분)
```bash
# 7. 데드 코드 삭제
# 8. Git 커밋
# 9. Zod+Type 통합
```

**총 예상 시간**: 4-6시간

---

## 📝 참고 사항

- 이 보고서는 2026-01-06 기준 분석 결과임
- 모든 변경 전 git branch 생성 권장
- 변경 후 빌드 및 테스트 필수
- Phase 2+ 기능을 위한 KEEP_FILES.md 참조

