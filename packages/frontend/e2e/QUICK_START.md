# Standalone Quiz E2E Tests - Quick Start Guide

## 🚀 빠른 시작

### 1. 전체 테스트 실행

```bash
# 프론트엔드 디렉토리로 이동
cd packages/frontend

# 모든 E2E 테스트 실행 (headless)
pnpm test:e2e
```

### 2. UI 모드로 실행 (추천)

```bash
# Playwright UI 열기 - 테스트 선택하고 실행
pnpm test:e2e:ui
```

**장점**:
- 테스트 선택 가능
- 실시간 브라우저 확인
- 스텝별 디버깅
- 타임 트래블 (시간 되돌리기)

### 3. Standalone Quiz 테스트만 실행

```bash
# OX 퀴즈 테스트만 (16개)
pnpm exec playwright test standalone-quiz-ox

# 리포트 페이지 테스트만 (6개)
pnpm exec playwright test standalone-quiz-report

# 둘 다
pnpm exec playwright test standalone-quiz
```

### 4. 특정 시나리오만 실행

```bash
# P0 시나리오만 (grep 사용)
pnpm exec playwright test -g "P0"

# Happy Path만
pnpm exec playwright test -g "Happy Path"

# 특정 테스트 (예: P0-4)
pnpm exec playwright test -g "P0-4"
```

### 5. 디버그 모드

```bash
# 브라우저 보면서 실행 + Playwright Inspector
pnpm exec playwright test --debug standalone-quiz-ox

# 특정 테스트만 디버그
pnpm exec playwright test --debug -g "P0-4"
```

---

## 📊 테스트 결과 확인

### HTML 리포트 열기

```bash
# 테스트 실행 후
pnpm exec playwright show-report
```

**포함 내용**:
- 각 테스트 통과/실패 상태
- 실패한 테스트의 스크린샷
- 에러 로그 및 스택 트레이스
- 비디오 재생 (실패 시)

### 리포트 디렉토리

```
packages/frontend/
├── playwright-report/  # HTML 리포트
└── test-results/       # 스크린샷, 비디오, 트레이스
```

---

## 🎯 테스트 시나리오 목록

### OX Quiz (16개)

#### P0: 인증 상태별 (3개)
```bash
pnpm exec playwright test -g "인증 상태별"
```
- P0-1: 비로그인 시 401 에러
- P0-2: 로그인 후 데이터 없음
- P0-3: 로그인 후 데이터 있음

#### P0: Happy Path (2개)
```bash
pnpm exec playwright test -g "Happy Path"
```
- P0-4: 전체 플로우 (챕터 → 퀴즈 → 결과)
- P0-5: 진행률 및 점수 업데이트

#### P0: 정답/오답 피드백 (3개)
```bash
pnpm exec playwright test -g "정답/오답"
```
- P0-6: 정답 피드백
- P0-7: 오답 피드백
- P0-8: 개념 태그 표시

#### P1: 재시도 (3개)
```bash
pnpm exec playwright test -g "재시도"
```
- P1-1: "다시 풀기" 버튼
- P1-2: "챕터 선택" 버튼
- P1-3: 이전 시도 기록 배지

#### P1: 에러 처리 (2개)
```bash
pnpm exec playwright test -g "에러 처리"
```
- P1-4: 챕터 로드 실패
- P1-5: 퀴즈 로드 실패

#### P1: 중간 이탈 (1개)
```bash
pnpm exec playwright test -g "중간 이탈"
```
- P1-6: 5문제만 풀고 뒤로가기

### Report Page (6개)

#### P0: 리포트 페이지 (6개)
```bash
pnpm exec playwright test standalone-quiz-report
```
- P0-1: 퀴즈 섹션 표시
- P0-2: 취약 개념 Top 5
- P0-3: 데이터 없음 메시지
- P0-4: 오답률 및 시도 횟수
- P0-5: 오답률 높은 순 정렬
- P0-6: "이 개념 다시 풀기" 버튼

---

## 🛠️ 트러블슈팅

### 문제: 테스트가 타임아웃으로 실패

**원인**: 개발 서버가 실행 중이 아님

**해결**:
```bash
# 터미널 1: 개발 서버 실행
pnpm dev

# 터미널 2: 테스트 실행
pnpm test:e2e
```

또는 Playwright가 자동으로 서버 실행 (playwright.config.ts 설정됨):
```bash
# 개발 서버 없이 바로 실행 (자동 시작)
pnpm test:e2e
```

### 문제: "page.goto" 에러

**원인**: baseURL 설정 문제

**확인**:
```typescript
// playwright.config.ts
use: {
  baseURL: 'http://localhost:5174',  // Vite 기본 포트
}
```

### 문제: Firebase 인증 에러

**원인**: 모킹이 적용되지 않음

**해결**: Fixture 사용 확인
```typescript
// ❌ 잘못된 사용
test('...', async ({ page }) => {
  // page는 기본 페이지 (인증 없음)
});

// ✅ 올바른 사용
test('...', async ({ quizWithData }) => {
  // quizWithData는 인증 + 모킹 적용됨
});
```

### 문제: Locator not found

**원인**: UI가 변경되어 Locator가 맞지 않음

**해결**:
1. Playwright Inspector로 실제 DOM 확인:
   ```bash
   pnpm exec playwright test --debug -g "실패한_테스트"
   ```
2. Page Object Model 업데이트:
   ```typescript
   // e2e/pages/ox-quiz.page.ts
   this.oButton = page.locator('...');  // 새 Locator
   ```

---

## 📁 파일 구조

```
packages/frontend/e2e/
├── fixtures/
│   ├── auth-mock.ts           # Firebase 인증 모킹
│   ├── quiz-mock.ts           # Quiz API 모킹
│   └── test-base.ts           # 커스텀 Fixture
├── pages/
│   ├── ox-quiz.page.ts        # OXQuizPage POM
│   ├── report.page.ts         # ReportPage POM
│   └── index.ts               # POM export
├── tests/
│   ├── standalone-quiz-ox.spec.ts      # OX 퀴즈 테스트 (16개)
│   └── standalone-quiz-report.spec.ts  # 리포트 테스트 (6개)
├── STANDALONE_QUIZ_E2E_IMPLEMENTATION.md  # 구현 상세 문서
└── QUICK_START.md             # 이 파일
```

---

## 🔍 유용한 명령어

### 1. Watch 모드
```bash
# 파일 변경 시 자동 재실행
pnpm exec playwright test --ui
# (UI 모드가 watch 역할)
```

### 2. 특정 브라우저만
```bash
# Chromium만
pnpm exec playwright test --project=chromium

# Mobile만
pnpm exec playwright test --project=mobile
```

### 3. 헤드리스 모드 끄기
```bash
# 브라우저 보면서 실행
pnpm test:e2e:headed

# 또는
pnpm exec playwright test --headed
```

### 4. 테스트 코드 생성 (Codegen)
```bash
# 브라우저 조작 → 테스트 코드 자동 생성
pnpm exec playwright codegen http://localhost:5174/quiz/ox/c
```

### 5. 트레이스 뷰어
```bash
# 실패한 테스트의 트레이스 확인
pnpm exec playwright show-trace test-results/...trace.zip
```

---

## 📚 더 알아보기

- [구현 상세 문서](./STANDALONE_QUIZ_E2E_IMPLEMENTATION.md)
- [Playwright 공식 문서](https://playwright.dev/docs/intro)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Models](https://playwright.dev/docs/pom)

---

## 🎉 Happy Testing!

문제가 있으면 Playwright Trace Viewer와 HTML Report를 확인하세요!
