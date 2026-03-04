# CodeInsight Frontend

React + Vite 기반의 CodeInsight 웹 클라이언트입니다.

## Stack
- React 19
- TypeScript
- Vite 7
- Zustand
- TanStack Query
- TailwindCSS
- Framer Motion
- React Router

## Directory
```text
src/
├── features/        # 도메인별 UI (courses, playground, quiz, report ...)
├── services/        # API 클라이언트, simulator 연동, firebase
├── stores/          # 전역 상태 (auth/ui 등)
├── components/      # 공통 컴포넌트
├── layouts/         # 레이아웃/네비게이션
├── router.tsx       # 라우트 정의
└── main.tsx         # 앱 엔트리포인트
```

## Prerequisites
- Node.js 18+
- pnpm 8+

## Environment Variables
`packages/frontend/.env.example`을 참고해 `.env.development` 또는 `.env.production`을 구성하세요.

주요 변수:
- `VITE_API_URL`: 백엔드 API 주소
- `VITE_API_VERSION`: API 버전
- Firebase 관련 `VITE_FIREBASE_*`

## Run
```bash
# 루트에서
pnpm --filter @codeinsight/frontend dev
```

기본 개발 서버: `http://localhost:5174`

## Scripts
```bash
pnpm --filter @codeinsight/frontend dev
pnpm --filter @codeinsight/frontend build
pnpm --filter @codeinsight/frontend type-check
pnpm --filter @codeinsight/frontend lint
pnpm --filter @codeinsight/frontend test:e2e
```

## Simulator API Contract (요약)
프론트는 `src/services/simulator/`에서 언어별 API를 호출합니다.

- C: `POST /simulators/c/trace`
- Python: `POST /simulators/python/simulate`
- JavaScript: `POST /simulators/javascript/simulate`
- Java: `POST /simulators/java/simulate`
- C++: `POST /simulators/cpp/simulate`

## Notes
- 현재 저장소의 일부 `.claude` 문서는 계획/기록 성격이며, 실제 동작 확인은 코드 기준으로 판단하세요.
- 라우트/상태 구조 변경 시 `router.tsx`, `stores/`, `services/`를 함께 점검하는 것을 권장합니다.
