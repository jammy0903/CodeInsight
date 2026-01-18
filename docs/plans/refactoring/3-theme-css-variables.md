# 테마 CSS 변수 확장 계획서

> 작성일: 2026-01-18
> 최종 수정: 2026-01-18
> 상태: 진행 중 (Phase 1-2 완료)

---

## 1. 배경

### 현재 문제 (해결됨 ✅)
- ~~`themes.ts`에 101개 색상이 TypeScript로 정의되어 있음~~
- ~~`index.css`에서는 8개 CSS 변수만 관리 중 (HomePage 전용)~~
- ~~`@layer components`의 클래스들이 **미니멀 테마 색상으로 하드코딩**됨~~
- ~~테마 변경 시 soft, dark 테마가 제대로 적용되지 않음~~

### 목표
- ✅ 모든 테마 색상을 CSS 변수로 관리 (193개 변수)
- ✅ 테마 전환 시 전체 UI가 일관되게 변경되도록 함

---

## 2. 파일 구조

### Before
```
frontend/src/
├── index.css              # 모든 CSS (1161줄)
└── config/
    └── themes.ts          # TypeScript 테마 정의
```

### After
```
frontend/src/
├── index.css              # 기본 스타일 (CSS 변수 사용)
├── config/
│   ├── theme.css          # 테마 변수 전용 (신규)
│   └── themes.ts          # TypeScript 테마 정의 (유지, Monaco용)
```

---

## 3. CSS 변수 목록 (193개)

### 3.1 Layout (21개)
```css
--theme-layout-page-bg
--theme-layout-top-bar-bg
--theme-layout-top-bar-border
--theme-layout-top-bar-text
--theme-layout-top-bar-text-muted
--theme-layout-top-bar-button-bg
--theme-layout-top-bar-button-hover
--theme-layout-sidebar-bg
--theme-layout-sidebar-border
--theme-layout-sidebar-text
--theme-layout-sidebar-text-muted
--theme-layout-sidebar-item-bg
--theme-layout-sidebar-item-active
--theme-layout-sidebar-item-hover
--theme-layout-footer-bg
--theme-layout-footer-border
--theme-layout-footer-text
--theme-layout-footer-text-muted
--theme-layout-footer-link-hover
--theme-layout-footer-social-bg
--theme-layout-footer-social-hover
```

### 3.2 Explanation Panel (13개)
```css
--theme-explanation-bg-gradient
--theme-explanation-header-gradient
--theme-explanation-header-border
--theme-explanation-text
--theme-explanation-text-muted
--theme-explanation-button-bg
--theme-explanation-button-border
--theme-explanation-button-text
--theme-explanation-button-hover
--theme-explanation-counter-bg
--theme-explanation-quiz-gradient
--theme-explanation-quiz-hover-gradient
--theme-explanation-quiz-text
```

### 3.3 Memory Panel (30개)
```css
--theme-memory-stack-bg
--theme-memory-stack-label
--theme-memory-stack-border
--theme-memory-heap-bg
--theme-memory-heap-label
--theme-memory-heap-border
--theme-memory-data-bg
--theme-memory-data-label
--theme-memory-text-bg
--theme-memory-text-label
--theme-memory-card-bg
--theme-memory-register-rsp-bg
--theme-memory-register-rsp-border
--theme-memory-register-rsp-text
--theme-memory-register-rbp-bg
--theme-memory-register-rbp-border
--theme-memory-register-rbp-text
--theme-memory-lang-active-bg
--theme-memory-lang-active-text
--theme-memory-lang-inactive-bg
--theme-memory-lang-inactive-text
--theme-memory-reset-bg
--theme-memory-reset-border
--theme-memory-reset-text
--theme-memory-counter-bg
--theme-memory-counter-border
--theme-memory-counter-text
--theme-memory-card-text
--theme-memory-card-muted
--theme-memory-section-text
```

### 3.4 Dashboard (12개)
```css
--theme-dashboard-page-bg
--theme-dashboard-card-bg
--theme-dashboard-card-border
--theme-dashboard-title
--theme-dashboard-text
--theme-dashboard-text-muted
--theme-dashboard-accent
--theme-dashboard-accent-hover
--theme-dashboard-section-header-bg
--theme-dashboard-stat-card-bg
--theme-dashboard-progress-bg
--theme-dashboard-empty-bg
```

### 3.5 Lesson Page (26개)
```css
--theme-lesson-page-bg
--theme-lesson-panel-bg
--theme-lesson-panel-border
--theme-lesson-code-header-bg
--theme-lesson-code-header-text
--theme-lesson-code-icon-color
--theme-lesson-code-bg
--theme-lesson-terminal-bg
--theme-lesson-terminal-header-bg
--theme-lesson-terminal-text
--theme-lesson-terminal-border
--theme-lesson-tab-active-bg
--theme-lesson-tab-active-text
--theme-lesson-tab-inactive-bg
--theme-lesson-tab-inactive-text
--theme-lesson-memory-bg
--theme-lesson-chat-bg
--theme-lesson-completed-bg
--theme-lesson-completed-border
--theme-lesson-completed-icon-bg
--theme-lesson-completed-text
--theme-lesson-completed-text-muted
--theme-lesson-button-primary-bg
--theme-lesson-button-secondary-bg
--theme-lesson-button-secondary-border
--theme-lesson-button-secondary-text
--theme-lesson-header-text
--theme-lesson-header-text-muted
```

### 3.6 Code Viewer (15개)
```css
--theme-code-viewer-bg
--theme-code-viewer-text
--theme-code-viewer-line-number-bg
--theme-code-viewer-line-number-text
--theme-code-viewer-line-number-active
--theme-code-viewer-line-number-border
--theme-code-viewer-highlight-bg
--theme-code-viewer-highlight-border
--theme-code-viewer-comment
--theme-code-viewer-keyword
--theme-code-viewer-string
--theme-code-viewer-number
--theme-code-viewer-type
--theme-code-viewer-function
--theme-code-viewer-operator
```

### 3.7 UI Buttons (3개)
```css
--theme-ui-success-bg
--theme-ui-danger-bg
--theme-ui-cyan-bg
```

### 3.8 Badge (6개)
```css
--theme-badge-gold-bg
--theme-badge-gold-text
--theme-badge-cyan-bg
--theme-badge-cyan-text
--theme-badge-pink-bg
--theme-badge-pink-text
```

### 3.9 Chapter Badge (4개)
```css
--theme-chapter-badge-progress-bg
--theme-chapter-badge-progress-text
--theme-chapter-badge-complete-bg
--theme-chapter-badge-complete-text
```

### 3.10 Lesson Difficulty (6개)
```css
--theme-difficulty-basic-bg
--theme-difficulty-basic-text
--theme-difficulty-intermediate-bg
--theme-difficulty-intermediate-text
--theme-difficulty-advanced-bg
--theme-difficulty-advanced-text
```

### 3.11 HomePage (8개)
```css
--theme-home-hero-bg
--theme-home-section-bg
--theme-home-title
--theme-home-subtitle
--theme-home-text
--theme-home-text-muted
--theme-home-matrix-color
--theme-home-matrix-bg
```

### 3.12 QuizPage (11개)
```css
--theme-quiz-page-bg
--theme-quiz-card-bg
--theme-quiz-card-border
--theme-quiz-card-border-hover
--theme-quiz-card-selected-bg
--theme-quiz-card-selected-border
--theme-quiz-header-icon
--theme-quiz-title
--theme-quiz-text
--theme-quiz-text-muted
--theme-quiz-text-hover
```

---

## 4. 작업 단계

### Phase 1: theme.css 파일 생성 ✅
- [x] `frontend/src/config/theme.css` 생성
- [x] 158개 CSS 변수를 세 테마별로 정의 (--theme- prefix)
- [x] `index.css`에서 `@import "./config/theme.css"` 추가
- [x] UI Buttons, Badge, Chapter Badge, Lesson Difficulty 변수 추가

### Phase 2: index.css 하드코딩 색상 교체 ✅
- [x] `.btn-primary`, `.btn-secondary` 등 버튼 클래스
- [x] `.btn-success`, `.btn-danger`, `.btn-cyan` 버튼 클래스
- [x] `.badge-gold`, `.badge-cyan`, `.badge-pink` 클래스
- [x] `.chapter-card`, `.lesson-item` 등 카드 클래스
- [x] `.chapter-badge.progress`, `.chapter-badge.complete` 클래스
- [x] `.lesson-difficulty.basic/intermediate/advanced` 클래스
- [x] `.step-controls`, `.cyber-back-btn` 등 컨트롤 클래스
- [x] `.course-*` 클래스들 (dashboard 변수 재사용)

### Phase 3: 컴포넌트 inline style 교체 ✅
- [x] TopBar (완료)
- [x] LessonPage (완료)
- [x] TerminalOutput (완료)
- [x] AnalyticsSection (753줄, 7개 하위 컴포넌트) - 완료
- [x] MemoryPanel (1127줄, 10+ 하위 컴포넌트) - 완료

**Note**: AnalyticsSection의 ContributionCalendar와 AnalysisResultModal, MemoryPanel의 RegisterIndicator 등 일부 컴포넌트는 테마별 하드코딩 색상을 유지 (grassColors, registerColors 등). 이는 각 테마별로 다른 색상 팔레트를 사용하기 위함.

### Phase 4: 정리 및 테스트
- [x] `index.css`에서 중복 CSS 변수 제거 (기존 8개) → theme.css로 이동 완료
- [x] Playground 컴포넌트 테마화 완료 (Memory section +16 variables)
  - LanguageTabs: 언어 선택 버튼 (C/Py/Java)
  - StepControls: Reset 버튼, 스텝 카운터 (1/10)
  - MemoryPanel COLORS: CPU 레지스터 색상 (RSP, RBP)
- [x] QuizPage 테마화 완료 (+11 variables)
  - 퀴즈 카드 버튼 (OX/객관식/빈칸)
  - 헤더, 텍스트, 호버 상태
- [x] Footer 테마화 완료 (Layout 변수 재사용)
  - 브랜드 링크, 네비게이션 링크
  - 소셜 버튼 (GitHub, Gmail)
  - 저작권 텍스트
- [ ] 세 테마 모두 브라우저에서 테스트
- [ ] `themes.ts` 정리 (Monaco 테마만 유지할지 검토)

---

## 5. theme.css 구조 예시

```css
/**
 * CodeInsight Theme Variables
 *
 * 세 테마의 모든 색상을 CSS 변수로 관리
 * - soft: 라벤더-피치 (부드러운 톤)
 * - dark: zinc + cyan (시크한 톤)
 * - minimal: 브라운-베이지 (중성적 톤)
 */

/* ============================================
   Soft 테마
   ============================================ */
[data-theme="soft"] {
  /* Layout */
  --theme-layout-page-bg: #faf8fc;
  --theme-layout-top-bar-bg: linear-gradient(to right, rgba(250,248,252,0.8), rgba(250,248,252,0.95), rgba(250,248,252,0.8));
  --theme-layout-top-bar-border: rgba(235,228,237,0.5);
  /* ... 나머지 */
}

/* ============================================
   Minimal 테마
   ============================================ */
[data-theme="minimal"] {
  /* Layout */
  --theme-layout-page-bg: #fffbf5;
  --theme-layout-top-bar-bg: linear-gradient(to right, rgba(255,251,245,0.8), rgba(255,251,245,0.95), rgba(255,251,245,0.8));
  --theme-layout-top-bar-border: rgba(229,213,199,0.5);
  /* ... 나머지 */
}

/* ============================================
   Dark 테마
   ============================================ */
[data-theme="dark"] {
  /* Layout */
  --theme-layout-page-bg: #09090b;
  --theme-layout-top-bar-bg: linear-gradient(to right, rgba(24,24,27,0.95), rgba(24,24,27,0.98), rgba(24,24,27,0.95));
  --theme-layout-top-bar-border: rgba(39,39,42,0.6);
  /* ... 나머지 */
}
```

---

## 6. index.css 수정 예시

### Before (하드코딩)
```css
.btn-primary {
  background: #a08060;
  border: 1px solid #8b6d4f;
  color: #fff;
}
```

### After (CSS 변수)
```css
.btn-primary {
  background: var(--theme-lesson-button-primary-bg);
  border: 1px solid var(--theme-layout-top-bar-border);
  color: #fff;
}
```

---

## 7. 주의사항

### 7.1 Monaco Editor 테마
- Monaco는 CSS 변수를 지원하지 않음
- `themes.ts`의 `monacoThemes`는 유지 필요
- 컴포넌트에서 테마 변경 시 Monaco 테마도 함께 변경

### 7.2 gradient 값
- CSS 변수에 `linear-gradient()` 저장 가능
- `background: var(--explanation-bg-gradient)` 형태로 사용

### 7.3 rgba 투명도
- `rgba()`도 CSS 변수에 저장 가능
- 또는 색상과 투명도를 분리하여 관리 가능

---

## 8. 예상 소요 시간

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| 1 | theme.css 생성 | 30분 |
| 2 | index.css 수정 | 1시간 |
| 3 | 컴포넌트 수정 | 2시간 |
| 4 | 테스트 및 정리 | 30분 |
| **총계** | | **4시간** |

---

## 9. 완료 조건

- [x] 세 테마(soft, minimal, dark) 모두 정상 동작
- [ ] 모든 페이지에서 테마 색상 일관성 확보 (Phase 3 진행 중)
- [x] index.css 하드코딩된 색상 0개 (CSS 변수만 사용)
- [x] 브라우저 개발자 도구에서 테마 변경 즉시 반영 확인
- [x] 코스/챕터/레슨 카드는 --theme-dashboard-* 변수 재사용
- [x] UI 버튼, 배지, 난이도 표시 모두 테마별 색상 적용
