# 새 페이지 추가 가이드

> CodeInsight Monorepo 구조에서 새 페이지를 추가하는 방법

## ⚠️ Monorepo 환경 주의사항

- **패키지 매니저**: `pnpm` 사용 (npm ❌)
- **패키지명**: `@codeinsight/frontend`, `@codeinsight/backend`, `@codeinsight/shared`
- **빌드**: `pnpm --filter @codeinsight/frontend run build`
- **경로**: 모든 경로는 `packages/` prefix 포함

## 📁 디렉토리 구조

```
packages/frontend/src/
├── features/           # Feature 모듈 (페이지별)
│   ├── home/          # 홈 페이지
│   ├── auth/          # 인증 페이지 (로그인/회원가입)
│   ├── courses/       # 코스 페이지
│   └── [new-feature]/ # 새 페이지
├── router.tsx         # 라우트 설정
└── ...
```

---

## ✅ 페이지 추가 4단계

### 1️⃣ Feature 폴더 생성

```bash
mkdir packages/frontend/src/features/[페이지명]
```

**예시:**
```bash
mkdir packages/frontend/src/features/auth
```

---

### 2️⃣ 페이지 컴포넌트 작성

`features/[페이지명]/[페이지명]Page.tsx`

**기본 템플릿:**
```tsx
/**
 * [페이지명]Page - 설명
 */

import { motion } from 'framer-motion';

export default function [페이지명]Page() {
  return (
    <div className="min-h-screen px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-bold text-text">
          페이지 타이틀
        </h1>
        <p className="text-text-secondary">
          페이지 설명
        </p>
      </motion.div>
    </div>
  );
}
```

**실제 예시 (LoginPage.tsx):**
```tsx
/**
 * LoginPage - 로그인 페이지
 * Firebase 소셜 로그인 (Google, GitHub, Kakao)
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { loginWithGoogle } from '@/services/firebase';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    navigate('/courses');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.button onClick={handleGoogleLogin}>
        Google로 로그인
      </motion.button>
    </div>
  );
}
```

---

### 3️⃣ index.ts Export 파일 작성

`features/[페이지명]/index.ts`

```typescript
/**
 * [Feature명] Feature Module
 */

export { default as [페이지명]Page } from './[페이지명]Page';
```

**예시:**
```typescript
/**
 * Auth Feature Module
 */

export { default as LoginPage } from './LoginPage';
export { default as SignupPage } from './SignupPage';
```

---

### 4️⃣ router.tsx에 라우트 추가

**A. Import 추가**

```typescript
import { [페이지명]Page } from './features/[페이지명]';
```

**B. 라우트 배열에 추가**

```typescript
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '[경로]', element: <[페이지명]Page /> },  // 추가
      // ... 기존 라우트들
    ],
  },
]);
```

**실제 예시:**
```typescript
// 1. Import
import { LoginPage } from './features/auth';

// 2. Route 추가
children: [
  { index: true, element: <HomePage /> },
  { path: 'login', element: <LoginPage /> },  // 추가
  { path: 'courses', element: <CoursesPage /> },
]
```

---

## 🎯 복잡도별 구조

### 간단한 페이지 (예: home, auth)

```
features/auth/
├── LoginPage.tsx
└── index.ts
```

### 복잡한 페이지 (예: courses)

**실제 courses 구조 (2026-01-04 기준):**
```
features/courses/
├── CoursesPage.tsx       # 언어 선택 페이지
├── ChaptersPage.tsx      # 챕터 목록 페이지
├── LessonsPage.tsx       # 레슨 목록 페이지
├── LessonPage.tsx        # 레슨 학습 페이지 (메인)
├── components/           # 하위 컴포넌트
│   ├── day/              # 레슨 학습 컴포넌트
│   │   ├── CodeViewer.tsx
│   │   ├── StepControls.tsx
│   │   ├── StepExplanation.tsx
│   │   └── SelectedCodeBadge.tsx
│   └── memory/           # 메모리 시각화
│       └── CourseMemoryView.tsx
├── hooks/                # 커스텀 훅
│   ├── useCodeSelection.ts
│   ├── useLessonMemory.ts
│   └── useLessonNavigation.ts
├── types.ts              # 타입 정의
└── index.ts              # Public exports
```

---

## ✅ 빌드 & 검증

**Monorepo 환경에서 빌드 방법:**

```bash
# 방법 1: Root에서 특정 패키지만 빌드 (권장)
pnpm --filter @codeinsight/frontend run build

# 방법 2: Root에서 전체 빌드 (shared 포함)
pnpm run build

# 방법 3: 패키지 디렉토리에서 (pnpm 사용)
cd packages/frontend
pnpm run build
```

**성공 시 출력:**
```
vite v7.2.4 building for production...
✓ built in 13.81s
```

**실패 시:**
- Import 에러 → router.tsx import 확인
- Type 에러 → 컴포넌트 타입 정의 확인
- Path alias 에러 → vite.config.ts의 @ alias 확인

---

## 🚀 실전 예시: 로그인 페이지 추가

### 1. 폴더 생성
```bash
mkdir packages/frontend/src/features/auth
```

### 2. LoginPage.tsx 작성
```tsx
// packages/frontend/src/features/auth/LoginPage.tsx
export default function LoginPage() {
  return <div>로그인 페이지</div>;
}
```

### 3. index.ts 작성
```typescript
// packages/frontend/src/features/auth/index.ts
export { default as LoginPage } from './LoginPage';
```

### 4. router.tsx 수정
```typescript
// A. Import 추가
import { LoginPage } from './features/auth';

// B. 라우트 추가
{ path: 'login', element: <LoginPage /> }
```

### 5. 빌드
```bash
# Root에서 실행 (권장)
pnpm --filter @codeinsight/frontend run build

# 또는 packages/frontend에서
cd packages/frontend
pnpm run build
```

### 6. 확인
- ✅ 빌드 성공 (`✓ built in XXs`)
- ✅ `/login` 경로로 접근 가능
- ✅ 타입 에러 없음

---

## 📌 체크리스트

- [ ] `features/[페이지명]/` 폴더 생성
- [ ] `[페이지명]Page.tsx` 컴포넌트 작성
- [ ] `index.ts` export 파일 작성
- [ ] `router.tsx`에 import 추가
- [ ] `router.tsx`에 라우트 추가
- [ ] `pnpm --filter @codeinsight/frontend run build` 성공 확인
- [ ] 타입 에러 없는지 확인 (`tsc -b`)
- [ ] `/[경로]`로 브라우저 접근 테스트

---

## 🎨 스타일링 가이드

### 기본 클래스

```tsx
<div className="min-h-screen px-6">           {/* 전체 페이지 */}
  <h1 className="text-4xl font-bold text-text">{/* 제목 */}
  <p className="text-text-secondary">          {/* 부제목 */}
  <button className="btn-primary">            {/* 주요 버튼 */}
  <button className="btn-secondary">          {/* 보조 버튼 */}
</div>
```

### 애니메이션 (Framer Motion)

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* 콘텐츠 */}
</motion.div>
```

---

## 🔗 참고

### 파일 예시
- **간단한 페이지**: `features/home/HomePage.tsx`
- **복잡한 구조**: `features/courses/` (4개 페이지 + components + hooks)
- **라우터 설정**: `src/router.tsx`
- **스타일 가이드**: `src/index.css`

### Monorepo 구조
- **Frontend**: `packages/frontend/` (React + Vite)
- **Backend**: `packages/backend/` (Express + Prisma)
- **Shared**: `packages/shared/` (Types + Zod schemas)

### 중요 설정 파일
- **Path Alias**: `packages/frontend/vite.config.ts` (@/ → src/)
- **API 버전**: `packages/frontend/.env` (VITE_API_VERSION=v1)
- **타입 공유**: `packages/shared/src/index.ts`

### Backend API 호출 시
- API 기본 경로: `/api/v1` (버저닝 적용됨)
- 예시: `axios.get('/courses/languages')` → `http://localhost:3002/api/v1/courses/languages`
- 레거시 `/api/*` → 자동으로 `/api/v1/*`으로 301 리다이렉트

### 개발 서버 실행
```bash
# Root에서 전체 실행
./start-dev.sh

# Backend만
cd packages/backend && pnpm run dev

# Frontend만
cd packages/frontend && pnpm run dev
```

---

## 📝 변경 이력

### 2026-01-04 (Phase 3 리팩토링 반영)
- ✅ **Monorepo 전환**: npm → pnpm workspace
- ✅ **빌드 명령어**: `pnpm --filter @codeinsight/frontend run build`
- ✅ **courses 구조**: 실제 4개 페이지 + day/memory 컴포넌트 구조 반영
- ✅ **API 버저닝**: `/api/v1` 경로 안내 추가
- ✅ **참고 섹션**: Monorepo 구조, 설정 파일, 개발 서버 실행 추가
