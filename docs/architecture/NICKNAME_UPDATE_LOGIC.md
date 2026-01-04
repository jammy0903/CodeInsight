# 닉네임 변경 로직

> **작성일**: 2026-01-04
> **버전**: 1.0
> **상태**: ✅ 구현 완료

---

## 📋 목차

1. [개요](#개요)
2. [문제 상황](#문제-상황)
3. [해결 방법](#해결-방법)
4. [영향 받는 테이블](#영향-받는-테이블)
5. [구현 단계](#구현-단계)
6. [백업/복원 프로세스](#백업복원-프로세스)
7. [Rate Limiter 제거](#rate-limiter-제거)

---

## 개요

사용자가 닉네임을 변경할 수 있도록 시스템을 설계했습니다. CodeInsight는 닉네임을 Primary Key로 사용하고 있어, 닉네임 변경 시 관련된 모든 외래 키(FK)가 함께 업데이트되어야 합니다.

**핵심 기술**: Prisma의 `onUpdate: Cascade`를 사용하여 닉네임 변경 시 모든 참조 레코드를 자동으로 업데이트합니다.

---

## 문제 상황

### 초기 스키마 설계

```prisma
model User {
  nickname String @id  // Primary Key
  // ...
  submissions Submission[]
  drafts Draft[]
  progress UserProgress[]
}

model Submission {
  userNickname String
  user User @relation(fields: [userNickname], references: [nickname])
  // ❌ onUpdate 없음 → 닉네임 변경 불가
}
```

### 문제점

- `User.nickname`이 Primary Key
- 다른 테이블들이 `userNickname`으로 FK 참조
- **Prisma는 기본적으로 PK 업데이트 시 FK 참조를 업데이트하지 않음**
- 닉네임 변경 시도 → **FK 제약 위반 에러 발생**

### 영향 범위

닉네임 변경 시 영향을 받는 테이블:

1. ✅ `OAuthAccount` - OAuth 계정 (onDelete: Cascade 이미 있었음)
2. ❌ `Submission` - 제출 기록
3. ❌ `Draft` - 저장된 코드
4. ❌ `UserProgress` - 진행 상태

---

## 해결 방법

### Prisma `onUpdate: Cascade` 추가

모든 FK 관계에 `onUpdate: Cascade`를 추가하여, 닉네임 변경 시 모든 참조 레코드가 자동으로 업데이트되도록 합니다.

```prisma
model User {
  nickname String @id
  // ...
}

model OAuthAccount {
  userNickname String
  user User @relation(
    fields: [userNickname],
    references: [nickname],
    onDelete: Cascade,
    onUpdate: Cascade  // ✅ 추가
  )
}

model Submission {
  userNickname String
  user User @relation(
    fields: [userNickname],
    references: [nickname],
    onUpdate: Cascade  // ✅ 추가
  )
}

model Draft {
  userNickname String
  user User @relation(
    fields: [userNickname],
    references: [nickname],
    onUpdate: Cascade  // ✅ 추가
  )
}

model UserProgress {
  userNickname String
  user User @relation(
    fields: [userNickname],
    references: [nickname],
    onUpdate: Cascade  // ✅ 추가
  )
}
```

### 동작 원리

1. 사용자가 닉네임을 `"재미잼"` → `"newNickname"`으로 변경 요청
2. Prisma가 `UPDATE users SET nickname = "newNickname" WHERE nickname = "재미잼"` 실행
3. **SQLite가 자동으로 모든 FK 참조를 업데이트**:
   ```sql
   UPDATE oauth_accounts SET user_nickname = "newNickname" WHERE user_nickname = "재미잼";
   UPDATE submissions SET user_nickname = "newNickname" WHERE user_nickname = "재미잼";
   UPDATE drafts SET user_nickname = "newNickname" WHERE user_nickname = "재미잼";
   UPDATE user_progress SET user_nickname = "newNickname" WHERE user_nickname = "재미잼";
   ```
4. 모든 데이터가 일관성 있게 업데이트됨

---

## 영향 받는 테이블

| 테이블 | 컬럼 | 관계 | onUpdate 추가 전 | onUpdate 추가 후 |
|--------|------|------|------------------|------------------|
| `OAuthAccount` | `userNickname` | User FK | ✅ (onDelete만) | ✅ 완료 |
| `Submission` | `userNickname` | User FK | ❌ 업데이트 불가 | ✅ 자동 업데이트 |
| `Draft` | `userNickname` | User FK | ❌ 업데이트 불가 | ✅ 자동 업데이트 |
| `UserProgress` | `userNickname` | User FK | ❌ 업데이트 불가 | ✅ 자동 업데이트 |

---

## 구현 단계

### 1. Prisma 스키마 수정

**파일**: `packages/backend/prisma/schema.prisma`

```diff
model OAuthAccount {
  user User @relation(
    fields: [userNickname],
    references: [nickname],
    onDelete: Cascade,
+   onUpdate: Cascade
  )
}

model Submission {
  user User @relation(
    fields: [userNickname],
    references: [nickname],
+   onUpdate: Cascade
  )
}

model Draft {
  user User @relation(
    fields: [userNickname],
    references: [nickname],
+   onUpdate: Cascade
  )
}

model UserProgress {
  user User @relation(
    fields: [userNickname],
    references: [nickname],
+   onUpdate: Cascade
  )
}
```

### 2. 코스 데이터 백업

**스크립트**: `scripts/backup-courses.ts`

```bash
npx ts-node scripts/backup-courses.ts
```

**백업 대상**:
- `Language` (4개: C, Python, Java, JavaScript)
- `Chapter` (25개)
- `Lesson` (142개)
- `LessonContent` (80개)
- `Quiz` (0개)

**백업 위치**: `backups/courses-backup-{timestamp}.json`

### 3. 마이그레이션 리셋

```bash
PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="yes" pnpm prisma migrate reset --force
```

**결과**:
- 모든 사용자 데이터 삭제 (OAuthAccount, Submission, Draft, UserProgress)
- 코스 데이터 삭제 (Language, Chapter, Lesson, etc.)
- 스키마 재생성 (`onUpdate: Cascade` 포함)

### 4. 코스 데이터 복원

**스크립트**: `scripts/restore-courses.ts`

```bash
npx ts-node scripts/restore-courses.ts
```

**복원 결과**:
- ✅ 4 languages
- ✅ 25 chapters
- ✅ 142 lessons
- ✅ 80 contents
- ✅ 0 quizzes

---

## 백업/복원 프로세스

### 백업 스크립트 (`scripts/backup-courses.ts`)

**기능**:
- 코스 데이터만 백업 (사용자 데이터 제외)
- JSON 형식으로 저장
- 타임스탬프 포함 파일명

**실행**:
```bash
npx ts-node scripts/backup-courses.ts
```

**출력 예시**:
```
📦 Backing up course data...
  📚 Languages... ✅ 4 languages
  📖 Chapters... ✅ 25 chapters
  📝 Lessons... ✅ 142 lessons
  📄 Lesson Contents... ✅ 80 contents
  🧠 Quizzes... ✅ 0 quizzes
✅ Backup complete!
   📁 File: backups/courses-backup-2026-01-04T08-25-07-230Z.json
```

### 복원 스크립트 (`scripts/restore-courses.ts`)

**기능**:
- 백업 파일에서 코스 데이터 복원
- 자동으로 최신 백업 파일 사용
- 또는 특정 백업 파일 지정 가능

**실행**:
```bash
# 최신 백업 자동 사용
npx ts-node scripts/restore-courses.ts

# 특정 백업 파일 사용
npx ts-node scripts/restore-courses.ts backups/courses-backup-2026-01-04T08-25-07-230Z.json
```

**출력 예시**:
```
📥 Restoring course data...
  📁 Using latest backup: courses-backup-2026-01-04T08-25-07-230Z.json
  📊 Backup Info:
     - Timestamp: 2026-01-04T08:25:07.226Z
     - Languages: 4
     - Chapters: 25
     - Lessons: 142
  📚 Restoring Languages... ✅ 4 languages restored
  📖 Restoring Chapters... ✅ 25 chapters restored
  📝 Restoring Lessons... ✅ 142 lessons restored
✅ Restore complete!
```

---

## Rate Limiter 제거

### 문제

닉네임 중복 확인 API가 너무 자주 호출되어 Rate Limiter에 의해 차단되었습니다.

**이전 설정**:
```typescript
// app.ts
app.use('/api/v1/users', authRateLimit, userRoutes);
// authRateLimit: 10 req/min (너무 엄격)
```

**문제 상황**:
1. 페이지 이동 시 `/users/me` 호출
2. 닉네임 입력 시 `/check-nickname` 호출 (300ms debounce)
3. 빠르게 10회 초과 → **429 Too Many Requests**
4. 닉네임 중복 체크 실패 → "시작하기" 버튼 비활성화

### 해결

**Rate Limiter 완전 제거**:

```typescript
// app.ts
app.use('/api/v1/users', userRoutes); // Rate Limiter 제거
```

**이유**:
- 닉네임 중복 체크는 brute-force 공격 대상이 아님
- 사용자가 빠르게 타이핑하면서 여러 번 체크 가능해야 함
- **중복 검사는 DB에서만 수행** (Unique 제약)

**보안 고려사항**:
- 개발 환경에서는 문제없음
- 프로덕션 환경에서는 Cloudflare 같은 외부 보호 장치 필요
- 또는 더 관대한 Rate Limit 재도입 (예: 100 req/min)

---

## 참고 자료

- [Prisma Referential Actions](https://www.prisma.io/docs/concepts/components/prisma-schema/relations/referential-actions)
- [SQLite Foreign Key Support](https://www.sqlite.org/foreignkeys.html)
- [CLAUDE.md - User 스키마 설계](../../.claude/CLAUDE.md)

---

## 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2026-01-04 | 1.0 | 초기 작성 - 닉네임 변경 로직 구현 완료 |
