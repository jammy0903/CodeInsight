# E2E 테스트 가이드

CodeInsight 프론트엔드 End-to-End 테스트 문서입니다.

---

## 📂 폴더 구조

```
e2e/
├── tests/
│   ├── public/              # ✅ 로그인 불필요 (Public Routes)
│   │   ├── home.spec.ts
│   │   ├── courses.spec.ts
│   │   ├── lesson.spec.ts
│   │   └── auth-ui.spec.ts
│   └── protected/           # 🔒 로그인 필요 (Protected Routes)
│       ├── quiz-ox.spec.ts
│       ├── quiz-report.spec.ts
│       └── admin-access.spec.ts
├── pages/                   # Page Object Model
├── fixtures/                # 테스트 Fixture (auth, quiz 모킹)
└── utils/                   # 유틸리티 함수
```

---

## 🎯 테스트 분류

### `tests/public/` - Public Routes (로그인 불필요)

비로그인 상태에서도 접근 가능한 페이지 테스트입니다.
`router.tsx`에서 `ProtectedRoute`로 감싸지지 않은 라우트들입니다.

| 파일 | 테스트 대상 | 라우트 |
|------|------------|--------|
| `home.spec.ts` | 홈페이지 | `/` |
| `courses.spec.ts` | 코스 목록, 언어별 페이지 | `/courses`, `/courses/:lang` |
| `lesson.spec.ts` | 레슨 학습 페이지 | `/courses/:lang/:chapterId/:lessonId` |
| `auth-ui.spec.ts` | 로그인/회원가입 UI | `/login`, `/signup` |

**사용 Fixture**: `page` (비로그인 상태)

```typescript
test('테스트 이름', async ({ page }) => {
  await page.goto('/');
  // ...
});
```

---

### `tests/protected/` - Protected Routes (로그인 필요)

로그인한 사용자만 접근 가능한 페이지 테스트입니다.
`router.tsx`에서 `<ProtectedRoute>` 또는 `<AdminRoute>`로 감싼 라우트들입니다.

| 파일 | 테스트 대상 | 라우트 | Auth 레벨 |
|------|------------|--------|----------|
| `quiz-ox.spec.ts` | OX 퀴즈 | `/quiz/ox/:lang` | ProtectedRoute |
| `quiz-report.spec.ts` | 학습 리포트 | `/report` | ProtectedRoute |
| `admin-access.spec.ts` | 관리자 페이지 접근 제한 | `/admin` | AdminRoute |

**사용 Fixture**: `authenticatedPage`, `quizWithData`, `quizNoData`

```typescript
// 일반 로그인 사용자
test('테스트 이름', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/profile');
  // ...
});

// 퀴즈 데이터가 있는 사용자
test('테스트 이름', async ({ quizWithData }) => {
  await quizWithData.goto('/quiz/ox/c');
  // ...
});
```

---

## 🧪 Fixture 사용법

### 기본 Fixture (test-base.ts)

| Fixture | 설명 | 사용 시나리오 |
|---------|------|-------------|
| `page` | 비로그인 상태 | Public routes 테스트 |
| `authenticatedPage` | 일반 사용자 로그인 | Protected routes 테스트 |
| `quizWithData` | 로그인 + 퀴즈 데이터 있음 | 퀴즈/리포트 정상 플로우 |
| `quizNoData` | 로그인 + 퀴즈 데이터 없음 | 빈 상태(Empty State) 테스트 |

### 예시 코드

```typescript
// public/home.spec.ts (비로그인)
import { test, expect } from '../../fixtures/test-base';

test('홈페이지 로드', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/CodeInsight/i);
});

// protected/quiz-ox.spec.ts (로그인 + 데이터)
import { test, expect } from '../../fixtures/test-base';
import { OXQuizPage } from '../../pages';

test('퀴즈 풀기', async ({ quizWithData }) => {
  const oxQuizPage = new OXQuizPage(quizWithData);
  await oxQuizPage.goto('c');
  // ...
});
```

---

## 🚀 테스트 실행

### 전체 테스트 실행

```bash
pnpm --filter frontend test:e2e
```

### Public 테스트만 실행

```bash
pnpm --filter frontend test:e2e tests/public
```

### Protected 테스트만 실행

```bash
pnpm --filter frontend test:e2e tests/protected
```

### 특정 파일 실행

```bash
pnpm --filter frontend test:e2e tests/public/home.spec.ts
```

### 헤드리스 모드 비활성화 (UI 확인)

```bash
pnpm --filter frontend test:e2e --headed
```

### 디버그 모드

```bash
pnpm --filter frontend test:e2e --debug
```

---

## 📝 테스트 작성 가이드

### 1. 새로운 테스트 파일 추가 시

#### Public Route 테스트 추가

```typescript
// tests/public/playground.spec.ts
import { test, expect } from '../../fixtures/test-base';

test.describe('PlaygroundPage - Public Route', () => {
  test('페이지 로드', async ({ page }) => {
    await page.goto('/playground');
    await expect(page).toHaveURL(/\/playground/);
  });
});
```

#### Protected Route 테스트 추가

```typescript
// tests/protected/profile.spec.ts
import { test, expect } from '../../fixtures/test-base';

test.describe('ProfilePage - Protected Route', () => {
  test('로그인 후 프로필 페이지 접근', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    await expect(authenticatedPage).toHaveURL(/\/profile/);
  });
});
```

### 2. 라우트 권한 확인 방법

**`router.tsx` 확인:**

```typescript
// Public Route
{ path: 'courses', element: <CoursesPage /> },

// Protected Route
{ path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },

// Admin Route
{ path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
```

- `ProtectedRoute` 없음 → `tests/public/` 폴더에 추가
- `<ProtectedRoute>` 감싸짐 → `tests/protected/` 폴더에 추가

### 3. 네이밍 규칙

- **파일명**: `kebab-case.spec.ts` (예: `quiz-ox.spec.ts`)
- **describe 블록**: 페이지명 + 테스트 범위 (예: `OX Quiz - Happy Path`)
- **test 이름**: 명확한 동작 설명 (예: `챕터 선택 → 10문제 풀이 → 결과 확인`)

---

## 🔧 트러블슈팅

### 테스트 실패 시 디버깅

1. **스크린샷 확인**
   ```bash
   # test-results/ 폴더에 자동 저장
   ls test-results/
   ```

2. **헤드풀 모드로 실행**
   ```bash
   pnpm test:e2e --headed
   ```

3. **Playwright Inspector 사용**
   ```bash
   pnpm test:e2e --debug
   ```

### 자주 발생하는 문제

#### 1. "Timeout 30000ms exceeded"
```typescript
// 타임아웃 늘리기
await page.waitForSelector('selector', { timeout: 60000 });

// 또는 테스트 레벨에서
test.setTimeout(60000);
```

#### 2. "Element is not visible"
```typescript
// 요소가 보일 때까지 대기
await page.locator('selector').waitFor({ state: 'visible' });
```

#### 3. "Navigation timeout"
```typescript
// 네비게이션 타임아웃 늘리기
await page.goto('/path', { timeout: 60000 });
```

---

## 📚 참고 자료

- **Playwright 문서**: https://playwright.dev/
- **프로젝트 Router 설정**: `packages/frontend/src/router.tsx`
- **ProtectedRoute**: `packages/frontend/src/components/ProtectedRoute.tsx`
- **Auth Mock**: `packages/frontend/e2e/fixtures/auth-mock.ts`
- **Quiz Mock**: `packages/frontend/e2e/fixtures/quiz-mock.ts`

---

## ✅ 체크리스트

### 테스트 작성 전
- [ ] `router.tsx`에서 라우트 권한 확인 (Public vs Protected)
- [ ] 필요한 Fixture 파악 (page, authenticatedPage, quizWithData 등)
- [ ] 테스트할 주요 시나리오 목록 작성

### 테스트 작성 후
- [ ] Public/Protected 폴더에 올바르게 배치
- [ ] 모든 테스트 통과 확인 (`pnpm test:e2e`)
- [ ] 스크린샷 확인 (필요 시)
- [ ] 커밋 전 린트 확인

---

**문서 작성일**: 2026-01-28
**마지막 업데이트**: 2026-01-28
