# 프론트엔드 아키텍처 (`C-OSINE/packages/frontend/`)

이 문서는 C-OSINE 프로젝트의 프론트엔드 아키텍처를 설명합니다.

### 주요 기술 스택
- **UI 라이브러리/프레임워크**: React
- **언어**: TypeScript
- **빌드 도구**: Vite
- **상태 관리**:
  - **TanStack Query** (React Query) - API 상태 관리
  - **Zustand** - 전역 UI/사용자 상태 관리
- **라우팅**: React Router
- **스타일링**: Tailwind CSS

### 아키텍처 개요
- **진입점**: `src/main.tsx`가 애플리케이션의 메인 진입점이며, React DOM을 렌더링하고 라우터를 설정합니다.
- **라우팅**: `src/router.tsx` 파일에서 모든 페이지 경로와 해당 경로에 렌더링될 컴포넌트를 정의합니다. `pages` 디렉토리 대신, `features` 디렉토리 내의 컴포넌트들이 페이지 역할을 수행하는 경우가 많습니다.
- **상태 관리**: `src/stores` 디렉토리 내에서 Zustand를 사용하여 전역 상태를 관리합니다. 각 store는 특정 도메인(예: `useAuthStore`, `useVimStore`)의 상태와 액션을 담당합니다.
- **API 통신**: `src/services/api/axios.ts` 에 정의된 `api` 인스턴스를 사용하여 백엔드와 통신합니다. 이 인스턴스는 요청 시 자동으로 Firebase 인증 토큰을 헤더에 추가하는 인터셉터를 포함하고 있습니다.
- **실시간 시뮬레이션 흐름**:
  1. `LessonPage.tsx` 로드 시 백엔드에서 레슨 메타데이터(JSON)를 가져옵니다.
  2. 레슨에 `code`가 포함되어 있고 시뮬레이션이 가능한 언어(`c`, `python`, `java`)인 경우, `simulatorService`가 백엔드 시뮬레이터 API를 호출합니다.
  3. 백엔드에서 생성된 `steps` 데이터를 실시간으로 수신하여 시각화 컴포넌트(`FlowVisualizer`, `PyVisualizerView`, `JavaReferenceView`)에 전달합니다.
  4. 시뮬레이션 불능 언어이거나 에러 발생 시, JSON에 미리 작성된 `steps`를 폴백으로 사용합니다.

### 코스 진행률 아키텍처 (DRY 원칙)

**핵심 원칙: 프론트엔드는 진행률을 계산하지 않고 표시만 수행**

코스 진행률 관련 데이터 흐름:
1. **백엔드**: 모든 진행률 계산 수행
   - 챕터별 완료 레슨 수 계산
   - 퍼센트 변환
   - API 응답에 포함

2. **프론트엔드**: 백엔드에서 받은 데이터를 그대로 표시
   ```typescript
   // ✅ 올바른 패턴
   const progress = chapter.progress?.percentage || 0;

   // ❌ 잘못된 패턴 (절대 금지!)
   const completed = lessons.filter(l => l.status === 'completed').length;
   const progress = (completed / total) * 100;
   ```

**Why?**
- ✅ DRY: 진행률 계산 로직이 백엔드 한 곳에만 존재
- ✅ 일관성: DB 직접 수정 시에도 API 재호출 시 즉시 반영
- ✅ 단순성: 프론트엔드 코드 간소화
- ✅ 유지보수: 계산 로직 변경 시 프론트 수정 불필요

### API 상태 관리 (TanStack Query)

**핵심 원칙: loading/error/data 수동 관리 제거**

모든 서버 데이터 fetching은 TanStack Query를 사용합니다.

**❌ 잘못된 패턴 (수동 상태 관리)**:
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await api.get('/courses/c');
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);

// 복잡한 조건문
if (loading) return <Spinner />;
if (error) return <Error />;
if (!data) return <Empty />;
```

**✅ 올바른 패턴 (TanStack Query)**:
```typescript
// 1. 커스텀 훅 생성 (hooks/useCourses.ts)
export function useLanguageCourse(languageId: string | undefined) {
  const { appUser } = useStore();

  return useQuery({
    queryKey: ['language', languageId, appUser?.id],
    queryFn: () => getLanguageWithChapters(languageId!),
    enabled: !!languageId,
  });
}

// 2. 컴포넌트에서 사용
const { data, isLoading, isError, error } = useLanguageCourse(lang);

// 3. 간단한 상태 처리
if (isError) return <Error error={error} />;
if (isLoading) return <Spinner />;
return <ChapterList chapters={data.chapters} />;
```

**TanStack Query 장점**:
- ✅ **자동 상태 관리**: `isLoading`, `isError`, `isSuccess`, `isIdle` 자동 제공
- ✅ **캐싱**: 5분간 캐시 유지 (staleTime), 불필요한 재요청 방지
- ✅ **자동 refetch**: queryKey 변경 시 자동 재요청 (예: userId 변경 시)
- ✅ **조건부 쿼리**: `enabled` 옵션으로 인증 상태 기반 활성화
- ✅ **DevTools**: 개발 환경에서 쿼리 상태 실시간 디버깅

**설정 위치**:
- **QueryClient 설정**: `src/config/queryClient.ts`
- **Provider 등록**: `src/main.tsx`
- **커스텀 훅**: `src/hooks/useCourses.ts`, `src/hooks/useProblems.ts` 등

**커스텀 훅 작성 규칙**:
1. `use{Entity}` 형식 네이밍 (예: `useLanguageCourse`, `useProblem`)
2. queryKey는 `[entity, id, ...dependencies]` 형식
3. `enabled` 옵션으로 필수 파라미터 검증
4. 인증 필요 시 `appUser` dependency 포함

**예시: 인증 기반 조건부 쿼리**:
```typescript
export function useUserProgress(lessonId: string | undefined) {
  const { appUser } = useStore();

  return useQuery({
    queryKey: ['progress', lessonId, appUser?.id],
    queryFn: () => getUserProgress(lessonId!),
    // 로그인 상태이고 lessonId가 있을 때만 쿼리 실행
    enabled: !!appUser && !!lessonId,
  });
}
```

**전역 상태 vs API 상태 구분**:
- **TanStack Query** 사용:
  - 서버 데이터 (courses, lessons, progress, problems 등)
  - API 응답 캐싱이 필요한 경우

- **Zustand** 사용:
  - UI 상태 (theme, sidebar open/close 등)
  - 사용자 인증 상태 (appUser, firebaseUser)
  - 로컬 상태로 충분한 경우

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
