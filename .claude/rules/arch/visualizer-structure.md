# Visualizer Architecture (Memory & Flow)

> **필독**: 메모리/Flow 시각화 작업 전 반드시 읽기
> 마지막 업데이트: 2026-01-18

---

## 핵심 원칙

### 1. 2-탭 패턴 (모든 언어 공통)
```
┌────────────────────────────────────┐
│ [Memory 탭] [Flow 탭]              │
├────────────────────────────────────┤
│  Memory: 언어별 메모리 모델        │
│  Flow: 실행 흐름 (언어 공통)       │
└────────────────────────────────────┘
```

### 2. 폴더 구조 (확정)
```
features/visualizers/
├── c/              # C 언어 메모리 뷰
│   ├── CMemoryView.tsx
│   ├── components/
│   ├── hooks/
│   ├── constants.ts
│   └── index.tsx
│
├── python/         # Python 언어 메모리 뷰
│   ├── PyVisualizerView.tsx  ✅ 완성
│   ├── components/
│   │   ├── NamesPanel.tsx
│   │   ├── ObjectsPanel.tsx
│   │   └── ReferenceArrow.tsx
│   ├── constants.ts
│   ├── types.ts
│   └── index.ts
│
├── js/             # JavaScript 언어 메모리 뷰
│   ├── JSMemoryView.tsx      ⏳ 예정
│   └── components/
│       ├── ScopeChainPanel.tsx
│       ├── ClosureMarker.tsx
│       └── HeapPanel.tsx
│
├── flow/           # 공통 Flow 뷰 (모든 언어 공유)
│   ├── FlowVisualizer.tsx
│   ├── adapters/
│   │   ├── base/
│   │   │   └── FlowAdapter.ts    # 인터페이스
│   │   ├── c/
│   │   │   └── CFlowAdapter.ts
│   │   ├── py/
│   │   │   └── PyFlowAdapter.ts  ⏳
│   │   └── js/
│   │       └── JSFlowAdapter.ts  ⏳
│   ├── components/
│   │   ├── VariableBox.tsx
│   │   ├── FunctionFrame.tsx
│   │   ├── ControlFlowOverlay.tsx
│   │   └── LoopTrack.tsx
│   └── hooks/
│       ├── useFlowDiff.ts
│       └── useAnimationQueue.ts
│
├── core/           # 공통 로직
│   └── event-processor.ts
│
└── shared/         # 공통 컴포넌트
    └── components/
        └── ArrowOverlay.tsx
```

---

## 언어 ID 규칙

| 언어 | 폴더명 | language 값 | 컴포넌트명 | 표시 이름 |
|------|--------|-------------|-----------|----------|
| C | `c/` | `'c'` | `CMemoryView` | C |
| Python | `python/` | `'python'` | `PyVisualizerView` | Python |
| JavaScript | `js/` | `'js'` | `JSMemoryView` | JavaScript |
| Java (예정) | `java/` | `'java'` | `JavaMemoryView` | Java |

**중요**:
- 코드에서는 짧은 ID (`'c'`, `'python'`, `'js'`)
- 사용자에게는 긴 이름 표시 ("C", "Python", "JavaScript")

---

## 컴포넌트 명명 규칙

### Memory 뷰 컴포넌트
```typescript
// 메인 컴포넌트: {Language}MemoryView
CMemoryView.tsx         // C
PyVisualizerView.tsx    // Python (역사적 이름, 유지)
JSMemoryView.tsx        // JavaScript
JavaMemoryView.tsx      // Java

// 서브 컴포넌트: {Language}{Purpose}
CMemorySlot.tsx         // C 슬롯
NamesPanel.tsx          // Python 이름 패널 (언어명 생략 가능)
ScopeChainPanel.tsx     // JS 스코프 체인 (언어명 생략 가능)
```

### Flow 어댑터
```typescript
// 어댑터: {Language}FlowAdapter
flow/adapters/c/CFlowAdapter.ts
flow/adapters/py/PyFlowAdapter.ts
flow/adapters/js/JSFlowAdapter.ts
```

---

## 어댑터 패턴 (Flow 공통화)

### 인터페이스
```typescript
// flow/adapters/base/FlowAdapter.ts
interface FlowAdapter {
  parseStep(step: Step): FlowEvent[];
  getAnimationConfig(): AnimationConfig;
}
```

### 구현
```typescript
// flow/adapters/c/CFlowAdapter.ts
export class CFlowAdapter implements FlowAdapter {
  parseStep(step: CStep): FlowEvent[] {
    // C 특화 로직 (포인터, malloc/free 등)
  }

  getAnimationConfig(): AnimationConfig {
    // C 특화 애니메이션 설정
  }
}
```

### 사용
```typescript
// LessonPage.tsx
<FlowVisualizer
  language="c"     // 자동으로 CFlowAdapter 사용
  steps={steps}
/>
```

---

## LessonPage 통합 패턴

```typescript
function LessonPage() {
  const [activeTab, setActiveTab] = useState<'memory' | 'flow'>('memory');

  return (
    <TabGroup value={activeTab} onChange={setActiveTab}>
      <TabList>
        <Tab value="memory">Memory</Tab>
        <Tab value="flow">Flow</Tab>
      </TabList>

      <TabPanels>
        {/* Memory 탭 - 언어별 분기 */}
        <TabPanel value="memory">
          {language === 'c' && <CMemoryView {...} />}
          {language === 'python' && <PyVisualizerView {...} />}
          {language === 'js' && <JSMemoryView {...} />}
        </TabPanel>

        {/* Flow 탭 - 공통 컴포넌트 */}
        <TabPanel value="flow">
          <FlowVisualizer language={language} steps={steps} />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
```

---

## 새 언어 추가 체크리스트

### Step 1: Memory 뷰 (2주)
- [ ] `visualizers/{lang}/` 폴더 생성
- [ ] `{Lang}MemoryView.tsx` 메인 컴포넌트
- [ ] `components/` 서브 컴포넌트들
- [ ] `constants.ts` 색상, 애니메이션 설정
- [ ] `types.ts` (필요시)
- [ ] `index.tsx` export

### Step 2: Flow 어댑터 (1주)
- [ ] `flow/adapters/{lang}/` 폴더 생성
- [ ] `{Lang}FlowAdapter.ts` 구현
- [ ] `FlowAdapter` 인터페이스 준수
- [ ] `parseStep()` 구현
- [ ] `getAnimationConfig()` 구현

### Step 3: 통합 (1주)
- [ ] LessonPage에 분기 추가
- [ ] 라우팅 업데이트
- [ ] 타입 정의 추가
- [ ] 테스트

---

## 금지 사항

### ❌ 하지 말 것
1. **Memory 뷰 재사용 금지**: 각 언어는 독립적인 Memory 뷰 필요
   - C는 Stack/Heap, Python은 Names/Objects, JS는 Scope Chain

2. **Flow를 언어별로 복제 금지**: Flow는 어댑터로만 확장
   - ❌ `CFlowVisualizer`, `PyFlowVisualizer` (X)
   - ✅ `FlowVisualizer` + `CFlowAdapter`, `PyFlowAdapter` (O)

3. **언어 ID 변경 금지**:
   - `'c'`, `'python'`, `'js'` 확정됨
   - 변경 시 DB, API, 라우팅 모두 수정 필요

4. **폴더명 불일치 금지**:
   - 폴더: `js/`, 코드: `'javascript'` (X)
   - 통일: `js/`, `'js'` (O)

### ✅ 해야 할 것
1. **공통 로직은 `shared/`로**: 화살표, 툴팁, 하이라이트 등
2. **언어 특화는 각 폴더에**: C 포인터, Python 참조, JS 클로저
3. **Flow는 어댑터로만**: 새 언어 = 새 어댑터만 추가

---

## 참고 문서

1. **`docs/plans/MEMORY_FLOW_VIEWER_ARCHITECTURE.md`**
   - 전체 아키텍처 설계
   - 언어별 시각화 전략
   - 고급 기능 (포인터, OOP, 프로토타입)

2. **`.claude/rules/arch/file-structure.md`**
   - 전체 프로젝트 파일 구조

3. **`.claude/rules/arch/patterns.md`**
   - 아키텍처 패턴 (어댑터, 레지스트리 등)

---

## 변경 이력

- 2026-01-18: 초안 작성 (Python 완성, C/JS 계획 확정)
