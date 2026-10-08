# Database Schema Reference

**Source of Truth**: `packages/backend/prisma/schema.prisma`

DB는 레슨 콘텐츠 저장용입니다. 사용자·진도 테이블은 없습니다 (2026-10 포트폴리오 전환 시 제거, 진도는 프론트 localStorage).

## Tables
| Model | Table | 설명 |
|-------|-------|------|
| Language | languages | c, python, java, javascript |
| Chapter | chapters | 언어별 챕터 |
| Lesson | lessons | 챕터별 레슨 |
| LessonContent | lesson_contents | 코드 + 스텝(JSON), lessons에 cascade |
| Quiz | quizzes | 레슨 퀴즈, lessons에 cascade |

## Content
- 원본: `packages/backend/prisma/content/{lang}/lessons/*.json` (ko + `.en` / `.zh`)
- 스텝은 delta 형식 → 서버에서 `expandDeltaSteps`로 전체 상태로 펼침
- `npx prisma db seed`로 upsert (배포 시 Fly `release_command`가 실행)

## Migration
```bash
# Dev: Create + apply
cd packages/backend && npx prisma migrate dev --name name

# Prod: Fly 배포 시 release_command가 자동 실행 (migrate deploy + seed)
```

**Checklist**: NULL policy → FK onDelete → Indexes → Reverse fields
