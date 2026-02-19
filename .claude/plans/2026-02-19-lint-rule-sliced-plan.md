# Frontend Lint 누적 이슈 규칙별 단계 정리 (2026-02-19)

## 기준선 (실측)
- 명령: `pnpm --filter @codeinsight/frontend lint`
- 결과: **0 errors / 148 warnings**
- 분포:
  - `@typescript-eslint/no-explicit-any`: **137** (16 files)
  - `react-refresh/only-export-components`: **11** (6 files)

## 규칙별 상세 분포

### 1) `@typescript-eslint/no-explicit-any` (137)
- 31: `packages/frontend/src/features/courses/hooks/useLessonVisualization.ts`
- 27: `packages/frontend/src/features/visualizers/LessonFlowVisualizer.tsx`
- 12: `packages/frontend/src/features/courses/hooks/useLessonSimulation.ts`
- 11: `packages/frontend/src/features/visualizers/javascript/adapters/JSTransformer.ts`
- 9: `packages/frontend/src/features/courses/LanguageCoursePage.tsx`
- 9: `packages/frontend/src/features/visualizers/java/adapters/JavaTransformer.ts`
- 9: `packages/frontend/src/features/visualizers/java/adapters/toJavaMemoryView.ts`
- 8: `packages/frontend/src/features/visualizers/shared/hooks/useLessonTerminal.ts`
- 7: `packages/frontend/src/features/visualizers/python/adapters/PyTransformer.ts`
- 15: 기타 7개 파일

### 2) `react-refresh/only-export-components` (11)
- 5: `packages/frontend/src/features/visualizers/c/index.tsx`
- 2: `packages/frontend/src/router.tsx`
- 1: `packages/frontend/src/components/ui/badge.tsx`
- 1: `packages/frontend/src/components/ui/button.tsx`
- 1: `packages/frontend/src/features/quiz/__mocks__/framer-motion.tsx`
- 1: `packages/frontend/src/features/visualizers/java/index.tsx`

## 단계별 실행 계획

### Phase A (고효율, 대량 감소): Course 훅/페이지 `any` 제거
- 대상(69):
  - `useLessonVisualization.ts`, `useLessonSimulation.ts`, `LanguageCoursePage.tsx`, `useLessonTerminal.ts`
  - `LessonUnifiedView.tsx`, `memoryHelpers.ts`, `memoryUtils.ts`, `resolveStepLines.ts`
- 방식:
  - `unknown` + 타입 가드/좁히기 우선
  - 공통 DTO 타입 정의 후 재사용 (step/visualization payload)
- 목표:
  - `no-explicit-any` 137 -> **68 이하**

### Phase B (시각화 코어): Visualizer 어댑터 `any` 제거
- 대상(67):
  - `LessonFlowVisualizer.tsx`, `JSTransformer.ts`, `JavaTransformer.ts`, `toJavaMemoryView.ts`
  - `PyTransformer.ts`, `CTransformer.ts`, `JavaMemoryView.tsx`
- 방식:
  - 언어별 중간 정규화 타입(`Normalized*State`) 추가
  - 변환 함수 입력을 `Record<string, unknown>`로 받고 내부에서 타입가드 처리
- 목표:
  - `no-explicit-any` **0~10 수준** (잔여는 백엔드 계약 불명확 영역만 제한적 허용)

### Phase C (구조 정리): `react-refresh/only-export-components` 제거
- 대상(11)
- 방식:
  - 컴포넌트 export 파일과 상수/헬퍼 export 파일 분리
  - mock 파일은 테스트 전용 예외 또는 별도 파일 이동
- 목표:
  - `react-refresh/only-export-components` **0**

### Phase D (마감)
- 린트 경고 0 또는 승인된 예외만 남기고 주석/문서화
- 필요시 `@typescript-eslint/no-explicit-any`를 warning -> error로 환원

## 단계별 검증 규칙
- 각 Phase 종료 시:
  - `pnpm --filter @codeinsight/frontend type-check`
  - `pnpm --filter @codeinsight/frontend lint`
- 회귀 방지:
  - 변경 파일 단위로 최소 smoke 실행 (관련 페이지 진입/기본 동작 확인)

## 리스크
- 시뮬레이터/시각화 payload가 언어별로 느슨해서 타입화 중 런타임 필드 누락 가능
- 대응:
  - 강제 단언(`as`) 최소화
  - 기본값 보정 + 타입가드 함수 재사용
