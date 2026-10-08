# Portfolio Slim Plan

**목표**: 면접관이 링크를 열고 2~3분 안에 핵심(언어별 실행 시뮬레이터 + 개념 전용 시각화)을 보게 만든다.
운영용 부가 기능은 걷어내고, Python Tutor와의 차별점("예측하고 틀려보는 시각화") 하나만 추가한다.

**브랜치**: `portfolio-slim` (작업 완료 후 main 머지)

## 원칙
- 각 단계 끝에 `pnpm build` 통과 확인 후 커밋 (단계당 1커밋)
- 삭제 전 `grep`으로 참조 확인, 삭제 후 참조 0건 확인 (rules/REFACTORING.md)
- 루트의 AI 에이전트 설정 파일(AGENTS.md, SOUL.md 등, `.ralph/`)은 건드리지 않음

## 결정 사항 (2026-10-08)
- 로그인 완전 제거 → 사용자/진도 서버 저장도 함께 제거 (계정 없는 순수 데모)
- 다국어(한/영)는 유지
- C++ 시뮬레이터·강의 제거 (C와 중복)
- 연락처 CSV 5개: git 히스토리에서 제거 후 force push ✅ 완료

## 남기는 것
- 시뮬레이터: C, Python, JS, Java (backend `modules/simulators`)
- 시각화: `features/visualizers` (EventLoop, Promise, PrototypeChain, 포인터, LoopTrack 등)
- Playground
- 강의: C / Python / JS / Java (콘텐츠 조회 API만)
- 다국어

## 할 일

### 0. 연락처 CSV 히스토리 제거 ✅
- [x] `git filter-repo`로 main, portfolio-slim에서 `korea-*-contacts*.csv` 제거
- [x] `main` force push, `portfolio-slim` push

### 1. 라우트·메뉴 정리 (프론트) ✅
- [x] `router.tsx`에서 dashboard, report, admin, profile, quiz/* 라우트 제거
- [x] `ai-literacy`, `python-practical` 강의 라우트 + 강의 목록 카드 제거
- [x] `Sidebar.tsx`: 퀴즈/리포트/Admin 메뉴, 신고 버튼, 프로필 링크 제거
- [x] `TopBar.tsx`: 스트릭 카드 제거
- [x] 빌드 확인 → 커밋

### 2. 프론트 정리 ✅
- [x] `features/{dashboard,report,admin,gamification,profile,auth,legal,quiz}`, `visualizers/cpp` 삭제
- [x] 로그인 제거: firebase 서비스, authStore, tokenManager, ProtectedRoute, Nickname/Onboarding/Report 모달, axios 인증 헤더·401 재시도
- [x] Sidebar/TopBar/푸터의 로그인·프로필·문의 영역, `/login`·`/privacy`·`/terms` 라우트 제거
- [x] services(gamification, notes, analytics, reports, standalone-quiz, user, admob, cppSimulator), store의 streak/user 상태 삭제
- [x] 진도: 서버 저장 → localStorage(`stores/progressStore.ts`)로 대체
- [x] `python-practical` / `ai-literacy` / `cpp` 잔여 참조 정리 (LessonUnifiedView의 AI 리터러시 전용 UI 포함)
- [x] Playground persist v3 마이그레이션: 저장된 언어가 제거된 언어면 C로
- [x] Firebase 환경변수 필수 조건 제거 → env 없이 실행 가능
- [x] e2e: 인증/퀴즈 테스트·fixture 삭제, 홈 테스트를 Playground 버튼 기준으로 수정
- [x] `firebase` 의존성 제거
- [x] 덤: `LessonPage` 조건부 Hook 호출 버그 수정, `vitest.config.ts`의 `path` import 누락 수정
- [x] 타입 체크·빌드 확인 → 커밋
- 남김: Capacitor(Android 앱 래퍼), 번역 JSON의 미사용 키 → 7단계에서 정리

### 3. 백엔드 정리
- [ ] `modules/{gamification,analytics,notes,admin,reports,problems,submissions,standalone-quizzes,users}` 삭제
- [ ] `modules/simulators/cpp` 삭제
- [ ] 인증 제거: `plugins/auth.ts`, `config/firebase.ts`, `firebase-admin` 의존성, rateLimit의 사용자 기반 키
- [ ] `courses`: 진도 API(`/progress` 등)와 `streakService` 결합 제거, 콘텐츠 조회만 남김
- [ ] `app.ts` 라우트 등록, `swagger.ts` 정리
- [ ] 빌드·테스트 확인 → 커밋

### 4. Prisma 스키마 정리
- [ ] 남길 모델: Language, Chapter, Lesson, LessonContent, Quiz (그 외 전부 제거)
- [ ] cpp / python-practical / ai-literacy 강의 콘텐츠 seed 제거
- [ ] 마이그레이션 생성 (`prisma migrate dev --name portfolio_slim`)
- [ ] seed·스크립트(`backup-user-data.ts`, `crawl-solvedac.ts` 등)에서 제거된 모델 참조 정리
- [ ] 빌드 확인 → 커밋

### 5. 데모 동선
- [ ] 홈 첫 화면에서 예제 코드가 바로 실행·시각화되도록 변경
- [ ] (선택) 레슨 완료 표시를 localStorage로
- [ ] 커밋

### 6. 차별화 기능: 실행 중 예측하기
- [ ] 설계: 어느 스텝에서 멈출지 정의 방식 (레슨 JSON에 `predict` 필드)
- [ ] 스텝 전진 전에 예측 질문(값/포인터 대상)을 띄우는 UI (기존 퀴즈 컴포넌트 재사용)
- [ ] 정답/오답 시 시각화에서 실제 변화를 강조
- [ ] 대표 레슨 3~4개에 적용 (C 포인터, Python aliasing, JS 이벤트 루프, Java 참조)
- [ ] 커밋

### 7. 마무리
- [ ] README를 포트폴리오 관점으로 재작성 (차별점, 아키텍처, 데모 GIF)
- [ ] `render.yaml`, `.env.example`, docker-compose에서 Firebase 등 불필요 환경변수 제거
- [ ] 번역 JSON(ko/en/zh)의 미사용 키 정리
- [ ] Capacitor/Android 유지 여부 결정
- [ ] 브라우저에서 전체 동선 확인 (Network 404 없음)
- [ ] main 머지
