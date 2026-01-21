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
- **API 통신**: `src/services` 디렉토리에서 백엔드 API와의 통신 로직을 관리합니다. `axios`를 주로 사용합니다.

### 주요 디렉토리 구조 (`src/`)
- **`components/`**: 버튼, 입력창, 모달 등 재사용 가능한 공통 UI 컴포넌트.
- **`features/`**: 특정 기능(도메인)과 관련된 컴포넌트와 로직. 사실상 페이지 레벨의 컴포넌트들이 여기에 위치합니다. (예: `auth`, `code-editor`, `lesson`)
- **`hooks/`**: 여러 컴포넌트에서 재사용되는 커스텀 훅. (예: `useAuth`, `useDebounce`)
- **`layouts/`**: 페이지의 전체적인 레이아웃(예: 헤더, 사이드바 포함)을 정의하는 컴포넌트.
- **`services/`**: 백엔드 API 호출을 담당하는 함수들.
- **`stores/`**: Zustand를 사용한 전역 상태 관리 로직.
- **`utils/`**: 날짜 포맷팅, 문자열 처리 등 범용 헬퍼 함수.
- **`lib/`**: 외부 라이브러리 설정이나 인스턴스를 관리. (예: `axios.ts`, `firebase.ts`)
