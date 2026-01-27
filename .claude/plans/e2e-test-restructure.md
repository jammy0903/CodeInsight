# E2E 테스트 재구성 계획

**작성일**: 2026-01-28
**목적**: 로그인 필요 여부에 따라 e2e 테스트를 명확히 구분하여 관리 및 유지보수 용이성 향상

---

## 📊 현재 상태 분석

### 라우팅 구조 (router.tsx 기준)

#### ✅ Public Routes (로그인 불필요 - `ProtectedRoute` 없음)

```typescript
// router.tsx L66-93
{ index: true, element: <HomePage /> },                              // /
{ path: 'login', element: <AuthPage /> },                           // /login
{ path: 'signup', element: <AuthPage /> },                          // /signup
{ path: 'courses', element: <CoursesPage /> },                      // /courses
{ path: 'courses/:lang', ... },                                     // /courses/:lang
{ path: 'courses/:lang/:chapterId', ... },                          // /courses/:lang/:chapterId
{ path: 'courses/:lang/:chapterId/:lessonId', ... },                // /courses/:lang/:chapterId/:lessonId ⚠️ 중요!
{ path: 'playground', element: <PlaygroundPage /> },                // /playground
```

**핵심**: `LessonPage`는 **로그인 불필요** (ProtectedRoute로 감싸지지 않음)

#### 🔒 Protected Routes (로그인 필요 - `<ProtectedRoute>` 감싸짐)

```typescript
// router.tsx L95-101
{ path: 'quiz', element: <ProtectedRoute><QuizPage /></ProtectedRoute> },
{ path: 'quiz/ox/:lang', element: <ProtectedRoute><OXQuizPage /></ProtectedRoute> },
{ path: 'quiz/multiple-choice/:lang', element: <ProtectedRoute><MultipleChoiceQuizPage /></ProtectedRoute> },
{ path: 'quiz/fill-blank/:lang', element: <ProtectedRoute><FillBlankQuizPage /></ProtectedRoute> },
{ path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
{ path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
{ path: 'report', element: <ProtectedRoute><ReportPage /></ProtectedRoute> },
```

#### 🛡️ Admin Routes (관리자 전용 - `<AdminRoute>`)

```typescript
// router.tsx L102
{ path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
```

---

### 현재 e2e 테스트 파일 현황

```
packages/frontend/e2e/tests/
├── home.spec.ts                    # ✅ Public (/)
├── auth.spec.ts                    # ⚠️ 혼재 (public /login + protected /admin)
├── courses.spec.ts                 # ✅ Public (/courses, /courses/:lang)
├── lesson.spec.ts                  # ⚠️ 잘못된 위치 (public인데 기본 page 사용 중)
├── standalone-quiz-ox.spec.ts      # ⚠️ 혼재 (비로그인 401 + 로그인 테스트)
├── standalone-quiz-report.spec.ts  # 🔒 Protected (/report)
└── full-flow.spec.ts              # ⚠️ 통합 테스트 (미확인)
```

---

### 문제점 정리

| 파일 | 문제 | 해결 방법 |
|------|------|----------|
| `lesson.spec.ts` | Public Route인데 테스트에서 기본 `page` fixture 사용 (올바름). 하지만 폴더 구조상 public 폴더에 있어야 명확 | `public/` 폴더로 이동 |
| `auth.spec.ts` | `/login` (public) + `/admin` (admin) 테스트 혼재 | 2개 파일로 분리:<br>- `public/auth-ui.spec.ts`<br>- `protected/admin-access.spec.ts` |
| `standalone-quiz-ox.spec.ts` | 비로그인 401 테스트 + 로그인 후 정상 테스트 혼재 | `protected/` 폴더로 이동<br>(Protected Route의 접근 제한 테스트 포함하므로 올바름) |
| `standalone-quiz-report.spec.ts` | Protected Route 테스트 | `protected/` 폴더로 이동 |

---

## 🎯 목표 구조

```
packages/frontend/e2e/tests/
├── public/                         # ✅ 로그인 불필요 (ProtectedRoute 없음)
│   ├── home.spec.ts               # / (HomePage)
│   ├── courses.spec.ts            # /courses, /courses/:lang (CoursesPage, LanguageCoursePage)
│   ├── lesson.spec.ts             # /courses/:lang/:chapterId/:lessonId (LessonPage) ⬅️ 이동
│   ├── auth-ui.spec.ts            # /login, /signup (AuthPage UI 테스트) ⬅️ 새로 생성
│   └── playground.spec.ts         # /playground (PlaygroundPage) - 추후 추가
│
└── protected/                      # 🔒 로그인 필요 (ProtectedRoute 감싸짐)
    ├── quiz-ox.spec.ts            # /quiz/ox/:lang (OXQuizPage) ⬅️ 이동 & 이름 변경
    ├── quiz-report.spec.ts        # /report (ReportPage) ⬅️ 이동 & 이름 변경
    └── admin-access.spec.ts       # /admin (AdminPage 접근 제한 테스트) ⬅️ 새로 생성
```

---

## 📋 상세 작업 계획

### Phase 1: 폴더 생성 및 파일 이동 (Git 히스토리 보존)

#### 1.1 폴더 생성

```bash
mkdir -p packages/frontend/e2e/tests/public
mkdir -p packages/frontend/e2e/tests/protected
```

#### 1.2 Public 폴더로 이동 (Git mv 사용)

```bash
# 현재 public인 테스트 파일 이동
git mv packages/frontend/e2e/tests/home.spec.ts packages/frontend/e2e/tests/public/
git mv packages/frontend/e2e/tests/courses.spec.ts packages/frontend/e2e/tests/public/
git mv packages/frontend/e2e/tests/lesson.spec.ts packages/frontend/e2e/tests/public/
```

**검증**:
- `lesson.spec.ts`가 기본 `page` fixture 사용 중인지 확인 ✅
- LessonPage import 경로 확인 (상대 경로 변경 필요 없음, `@/features/...` 사용 중)

#### 1.3 Protected 폴더로 이동

```bash
# 현재 protected인 테스트 파일 이동
git mv packages/frontend/e2e/tests/standalone-quiz-ox.spec.ts packages/frontend/e2e/tests/protected/quiz-ox.spec.ts
git mv packages/frontend/e2e/tests/standalone-quiz-report.spec.ts packages/frontend/e2e/tests/protected/quiz-report.spec.ts
```

**이름 변경 이유**:
- `standalone-` 접두사 제거 → 폴더 구조로 충분히 구분됨
- 더 간결하고 명확한 네이밍

---

### Phase 2: 파일 분리 (auth.spec.ts → 2개 파일)

#### 2.1 `public/auth-ui.spec.ts` 생성

**목적**: 로그인/회원가입 **UI 요소** 테스트 (비로그인 상태에서 접근 가능한 페이지)

**포함 내용** (현재 `auth.spec.ts`에서 추출):
```typescript
test.describe('AuthPage', () => {
  test('로그인 페이지 접근', ...);
  test('회원가입 페이지 접근', ...);
  test('OAuth 버튼 표시', ...);
  test('로그인 페이지 UI 요소', ...);
});

test.describe('Auth State', () => {
  test('로그아웃 상태에서 홈페이지', ...);
  test('로그아웃 상태에서 코스 접근 가능', ...);
});
```

**Fixture**: 기본 `page` (비로그인)

#### 2.2 `protected/admin-access.spec.ts` 생성

**목적**: Admin 페이지 **접근 제한** 테스트 (ProtectedRoute + AdminRoute)

**포함 내용** (현재 `auth.spec.ts`에서 추출):
```typescript
test.describe('Admin Route Access Control', () => {
  test('비로그인 시 Admin 페이지 접근 제한', async ({ page }) => {
    await page.goto('/admin');

    // 홈 또는 로그인 페이지로 리다이렉트 확인
    const url = page.url();
    expect(url).toMatch(/\/(login)?$/);
  });

  test('일반 사용자 로그인 후 Admin 페이지 접근 제한', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/admin');

    // role이 'admin'이 아니면 리다이렉트
    // (AdminRoute.tsx 로직에 따라 조정)
    const url = authenticatedPage.url();
    expect(url).toMatch(/\/(dashboard|profile)?$/);
  });

  test.skip('관리자 로그인 후 Admin 페이지 접근 가능', async ({ page }) => {
    // TODO: 관리자 role 모킹 필요
    // await mockFirebaseAuth(page, 'admin-user', { role: 'admin' });
    // await page.goto('/admin');
    // await expect(page).toHaveURL(/\/admin/);
  });
});
```

**Fixture**: `page` (비로그인) + `authenticatedPage` (일반 사용자)

#### 2.3 기존 `auth.spec.ts` 삭제

```bash
git rm packages/frontend/e2e/tests/auth.spec.ts
```

---

### Phase 3: Import 경로 및 Fixture 검증

#### 3.1 파일별 Fixture 사용 검증

| 파일 | 사용 Fixture | 올바름 여부 |
|------|-------------|-----------|
| `public/home.spec.ts` | `page` | ✅ |
| `public/courses.spec.ts` | `page` | ✅ |
| `public/lesson.spec.ts` | `page` | ✅ |
| `public/auth-ui.spec.ts` | `page` | ✅ (새로 생성) |
| `protected/quiz-ox.spec.ts` | `quizWithData`, `quizNoData`, `page` (401 테스트용) | ✅ |
| `protected/quiz-report.spec.ts` | `quizWithData`, `quizNoData` | ✅ |
| `protected/admin-access.spec.ts` | `page`, `authenticatedPage` | ✅ (새로 생성) |

#### 3.2 Import 경로 확인

**이동된 파일에서 상대 경로 변경 필요**:

```typescript
// Before (packages/frontend/e2e/tests/lesson.spec.ts)
import { test, expect } from '../fixtures/test-base';
import { LessonPage } from '../pages';

// After (packages/frontend/e2e/tests/public/lesson.spec.ts)
import { test, expect } from '../../fixtures/test-base';
import { LessonPage } from '../../pages';
```

**변경 필요 파일**:
- `public/home.spec.ts`: `../fixtures` → `../../fixtures`, `../pages` → `../../pages`
- `public/courses.spec.ts`: `../fixtures` → `../../fixtures`, `../pages` → `../../pages`
- `public/lesson.spec.ts`: `../fixtures` → `../../fixtures`, `../pages` → `../../pages`
- `protected/quiz-ox.spec.ts`: `../fixtures` → `../../fixtures`, `../pages` → `../../pages`
- `protected/quiz-report.spec.ts`: `../fixtures` → `../../fixtures`, `../pages` → `../../pages`

---

### Phase 4: Playwright Config 업데이트

#### 4.1 `playwright.config.ts` 확인

테스트 파일 경로가 변경되었으므로 config에서 테스트 디렉토리 설정 확인:

```typescript
// packages/frontend/playwright.config.ts
export default defineConfig({
  testDir: './e2e/tests',  // 이 설정은 하위 폴더도 자동으로 탐색하므로 변경 불필요

  // 또는 명시적으로 패턴 지정
  testMatch: '**/*.spec.ts',
});
```

**확인 사항**:
- `testDir`이 `./e2e/tests`로 설정되어 있으면 하위 폴더 자동 탐색
- `testMatch` 패턴이 `**/*.spec.ts`이면 문제없음

#### 4.2 테스트 실행 확인

```bash
# 전체 테스트 실행
pnpm --filter frontend test:e2e

# Public 테스트만 실행
pnpm --filter frontend test:e2e tests/public

# Protected 테스트만 실행
pnpm --filter frontend test:e2e tests/protected
```

---

### Phase 5: 문서화 및 커밋

#### 5.1 README 작성

**경로**: `packages/frontend/e2e/README.md`

```markdown
# E2E 테스트 구조

## 폴더 구조

### `tests/public/`
로그인이 **필요 없는** 페이지 테스트 (Public Routes)

- `home.spec.ts` - 홈페이지 (/)
- `courses.spec.ts` - 코스 목록 및 언어별 페이지 (/courses, /courses/:lang)
- `lesson.spec.ts` - 레슨 학습 페이지 (/courses/:lang/:chapterId/:lessonId)
- `auth-ui.spec.ts` - 로그인/회원가입 UI (/login, /signup)

**Fixture**: 기본 `page` (비로그인 상태)

### `tests/protected/`
로그인이 **필요한** 페이지 테스트 (Protected Routes)

- `quiz-ox.spec.ts` - OX 퀴즈 (/quiz/ox/:lang)
- `quiz-report.spec.ts` - 학습 리포트 (/report)
- `admin-access.spec.ts` - 관리자 페이지 접근 제한 (/admin)

**Fixture**: `authenticatedPage`, `quizWithData`, `quizNoData`

## Fixture 사용법

### 기본 `page` (비로그인)
```typescript
test('테스트', async ({ page }) => {
  await page.goto('/');
});
```

### `authenticatedPage` (로그인)
```typescript
test('테스트', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile');
});
```

### `quizWithData` (로그인 + 퀴즈 데이터 있음)
```typescript
test('테스트', async ({ quizWithData }) => {
  await quizWithData.goto('/quiz/ox/c');
});
```

## 테스트 실행

```bash
# 전체 실행
pnpm test:e2e

# Public 테스트만
pnpm test:e2e tests/public

# Protected 테스트만
pnpm test:e2e tests/protected

# 특정 파일
pnpm test:e2e tests/public/home.spec.ts
```
```

#### 5.2 커밋 메시지

```bash
git add .
git commit -m "refactor(e2e): Restructure tests into public/protected folders

BREAKING CHANGE: E2E test file locations have changed

- Move public route tests to tests/public/
  - home.spec.ts
  - courses.spec.ts
  - lesson.spec.ts (was incorrectly categorized)
  - auth-ui.spec.ts (split from auth.spec.ts)

- Move protected route tests to tests/protected/
  - quiz-ox.spec.ts (renamed from standalone-quiz-ox.spec.ts)
  - quiz-report.spec.ts (renamed from standalone-quiz-report.spec.ts)
  - admin-access.spec.ts (split from auth.spec.ts)

- Split auth.spec.ts into:
  - public/auth-ui.spec.ts (login/signup UI tests)
  - protected/admin-access.spec.ts (admin route access control)

WHY:
- Clarify which tests require authentication
- Improve test organization and maintainability
- Align with actual router.tsx structure (ProtectedRoute usage)

Refs: router.tsx L66-102, ProtectedRoute.tsx
"
```

---

## ✅ 체크리스트

### Phase 1: 폴더 생성 및 파일 이동
- [ ] `mkdir -p packages/frontend/e2e/tests/public`
- [ ] `mkdir -p packages/frontend/e2e/tests/protected`
- [ ] `git mv` 로 public 파일 이동 (home, courses, lesson)
- [ ] `git mv` 로 protected 파일 이동 (quiz-ox, quiz-report)

### Phase 2: 파일 분리
- [ ] `public/auth-ui.spec.ts` 생성 (auth.spec.ts에서 추출)
- [ ] `protected/admin-access.spec.ts` 생성 (auth.spec.ts에서 추출)
- [ ] `git rm packages/frontend/e2e/tests/auth.spec.ts`

### Phase 3: Import 경로 수정
- [ ] `public/home.spec.ts` import 경로 수정 (`../` → `../../`)
- [ ] `public/courses.spec.ts` import 경로 수정
- [ ] `public/lesson.spec.ts` import 경로 수정
- [ ] `public/auth-ui.spec.ts` import 경로 확인 (새로 생성)
- [ ] `protected/quiz-ox.spec.ts` import 경로 수정
- [ ] `protected/quiz-report.spec.ts` import 경로 수정
- [ ] `protected/admin-access.spec.ts` import 경로 확인 (새로 생성)

### Phase 4: Playwright Config
- [ ] `playwright.config.ts` 확인 (testDir, testMatch)
- [ ] `pnpm test:e2e` 전체 테스트 실행 확인
- [ ] `pnpm test:e2e tests/public` 실행 확인
- [ ] `pnpm test:e2e tests/protected` 실행 확인

### Phase 5: 문서화 및 커밋
- [ ] `packages/frontend/e2e/README.md` 작성
- [ ] Git 커밋 (메시지 위 참고)
- [ ] 변경사항 푸시

### Phase 6: 검증
- [ ] 모든 public 테스트 통과 확인
- [ ] 모든 protected 테스트 통과 확인
- [ ] CI/CD 파이프라인 확인 (있는 경우)

---

## 🔮 향후 개선 사항

### 추가 테스트 파일 작성
- [ ] `public/playground.spec.ts` (PlaygroundPage - /playground)
- [ ] `protected/quiz-multiple-choice.spec.ts` (MultipleChoiceQuizPage)
- [ ] `protected/quiz-fill-blank.spec.ts` (FillBlankQuizPage)
- [ ] `protected/profile.spec.ts` (ProfilePage)
- [ ] `protected/dashboard.spec.ts` (DashboardPage)

### AdminRoute 모킹 개선
- [ ] `auth-mock.ts`에 `mockFirebaseAuth(page, userId, { role: 'admin' })` 파라미터 추가
- [ ] `protected/admin-access.spec.ts`에서 관리자 로그인 테스트 활성화

### CI/CD 통합
- [ ] GitHub Actions에서 public/protected 테스트 병렬 실행
- [ ] 테스트 실패 시 스크린샷 아티팩트 저장

---

## 📚 참고 자료

- **Router 설정**: `packages/frontend/src/router.tsx` L61-105
- **ProtectedRoute**: `packages/frontend/src/components/ProtectedRoute.tsx`
- **AdminRoute**: `packages/frontend/src/features/admin/AdminRoute.tsx` (추정)
- **Auth Mock**: `packages/frontend/e2e/fixtures/auth-mock.ts`
- **Test Base**: `packages/frontend/e2e/fixtures/test-base.ts`

---

**계획 승인 후 작업 시작!** ✅
