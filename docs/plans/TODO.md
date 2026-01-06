# CodeInsight TODO

> 마지막 업데이트: 2026-01-06

---

## 완료된 항목

- ✅ DayPage → LessonPage 리팩토링
- ✅ 코스 시스템 DB 기반 전환
- ✅ User 스키마 재설계 (닉네임 기반)
- ✅ 다중 OAuth 지원
- ✅ Axios 인프라 구축
- ✅ Docker 구조 완성
- ✅ Monorepo 전환 (`packages/shared`)
- ✅ Admin Provider Toggle
- ✅ 인증 미들웨어 (`requireDbUser`)
- ✅ 프로덕션 console.log 제거
- ✅ HomePage 리디자인 (CSS 픽셀아트 → 모던 디자인)

---

## 배포 (마지막에)

| 작업 | 상태 | 비고 |
|------|------|------|
| docker-compose.yml 경로 수정 | ✅ | monorepo 구조 반영 |
| Dockerfile monorepo 대응 | ⏳ | shared 패키지 빌드 필요 |
| `.env.production` 설정 | ⏳ | 실제 값 필요 |
| 도메인 설정 | ⏳ | Caddyfile |

---

## 연기된 계획

| 계획 | 진입 조건 | 문서 |
|------|----------|------|
| Chapter 구조 | DAU 50+ | `deferred/chapter_restructure.md` |
| Progress DB 서버 저장 | DAU 100+ | `deferred/progress_tracking.md` |

---

## 기술 스택 (확정)

- **DB**: Prisma + SQLite
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Monorepo**: pnpm workspace
