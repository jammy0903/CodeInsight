# CodeInsight Frontend

React + Vite 기반 웹 클라이언트입니다. 로그인 없이 동작하며, 진도와 예측 결과는 브라우저 localStorage에 저장합니다.

## Stack
- React 19, TypeScript, Vite 7
- Zustand, TanStack Query
- TailwindCSS 4, Framer Motion
- React Router, i18next (ko / en / zh)

## Directory
```text
src/
├── features/
│   ├── home/          # 랜딩 + 실행 시각화 데모 (HomeDemo, demo/recordings.json)
│   ├── courses/       # 코스·챕터·레슨 (LessonUnifiedView, usePredictGate, useStepNavigation)
│   ├── playground/    # 직접 코드 실행
│   └── visualizers/   # 언어별 시각화 (c, python, javascript, java, algorithm, shared)
├── services/
│   ├── api/           # axios 인스턴스, 에러 처리
│   ├── courses.ts     # 레슨 API
│   └── simulator/     # 언어별 시뮬레이터 클라이언트 + 응답 → LessonStep 변환
├── stores/            # store(UI), progressStore(진도·예측, localStorage), themeStore
├── locales/           # 번역 (ko, en, zh)
├── router.tsx
└── main.tsx
scripts/
└── record-home-demo.mjs   # 홈 데모용 엔진 결과 녹화
```

## 레슨 화면
한 스텝 = 설명(위, 길면 "더 보기") + 시각화(아래). 시각화 데이터가 없는 스텝은 가장 최근 시각화 상태를 유지합니다.
스텝에 `predict`가 있으면 그 스텝으로 넘어가기 전에 예측 질문을 띄웁니다 (`hooks/usePredictGate.ts`).

## Run
```bash
# 루트에서
pnpm --filter @codeinsight/frontend dev   # http://localhost:5174
```

환경변수는 모두 기본값이 있습니다 (`src/config/env.ts`).
- `VITE_API_URL`: 백엔드 주소 (기본 `http://localhost:3002`)
- `VITE_API_VERSION`: API 버전 (기본 `v1`)

`@codeinsight/shared` 스키마를 바꾼 뒤에는 Vite 사전 번들 캐시 때문에 `pnpm exec vite --port 5174 --force`로 재시작하세요.

## Scripts
```bash
pnpm --filter @codeinsight/frontend dev
pnpm --filter @codeinsight/frontend build
pnpm --filter @codeinsight/frontend type-check
pnpm --filter @codeinsight/frontend lint
pnpm --filter @codeinsight/frontend test       # vitest
pnpm --filter @codeinsight/frontend test:e2e   # playwright

# 홈 데모 다시 녹화 (백엔드 실행 중일 때)
node scripts/record-home-demo.mjs http://localhost:3002/api/v1
```

## Simulator API Contract
`src/services/simulator/`에서 언어별 API를 호출합니다.

- C: `POST /simulators/c/trace`
- Python: `POST /simulators/python/simulate`
- JavaScript: `POST /simulators/javascript/simulate`
- Java: `POST /simulators/java/simulate`

## Deployment
Vercel (`vercel.json`). `main`에 push하면 자동 배포됩니다.
