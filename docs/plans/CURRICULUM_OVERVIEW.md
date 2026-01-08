# CodeInsight 커리큘럼 마스터 플랜

> 4개 언어 × 2개 파트 (문법 + 설계) 구조

---

## 전체 구조 요약

| 언어 | Part A: 문법/실행 | Part B: 설계/구조 | 총 레슨 |
|------|------------------|------------------|---------|
| **C** | Ch 1-3 (12 레슨) | Ch 4-6 (18 레슨) | 30 |
| **Python** | Ch 1-5 (20 레슨) | Ch 6-10 (20 레슨) | 40 |
| **JavaScript** | Ch 1-5 (20 레슨) | Ch 6-10 (20 레슨) | 40 |
| **Java** | Ch 1-5 (20 레슨) | Ch 6-10 (20 레슨) | 40 |

**총합: 36 챕터, 150 레슨**

---

## Part A vs Part B 정의

### Part A: 문법과 실행 원리 (How it runs)
- 코드가 **어떻게 실행되는지** 이해
- 메모리에서 **무슨 일이 일어나는지** 시각화
- 변수, 함수 호출, 메모리 할당의 **동작 원리**
- 흔한 **착각(misconception)** 교정

### Part B: 설계와 구조 (How to design)
- 코드를 **어떻게 구조화하는지** 학습
- 객체지향, 모듈화, 패턴의 **설계 원리**
- 재사용, 확장, 유지보수를 위한 **구조**
- 언어별 **관용구(idiom)** 이해

---

## C 언어 (6챕터, 30레슨)

### Part A: 문법과 실행 원리 (Ch 1-3)

#### Chapter 1: 변수와 메모리 (4 레슨)
> "변수는 메모리 어디에 있나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-1-1 | 변수 선언과 메모리 | 변수 = 메모리에 이름 붙인 공간 |
| c-1-2 | 타입과 크기 | sizeof, 메모리 레이아웃 |
| c-1-3 | 주소 연산자 & | 변수의 메모리 주소 얻기 |
| c-1-4 | 스코프와 수명 | 지역변수의 생성과 소멸 |

#### Chapter 2: 포인터 기초 (5 레슨)
> "포인터는 특별한 게 아니라 그냥 주소를 담는 변수"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-2-1 | 포인터 선언 | int *p = 주소를 담는 변수 |
| c-2-2 | 역참조 연산자 * | *p = p가 가리키는 곳의 값 |
| c-2-3 | 포인터와 배열 | arr[i] == *(arr + i) |
| c-2-4 | 포인터 연산 | p++는 sizeof(타입)만큼 이동 |
| c-2-5 | NULL 포인터 | 아무것도 가리키지 않음 |

#### Chapter 3: 함수와 인자 전달 (3 레슨)
> "C는 항상 값을 복사해서 전달한다"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-3-1 | Call by Value | 값 복사, 원본 불변 |
| c-3-2 | 포인터로 원본 수정 | 주소 전달로 간접 접근 |
| c-3-3 | 배열 전달의 비밀 | 배열은 첫 주소가 전달됨 |

---

### Part B: 설계와 구조 (Ch 4-6)

#### Chapter 4: 메모리 영역 (5 레슨)
> "Stack vs Heap, 언제 뭘 써야 하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-4-1 | Stack 영역 | 자동 할당/해제, 빠름 |
| c-4-2 | Heap 영역 | 수동 관리, 유연함 |
| c-4-3 | malloc과 free | 동적 메모리 할당 |
| c-4-4 | 메모리 누수 | free 안 하면 누수 |
| c-4-5 | Dangling Pointer | free 후 접근 위험 |

#### Chapter 5: 이중 포인터와 구조체 (4 레슨)
> "포인터의 포인터, 복합 데이터"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-5-1 | 이중 포인터 ** | 포인터를 가리키는 포인터 |
| c-5-2 | 함수에서 포인터 수정 | 이중 포인터가 필요한 이유 |
| c-5-3 | 구조체 정의 | 관련 데이터 묶기 |
| c-5-4 | 구조체 포인터 | p->x == (*p).x |

#### Chapter 6: 실전 패턴 (4 레슨)
> "C 프로그래머처럼 생각하기"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| c-6-1 | 동적 배열 | 크기가 변하는 배열 구현 |
| c-6-2 | 연결 리스트 기초 | 노드와 포인터 체인 |
| c-6-3 | 파일 읽기 패턴 | fopen, fread, fclose |
| c-6-4 | 에러 처리 패턴 | 반환값 검사, goto cleanup |

---

## Python (10챕터, 40레슨)

### Part A: 실행 원리 (Ch 1-5)

#### Chapter 1: 변수와 객체 모델 (4 레슨)
> "변수는 상자가 아니라 이름표다"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-1-1 | 변수는 이름표다 | 변수 = 객체를 가리키는 참조 |
| py-1-2 | 객체의 세 가지 요소 | id, type, value |
| py-1-3 | 할당의 진짜 의미 | = 는 이름을 객체에 바인딩 |
| py-1-4 | 여러 이름, 하나의 객체 | 동일 객체에 여러 변수 |

#### Chapter 2: Mutable vs Immutable (4 레슨)
> "왜 리스트는 바뀌고 문자열은 안 바뀌지?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-2-1 | Immutable 타입 | int, str, tuple |
| py-2-2 | Mutable 타입 | list, dict, set |
| py-2-3 | 재할당 vs 변경 | x = x + 1 vs x.append(1) |
| py-2-4 | 문자열 연산의 비밀 | 새 객체 생성 |

#### Chapter 3: Aliasing과 복사 (4 레슨)
> "a = b 하면 뭐가 복사되는 거지?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-3-1 | Aliasing이란 | 같은 객체, 다른 이름 |
| py-3-2 | 리스트 aliasing 함정 | 하나 바꾸면 둘 다 바뀜 |
| py-3-3 | 얕은 복사 | list(), [:], copy() |
| py-3-4 | 깊은 복사 | copy.deepcopy() |

#### Chapter 4: 함수와 Pass-by-Assignment (4 레슨)
> "함수에 넘기면 원본이 바뀌나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-4-1 | 함수 호출의 메커니즘 | 매개변수 = 인자 객체에 바인딩 |
| py-4-2 | Immutable 전달 | 원본 변경 불가 |
| py-4-3 | Mutable 전달 | 원본 변경 가능 |
| py-4-4 | Default argument 함정 | mutable default 위험 |

#### Chapter 5: Scope와 Namespace (4 레슨)
> "왜 UnboundLocalError가 나지?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-5-1 | LEGB 규칙 | Local, Enclosing, Global, Built-in |
| py-5-2 | 지역 변수 생성 규칙 | 함수 내 할당 = 지역 변수 |
| py-5-3 | global 키워드 | 전역 변수 수정하기 |
| py-5-4 | nonlocal 키워드 | 클로저에서 외부 변수 수정 |

---

### Part B: 설계 구조 (Ch 6-10)

#### Chapter 6: 클래스와 인스턴스 (4 레슨)
> "클래스는 메모리에 어떻게 존재하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-6-1 | 클래스 정의 | 클래스 = 객체를 만드는 틀 |
| py-6-2 | 인스턴스 생성 | __init__과 메모리 할당 |
| py-6-3 | 인스턴스의 메모리 구조 | __dict__와 속성 저장 |
| py-6-4 | 클래스도 객체다 | 클래스 자체의 id, type |

#### Chapter 7: self와 메서드 (4 레슨)
> "self는 왜 필요한가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-7-1 | self의 정체 | 인스턴스 자신을 가리키는 참조 |
| py-7-2 | 메서드 호출의 비밀 | obj.method() = Class.method(obj) |
| py-7-3 | 인스턴스 메서드 | self를 첫 번째 인자로 |
| py-7-4 | 클래스/정적 메서드 | @classmethod, @staticmethod |

#### Chapter 8: 클래스 변수 vs 인스턴스 변수 (4 레슨)
> "클래스 변수 수정하면 모든 인스턴스가 바뀌나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-8-1 | 클래스 변수 | 클래스에 속한 공유 변수 |
| py-8-2 | 인스턴스 변수 | 각 인스턴스 고유 |
| py-8-3 | 이름 탐색 순서 | 인스턴스 → 클래스 → 부모 |
| py-8-4 | 클래스 변수 함정 | mutable 클래스 변수 위험 |

#### Chapter 9: 상속과 메서드 탐색 (4 레슨)
> "super()는 어떻게 작동하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-9-1 | 상속 기본 | 부모 속성/메서드 물려받기 |
| py-9-2 | 메서드 오버라이딩 | 부모 메서드 재정의 |
| py-9-3 | super()의 동작 | MRO와 다음 클래스 호출 |
| py-9-4 | 다중 상속과 MRO | Method Resolution Order |

#### Chapter 10: 특수 메서드 (4 레슨)
> "__init__, __str__ 등은 언제 호출되나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| py-10-1 | 객체 생성 흐름 | __new__ → __init__ |
| py-10-2 | 문자열 표현 | __str__, __repr__ |
| py-10-3 | 연산자 오버로딩 | __add__, __eq__ 등 |
| py-10-4 | 컨테이너 프로토콜 | __len__, __getitem__ |

---

## JavaScript (10챕터, 40레슨)

### Part A: 언어 기초 (Ch 1-5)

#### Chapter 1: 변수와 스코프 (4 레슨)
> "var, let, const는 어떻게 다르게 동작하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-1-1 | var의 함수 스코프 | var는 함수 스코프, 블록 무시 |
| js-1-2 | let/const의 블록 스코프 | 블록({})마다 새 스코프 |
| js-1-3 | Hoisting의 진실 | 선언만 호이스팅, 초기화는 제자리 |
| js-1-4 | TDZ | let/const 선언 전 접근 금지 |

#### Chapter 2: 타입과 강제 변환 (4 레슨)
> "왜 '5' + 3은 '53'이고 '5' - 3은 2인가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-2-1 | JavaScript 타입 시스템 | 7가지 원시 타입 + Object |
| js-2-2 | 암묵적 타입 변환 | 연산자별 변환 규칙 |
| js-2-3 | == vs === | 느슨한 비교 vs 엄격한 비교 |
| js-2-4 | Truthy와 Falsy | Boolean 컨텍스트 변환 |

#### Chapter 3: 함수와 실행 컨텍스트 (4 레슨)
> "함수는 어떻게 실행되고 메모리에 존재하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-3-1 | 함수 선언 vs 표현식 | 호이스팅 차이, 익명 함수 |
| js-3-2 | 실행 컨텍스트 | Variable/Lexical Environment |
| js-3-3 | Call Stack | 함수 호출과 스택 프레임 |
| js-3-4 | 스코프 체인 | 외부 환경 참조, 변수 탐색 |

#### Chapter 4: this 키워드 (4 레슨)
> "this는 왜 때마다 다른 것을 가리키나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-4-1 | this 바인딩 4가지 규칙 | default, implicit, explicit, new |
| js-4-2 | 메서드와 this | 객체.메서드()에서의 this |
| js-4-3 | 콜백에서 this 잃어버리기 | setTimeout 문제 |
| js-4-4 | Arrow Function의 this | 렉시컬 this |

#### Chapter 5: 클로저와 렉시컬 환경 (4 레슨)
> "함수가 끝나도 변수가 살아있는 이유는?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-5-1 | 렉시컬 스코프 | 함수 정의 위치가 스코프 결정 |
| js-5-2 | 클로저란 무엇인가 | 함수 + 렉시컬 환경 번들 |
| js-5-3 | 클로저 활용 패턴 | 데이터 캡슐화, private |
| js-5-4 | 루프와 클로저 함정 | var vs let in loops |

---

### Part B: 비동기와 객체 모델 (Ch 6-10)

#### Chapter 6: 프로토타입과 상속 (4 레슨)
> "JavaScript에서 상속은 어떻게 작동하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-6-1 | 프로토타입이란 | __proto__, Object.getPrototypeOf |
| js-6-2 | 프로토타입 체인 | 속성 탐색 순서 |
| js-6-3 | 생성자 함수와 prototype | new 키워드의 동작 |
| js-6-4 | Object.create() | 프로토타입 직접 지정 |

#### Chapter 7: ES6 클래스 (4 레슨)
> "class는 프로토타입과 어떻게 다른가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-7-1 | class는 syntactic sugar | 내부적으로 프로토타입 |
| js-7-2 | constructor와 메서드 | 인스턴스 생성, 메서드 정의 |
| js-7-3 | extends와 super | 클래스 상속 |
| js-7-4 | static 메서드/속성 | 클래스 레벨 멤버 |

#### Chapter 8: 이벤트 루프 (4 레슨)
> "setTimeout(fn, 0)은 왜 즉시 실행 안 되나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-8-1 | JavaScript 런타임 구조 | Call Stack, Heap, Queue |
| js-8-2 | Web APIs | setTimeout, fetch, DOM events |
| js-8-3 | Task Queue (Macrotask) | 콜백 대기열 |
| js-8-4 | Microtask Queue | Promise 우선순위 |

#### Chapter 9: Promise (4 레슨)
> "콜백 지옥을 어떻게 탈출하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-9-1 | 콜백의 문제점 | Callback Hell |
| js-9-2 | Promise 기초 | pending, fulfilled, rejected |
| js-9-3 | then, catch, finally | Promise 체이닝 |
| js-9-4 | Promise.all, race | 여러 Promise 조합 |

#### Chapter 10: async/await (4 레슨)
> "비동기 코드를 동기처럼 쓸 수 있나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| js-10-1 | async 함수 | 항상 Promise 반환 |
| js-10-2 | await의 동작 | Promise resolve까지 대기 |
| js-10-3 | 에러 처리 | try/catch with async/await |
| js-10-4 | 순차 vs 병렬 | await 연속 vs Promise.all |

---

## Java (10챕터, 40레슨)

### Part A: 객체와 메모리 (Ch 1-5)

#### Chapter 1: 변수와 타입 (4 레슨)
> "int와 Integer는 어떻게 다른가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-1-1 | Primitive 타입 | 8가지 기본 타입, Stack 저장 |
| java-1-2 | Reference 타입 | 객체 참조, Heap 저장 |
| java-1-3 | Stack vs Heap | 메모리 구조 |
| java-1-4 | null의 의미 | 참조가 없음 |

#### Chapter 2: 객체와 참조 (4 레슨)
> "변수는 객체를 담고 있나, 가리키고 있나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-2-1 | new 키워드 | 객체 생성, Heap 할당 |
| java-2-2 | 참조 변수의 의미 | 변수 = 객체 주소를 담는 공간 |
| java-2-3 | == vs equals | 참조 비교 vs 값 비교 |
| java-2-4 | 여러 참조, 하나의 객체 | aliasing |

#### Chapter 3: Pass-by-Value (4 레슨)
> "Java는 call-by-reference인가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-3-1 | Primitive 전달 | 값 복사, 원본 불변 |
| java-3-2 | Reference 전달 | 참조값(주소) 복사 |
| java-3-3 | Swap 테스트 | swap이 안 되는 이유 |
| java-3-4 | 객체 수정 vs 재할당 | 내부 상태 변경 vs 새 객체 |

#### Chapter 4: 배열과 문자열 (4 레슨)
> "배열도 객체인가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-4-1 | 배열은 객체다 | new int[], Heap 저장 |
| java-4-2 | 배열의 참조 전달 | 배열 aliasing |
| java-4-3 | String의 불변성 | immutable, String Pool |
| java-4-4 | String vs StringBuilder | 새 객체 vs 내부 수정 |

#### Chapter 5: Wrapper와 Boxing (4 레슨)
> "int와 Integer는 언제 같고 다른가?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-5-1 | Wrapper 클래스 | Integer, Double 등 |
| java-5-2 | Autoboxing/Unboxing | 자동 변환 |
| java-5-3 | Integer Cache | -128~127 캐싱, == 함정 |
| java-5-4 | Generic과 Primitive | List<int> 불가 |

---

### Part B: 객체지향 설계 (Ch 6-10)

#### Chapter 6: 클래스와 인스턴스 (4 레슨)
> "class와 object의 차이는?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-6-1 | 클래스는 설계도 | 타입 정의, 메모리 없음 |
| java-6-2 | 인스턴스는 실체 | new로 생성, Heap 존재 |
| java-6-3 | 생성자의 역할 | 초기화, this() |
| java-6-4 | this 키워드 | 현재 인스턴스 참조 |

#### Chapter 7: static vs instance (4 레슨)
> "static 메서드에서 왜 instance 변수를 못 쓰나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-7-1 | static 변수 | 클래스 레벨, 공유 |
| java-7-2 | instance 변수 | 인스턴스 레벨, 개별 |
| java-7-3 | static 메서드 | 객체 없이 호출 |
| java-7-4 | 접근 규칙 | static → instance 불가 |

#### Chapter 8: 상속과 다형성 (4 레슨)
> "부모 타입에 자식 객체를 담으면?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-8-1 | extends와 super | 상속, 부모 호출 |
| java-8-2 | 메서드 오버라이딩 | 재정의, @Override |
| java-8-3 | 메서드 오버로딩 | 같은 이름, 다른 파라미터 |
| java-8-4 | 다형성과 동적 바인딩 | 런타임 메서드 결정 |

#### Chapter 9: 추상화와 인터페이스 (4 레슨)
> "abstract class와 interface는 언제 쓰나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-9-1 | 추상 클래스 | abstract, 부분 구현 |
| java-9-2 | 인터페이스 | 계약, 다중 구현 |
| java-9-3 | 둘의 차이 | 상태 유무, 상속 개수 |
| java-9-4 | 함께 사용하기 | List + AbstractList 패턴 |

#### Chapter 10: 예외 처리 (4 레슨)
> "checked와 unchecked는 왜 구분하나?"

| ID | 제목 | 핵심 개념 |
|----|------|----------|
| java-10-1 | Exception 계층 | Throwable, Error, Exception |
| java-10-2 | Checked Exception | 컴파일 강제 |
| java-10-3 | Unchecked Exception | RuntimeException |
| java-10-4 | try-catch-finally | 예외 처리 흐름 |

---

## 언어별 비교표

### Part A: 실행 원리 비교

| 개념 | C | Python | JavaScript | Java |
|------|---|--------|------------|------|
| 변수 | 메모리 공간 | 이름표 (참조) | var/let/const | primitive/reference |
| 메모리 | Stack + Heap (수동) | 자동 GC | 자동 GC | Stack + Heap (자동) |
| 함수 인자 | 값 복사 | pass-by-assignment | 값 복사 | 값 복사 (참조값) |
| 스코프 | 블록 | LEGB | 함수/블록 | 블록 |
| 포인터 | 있음 | 없음 | 없음 | 없음 (참조만) |

### Part B: 설계 구조 비교

| 개념 | C | Python | JavaScript | Java |
|------|---|--------|------------|------|
| 객체지향 | struct + 함수 | class, 다중상속 | prototype, class | class, 단일상속 |
| 상속 | 없음 | MRO | prototype chain | extends |
| 캡슐화 | 파일 분리 | 관례 (_prefix) | closure, #private | access modifier |
| 추상화 | 헤더 파일 | ABC | - | abstract, interface |
| 다형성 | 함수 포인터 | duck typing | duck typing | override |

---

## 파일 위치

| 언어 | 상세 계획 | 상태 |
|------|----------|------|
| C | `docs/reference/CURRICULUM.md` | DB 시딩 완료 |
| Python | `docs/plans/PYTHON_CURRICULUM.md` | 계획 완료 |
| JavaScript | `docs/plans/JAVASCRIPT_CURRICULUM.md` | 계획 완료 |
| Java | `docs/plans/JAVA_CURRICULUM.md` | 계획 완료 |

---

## 구현 우선순위

### Phase 1: C (완료)
- [x] curriculum.json (6챕터)
- [x] 30개 레슨 JSON
- [x] seed.ts 로드
- [ ] 프론트엔드 연동

### Phase 2: Python
- [ ] curriculum.json (10챕터)
- [ ] 40개 레슨 JSON
- [ ] 메모리 모델 시각화

### Phase 3: JavaScript
- [ ] curriculum.json (10챕터)
- [ ] 40개 레슨 JSON
- [ ] Event Loop 시각화

### Phase 4: Java
- [ ] curriculum.json (10챕터)
- [ ] 40개 레슨 JSON
- [ ] Stack/Heap 시각화
