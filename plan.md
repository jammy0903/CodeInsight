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

### 3. 백엔드 정리 ✅
- [x] `modules/{gamification,analytics,notes,admin,reports,problems,submissions,standalone-quizzes,users}` 삭제
- [x] `modules/simulators/cpp` 삭제
- [x] 인증 제거: `plugins/auth.ts`, `config/firebase.ts`, rateLimit 키를 IP 기준으로, CORS Authorization 헤더·credentials 제거
- [x] `courses`: 진도 API 3개와 `streakService` 결합 제거, 콘텐츠 조회만 남김
- [x] C 시뮬레이터의 `/judge`(문제 채점, 프론트 미사용) 엔드포인트·executor 메서드·타입 제거
- [x] 미사용 환경변수 제거: Firebase, xAI, DeepSeek, Brevo, C_JUDGE_TIMEOUT
- [x] 미사용 의존성 제거: firebase-admin, @google/generative-ai, @notionhq/client, @babel/*
- [x] `app.ts` 라우트 등록, `swagger.ts` 태그·스키마 정리
- [x] 타입 체크 0 에러, 테스트 107 통과 / 12 실패 (기준선과 동일: 로컬에 gdb 없음)
- 남김: libsql/better-sqlite3/Prisma adapter 의존성 (코드에서 미사용, 4단계에서 DB 정리하며 확인)

### 4. Prisma 스키마 정리 ✅
- [x] 남긴 모델: Language, Chapter, Lesson, LessonContent, Quiz (17개 모델 제거)
- [x] 마이그레이션 `20261008000000_portfolio_slim`: FK·테이블 DROP(`IF EXISTS`), cpp/python-practical/ai-literacy 강의 행 삭제
- [x] seed: 제외 강의 블록 제거, `prisma/content/{cpp,python-practical,ai-literacy,quizzes}` 삭제
- [x] 사용자·문제 관련 스크립트 16개, 커밋돼 있던 사용자 백업 JSON, 죽은 npm 스크립트 5개 삭제
- [x] 미사용 의존성 제거: libsql, better-sqlite3, Prisma sqlite/libsql adapter, zod-to-json-schema
- [x] **보안**: `prisma.config.ts`, `scripts/check-seed.ts`에 하드코딩된 Neon 접속 URL(비밀번호 포함) 제거
- [x] 검증 (임시 Docker Postgres): 기존 마이그레이션 + 운영 유사 데이터 → 새 마이그레이션 적용 → 테이블 23→6, cpp 데이터만 삭제, 스키마 drift 없음, seed 202 레슨, API·Python/JS 시뮬레이터 정상
- 남김: 개발용 스크립트 3개의 기존 타입 에러(backup-courses, restore-courses, validate-simulators)
- ⚠️ 사용자 조치 필요: Neon DB 비밀번호 교체 (공개 히스토리에 노출됨) → Render `DATABASE_URL` 갱신

### 5. 데모 동선 ✅
- [x] 홈 슬라이드 패널(지운 기능을 그린 SVG 8개) → 실행 시각화 데모(`features/home/HomeDemo.tsx`)로 교체
  - Python 참조/별칭: 녹화된 시뮬레이터 응답 → Playground와 같은 변환(`toPythonLessonSteps`)
  - JS 이벤트 루프: 녹화된 레슨 `js-1-4` → 레슨과 같은 변환(`resolveStepLines`)
  - 자동 재생(2.6초, 반복), 직접 넘기면 정지, `prefers-reduced-motion`이면 정지 상태로 시작
  - 캡션·출력 줄, 한/영/중 i18n
- [x] 녹화 스크립트 `packages/frontend/scripts/record-home-demo.mjs` (백엔드 콜드 스타트 없이 즉시 재생)
- [x] 홈 로그인 버튼 → Playground 버튼 (2단계에서 처리)
- [x] 진도 localStorage (2단계에서 처리)
- [x] 헤드리스 Chromium으로 데스크톱/모바일 확인, 콘솔 에러 없음

### 6. 차별화 기능: 실행 중 예측하기 ✅
- [x] 데이터: 레슨 스텝에 `predict { question, options, answer }` (shared `StepPredictSchema`, answer 범위 검증)
- [x] 위치: 2라운드(시각화) — 다음 스텝에 predict가 있으면 이동을 막고 질문, 시각화는 현재 상태 유지 + 코드는 다음 줄 하이라이트
- [x] `usePredictGate` 훅: 버튼·키보드·스와이프 이동이 모두 gate 경유, 질문 중 "다음" 무시·"이전"은 질문 닫기
- [x] 답한 뒤: 정답/오답 + 내 예측 vs 실제 피드백, 시각화가 실제 변화 표시
- [x] 결과 localStorage 기록(첫 답만), 레슨 완료 화면에 "예측 n개 중 m개 정답"
- [x] 적용: `c-2-4`(역참조 쓰기), `py-3-1`(append/del), `java-3-2`(참조 전달 vs 재할당), `js-1-4`(microtask 순서) × ko/en/zh
- [x] 테스트 9개 (gate 판단, 훅 흐름, 첫 답 기록), 프론트 `test` 스크립트 추가
- [x] E2E 수동 확인 (임시 DB + 로컬 백엔드 + 헤드리스 브라우저): C·JS 레슨 질문 → 오답 → 피드백 → 기록
- 참고: shared 스키마를 바꾼 뒤 dev 서버는 `vite --force`로 재시작해야 함 (optimizeDeps 캐시)

### 7. 마무리
- [ ] README를 포트폴리오 관점으로 재작성 (차별점, 아키텍처, 데모 GIF)
- [ ] `render.yaml`, `.env.example`, docker-compose에서 Firebase 등 불필요 환경변수 제거
- [ ] 번역 JSON(ko/en/zh)의 미사용 키 정리, `feature_languages_desc`의 C++ 언급
- [ ] `EventLoopView` 헤더 등 하드코딩된 한국어 문자열 i18n
- [ ] Capacitor/Android 유지 여부 결정
- [ ] 브라우저에서 전체 동선 확인 (Network 404 없음)
- [ ] main 머지
