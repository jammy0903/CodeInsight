# Store 상태 관리 리팩토링 계획

## 🎯 목표
1. `needsRegistration` boolean을 `AppUser.status`로 통합
2. `pageTitle`, `pageSubtitle`, `pageLanguage`를 `PageInfo` 객체로 통합

상태 일관성 강화 및 확장성 개선

---

## 📋 변경 사항

### 1. AppUser 인터페이스 수정
```typescript
// Before
export interface AppUser {
  id: string;
  nickname: string;
  role: 'user' | 'admin';
  oauthAccounts: OAuthAccountInfo[];
}

// After
export interface AppUser {
  id: string;
  nickname: string;
  role: 'user' | 'admin';
  oauthAccounts: OAuthAccountInfo[];
  status: 'new' | 'registered';  // 신규 필드
}
```

### 2. Store 수정
```typescript
// Before
interface Store {
  appUser: AppUser | null;
  needsRegistration: boolean;
  setNeedsRegistration: (needs: boolean) => void;
}

// After
interface Store {
  appUser: AppUser | null;
  // needsRegistration 제거
  setAppUser: (user: AppUser | null) => void;
}
```

### 3. 사용 시점 변경
```typescript
// Before
if (needsRegistration) { ... }

// After
if (appUser?.status === 'new') { ... }
```

---

## 🔍 영향 범위

### 수정 파일
- `packages/frontend/src/stores/store.ts`
- `packages/frontend/src/layouts/MainLayout.tsx`
- `packages/frontend/src/components/NicknameModal.tsx`
- `packages/frontend/src/router.tsx`
- `packages/frontend/src/services/firebase.ts`
- `packages/frontend/src/layouts/Sidebar.tsx`

### 백엔드 조정 필요
- `/users/me` API 응답에 `status` 필드 추가

---

## ✅ 검증 항목
- [ ] NicknameModal이 `appUser?.status === 'new'` 감지
- [ ] 라우팅이 정상 동작
- [ ] 신규 사용자 온보딩 플로우 테스트
- [ ] TypeScript 컴파일 에러 없음

---

## 📈 향후 확장
```typescript
status: 'new' | 'registered' | 'suspended' | 'banned' | 'deleted'
```
추가 상태 관리 용이

---

## 🎨 UI State 리팩토링

### 문제점
- `pageTitle`, `pageSubtitle`, `pageLanguage` 분산 관리
- 실제로는 `setPageTitle()`에서 한 번에 업데이트됨
- 개발자가 셋의 관계를 파악하기 어려움

### 변경 사항

#### 1. PageInfo 인터페이스 생성
```typescript
// Before (산재 상태)
interface Store {
  pageTitle: string;
  pageSubtitle: string;
  pageLanguage: SupportedLanguage | null;
  setPageTitle: (title: string, subtitle?: string, language?: SupportedLanguage | null) => void;
}

// After (통합 상태)
export interface PageInfo {
  title: string;
  subtitle: string;
  language: SupportedLanguage | null;
}

interface Store {
  pageInfo: PageInfo;
  setPageInfo: (info: Partial<PageInfo>) => void;
}
```

#### 2. 사용 시점 변경
```typescript
// Before
const { pageTitle, pageLanguage } = useStore();

// After
const { pageInfo } = useStore();
const { title, language } = pageInfo;
```

#### 3. TopBar 컴포넌트 수정
```typescript
// Before
<TopBar title={pageTitle} subtitle={pageSubtitle} />

// After
<TopBar title={pageInfo.title} subtitle={pageInfo.subtitle} />
```

---

## 🔍 영향 범위 (PageInfo)

### 수정 파일
- `packages/frontend/src/stores/store.ts`
- `packages/frontend/src/components/TopBar.tsx`
- `packages/frontend/src/features/**/*Page.tsx` (모든 페이지 컴포넌트)

### 검색 후 수정 필요
```bash
grep -r "pageTitle\|pageLanguage" packages/frontend/src --include="*.tsx"
```

---

## ✅ 전체 검증 항목

### Auth State
- [ ] NicknameModal이 `appUser?.status === 'new'` 감지
- [ ] 라우팅이 정상 동작
- [ ] 신규 사용자 온보딩 플로우 테스트

### UI State (PageInfo)
- [ ] TopBar가 `pageInfo.title`, `pageInfo.subtitle` 정상 표시
- [ ] 모든 페이지에서 setPageInfo 호출 정상 작동
- [ ] 페이지 이동 시 pageInfo 정상 업데이트

### 전체
- [ ] TypeScript 컴파일 에러 없음
- [ ] `pnpm dev` 정상 동작
- [ ] 브라우저 콘솔 에러 없음

---

## 🏫 API 도메인 분리: /courses 리팩토링

### 문제점
- 콘텐츠 조회와 사용자 진행 상태가 같은 경로에 혼재
- 인증 정책이 일관되지 않음 (일부는 필수, 일부는 선택적)
- 사용자 개인 데이터가 글로벌 콘텐츠와 섞여 있음

### 현재 구조
```
GET  /api/courses/languages          ✅ 콘텐츠 (인증 불필요)
GET  /api/courses/chapters/:id       ✅ 콘텐츠
GET  /api/courses/lessons/:id        ✅ 콘텐츠
GET  /api/courses/progress           ❌ 사용자 데이터 (혼재!)
POST /api/courses/progress           ❌ 사용자 데이터 (혼재!)
GET  /api/courses/chapters/:id/progress ❌ 사용자 데이터 (혼재!)
```

### 개선된 구조

#### 1. 콘텐츠 API (글로벌, 캐시 가능)
```typescript
// 변화 없음 - 그대로 유지
GET  /api/courses/languages
GET  /api/courses/:lang/chapters
GET  /api/courses/chapters/:id
GET  /api/courses/lessons/:id
GET  /api/courses/:id  (언어 상세)
```

#### 2. 사용자 진행 상태 (개인 데이터, 이동 필요)
```typescript
// Before
GET  /api/courses/progress
POST /api/courses/progress
GET  /api/courses/chapters/:id/progress

// After (사용자 모듈으로 이동)
GET  /api/users/progress
POST /api/users/progress
GET  /api/users/chapters/:id/progress
```

### 변경 이유
1. **도메인 분리**: 콘텐츠(자료) ≠ 사용자 상태
2. **인증 정책**: 콘텐츠는 공개, 진행상태는 개인
3. **RESTful 원칙**: `/users/progress` (내 진행상태)가 더 자연스러움
4. **캐싱 최적화**: 콘텐츠만 캐싱 가능
5. **권한 관리**: 사용자 모듈에서 통합 관리

### 수정 파일

#### Frontend
```bash
grep -r "/courses/progress\|/courses/chapters.*progress" packages/frontend/src --include="*.tsx" --include="*.ts"
```
- API 호출 경로 변경: `/courses/progress` → `/users/progress`
- 관련 훅, 서비스 파일 수정

#### Backend
```
packages/backend/src/modules/courses/routes.ts
  - GET /progress 제거
  - POST /progress 제거
  - GET /chapters/:id/progress 제거

packages/backend/src/modules/users/routes.ts
  - GET /progress 추가
  - POST /progress 추가
  - GET /chapters/:id/progress 추가

packages/backend/src/modules/courses/service.ts
  - 진행 상태 함수들 유지 (재사용)

packages/backend/src/modules/users/service.ts
  - 진행 상태 함수들 임포트하여 사용
```

### 검증 항목
- [ ] `/api/users/progress` GET 정상 동작
- [ ] `/api/users/progress` POST 정상 동작
- [ ] `/api/users/chapters/:id/progress` 정상 동작
- [ ] `/api/courses/*` 콘텐츠 API 변화 없음
- [ ] 진행 상태 업데이트 → 스트릭 갱신 연동 확인
- [ ] Frontend API 호출 경로 모두 변경됨
- [ ] TypeScript 컴파일 에러 없음

---

## 📚 레슨 콘텐츠 저장소 통합: DB vs JSON 중복 제거

### 문제점
- **이중 로드**: DB에서 LessonContent 로드 → JSON 파일에서 다시 로드 (중복!)
- **메모리 낭비**: DB 데이터 로드 후 JSON으로 덮어씀
- **동기화 문제**: DB와 JSON이 불일치할 수 있음
- **불완전한 데이터**: language 필드가 JSON에 없을 수 있음

### 현재 구조
```
DB (LessonContent):          JSON 파일:
- id                ━━━━━━  -
- lessonId          ━━━━━━  -
- code              ━━━━━━━━ code (중복!)
- language          ━━━━━━  ?
- steps (Json)      ━━━━━━━━ steps (중복!)
- createdAt         ━━━━━━  -
- updatedAt         ━━━━━━  -
```

### 로드 흐름 (비효율적)
```typescript
// 1. DB에서 LessonContent 로드
const lesson = await prisma.lesson.findUnique({
  include: { content: true, quizzes: true }
});

// 2. JSON 파일에서 다시 로드 (불필요!)
const jsonContent = await lessonContentLoader.getContent(id);

// 3. 불필요한 병합
mergedContent = {
  ...lesson.content,    // ← DB 데이터 (버려질 예정)
  code: jsonContent.code,  // ← JSON으로 덮음 ❌
  steps: jsonContent.steps // ← JSON으로 덮음 ❌
};
```

### 권장 솔루션

**Option 1: DB만 사용 (추천) ✅**
```typescript
// before
const lesson = await courseService.getLessonFull(id);
const jsonContent = await lessonContentLoader.getContent(id);
// 병합...

// after
const lesson = await courseService.getLessonFull(id);
// 그냥 lesson.content 사용 (JSON 파일 제거)
```

**장점:**
- 단일 소스 (DB만 신뢰)
- DB 캐싱 자동 활용
- 동기화 문제 해결
- 관리 간단

**Option 2: JSON만 사용 (대안)**
```typescript
// LessonContent DB 테이블 제거
// JSON 파일만 사용하여 콘텐츠 관리
```

**장점:**
- Git 버전 관리 용이
- DB 마이그레이션 불필요
- 가벼운 구조

### 추천: Option 1 (DB만 사용)

**이유:**
1. 이미 모든 콘텐츠가 DB에 있음
2. JSON 로더의 복잡성 제거
3. 성능 개선 (이중 로드 제거)
4. 타입 안전성 확보

### 변경 사항

#### Backend
```
packages/backend/src/modules/courses/routes.ts
  - getLessonFull() 호출만 유지
  - lessonContentLoader.getContent() 제거 ❌
  - 병합 로직 제거

packages/backend/src/services/lessonContentLoader.ts
  - 삭제 가능 (더 이상 사용 안 함)
  - 또는 보관 (JSON 마이그레이션 용도)
```

#### 응답 구조 (변화 없음)
```json
{
  "id": "c-1-1",
  "title": "포인터 기초",
  "content": {
    "code": "...",
    "language": "c",
    "steps": [...]
  },
  "quizzes": [...]
}
```

### 검증 항목
- [ ] GET `/api/courses/lessons/:id` 응답 동일
- [ ] lesson.content가 완전한 데이터 포함
- [ ] lessonContentLoader 제거 (또는 유지 결정)
- [ ] 레슨 로드 성능 개선 측정 (이중 로드 제거)
- [ ] JSON 파일 삭제 가능 확인
- [ ] TypeScript 컴파일 에러 없음

### 성능 개선 예상
- 로드 시간: ~50% 감소 (이중 로드 제거)
- 메모리: DB 캐싱으로 추가 최적화
- 코드 복잡성: 병합 로직 제거
