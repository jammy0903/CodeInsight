# CodeInsight 국제화 (i18n: ko/en) 실행 계획서

**작성일**: 2026-01-28
**프로젝트**: CodeInsight (코드 원리 학습 플랫폼)
**목표**: 한국어/영어 다국어 지원 및 확장 가능한 국제화 인프라 구축

---

## 📋 목차

1. [목표](#1-목표)
2. [핵심 전략](#2-핵심-전략)
3. [사전 준비](#3-사전-준비)
4. [Phase 1: 인프라 구축](#phase-1-인프라-구축-완료)
5. [Phase 2: TypeScript 타입 안정성](#phase-2-typescript-타입-안정성)
6. [Phase 3: 번역 파일 구조화](#phase-3-번역-파일-구조화)
7. [Phase 4: 컴포넌트 리팩토링](#phase-4-컴포넌트-리팩토링)
8. [Phase 5: 언어 전환 UI](#phase-5-언어-전환-ui)
9. [Phase 6: 고도화](#phase-6-고도화-선택)
10. [Phase 7: 테스트 & 검증](#phase-7-테스트--검증)
11. [체크리스트](#-체크리스트)

---

## 1. 목표

CodeInsight 애플리케이션의 사용자 인터페이스(UI)를 한국어와 영어 두 가지 언어로 제공할 수 있도록 국제화(Internationalization, i18n) 기반을 구축합니다. 이를 통해 향후 다른 언어로의 확장이 용이한 구조를 만듭니다.

### 핵심 목표

- ✅ 사용자가 한국어/영어 간 자유롭게 전환 가능
- ✅ 브라우저 언어 설정 자동 감지
- ✅ TypeScript 타입 안정성 보장 (자동완성, 오타 방지)
- ✅ 확장 가능한 번역 파일 구조
- ✅ 테스트 자동화

---

## 2. 핵심 전략

### 기술 스택

| 라이브러리 | 용도 | 버전 |
|-----------|------|------|
| `i18next` | 국제화 핵심 로직 | ^25.8.0 |
| `react-i18next` | React hooks 및 컴포넌트 | ^16.5.4 |
| `i18next-browser-languagedetector` | 브라우저 언어 자동 감지 | ^8.2.0 |

### 설계 원칙

1. **텍스트 분리**: 코드 내 하드코딩 금지, 모든 UI 텍스트는 JSON으로 관리
2. **네임스페이스 구조화**: 페이지/기능별로 번역 파일 분리 (common, home, courses 등)
3. **타입 안정성**: TypeScript를 통한 번역 키 자동완성 및 오타 방지
4. **사용자 경험**: 언어 전환 시 즉시 반영, localStorage에 설정 저장
5. **확장성**: 새로운 언어 추가 시 최소한의 작업으로 지원

---

## 3. 사전 준비

### 3.1 현재 상태 확인

```bash
# 라이브러리 설치 확인
grep "i18next\|react-i18next" packages/frontend/package.json

# 디렉토리 구조 확인
ls -la packages/frontend/src/locales/
ls -la packages/frontend/src/i18n.ts
```

### 3.2 설치된 항목 (✅ 완료)

- [x] `i18next` ^25.8.0
- [x] `react-i18next` ^16.5.4
- [x] `i18next-browser-languagedetector` ^8.2.0
- [x] `packages/frontend/src/locales/en/translation.json`
- [x] `packages/frontend/src/locales/ko/translation.json`
- [x] `packages/frontend/src/i18n.ts`
- [x] `packages/frontend/src/main.tsx` (import './i18n' 완료)

---

## Phase 1: 인프라 구축 (✅ 완료)

### 1.1 의존성 설치

```bash
# 프로젝트 루트에서 실행
pnpm --filter @codeinsight/frontend add i18next react-i18next i18next-browser-languagedetector

# 또는 짧은 버전
pnpm --filter frontend add i18next react-i18next i18next-browser-languagedetector
```

### 1.2 디렉토리 구조 생성

```
packages/frontend/src/
├── locales/
│   ├── en/
│   │   └── translation.json
│   └── ko/
│       └── translation.json
└── i18n.ts
```

### 1.3 i18n.ts 초기 설정 (✅ 완료)

```typescript
// packages/frontend/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import koTranslation from './locales/ko/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  ko: {
    translation: koTranslation,
  },
};

i18n
  .use(LanguageDetector) // 브라우저 언어 감지
  .use(initReactI18next) // react-i18next 초기화
  .init({
    resources,
    fallbackLng: 'en', // 지원되지 않는 언어일 경우 영어로 표시
    interpolation: {
      escapeValue: false, // React는 이미 XSS 방어 기능이 있으므로 false로 설정
    },
    debug: import.meta.env.DEV, // Vite 환경변수 사용
  });

export default i18n;
```

### 1.4 애플리케이션 진입점 적용 (✅ 완료)

```typescript
// packages/frontend/src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { router } from './router'
import { queryClient } from './config/queryClient'
import './index.css'
import './i18n' // ✅ i18n 설정 파일 임포트
import { useStore } from './stores/store'
import { auth } from './services/firebase'

// ... (나머지 코드)
```

---

## Phase 2: TypeScript 타입 안정성

### 2.1 타입 확장 파일 생성

```typescript
// packages/frontend/src/types/i18next.d.ts (새로 생성)
import 'react-i18next';

// TypeScript에 번역 리소스 타입 알려주기
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof import('../locales/en/translation.json');
    };
  }
}
```

### 2.2 효과

```typescript
// ✅ 자동완성 지원
const { t } = useTranslation();
t('common.login'); // 자동완성 목록에 표시됨

// ❌ TypeScript 에러 발생
t('typo_key'); // Error: Argument of type '"typo_key"' is not assignable...
```

### 2.3 tsconfig.json 확인

```json
// packages/frontend/tsconfig.json
{
  "compilerOptions": {
    // ...
    "types": ["vite/client"]
  },
  "include": [
    "src/**/*",
    "src/types/**/*.d.ts" // ✅ 타입 정의 파일 포함
  ]
}
```

---

## Phase 3: 번역 파일 구조화

### 3.1 네임스페이스 기반 구조

```
packages/frontend/src/locales/
├── en/
│   ├── common.json        # 공통 (버튼, 에러 메시지 등)
│   ├── home.json          # 홈페이지
│   ├── courses.json       # 코스 목록
│   ├── lesson.json        # 레슨 학습
│   ├── quiz.json          # 퀴즈
│   ├── profile.json       # 프로필
│   ├── report.json        # 리포트
│   └── admin.json         # 관리자
└── ko/
    ├── common.json
    ├── home.json
    ├── courses.json
    ├── lesson.json
    ├── quiz.json
    ├── profile.json
    ├── report.json
    └── admin.json
```

### 3.2 common.json 예시

```json
// packages/frontend/src/locales/en/common.json
{
  "site_name": "CodeInsight",
  "site_description": "Learn Code Fundamentals with Interactive Visualizations",

  "nav": {
    "home": "Home",
    "courses": "Courses",
    "playground": "Playground",
    "quiz": "Quiz",
    "profile": "Profile",
    "report": "Report",
    "admin": "Admin"
  },

  "auth": {
    "login": "Login",
    "logout": "Logout",
    "signup": "Sign Up",
    "email": "Email",
    "password": "Password"
  },

  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "submit": "Submit",
    "next": "Next",
    "prev": "Previous",
    "back": "Back",
    "close": "Close"
  },

  "messages": {
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!",
    "no_data": "No data available"
  },

  "languages": {
    "korean": "한국어",
    "english": "English"
  }
}
```

```json
// packages/frontend/src/locales/ko/common.json
{
  "site_name": "CodeInsight",
  "site_description": "인터랙티브 시각화로 배우는 코드 원리",

  "nav": {
    "home": "홈",
    "courses": "코스",
    "playground": "플레이그라운드",
    "quiz": "퀴즈",
    "profile": "프로필",
    "report": "리포트",
    "admin": "관리자"
  },

  "auth": {
    "login": "로그인",
    "logout": "로그아웃",
    "signup": "회원가입",
    "email": "이메일",
    "password": "비밀번호"
  },

  "actions": {
    "save": "저장",
    "cancel": "취소",
    "delete": "삭제",
    "edit": "수정",
    "submit": "제출",
    "next": "다음",
    "prev": "이전",
    "back": "뒤로",
    "close": "닫기"
  },

  "messages": {
    "loading": "로딩 중...",
    "error": "오류가 발생했습니다",
    "success": "성공!",
    "no_data": "데이터가 없습니다"
  },

  "languages": {
    "korean": "한국어",
    "english": "English"
  }
}
```

### 3.3 home.json 예시

```json
// packages/frontend/src/locales/en/home.json
{
  "hero": {
    "title": "Learn Code Fundamentals",
    "subtitle": "Visualize memory, execution flow, and data structures",
    "cta": "Start Learning"
  },
  "features": {
    "visual": {
      "title": "Visual Learning",
      "description": "See how code executes step by step"
    },
    "interactive": {
      "title": "Interactive",
      "description": "Write and test code in real-time"
    },
    "multilang": {
      "title": "Multi-Language",
      "description": "Support for C, Java, Python, JavaScript"
    }
  }
}
```

```json
// packages/frontend/src/locales/ko/home.json
{
  "hero": {
    "title": "코드 원리를 배우다",
    "subtitle": "메모리, 실행 흐름, 자료구조를 시각화하여 학습",
    "cta": "학습 시작하기"
  },
  "features": {
    "visual": {
      "title": "시각적 학습",
      "description": "코드가 단계별로 실행되는 과정을 확인"
    },
    "interactive": {
      "title": "인터랙티브",
      "description": "실시간으로 코드 작성 및 테스트"
    },
    "multilang": {
      "title": "다중 언어",
      "description": "C, Java, Python, JavaScript 지원"
    }
  }
}
```

### 3.4 i18n.ts 업데이트 (네임스페이스 지원)

```typescript
// packages/frontend/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 영어 번역 파일
import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enCourses from './locales/en/courses.json';
import enLesson from './locales/en/lesson.json';
import enQuiz from './locales/en/quiz.json';
import enProfile from './locales/en/profile.json';
import enReport from './locales/en/report.json';
import enAdmin from './locales/en/admin.json';

// 한국어 번역 파일
import koCommon from './locales/ko/common.json';
import koHome from './locales/ko/home.json';
import koCourses from './locales/ko/courses.json';
import koLesson from './locales/ko/lesson.json';
import koQuiz from './locales/ko/quiz.json';
import koProfile from './locales/ko/profile.json';
import koReport from './locales/ko/report.json';
import koAdmin from './locales/ko/admin.json';

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    courses: enCourses,
    lesson: enLesson,
    quiz: enQuiz,
    profile: enProfile,
    report: enReport,
    admin: enAdmin,
  },
  ko: {
    common: koCommon,
    home: koHome,
    courses: koCourses,
    lesson: koLesson,
    quiz: koQuiz,
    profile: koProfile,
    report: koReport,
    admin: koAdmin,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common', // 기본 네임스페이스
    interpolation: {
      escapeValue: false,
    },
    debug: import.meta.env.DEV,
  });

export default i18n;
```

### 3.5 TypeScript 타입 업데이트

```typescript
// packages/frontend/src/types/i18next.d.ts
import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      common: typeof import('../locales/en/common.json');
      home: typeof import('../locales/en/home.json');
      courses: typeof import('../locales/en/courses.json');
      lesson: typeof import('../locales/en/lesson.json');
      quiz: typeof import('../locales/en/quiz.json');
      profile: typeof import('../locales/en/profile.json');
      report: typeof import('../locales/en/report.json');
      admin: typeof import('../locales/en/admin.json');
    };
  }
}
```

---

## Phase 4: 컴포넌트 리팩토링

### 4.1 기본 사용법

```tsx
// Before: 하드코딩
function Header() {
  return (
    <nav>
      <a href="/">홈</a>
      <a href="/courses">코스</a>
      <button>로그인</button>
    </nav>
  );
}

// After: i18n 적용
import { useTranslation } from 'react-i18next';

function Header() {
  const { t } = useTranslation('common'); // 네임스페이스 지정

  return (
    <nav>
      <a href="/">{t('nav.home')}</a>
      <a href="/courses">{t('nav.courses')}</a>
      <button>{t('auth.login')}</button>
    </nav>
  );
}
```

### 4.2 다중 네임스페이스 사용

```tsx
// HomePage.tsx
import { useTranslation } from 'react-i18next';

function HomePage() {
  const { t } = useTranslation(['home', 'common']);

  return (
    <div>
      <h1>{t('home:hero.title')}</h1>
      <p>{t('home:hero.subtitle')}</p>
      <button>{t('home:hero.cta')}</button>

      <footer>{t('common:site_description')}</footer>
    </div>
  );
}
```

### 4.3 동적 값 삽입 (Interpolation)

```json
// en/quiz.json
{
  "progress": "Question {{current}} of {{total}}",
  "score": "Your score: {{score}}%"
}
```

```tsx
function QuizProgress() {
  const { t } = useTranslation('quiz');

  return (
    <div>
      <p>{t('progress', { current: 3, total: 10 })}</p>
      {/* 출력: "Question 3 of 10" */}

      <p>{t('score', { score: 85 })}</p>
      {/* 출력: "Your score: 85%" */}
    </div>
  );
}
```

### 4.4 복수형 처리 (Pluralization)

```json
// en/courses.json
{
  "lesson_count": "{{count}} lesson",
  "lesson_count_plural": "{{count}} lessons"
}
```

```tsx
function ChapterCard({ lessonCount }: { lessonCount: number }) {
  const { t } = useTranslation('courses');

  return <p>{t('lesson_count', { count: lessonCount })}</p>;
  // count=1: "1 lesson"
  // count=5: "5 lessons"
}
```

### 4.5 리팩토링 우선순위

#### P0: 공통 컴포넌트 (필수)
- [ ] `MainLayout.tsx` - 네비게이션 메뉴
- [ ] `Header.tsx` - 사이트 타이틀, 로그인 버튼
- [ ] `Footer.tsx` - 푸터 텍스트
- [ ] `Button.tsx` - 공통 버튼 (저장, 취소 등)
- [ ] `Toast.tsx` - 알림 메시지

#### P1: 주요 페이지 (중요)
- [ ] `HomePage.tsx` - 히어로 섹션, 기능 소개
- [ ] `CoursesPage.tsx` - 코스 목록, 언어 카드
- [ ] `LessonPage.tsx` - 레슨 학습, 스텝 컨트롤
- [ ] `OXQuizPage.tsx` - 퀴즈 문제, 정답/오답 피드백
- [ ] `ReportPage.tsx` - 학습 리포트, 통계

#### P2: 부가 기능 (선택)
- [ ] `ProfilePage.tsx` - 프로필 설정
- [ ] `DashboardPage.tsx` - 대시보드
- [ ] `AdminPage.tsx` - 관리자 페이지
- [ ] `PlaygroundPage.tsx` - 플레이그라운드

---

## Phase 5: 언어 전환 UI

### 5.1 LanguageSwitcher 컴포넌트 생성

```tsx
// packages/frontend/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation('common');

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    // localStorage에 저장 (LanguageDetector가 자동 처리)
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4" />
      <select
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="bg-transparent border rounded px-2 py-1"
        aria-label="언어 선택"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### 5.2 드롭다운 버전 (고급)

```tsx
// packages/frontend/src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LANGUAGES = [
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = LANGUAGES.find((lang) => lang.code === i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="w-4 h-4 mr-2" />
          {currentLang?.flag} {currentLang?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className={i18n.language === lang.code ? 'bg-accent' : ''}
          >
            {lang.flag} {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5.3 Header에 통합

```tsx
// packages/frontend/src/layouts/MainLayout.tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation('common');

  return (
    <div>
      <header className="flex items-center justify-between p-4">
        <h1>{t('site_name')}</h1>

        <nav className="flex items-center gap-4">
          <a href="/">{t('nav.home')}</a>
          <a href="/courses">{t('nav.courses')}</a>

          {/* 언어 전환 드롭다운 */}
          <LanguageSwitcher />

          <button>{t('auth.login')}</button>
        </nav>
      </header>

      <main>{children}</main>
    </div>
  );
}
```

---

## Phase 6: 고도화 (선택)

### 6.1 날짜/숫자 포맷

```typescript
// packages/frontend/src/utils/formatters.ts
import { format } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';

const localeMap = {
  ko,
  en: enUS,
};

export function formatDate(date: Date, language: string, formatStr: string = 'PPP') {
  const locale = localeMap[language as keyof typeof localeMap] || enUS;
  return format(date, formatStr, { locale });
}

export function formatNumber(num: number, language: string) {
  return new Intl.NumberFormat(language).format(num);
}

export function formatPercent(num: number, language: string) {
  return new Intl.NumberFormat(language, { style: 'percent' }).format(num);
}
```

**사용 예:**
```tsx
import { formatDate, formatNumber } from '@/utils/formatters';
import { useTranslation } from 'react-i18next';

function Report() {
  const { i18n } = useTranslation();

  return (
    <div>
      <p>{formatDate(new Date(), i18n.language)}</p>
      {/* ko: 2026년 1월 28일 */}
      {/* en: January 28, 2026 */}

      <p>{formatNumber(1234567, i18n.language)}</p>
      {/* ko: 1,234,567 */}
      {/* en: 1,234,567 */}
    </div>
  );
}
```

### 6.2 Lazy Loading (번들 크기 최적화)

```bash
pnpm --filter frontend add i18next-http-backend
```

```typescript
// packages/frontend/src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // ✅ HTTP 백엔드 추가
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: 'common',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // public 폴더에서 로드
    },
    interpolation: {
      escapeValue: false,
    },
    debug: import.meta.env.DEV,
  });

export default i18n;
```

**public 폴더 구조:**
```
packages/frontend/public/
└── locales/
    ├── en/
    │   ├── common.json
    │   └── home.json
    └── ko/
        ├── common.json
        └── home.json
```

### 6.3 번역 누락 감지 (개발 환경)

```typescript
// packages/frontend/src/i18n.ts
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // ...
    saveMissing: import.meta.env.DEV, // 개발 환경에서만 누락된 키 저장
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`🚨 Missing translation: [${ns}] ${key}`);
      }
    },
  });
```

---

## Phase 7: 테스트 & 검증

### 7.1 단위 테스트

```bash
pnpm --filter frontend add -D vitest @testing-library/react @testing-library/react-hooks
```

```typescript
// packages/frontend/src/__tests__/i18n.test.ts
import { renderHook, act } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { describe, test, expect } from 'vitest';
import '../i18n'; // i18n 설정 로드

describe('i18n', () => {
  test('영어 번역이 올바르게 작동함', () => {
    const { result } = renderHook(() => useTranslation('common'));

    act(() => {
      result.current.i18n.changeLanguage('en');
    });

    expect(result.current.t('site_name')).toBe('CodeInsight');
    expect(result.current.t('auth.login')).toBe('Login');
  });

  test('한국어 번역이 올바르게 작동함', () => {
    const { result } = renderHook(() => useTranslation('common'));

    act(() => {
      result.current.i18n.changeLanguage('ko');
    });

    expect(result.current.t('site_name')).toBe('CodeInsight');
    expect(result.current.t('auth.login')).toBe('로그인');
  });

  test('언어 전환이 즉시 반영됨', () => {
    const { result } = renderHook(() => useTranslation('common'));

    act(() => {
      result.current.i18n.changeLanguage('en');
    });
    expect(result.current.t('actions.save')).toBe('Save');

    act(() => {
      result.current.i18n.changeLanguage('ko');
    });
    expect(result.current.t('actions.save')).toBe('저장');
  });

  test('존재하지 않는 키는 키 이름 그대로 반환', () => {
    const { result } = renderHook(() => useTranslation('common'));

    expect(result.current.t('non_existent_key')).toBe('non_existent_key');
  });
});
```

### 7.2 E2E 테스트

```typescript
// packages/frontend/e2e/tests/public/i18n.spec.ts
import { test, expect } from '@playwright/test';

test.describe('국제화 (i18n)', () => {
  test('브라우저 언어가 한국어일 때 한글 표시', async ({ page }) => {
    // 브라우저 언어를 한국어로 설정
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'ko-KR',
      });
    });

    await page.goto('/');

    // 한글 텍스트 확인
    await expect(page.locator('text=홈')).toBeVisible();
    await expect(page.locator('text=로그인')).toBeVisible();
  });

  test('브라우저 언어가 영어일 때 영어 표시', async ({ page }) => {
    // 브라우저 언어를 영어로 설정
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'language', {
        get: () => 'en-US',
      });
    });

    await page.goto('/');

    // 영어 텍스트 확인
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Login')).toBeVisible();
  });

  test('언어 전환 드롭다운 동작', async ({ page }) => {
    await page.goto('/');

    // 언어 선택 드롭다운 클릭
    await page.click('[aria-label="언어 선택"]');

    // English 선택
    await page.selectOption('select', 'en');

    // 영어로 변경 확인
    await expect(page.locator('text=Home')).toBeVisible();

    // 한국어로 변경
    await page.selectOption('select', 'ko');

    // 한국어로 변경 확인
    await expect(page.locator('text=홈')).toBeVisible();
  });

  test('언어 설정이 페이지 새로고침 후에도 유지됨', async ({ page }) => {
    await page.goto('/');

    // 한국어 선택
    await page.selectOption('select[aria-label="언어 선택"]', 'ko');
    await expect(page.locator('text=홈')).toBeVisible();

    // 페이지 새로고침
    await page.reload();

    // 여전히 한국어 확인
    await expect(page.locator('text=홈')).toBeVisible();
  });
});
```

### 7.3 수동 검증 방법

```bash
# 1. 개발 서버 실행
pnpm dev

# 2. 브라우저 콘솔에서 테스트
# 개발자 도구 열기 (F12)
```

**콘솔 명령어:**
```javascript
// 현재 언어 확인
i18n.language
// → "ko" 또는 "en"

// 영어로 전환
i18n.changeLanguage('en')

// 한국어로 전환
i18n.changeLanguage('ko')

// 특정 키의 번역 확인
i18n.t('common:auth.login')
// → "로그인" (ko) 또는 "Login" (en)

// localStorage 확인 (언어 설정 저장됨)
localStorage.getItem('i18nextLng')
// → "ko" 또는 "en"
```

### 7.4 번역 완성도 체크리스트

```bash
# 모든 번역 키가 양쪽 언어에 존재하는지 확인
node scripts/check-translations.js
```

```javascript
// scripts/check-translations.js (새로 생성)
const fs = require('fs');
const path = require('path');

const namespaces = ['common', 'home', 'courses', 'lesson', 'quiz', 'profile', 'report', 'admin'];
const languages = ['en', 'ko'];

namespaces.forEach((ns) => {
  const enPath = path.join(__dirname, `../packages/frontend/src/locales/en/${ns}.json`);
  const koPath = path.join(__dirname, `../packages/frontend/src/locales/ko/${ns}.json`);

  if (!fs.existsSync(enPath)) {
    console.warn(`⚠️  Missing: ${enPath}`);
    return;
  }
  if (!fs.existsSync(koPath)) {
    console.warn(`⚠️  Missing: ${koPath}`);
    return;
  }

  const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const koData = JSON.parse(fs.readFileSync(koPath, 'utf8'));

  const enKeys = new Set(getAllKeys(enData));
  const koKeys = new Set(getAllKeys(koData));

  // en에는 있지만 ko에 없는 키
  enKeys.forEach((key) => {
    if (!koKeys.has(key)) {
      console.warn(`⚠️  [${ns}] Missing in KO: ${key}`);
    }
  });

  // ko에는 있지만 en에 없는 키
  koKeys.forEach((key) => {
    if (!enKeys.has(key)) {
      console.warn(`⚠️  [${ns}] Missing in EN: ${key}`);
    }
  });
});

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
```

---

## ✅ 체크리스트

### Phase 1: 인프라 구축
- [x] i18next, react-i18next, i18next-browser-languagedetector 설치
- [x] locales/ 디렉토리 생성 (en, ko)
- [x] i18n.ts 초기 설정
- [x] main.tsx에 import './i18n' 추가

### Phase 2: TypeScript 타입 안정성
- [ ] types/i18next.d.ts 파일 생성
- [ ] tsconfig.json에 types 경로 추가
- [ ] 타입 자동완성 동작 확인

### Phase 3: 번역 파일 구조화
- [ ] common.json 작성 (en, ko)
- [ ] home.json 작성 (en, ko)
- [ ] courses.json 작성 (en, ko)
- [ ] lesson.json 작성 (en, ko)
- [ ] quiz.json 작성 (en, ko)
- [ ] profile.json 작성 (en, ko)
- [ ] report.json 작성 (en, ko)
- [ ] admin.json 작성 (en, ko)
- [ ] i18n.ts 네임스페이스 지원 업데이트

### Phase 4: 컴포넌트 리팩토링
- [ ] P0: 공통 컴포넌트 (MainLayout, Header, Footer, Button, Toast)
- [ ] P1: 주요 페이지 (Home, Courses, Lesson, Quiz, Report)
- [ ] P2: 부가 기능 (Profile, Dashboard, Admin, Playground)

### Phase 5: 언어 전환 UI
- [ ] LanguageSwitcher 컴포넌트 생성
- [ ] Header에 LanguageSwitcher 통합
- [ ] 언어 전환 동작 확인
- [ ] localStorage 저장 확인

### Phase 6: 고도화 (선택)
- [ ] 날짜/숫자 포맷 유틸리티 함수 작성
- [ ] Lazy Loading 적용 (i18next-http-backend)
- [ ] 번역 누락 감지 (missingKeyHandler)

### Phase 7: 테스트 & 검증
- [ ] 단위 테스트 작성 (i18n.test.ts)
- [ ] E2E 테스트 작성 (i18n.spec.ts)
- [ ] 수동 검증 (브라우저 콘솔)
- [ ] 번역 완성도 체크 스크립트 실행

---

## 📚 참고 자료

- **i18next 공식 문서**: https://www.i18next.com/
- **react-i18next 공식 문서**: https://react.i18next.com/
- **i18next TypeScript 가이드**: https://www.i18next.com/overview/typescript
- **Vite 환경변수**: https://vitejs.dev/guide/env-and-mode.html

---

## 🚨 주의사항

### 1. 번역 파일 동기화
- 영어와 한국어 파일의 **키 구조가 일치**해야 함
- 새로운 키 추가 시 **양쪽 언어 모두** 업데이트
- 주기적으로 `scripts/check-translations.js` 실행

### 2. 하드코딩 금지
- UI에 보이는 **모든 텍스트**는 번역 파일로 관리
- 에러 메시지, 버튼명, 설명문 등 예외 없음
- 코드 리뷰 시 하드코딩 체크

### 3. 동적 콘텐츠 처리
- 사용자가 작성한 콘텐츠 (댓글, 제목 등)는 번역하지 않음
- 시스템 메시지와 사용자 콘텐츠를 명확히 구분

### 4. SEO 고려사항
- 메타 태그 (title, description)도 번역 필요
- 각 언어별 URL 전략 고려 (예: /en/courses, /ko/courses)

---

**계획서 버전**: 2.0
**최종 업데이트**: 2026-01-28
**작성자**: Claude Sonnet 4.5
