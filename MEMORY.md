# MEMORY.md

## Project Snapshot (Updated: 2026-03-04)
- 프로젝트: CodeInsight (코드 실행 시각화 학습 플랫폼)
- 구조: monorepo (`packages/frontend`, `packages/backend`, `packages/shared`)
- 백엔드: Fastify + Prisma + PostgreSQL
- 프론트: React + Vite + TypeScript

## Ongoing Work Context
- Python lesson JSON 설명문 개선/정리 작업이 계속 진행 중.
- `.claude` 운영 문서 일부가 현재 코드 상태보다 뒤쳐져 있어 주기적 갱신 필요.

## Operational Preferences
- 작업 전에 현재 코드/문서 실측 후 판단하기.
- 계획 문서보다 실제 코드 상태(`app.ts`, 서비스 엔트리, git status)를 우선 신뢰하기.

## 2026-03-05 - JS Viewer Fix Record
- 사용자 이슈: "중국어가 안 보이고, Playground 버튼/JS 뷰어 탭이 안 보임".
- 원인:
  - 현재 작업 브랜치에 `zh` 로케일 파일/리소스 연결이 누락됨.
  - `PlaygroundPage`가 JS를 시각화 렌더 조건에서 제외하고 있어 JS 관련 탭이 표시되지 않음.
- 수정:
  - `packages/frontend/src/i18n.ts`에 `zh` 리소스 복구.
  - `packages/frontend/src/locales/zh/translation.json` 복구.
  - `packages/frontend/src/components/LanguageSelector.tsx`를 3개 언어(`en/ko/zh`) 선택 구조로 복구.
  - `packages/frontend/src/features/playground/PlaygroundPage.tsx`를 JS 탭 로직 포함 버전으로 복구 (`showJsMemoryTab`, `canRenderVisualizer`에 JS 포함).
- 검증:
  - `pnpm --filter @codeinsight/frontend build` 성공.
  - 실행 중 dev 서버(`127.0.0.1:5174`)에서 소스 응답 확인:
    - `i18n.ts`에 `zhTranslation` 로딩 확인.
    - `LanguageSelector.tsx`에 `中文`/`grid-cols-3` 확인.
    - `PlaygroundPage.tsx`에 `jsMemory`/`showJsMemoryTab` 확인.
    - `StepControls.tsx`에 `playground-run-button` 존재 확인.

## 2026-03-05 - Frontend Workflow Preference
- 사용자 명시 선호: 프론트 UI/스타일 작업은 핫리로드로 확인.
- 기본 원칙: 사용자가 요청하지 않으면 `pnpm build` 자동 실행하지 않음.
