# LearnPage 구현 계획서

> 코스 목록 페이지 (언어별 Day 카드 그리드)

---

## 1. 개요

LearnPage는 사용자가 학습할 언어와 Day를 선택하는 진입점 페이지입니다.

### 1.1 라우팅

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/courses` | CoursesPage | 언어 탭 + Day 그리드 |
| `/courses/:lang` | CoursesPage | 특정 언어 탭 활성화 |
| `/courses/:lang/:day` | DayPage | Day 학습 화면 (별도 구현) |

### 1.2 현재 상태

- `router.tsx`에 `/courses` 라우트가 placeholder로 존재
- `data/courses/`에 C, Java, Python 코스 데이터 준비됨
- `types.ts`에 `Language`, `Day`, `CourseProgress` 타입 정의됨

---

## 2. UI 목업

```
┌─────────────────────────────────────────────────────────────────┐
│  CodeInsight                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  [🔧 C]  [☕ Java]  [🐍 Python]                             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🔧 C 언어                                                │  │
│  │  포인터와 메모리를 눈으로 이해하는 언어       진행: 3/10   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Day 1       │  │ Day 2       │  │ Day 3       │             │
│  │ ✅ 완료     │  │ ✅ 완료     │  │ ✅ 완료     │             │
│  │ 변수와 주소 │  │ 포인터는값  │  │ 역참조      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Day 4       │  │ Day 5       │  │ Day 6       │             │
│  │ 🔵 진행중   │  │ 🔒 잠김     │  │ 🔒 잠김     │             │
│  │ 배열/포인터 │  │ 함수 값전달 │  │ 포인터전달  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 컴포넌트 구조

```
features/courses/
├── index.ts                    # Public exports
├── CoursesPage.tsx             # 메인 페이지
├── components/
│   ├── LanguageTabs.tsx        # 언어 탭 (C, Java, Python)
│   ├── CourseHeader.tsx        # 언어 설명 + 진행률
│   ├── DayGrid.tsx             # Day 카드 그리드
│   └── DayCard.tsx             # 개별 Day 카드
├── hooks/
│   └── useCourseProgress.ts    # 진행 상태 관리 (localStorage)
└── types.ts                    # 내부 타입 (필요 시)
```

---

## 4. Day 상태 정의

| 상태 | 조건 | 스타일 |
|------|------|--------|
| `completed` | completedDays에 포함 | ✅ 체크 + 배경 |
| `current` | 마지막 완료 + 1 | 🔵 파란 테두리 |
| `next` | current + 1 | 클릭 가능 |
| `locked` | next 이후 | 🔒 회색 + 비활성화 |

### 4.1 상태 계산 로직

```typescript
type DayStatus = 'completed' | 'current' | 'next' | 'locked';

function getDayStatus(
  dayNumber: number,
  completedDays: number[]
): DayStatus {
  const maxCompleted = Math.max(0, ...completedDays);

  if (completedDays.includes(dayNumber)) return 'completed';
  if (dayNumber === maxCompleted + 1) return 'current';
  if (dayNumber === maxCompleted + 2) return 'next';
  return 'locked';
}
```

---

## 5. 컴포넌트 상세

### 5.1 CoursesPage

```tsx
// features/courses/CoursesPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { getAllLanguages, getCourse } from '@/data/courses';
import { LanguageTabs } from './components/LanguageTabs';
import { CourseHeader } from './components/CourseHeader';
import { DayGrid } from './components/DayGrid';
import { useCourseProgress } from './hooks/useCourseProgress';

export function CoursesPage() {
  const { lang = 'c' } = useParams<{ lang?: string }>();
  const navigate = useNavigate();
  const languages = getAllLanguages();
  const course = getCourse(lang as Language);
  const { progress } = useCourseProgress(lang as Language);

  const handleLanguageChange = (langId: string) => {
    navigate(`/courses/${langId}`);
  };

  const handleDayClick = (day: number) => {
    navigate(`/courses/${lang}/${day}`);
  };

  if (!course) {
    return <div>코스를 찾을 수 없습니다.</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <LanguageTabs
        languages={languages}
        activeLanguage={lang}
        onChange={handleLanguageChange}
      />

      <CourseHeader
        language={course.language}
        completedCount={progress.completedDays.length}
      />

      <DayGrid
        days={course.days}
        completedDays={progress.completedDays}
        onDayClick={handleDayClick}
      />
    </div>
  );
}
```

### 5.2 LanguageTabs

```tsx
// features/courses/components/LanguageTabs.tsx

import type { LanguageMeta } from '@/data/courses';
import { cn } from '@/lib/utils';

interface LanguageTabsProps {
  languages: LanguageMeta[];
  activeLanguage: string;
  onChange: (langId: string) => void;
}

export function LanguageTabs({
  languages,
  activeLanguage,
  onChange,
}: LanguageTabsProps) {
  return (
    <div className="flex gap-2 border-b">
      {languages.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onChange(lang.id)}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            'hover:text-primary',
            activeLanguage === lang.id
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground'
          )}
        >
          {lang.icon} {lang.name}
        </button>
      ))}
    </div>
  );
}
```

### 5.3 CourseHeader

```tsx
// features/courses/components/CourseHeader.tsx

import type { LanguageMeta } from '@/data/courses';

interface CourseHeaderProps {
  language: LanguageMeta;
  completedCount: number;
}

export function CourseHeader({ language, completedCount }: CourseHeaderProps) {
  const progressPercent = Math.round(
    (completedCount / language.totalDays) * 100
  );

  return (
    <div className="bg-card rounded-lg p-4 border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            {language.icon} {language.name}
          </h2>
          <p className="text-muted-foreground text-sm">
            {language.description}
          </p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold">{completedCount}</span>
          <span className="text-muted-foreground">/{language.totalDays}</span>
          <div className="text-xs text-muted-foreground">
            {progressPercent}% 완료
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5.4 DayGrid

```tsx
// features/courses/components/DayGrid.tsx

import type { Day } from '@/data/courses';
import { DayCard } from './DayCard';

interface DayGridProps {
  days: Day[];
  completedDays: number[];
  onDayClick: (day: number) => void;
}

export function DayGrid({ days, completedDays, onDayClick }: DayGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {days.map((day) => (
        <DayCard
          key={day.day}
          day={day}
          completedDays={completedDays}
          onClick={() => onDayClick(day.day)}
        />
      ))}
    </div>
  );
}
```

### 5.5 DayCard

```tsx
// features/courses/components/DayCard.tsx

import type { Day } from '@/data/courses';
import { cn } from '@/lib/utils';
import { Check, Lock, Play } from 'lucide-react';

type DayStatus = 'completed' | 'current' | 'next' | 'locked';

interface DayCardProps {
  day: Day;
  completedDays: number[];
  onClick: () => void;
}

function getDayStatus(dayNumber: number, completedDays: number[]): DayStatus {
  const maxCompleted = Math.max(0, ...completedDays);

  if (completedDays.includes(dayNumber)) return 'completed';
  if (dayNumber === maxCompleted + 1) return 'current';
  if (dayNumber === maxCompleted + 2) return 'next';
  return 'locked';
}

export function DayCard({ day, completedDays, onClick }: DayCardProps) {
  const status = getDayStatus(day.day, completedDays);
  const isClickable = status !== 'locked';

  return (
    <button
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'p-4 rounded-lg border text-left transition-all',
        'hover:shadow-md',
        {
          'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800':
            status === 'completed',
          'border-primary ring-2 ring-primary/20': status === 'current',
          'hover:border-primary': status === 'next',
          'opacity-50 cursor-not-allowed': status === 'locked',
        }
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Day {day.day}
        </span>
        {status === 'completed' && (
          <Check className="w-4 h-4 text-green-600" />
        )}
        {status === 'current' && (
          <Play className="w-4 h-4 text-primary" />
        )}
        {status === 'locked' && (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-medium truncate">{day.title}</h3>
      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
        {day.concept}
      </p>
    </button>
  );
}
```

### 5.6 useCourseProgress

```tsx
// features/courses/hooks/useCourseProgress.ts

import { useState, useEffect } from 'react';
import type { Language, CourseProgress } from '@/data/courses';

const STORAGE_KEY = 'course-progress';

function getStoredProgress(): Record<Language, CourseProgress> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {} as Record<Language, CourseProgress>;
  }
}

function saveProgress(progress: Record<Language, CourseProgress>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useCourseProgress(language: Language) {
  const [allProgress, setAllProgress] = useState(getStoredProgress);

  const progress: CourseProgress = allProgress[language] ?? {
    language,
    completedDays: [],
    currentDay: 1,
  };

  useEffect(() => {
    saveProgress(allProgress);
  }, [allProgress]);

  const markDayComplete = (day: number) => {
    setAllProgress((prev) => {
      const current = prev[language] ?? {
        language,
        completedDays: [],
        currentDay: 1,
      };

      if (current.completedDays.includes(day)) {
        return prev;
      }

      return {
        ...prev,
        [language]: {
          ...current,
          completedDays: [...current.completedDays, day],
          currentDay: Math.max(current.currentDay, day + 1),
        },
      };
    });
  };

  const resetProgress = () => {
    setAllProgress((prev) => ({
      ...prev,
      [language]: {
        language,
        completedDays: [],
        currentDay: 1,
      },
    }));
  };

  return {
    progress,
    markDayComplete,
    resetProgress,
  };
}
```

---

## 6. 라우터 수정

```typescript
// router.tsx 수정

import { CoursesPage } from './features/courses';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'simulator', element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:lang', element: <CoursesPage /> },
      { path: 'courses/:lang/:day', element: <DayPage /> }, // DayPage는 별도 구현
      { path: 'chat', element: <Chat /> },
    ],
  },
]);
```

---

## 7. 구현 순서

1. **useCourseProgress hook** - localStorage 연동
2. **DayCard** - 상태별 스타일링
3. **DayGrid** - 그리드 레이아웃
4. **CourseHeader** - 진행률 표시
5. **LanguageTabs** - 언어 전환
6. **CoursesPage** - 통합
7. **Router 수정** - 라우트 연결

---

## 8. 의존성

- **기존 코드**: `data/courses/`, `types.ts`, `lib/utils.ts`
- **UI 라이브러리**: `lucide-react` (아이콘)
- **외부 의존성 없음**

---

## 9. 관련 계획서

- `17_new_direction_mvp.md`: MVP 기능 정의
- `18_refactoring_plan.md`: 폴더 구조 정의
- `docs/reference/COURSE_DATA_STRUCTURE.md`: 코스 데이터 구조

---

*작성일: 2025-12-28*
