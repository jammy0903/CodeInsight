# 진행률 추적 상세 계획

> ⚠️ **상태: Phase 5+ 연기됨**
>
> **연기 사유**: DAU 100+ 달성 전까지 localStorage만 사용. DB 저장은 나중에.
>
> **진입 조건**:
> - DAU 100명 이상
> - 인증 시스템 안정화 (Phase 4 완료)
> - "다른 기기에서 이어하고 싶어요" 피드백 다수
>
> **현재 전략**: localStorage만 사용 (useCourseProgress.ts 현행 유지)
>
> **참고**: `260101_ceo_roadmap.md`

---

> 작성일: 2026-01-01
> 상태: 🔴 연기됨 (Phase 5+)

---

## 개요

사용자의 코스 진행 상태를 저장하는 기능.

### 요구사항
- 로그인 사용자: DB에 저장
- 비로그인 사용자: localStorage에 저장
- 저장 항목: **Day 완료 상태만** (퀴즈 정답 여부 X)

### 현재 상태
- `useCourseProgress.ts`: localStorage만 사용
- DB 스키마: CourseProgress 테이블 없음

---

## 1. 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐      ┌──────────────────┐                │
│  │   DayPage.tsx    │      │  CoursesPage.tsx │                │
│  │  (Day 완료 버튼)  │      │  (진행률 표시)    │                │
│  └────────┬─────────┘      └────────┬─────────┘                │
│           │                         │                           │
│           ▼                         ▼                           │
│  ┌─────────────────────────────────────────────┐               │
│  │         useCourseProgress.ts                 │               │
│  │  ┌─────────────────────────────────────┐    │               │
│  │  │  markDayComplete(day)               │    │               │
│  │  │  ┌───────────┬───────────┐          │    │               │
│  │  │  │ 로그인    │ 비로그인   │          │    │               │
│  │  │  │    ▼      │     ▼     │          │    │               │
│  │  │  │  API +    │ local     │          │    │               │
│  │  │  │  local    │ Storage   │          │    │               │
│  │  │  └───────────┴───────────┘          │    │               │
│  │  └─────────────────────────────────────┘    │               │
│  └──────────────────────┬──────────────────────┘               │
│                         │                                       │
└─────────────────────────┼───────────────────────────────────────┘
                          │ (로그인 시)
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  POST /api/progress/me/:lang/complete/:day                      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────┐     ┌──────────────────┐                 │
│  │  requireDbUser   │────►│  progress.ctrl   │                 │
│  │  (인증 확인)      │     │  (비즈니스로직)   │                 │
│  └──────────────────┘     └────────┬─────────┘                 │
│                                    │                            │
│                                    ▼                            │
│                           ┌──────────────────┐                 │
│                           │     Prisma       │                 │
│                           │  CourseProgress  │                 │
│                           └────────┬─────────┘                 │
│                                    │                            │
└────────────────────────────────────┼────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Database                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────┐         ┌─────────────────────┐                │
│  │    User    │────────►│   CourseProgress    │                │
│  ├────────────┤   1:N   ├─────────────────────┤                │
│  │ id         │         │ id                  │                │
│  │ email      │         │ userId (FK)         │                │
│  │ name       │         │ language            │                │
│  │ firebaseUid│         │ completedDays [1,2] │                │
│  │ role       │         │ currentDay          │                │
│  └────────────┘         │ updatedAt           │                │
│                         └─────────────────────┘                │
│                                                                  │
│  제약: UNIQUE(userId, language)                                 │
│  → 사용자당 언어별 1개 레코드                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DB 스키마

### 2.1 CourseProgress 테이블 추가

```prisma
// backend/prisma/schema.prisma

model CourseProgress {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  language      String   // "c" | "python" | "java"
  completedDays String   @default("[]")  // JSON: [1, 2, 3]
  currentDay    Int      @default(1) @map("current_day")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user          User     @relation(fields: [userId], references: [id])

  @@unique([userId, language])
  @@index([userId], map: "idx_progress_user")
  @@map("course_progress")
}
```

### 2.2 User 모델에 relation 추가

```prisma
model User {
  id             String           @id @default(uuid())
  email          String           @unique
  name           String
  firebaseUid    String           @unique @map("firebase_uid")
  role           String           @default("user")
  createdAt      DateTime         @default(now()) @map("created_at")
  drafts         Draft[]
  submissions    Submission[]
  courseProgress CourseProgress[]  // ← 추가

  @@map("users")
}
```

### 2.3 마이그레이션

```bash
cd backend
npx prisma migrate dev --name add_course_progress
```

---

## 3. Backend API

### 3.1 파일 구조

```
backend/src/modules/progress/
├── index.ts           # 라우터 export
├── progress.routes.ts # 라우트 정의
├── progress.ctrl.ts   # 컨트롤러
└── progress.service.ts # 비즈니스 로직 (선택)
```

### 3.2 API 엔드포인트

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/api/progress/me` | ✅ | 내 모든 언어 진행 상태 |
| GET | `/api/progress/me/:lang` | ✅ | 특정 언어 진행 상태 |
| POST | `/api/progress/me/:lang/complete/:day` | ✅ | Day 완료 처리 |

### 3.3 컨트롤러 구현

```typescript
// backend/src/modules/progress/progress.ctrl.ts

import { Request, Response } from 'express';
import { prisma } from '@/config/database';

// GET /api/progress/me
export async function getMyProgress(req: Request, res: Response) {
  const userId = req.dbUser!.id;

  const progress = await prisma.courseProgress.findMany({
    where: { userId },
  });

  // JSON 파싱해서 반환
  const result = progress.map(p => ({
    language: p.language,
    completedDays: JSON.parse(p.completedDays),
    currentDay: p.currentDay,
  }));

  res.json(result);
}

// GET /api/progress/me/:lang
export async function getMyProgressByLang(req: Request, res: Response) {
  const userId = req.dbUser!.id;
  const { lang } = req.params;

  const progress = await prisma.courseProgress.findUnique({
    where: { userId_language: { userId, language: lang } },
  });

  if (!progress) {
    return res.json({
      language: lang,
      completedDays: [],
      currentDay: 1,
    });
  }

  res.json({
    language: progress.language,
    completedDays: JSON.parse(progress.completedDays),
    currentDay: progress.currentDay,
  });
}

// POST /api/progress/me/:lang/complete/:day
export async function completeDay(req: Request, res: Response) {
  const userId = req.dbUser!.id;
  const { lang, day } = req.params;
  const dayNum = parseInt(day, 10);

  // upsert: 없으면 생성, 있으면 업데이트
  const existing = await prisma.courseProgress.findUnique({
    where: { userId_language: { userId, language: lang } },
  });

  let completedDays: number[] = existing
    ? JSON.parse(existing.completedDays)
    : [];

  // 이미 완료된 경우 무시
  if (!completedDays.includes(dayNum)) {
    completedDays.push(dayNum);
    completedDays.sort((a, b) => a - b);
  }

  const newCurrentDay = Math.max(...completedDays, 0) + 1;

  const progress = await prisma.courseProgress.upsert({
    where: { userId_language: { userId, language: lang } },
    create: {
      userId,
      language: lang,
      completedDays: JSON.stringify(completedDays),
      currentDay: newCurrentDay,
    },
    update: {
      completedDays: JSON.stringify(completedDays),
      currentDay: newCurrentDay,
    },
  });

  res.json({
    language: progress.language,
    completedDays: JSON.parse(progress.completedDays),
    currentDay: progress.currentDay,
  });
}
```

### 3.4 라우트 정의

```typescript
// backend/src/modules/progress/progress.routes.ts

import { Router } from 'express';
import { requireDbUser } from '@/middleware/auth';
import * as ctrl from './progress.ctrl';

const router = Router();

router.get('/me', requireDbUser, ctrl.getMyProgress);
router.get('/me/:lang', requireDbUser, ctrl.getMyProgressByLang);
router.post('/me/:lang/complete/:day', requireDbUser, ctrl.completeDay);

export default router;
```

### 3.5 app.ts에 등록

```typescript
// backend/src/app.ts

import progressRoutes from './modules/progress';

app.use('/api/progress', progressRoutes);
```

---

## 4. Frontend 연동

### 4.1 services/progress.ts 생성

```typescript
// frontend/src/services/progress.ts

import { authFetch } from './api';
import type { Language, CourseProgress } from '@/data/courses';

const API_URL = import.meta.env.VITE_API_URL;

export interface ProgressResponse {
  language: string;
  completedDays: number[];
  currentDay: number;
}

// 모든 진행 상태 조회
export async function getMyProgress(): Promise<ProgressResponse[]> {
  const res = await authFetch(`${API_URL}/api/progress/me`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

// 특정 언어 진행 상태 조회
export async function getProgressByLang(lang: Language): Promise<ProgressResponse> {
  const res = await authFetch(`${API_URL}/api/progress/me/${lang}`);
  if (!res.ok) throw new Error('Failed to fetch progress');
  return res.json();
}

// Day 완료 처리
export async function completeDay(lang: Language, day: number): Promise<ProgressResponse> {
  const res = await authFetch(`${API_URL}/api/progress/me/${lang}/complete/${day}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to complete day');
  return res.json();
}
```

### 4.2 useCourseProgress.ts 수정

```typescript
// frontend/src/features/courses/hooks/useCourseProgress.ts

import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/stores/store';
import type { Language, CourseProgress } from '@/data/courses';
import * as progressApi from '@/services/progress';

const STORAGE_KEY = 'course-progress';

// localStorage 헬퍼 (기존 코드 유지)
function getStoredProgress(): Partial<Record<Language, CourseProgress>> { ... }
function saveProgress(progress: Partial<Record<Language, CourseProgress>>) { ... }

export function useCourseProgress(language: Language) {
  const { user } = useStore();  // 로그인 상태 확인
  const isLoggedIn = !!user;

  const [allProgress, setAllProgress] = useState(getStoredProgress);
  const [isLoading, setIsLoading] = useState(false);

  const progress: CourseProgress = allProgress[language] ?? {
    language,
    completedDays: [],
    currentDay: 1,
  };

  // 로그인 시 서버에서 로드
  useEffect(() => {
    if (!isLoggedIn) return;

    setIsLoading(true);
    progressApi.getProgressByLang(language)
      .then((serverProgress) => {
        setAllProgress((prev) => ({
          ...prev,
          [language]: {
            language,
            completedDays: serverProgress.completedDays,
            currentDay: serverProgress.currentDay,
          },
        }));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [isLoggedIn, language]);

  // localStorage 동기화
  useEffect(() => {
    saveProgress(allProgress);
  }, [allProgress]);

  const markDayComplete = useCallback(
    async (day: number) => {
      // 1. localStorage 즉시 업데이트 (낙관적 업데이트)
      setAllProgress((prev) => {
        const current = prev[language] ?? { language, completedDays: [], currentDay: 1 };
        if (current.completedDays.includes(day)) return prev;

        const newCompleted = [...current.completedDays, day].sort((a, b) => a - b);
        return {
          ...prev,
          [language]: {
            ...current,
            completedDays: newCompleted,
            currentDay: Math.max(...newCompleted, 0) + 1,
          },
        };
      });

      // 2. 로그인 시 서버에도 저장
      if (isLoggedIn) {
        try {
          await progressApi.completeDay(language, day);
        } catch (error) {
          console.error('Failed to sync progress:', error);
          // 실패해도 localStorage는 유지
        }
      }
    },
    [language, isLoggedIn]
  );

  const resetProgress = useCallback(() => {
    setAllProgress((prev) => ({
      ...prev,
      [language]: { language, completedDays: [], currentDay: 1 },
    }));
    // TODO: 서버 리셋 API (필요 시)
  }, [language]);

  return {
    progress,
    isLoading,
    markDayComplete,
    resetProgress,
  };
}
```

---

## 5. 저장 데이터 명세

### 저장하는 것

| 필드 | 타입 | 예시 | 설명 |
|------|------|------|------|
| completedDays | number[] | [1, 2, 3] | 완료한 Day 목록 |
| currentDay | number | 4 | 현재 진행 중인 Day |
| updatedAt | DateTime | 2026-01-01T10:00:00 | 마지막 업데이트 |

### 저장 안 하는 것

| 항목 | 이유 |
|------|------|
| 퀴즈 정답 여부 | 불필요 (Day 완료만 중요) |
| 각 스텝 진행 상태 | 페이지 새로고침 시 처음부터 |
| 학습 시간 | MVP에서 제외 |

---

## 6. 구현 체크리스트

### Backend

- [ ] `prisma/schema.prisma`에 CourseProgress 모델 추가
- [ ] User 모델에 courseProgress relation 추가
- [ ] 마이그레이션 실행: `npx prisma migrate dev --name add_course_progress`
- [ ] `modules/progress/` 폴더 생성
- [ ] `progress.routes.ts` 작성
- [ ] `progress.ctrl.ts` 작성
- [ ] `app.ts`에 라우트 등록
- [ ] Rate limiting 설정 (100/min)

### Frontend

- [ ] `services/api.ts` - authFetch 구현 (Phase 3에서)
- [ ] `services/progress.ts` 생성
- [ ] `useCourseProgress.ts` 수정 (로그인 분기 처리)
- [ ] 에러 처리 및 로딩 상태 추가

### 테스트

- [ ] 비로그인 상태에서 Day 완료 → localStorage 저장 확인
- [ ] 로그인 상태에서 Day 완료 → DB 저장 확인
- [ ] 로그인 후 다른 기기에서 진행 상태 불러오기

---

## 7. 의존성

### 선행 작업 (Phase 3)
- `authFetch` 구현 필요
- 로그인 상태 확인 (`useStore().user`)

### 관련 파일
- `backend/prisma/schema.prisma`
- `frontend/src/features/courses/hooks/useCourseProgress.ts`
- `frontend/src/services/firebase.ts` (getIdToken)

---

## 8. API 응답 예시

### GET /api/progress/me

```json
[
  {
    "language": "c",
    "completedDays": [1, 2, 3],
    "currentDay": 4
  },
  {
    "language": "python",
    "completedDays": [1],
    "currentDay": 2
  }
]
```

### POST /api/progress/me/c/complete/4

```json
{
  "language": "c",
  "completedDays": [1, 2, 3, 4],
  "currentDay": 5
}
```
