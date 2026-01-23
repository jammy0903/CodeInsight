# 프론트엔드 아키텍처 (`C-OSINE/packages/frontend/`)

이 문서는 C-OSINE 프로젝트의 프론트엔드 아키텍처를 설명합니다.

### 주요 기술 스택
- **UI 라이브러리/프레임워크**: React
- **언어**: TypeScript
- **빌드 도구**: Vite
- **상태 관리**: Zustand
- **라우팅**: React Router
- **스타일링**: Tailwind CSS

### 아키텍처 개요
- **진입점**: `src/main.tsx`가 애플리케이션의 메인 진입점이며, React DOM을 렌더링하고 라우터를 설정합니다.
- **라우팅**: `src/router.tsx` 파일에서 모든 페이지 경로와 해당 경로에 렌더링될 컴포넌트를 정의합니다. `pages` 디렉토리 대신, `features` 디렉토리 내의 컴포넌트들이 페이지 역할을 수행하는 경우가 많습니다.
- **상태 관리**: `src/stores` 디렉토리 내에서 Zustand를 사용하여 전역 상태를 관리합니다. 각 store는 특정 도메인(예: `useAuthStore`, `useVimStore`)의 상태와 액션을 담당합니다.
- **API 통신**: `src/services/api/axios.ts` 에 정의된 `api` 인스턴스를 사용하여 백엔드와 통신합니다. 이 인스턴스는 요청 시 자동으로 Firebase 인증 토큰을 헤더에 추가하는 인터셉터를 포함하고 있습니다. 모든 API 서비스는 이 `api` 인스턴스를 import하여 사용해야 합니다.

### 주요 디렉토리 구조 (`src/`)
- **`components/`**: 버튼, 입력창, 모달 등 재사용 가능한 공통 UI 컴포넌트.
- **`features/`**: 특정 기능(도메인)과 관련된 컴포넌트와 로직. 페이지 레벨의 컴포넌트(`courses`, `playground`)나, 특정 기능에 대한 집합(`visualizers`)이 여기에 위치합니다. (예: `auth`, `courses`, `visualizers`)
  - **`features/visualizers/`**: 언어별 코드 시각화 컴포넌트 모음
    - `js/` - JavaScript 전용 (EventLoop, Closure, Prototype 등)
    - `python/` - Python 시각화
    - `java/` - Java 메모리 시각화
    - `flow/` - 범용 플로우차트 시각화
    - `shared/` - 여러 언어에서 공통으로 사용하는 시각화 (CallStack, ScopeChain 등)
- **`hooks/`**: 여러 컴포넌트에서 재사용되는 커스텀 훅. (예: `useAuth`, `useDebounce`)
- **`layouts/`**: 페이지의 전체적인 레이아웃(예: 헤더, 사이드바 포함)을 정의하는 컴포넌트.
- **`services/`**: 백엔드 API 호출을 담당하는 함수들.
- **`stores/`**: Zustand를 사용한 전역 상태 관리 로직.
- **`utils/`**: 날짜 포맷팅, 문자열 처리 등 범용 헬퍼 함수.
- **`lib/`**: 외부 라이브러리 설정이나 인스턴스를 관리. (예: `firebase.ts`)

### Visualizers 구조 상세

```
features/visualizers/
├── js/                    # JavaScript 전용 시각화
│   ├── index.ts          # JSVisualizerView, EventLoopView export
│   ├── types.ts          # JS 시각화 타입 정의
│   ├── JSVisualizerView.tsx  # 타입별 라우팅 컴포넌트
│   ├── components/
│   │   ├── EventLoopView.tsx
│   │   ├── ClosureView.tsx
│   │   ├── PrototypeChainView.tsx
│   │   └── ...
│   ├── hooks/
│   │   └── useJsToFlow.ts
│   └── services/
│       └── jsVisualizerService.ts
├── python/               # Python 시각화
├── java/                 # Java 시각화
├── flow/                 # 범용 플로우차트
└── shared/               # 공통 시각화 컴포넌트
    ├── components/
    │   └── CallStackView.tsx
    └── types.ts
```

**⚠️ 주의사항**:
- `js-visualizer/` 경로는 **폐기됨** → `visualizers/js/` 사용
- 새로운 시각화 추가 시 해당 언어 폴더 아래에 배치
- 여러 언어에서 공통으로 사용하는 컴포넌트는 `shared/`에 배치
