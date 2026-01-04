# 🔧 CodeInsight 리팩토링 계획

> 작성일: 2026-01-04
> 목적: 보안, 확장성, 유지보수성 개선

---

## 📋 Phase 1: 즉시 수정 (1주, Critical)

### 1.1 인증 우회 취약점 수정 ⭐⭐⭐⭐⭐

**문제:**
- `backend/src/modules/courses/routes.ts`에서 헤더로 닉네임 받음
- 누구나 다른 사람의 진행 상태 조회/수정 가능

**수정 파일:**
```
backend/src/modules/courses/routes.ts  (라인 100-123, 167-216)
```

**수정 방법:**
1. `requireDbUser` 미들웨어 적용
2. `req.headers['x-user-nickname']` 제거
3. `req.user!.dbUser!.nickname` 사용

**Before:**
```typescript
router.get('/chapters/:id/progress', async (req, res) => {
  const userNickname = req.headers['x-user-nickname'] as string;
  if (!userNickname) {
    return res.status(401).json({ error: 'User nickname required' });
  }
  // ...
});
```

**After:**
```typescript
import { requireDbUser } from '../../middleware/auth';

router.get('/chapters/:id/progress', requireDbUser, async (req, res) => {
  const userNickname = req.user!.dbUser!.nickname; // 검증된 사용자
  // ...
});
```

**영향 받는 엔드포인트:**
- `GET /api/courses/chapters/:id/progress` (라인 100)
- `GET /api/courses/progress` (라인 167)
- `POST /api/courses/progress` (라인 189)

**테스트 방법:**
```bash
# 1. 인증 없이 요청 → 401
curl http://localhost:3002/api/courses/progress

# 2. 다른 사람 닉네임으로 요청 → 자기 데이터만 반환
curl -H "Authorization: Bearer <token>" \
     http://localhost:3002/api/courses/progress
```

---

### 1.2 중복 인증 로직 제거 ⭐⭐⭐⭐

**문제:**
- `backend/src/middleware/auth.ts`에서 토큰 검증 로직이 `requireAuth`와 `requireDbUser`에 중복 (70줄)

**수정 파일:**
```
backend/src/middleware/auth.ts  (라인 99-173)
```

**수정 방법:**
1. `requireDbUser` 내부에서 `requireAuth` 재사용
2. DB 조회 로직만 남김

**Before:**
```typescript
export async function requireDbUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) { ... }
  const token = authHeader.slice(7);

  // 토큰 검증 (중복!)
  const decodedToken = await getFirebaseAuth().verifyIdToken(token);
  const provider = getProviderFromFirebase(...);

  // DB 조회
  const oauthAccount = await prisma.oAuthAccount.findUnique(...);
  // ...
}
```

**After:**
```typescript
export async function requireDbUser(req, res, next) {
  // 1. 토큰 검증 (재사용)
  await requireAuth(req, res, () => {});
  if (!req.user) return; // requireAuth에서 이미 401 반환

  // 2. DB 조회만 수행
  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerId: {
        provider: req.user.provider,
        providerId: req.user.uid,
      },
    },
    include: {
      user: {
        include: {
          oauthAccounts: {
            select: { provider: true, email: true },
          },
        },
      },
    },
  });

  if (!oauthAccount) {
    res.status(404).json({
      error: 'User not found',
      code: 'USER_NOT_REGISTERED',
      message: 'Please register with a nickname first.',
    });
    return;
  }

  // 3. dbUser 정보 추가
  req.user.dbUser = {
    nickname: oauthAccount.user.nickname,
    role: oauthAccount.user.role,
    oauthAccounts: oauthAccount.user.oauthAccounts,
  };

  next();
}
```

**테스트 방법:**
```bash
# requireDbUser 사용하는 API 테스트
curl -H "Authorization: Bearer <token>" \
     http://localhost:3002/api/courses/progress
```

---

### 1.3 프로덕션 console.log 제거 ⭐⭐⭐

**문제:**
- `frontend/src/services/api/axios.ts`에서 민감 정보 (이메일, 토큰) 콘솔 노출

**수정 파일:**
```
frontend/src/services/api/axios.ts  (라인 24-49)
```

**수정 방법:**
1. 환경별 로거 생성
2. `console.*` → `logger.*` 변경

**Before:**
```typescript
api.interceptors.request.use(async (config) => {
  const authUser = await waitForAuth();
  console.log('[axios] waitForAuth result:', authUser?.email);

  const user = auth.currentUser;
  console.log('[axios] auth.currentUser:', user?.email);

  if (user) {
    const token = await user.getIdToken();
    console.log('[axios] Token obtained:', token.substring(0, 20) + '...');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('[axios] No user - request will be unauthenticated');
  }
  return config;
});
```

**After:**
```typescript
// 환경별 로거
const logger = {
  log: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.log('[axios]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta.env.DEV) {
      console.warn('[axios]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    // 에러는 항상 출력
    console.error('[axios]', ...args);
  },
};

api.interceptors.request.use(async (config) => {
  const authUser = await waitForAuth();
  logger.log('waitForAuth result:', authUser?.email);

  const user = auth.currentUser;
  logger.log('currentUser:', user?.email);

  if (user) {
    const token = await user.getIdToken();
    logger.log('Token obtained');
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    logger.warn('No user - unauthenticated request');
  }
  return config;
});
```

**추가 수정 파일:**
- `frontend/src/services/courses.ts` (라인 45, 64, 78, 92, 110, 129, 143)
- `frontend/src/services/ai.ts`
- `frontend/src/services/crunner.ts`
- `frontend/src/services/tracer.ts`

**테스트 방법:**
```bash
# 프로덕션 빌드 후 콘솔 확인
npm run build
npm run preview
# 브라우저 콘솔: [axios] 로그 없어야 함
```

---

## 📋 Phase 2: 단기 수정 (2-4주, High Priority)

### 2.1 PostgreSQL 마이그레이션 ⭐⭐⭐⭐

**문제:**
- SQLite = 단일 파일 DB (동시 쓰기 불가)
- 확장 불가능 (최대 10~20 동시 사용자)

**수정 파일:**
```
backend/prisma/schema.prisma
backend/.env.example
backend/src/config/env.ts
docker-compose.yml (신규)
```

**수정 방법:**

#### 2.1.1 Docker Compose 설정
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: codeinsight-db
    environment:
      POSTGRES_DB: codeinsight
      POSTGRES_USER: codeinsight
      POSTGRES_PASSWORD: codeinsight123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

#### 2.1.2 Prisma 스키마 변경
```prisma
datasource db {
  provider = "postgresql"  // sqlite → postgresql
  url      = env("DATABASE_URL")
}
```

#### 2.1.3 환경변수 추가
```env
# backend/.env.example
DATABASE_URL="postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight"
```

#### 2.1.4 마이그레이션
```bash
# 1. Docker 시작
docker-compose up -d

# 2. 마이그레이션 생성
npx prisma migrate dev --name init_postgresql

# 3. 데이터 시드
npm run seed
```

**테스트 방법:**
```bash
# PostgreSQL 접속 확인
docker exec -it codeinsight-db psql -U codeinsight

# 테이블 확인
\dt

# 데이터 확인
SELECT * FROM users;
```

---

### 2.2 API 응답 런타임 검증 (Zod) ⭐⭐⭐⭐

**문제:**
- Frontend에서 타입 assertion만 있고 런타임 검증 없음
- 백엔드 데이터 변경 시 프론트엔드 런타임 에러

**수정 파일:**
```
frontend/src/types/course-schema.ts  (스키마 추가)
frontend/src/services/courses.ts     (검증 로직 추가)
```

**수정 방법:**

#### 2.2.1 Zod 스키마 정의
```typescript
// frontend/src/types/course-schema.ts
import { z } from 'zod';

// Language 스키마
export const LanguageSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  isActive: z.boolean(),
  order: z.number(),
});

export const LanguagesSchema = z.array(LanguageSchema);

// Chapter 스키마
export const ChapterSchema = z.object({
  id: z.string().uuid(),
  languageId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  keyQuestion: z.string().nullable(),
  order: z.number(),
  isActive: z.boolean(),
});

// Lesson 스키마
export const LessonSchema = z.object({
  id: z.string().uuid(),
  chapterId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  difficulty: z.enum(['basic', 'intermediate', 'advanced']),
  order: z.number(),
  estimatedTime: z.number().nullable(),
});

// 타입 export (검증된 타입)
export type Language = z.infer<typeof LanguageSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
```

#### 2.2.2 서비스에 검증 적용
```typescript
// frontend/src/services/courses.ts
import { LanguagesSchema, ChaptersSchema } from '@/types/course-schema';

export async function getLanguages(): Promise<Language[]> {
  const response = await api.get(ENDPOINTS.languages);

  // 런타임 검증
  const parsed = LanguagesSchema.safeParse(response.data);
  if (!parsed.success) {
    console.error('Invalid API response:', parsed.error);
    throw new Error('Invalid language data from server');
  }

  return parsed.data;
}
```

**패키지 설치:**
```bash
cd frontend
npm install zod
```

**테스트 방법:**
```typescript
// 백엔드에서 잘못된 데이터 반환 시
// → Frontend에서 "Invalid language data from server" 에러
```

---

### 2.3 핵심 로직 테스트 추가 (커버리지 30%) ⭐⭐⭐⭐

**문제:**
- 테스트 파일 1개만 존재 (executor.test.ts)
- 리팩토링 시 회귀 버그 발견 불가

**추가 파일:**
```
backend/src/modules/courses/service.test.ts  (신규)
backend/src/modules/ai/routes.test.ts        (신규)
backend/src/middleware/auth.test.ts          (신규)
```

**테스트 환경 설정:**

#### 2.3.1 Vitest 설정 확인
```typescript
// backend/vitest.config.ts (이미 존재)
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'], // 추가
  },
});
```

#### 2.3.2 테스트 Setup
```typescript
// backend/src/test/setup.ts (신규)
import { beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '../config/database';

beforeAll(async () => {
  // 테스트 DB 초기화
  await prisma.$executeRaw`DELETE FROM users`;
  await prisma.$executeRaw`DELETE FROM oauth_accounts`;
});

afterEach(async () => {
  // 각 테스트 후 정리
  await prisma.userProgress.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

#### 2.3.3 Core Service 테스트
```typescript
// backend/src/modules/courses/service.test.ts
import { describe, it, expect } from 'vitest';
import * as service from './service';

describe('Course Service', () => {
  describe('getLanguages', () => {
    it('should return all active languages', async () => {
      const languages = await service.getLanguages();
      expect(languages).toBeDefined();
      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0]).toHaveProperty('id');
      expect(languages[0]).toHaveProperty('name');
    });
  });

  describe('getChapters', () => {
    it('should return chapters for valid language', async () => {
      const chapters = await service.getChapters('c');
      expect(chapters).toBeDefined();
      expect(chapters.length).toBeGreaterThan(0);
    });

    it('should return empty array for invalid language', async () => {
      const chapters = await service.getChapters('invalid');
      expect(chapters).toEqual([]);
    });
  });
});
```

#### 2.3.4 Auth Middleware 테스트
```typescript
// backend/src/middleware/auth.test.ts
import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { requireAuth, requireDbUser } from './auth';

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    it('should reject request without Authorization header', async () => {
      const req = { headers: {} } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject invalid Bearer token', async () => {
      const req = {
        headers: { authorization: 'Bearer invalid' },
      } as Request;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn();

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```

**테스트 실행:**
```bash
cd backend
npm test                    # 전체 테스트
npm test -- service.test.ts # 특정 파일
npm test -- --coverage      # 커버리지
```

**목표 커버리지:**
- Service Layer: 80%
- Middleware: 70%
- Routes: 50%
- Overall: 30%

---

## 📋 Phase 3: 중기 개선 (1-2개월, Medium Priority)

### 3.1 Frontend-Backend 타입 공유 (Monorepo) ⭐⭐⭐

**문제:**
- 타입 중복 (backend/frontend에 같은 타입 2벌)
- 타입 싱크 깨짐

**디렉토리 구조 변경:**
```
CodeInsight/
├── packages/
│   ├── shared/           # 공유 패키지 (신규)
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── course.ts
│   │   │   │   ├── user.ts
│   │   │   │   └── index.ts
│   │   │   └── schemas/  # Zod 스키마
│   │   │       ├── course.ts
│   │   │       └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── backend/
│   └── frontend/
├── package.json          # Root package.json
└── pnpm-workspace.yaml   # pnpm workspace 설정
```

**설정 파일:**

#### 3.1.1 Root package.json
```json
{
  "name": "codeinsight-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "pnpm --parallel dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test"
  }
}
```

#### 3.1.2 pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

#### 3.1.3 Shared Package
```json
// packages/shared/package.json
{
  "name": "@codeinsight/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

#### 3.1.4 Backend에서 사용
```typescript
// packages/backend/package.json
{
  "dependencies": {
    "@codeinsight/shared": "workspace:*"
  }
}

// packages/backend/src/modules/courses/service.ts
import { ChapterWithLessons } from '@codeinsight/shared';
```

#### 3.1.5 Frontend에서 사용
```typescript
// packages/frontend/package.json
{
  "dependencies": {
    "@codeinsight/shared": "workspace:*"
  }
}

// packages/frontend/src/types/index.ts
export * from '@codeinsight/shared';
```

**마이그레이션 순서:**
1. pnpm 설치: `npm install -g pnpm`
2. 디렉토리 구조 변경
3. shared 패키지 생성
4. backend/frontend 의존성 추가
5. 타입 import 경로 변경

---

### 3.2 API 버전 관리 ⭐⭐⭐

**문제:**
- 브레이킹 체인지 시 클라이언트 강제 업데이트
- A/B 테스트 불가능

**수정 파일:**
```
backend/src/app.ts
backend/src/modules/courses/routes.v1.ts (복사)
backend/src/modules/courses/routes.v2.ts (신규)
```

**수정 방법:**

#### 3.2.1 버전별 라우터
```typescript
// backend/src/app.ts
import { courseRoutesV1 } from './modules/courses/routes.v1';
import { courseRoutesV2 } from './modules/courses/routes.v2';

// v1 (현재)
app.use('/api/v1/courses', rateLimit, courseRoutesV1);

// v2 (신규)
app.use('/api/v2/courses', rateLimit, courseRoutesV2);

// 버전 없는 요청 → v1로 리다이렉트 (Deprecated)
app.use('/api/courses', (req, res) => {
  res.status(301).redirect(`/api/v1${req.path}`);
});
```

#### 3.2.2 버전별 응답 형식
```typescript
// v1: 현재 형식 유지
{
  "id": "uuid",
  "title": "변수와 메모리",
  "lessons": [...]
}

// v2: 개선된 형식 (에러 처리 표준화)
{
  "data": {
    "id": "uuid",
    "title": "변수와 메모리",
    "lessons": [...]
  },
  "meta": {
    "version": "v2",
    "timestamp": "2026-01-04T12:00:00Z"
  }
}
```

#### 3.2.3 Frontend 버전 선택
```typescript
// frontend/src/config/env.ts
export const env = {
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
};

// frontend/src/services/api/axios.ts
const BASE_URL = `${import.meta.env.VITE_API_URL}/api/${env.API_VERSION}`;
```

**마이그레이션 전략:**
1. v1 유지 (6개월)
2. v2 추가 (신규 기능)
3. v1 Deprecated 경고 (3개월)
4. v1 제거

---

### 3.3 로깅 전략 (Winston) ⭐⭐

**문제:**
- console.log 남발 → 프로덕션 디버깅 어려움
- 로그 레벨, 파일 저장 없음

**수정 파일:**
```
backend/src/config/logger.ts  (신규)
backend/src/app.ts
```

**설정:**

#### 3.3.1 Winston 설정
```typescript
// backend/src/config/logger.ts
import winston from 'winston';
import { env } from './env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// 커스텀 포맷
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // 콘솔 출력 (개발)
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // 파일 저장 (프로덕션)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});
```

#### 3.3.2 사용 예시
```typescript
// backend/src/modules/courses/routes.ts
import { logger } from '../../config/logger';

router.get('/languages', async (req, res) => {
  try {
    logger.info('Fetching languages');
    const languages = await service.getLanguages();
    res.json(languages);
  } catch (error) {
    logger.error('Failed to get languages', { error });
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

#### 3.3.3 Request 로깅 미들웨어
```typescript
// backend/src/middleware/requestLogger.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}

// app.ts
app.use(requestLogger);
```

**패키지 설치:**
```bash
cd backend
npm install winston
```

---

## 📊 전체 일정 및 우선순위

| Phase | 작업 | 예상 시간 | 우선순위 | 완료 조건 |
|-------|------|-----------|----------|-----------|
| **Phase 1** | 인증 우회 수정 | 2일 | 🔴 Critical | 테스트 통과 + 코드 리뷰 |
| | 중복 로직 제거 | 1일 | 🔴 Critical | 테스트 통과 |
| | console.log 제거 | 1일 | 🔴 Critical | 빌드 확인 |
| **Phase 2** | PostgreSQL 마이그레이션 | 1주 | 🟠 High | 마이그레이션 성공 + 데이터 검증 |
| | 런타임 검증 (Zod) | 3일 | 🟠 High | 모든 API 검증 적용 |
| | 테스트 추가 (30%) | 1주 | 🟠 High | 커버리지 30% 달성 |
| **Phase 3** | Monorepo 전환 | 1주 | 🟡 Medium | 타입 공유 완료 |
| | API 버전 관리 | 3일 | 🟡 Medium | v1, v2 동시 작동 |
| | Winston 로깅 | 2일 | 🟡 Medium | 로그 파일 생성 확인 |

**총 예상 기간:** 6-8주

---

## ✅ 완료 체크리스트

### Phase 1 완료 조건
- [ ] 모든 인증 필요 API에 `requireDbUser` 적용
- [ ] `x-user-nickname` 헤더 완전 제거
- [ ] `requireAuth` + `requireDbUser` 분리 완료
- [ ] 프로덕션 빌드에서 console.log 0개
- [ ] Manual 테스트 통과 (Postman/curl)

### Phase 2 완료 조건
- [ ] PostgreSQL Docker 실행
- [ ] Prisma 마이그레이션 완료
- [ ] 시드 데이터 검증
- [ ] 모든 API 응답에 Zod 검증 적용
- [ ] 테스트 커버리지 30% 달성
- [ ] CI/CD 파이프라인에 테스트 통합

### Phase 3 완료 조건
- [ ] Monorepo 구조 전환
- [ ] 타입 중복 완전 제거
- [ ] API v1, v2 동시 작동
- [ ] Winston 로깅 파일 생성
- [ ] 에러 로그 Sentry 연동 (선택)

---

## 🚨 리스크 및 대응 방안

| 리스크 | 확률 | 영향도 | 대응 방안 |
|--------|------|--------|-----------|
| Phase 1 중 인증 깨짐 | 중 | 높음 | 롤백 계획 준비, 단계별 배포 |
| PostgreSQL 마이그레이션 실패 | 낮 | 높음 | 백업 필수, SQLite 병행 운영 |
| 테스트 작성 시간 초과 | 높음 | 중 | 핵심 로직만 우선 테스트 |
| Monorepo 전환 복잡도 | 중 | 중 | 점진적 마이그레이션 |

---

## 📝 참고 문서

- [Prisma PostgreSQL 마이그레이션](https://www.prisma.io/docs/guides/migrate/production-troubleshooting)
- [Zod 런타임 검증](https://zod.dev/)
- [Winston 로깅](https://github.com/winstonjs/winston)
- [pnpm Workspace](https://pnpm.io/workspaces)

---

**작성자:** Claude Code + jammy0903
**최종 수정:** 2026-01-04
