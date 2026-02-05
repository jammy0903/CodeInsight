# CodeInsight Backend

Fastify 기반 백엔드 API 서버

## Tech Stack

- **Framework**: Fastify 5.x (Express에서 마이그레이션됨, 2026-02)
- **Language**: TypeScript
- **Database**: PostgreSQL (Prisma ORM)
- **Auth**: Firebase Authentication
- **Documentation**: Swagger/OpenAPI (@fastify/swagger)

## Project Structure

```
src/
├── app.ts              # Fastify 앱 진입점
├── config/             # 환경 설정
│   ├── database.ts     # Prisma 클라이언트
│   ├── env.ts          # 환경 변수
│   ├── firebase.ts     # Firebase Admin SDK
│   └── logger.ts       # Winston 로거
├── plugins/            # Fastify 플러그인
│   ├── auth.ts         # 인증 데코레이터
│   ├── rateLimit.ts    # Rate limiting
│   └── swagger.ts      # API 문서화
├── modules/            # 도메인별 모듈
│   ├── ai/             # AI 채팅 (SSE 스트리밍)
│   ├── admin/          # 관리자 API
│   ├── analytics/      # 학습 분석
│   ├── courses/        # 코스/레슨 관리
│   ├── gamification/   # 게이미피케이션
│   ├── notes/          # 사용자 노트
│   ├── problems/       # 문제 관리
│   ├── simulators/     # 코드 시뮬레이터
│   │   ├── c/
│   │   ├── java/
│   │   ├── javascript/
│   │   └── python/
│   ├── standalone-quizzes/
│   ├── submissions/    # 제출 기록
│   ├── subscription/   # 구독 관리
│   └── users/          # 사용자 관리
├── services/           # 공유 서비스
└── utils/              # 유틸리티
```

## Authentication

Fastify 데코레이터를 통한 인증:

```typescript
// 토큰만 검증 (빠름)
fastify.get('/route', { preHandler: [fastify.requireAuth] }, handler);

// 토큰 + DB 사용자 조회 (권한 확인 가능)
fastify.get('/route', { preHandler: [fastify.requireDbUser] }, handler);

// 선택적 인증
fastify.get('/route', { preHandler: [fastify.optionalAuth] }, handler);

// Admin 전용
fastify.get('/admin/route', { preHandler: [fastify.requireAdmin] }, handler);
```

## Rate Limiting

프리셋 기반 Rate Limit:

| 프리셋 | 제한 | 용도 |
|--------|------|------|
| `standard` | 100/분 | 일반 API |
| `auth` | 10/분 | 인증 엔드포인트 |
| `ai` | 50/분 | AI 요청 |
| `execute` | 100/분 | 코드 실행 |

## Development

```bash
# 개발 서버 시작
pnpm dev

# 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

## API Documentation

개발 서버 실행 후 `/api-docs`에서 Swagger UI 확인 가능

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...

# Admin
ADMIN_FIREBASE_UID=...

# AI Provider
DEEPSEEK_API_KEY=...
OLLAMA_API_URL=http://localhost:11434
```
