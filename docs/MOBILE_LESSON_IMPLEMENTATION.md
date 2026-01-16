# 레슨 페이지 구현 계획 (모바일)

> 마지막 업데이트: 2026-01-16

## 변경 범위

| 화면 | 변경 |
|------|------|
| **데스크톱** | ❌ 변경 없음 |
| **모바일** | ✅ 신규 컴포넌트 추가 |

---

## 파일 구조

```
features/courses/components/
├── mobile/
│   ├── index.ts                    # exports
│   ├── MobileLessonView.tsx        # 모바일 메인 레이아웃
│   ├── MobileStepControls.tsx      # 스텝 컨트롤 + 페이지 인디케이터
│   ├── CollapsibleExplanation.tsx  # 접히는 설명
│   ├── CodeWithOutput.tsx          # 코드 + 출력 토글
│   ├── MobileAIChatFAB.tsx         # FAB 버튼
│   └── MobileAIChatModal.tsx       # AI 오버레이 모달
│
├── quiz/
│   └── MobileQuizView.tsx          # (신규) 전체화면 퀴즈
│
└── python/
    └── FlowViewer.tsx              # (기존) Python 플로우
```

---

## 컴포넌트 설계

### 1. MobileAIChatFAB (신규)

```typescript
interface MobileAIChatFABProps {
  onClick: () => void;
  isOpen: boolean;
}

// - 우측 하단 고정 (position: fixed)
// - isOpen이면 ✕ 아이콘, 아니면 💬 아이콘
// - 펄스 애니메이션 (첫 방문)
```

### 2. MobileAIChatModal (신규)

```typescript
interface MobileAIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: {
    lessonId: string;
    code: string;
    currentLine?: number;
    topic?: string;
  };
}

// - 전체화면 오버레이 (90% x 80%)
// - backdrop-blur 배경
// - ChatQA 재사용
```

### 3. MobileLessonView (신규)

```typescript
interface MobileLessonViewProps {
  code: string;
  steps: LessonStep[];
  currentStepIndex: number;
  languageId: string;
  lessonId: string;
  visualizationType: 'memory' | 'flow';
  memoryState?: MemoryState;
  onStepChange: (index: number) => void;
  onQuizStart: () => void;
}
```

### 4. CollapsibleExplanation (신규)

```typescript
interface CollapsibleExplanationProps {
  explanation: string;
  line: number;
  defaultCollapsed?: boolean;  // 기본 true
}
```

### 5. CodeWithOutput (신규)

```typescript
interface CodeWithOutputProps {
  code: string;
  language: string;
  currentLine: number;
  output?: string;
  showOutput?: boolean;
  onToggleOutput?: () => void;
}
```

### 6. MobileStepControls (신규)

```typescript
interface MobileStepControlsProps {
  currentStep: number;
  totalSteps: number;
  currentPage: number;       // 0 또는 1
  onPrevStep: () => void;
  onNextStep: () => void;
  onPageChange: (page: number) => void;
  onQuizStart: () => void;
  isLastStep: boolean;
}
```

---

## 함수 콜체인

### LessonPage.tsx (진입점)

```
LessonPage
├── useIsMobile()
├── useLessonData(lessonId)
├── useLessonNavigation()
├── useLessonVisualization()
│
├── if (isMobile)
│   └── <MobileLessonView />
│       ├── useState(currentPage)      // 0: 코드, 1: 시각화
│       ├── useState(isAIChatOpen)
│       │
│       ├── <CollapsibleExplanation />
│       │
│       ├── Page 0: <CodeWithOutput />
│       │   └── <CodeViewer />
│       │
│       ├── Page 1: 시각화
│       │   ├── <MemoryPanel /> (C/JS)
│       │   └── <FlowViewer /> (Python)
│       │
│       ├── <MobileStepControls />
│       │   └── 페이지 인디케이터 (●○)
│       │
│       ├── <MobileAIChatFAB />
│       └── <MobileAIChatModal />
│           └── <ChatQA />
│
└── else (Desktop)
    └── 기존 코드 그대로 유지
```

---

## 구현 순서

### Phase 1: 모바일 AI Chat (Day 1)

```
1. MobileAIChatFAB.tsx
   - FAB 버튼 UI
   - fixed positioning
   - 아이콘 토글 (💬 ↔ ✕)

2. MobileAIChatModal.tsx
   - 오버레이 모달
   - backdrop-blur 배경
   - ChatQA 래핑
   - 닫기: ✕, FAB, 배경 클릭
```

### Phase 2: 모바일 기본 컴포넌트 (Day 2)

```
3. CollapsibleExplanation.tsx
   - 기본 접힘
   - 애니메이션 펼침/접힘
   - 라인 번호 배지

4. CodeWithOutput.tsx
   - CodeViewer 래핑
   - 출력 토글 버튼
   - 출력 없으면 숨김

5. MobileStepControls.tsx
   - 이전/다음 버튼
   - 스텝 카운터 (3/8)
   - 페이지 인디케이터 (●○)
   - 퀴즈 버튼 (마지막 스텝)
```

### Phase 3: MobileLessonView (Day 3)

```
6. MobileLessonView.tsx
   - 페이지 상태 관리
   - 스와이프 제스처 (framer-motion)
   - 페이지 0: 코드
   - 페이지 1: 시각화
   - AI Chat 상태 관리

7. LessonPage.tsx 수정
   - useIsMobile() 분기
   - 모바일: <MobileLessonView />
   - 데스크톱: 기존 코드 유지
```

### Phase 4: 퀴즈 + 테스트 (Day 4)

```
8. MobileQuizView.tsx
   - 전체화면 퀴즈
   - 터치 친화적 선택지 (48px+)
   - 결과 애니메이션

9. 테스트
   - C 레슨 (모바일)
   - Python 레슨 (모바일)
   - JavaScript 레슨 (모바일)
   - AI Chat 동작
   - 퀴즈 플로우
```

---

## 예상 코드량

| 파일 | 라인 | 난이도 |
|------|------|--------|
| MobileAIChatFAB.tsx | 50 | 쉬움 |
| MobileAIChatModal.tsx | 100 | 중간 |
| CollapsibleExplanation.tsx | 50 | 쉬움 |
| CodeWithOutput.tsx | 60 | 쉬움 |
| MobileStepControls.tsx | 80 | 쉬움 |
| MobileLessonView.tsx | 200 | 중간 |
| MobileQuizView.tsx | 100 | 중간 |
| LessonPage.tsx 수정 | 30 | 쉬움 |
| **총계** | **670** | |

---

## 주의사항

### 스와이프 vs 버튼 충돌 방지

```typescript
// 스와이프: 페이지 전환
// 버튼: 스텝 이동
// 충돌 없음 (다른 동작)

const handleDragEnd = (event, info) => {
  if (Math.abs(info.offset.x) > 50) {
    // 페이지 전환만
    setCurrentPage(prev => info.offset.x > 0 ? 0 : 1);
  }
};
```

### 모바일 키보드 대응

```typescript
// AI Chat 입력창 포커스 시 FAB 위치 조정
useEffect(() => {
  const handleResize = () => {
    if (window.visualViewport) {
      const keyboardHeight = window.innerHeight - window.visualViewport.height;
      setFabBottom(keyboardHeight + 16);
    }
  };
  window.visualViewport?.addEventListener('resize', handleResize);
  return () => window.visualViewport?.removeEventListener('resize', handleResize);
}, []);
```

### 성능

```typescript
// 비활성 페이지 렌더링 최소화
{currentPage === 0 && <CodeWithOutput ... />}
{currentPage === 1 && <MemoryPanel ... />}
```

---

## 체크리스트

### Phase 1: 모바일 AI Chat
- [ ] MobileAIChatFAB.tsx
- [ ] MobileAIChatModal.tsx

### Phase 2: 기본 컴포넌트
- [ ] CollapsibleExplanation.tsx
- [ ] CodeWithOutput.tsx
- [ ] MobileStepControls.tsx

### Phase 3: 통합
- [ ] MobileLessonView.tsx
- [ ] LessonPage.tsx 모바일 분기

### Phase 4: 퀴즈 + 테스트
- [ ] MobileQuizView.tsx
- [ ] 테스트: C/Python/JS 레슨
- [ ] 테스트: AI Chat
- [ ] 테스트: 퀴즈
