# Python 커리큘럼 계획

> 연구 기반 Python 10챕터 커리큘럼 설계
>
> **Part A (Ch 1-5): 실행 원리** - 코드가 어떻게 동작하는가
> **Part B (Ch 6-10): 설계 구조** - 코드를 어떻게 구조화하는가

## 연구 기반

| 출처 | 핵심 내용 |
|------|----------|
| Python Tutor (Philip Guo, SIGCSE 2013) | 10M+ 사용자, 시각화 기반 mental model 형성 |
| SIGCSE 2025 - Scope Rule Comprehension | Python scope 규칙 misconception 연구 |
| ICER 2025 - Teacher Misconceptions Survey | 16개 Python misconception, 교사 3-40% 오답률 |
| U of Toronto CSC110-111 | Python 메모리 모델 교육 방법론 |
| Making Sense of Python's Object Model | Name binding, 객체 그래프 시각화 |

## 핵심 Misconceptions

### 1. 변수와 객체 모델
| Misconception | 올바른 이해 |
|---------------|-------------|
| 변수는 "값을 담는 상자" | 변수는 객체를 가리키는 이름표(label) |
| `a = b`는 값을 복사 | 같은 객체를 가리키는 별칭(alias) 생성 |
| 모든 타입이 같은 방식으로 동작 | mutable vs immutable 구분 필수 |

### 2. Pass by Assignment
| Misconception | 올바른 이해 |
|---------------|-------------|
| Python은 call-by-value | Python은 pass-by-assignment |
| Python은 call-by-reference | 함수에 객체 참조가 할당됨 |
| 함수에서 수정하면 항상 원본 변경 | mutable만 변경됨, immutable은 새 객체 생성 |

### 3. Scope 규칙
| Misconception | 올바른 이해 |
|---------------|-------------|
| 함수 내 할당은 전역변수 수정 | local 변수 생성 (UnboundLocalError) |
| global 없이 전역 수정 가능 | mutable 객체만 수정 가능, 재할당 불가 |

### 4. Mutable Default Argument
```python
# 위험한 코드
def append_to(element, to=[]):
    to.append(element)
    return to
# 매 호출마다 같은 리스트 사용!
```

---

## 커리큘럼 구조 (10챕터, 40레슨)

### Part A: 실행 원리 (문법/메모리) - Ch 1-5
> 코드가 **어떻게 실행되는지** 이해하고 메모리에서 **무슨 일이 일어나는지** 시각화

#### Chapter 1: 변수와 객체 모델
> 핵심 질문: "변수는 상자인가, 이름표인가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-1-1 | 변수는 이름표다 | 변수 = 객체를 가리키는 참조 |
| py-1-2 | 객체의 세 가지 요소 | id, type, value |
| py-1-3 | 할당의 진짜 의미 | `=`는 이름을 객체에 바인딩 |
| py-1-4 | 여러 이름, 하나의 객체 | 동일 객체에 여러 변수 바인딩 |

#### Chapter 2: Mutable vs Immutable
> 핵심 질문: "왜 리스트는 바뀌고 문자열은 안 바뀌지?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-2-1 | Immutable 타입 | int, str, tuple은 변경 불가 |
| py-2-2 | Mutable 타입 | list, dict, set은 변경 가능 |
| py-2-3 | 재할당 vs 변경 | `x = x + 1` vs `x.append(1)` |
| py-2-4 | 문자열 연산의 비밀 | 새 객체 생성 vs 기존 객체 수정 |

#### Chapter 3: Aliasing과 복사
> 핵심 질문: "`a = b` 하면 뭐가 복사되는 거지?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-3-1 | Aliasing이란 | 같은 객체, 다른 이름 |
| py-3-2 | 리스트 aliasing의 함정 | 하나 바꾸면 둘 다 바뀜 |
| py-3-3 | 얕은 복사 | `list()`, `[:]`, `copy()` |
| py-3-4 | 깊은 복사 | `copy.deepcopy()` |

#### Chapter 4: 함수와 Pass-by-Assignment
> 핵심 질문: "함수에 넘기면 원본이 바뀌나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-4-1 | 함수 호출의 메커니즘 | 매개변수 = 인자 객체에 바인딩 |
| py-4-2 | Immutable 전달 | 원본 변경 불가, 새 객체 생성 |
| py-4-3 | Mutable 전달 | 원본 변경 가능 (같은 객체) |
| py-4-4 | Default argument 함정 | mutable default의 위험성 |

#### Chapter 5: Scope와 Namespace
> 핵심 질문: "왜 UnboundLocalError가 나지?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-5-1 | LEGB 규칙 | Local, Enclosing, Global, Built-in |
| py-5-2 | 지역 변수 생성 규칙 | 함수 내 할당 = 지역 변수 |
| py-5-3 | global 키워드 | 전역 변수 수정하기 |
| py-5-4 | nonlocal 키워드 | 클로저에서 외부 변수 수정 |

---

### Part B: 설계 구조 (OOP/패턴) - Ch 6-10
> 코드를 **어떻게 구조화하는지** 학습하고 객체지향 **설계 원리** 이해

#### Chapter 6: 클래스와 인스턴스
> 핵심 질문: "클래스는 메모리에 어떻게 존재하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-6-1 | 클래스 정의 | 클래스 = 객체를 만드는 틀 |
| py-6-2 | 인스턴스 생성 | `__init__`과 메모리 할당 |
| py-6-3 | 인스턴스의 메모리 구조 | `__dict__`와 속성 저장 |
| py-6-4 | 클래스도 객체다 | 클래스 자체의 id, type |

#### Chapter 7: self와 메서드
> 핵심 질문: "self는 왜 필요한가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-7-1 | self의 정체 | 인스턴스 자신을 가리키는 참조 |
| py-7-2 | 메서드 호출의 비밀 | `obj.method()` = `Class.method(obj)` |
| py-7-3 | 인스턴스 메서드 | self를 첫 번째 인자로 |
| py-7-4 | 클래스 메서드와 정적 메서드 | @classmethod, @staticmethod |

#### Chapter 8: 클래스 변수 vs 인스턴스 변수
> 핵심 질문: "클래스 변수를 수정하면 모든 인스턴스가 바뀌나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-8-1 | 클래스 변수 | 클래스에 속한 공유 변수 |
| py-8-2 | 인스턴스 변수 | 각 인스턴스 고유 변수 |
| py-8-3 | 이름 탐색 순서 | 인스턴스 → 클래스 → 부모 |
| py-8-4 | 클래스 변수 함정 | mutable 클래스 변수의 위험 |

#### Chapter 9: 상속과 메서드 탐색
> 핵심 질문: "super()는 어떻게 작동하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-9-1 | 상속 기본 | 부모 클래스의 속성/메서드 물려받기 |
| py-9-2 | 메서드 오버라이딩 | 부모 메서드 재정의 |
| py-9-3 | super()의 동작 | MRO와 다음 클래스 호출 |
| py-9-4 | 다중 상속과 MRO | Method Resolution Order |

#### Chapter 10: 특수 메서드
> 핵심 질문: "`__init__`, `__str__` 등은 언제 호출되나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| py-10-1 | 객체 생성 흐름 | `__new__` → `__init__` |
| py-10-2 | 문자열 표현 | `__str__`, `__repr__` |
| py-10-3 | 연산자 오버로딩 | `__add__`, `__eq__` 등 |
| py-10-4 | 컨테이너 프로토콜 | `__len__`, `__getitem__` |

---

## 시각화 설계

### Python 메모리 모델 시각화
```
┌─────────────────────────────────────────┐
│  Names (변수)     │  Objects (객체)      │
├─────────────────────────────────────────┤
│  a ──────────────→ [1, 2, 3]           │
│  b ──────────────↗  (id: 140...)       │
│                     type: list          │
│                                         │
│  x ──────────────→ 42                   │
│  y ──────────────→ 42 (같은 객체!)      │
│                     (id: 940...)        │
│                     type: int           │
└─────────────────────────────────────────┘
```

### OOP 시각화
```
┌─────────────────────────────────────────┐
│  Class: Dog                             │
│  ├── species = "Canis"  (클래스 변수)   │
│  └── bark() method                      │
├─────────────────────────────────────────┤
│  Instance: my_dog                       │
│  ├── __class__ ──→ Dog                 │
│  ├── name = "Buddy"  (인스턴스 변수)    │
│  └── age = 3                            │
└─────────────────────────────────────────┘
```

---

## 구현 계획

1. `curriculum.json` 생성 (10챕터 구조)
2. `py-1-1.json` ~ `py-10-4.json` (40레슨)
3. `seed.ts`에서 Python 로드
4. 프론트엔드 Python 시각화 컴포넌트

## 참고 자료

- https://pythontutor.com/
- https://realpython.com/python-pass-by-reference/
- https://www.cs.toronto.edu/~david/course-notes/csc110-111/
- https://www.geoffreybrown.com/blog/python-object-model/
