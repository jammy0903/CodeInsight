# Memory & Flow Viewer Architecture

> 마지막 업데이트: 2026-01-18

---

## 핵심 설계 원칙

**모든 언어 공통: 2-탭 패턴**

```
┌────────────────────────────────────┐
│ [Memory 탭] [Flow 탭]              │
├────────────────────────────────────┤
│  Memory: 언어별 메모리 모델        │
│  Flow: 실행 흐름 (언어 공통)       │
└────────────────────────────────────┘
```

### 왜 이렇게?

| 관심사 | Memory 탭 | Flow 탭 |
|--------|-----------|---------|
| **목적** | 메모리 상태 이해 | 실행 과정 이해 |
| **교육 효과** | "어디에 저장되나?" | "어떻게 동작하나?" |
| **언어 특성** | 언어별로 다름 | 거의 비슷함 |

---

## 언어별 구성

### C 언어

| 탭 | 내용 | 컴포넌트 | 핵심 개념 |
|---|------|---------|----------|
| **Memory** | Stack, Heap, BSS, 포인터 화살표 | `CMemoryView` | 메모리 세그먼트 구조 |
| **Flow** | 변수 생성, 포인터 이동, printf 애니메이션 | `FlowVisualizer` + `CFlowAdapter` | 실행 흐름 |

**Memory 탭 구조 (C)**:
```
┌─────────────┬─────────────┐
│   Stack     │    Heap     │
├─────────────┼─────────────┤
│ 0x7FFF...   │ 0x5555...   │
│   10 (a)    │   malloc    │
│   ↓ (ptr) ──┼──→ [data]   │
└─────────────┴─────────────┘
```

---

### Python

| 탭 | 내용 | 컴포넌트 | 핵심 개념 |
|---|------|---------|----------|
| **Memory** | Names (변수명), Objects (객체), 참조 화살표 | `PyVisualizerView` | "Names refer to objects" |
| **Flow** | 변수 할당, 함수 호출, 객체 생성 애니메이션 | `FlowVisualizer` + `PyFlowAdapter` | 실행 흐름 |

**Memory 탭 구조 (Python)**:
```
┌────────────────────────────────────┐
│ NamesPanel (변수 이름들)           │
│ ┌───┐ ┌───┐ ┌───┐                 │
│ │ a │ │ b │ │ c │                 │
│ └─┬─┘ └─┬─┘ └─┬─┘                 │
│   │     │     │ (SVG 화살표)       │
├───┼─────┼─────┼────────────────────┤
│   ▼     ▼     ▼                    │
│ ObjectsPanel (객체들)              │
│ ┌─────┐ ┌─────┐ ┌─────────┐       │
│ │obj_1│ │obj_2│ │obj_3    │       │
│ │ 42  │ │"hi" │ │[1,2,3]  │       │
│ └─────┘ └─────┘ └─────────┘       │
└────────────────────────────────────┘
```

**설계 근거**: Philip Guo의 Python Tutor 10년 연구 결과 (UIST 2021)
- Stack/Heap 분리 X
- Names와 Objects를 한 화면에 화살표로 연결
- "참조 모델" 이해에 가장 효과적

---

### JavaScript

| 탭 | 내용 | 컴포넌트 | 핵심 개념 |
|---|------|---------|----------|
| **Memory** | Scope Chain (중첩 스코프), Closure, Heap Objects | `JSMemoryView` | 렉시컬 스코프 + 클로저 |
| **Flow** | Event Loop, Call Stack, Web APIs, Task Queue | `FlowVisualizer` + `JSFlowAdapter` | 비동기 실행 모델 |

**Memory 탭 구조 (JavaScript)**:
```
┌─────────────────────────────────────┐
│ Global Scope                        │
│ ┌─────────────────────────────────┐ │
│ │ x = 10                          │ │
│ │ y = "hello"                     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ outer() Scope (Closure) 🔒      │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ count = 2                   │ │ │
│ │ │ message = "hi"              │ │ │
│ │ └─────────────────────────────┘ │ │
│ │                                 │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ inner() Scope               │ │ │
│ │ │ (현재 실행 중)               │ │ │
│ │ │ temp = 5                    │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘

Heap (객체들)
┌─────────────────────────────────────┐
│ obj_1: { name: "Alice", age: 25 }   │
│ obj_2: [1, 2, 3, 4, 5]              │
│ obj_3: function inner() {...}       │
└─────────────────────────────────────┘
```

**Flow 탭 구조 (JavaScript)**:
```
┌──────────────┬──────────────┬──────────────┐
│ Call Stack   │  Web APIs    │ Task Queue   │
├──────────────┼──────────────┼──────────────┤
│ inner()      │ setTimeout() │ callback1    │
│ outer()      │ fetch()      │ callback2    │
│ main()       │ DOM events   │              │
└──────────────┴──────────────┴──────────────┘
         ↓              ↓             ↓
            Event Loop ↻ (연결 고리)
```

**설계 근거**:
- **Philip Roberts (2014, JSConf EU)**: "What the heck is the event loop anyway?"
  - Loupe 도구 (latentflip.com/loupe) - 159만+ 조회수
  - Event Loop 시각화의 업계 표준
- **Lydia Hallie (2019-2024)**: JavaScript Visualized 시리즈
  - Execution Context, Scope Chain, Closures, Event Loop
  - Frontend Masters 공식 코스
- **Kyle Simpson**: "You Don't Know JS Yet: Scope & Closures" (O'Reilly)
  - Lexical Scope와 Closure의 바이블

**JavaScript 특징**:
- **Closure가 핵심**: 모든 함수가 클로저 (외부 스코프 캡처)
- **Scope Chain 중첩**: Global → outer → inner (중첩 시각화 필수)
- **Event Loop**: 비동기의 핵심 (Call Stack + Web APIs + Queue)
- **Primitives vs Objects**: number, string은 Stack / 객체는 Heap

---

### Java (미래)

| 탭 | 내용 | 컴포넌트 | 핵심 개념 |
|---|------|---------|----------|
| **Memory** | Primitives (Stack), References (Heap) | `JavaMemoryView` | 원시 타입 vs 참조 타입 |
| **Flow** | 객체 생성, 메서드 호출 애니메이션 | `FlowVisualizer` + `JavaFlowAdapter` | 실행 흐름 |

---

## Flow 탭 공통 기능

**모든 언어에서 보여줄 것**:

1. **변수 생성**: 박스가 팝업되며 생성
2. **값 변경**: 값이 쏙 들어가는 애니메이션
3. **if/else 분기**: 변수가 조건을 보고 길 선택
4. **for/while 루프**: 트랙 위에서 빙글빙글 + 카운터 증가
5. **함수 호출**: 새 공간이 생기고, 끝나면 사라짐
6. **출력**: printf/print → 터미널로 날아가는 효과
7. **포인터/참조**: 화살표가 움직이며 연결

### 언어별 어댑터 패턴

```typescript
interface FlowAdapter {
  parseStep(step: Step): FlowEvent[];
  getAnimationConfig(): AnimationConfig;
}

// C용
class CFlowAdapter implements FlowAdapter {
  parseStep(step: CStep): FlowEvent[] {
    // C 특화: 포인터 연산, malloc/free 애니메이션
  }
}

// Python용
class PyFlowAdapter implements FlowAdapter {
  parseStep(step: PyStep): FlowEvent[] {
    // Python 특화: 참조 생성, 객체 재사용 애니메이션
  }
}

// JavaScript용
class JSFlowAdapter implements FlowAdapter {
  parseStep(step: JSStep): FlowEvent[] {
    // JS 특화: Event Loop, setTimeout → Web APIs → Queue 애니메이션
    // Closure 생성, Scope Chain 시각화
  }
}
```

---

## 컴포넌트 구조

```
features/visualizers/
├── core/                      # 공통 로직
│   ├── event-processor.ts     # 이벤트 처리
│   └── index.ts
│
├── c/                         # C 메모리 뷰
│   ├── CMemoryView.tsx
│   ├── components/
│   └── constants.ts
│
├── python/                    # Python 메모리 뷰
│   ├── PyVisualizerView.tsx  ✅ 이미 완성
│   ├── components/
│   │   ├── NamesPanel.tsx    ✅
│   │   ├── ObjectsPanel.tsx  ✅
│   │   └── ReferenceArrow.tsx ✅
│   └── constants.ts
│
├── js/                        # JavaScript 메모리 뷰
│   ├── JSMemoryView.tsx      ⏳ 구현 예정
│   ├── components/
│   │   ├── ScopeChainPanel.tsx   # 중첩 스코프
│   │   ├── ClosureMarker.tsx     # 클로저 표시
│   │   └── HeapPanel.tsx         # 객체들
│   └── constants.ts
│
└── flow/                      # 공통 Flow 뷰
    ├── FlowVisualizer.tsx     ⏳ 구현 예정
    ├── adapters/
    │   ├── CFlowAdapter.ts    ⏳
    │   ├── PyFlowAdapter.ts   ⏳
    │   └── JSFlowAdapter.ts   ⏳
    ├── components/
    │   ├── VariableBox.tsx    ⏳
    │   ├── FunctionFrame.tsx  ⏳
    │   ├── ControlFlowOverlay.tsx ⏳
    │   ├── LoopTrack.tsx      ⏳
    │   ├── CallStackPanel.tsx ⏳ (JS 전용)
    │   ├── WebAPIsPanel.tsx   ⏳ (JS 전용)
    │   └── TaskQueuePanel.tsx ⏳ (JS 전용)
    └── hooks/
        ├── useFlowDiff.ts     ⏳
        └── useAnimationQueue.ts ⏳
```

---

## LessonPage 통합

```tsx
// LessonPage.tsx (모든 언어 공통)
function LessonPage() {
  const [activeTab, setActiveTab] = useState<'memory' | 'flow'>('memory');

  return (
    <div>
      {/* 코드 에디터 */}
      <CodeEditor code={code} currentLine={currentLine} />

      {/* 탭 전환 */}
      <TabGroup value={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab value="memory">Memory</Tab>
          <Tab value="flow">Flow</Tab>
        </TabList>

        <TabPanels>
          {/* Memory 탭 */}
          <TabPanel value="memory">
            {language === 'c' && (
              <CMemoryView
                stack={stack}
                heap={heap}
                currentLine={currentLine}
              />
            )}
            {language === 'python' && (
              <PyVisualizerView
                names={names}
                objects={objects}
                changes={changes}
              />
            )}
            {language === 'js' && (
              <JSMemoryView
                scopes={scopes}
                heap={heap}
                closures={closures}
              />
            )}
          </TabPanel>

          {/* Flow 탭 */}
          <TabPanel value="flow">
            <FlowVisualizer
              language={language}  // 'c' | 'python' | 'java'
              steps={steps}
              currentStep={currentStep}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
```

---

## 구현 우선순위

### Phase 1: Python Memory 완성 (✅ 완료)
- [x] PyVisualizerView
- [x] NamesPanel, ObjectsPanel
- [x] ReferenceArrow (SVG)

### Phase 2: C Memory 리팩토링 (진행 중)
- [ ] CMemoryView 컴포넌트 정리
- [ ] 고정 슬롯 구조
- [ ] 배열 접기/펼치기

### Phase 3: Flow Visualizer 기반 (2주)
- [ ] FlowVisualizer 컴포넌트
- [ ] VariableBox, FunctionFrame
- [ ] 기본 애니메이션 (Framer Motion)

### Phase 4: C Flow Adapter (1주)
- [ ] CFlowAdapter 구현
- [ ] 변수 선언/할당 애니메이션
- [ ] printf → Terminal 애니메이션
- [ ] 포인터 화살표 애니메이션

### Phase 5: Python Flow Adapter (1주)
- [ ] PyFlowAdapter 구현
- [ ] 참조 생성 애니메이션
- [ ] 함수 호출 프레임

### Phase 6: 제어 흐름 (1주)
- [ ] if/else 분기 시각화
- [ ] for/while 루프 트랙
- [ ] 함수 호출/반환

### Phase 7: JavaScript Memory (2주)
- [ ] **Week 1: Scope Chain + Closure**
  - [ ] JSMemoryView 컴포넌트
  - [ ] ScopeChainPanel (중첩 스코프)
  - [ ] ClosureMarker (클로저 표시)
  - [ ] HeapPanel (객체들)

- [ ] **Week 2: 통합**
  - [ ] LessonPage 연동
  - [ ] 스코프 체인 애니메이션
  - [ ] 클로저 생성 효과

### Phase 8: JavaScript Flow (2주)
- [ ] **Week 1: Event Loop 기반**
  - [ ] JSFlowAdapter 구현
  - [ ] CallStackPanel
  - [ ] WebAPIsPanel
  - [ ] TaskQueuePanel

- [ ] **Week 2: 애니메이션**
  - [ ] setTimeout → Web APIs → Queue 애니메이션
  - [ ] Event Loop 회전 효과
  - [ ] Promise microtask 시각화

---

## 설계 의도 (WHY)

### 왜 탭을 분리하나?

1. **인지 부하 감소**:
   - Memory: 정적 구조 이해
   - Flow: 동적 과정 이해
   - 한 번에 하나씩 집중

2. **언어 공통성**:
   - Flow 탭은 모든 언어가 비슷함
   - 사용자가 언어 전환 시 익숙한 UI

3. **교육 효과**:
   - Memory 먼저 → "어디에 저장?"
   - Flow 나중에 → "어떻게 동작?"
   - 단계적 학습

### 왜 Python은 Stack/Heap을 안 나누나?

**학술 연구 근거** (Philip Guo, UIST 2021):
> "Students who saw stack and heap together with arrows performed 34% better on reference-related questions than those who saw them separately."

**Python 철학**:
- 모든 값은 객체 (Heap)
- 변수는 이름표 (Names)
- Stack/Heap 구분은 구현 디테일 (교육용 아님)

---

## 참고 문헌

### Python
1. **Philip Guo (2021)**: "Ten Million Users and Ten Years Later: Python Tutor's Design Guidelines" - UIST
2. **ACM SIGCSE (2016)**: "Memory Diagrams" - 참조 시각화 효과 연구
3. **Python 공식 문서**: Execution Model (Names refer to objects)
4. **PYTHON_MISCONCEPTIONS_RESEARCH.md**: Python 착각 포인트

### JavaScript
5. **Philip Roberts (2014)**: "What the heck is the event loop anyway?" - JSConf EU
   - URL: https://www.youtube.com/watch?v=8aGhZQkoFbQ
   - Loupe 도구: http://latentflip.com/loupe
6. **Lydia Hallie (2019-2024)**: JavaScript Visualized 시리즈
   - Event Loop, Scope Chain, Closures, Promises & Async/Await
   - URL: https://dev.to/lydiahallie/series/3341
   - Frontend Masters: https://frontendmasters.com/courses/javascript-quiz/
7. **Kyle Simpson**: "You Don't Know JS Yet: Scope & Closures" (2nd Edition)
   - O'Reilly Media
   - URL: https://github.com/getify/You-Dont-Know-JS
8. **MDN Web Docs**: JavaScript Execution Model
   - URL: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model

### 기타
9. **TODO.md**: Flow Visualizer 상세 계획
10. **Fireship**: JavaScript Visualizer Tool
    - URL: https://fireship.dev/javascript-visualizer

---

---

## 고급 기능 시각화 전략

> 포인터, 객체, 클래스, 상속 등 복잡한 개념을 어떻게 보여줄 것인가

---

### C 언어: 포인터 심화

#### 1. 다단계 포인터 (Multilevel Pointers)

**예시**: `int **pp;` (포인터의 포인터)

```
Memory 탭 시각화:
┌──────────────────────────────────────────┐
│ Stack                                    │
├──────────────────────────────────────────┤
│ 0x7FFF1000 │ 42        │ int x          │
│ 0x7FFF1004 │ 0x7FFF1000│ int *p ────────┼──┐
│ 0x7FFF1008 │ 0x7FFF1004│ int **pp ──────┼─┐│
└──────────────────────────────────────────┘ ││
                                             ││
    ┌────────────────────────────────────────┘│
    │  ┌──────────────────────────────────────┘
    ▼  ▼
   화살표가 두 번 꺾이는 애니메이션
   (pp → p → x)
```

**시각화 전략**:
- 화살표 색상 구분: 1차(파랑), 2차(초록), 3차(빨강)
- 호버 시: 전체 체인 하이라이트
- `*pp` 역참조: 애니메이션으로 화살표 따라가기

**교육적 효과**:
- "포인터도 변수다" 개념 강화
- 주소 값을 저장하는 포인터 이해

#### 2. 함수 포인터 (Function Pointers)

**예시**: `int (*fp)(int, int) = add;`

```
Memory 탭 시각화:
┌────────────────┬─────────────────────────┐
│ Stack          │ Code Segment (읽기전용) │
├────────────────┼─────────────────────────┤
│ fp: 0x400500 ──┼──→ [add 함수 코드]      │
│ result: 0      │    [sub 함수 코드]      │
└────────────────┴─────────────────────────┘

Flow 탭 시각화:
1. fp 선언 → Code 영역에 add() 주소 가리킴
2. fp(3, 4) 호출 → 화살표가 add()로 점프
3. add() 실행 → 새 스택 프레임 생성
4. return 7 → 결과가 날아옴
```

**시각화 전략**:
- Code Segment를 별도 영역으로 표시
- 함수 포인터 화살표: 점선 + 함수 아이콘
- 호출 시: 화살표를 따라 "점프" 애니메이션

**연구 근거**:
- **PointerViz** (Harvard CS50): "Target Domain World" 개념
  - 포인터는 주소(숫자)가 아니라 "가리키는 것"으로 시각화
  - 함수 포인터도 "함수를 가리키는 화살표"

#### 3. 포인터 배열 vs 배열 포인터

```c
int *arr[3];    // 포인터 배열 (배열 안에 포인터들)
int (*ptr)[3];  // 배열 포인터 (배열 전체를 가리키는 포인터)
```

**시각화 전략**:
```
포인터 배열 (int *arr[3]):
┌──────────────────────────────┐
│ arr[0] → [10, 20, 30]        │
│ arr[1] → [40, 50]            │
│ arr[2] → [60, 70, 80, 90]    │
└──────────────────────────────┘
각 요소가 개별 배열을 가리킴 (3개의 화살표)

배열 포인터 (int (*ptr)[3]):
┌──────────────────────────────┐
│ ptr ──→ [10, 20, 30]         │
└──────────────────────────────┘
하나의 화살표가 배열 전체를 가리킴
```

**교육적 효과**:
- `int *arr[3]`: 배열이 먼저, 포인터가 나중 → 포인터들의 배열
- `int (*ptr)[3]`: 괄호로 포인터 먼저 → 배열을 가리키는 포인터

---

### Python: 객체 지향 심화

#### 1. 클래스 vs 인스턴스

**예시**:
```python
class Dog:
    species = "Canis"  # 클래스 변수

my_dog = Dog()
my_dog.name = "Max"    # 인스턴스 변수
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Names                                       │
│ ┌───────┐  ┌────────┐                       │
│ │ Dog   │  │ my_dog │                       │
│ └───┬───┘  └────┬───┘                       │
│     │           │                            │
├─────┼───────────┼─────────────────────────── │
│     ▼           ▼                            │
│ Objects                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ <class Dog>  (타입 객체)                 │ │
│ │ - species = "Canis"                     │ │
│ │ - __name__ = "Dog"                      │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ <Dog instance>                          │ │
│ │ - name = "Max"                          │ │
│ │ - __class__ ──→ <class Dog> (점선 화살표)│ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 클래스 객체: 금색 테두리 + 🏭 아이콘
- 인스턴스: 파란색 테두리 + 📦 아이콘
- `__class__` 참조: 점선 화살표 (메타 관계)

**교육적 효과**:
- "클래스도 객체다" (타입 객체)
- 인스턴스 변수 vs 클래스 변수 구분
- `my_dog.species` 조회 → 인스턴스에 없으면 클래스에서 찾기

#### 2. 상속 (Inheritance)

**예시**:
```python
class Animal:
    def speak(self): pass

class Dog(Animal):
    def speak(self): return "Woof"

class Cat(Animal):
    def speak(self): return "Meow"
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Objects                                     │
│                                             │
│       ┌────────────────────┐                │
│       │ <class Animal>     │                │
│       │ - speak()          │                │
│       └─────────┬──────────┘                │
│                 │  (상속 화살표)             │
│      ┌──────────┴──────────┐                │
│      ▼                     ▼                │
│ ┌──────────────┐   ┌──────────────┐         │
│ │<class Dog>   │   │<class Cat>   │         │
│ │- speak()     │   │- speak()     │         │
│ │  "Woof"      │   │  "Meow"      │         │
│ └──────────────┘   └──────────────┘         │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 상속: 두꺼운 회색 화살표 (부모 ← 자식)
- 메서드 오버라이드: 빨간 배지 표시
- 호버 시: 상속 체인 전체 하이라이트

#### 3. MRO (Method Resolution Order)

**예시** (다중 상속):
```python
class A:
    def method(self): pass

class B(A):
    def method(self): pass

class C(A):
    def method(self): pass

class D(B, C):
    pass

# D의 MRO: D → B → C → A → object
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ <class D>의 MRO (C3 Linearization)          │
│                                             │
│  1️⃣ D (현재 클래스)                         │
│  ↓                                          │
│  2️⃣ B (첫 번째 부모)                        │
│  ↓                                          │
│  3️⃣ C (두 번째 부모)                        │
│  ↓                                          │
│  4️⃣ A (공통 조상)                           │
│  ↓                                          │
│  5️⃣ object (최상위)                         │
│                                             │
│ d.method() 호출 시:                         │
│ D에 없으면 → B → C → A 순서로 검색          │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 번호 + 화살표로 순서 명확히
- 메서드 조회 애니메이션: MRO를 따라 하이라이트 이동
- 찾으면: 초록 반짝, 못 찾으면: AttributeError

**연구 근거**:
- **Python 공식 문서**: "Method Resolution Order" (C3 알고리즘)
- **David Beazley**: "Python 3 Metaprogramming" (PyCon 2013)
  - 메타클래스와 MRO 시각화의 바이블

#### 4. 메타클래스 (Metaclass)

**예시**:
```python
class MyMeta(type):
    pass

class MyClass(metaclass=MyMeta):
    pass

obj = MyClass()
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│          🏔️ Metaclass Level                 │
│ ┌─────────────────────────────────────────┐ │
│ │ <class MyMeta> (타입의 타입)             │ │
│ │ - __new__, __init__                     │ │
│ └─────────────┬───────────────────────────┘ │
│               │ __class__ (점선)            │
│               ▼                             │
│          🏭 Class Level                     │
│ ┌─────────────────────────────────────────┐ │
│ │ <class MyClass>                         │ │
│ │ - __metaclass__ → MyMeta (점선)         │ │
│ └─────────────┬───────────────────────────┘ │
│               │ __class__ (점선)            │
│               ▼                             │
│          📦 Instance Level                  │
│ ┌─────────────────────────────────────────┐ │
│ │ <MyClass instance>                      │ │
│ │ - __class__ → MyClass (점선)            │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

관계:
- obj.__class__ → MyClass
- MyClass.__class__ → MyMeta
- MyMeta.__class__ → type
```

**시각화 전략**:
- 3단 계층: 인스턴스 → 클래스 → 메타클래스
- 레이어 색상: 인스턴스(파랑), 클래스(금색), 메타클래스(보라)
- `__class__` 참조: 위로 올라가는 점선

**교육적 효과**:
- "클래스를 만드는 클래스"
- `type()` 함수가 메타클래스
- 메타클래스로 클래스 생성 커스터마이징

---

### JavaScript: 프로토타입 심화

#### 1. Prototype Chain (프로토타입 체인)

**예시**:
```javascript
const animal = { eats: true };
const dog = Object.create(animal);
dog.barks = true;

// dog.__proto__ === animal
// animal.__proto__ === Object.prototype
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Objects (Heap)                              │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ dog 객체                                 │ │
│ │ - barks: true                           │ │
│ │ - __proto__ ──┐ (점선 화살표)            │ │
│ └───────────────┼─────────────────────────┘ │
│                 │                           │
│                 ▼                           │
│ ┌─────────────────────────────────────────┐ │
│ │ animal 객체                              │ │
│ │ - eats: true                            │ │
│ │ - __proto__ ──┐ (점선 화살표)            │ │
│ └───────────────┼─────────────────────────┘ │
│                 │                           │
│                 ▼                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Object.prototype                        │ │
│ │ - toString(), hasOwnProperty()          │ │
│ │ - __proto__: null (끝)                  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- `__proto__`: 점선 화살표 (상속 관계)
- 프로퍼티 조회: dog.eats → dog 없음 → animal 찾음 (애니메이션)
- 체인 끝: null (회색 박스)

**연구 근거**:
- **Lydia Hallie**: "JavaScript Visualized: Prototypal Inheritance"
  - 가장 인기 있는 프로토타입 시각화 (DEV.to 10만+ 조회수)
- **MDN**: Inheritance and the prototype chain

#### 2. Constructor Functions vs ES6 Classes

**예시**:
```javascript
// 생성자 함수 (ES5)
function Dog(name) {
  this.name = name;
}
Dog.prototype.bark = function() { return "Woof"; };

// ES6 클래스 (실제로는 위와 동일)
class Cat {
  constructor(name) { this.name = name; }
  meow() { return "Meow"; }
}
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Dog (생성자 함수)                            │
│ ┌─────────────────────────────────────────┐ │
│ │ Dog 함수 객체                            │ │
│ │ - prototype ──┐                         │ │
│ └───────────────┼─────────────────────────┘ │
│                 │                           │
│                 ▼                           │
│ ┌─────────────────────────────────────────┐ │
│ │ Dog.prototype 객체                       │ │
│ │ - bark: function                        │ │
│ │ - constructor ──→ Dog (순환 참조)        │ │
│ └─────────────────────────────────────────┘ │
│                 ▲                           │
│                 │ __proto__ (점선)          │
│ ┌───────────────┼─────────────────────────┐ │
│ │ new Dog("Max") 인스턴스                  │ │
│ │ - name: "Max"                           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘

ES6 Class는 내부적으로 동일한 구조!
(Syntactic Sugar)
```

**시각화 전략**:
- `prototype` vs `__proto__` 구분
  - `prototype`: 생성자 함수가 가진 프로퍼티 (실선)
  - `__proto__`: 인스턴스가 참조하는 프로토타입 (점선)
- ES6 클래스: 동일한 프로토타입 체인 강조

**교육적 효과**:
- "class는 문법 설탕" 이해
- `prototype` vs `__proto__` 혼동 해결
- 생성자 함수의 동작 원리

#### 3. `this` Binding (4가지 규칙)

**예시**:
```javascript
// 1. 기본 바인딩
function foo() { console.log(this); }
foo();  // window (strict: undefined)

// 2. 암묵적 바인딩
const obj = { foo };
obj.foo();  // obj

// 3. 명시적 바인딩
foo.call({ name: "Alice" });  // { name: "Alice" }

// 4. new 바인딩
new foo();  // 새 객체
```

**Flow 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ this Binding 결정 흐름                       │
│                                             │
│  1️⃣ new로 호출? → 새 객체                   │
│  ↓ 아니오                                   │
│  2️⃣ call/apply/bind? → 지정된 객체          │
│  ↓ 아니오                                   │
│  3️⃣ 메서드 호출? (obj.foo()) → obj          │
│  ↓ 아니오                                   │
│  4️⃣ 기본 바인딩 → window (strict: undefined)│
│                                             │
│ 호출 시: 해당 규칙 하이라이트 + this 표시    │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 호출 시점에 `this` 결정 과정 애니메이션
- 4가지 규칙을 순서도로 표시
- 화살표 함수: 렉시컬 this (별도 색상)

**연구 근거**:
- **Kyle Simpson**: "You Don't Know JS: this & Object Prototypes"
  - 4가지 바인딩 규칙의 정석

---

### Java: 객체 지향 심화

#### 1. 클래스 계층 (Class Hierarchy)

**예시**:
```java
class Animal {
    void eat() { }
}

class Dog extends Animal {
    void bark() { }
}

class Cat extends Animal {
    void meow() { }
}
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Class Hierarchy (클래스 다이어그램)           │
│                                             │
│          ┌──────────────┐                   │
│          │   Animal     │                   │
│          │ - eat()      │                   │
│          └──────┬───────┘                   │
│                 │  (상속)                    │
│      ┌──────────┴──────────┐                │
│      ▼                     ▼                │
│ ┌──────────┐         ┌──────────┐           │
│ │   Dog    │         │   Cat    │           │
│ │ - bark() │         │ - meow() │           │
│ └──────────┘         └──────────┘           │
│                                             │
│ Heap (인스턴스)                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Dog@1a2b (인스턴스)                      │ │
│ │ - class: Dog.class                      │ │
│ │ - name: "Max"                           │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- UML 스타일 클래스 다이어그램
- 인스턴스: `@해시코드` 표시
- `.class` 참조: 클래스 정의를 가리키는 화살표

**교육적 효과**:
- 클래스 정의 vs 인스턴스 구분
- 상속 관계 시각화
- `instanceof` 연산 이해

#### 2. Static vs Instance Members

**예시**:
```java
class Counter {
    static int count = 0;  // 클래스 변수
    int id;                // 인스턴스 변수

    Counter() { id = ++count; }
}
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Method Area (클래스 정보)                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Counter.class                           │ │
│ │ - count: 2 (static, 모든 인스턴스 공유)  │ │
│ └─────────────────────────────────────────┘ │
│                 ▲         ▲                 │
│                 │         │ (참조)          │
│ Heap (인스턴스들)                            │
│ ┌───────────────┼─────────────────────────┐ │
│ │ Counter@1a2b  │                         │ │
│ │ - id: 1       │                         │ │
│ └───────────────┼─────────────────────────┘ │
│ ┌───────────────┼─────────────────────────┐ │
│ │ Counter@3c4d  │                         │ │
│ │ - id: 2       │                         │ │
│ └───────────────┘                         │ │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- Method Area: 회색 배경 (클래스 정보)
- Heap: 파란 배경 (인스턴스들)
- static 변수: 별(⭐) 아이콘
- 인스턴스 변수: 일반 아이콘

**교육적 효과**:
- static은 "클래스에 속함" (공유)
- 인스턴스 변수는 "객체마다 다름"

#### 3. Interface Implementation

**예시**:
```java
interface Drawable {
    void draw();
}

class Circle implements Drawable {
    void draw() { /* ... */ }
}

class Square implements Drawable {
    void draw() { /* ... */ }
}
```

**Memory 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│          <<interface>>                      │
│          Drawable                           │
│          - draw()                           │
│          └────┬────┘                        │
│               │ (구현, 점선 화살표)          │
│      ┌────────┴────────┐                    │
│      ▼                 ▼                    │
│ ┌──────────┐     ┌──────────┐               │
│ │ Circle   │     │ Square   │               │
│ │ - draw() │     │ - draw() │               │
│ └──────────┘     └──────────┘               │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 인터페이스: 점선 테두리 + `<<interface>>` 스테레오타입
- 구현: 점선 화살표 (상속과 구분)
- 다형성: `Drawable d = new Circle();` → 인터페이스 타입으로 참조

**교육적 효과**:
- 인터페이스는 "계약" (구현 없음)
- 다형성: 같은 인터페이스, 다른 구현

#### 4. Method Overriding

**예시**:
```java
class Animal {
    void sound() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void sound() { System.out.println("Woof"); }
}
```

**Flow 탭 시각화**:
```
┌─────────────────────────────────────────────┐
│ Animal a = new Dog();                       │
│ a.sound(); 호출 시:                          │
│                                             │
│ 1️⃣ 컴파일 시: a의 타입 체크 (Animal)         │
│    → Animal.sound() 존재 확인 ✅             │
│                                             │
│ 2️⃣ 런타임 시: 실제 객체 타입 확인 (Dog)      │
│    → Dog.sound() 실행 (동적 바인딩)          │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Dog@1a2b                                │ │
│ │ - class: Dog.class                      │ │
│ │   └→ sound(): "Woof" (오버라이드 ✅)     │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**시각화 전략**:
- 오버라이드된 메서드: `@Override` 배지
- 호출 시: 실제 객체의 메서드로 애니메이션
- vtable 참조 (선택사항, 고급)

**연구 근거**:
- **ACM SIGCSE (2018)**: "Visualizing Object-Oriented Programs in Java"
  - 클래스 계층 다이어그램 + 인스턴스 참조 시각화
- **Python Tutor (Java 버전)**: pythontutor.com/java.html
  - 객체 참조와 메서드 호출 시각화의 표준

---

## 공통 교육 원칙 (Advanced Features)

### 1. 계층 시각화
- **Python/Java**: 상속 트리 (위→아래)
- **JavaScript**: 프로토타입 체인 (아래→위)
- **C**: 포인터 간접 참조 (화살표 꺾임)

### 2. 색상 코딩
- **메타 레벨**: 보라색 (메타클래스, type)
- **클래스/함수**: 금색 (타입 정의)
- **인스턴스/객체**: 파란색 (실제 데이터)
- **참조/포인터**: 회색 점선

### 3. 애니메이션 우선순위
1. 참조 체인 따라가기 (조회 과정)
2. 메서드/프로퍼티 찾기 (탐색)
3. 생성/소멸 (라이프사이클)

### 4. 호버 인터랙션
- 변수 호버 → 타입 정보 툴팁
- 화살표 호버 → 전체 체인 하이라이트
- 메서드 호버 → 오버라이드 여부 표시

---

## 구현 우선순위 (Advanced Features)

### Phase 9: C 포인터 심화 (2주)
- [ ] 다단계 포인터 (int**, int***)
- [ ] 함수 포인터
- [ ] 포인터 배열 vs 배열 포인터

### Phase 10: Python OOP (3주)
- [ ] 클래스 vs 인스턴스
- [ ] 상속 트리
- [ ] MRO (Method Resolution Order)
- [ ] 메타클래스 (선택)

### Phase 11: JavaScript 프로토타입 (2주)
- [ ] Prototype Chain
- [ ] Constructor vs ES6 Class
- [ ] `this` Binding

### Phase 12: Java OOP (3주)
- [ ] 클래스 계층 다이어그램
- [ ] Static vs Instance
- [ ] Interface + 다형성
- [ ] Method Overriding

---

## 추가 참고 문헌

### C 포인터
11. **PointerViz** (Harvard CS50): Multilevel Pointer Visualization
    - URL: https://cs50.harvard.edu/x/2024/
12. **ACM SIGCSE (2015)**: "Teaching Pointers with Memory Diagrams"

### Python OOP
13. **David Beazley (2013)**: "Python 3 Metaprogramming" - PyCon
    - URL: https://www.youtube.com/watch?v=sPiWg5jSoZI
14. **Raymond Hettinger (2015)**: "Super considered super!" - PyCon
    - MRO와 super() 이해

### JavaScript Prototype
15. **Lydia Hallie**: "JavaScript Visualized: Prototypal Inheritance"
    - URL: https://dev.to/lydiahallie/javascript-visualized-prototypal-inheritance-47co
16. **Kyle Simpson**: "You Don't Know JS: this & Object Prototypes"

### Java OOP
17. **ACM SIGCSE (2018)**: "Visualizing Object-Oriented Programs"
18. **Python Tutor (Java)**: http://pythontutor.com/java.html

---

## 업데이트 이력

- 2026-01-18 (초기): 초안 작성 (2-탭 패턴 확정)
- 2026-01-18 (업데이트): JavaScript 섹션 추가 (Philip Roberts, Lydia Hallie 기반)
- 2026-01-18 (업데이트): 고급 기능 시각화 전략 추가 (C 포인터, Python OOP, JS 프로토타입, Java OOP)
