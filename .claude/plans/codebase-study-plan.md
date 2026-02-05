# CodeInsight 코드베이스 전체 학습 계획

**목적**: 모든 코드에 "왜 이 코드를 썼는가" 주석을 달기 위한 체계적 학습 순서
**작성일**: 2026-02-04
**상태**: 진행 전

---

## 학습 원칙

1. **상류 → 하류 순서**: 데이터가 흘러오는 방향을 따라 읽는다
2. **진입점 → 세부 구현**: 앱이 시작되는 곳부터 안으로 파고든다
3. **타입 먼저**: 데이터 구조를 이해해야 로직이 읽힌다
4. **한 파일 완전 이해 → 다음 파일**: 건너뛰지 않는다

---

## 1단계: 프로젝트 뼈대 (진입점 & 설정)

> **목표**: "이 앱이 어떻게 시작되고, 어떤 구조로 되어 있는가"

### 1-1. 모노레포 설정
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 1 | `package.json` (루트) | 모노레포 전체 스크립트 구조, workspace 정의 |
| 2 | `pnpm-workspace.yaml` | 패키지 간 관계 정의 |
| 3 | `packages/frontend/package.json` | 프론트엔드 의존성 전체 목록 |
| 4 | `packages/backend/package.json` | 백엔드 의존성 전체 목록 |
| 5 | `packages/shared/package.json` | 공유 패키지 구조 |

### 1-2. 프론트엔드 진입점
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 6 | `packages/frontend/vite.config.ts` | 빌드 설정, alias, 포트, CSP 헤더 |
| 7 | `packages/frontend/tsconfig.app.json` | TypeScript 컴파일 옵션, path alias |
| 8 | `packages/frontend/src/main.tsx` | React 앱 최초 진입점 (React root, i18n, Firebase, Router, Toast) |
| 9 | `packages/frontend/src/router.tsx` | 전체 라우팅 맵 = 앱의 페이지 구조 |
| 10 | `packages/frontend/src/index.css` | TailwindCSS 글로벌 스타일 |

### 1-3. 백엔드 진입점
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 11 | `packages/backend/tsconfig.json` | 백엔드 TS 설정 |
| 12 | `packages/backend/src/app.ts` | Express 서버 진입점 (미들웨어, 라우트 등록, Firebase, 레슨 로더) |
| 13 | `packages/backend/src/config/index.ts` | 환경 변수 & 전역 설정 |
| 14 | `packages/backend/src/config/logger.ts` | Winston 로거 설정 |
| 15 | `packages/backend/src/middleware/auth.ts` | Firebase 인증 미들웨어 |
| 16 | `packages/backend/src/middleware/rateLimiter.ts` | API Rate limiting 설정 |

### 1단계 완료 체크리스트
- [ ] 앱이 시작될 때 어떤 순서로 초기화되는지 설명할 수 있다
- [ ] 프론트엔드 라우팅 구조를 그릴 수 있다
- [ ] 백엔드 API 라우트 등록 순서를 설명할 수 있다
- [ ] 모노레포에서 패키지 간 참조 방식을 이해했다

---

## 2단계: 공유 타입 & 데이터 모델

> **목표**: "이 앱이 다루는 데이터의 형태를 안다"

### 2-1. Shared 패키지 (Frontend ↔ Backend 공통)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 17 | `packages/shared/src/index.ts` | 공유 패키지 진입점, 뭘 export하는지 |
| 18 | `packages/shared/src/types/index.ts` | 타입 re-export 구조 |
| 19 | `packages/shared/src/types/course.ts` | **핵심** - 코스/레슨/챕터 타입 정의 |
| 20 | `packages/shared/src/types/events.ts` | 시뮬레이터 이벤트 타입 |
| 21 | `packages/shared/src/schemas/index.ts` | Zod 스키마 re-export |
| 22 | `packages/shared/src/schemas/course.ts` | 코스 데이터 런타임 검증 규칙 |
| 23 | `packages/shared/src/schemas/events.ts` | 이벤트 데이터 검증 |
| 24 | `packages/shared/src/schemas/flow.ts` | 플로우 그래프 검증 |

### 2-2. 프론트엔드 전용 타입
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 25 | `packages/frontend/src/types/memory.ts` | **핵심** - C/Python 메모리 시각화 타입 (stack, heap, variable) |
| 26 | `packages/frontend/src/features/courses/types.ts` | 코스 페이지 내부 타입 |
| 27 | `packages/frontend/src/features/visualizers/shared/types.ts` | 시각화 엔진 공통 타입 |
| 28 | `packages/frontend/src/features/courses/components/memory/types.ts` | 메모리 UI 컴포넌트 타입 |
| 29 | `packages/frontend/src/features/visualizers/flow/adapters/base/types.ts` | Flow 어댑터 기본 타입 |

### 2-3. 데이터베이스 스키마
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 30 | `packages/backend/prisma/schema.prisma` | **핵심** - 전체 DB 모델 = 데이터의 진실(source of truth) |

### 2단계 완료 체크리스트
- [ ] 레슨 데이터의 타입 구조를 그릴 수 있다 (Lesson → LessonContent → Steps)
- [ ] 시뮬레이터 이벤트 타입을 설명할 수 있다
- [ ] 메모리 시각화에 사용되는 타입(stack, heap, variable)을 안다
- [ ] Prisma 모델 간 관계를 이해했다 (User ↔ Lesson ↔ Submission)

---

## 3단계: 데이터 파이프라인 (JSON → DB → API → UI)

> **목표**: "레슨 데이터가 JSON 파일에서 출발하여 화면에 그려지기까지의 전체 흐름"

### 3-1. 레슨 JSON 원본 (데이터의 시작점)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 31 | `packages/backend/prisma/content/c/lessons/c-1-1.json` | C 레슨 JSON 샘플 정독 - step 구조, 메모리 데이터 형태 |
| 32 | `packages/backend/prisma/content/python/lessons/py-1-1.json` | Python 레슨 JSON 샘플 - names/objects 구조 비교 |
| 33 | `packages/backend/prisma/content/javascript/lessons/js-1-1.json` | JS 레슨 JSON 샘플 - callStack/scopes 구조 비교 |
| 34 | `packages/backend/prisma/content/java/lessons/java-1-1.json` | Java 레슨 JSON 샘플 비교 |

**주목 포인트**: 각 언어마다 step 안의 시각화 데이터 형태가 다르다. 이것이 왜 언어별 어댑터/트랜스포머가 필요한 이유.

### 3-2. DB 시딩 (JSON → PostgreSQL)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 35 | `packages/backend/prisma/seed.ts` | **핵심** - JSON 파일을 읽어 DB에 upsert하는 로직 |
| 36 | `packages/backend/prisma/seed-quizzes.ts` | 퀴즈 데이터 시딩 |

### 3-3. 서버 시작 시 레슨 로딩
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 37 | `packages/backend/src/services/lessonContentLoader.ts` | 서버 부팅 시 JSON 파일 경로 스캔 & 메모리 캐싱 |

### 3-4. API 엔드포인트 (DB → Frontend)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 38 | `packages/backend/src/modules/courses/routes.ts` | 코스/레슨 API (GET /api/v1/courses/*) |

### 3-5. 프론트엔드 API 호출
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 39 | `packages/frontend/src/services/api/` 디렉토리 전체 | API 클라이언트 - 백엔드와 통신하는 코드 |
| 40 | `packages/frontend/src/config/queryClient.ts` | TanStack Query 설정 (캐싱, 재시도 정책) |

### 3단계 완료 체크리스트
- [ ] JSON 파일 하나를 보고 각 필드의 의미를 설명할 수 있다
- [ ] seed.ts가 JSON → DB로 데이터를 넣는 과정을 추적할 수 있다
- [ ] API 호출 → 데이터 반환까지의 흐름을 설명할 수 있다
- [ ] 언어별 JSON 구조의 차이점을 안다 (C: stack/heap, Python: names/objects, JS: callStack/scopes)

---

## 4단계: 프론트엔드 핵심 - Lesson 모드

> **목표**: "API에서 받은 레슨 데이터가 화면에 시각화되기까지의 과정"

### 4-1. 전역 상태 관리 (Zustand)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 41 | `packages/frontend/src/stores/store.ts` | 전역 스토어 (auth, user, theme 등) |
| 42 | `packages/frontend/src/stores/authStore.ts` | 인증 상태 관리 |
| 43 | `packages/frontend/src/stores/themeStore.ts` | 다크모드 등 테마 |
| 44 | `packages/frontend/src/stores/simulatorStore.ts` | 시뮬레이터 실행 상태 |
| 45 | `packages/frontend/src/stores/chatStore.ts` | AI 채팅 상태 |
| 46 | `packages/frontend/src/stores/lessonHistoryStore.ts` | 레슨 히스토리 |

### 4-2. 레슨 페이지 계층 구조 (코스 목록 → 챕터 → 레슨)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 47 | `packages/frontend/src/features/courses/CoursesPage.tsx` | 코스 목록 페이지 (언어 선택) |
| 48 | `packages/frontend/src/features/courses/LanguageCoursePage.tsx` | 특정 언어의 챕터 목록 |
| 49 | `packages/frontend/src/features/courses/ChapterLessonsPage.tsx` | 챕터 내 레슨 목록 |
| 50 | `packages/frontend/src/features/courses/LessonPage.tsx` | **핵심** - 레슨 플레이어 (단계별 시각화 화면) |
| 51 | `packages/frontend/src/features/courses/components/LessonDesktopLayout.tsx` | 데스크톱 레이아웃 (코드 + 시각화 분할) |
| 52 | `packages/frontend/src/features/courses/components/mobile/MobileLessonView.tsx` | 모바일 레이아웃 (슬라이딩) |

### 4-3. 레슨 핵심 훅 (데이터 → 시각화 변환)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 53 | `packages/frontend/src/features/courses/hooks/useLessonData.ts` | API에서 레슨 데이터 fetch |
| 54 | `packages/frontend/src/features/courses/hooks/useLessonVisualization.ts` | **최핵심** - JSON step 데이터 → 시각화 컴포넌트로 변환하는 로직 |
| 55 | `packages/frontend/src/features/courses/hooks/useLessonNavigation.ts` | 스텝 이동 (이전/다음) 로직 |
| 56 | `packages/frontend/src/features/courses/hooks/useLessonTerminal.ts` | 터미널 출력 상태 관리 |
| 57 | `packages/frontend/src/features/courses/hooks/useLessonSimulation.ts` | Playground 모드용 시뮬레이션 실행 |
| 58 | `packages/frontend/src/features/courses/hooks/useStepGestures.ts` | 모바일 스와이프 제스처 |
| 59 | `packages/frontend/src/features/courses/hooks/useCodeSelection.ts` | 코드 하이라이팅 선택 |

### 4-4. 레슨 UI 컴포넌트
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 60 | `packages/frontend/src/features/courses/components/day/CodeViewer.tsx` | 코드 표시 + 라인 하이라이팅 |
| 61 | `packages/frontend/src/features/courses/components/day/StepExplanation.tsx` | 스텝별 마크다운 설명 |
| 62 | `packages/frontend/src/features/courses/components/day/SelectedCodeBadge.tsx` | 선택된 코드 뱃지 |
| 63 | `packages/frontend/src/features/courses/components/day/LessonCodeEditor.tsx` | 코드 에디터 |
| 64 | `packages/frontend/src/features/courses/components/StepNavigationArrows.tsx` | 스텝 이동 화살표 |
| 65 | `packages/frontend/src/features/courses/components/LessonBottomNav.tsx` | 하단 네비게이션 |
| 66 | `packages/frontend/src/features/courses/components/LessonQuizModal.tsx` | 레슨 내 퀴즈 모달 |
| 67 | `packages/frontend/src/features/courses/components/LessonCompletedView.tsx` | 레슨 완료 화면 |
| 68 | `packages/frontend/src/features/courses/components/LessonCard.tsx` | 레슨 카드 UI |
| 69 | `packages/frontend/src/features/courses/components/ChapterCard.tsx` | 챕터 카드 UI |
| 70 | `packages/frontend/src/features/courses/components/CourseGrid.tsx` | 코스 그리드 레이아웃 |

### 4-5. 레슨 분석 훅 (선택적)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 71 | `packages/frontend/src/features/courses/hooks/useLessonAnalytics.ts` | 학습 분석 데이터 수집 |
| 72 | `packages/frontend/src/features/courses/hooks/analytics/useActivityTracking.ts` | 활동 추적 |
| 73 | `packages/frontend/src/features/courses/hooks/analytics/useStepTracking.ts` | 스텝별 추적 |
| 74 | `packages/frontend/src/features/courses/hooks/analytics/useVisibilityTracking.ts` | 화면 가시성 추적 |

### 4단계 완료 체크리스트
- [ ] 레슨 페이지가 데이터를 fetch → 변환 → 렌더링하는 전체 흐름을 설명할 수 있다
- [ ] useLessonVisualization 훅이 어떻게 언어별 시각화를 분기하는지 안다
- [ ] 스텝 이동 시 어떤 상태가 변하고, 어떤 컴포넌트가 리렌더링되는지 안다
- [ ] 데스크톱/모바일 레이아웃 차이를 이해했다

---

## 5단계: 시각화 엔진 (Visualizers)

> **목표**: "각 언어별로 메모리/콜스택이 어떻게 그려지는가"

### 5-1. 시각화 코어 & 공통
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 75 | `packages/frontend/src/features/visualizers/core/index.ts` | 시각화 코어 진입점 |
| 76 | `packages/frontend/src/features/visualizers/core/event-processor.ts` | 이벤트 → 시각화 데이터 처리 파이프라인 |
| 77 | `packages/frontend/src/features/visualizers/shared/constants.ts` | 공통 상수 (색상, 크기 등) |
| 78 | `packages/frontend/src/features/visualizers/shared/types.ts` | 공통 시각화 타입 |
| 79 | `packages/frontend/src/features/visualizers/shared/components/CallStackView.tsx` | 콜스택 공통 컴포넌트 |
| 80 | `packages/frontend/src/features/visualizers/shared/components/TerminalOutput.tsx` | 터미널 출력 공통 |
| 81 | `packages/frontend/src/features/visualizers/shared/components/ScopeChainView.tsx` | 스코프 체인 공통 |
| 82 | `packages/frontend/src/features/visualizers/shared/components/ReturnOverlay.tsx` | 반환값 오버레이 |

### 5-2. C 메모리 시각화
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 83 | `packages/frontend/src/features/visualizers/c/constants.ts` | C 시각화 상수 |
| 84 | `packages/frontend/src/features/visualizers/c/CMemoryView.tsx` | C 메모리 뷰 (스택 + 힙 전체) |
| 85 | `packages/frontend/src/features/visualizers/c/index.tsx` | C 시각화 진입점 |
| 86 | `packages/frontend/src/features/courses/components/memory/MemoryPanel.tsx` | 메모리 패널 컨테이너 |
| 87 | `packages/frontend/src/features/courses/components/memory/StackSection.tsx` | **핵심** - 스택 영역 렌더링 |
| 88 | `packages/frontend/src/features/courses/components/memory/HeapSection.tsx` | **핵심** - 힙 영역 렌더링 |
| 89 | `packages/frontend/src/features/courses/components/memory/MemoryBlockCard.tsx` | 개별 메모리 블록 카드 |
| 90 | `packages/frontend/src/features/courses/components/memory/ArrayBlock.tsx` | 배열 메모리 블록 |
| 91 | `packages/frontend/src/features/courses/components/memory/LowerMemorySections.tsx` | 하위 메모리 섹션 |
| 92 | `packages/frontend/src/features/courses/components/memory/utils/memoryHelpers.ts` | 메모리 시각화 유틸리티 |
| 93 | `packages/frontend/src/features/courses/components/memory/utils/frameColors.ts` | 프레임별 색상 |
| 94 | `packages/frontend/src/features/courses/utils/memoryUtils.ts` | 메모리 관련 유틸 |
| 95 | `packages/frontend/src/features/visualizers/memory/LessonMemoryVisualizer.tsx` | 레슨 모드 메모리 시각화 |
| 96 | `packages/frontend/src/features/visualizers/memory/adapters/CMemoryAdapter.ts` | C 메모리 어댑터 |

### 5-3. Flow 시각화 (콜스택/실행 흐름) - 모든 언어 공통
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 97 | `packages/frontend/src/features/visualizers/flow/FlowVisualizer.tsx` | Playground용 Flow 시각화 |
| 98 | `packages/frontend/src/features/visualizers/flow/LessonFlowVisualizer.tsx` | Lesson 모드용 Flow 시각화 |
| 99 | `packages/frontend/src/features/visualizers/flow/styles.ts` | Flow 스타일링 |
| 100 | `packages/frontend/src/features/visualizers/flow/components/FunctionFrame.tsx` | 함수 프레임 박스 |
| 101 | `packages/frontend/src/features/visualizers/flow/components/VariableBox.tsx` | 변수 박스 |
| 102 | `packages/frontend/src/features/visualizers/flow/components/ArrowLayer.tsx` | 화살표 연결선 |
| 103 | `packages/frontend/src/features/visualizers/flow/components/ControlFlowOverlay.tsx` | 제어 흐름 오버레이 |
| 104 | `packages/frontend/src/features/visualizers/flow/components/LoopTrack.tsx` | 반복문 트랙 |
| 105 | `packages/frontend/src/features/visualizers/flow/hooks/useFlowDiff.ts` | Flow 상태 diff 계산 |
| 106 | `packages/frontend/src/features/visualizers/flow/hooks/useAnimationQueue.ts` | 애니메이션 큐 관리 |

### 5-4. 언어별 Flow 어댑터 (JSON → Flow 컴포넌트 변환)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 107 | `packages/frontend/src/features/visualizers/flow/adapters/index.ts` | 어댑터 팩토리 |
| 108 | `packages/frontend/src/features/visualizers/flow/adapters/base/index.ts` | 기본 어댑터 인터페이스 |
| 109 | **C 어댑터** | |
| 110 | `  flow/adapters/c/CTransformer.ts` | C JSON → Flow 데이터 변환 |
| 111 | `  flow/adapters/c/CStyler.ts` | C 스타일링 |
| 112 | `  flow/adapters/c/CAnimator.ts` | C 애니메이션 |
| 113 | **Python 어댑터** | |
| 114 | `  flow/adapters/python/PyTransformer.ts` | Python JSON → Flow 데이터 변환 |
| 115 | `  flow/adapters/python/PyStyler.ts` | Python 스타일링 |
| 116 | `  flow/adapters/python/PyAnimator.ts` | Python 애니메이션 |
| 117 | **JavaScript 어댑터** | |
| 118 | `  flow/adapters/javascript/JSTransformer.ts` | JS JSON → Flow 데이터 변환 |
| 119 | `  flow/adapters/javascript/JSStyler.ts` | JS 스타일링 |
| 120 | `  flow/adapters/javascript/JSAnimator.ts` | JS 애니메이션 |
| 121 | **Java 어댑터** | |
| 122 | `  flow/adapters/java/JavaTransformer.ts` | Java JSON → Flow 데이터 변환 |
| 123 | `  flow/adapters/java/JavaStyler.ts` | Java 스타일링 |
| 124 | `  flow/adapters/java/JavaAnimator.ts` | Java 애니메이션 |
| 125 | **언어별 Flow View** | |
| 126 | `  flow/components/JSFlowView.tsx` | JS Flow 시각화 |
| 127 | `  flow/components/PythonFlowView.tsx` | Python Flow 시각화 |
| 128 | `  flow/components/JavaFlowView.tsx` | Java Flow 시각화 |

### 5-5. Java 메모리 시각화
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 129 | `packages/frontend/src/features/visualizers/java/JavaMemoryView.tsx` | Java 메모리 뷰 |
| 130 | `packages/frontend/src/features/visualizers/java/adapters/toJavaMemoryView.ts` | Java 메모리 데이터 어댑터 |
| 131 | `packages/frontend/src/features/visualizers/java/index.tsx` | Java 시각화 진입점 |
| 132 | `packages/frontend/src/features/visualizers/memory/adapters/JavaMemoryAdapter.ts` | Java 메모리 어댑터 |

### 5단계 완료 체크리스트
- [ ] 시각화 엔진의 어댑터 패턴을 설명할 수 있다 (Transformer/Styler/Animator)
- [ ] C 메모리 시각화에서 스택/힙이 어떻게 렌더링되는지 안다
- [ ] Flow 시각화에서 함수 프레임과 변수가 어떻게 배치되는지 안다
- [ ] 언어별 어댑터의 역할 차이를 설명할 수 있다

---

## 6단계: Playground 모드 (동적 코드 실행)

> **목표**: "사용자가 코드를 입력하면 시뮬레이터가 실행하여 시각화를 생성하는 과정"

### 6-1. Playground 프론트엔드
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 133 | `packages/frontend/src/features/playground/PlaygroundPage.tsx` | Playground 전체 페이지 |
| 134 | `packages/frontend/src/features/playground/components/CodeEditor.tsx` | 코드 에디터 |
| 135 | `packages/frontend/src/features/playground/components/LanguageTabs.tsx` | 언어 선택 탭 |
| 136 | `packages/frontend/src/features/playground/components/VisualizerPanel.tsx` | 시각화 패널 |
| 137 | `packages/frontend/src/features/playground/components/StepControls.tsx` | 스텝 이동 컨트롤 |
| 138 | `packages/frontend/src/features/playground/components/StepExplanation.tsx` | AI 스텝 설명 |
| 139 | `packages/frontend/src/features/playground/components/PlaygroundFooter.tsx` | 하단 푸터 |
| 140 | `packages/frontend/src/features/playground/stores/playgroundStore.ts` | **핵심** - Playground Zustand 스토어 (코드, 실행 결과, 스텝 상태) |
| 141 | `packages/frontend/src/features/playground/stores/explanationStore.ts` | AI 설명 상태 |
| 142 | `packages/frontend/src/features/playground/styles/playgroundTheme.ts` | 테마 스타일 |

### 6-2. 백엔드 시뮬레이터 공통
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 143 | `packages/backend/src/modules/simulators/c/routes.ts` | C 시뮬레이터 API |
| 144 | `packages/backend/src/modules/simulators/python/routes.ts` | Python 시뮬레이터 API |
| 145 | `packages/backend/src/modules/simulators/javascript/routes.ts` | JS 시뮬레이터 API |
| 146 | `packages/backend/src/modules/simulators/java/routes.ts` | Java 시뮬레이터 API |

### 6-3. C 시뮬레이터 (가장 복잡)
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 147 | `packages/backend/src/modules/simulators/c/simulator.ts` | **핵심** - C 시뮬레이터 메인 엔진 |
| 148 | `packages/backend/src/modules/simulators/c/parser/index.ts` | C 코드 파서 |
| 149 | `packages/backend/src/modules/simulators/c/parser/types.ts` | 파서 타입 |
| 150 | `packages/backend/src/modules/simulators/c/parser/function-parser.ts` | 함수 파싱 |
| 151 | `packages/backend/src/modules/simulators/c/types/ast.types.ts` | AST 타입 정의 |
| 152 | `packages/backend/src/modules/simulators/c/types/c-types.ts` | C 데이터 타입 정의 |
| 153 | `packages/backend/src/modules/simulators/c/types/type-registry.ts` | 타입 레지스트리 |
| 154 | `packages/backend/src/modules/simulators/c/evaluator/expression-evaluator.ts` | 표현식 평가 |
| 155 | `packages/backend/src/modules/simulators/c/evaluator/types.ts` | 평가기 타입 |
| 156 | `packages/backend/src/modules/simulators/c/runtime/index.ts` | 런타임 환경 |
| 157 | `packages/backend/src/modules/simulators/c/runtime/scope.ts` | 스코프 관리 |
| 158 | `packages/backend/src/modules/simulators/c/runtime/call-stack.ts` | 콜스택 관리 |
| 159 | `packages/backend/src/modules/simulators/c/execution/index.ts` | 실행 엔진 |
| 160 | `packages/backend/src/modules/simulators/c/execution/frame-manager.ts` | 스택 프레임 관리 |
| 161 | `packages/backend/src/modules/simulators/c/execution/parameter-setup.ts` | 함수 파라미터 설정 |
| 162 | `packages/backend/src/modules/simulators/c/executor/c-executor.ts` | C 실행기 |
| 163 | `packages/backend/src/modules/simulators/c/executor/security.ts` | 보안 검증 |
| 164 | `packages/backend/src/modules/simulators/c/services/emscripten-validator.service.ts` | Emscripten 검증 |
| 165 | **C 핸들러들** (각 문법 요소 처리) | |
| 166 | `  handlers/variable.handler.ts` | 변수 선언/할당 |
| 167 | `  handlers/function.handler.ts` | 함수 호출/정의 |
| 168 | `  handlers/pointer.handler.ts` | 포인터 연산 |
| 169 | `  handlers/double-pointer.handler.ts` | 이중 포인터 |
| 170 | `  handlers/function-pointer.handler.ts` | 함수 포인터 |
| 171 | `  handlers/array.handler.ts` | 배열 |
| 172 | `  handlers/struct.handler.ts` | 구조체 |
| 173 | `  handlers/malloc.handler.ts` | 동적 메모리 할당 |
| 174 | `  handlers/io.handler.ts` | printf/scanf |
| 175 | `  handlers/bitwise.handler.ts` | 비트 연산 |

### 6-4. Python 시뮬레이터
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 176 | `packages/backend/src/modules/simulators/python/python-simulation.service.ts` | **핵심** - Python 시뮬레이션 서비스 |
| 177 | `packages/backend/src/modules/simulators/python/context.ts` | 실행 컨텍스트 (sys.settrace) |
| 178 | `packages/backend/src/modules/simulators/python/types.ts` | Python 시뮬레이터 타입 |
| 179 | `packages/backend/src/modules/simulators/python/parser/index.ts` | Python 파서 |
| 180 | `packages/backend/src/modules/simulators/python/parser/block-parser.ts` | 블록 파싱 |
| 181 | `packages/backend/src/modules/simulators/python/engine/debugger-client.ts` | 디버거 클라이언트 |
| 182 | `packages/backend/src/modules/simulators/python/engine/file-manager.ts` | 파일 관리 |
| 183 | **Python 핸들러들** | |
| 184 | `  handlers/assign.handler.ts` | 할당문 |
| 185 | `  handlers/print.handler.ts` | print 함수 |
| 186 | `  handlers/function-def.handler.ts` | 함수 정의 |
| 187 | `  handlers/function-call.handler.ts` | 함수 호출 |
| 188 | `  handlers/return.handler.ts` | return문 |
| 189 | `  handlers/class-def.handler.ts` | 클래스 정의 |
| 190 | `  handlers/instance-create.handler.ts` | 인스턴스 생성 |
| 191 | `  handlers/method-call.handler.ts` | 메서드 호출 |
| 192 | `  handlers/attribute.handler.ts` | 속성 접근 |
| 193 | `  handlers/builtin.handler.ts` | 내장 함수 |
| 194 | `  handlers/global.handler.ts` | 전역 변수 |

### 6-5. JavaScript 시뮬레이터
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 195 | `packages/backend/src/modules/simulators/javascript/javascript-simulation.service.ts` | JS 시뮬레이션 서비스 |
| 196 | `packages/backend/src/modules/simulators/javascript/engine/debugger-client.ts` | Node.js VM 디버거 |
| 197 | `packages/backend/src/modules/simulators/javascript/engine/file-manager.ts` | 파일 관리 |
| 198 | `packages/backend/src/modules/simulators/javascript/normalizer/js-snapshot-normalizer.ts` | 스냅샷 정규화 |

### 6-6. Java 시뮬레이터
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 199 | `packages/backend/src/modules/simulators/java/java-simulation.service.ts` | Java 시뮬레이션 서비스 |
| 200 | `packages/backend/src/modules/simulators/java/engine/compiler.ts` | Java 컴파일러 |
| 201 | `packages/backend/src/modules/simulators/java/engine/debugger-client.ts` | JDB 디버거 클라이언트 |
| 202 | `packages/backend/src/modules/simulators/java/engine/file-manager.ts` | 파일 관리 |
| 203 | `packages/backend/src/modules/simulators/java/normalizer/java-event-normalizer.ts` | 이벤트 정규화 |
| 204 | `packages/backend/src/modules/simulators/java/parser/class-parser.ts` | 클래스 파싱 |
| 205 | `packages/backend/src/modules/simulators/java/runtime/stack.ts` | Java 스택 |
| 206 | `packages/backend/src/modules/simulators/java/runtime/heap.ts` | Java 힙 |
| 207 | **Java 핸들러들** | |
| 208 | `  handlers/variable.handler.ts` | 변수 처리 |
| 209 | `  handlers/print.handler.ts` | System.out.println |

### 6단계 완료 체크리스트
- [ ] Playground에서 코드 실행 → 시각화까지의 전체 흐름을 추적할 수 있다
- [ ] C 시뮬레이터의 파서 → 평가기 → 실행기 → 핸들러 구조를 이해했다
- [ ] Python 시뮬레이터가 sys.settrace를 통해 어떻게 추적하는지 안다
- [ ] 각 시뮬레이터의 출력 JSON 형태를 안다

---

## 7단계: 부가 기능

> **목표**: "핵심 외 나머지 기능들을 이해"

### 7-1. 퀴즈 시스템
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 210 | `packages/frontend/src/features/quiz/QuizPage.tsx` | 퀴즈 메인 페이지 |
| 211 | `packages/frontend/src/features/quiz/OXQuizPage.tsx` | O/X 퀴즈 |
| 212 | `packages/frontend/src/features/quiz/MultipleChoiceQuizPage.tsx` | 객관식 퀴즈 |
| 213 | `packages/frontend/src/features/quiz/FillBlankQuizPage.tsx` | 빈칸 채우기 퀴즈 |
| 214 | `packages/frontend/src/features/quiz/components/Timer.tsx` | 타이머 컴포넌트 |
| 215 | `packages/backend/src/modules/standalone-quizzes/routes.ts` | 퀴즈 API |

### 7-2. 대시보드 & 분석
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 216 | `packages/frontend/src/features/dashboard/DashboardPage.tsx` | 대시보드 메인 |
| 217 | `packages/frontend/src/features/dashboard/components/analytics/AnalyticsSection.tsx` | 분석 섹션 |
| 218 | `packages/frontend/src/features/dashboard/components/analytics/ContributionCalendar.tsx` | GitHub 스타일 캘린더 |
| 219 | `packages/frontend/src/features/dashboard/components/analytics/hooks/useAnalyticsData.ts` | 분석 데이터 훅 |
| 220 | `packages/frontend/src/features/dashboard/components/analytics/utils/generateAnalysis.ts` | 분석 생성 |
| 221 | `packages/frontend/src/features/dashboard/components/report/` 전체 | 리포트 컴포넌트들 |
| 222 | `packages/frontend/src/features/dashboard/hooks/usePdfExport.ts` | PDF 내보내기 |
| 223 | `packages/backend/src/modules/analytics/routes.ts` | 분석 API |

### 7-3. 게이미피케이션
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 224 | `packages/frontend/src/features/gamification/hooks/useStreak.ts` | 연속 학습 스트릭 |
| 225 | `packages/frontend/src/features/gamification/components/StreakCard.tsx` | 스트릭 카드 UI |
| 226 | `packages/backend/src/modules/gamification/routes.ts` | 게이미피케이션 API |

### 7-4. AI 채팅
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 227 | `packages/frontend/src/features/chat/hooks/useChatQA.ts` | AI 채팅 훅 |
| 228 | `packages/frontend/src/features/chat/components/ChatQA.tsx` | 채팅 UI |
| 229 | `packages/frontend/src/features/chat/components/MessageContent.tsx` | 메시지 렌더링 |
| 230 | `packages/frontend/src/features/courses/components/mobile/MobileAIChatFAB.tsx` | 모바일 AI 채팅 FAB |
| 231 | `packages/frontend/src/features/courses/components/mobile/MobileAIChatModal.tsx` | 모바일 AI 채팅 모달 |
| 232 | `packages/backend/src/modules/ai/routes.ts` | AI API |
| 233 | `packages/backend/src/modules/ai/providers/types.ts` | AI 프로바이더 인터페이스 |
| 234 | `packages/backend/src/modules/ai/providers/ollama.provider.ts` | Ollama 연동 |
| 235 | `packages/backend/src/modules/ai/providers/deepseek.provider.ts` | DeepSeek 연동 |
| 236 | `packages/backend/src/modules/ai/settings.ts` | AI 설정 |

### 7-5. 인증 & 사용자
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 237 | `packages/frontend/src/features/auth/AuthPage.tsx` | 로그인/회원가입 |
| 238 | `packages/frontend/src/features/profile/ProfilePage.tsx` | 프로필 |
| 239 | `packages/frontend/src/features/home/HomePage.tsx` | 랜딩 페이지 |
| 240 | `packages/backend/src/modules/users/routes.ts` | 사용자 API |

### 7-6. 구독 & 결제
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 241 | `packages/frontend/src/features/subscription/SubscriptionPage.tsx` | 구독 페이지 |
| 242 | `packages/backend/src/modules/subscription/routes.ts` | 구독 API |

### 7-7. 관리자
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 243 | `packages/frontend/src/features/admin/AdminPage.tsx` | 관리자 대시보드 |
| 244 | `packages/backend/src/modules/admin/admin.routes.ts` | 관리자 API |

### 7-8. 공통 컴포넌트 & 유틸
| 순서 | 파일 | 읽는 이유 |
|------|------|-----------|
| 245 | `packages/frontend/src/components/common/Toast/` | Toast 알림 시스템 |
| 246 | `packages/frontend/src/components/common/Navigation.tsx` | 네비게이션 바 |
| 247 | `packages/frontend/src/layouts/MainLayout.tsx` | 메인 레이아웃 |
| 248 | `packages/frontend/src/hooks/` | 커스텀 훅 (useTheme, useAuth 등) |
| 249 | `packages/frontend/src/i18n/` | 다국어 설정 |

### 7단계 완료 체크리스트
- [ ] 퀴즈 시스템의 3가지 유형을 설명할 수 있다
- [ ] 대시보드에서 어떤 분석 데이터가 표시되는지 안다
- [ ] AI 채팅이 어떤 프로바이더를 사용하는지 안다
- [ ] Firebase 인증 흐름을 이해했다

---

## 전체 요약: 데이터 흐름 다이어그램

```
┌──────────────────────────── Lesson 모드 ─────────────────────────────┐
│                                                                       │
│  JSON 파일 (c-1-1.json)                                              │
│       │                                                               │
│       ▼                                                               │
│  prisma seed.ts ──→ PostgreSQL (LessonContent 테이블)                │
│       │                                                               │
│       ▼                                                               │
│  lessonContentLoader.ts (서버 시작 시 경로 스캔)                      │
│       │                                                               │
│       ▼                                                               │
│  courses/routes.ts  ──→  GET /api/v1/courses/:lessonId               │
│       │                                                               │
│       ▼                                                               │
│  useLessonData.ts (프론트엔드 fetch)                                  │
│       │                                                               │
│       ▼                                                               │
│  useLessonVisualization.ts (step 데이터 → 시각화 변환)               │
│       │                                                               │
│       ├──→ CTransformer / PyTransformer / JSTransformer / JavaTransformer
│       │                                                               │
│       ▼                                                               │
│  LessonPage.tsx ──→ MemoryPanel / FlowVisualizer / TerminalOutput    │
│                                                               │
└───────────────────────────────────────────────────────────────────────┘

┌──────────────────────── Playground 모드 ─────────────────────────────┐
│                                                                       │
│  사용자 코드 입력 (CodeEditor.tsx)                                    │
│       │                                                               │
│       ▼                                                               │
│  playgroundStore.ts (Zustand 상태)                                    │
│       │                                                               │
│       ▼                                                               │
│  POST /api/v1/simulators/{language}/execute                          │
│       │                                                               │
│       ▼                                                               │
│  시뮬레이터 (C: 인터프리터, Python: sys.settrace, JS: VM, Java: JDB) │
│       │                                                               │
│       ▼                                                               │
│  실행 결과 JSON (steps 배열)                                          │
│       │                                                               │
│       ▼                                                               │
│  VisualizerPanel.tsx ──→ FlowVisualizer / MemoryView                 │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 주석 달기 가이드라인

### 원칙: "Why, not What"

```typescript
// ❌ 나쁜 주석
const stack = [...data.stack].reverse(); // 스택을 뒤집는다

// ✅ 좋은 주석
// 실제 메모리에서 스택은 높은 주소 → 낮은 주소로 성장하므로,
// 시각적으로 이를 표현하기 위해 역순 배치
const stack = [...data.stack].reverse();
```

### 주석이 필요한 곳

1. **아키텍처 결정**: 왜 이 패턴(어댑터, 팩토리 등)을 선택했는가
2. **언어별 차이**: 왜 C는 stack/heap이고 Python은 names/objects인가
3. **성능 고려**: 왜 이 시점에 캐싱/메모이제이션을 하는가
4. **교육적 의도**: 왜 이 순서로 시각화하는가 (학습 효과)
5. **workaround**: 라이브러리 버그나 제한사항을 우회하는 코드
6. **비자명한 로직**: 삼항 연산, 복잡한 조건문, 매직 넘버 등

### 주석이 필요 없는 곳

1. 자명한 코드 (`const userId = user.id;`)
2. 단순 getter/setter
3. React 컴포넌트의 JSX 구조 (레이아웃 자체가 설명)
4. 표준 라이브러리 사용법 (`useState`, `useEffect`)

---

## 진행 추적

| 단계 | 파일 수 | 상태 | 완료일 |
|------|---------|------|--------|
| 1. 프로젝트 뼈대 | 16개 | ⬜ 미시작 | |
| 2. 공유 타입 & 데이터 모델 | 14개 | ⬜ 미시작 | |
| 3. 데이터 파이프라인 | 10개 | ⬜ 미시작 | |
| 4. Lesson 모드 프론트엔드 | 34개 | ⬜ 미시작 | |
| 5. 시각화 엔진 | 58개 | ⬜ 미시작 | |
| 6. Playground & 시뮬레이터 | 77개 | ⬜ 미시작 | |
| 7. 부가 기능 | 40개 | ⬜ 미시작 | |
| **합계** | **~249개** | | |
