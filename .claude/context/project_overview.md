# CodeInsight 프로젝트 개요

## 🎯 프로젝트
**코드 실행을 단계별로 시각화하는 교육 플랫폼** (C, Python, JavaScript, Java)

## 🏗️ 핵심: 이중 실행 구조

| 모드 | 방식 | 사용처 |
|------|------|--------|
| **Lesson** | JSON 사전 스크립팅 (시뮬레이터 불필요) | 교육 콘텐츠 |
| **Playground** | 동적 실행 (시뮬레이터 사용) | 사용자 실습 |

**JSON 경로**: `packages/backend/prisma/content/{language}/lessons/`

**Python 모델**: `names[]` (이름표) + `objects[]` (참조 객체)

**C 모델**: 메모리 스택/힙 시각화

## 🏢 구조
- **Frontend**: React/Vite (`packages/frontend/src/`)
- **Backend**: Node.js/Fastify (`packages/backend/src/`)
- **Database**: Neon PostgreSQL

## 📚 참고
- 상세 아키텍처: See `architecture.md`, `frontend_arch.md`, `backend_arch.md`
- Lesson JSON 상세: See `packages/backend/prisma/content/`
- API Routes: See `.claude/rules/API_ROUTES.md`
