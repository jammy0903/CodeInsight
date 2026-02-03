# Frontend Refactoring Plan

> **목적**: 가시성 향상, 로직 분리, 유지보수성 개선
> **작성일**: 2026-02-03
> **상태**: Phase 1 완료, Phase 2 진행중

---

## 프로젝트 컨텍스트 (인수인계용)

### 프로젝트 개요
- **CodeInsight** — 코드 실행 학습 플랫폼 (C, Python, Java, JavaScript)
- **모노레포 구조**: `packages/frontend`, `packages/backend`, `packages/shared`
- **기술 스택**: React 18 + Vite + TypeScript + Zustand + Framer Motion + TailwindCSS
- **핵심 기능**: 레슨 단계별 코드 실행 시각화 (메모리, 터미널 출력, 플로우)

### 언어별 데이터 구조 차이 (중요!)
각 언어가 step 데이터를 다른 형태로 저장함. 리팩토링 시 반드시 인지해야 함:

```
C:          step.stdout (문자열), step.stack/heap (MemoryBlock[])
Python:     step.pythonMemoryState.output (배열), step.pythonMemoryState.names/objects
Java:       step.javaMemoryState.output (배열), step.javaMemoryState.stack/heap
JavaScript: step.eventLoopState.output (배열), step.eventLoopState.*
```

### 현재 알려진 이슈
- `MemoryBlockSchema.address`는 optional로 변경됨 (C 레슨 JSON에 address 없는 항목 존재)
- `terminalLines` 로직은 `languageId` 기반 분기로 최근 수정 완료
- Dead Code Cleanup이 한번 시도되었다가 revert됨 (메모리 뷰어 깨짐 이슈)

### 빌드/검증 명령어
```bash
pnpm --filter frontend build    # 프론트엔드 빌드 확인
pnpm --filter @codeinsight/backend build  # 백엔드 빌드 확인
pnpm build                      # 전체 빌드
```

### 리팩토링 시 반드시 지켜야 할 규칙
1. 파일 이동 전 `grep -r "파일명" packages/frontend/src` 로 의존성 확인
2. 파일 이동은 `git mv` 사용 (히스토리 보존)
3. import 경로는 `@/` alias 사용 (`@/ = packages/frontend/src/`)
4. 이동 후 `pnpm --filter frontend build` 로 빌드 확인 필수
5. 모바일/데스크톱 양쪽 다 확인 (MobileLessonView.tsx 별도 존재)

---

## Phase 1: CRITICAL — LessonPage.tsx (1,041줄)

### 현재 상태
`packages/frontend/src/features/courses/LessonPage.tsx` 하나에 모든 로직이 들어있음:
- 라우트 파라미터 처리 (`useParams`)
- 레슨 데이터 패칭 (TanStack Query)
- 실시간 코드 시뮬레이션 실행 및 결과 머지
- 스텝 네비게이션
- 퀴즈 모달
- 터미널 출력 처리 (`terminalLines`)
- Python/Java/C 메모리 상태 변환
- 모바일/데스크톱 레이아웃 분기
- AI 채팅 통합
- 완료 플로우 (스트릭 업데이트)
- useEffect 7개 이상

### 목표 구조
```
features/courses/
├── LessonPage.tsx                    # 메인 (라우트 + 레이아웃 선택, ~150줄)
├── hooks/
│   ├── useLessonData.ts              # 레슨 데이터 패칭 + TanStack Query
│   ├── useLessonSimulation.ts        # 시뮬레이션 실행 + JSON/시뮬 스텝 머지
│   ├── useLessonTerminal.ts          # terminalLines 계산 (languageId 분기)
│   ├── useLessonNavigation.ts        # 이미 존재 — 변경 없음
│   ├── useLessonVisualization.ts     # 이미 존재 — 변경 없음
│   └── useLessonAnalytics.ts         # 이미 존재 — Phase 3에서 분리
├── components/
│   ├── LessonDesktopLayout.tsx       # 데스크톱 2패널 레이아웃
│   ├── LessonCompletedView.tsx       # 완료 화면
│   ├── LessonQuizModal.tsx           # 퀴즈 다이얼로그
│   └── LessonBottomNav.tsx           # 하단 네비게이션 바
│   └── memory/                       # 기존 유지
│   └── mobile/                       # 기존 유지
└── utils/
    └── simulationMerger.ts           # JSON 스텝 + 시뮬레이터 스텝 머지 로직
```

### 작업 순서
1. `useLessonTerminal.ts` 추출 — terminalLines useMemo를 훅으로 분리 (가장 독립적)
2. `useLessonSimulation.ts` 추출 — 시뮬레이션 실행 + 머지 로직 분리
3. `useLessonData.ts` 추출 — TanStack Query 패칭 로직 분리
4. `LessonDesktopLayout.tsx` 추출 — JSX 렌더링 분리
5. `LessonCompletedView.tsx`, `LessonQuizModal.tsx` 추출
6. `LessonPage.tsx`는 훅 조합 + 레이아웃 선택만 남김

### 주의사항
- `useLessonSimulation`에서 Python 시뮬레이터 결과를 `pythonMemoryState`로 변환하는 로직 (390~450줄 부근)이 복잡함. 별도 유틸로 추출 권장
- `steps` 변수는 "JSON 스텝 + 시뮬레이터 스텝 머지 결과"인데, 이 머지 로직이 useEffect 안에 있어서 추출 시 의존성 주의
- 모바일은 `MobileLessonView.tsx`가 별도로 존재하므로 데스크톱만 분리하면 됨

---

## Phase 2: CRITICAL — MemoryPanel.tsx (1,057줄)

### 현재 상태
`packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx`에 5개 서브컴포넌트가 전부 정의됨:
- `StackSection` — 스택 메모리 블록 렌더링
- `HeapSection` — 힙 메모리 블록 렌더링
- `LowerMemorySections` — BSS/Data/Text 섹션
- `MemoryBlockCard` — 개별 메모리 블록 카드
- `ArrayBlock` — 배열 확장/축소

추가로 유틸 함수들이 인라인:
- `getFrameColors()` — 프레임별 색상 매핑
- `isGarbageValue()` — 쓰레기값 감지
- `parseVariableName()` — 변수명 파싱

### 목표 구조
```
features/courses/components/memory/
├── MemoryPanel.tsx              # 메인 컨테이너 (~100줄)
├── StackSection.tsx             # 스택 영역
├── HeapSection.tsx              # 힙 영역
├── LowerMemorySections.tsx      # BSS/Data/Text
├── MemoryBlockCard.tsx          # 개별 블록 카드
├── ArrayBlock.tsx               # 배열 블록
├── hooks/
│   ├── useMemoryColors.ts       # 테마 기반 색상
│   └── useArrayExpansion.ts     # 배열 확장/축소 상태
└── utils/
    ├── frameColors.ts           # 프레임 색상 매핑
    └── memoryHelpers.ts         # isGarbageValue, parseVariableName
```

### 작업 순서
1. `utils/` 먼저 추출 (의존성 없음)
2. `MemoryBlockCard.tsx`, `ArrayBlock.tsx` 추출 (단위 컴포넌트)
3. `StackSection.tsx`, `HeapSection.tsx` 추출
4. `MemoryPanel.tsx`는 조합만 담당하도록 정리

### 주의사항
- `MemoryBlockCard`가 `address` 기준으로 정렬하는데, `address`가 optional이므로 `parseInt(undefined, 16)` → NaN 주의
- `StackSection`에서 `parseInt(a.address, 16)` 정렬 로직이 있음 — address 없는 항목 처리 필요

---

## Phase 3: CRITICAL — AnalyticsSection.tsx (748줄)

### 현재 상태
`packages/frontend/src/features/dashboard/components/AnalyticsSection.tsx`:
- 주간 활동 차트 (bar)
- 시간대별 활동 차트 (horizontal bar)
- 1년 잔디 캘린더 (GitHub 스타일)
- AI 분석 모달
- 상세 리포트 모달
- 테마 색상 하드코딩 50줄
- `generateAnalysis()` 함수 70줄 인라인

### 목표 구조
```
features/dashboard/components/analytics/
├── AnalyticsSection.tsx         # 메인 컨테이너 (~100줄)
├── WeeklyActivityChart.tsx      # 주간 차트
├── HourlyActivityChart.tsx      # 시간대 차트
├── ContributionCalendar.tsx     # 잔디 캘린더
├── AnalysisResultModal.tsx      # AI 분석 결과 모달
├── hooks/
│   └── useAnalyticsData.ts      # 데이터 패칭 + 변환
└── utils/
    ├── generateAnalysis.ts      # AI 텍스트 생성 로직
    └── analyticsColors.ts       # 테마 색상 매핑
```

---

## Phase 4: HIGH — PlaygroundPage.tsx (706줄)

### 현재 상태
`packages/frontend/src/features/playground/PlaygroundPage.tsx`:
- 테마 색상 정의 110줄이 파일 상단에 하드코딩
- 모바일/데스크톱 레이아웃 중복
- 코드 에디터 + 시각화 패널 + 터미널

### 목표 구조
```
features/playground/
├── PlaygroundPage.tsx           # 메인 (~150줄)
├── components/
│   ├── PlaygroundCodePanel.tsx   # 좌측 코드 에디터
│   ├── PlaygroundVisPanel.tsx    # 우측 시각화
│   └── PlaygroundFooter.tsx      # 하단 정보
└── styles/
    └── playgroundTheme.ts        # 테마 색상 추출
```

---

## Phase 5: HIGH — simulator.ts (516줄)

### 현재 상태
`packages/frontend/src/services/simulator.ts`:
- 4개 언어 시뮬레이션 API 호출이 전부 한 파일
- 각 언어별 결과 변환 로직 반복
- 새 언어 추가 시 500줄 파일 전체를 건드려야 함

### 목표 구조
```
services/simulator/
├── index.ts                     # SimulatorService 클래스 (라우팅만, ~80줄)
├── cSimulator.ts                # C 시뮬레이션 + 변환
├── pythonSimulator.ts           # Python 시뮬레이션 + 변환
├── javaSimulator.ts             # Java 시뮬레이션 + 변환
├── jsSimulator.ts               # JavaScript 시뮬레이션 + 변환
└── types.ts                     # 공유 타입
```

### 주의사항
- `SimulatorService`는 싱글톤으로 export됨 — import 경로 변경 시 전체 검색 필요
- `packages/frontend/src/services/index.ts` 에서 re-export하고 있을 수 있음

---

## Phase 6: MEDIUM — store.ts (167줄)

### 현재 상태
`packages/frontend/src/stores/store.ts` — God 스토어:
- UI 상태 (사이드바, 페이지 타이틀)
- 인증 상태 (Firebase user, App user)
- 온보딩 상태
- 스트릭 상태
- 채팅 메시지
- 코드 시뮬레이터 상태

### 목표 구조
```
stores/
├── uiStore.ts           # 사이드바, 페이지 타이틀
├── authStore.ts          # Firebase user, App user, 온보딩
├── streakStore.ts        # 스트릭 (이미 일부 분리?)
├── chatStore.ts          # AI 채팅 메시지
├── simulatorStore.ts     # 코드, 시뮬레이션 스텝
└── index.ts              # re-export
```

### 주의사항
- `useStore`로 import하는 곳이 수십 곳 — 한번에 바꾸면 위험. 점진적 분리 권장
- 분리 후에도 기존 `useStore`에서 re-export하면 호환성 유지 가능

---

## Phase 7: MEDIUM — analytics.ts (379줄) + useLessonAnalytics.ts (289줄)

### analytics.ts
7개 기능 (활동 추적, 퀴즈, 프로필, 세션, AI 분석 등)을 분리:
```
services/analytics/
├── index.ts
├── activityService.ts
├── quizService.ts
├── profileService.ts
└── reportService.ts
```

### useLessonAnalytics.ts
복잡한 Ref/Map 상태와 브라우저 API를 분리:
```
hooks/analytics/
├── useLessonAnalytics.ts    # 메인 (~100줄)
├── useActivityTracking.ts   # 활동 시작/종료
├── useStepTracking.ts       # 스텝 시간 측정
└── useVisibilityTracking.ts # 탭 포커스 감지
```

---

## 전체 작업 체크리스트

- [x] **Phase 1**: LessonPage.tsx 분리 (1042줄→276줄, 커밋 1b4eddc2)
- [ ] **Phase 2**: MemoryPanel.tsx 분리
- [ ] **Phase 3**: AnalyticsSection.tsx 분리
- [ ] **Phase 4**: PlaygroundPage.tsx 분리
- [ ] **Phase 5**: simulator.ts 언어별 분리
- [ ] **Phase 6**: store.ts 도메인별 분리
- [ ] **Phase 7**: analytics 서비스/훅 분리

### 각 Phase 완료 기준
1. `pnpm --filter frontend build` 성공
2. 기존 import 경로 잔존 0건 (`grep` 확인)
3. 분리된 각 파일이 단일 책임을 가짐
4. 기존 기능이 모바일/데스크톱 양쪽에서 정상 동작
