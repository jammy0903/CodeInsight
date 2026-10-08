# Portfolio Slim Plan

**목표**: 면접관이 링크를 열고 2~3분 안에 핵심(언어별 실행 시뮬레이터 + 개념 전용 시각화)을 보게 만든다.
운영용 부가 기능은 걷어내고, Python Tutor와의 차별점("예측하고 틀려보는 시각화") 하나만 추가한다.

**브랜치**: `portfolio-slim` (작업 완료 후 main 머지)

## 원칙
- 각 단계 끝에 `pnpm build` 통과 확인 후 커밋 (단계당 1커밋)
- 삭제 전 `grep`으로 참조 확인, 삭제 후 참조 0건 확인 (rules/REFACTORING.md)
- 루트의 AI 에이전트 설정 파일(AGENTS.md, SOUL.md 등, `.ralph/`)은 건드리지 않음

## 남기는 것
- 시뮬레이터: C, Python, JS, Java (backend `modules/simulators`)
- 시각화: `features/visualizers` (EventLoop, Promise, PrototypeChain, 포인터, LoopTrack 등)
- Playground
- 강의: C / Python / JS / Java
- 인증, 진도(UserProgress): 일단 유지, 단 핵심 경험은 비로그인으로 열림

## 할 일

### 1. 라우트·메뉴 정리 (프론트)
- [x] `router.tsx`에서 dashboard, report, admin, profile, quiz/* 라우트 제거
- [x] `ai-literacy`, `python-practical` 강의 라우트 + 강의 목록 카드 제거 (cpp는 결정 대기)
- [x] `Sidebar.tsx`: 퀴즈/리포트/Admin 메뉴, 신고 버튼, 프로필 링크 제거
- [x] `TopBar.tsx`: 스트릭 카드 제거
- [x] 빌드 확인 → 커밋

### 2. 프론트 feature 삭제
- [ ] `features/{dashboard,report,admin,gamification,profile}` 삭제
- [ ] `services/{gamification,notes,analytics*}` 및 store의 streak 관련 상태 삭제
- [ ] `LessonPage.tsx`의 `refreshStreak`, `useLessonAnalytics` 결합 제거
- [ ] `OnboardingModal`, `NicknameModal`, `ReportModal` 필요 여부 확인 후 정리
- [ ] `python-practical`/`ai-literacy` 잔여 참조 정리 (SupportedLanguage 타입, LessonPage, ChapterCard, playgroundStore 등 ~15곳)
- [ ] 퀴즈 페이지 4종: 컴포넌트는 남겨두고 페이지만 제거 (6단계에서 재사용)
- [ ] 빌드 확인 → 커밋

### 3. 백엔드 모듈 삭제
- [ ] `modules/{gamification,analytics,notes,admin,reports,problems,submissions,standalone-quizzes}` 삭제
- [ ] `courses/service.ts`의 `streakService.updateStreak` 결합 제거
- [ ] `app.ts` 라우트 등록, `swagger.ts`, `auth.ts`의 관련 참조 정리
- [ ] C++ 시뮬레이터 제거 여부 결정 후 처리
- [ ] 빌드·테스트 확인 → 커밋

### 4. Prisma 스키마 정리
- [ ] 제거 대상: Problem, Submission, Draft, UserNote, UserStreak, StandaloneQuiz, StandaloneQuizAttempt, Report, (ChatHistory, SessionContext, StepActivity, LessonActivity, UserProfile 사용처 확인 후)
- [ ] 마이그레이션 생성 (`prisma migrate dev --name portfolio_slim`)
- [ ] seed 스크립트에서 제거된 모델 참조 정리
- [ ] 빌드 확인 → 커밋

### 5. 비로그인 데모 동선
- [ ] 강의·Playground가 로그인 없이 동작하는지 확인 (`ProtectedRoute` 제거)
- [ ] 홈 첫 화면에서 예제 코드가 바로 실행·시각화되도록 변경
- [ ] 커밋

### 6. 차별화 기능: 실행 중 예측하기
- [ ] 설계: 어느 스텝에서 멈출지 정의 방식 (레슨 JSON에 `predict` 필드)
- [ ] 스텝 전진 전에 예측 질문(값/포인터 대상)을 띄우는 UI (기존 퀴즈 컴포넌트 재사용)
- [ ] 정답/오답 시 시각화에서 실제 변화를 강조
- [ ] 대표 레슨 3~4개에 적용 (C 포인터, Python aliasing, JS 이벤트 루프, Java 참조)
- [ ] 커밋

### 7. 마무리
- [ ] README를 포트폴리오 관점으로 재작성 (차별점, 아키텍처, 데모 GIF)
- [ ] 루트의 `korea-*-contacts-*.csv` 5개 저장소에서 제거 (**사용자 확인 필요**: 히스토리까지 지울지)
- [ ] 브라우저에서 전체 동선 확인 (Network 404 없음)
- [ ] main 머지

## 결정 대기
- C++ 시뮬레이터/강의를 뺄지
- 소셜 로그인·다국어 유지 여부
- 연락처 CSV: 파일만 삭제 vs git 히스토리까지 제거
