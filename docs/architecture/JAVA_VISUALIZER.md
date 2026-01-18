# Java Visualizer Architecture

> **핵심 원칙**: Java는 메모리가 아니라 **객체 간 관계**를 시각화한다
>
> 마지막 업데이트: 2026-01-18

---

## 🎯 Java 시각화의 본질

### C vs Python vs Java

| 언어 | 핵심 질문 | 시각화 초점 | 비유 |
|------|----------|-------------|------|
| **C** | "데이터가 어디 있나?" | Stack/Heap 메모리 구조 | 🏭 공장 조립 라인 |
| **Python** | "누가 같은 객체를 보나?" | Names → Objects 참조 | 📝 메모 스티커 |
| **Java** | "어떤 메서드가 실행되나?" | 참조 + 다형성 | 🎮 리모컨 |

### Java 초보자가 헷갈리는 TOP 3

```
1위: 참조 타입 (Reference Types)
    Person b = a;  // ← 복사가 아니라 같은 객체!

2위: 다형성 (Polymorphism)
    Animal animal = new Dog();
    animal.sound();  // ← Dog.sound() 실행!

3위: 상속 (Inheritance)
    Dog 객체는 Animal 필드 + Dog 필드 모두 있음
```

**CodeInsight Java Viewer는 이 3가지에 집중합니다.**

---

## 🏗️ 2-탭 구조

### 1. Reference 탭 (참조 관계)

**목적**: "누가 어떤 객체를 가리키는가" 시각화

**비유**: 📝 **메모 스티커** (화이트보드에 붙인 메모지가 실제 객체를 가리킴)

```
┌────────────────────────────────────────┐
│ References (참조 관계)                 │
├────────────────────────────────────────┤
│ Variables (변수)    Objects (객체)     │
│                                         │
│ ┌──────┐           ┌───────────────┐  │
│ │ a    ├──┐        │ Person@1a2b   │  │
│ │ b    ├──┼───────►│ name: "Bob"   │  │
│ │      │  │        │ age: 25       │  │
│ └──────┘  │        └───────────────┘  │
│           │                            │
│           │        ┌───────────────┐  │
│ ┌──────┐ │        │ Person@3c4d   │  │
│ │ c    ├─┘───────►│ name: "Alice" │  │
│ │      │          │ age: 30       │  │
│ └──────┘          └───────────────┘  │
│                                        │
│ 💡 a와 b는 같은 객체를 가리킴!        │
└────────────────────────────────────────┘
```

**핵심 기능**:
- ✅ 변수 → 객체 화살표 (참조 관계)
- ✅ 같은 객체를 여러 변수가 가리킬 때 강조
- ✅ null 참조 표시 (끊어진 화살표)
- ✅ 객체 수정 시 연결된 모든 변수 하이라이트

---

### 2. Messages 탭 (메시지 전달)

**목적**: "객체 간 메시지 전달 + 다형성" 시각화

**비유**: 🎮 **리모컨** (변수는 리모컨, 객체는 TV/에어컨)

```
┌────────────────────────────────────────┐
│ Object Messages (객체 메시지)          │
├────────────────────────────────────────┤
│ Remote                  Device          │
│ ┌──────────┐           ┌──────────┐   │
│ │ animal   │           │   Dog    │   │
│ │ (Animal) ├──────────►│ sound()⭐│   │
│ └────┬─────┘           │ bark()  │   │
│      │                 └──────────┘   │
│      │ .sound() 버튼                  │
│      └──────────► "Woof!" (Dog 실행)  │
│                                        │
│ ┌──────────┐           ┌──────────┐   │
│ │ pet      │           │   Cat    │   │
│ │ (Animal) ├──────────►│ sound()⭐│   │
│ └────┬─────┘           │ meow()  │   │
│      │                 └──────────┘   │
│      │ .sound() 버튼                  │
│      └──────────► "Meow!" (Cat 실행)  │
│                                        │
│ 💡 같은 버튼, 다른 결과! (다형성)      │
└────────────────────────────────────────┘
```

**핵심 기능**:
- ✅ 메서드 호출 경로 표시 (어떤 메서드가 실행되는지)
- ✅ 다형성 강조 (선언 타입 vs 실제 객체)
- ✅ 메서드 오버라이드 표시
- ✅ 상속 계층 시각화 (Animal ← Dog, Cat)

---

## 🎨 비유 시각화 가이드

### 리모컨 비유 (Polymorphism)

```
Step 1: 선언
Animal animal;
┌──────────┐
│ animal   │ (빈 리모컨)
│ (Animal) │
└──────────┘

Step 2: Dog 연결
animal = new Dog();
┌──────────┐        ┌──────────┐
│ animal   ├───────►│   Dog    │
│ (Animal) │  🔵    │ sound()⭐│
└──────────┘        └──────────┘
   리모컨             실제 기기

Step 3: sound() 실행
┌──────────┐        ┌──────────┐
│ animal   ├───────►│   Dog    │
│ .sound() │  ⚡    │ "Woof!"⭐│
└──────────┘        └──────────┘
   버튼 누름         Dog 메서드!

Step 4: Cat으로 교체
animal = new Cat();
┌──────────┐        ┌──────────┐
│ animal   ├───────►│   Cat    │
│ (Animal) │  🟢    │ sound()⭐│
└──────────┘        └──────────┘
  같은 리모컨        다른 기기!
```

**애니메이션**:
- 연결 변경 → 색깔 변경 (Dog=🔵파랑, Cat=🟢초록)
- 메서드 호출 → ⚡ 번개 효과
- 실행 경로 → 화살표 굵게 + 하이라이트

---

### 메모 스티커 비유 (Reference)

```
Step 1: a = new Person("Bob");
Variables       Objects
┌───┐          ┌─────────┐
│ a ├─────────►│Person   │
└───┘          │ "Bob"   │
               └─────────┘

Step 2: b = a;
Variables       Objects
┌───┐          ┌─────────┐
│ a ├─────┐   │Person   │
│ b ├─────┘ └►│ "Bob"   │
└───┘          └─────────┘
    같은 객체!

Step 3: b.name = "Alice";
Variables       Objects
┌───┐          ┌─────────┐
│ a ├─────┐   │Person   │
│ b ├─────┘ └►│"Alice"⭐│
└───┘          └─────────┘
   둘 다 변경됨!
```

**애니메이션**:
- 변수 생성 → 선 그리기
- 객체 수정 → 객체 박스 깜빡임 (⭐)
- 참조 복사 → 선 복사 (화살표 2개)

---

## 🎨 색상 + 아이콘 시스템

| 요소 | 색상 | 아이콘 | 의미 |
|------|------|--------|------|
| **Dog 객체** | 🔵 파랑 | 🐶 | Animal 계열 |
| **Cat 객체** | 🟢 초록 | 🐱 | Animal 계열 |
| **리모컨 (변수)** | ⚫ 회색 | 🎮 | 선언 타입 |
| **메서드 호출** | 🟡 노랑 | ⚡ | 실행 중 |
| **참조 화살표** | 🟣 보라 | → | 연결 관계 |
| **null 참조** | 🔴 빨강 | ∅ | 연결 없음 |

---

## 📊 컴포넌트 구조

### 폴더 구조
```
features/visualizers/java/
├── index.tsx
├── JavaReferenceView.tsx      # Reference 탭
├── JavaMessagesView.tsx        # Messages 탭
├── components/
│   ├── VariableCard.tsx        # 변수 표시 (메모지)
│   ├── ObjectCard.tsx          # 객체 표시 (실제 물건)
│   ├── ReferenceArrow.tsx      # 참조 화살표
│   ├── RemoteControl.tsx       # 리모컨 UI
│   ├── DeviceCard.tsx          # 기기 카드 (Dog, Cat)
│   ├── MessageFlow.tsx         # 메시지 흐름
│   └── InheritanceTree.tsx     # 상속 계층 트리
├── hooks/
│   ├── usePolymorphism.ts      # 다형성 추적
│   └── useReferenceTracking.ts # 참조 추적
├── constants.ts                # 색상, 애니메이션
└── types.ts                    # TypeScript 타입
```

---

## 🔧 데이터 타입 정의

### JavaMemoryState (Reference 탭용)

```typescript
interface JavaMemoryState {
  variables: JavaVariable[];
  objects: JavaObject[];
  staticArea: StaticVariable[];  // static 변수
}

interface JavaVariable {
  name: string;               // "animal", "person"
  declaredType: string;       // "Animal", "Person"
  objectId: string | null;    // "@1a2b" 또는 null
  scope: 'local' | 'parameter' | 'field';
}

interface JavaObject {
  id: string;                 // "@1a2b"
  actualType: string;         // "Dog", "Cat"
  fields: JavaField[];
  methods: string[];          // ["sound", "bark"]
}

interface JavaField {
  name: string;
  type: string;
  value: any | string;        // primitive 값 또는 objectId
}
```

### JavaMessageEvent (Messages 탭용)

```typescript
interface JavaMessageEvent {
  type: 'call' | 'return' | 'create' | 'destroy';
  from: string;               // "main"
  to: string;                 // "animal.sound"
  declaredType: string;       // "Animal"
  actualType: string;         // "Dog"
  method: string;             // "sound"
  isOverridden: boolean;      // true (다형성 발생)
  returnValue?: any;
  timestamp: number;
}

interface PolymorphismInfo {
  variable: string;           // "animal"
  declaredType: string;       // "Animal"
  actualType: string;         // "Dog"
  methodCalled: string;       // "sound"
  executedIn: string;         // "Dog" (실제 실행된 클래스)
}
```

---

## 🆚 C/Python과의 차이점

| 측면 | C Viewer | Python Viewer | Java Viewer |
|------|----------|---------------|-------------|
| **탭 1 이름** | Memory | Names/Objects | **References** |
| **탭 1 초점** | Stack/Heap 구조 | 변수 → 객체 참조 | 변수 → 객체 + **타입 계층** |
| **탭 2 이름** | Flow | Flow | **Messages** |
| **탭 2 초점** | 함수 호출 스택 | 함수 호출 | **메시지 전달 + 다형성** |
| **핵심 비유** | 🏭 조립 라인 | 📝 메모 스티커 | 🎮 리모컨 |
| **특수 기능** | malloc/free | 가변/불변 객체 | **오버라이드 추적** |
| **색상 체계** | 파랑 (Stack/Heap) | 노랑 (Names) | 🔵파랑(Dog) 🟢초록(Cat) |

---

## 🎓 Java 커리큘럼 우선순위

### Phase 1: 참조 기초 (Lesson 1-3)

| Lesson | 주제 | Reference 탭 | Messages 탭 |
|--------|------|--------------|-------------|
| 1 | 객체 생성 | 변수 → 객체 화살표 | new 메시지 |
| 2 | 참조 복사 | 2개 변수 → 1개 객체 | - |
| 3 | null 참조 | 끊어진 화살표 | NullPointerException |

**착각 포인트**: `Person b = a;`는 복사가 아니라 같은 객체!

---

### Phase 2: 다형성 기초 (Lesson 4-6)

| Lesson | 주제 | Reference 탭 | Messages 탭 |
|--------|------|--------------|-------------|
| 4 | 업캐스팅 | Animal 변수 → Dog 객체 | - |
| 5 | 메서드 오버라이드 | - | Animal.sound() → Dog.sound() 실행 |
| 6 | 타입 변경 | 같은 변수, 다른 객체 (Dog → Cat) | 실행 경로 변경 |

**착각 포인트**: Animal 타입이지만 Dog 메서드 실행!

---

### Phase 3: 상속 + 인터페이스 (Lesson 7-9)

| Lesson | 주제 | Reference 탭 | Messages 탭 |
|--------|------|--------------|-------------|
| 7 | 상속 | Dog 객체 안에 Animal 필드 표시 | super.method() 호출 |
| 8 | 인터페이스 | 타입 계층 트리 | 인터페이스 메서드 실행 |
| 9 | 추상 클래스 | - | 추상 메서드는 실행 불가 표시 |

**착각 포인트**: Dog는 Dog 필드만 있는 게 아니다!

---

## 🎯 핵심 인사이트

### Insight 1: 메모리는 부차적
```
C: "메모리 어디 있어?" → Stack/Heap 중요
Java: "GC가 알아서 해줘" → 메모리 신경 안 씀

대신 집중:
- "a와 b가 같은 객체인가?" (참조)
- "어떤 메서드가 실행되나?" (다형성)
```

### Insight 2: 타입은 2개다
```
Person p = new Student();
       ↑           ↑
  선언 타입    실제 타입

선언 타입: 리모컨 버튼 (어떤 메서드 호출 가능)
실제 타입: 실제 기기 (어떤 메서드가 실행됨)

다형성 = 리모컨은 같지만 기기가 다름!
```

### Insight 3: 참조는 공유다
```
int[] a = {1, 2, 3};
int[] b = a;
b[0] = 99;  // a[0]도 99!

왜? → a와 b는 같은 배열을 가리킴
메모 스티커 2개, 실제 배열 1개
```

---

## ✅ 구현 체크리스트

### Phase 1: Reference 탭 (2주)
- [ ] JavaReferenceView 메인 컴포넌트
- [ ] VariableCard (변수 표시)
- [ ] ObjectCard (객체 표시)
- [ ] ReferenceArrow (SVG 화살표)
- [ ] null 참조 표시
- [ ] 같은 객체 → 여러 변수 하이라이트

### Phase 2: Messages 탭 (2주)
- [ ] JavaMessagesView 메인 컴포넌트
- [ ] RemoteControl (리모컨 UI)
- [ ] DeviceCard (Dog, Cat 카드)
- [ ] MessageFlow (메시지 흐름 애니메이션)
- [ ] 다형성 추적 (선언 vs 실제 타입)
- [ ] 메서드 오버라이드 표시

### Phase 3: 통합 (1주)
- [ ] LessonPage에 Java 분기 추가
- [ ] 테스트 레슨 3개 작성
- [ ] 색상/아이콘 시스템 적용
- [ ] 애니메이션 추가

---

## 📚 참고 문서

- `.claude/rules/arch/visualizer-structure.md` - 전체 Visualizer 아키텍처
- `docs/architecture/MEMORY_FLOW_VIEWER_ARCHITECTURE.md` - 메모리/Flow 전략
- Python Viewer: `features/visualizers/python/` - 참조 기반 시각화 참고
- C Viewer: `features/visualizers/c/` - 메모리 기반 시각화 대조

---

## 🎓 교육적 효과

### Before (메모리 중심 접근)
```
학생: "Stack에 뭐가 있고 Heap에 뭐가 있어요?"
→ Java는 GC가 관리 → 크게 중요하지 않음
```

### After (참조/다형성 중심 접근)
```
학생: "a와 b가 왜 같이 변해요?"
→ 같은 객체를 가리키기 때문! (메모 스티커 비유)

학생: "Animal 타입인데 왜 Dog 메서드가 실행돼요?"
→ 리모컨은 Animal이지만 기기는 Dog! (리모컨 비유)
```

**효과**: Java의 본질을 직관적으로 이해!

---

## 🚀 다음 단계

1. **JavaReferenceView 프로토타입** (1주)
   - 변수 → 객체 화살표 렌더링
   - 메모 스티커 비유 UI

2. **JavaMessagesView 프로토타입** (1주)
   - 리모컨 UI
   - 다형성 실행 경로 표시

3. **테스트 레슨** (3일)
   - Lesson 1: 참조 복사
   - Lesson 2: 다형성
   - Lesson 3: null 예외

---

## 변경 이력

- 2026-01-18: 초안 작성 (메모리 < 참조/다형성 중심 설계 확정)
