# CodeInsight 데이터베이스 스키마 규칙

## 진짜 소스 (Single Source of Truth)

**`packages/backend/prisma/schema.prisma`** — 이 파일이 유일한 스키마 정의.
아래는 작업 시 규칙과 현재 테이블 목록만 정리.

---

## 현재 테이블 목록 (2026-02)

| 도메인 | 테이블 | 설명 |
|--------|--------|------|
| **인증** | `users`, `oauth_accounts` | OAuth 기반 사용자 |
| **콘텐츠** | `languages`, `chapters`, `lessons`, `lesson_contents`, `quizzes` | 커리큘럼 구조 |
| **학습** | `user_progress`, `lesson_activities`, `step_activities` | 진행/체류 시간 |
| **분석** | `chat_histories`, `quiz_attempts`, `user_notes`, `session_contexts` | AI 사용, 퀴즈, 노트 |
| **프로필** | `user_profiles`, `user_streaks` | 온보딩, 스트릭 |
| **퀴즈** | `standalone_quizzes`, `standalone_quiz_attempts` | 독립 퀴즈 |
| **문제** | `problems`, `submissions`, `drafts` | 코딩 문제 |
| **신고** | `reports` | 신고/문의 (2026-02 추가) |

---

## 스키마 변경 규칙

### 마이그레이션
```bash
# 개발: 마이그레이션 생성 + 적용
cd packages/backend && npx prisma migrate dev --name 변경이름

# 배포: 마이그레이션만 적용 (seed는 SEED_ON_DEPLOY=true일 때만)
npx prisma migrate deploy
```

### 체크리스트
- [ ] 새 필드: NULL 허용 여부, 기본값 명시
- [ ] FK 추가: `onDelete` 정책 결정 (Cascade / SetNull / Restrict)
- [ ] 인덱스: 조회 패턴에 맞춰 추가 (복합 인덱스 우선)
- [ ] 관계 모델에 역방향 필드 추가 (`reports Report[]` 등)
- [ ] `prisma generate` 후 타입 확인

### 주의사항
- Prisma는 `prisma migrate dev`로만 마이그레이션 생성 (수동 SQL 금지)
- 사용자 데이터 테이블 (`users`, `user_progress` 등)은 **절대 삭제 금지**
- seed는 UPSERT 방식 — 기존 데이터 보존

---

## 쿼리 패턴

```typescript
// N+1 방지: include 사용
const data = await prisma.report.findMany({
  include: { user: { select: { nickname: true } } },
});

// 필요한 필드만 select
const users = await prisma.user.findMany({
  select: { id: true, nickname: true },
});

// 집계는 groupBy / aggregate
const stats = await prisma.report.groupBy({
  by: ['type'],
  _count: { id: true },
});
```

---

## 성능 타겟

| 작업 | 타겟 | 방법 |
|------|------|------|
| PK 조회 | < 10ms | PK 인덱스 |
| 목록 조회 | < 50ms | 복합 인덱스 |
| 집계 쿼리 | < 200ms | groupBy + 인덱스 |
| JSONB 조회 | < 200ms | JSONB 인덱스 |
