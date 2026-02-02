# E2E 테스트 상태 및 수정 사항

**최근 업데이트**: 2026-02-02
**테스트 실행 결과**: 91개 실패 → 수정 진행 중

---

## 📊 테스트 실행 결과 (수정 전)

```
총 132개 테스트 (2개 브라우저 × 66개 테스트)
├── Chromium: 91개 실패
├── Mobile:   29개 통과 + 2개 실패 + 12개 건너뜀
└── 총 실행 시간: 6.0분
```

---

## 🔧 수정된 문제들

### 1. **LessonPage 코드 뷰어 셀렉터** ✅ 수정됨

**파일**: `e2e/pages/lesson.page.ts:50`

**문제**:
```typescript
// ❌ 잘못된 셀렉터
this.codeViewer = page.locator('pre, code, .code-viewer').first();
```

실제 LessonPage 컴포넌트는 **Monaco Editor** 라이브러리를 사용하므로:
- 셀렉터 `pre, code, .code-viewer`가 찾을 수 없음
- 결과: TimeoutError (10초 대기 후 실패)

**해결**:
```typescript
// ✅ 수정된 셀렉터
this.codeViewer = page.locator('.monaco-editor, pre, code, .code-viewer').first();
```

**상세 정보**:
- **실제 컴포넌트**: `LessonCodeEditor.tsx` (Monaco Editor 기반)
- **HTML 구조**: `.monaco-editor` 클래스
- **대체 셀렉터**: `.view-lines`, `.view-line` (개별 코드 라인)

---

### 2. **하이라이트 라인 셀렉터** ✅ 수정됨

**파일**: `e2e/pages/lesson.page.ts:52`

**수정 전/후**:
```typescript
// ❌ 전
this.highlightedLine = page.locator('[class*="highlight"], [class*="active"]');

// ✅ 후
this.highlightedLine = page.locator('.current-line, [class*="highlight"], [class*="active"]');
```

**설명**: Monaco Editor에서 현재 활성 라인은 `.current-line` 클래스를 사용합니다.

---

### 3. **코드 라인 셀렉터** ✅ 수정됨

**파일**: `e2e/pages/lesson.page.ts:51`

**수정 전/후**:
```typescript
// ❌ 전
this.codeLines = page.locator('.code-line, [class*="line"]');

// ✅ 후
this.codeLines = page.locator('.view-line, .code-line, [class*="line"]');
```

**설명**: Monaco Editor의 각 코드 라인은 `.view-line` 클래스입니다.

---

## 📋 컴포넌트 구조 분석

### LessonPage 레이아웃

```
LessonPage (/courses/:lang/:chapterId/:lessonId)
├── 좌측 패널 (50%)
│   ├── [헤더] "에디터"
│   ├── [LessonCodeEditor] ← Monaco Editor
│   │   └── .monaco-editor
│   │       ├── .line-numbers
│   │       ├── .view-lines
│   │       │   └── .view-line (각 라인)
│   │       │       └── .current-line (활성 라인)
│   │       └── ...
│   └── [StepExplanation] ← 설명 텍스트
│
└── 우측 패널 (50%)
    ├── [탭 선택] Flow / Memory / AI 튜터
    └── [Visualizer]
        ├── LessonFlowVisualizer
        └── LessonMemoryVisualizer
```

### 사용된 기술 스택

- **코드 에디터**: Monaco Editor (VS Code 기반)
- **스타일**: TailwindCSS + 테마 변수
- **상태 관리**: Zustand (테마, 진행률)
- **애니메이션**: Framer Motion

---

## 🧪 다음 테스트 계획

### Phase 1: 기본 동작 테스트
```bash
# 1. Lesson Page 테스트만 실행
pnpm exec playwright test lesson.spec.ts

# 2. 특정 시나리오만 (코드 뷰어 표시)
pnpm exec playwright test -g "코드 뷰어 표시"

# 3. Desktop만 (Chrome 문제 진단)
pnpm exec playwright test --project=chromium
```

### Phase 2: Mobile 테스트
```bash
# Mobile 테스트 (현재 성공률 높음)
pnpm exec playwright test --project=mobile

# UI 모드로 디버그
pnpm test:e2e:ui
```

### Phase 3: 전체 테스트
```bash
# 모든 테스트 실행
pnpm test:e2e

# HTML 리포트 확인
pnpm exec playwright show-report
```

---

## 📊 예상 결과 (수정 후)

| 테스트 | 예상 결과 | 비고 |
|--------|---------|------|
| Lesson - 코드 뷰어 | ✅ 통과 | Monaco 셀렉터 수정 |
| Lesson - 스텝 이동 | ✅ 통과 | 코드 뷰어 로드 후 가능 |
| Lesson - 메모리 시각화 | ✅ 통과 | 별도 컴포넌트 |
| Quiz (Protected) | ⚠️ 미정 | API 모킹 검증 필요 |
| Report (Protected) | ⚠️ 미정 | API 모킹 검증 필요 |
| Courses (Public) | ⚠️ 검토 | Chromium 특정 문제 |
| Home (Public) | ✅ 대부분 통과 | 기본 구조 문제 없음 |

---

## 🔍 추가 조사 필요 사항

### 1. Quiz/Report API 모킹
- [ ] `fixtures/quiz-mock.ts` 검증
- [ ] API 응답 구조 확인
- [ ] 모킹된 데이터가 실제 API와 일치하는지 확인

### 2. Chromium 특정 문제
- [ ] 왜 Chromium에서만 실패하는가?
- [ ] Mobile에서는 통과하는 이유?
- [ ] 뷰포트 크기 차이?
- [ ] 렌더링 엔진 차이?

### 3. Protected Routes 인증
- [ ] Firebase Mock이 제대로 작동하는가?
- [ ] 로그인 상태 유지?
- [ ] 토큰 저장/로드?

---

## 📁 관련 파일

| 파일 | 역할 | 상태 |
|------|------|------|
| `e2e/pages/lesson.page.ts` | Lesson Page POM | ✅ 수정됨 |
| `e2e/pages/ox-quiz.page.ts` | Quiz Page POM | ✅ 확인됨 |
| `e2e/pages/report.page.ts` | Report Page POM | ✅ 확인됨 |
| `e2e/fixtures/test-base.ts` | Fixture 설정 | 검토 필요 |
| `e2e/fixtures/quiz-mock.ts` | Quiz API Mock | 검토 필요 |
| `e2e/fixtures/auth-mock.ts` | Auth Mock | 검토 필요 |

---

## ⚡ 빠른 실행 명령어

```bash
# 현재 위치
cd packages/frontend

# 1. 수정된 Lesson 테스트만 실행
pnpm exec playwright test lesson.spec.ts --headed

# 2. 특정 시나리오 디버그
pnpm exec playwright test --debug -g "코드 뷰어 표시"

# 3. UI 모드로 대화형 테스트
pnpm test:e2e:ui

# 4. 전체 리포트 확인
pnpm exec playwright show-report
```

---

## 📝 작업 체크리스트

- [x] Lesson Page 셀렉터 수정
- [ ] 수정된 코드로 Lesson 테스트 실행
- [ ] Quiz/Report Mock 검증
- [ ] Protected Routes 인증 테스트
- [ ] Chromium 특정 문제 분석
- [ ] 모든 테스트 재실행
- [ ] HTML 리포트 생성

---

**다음 단계**: Lesson 테스트 재실행 → 결과 분석 → Quiz/Report Mock 검증

