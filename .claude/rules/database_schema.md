# CodeInsight 데이터베이스 스키마

## 📊 ERD (Entity-Relationship Diagram)

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│    User     │─────1──┬─│   Lesson     │─────1──┬─│  Submission  │
│             │        │ │              │        │ │              │
│ id (PK)     │        │ │ id (PK)      │        │ │ id (PK)      │
│ email       │        │ │ title        │        │ │ code         │
│ name        │        │ │ content      │        │ │ result       │
│ role        │        │ │ language     │        │ │ passed       │
│ createdAt   │        │ │ createdAt    │        │ │ createdAt    │
└─────────────┘        │ └──────────────┘        │ └──────────────┘
                       │                         │
                       └─────────────────────────┘
```

---

## 🗄️ 테이블 정의

### User
```prisma
model User {
  id            Int       @id @default(autoincrement())
  email         String    @unique
  password      String    // bcrypt 해시
  name          String
  role          String    @default("student") // student, teacher, admin
  avatar        String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 관계
  lessons       Lesson[]
  submissions   Submission[]
}
```

### Lesson
```prisma
model Lesson {
  id            Int       @id @default(autoincrement())
  title         String
  description   String?
  content       String    // 마크다운
  language      String    // c, python, js, java
  difficulty    String    @default("easy") // easy, medium, hard
  initialCode   String?   // 초기 템플릿
  expectedOutput String?  // 기대 결과

  creatorId     Int
  creator       User      @relation(fields: [creatorId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 관계
  submissions   Submission[]
  testCases    TestCase[]
}
```

### Submission
```prisma
model Submission {
  id            Int       @id @default(autoincrement())
  code          String
  language      String
  result        Json      // 시뮬레이터 결과 전체
  passed        Boolean   @default(false)

  userId        Int
  user          User      @relation(fields: [userId], references: [id])

  lessonId      Int?
  lesson        Lesson?   @relation(fields: [lessonId], references: [id])

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([lessonId])
}
```

### TestCase
```prisma
model TestCase {
  id            Int       @id @default(autoincrement())
  lessonId      Int
  lesson        Lesson    @relation(fields: [lessonId], references: [id])

  input         String?   // stdin
  expectedOutput String   // stdout
  description   String?

  @@unique([lessonId, id])
}
```

---

## 🔑 데이터 타입 매핑

| 필드 | Prisma | PostgreSQL | 설명 |
|------|--------|-----------|------|
| id | Int | SERIAL | 자동 증가 ID |
| email | String | VARCHAR | 이메일 (유니크) |
| name | String | VARCHAR | 사용자 이름 |
| content | String | TEXT | 긴 텍스트 (마크다운) |
| result | Json | JSONB | 시뮬레이터 결과 |
| createdAt | DateTime | TIMESTAMP | 생성 시각 |
| password | String | VARCHAR | bcrypt 해시 |

---

## 🔐 제약 조건

### 유니크 제약
```prisma
model User {
  email         String    @unique
}

model Lesson {
  id            Int       @id @default(autoincrement())
}
```

### 외래 키 제약
```prisma
model Submission {
  userId        Int
  user          User      @relation(fields: [userId], references: [id])
}
```

### 인덱스
```prisma
model Submission {
  userId        Int
  lessonId      Int?

  @@index([userId])      // 사용자별 제출 조회 최적화
  @@index([lessonId])    // 레슨별 제출 조회 최적화
}
```

---

## 📈 마이그레이션

### 마이그레이션 생성
```bash
npx prisma migrate dev --name add_user_table
```

### 기존 마이그레이션 적용
```bash
npx prisma migrate deploy
```

### 마이그레이션 롤백 (개발 환경)
```bash
npx prisma migrate reset
```

---

## 🔄 관계 설계

### 1:N (User → Submission)
한 사용자가 여러 제출을 할 수 있음:
```prisma
model User {
  submissions   Submission[]
}

model Submission {
  user          User      @relation(fields: [userId], references: [id])
}
```

### N:N (향후)
여러 학생이 여러 강좌를 들을 수 있음:
```prisma
model Enrollment {
  id            Int       @id @default(autoincrement())
  studentId     Int
  student       User      @relation(fields: [studentId], references: [id])

  courseId      Int
  course        Course    @relation(fields: [courseId], references: [id])
}
```

---

## 💾 데이터 저장 전략

### Submission.result 구조
```json
{
  "status": "success",
  "totalSteps": 42,
  "steps": [
    {
      "step": 1,
      "line": 1,
      "variables": { "x": 5 },
      "memory": { ... }
    }
  ],
  "error": null
}
```

### 왜 JSON으로 저장하는가?
- 시뮬레이터 결과는 구조화되지 않음 (언어별로 다름)
- 쿼리할 필요 없음 (조회만 함)
- 용량 효율적 (JSONB 인덱싱)

---

## 🛡️ 데이터 무결성

### NOT NULL
```prisma
model User {
  email         String    @unique  // NULL 허용 안 함
  name          String
}

model Lesson {
  title         String
  content       String
  language      String
}
```

### 기본값
```prisma
model User {
  role          String    @default("student")
  createdAt     DateTime  @default(now())
}

model Submission {
  passed        Boolean   @default(false)
}
```

---

## 📝 쿼리 최적화

### N+1 문제 방지
```typescript
// ❌ Bad
const submissions = await prisma.submission.findMany();
for (const sub of submissions) {
  const user = await prisma.user.findUnique({ where: { id: sub.userId } });
}

// ✅ Good
const submissions = await prisma.submission.findMany({
  include: { user: true }
});
```

### 필드 선택
```typescript
// ✅ Good - 필요한 필드만
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true }
});

// ❌ Bad - 모든 필드 로드
const users = await prisma.user.findMany();
```

---

## 🔄 데이터 일관성

### 계단식 삭제
```prisma
model User {
  submissions   Submission[] @relation(onDelete: Cascade)
}
```

사용자 삭제 시 자동으로 해당 제출도 삭제됨.

---

## 📊 성능 타겟

| 작업 | 타겟 | 방법 |
|------|------|------|
| 사용자 조회 | < 10ms | PK 인덱스 |
| 제출 목록 | < 50ms | userId 인덱스 |
| 제출 저장 | < 100ms | JSONB |
| 결과 쿼리 | < 200ms | JSONB 인덱스 |
