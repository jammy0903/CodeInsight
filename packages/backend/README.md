# CodeInsight Backend

Fastify 기반 API 서버입니다. 레슨 콘텐츠 조회와 언어별 코드 실행 추적(시뮬레이터)을 제공합니다. 인증은 없습니다.

## Tech Stack

- **Framework**: Fastify 5
- **Language**: TypeScript (Node.js 22+)
- **Database**: PostgreSQL + Prisma 7 (레슨 콘텐츠만)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI (`/api-docs`)

## Project Structure

```
src/
├── app.ts                  # Fastify 앱 진입점, 라우트 등록
├── config/                 # 환경 변수(env.ts), Prisma 클라이언트, 로거
├── plugins/
│   ├── rateLimit.ts        # 전역 rate limit (IP당 분당 100회, 429)
│   └── swagger.ts          # API 문서화
├── modules/
│   ├── courses/            # 언어·챕터·레슨 조회 (read-only)
│   ├── executors/          # 실행기 공통 타입
│   ├── shared/             # 시뮬레이터 공용 표현식 처리
│   └── simulators/
│       ├── c/              # gcc + GDB/MI 추적, 컴파일·실행
│       ├── python/         # sys.settrace 에이전트 (agent/debugger_agent.py)
│       ├── javascript/     # V8 Inspector 엔진 (기본) / AST 엔진 (legacy)
│       ├── java/           # JDI 디버거 에이전트 (agent/, Java 17)
│       └── shared/gdb/     # GDB/MI 엔진·파서
├── services/
│   └── lessonContentLoader.ts  # 레슨 JSON 파일 스캔·프리로드
└── utils/
    └── expandDeltaSteps.ts # delta 형식 스텝 → 전체 상태
prisma/
├── schema.prisma           # Language, Chapter, Lesson, LessonContent, Quiz
├── migrations/
├── content/{c,python,javascript,java}/  # 레슨 원본 JSON (ko / .en / .zh)
└── seed.ts                 # 콘텐츠 upsert
```

## API

모든 경로는 `/api/v1` 아래에 있습니다. 전체 목록: [`.claude/rules/API_ROUTES.md`](../../.claude/rules/API_ROUTES.md)

| Method | Path | 설명 |
|--------|------|------|
| GET | `/courses/:lang` | 언어 + 챕터 |
| GET | `/courses/lessons/:id` | 레슨 콘텐츠 + 퀴즈 |
| POST | `/simulators/c/trace` | C 단계 추적 |
| POST | `/simulators/python/simulate` | Python 단계 추적 |
| POST | `/simulators/javascript/simulate` | JS 단계 추적 |
| POST | `/simulators/java/simulate` | Java 단계 추적 (`sourceCode`) |

## 시뮬레이터 실행 환경

시뮬레이터는 API 서버의 자식 프로세스로 실행됩니다. 실행 시간 제한, 스텝 상한, 위험 패턴 검사, 최소 환경변수(`simulators/safe-env.ts`)를 적용합니다. 실행 단위 컨테이너 격리는 없습니다.

로컬에서 모든 시뮬레이터를 돌리려면 GCC·GDB, Python 3, JDK 17이 필요합니다. 없으면 Docker 이미지를 쓰세요.

## Development

```bash
pnpm dev     # ts-node-dev (src/app.ts)
pnpm build   # tsc → dist/
pnpm start   # node dist/app.js
pnpm test    # vitest (C 시뮬레이터 테스트는 gdb 필요)

# DB
npx prisma migrate dev
npx prisma db seed
```

## Environment Variables

모든 값에 기본값이 있습니다 (`src/config/env.ts`). 목록: [`.env.example`](.env.example)

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `DATABASE_URL` | 로컬 PostgreSQL | 레슨 콘텐츠 DB |
| `PORT` | 3002 | 서버 포트 |
| `CORS_ORIGINS` | `http://localhost:5174` | 허용 출처 (쉼표 구분) |
| `JS_SIM_ENGINE` | `inspector` | `inspector` 또는 `legacy` |

## Deployment

Fly.io (`fly.toml`, `Dockerfile`). 배포 시 `release_command`가 `prisma migrate deploy && prisma db seed`를 실행합니다. 자세한 내용: [`.claude/deployment_info.md`](../../.claude/deployment_info.md)
