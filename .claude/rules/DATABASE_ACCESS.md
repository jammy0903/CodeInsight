# DATABASE_ACCESS.md - C-OSINE 데이터베이스 접근 가이드

**목적**: 데이터베이스 접근, Prisma 사용법, 스크립트 실행 방법 정리

---

## 🗄️ 데이터베이스 구조

### 사용 기술
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma Client
- **Connection**: pg adapter (PostgreSQL driver)

```
코드 (TypeScript) → Prisma ORM → pg adapter → Neon PostgreSQL
```

### 역할 분담
| 기술 | 역할 |
|------|------|
| **Neon** | PostgreSQL 데이터베이스 호스팅 (클라우드) |
| **Prisma** | 타입 안전한 데이터베이스 접근 도구 (ORM) |
| **pg** | PostgreSQL 연결 드라이버 |

---

## 📍 데이터베이스 경로

### DATABASE_URL 설정

**위치**: 환경 변수 또는 `.env` 파일
```bash
# 프로덕션 (Neon)
DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# 로컬 개발
DATABASE_URL=postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight
```

**코드에서 사용**:
```typescript
// packages/backend/src/config/database.ts
const connectionString = process.env.DATABASE_URL || 'postgresql://...';
export const prisma = new PrismaClient({ adapter });
```

---

## 🔧 Prisma 기본 사용법

### 1. Prisma Client 생성

Prisma Client는 이미 생성되어 있음:
```typescript
// packages/backend/src/config/database.ts
import { prisma } from './config/database';
```

### 2. 스키마 위치
```
packages/backend/prisma/schema.prisma
```

### 3. Prisma Client 재생성

스키마 변경 후:
```bash
cd packages/backend
pnpm prisma generate
```

---

## 📊 주요 모델 (Tables)

### User
```prisma
model User {
  id                     String   @id @default(uuid())
  nickname               String   @unique
  role                   String   @default("user")  // "user" 또는 "admin"
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt

  // Relations
  oauthAccounts          OAuthAccount[]
  progress               UserProgress[]
  streak                 UserStreak?
  // ...
}
```

### UserStreak (스트릭 시스템)
```prisma
model UserStreak {
  id            String   @id @default(uuid())
  userId        String   @unique
  currentStreak Int      @default(0)
  longestStreak Int      @default(0)
  lastActiveAt  DateTime?

  user          User     @relation(fields: [userId], references: [id])
}
```

---

## 🔍 자주 쓰는 쿼리 패턴

### 1. 사용자 조회

**role로 찾기**:
```typescript
const admin = await prisma.user.findFirst({
  where: { role: 'admin' },
});
```

**nickname으로 찾기**:
```typescript
const user = await prisma.user.findUnique({
  where: { nickname: 'jammy' },
});
```

**모든 사용자 조회**:
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    nickname: true,
    role: true,
  },
});
```

### 2. 스트릭 업데이트

**조회 또는 생성 (upsert)**:
```typescript
const streak = await prisma.userStreak.upsert({
  where: { userId: userId },
  update: {
    currentStreak: 5,
    lastActiveAt: new Date(),
  },
  create: {
    userId: userId,
    currentStreak: 1,
    longestStreak: 1,
    lastActiveAt: new Date(),
  },
});
```

### 3. 관계 포함 조회

**사용자 + 스트릭**:
```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    streak: true,
    progress: true,
  },
});
```

---

## 🛠️ 스크립트 실행 방법

### 1. 스크립트 위치
```
packages/backend/src/scripts/
```

### 2. TypeScript 스크립트 작성

**예시**: `reset-admin-streak.ts`
```typescript
import { prisma } from '../config/database';

async function main() {
  const admin = await prisma.user.findFirst({
    where: { role: 'admin' },
  });

  if (!admin) {
    console.log('❌ Admin not found');
    return;
  }

  const streak = await prisma.userStreak.upsert({
    where: { userId: admin.id },
    update: { currentStreak: 1 },
    create: {
      userId: admin.id,
      currentStreak: 1,
      longestStreak: 1,
      lastActiveAt: new Date(),
    },
  });

  console.log('✅ Streak updated:', streak);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 3. 실행 방법

**현재 작업 디렉토리**: `/home/jammy/projects/C-OSINE/packages/backend`

```bash
# 방법 1: tsx로 직접 실행
pnpm exec tsx src/scripts/reset-admin-streak.ts

# 방법 2: package.json에 스크립트 추가 후
pnpm run script:reset-admin-streak
```

### 4. 주의사항

⚠️ **반드시 지켜야 할 것**:
1. `prisma.$disconnect()` 호출 (연결 종료)
2. 에러 처리 (`try-catch` 또는 `.catch()`)
3. 트랜잭션이 필요한 경우 `prisma.$transaction()` 사용

---

## 🔐 데이터베이스 직접 접근

### Prisma Studio (GUI)

```bash
cd packages/backend
npx prisma studio
```

→ http://localhost:5555 에서 GUI로 데이터 확인/수정 가능

### SQL 직접 실행

```typescript
import { prisma } from './config/database';

// Raw SQL
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE role = 'admin'
`;
```

⚠️ **비추천**: 타입 안전성 상실, Prisma의 장점 없음

---

## 🐛 문제 해결 (Troubleshooting)

### 1. "Cannot find module '.prisma/client'"

**원인**: Prisma Client가 생성되지 않음

**해결**:
```bash
cd packages/backend
pnpm prisma generate
```

### 2. "Admin user not found"

**원인**: role이 'admin'인 사용자가 없음

**해결**:
```typescript
// 1. 먼저 사용자 목록 확인
const users = await prisma.user.findMany({
  select: { id: true, nickname: true, role: true },
});
console.log(users);

// 2. 특정 사용자의 role을 admin으로 변경
await prisma.user.update({
  where: { nickname: 'jammy' },
  data: { role: 'admin' },
});
```

### 3. "Connection timeout"

**원인**: DATABASE_URL이 잘못되었거나 Neon이 sleep 상태

**해결**:
1. DATABASE_URL 확인
2. Neon 콘솔에서 데이터베이스 깨우기
3. 재시도

### 4. 스크립트 경로 오류

**원인**: 상대 경로 문제

**해결**:
```bash
# ❌ 잘못된 경로
cd /home/jammy/projects/C-OSINE
pnpm exec tsx packages/backend/src/scripts/script.ts

# ✅ 올바른 경로
cd /home/jammy/projects/C-OSINE/packages/backend
pnpm exec tsx src/scripts/script.ts
```

---

## 📝 빠른 참조 (Cheat Sheet)

### 조회 (Read)
```typescript
findUnique()   // 단일 레코드 (unique 필드로)
findFirst()    // 첫 번째 레코드
findMany()     // 여러 레코드
```

### 생성/수정 (Write)
```typescript
create()       // 새 레코드 생성
update()       // 기존 레코드 수정
upsert()       // 있으면 수정, 없으면 생성
delete()       // 레코드 삭제
```

### 고급
```typescript
$transaction() // 트랜잭션
$queryRaw()    // Raw SQL
include: {}    // 관계 포함
select: {}     // 특정 필드만
where: {}      // 조건
orderBy: {}    // 정렬
```

---

## 🔗 참고 자료

- Prisma 공식 문서: https://www.prisma.io/docs
- Neon 문서: https://neon.tech/docs
- 프로젝트 스키마: `packages/backend/prisma/schema.prisma`
