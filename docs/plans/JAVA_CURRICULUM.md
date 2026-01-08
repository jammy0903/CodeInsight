# Java 커리큘럼 계획

> 연구 기반 Java 10챕터 커리큘럼 설계
>
> **Part A (Ch 1-5): 객체와 메모리** - 타입, 참조, Pass-by-Value, 배열, Boxing
> **Part B (Ch 6-10): 객체지향 설계** - 클래스, static, 상속, 인터페이스, 예외

## 연구 기반

| 출처 | 핵심 내용 |
|------|----------|
| ACM SIGCSE - Avoiding Object Misconceptions (1997) | 객체 기술 학습 시 발생하는 misconception 식별 |
| ACM SIGCSE - Programming in Java: Student-Constructed Rules (2000) | 학생들의 잘못된 규칙 구성 연구 |
| ITiCSE 2005 - Novice Java Programmers' Conceptions | object/class 개념에 대한 variation theory 적용 |
| ACM TOCE - Object-Oriented Design and Programming | object/class 개념에 대한 장기 연구 |
| Springer - Understanding "this" in OOP | this 참조에 대한 진단 도구 개발 |
| SIGCSE - Checklists for Grading OO CS1 Programs | 객체지향 프로그래밍 misconception 체크리스트 |

## 핵심 Misconceptions

### 1. Pass-by-Value vs Pass-by-Reference
| Misconception | 올바른 이해 |
|---------------|-------------|
| Java는 객체를 pass-by-reference로 전달 | Java는 **항상** pass-by-value |
| 메서드에서 객체 수정하면 원본도 변경됨 = reference | 참조값(주소)의 복사본이 전달됨 |
| 메서드에서 새 객체 할당하면 원본도 변경 | 로컬 참조만 변경, 원본 참조 그대로 |

```java
// Swap 테스트로 증명
void swap(Object a, Object b) {
    Object temp = a;
    a = b;
    b = temp;
}
// 원본은 바뀌지 않음! (pass-by-value 증명)
```

### 2. Stack vs Heap 메모리
| Misconception | 올바른 이해 |
|---------------|-------------|
| 객체가 Stack에 저장됨 | 객체는 항상 Heap에 저장 |
| primitive도 Heap에 저장 | 지역 primitive는 Stack에 저장 |
| 변수가 객체를 "담고" 있음 | 변수는 객체의 참조(주소)를 담음 |

```
Stack                    Heap
┌─────────────┐         ┌─────────────────┐
│ main()      │         │                 │
│  x = 10     │         │  Person 객체    │
│  p ─────────┼────────>│  name: "Kim"    │
│             │         │  age: 25        │
└─────────────┘         └─────────────────┘
```

### 3. Object와 Class 혼동
| Misconception | 올바른 이해 |
|---------------|-------------|
| class = object | class는 설계도, object는 실체 |
| class가 메모리에 있음 | 인스턴스(object)가 메모리에 존재 |
| "Car 클래스를 만들었다" = 자동차가 생김 | new Car()를 해야 자동차 객체 생성 |

### 4. static vs instance
| Misconception | 올바른 이해 |
|---------------|-------------|
| static 메서드에서 instance 변수 접근 가능 | 불가능 (컴파일 에러) |
| instance 메서드에서 static 변수 접근 불가 | 가능 (클래스 레벨은 항상 접근 가능) |
| this를 static에서 사용 가능 | 불가능 (인스턴스 없음) |

```java
class Counter {
    static int count = 0;      // 클래스 변수 (공유)
    int id;                    // 인스턴스 변수 (개별)

    static void increment() {
        count++;               // OK
        // id++;               // ERROR! non-static cannot be referenced
    }
}
```

### 5. Override vs Overload
| Misconception | 올바른 이해 |
|---------------|-------------|
| 둘 다 다형성의 형태 | Overload만 컴파일타임, Override는 런타임 |
| 파라미터 다르면 override | 파라미터 다르면 overload |
| 반환 타입만 다르면 overload | 반환 타입만 다르면 아무것도 아님 (에러) |

### 6. Interface vs Abstract Class
| Misconception | 올바른 이해 |
|---------------|-------------|
| interface와 abstract class는 거의 같다 | interface는 상태 없음, abstract는 상태 가능 |
| Java 8+ default로 차이 없어짐 | 여전히 상태(instance 변수) 차이 존재 |
| 하나만 선택해야 함 | 함께 사용하는 것이 best practice |

### 7. Checked vs Unchecked Exception
| Misconception | 올바른 이해 |
|---------------|-------------|
| 모든 exception은 try-catch 필요 | RuntimeException은 강제 아님 |
| RuntimeException은 "가벼운" 에러 | 프로그래밍 로직 에러 (NPE, ArrayIndex) |
| finally는 return 후 실행 안 됨 | finally는 항상 실행 (System.exit 제외) |

---

## 커리큘럼 구조 (10챕터, 40레슨)

### Part A: 객체와 메모리 (문법/실행) - Ch 1-5
> 변수 타입, Stack/Heap 메모리, Pass-by-Value, 참조의 **동작 원리** 이해

#### Chapter 1: 변수와 타입
> 핵심 질문: "int와 Integer는 어떻게 다른가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-1-1 | Primitive 타입 | 8가지 기본 타입, Stack 저장 |
| java-1-2 | Reference 타입 | 객체 참조, Heap 저장 |
| java-1-3 | Stack vs Heap | 메모리 구조, 변수 저장 위치 |
| java-1-4 | null의 의미 | 참조가 없음, NullPointerException |

#### Chapter 2: 객체와 참조
> 핵심 질문: "변수는 객체를 담고 있나, 가리키고 있나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-2-1 | new 키워드 | 객체 생성, Heap 할당 |
| java-2-2 | 참조 변수의 의미 | 변수 = 객체 주소를 담는 공간 |
| java-2-3 | == vs equals | 참조 비교 vs 값 비교 |
| java-2-4 | 여러 참조, 하나의 객체 | aliasing, 공유 참조 |

#### Chapter 3: Pass-by-Value의 진실
> 핵심 질문: "Java는 call-by-reference인가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-3-1 | Primitive 전달 | 값 복사, 원본 불변 |
| java-3-2 | Reference 전달 | 참조값(주소) 복사 |
| java-3-3 | Swap 테스트 | 왜 swap이 안 되는가? |
| java-3-4 | 객체 수정 vs 재할당 | 내부 상태 변경 vs 새 객체 할당 |

#### Chapter 4: 배열과 문자열
> 핵심 질문: "배열도 객체인가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-4-1 | 배열은 객체다 | new int[], Heap 저장 |
| java-4-2 | 배열의 참조 전달 | 배열 aliasing |
| java-4-3 | String의 불변성 | immutable, String Pool |
| java-4-4 | String vs StringBuilder | 새 객체 생성 vs 내부 수정 |

#### Chapter 5: Wrapper와 Boxing
> 핵심 질문: "int와 Integer는 언제 같고 언제 다른가?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-5-1 | Wrapper 클래스 | Integer, Double, 객체로 감싸기 |
| java-5-2 | Autoboxing/Unboxing | 자동 변환의 동작 |
| java-5-3 | Integer Cache | -128~127 캐싱, == 함정 |
| java-5-4 | Generic과 Primitive | List<int> 불가, List<Integer> 필요 |

---

### Part B: 객체지향 설계 (OOP/패턴) - Ch 6-10
> 클래스 설계, 상속, 다형성, 추상화, 예외 처리의 **설계 원리** 이해

#### Chapter 6: 클래스와 인스턴스
> 핵심 질문: "class와 object의 차이는?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-6-1 | 클래스는 설계도 | 타입 정의, 메모리 할당 없음 |
| java-6-2 | 인스턴스는 실체 | new로 생성, Heap에 존재 |
| java-6-3 | 생성자의 역할 | 초기화, this() |
| java-6-4 | this 키워드 | 현재 인스턴스 참조 |

#### Chapter 7: static vs instance
> 핵심 질문: "static 메서드에서 왜 instance 변수를 못 쓰나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-7-1 | static 변수 | 클래스 레벨, 공유 |
| java-7-2 | instance 변수 | 인스턴스 레벨, 개별 |
| java-7-3 | static 메서드 | 객체 없이 호출, this 없음 |
| java-7-4 | 접근 규칙 | static → instance 불가, 역은 가능 |

#### Chapter 8: 상속과 다형성
> 핵심 질문: "부모 타입 변수에 자식 객체를 담으면?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-8-1 | extends와 super | 상속, 부모 호출 |
| java-8-2 | 메서드 오버라이딩 | 재정의, @Override |
| java-8-3 | 메서드 오버로딩 | 같은 이름, 다른 파라미터 |
| java-8-4 | 다형성과 동적 바인딩 | 런타임 메서드 결정 |

#### Chapter 9: 추상화와 인터페이스
> 핵심 질문: "abstract class와 interface는 언제 쓰나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-9-1 | 추상 클래스 | abstract, 부분 구현 |
| java-9-2 | 인터페이스 | 계약, 다중 구현 |
| java-9-3 | 둘의 차이 | 상태 유무, 상속 개수 |
| java-9-4 | 함께 사용하기 | List + AbstractList 패턴 |

#### Chapter 10: 예외 처리
> 핵심 질문: "checked와 unchecked는 왜 구분하나?"

| 레슨 | 제목 | 개념 |
|------|------|------|
| java-10-1 | Exception 계층 | Throwable, Error, Exception |
| java-10-2 | Checked Exception | 컴파일 강제, IOException 등 |
| java-10-3 | Unchecked Exception | RuntimeException, NPE 등 |
| java-10-4 | try-catch-finally | 예외 처리 흐름, finally 보장 |

---

## 시각화 설계

### Stack vs Heap 시각화
```
┌─────────────────────────────────────────────────────────────┐
│  Stack (Thread별)           │  Heap (공유)                  │
├─────────────────────────────┼───────────────────────────────┤
│  main()                     │                               │
│  ┌─────────────────────┐    │  ┌─────────────────────────┐  │
│  │ int x = 10          │    │  │ Person 객체 (id: 1001)  │  │
│  │ Person p ──────────────────→│ name: "Kim"             │  │
│  │ int[] arr ────────────────→│ age: 25                 │  │
│  └─────────────────────┘    │  └─────────────────────────┘  │
│                             │                               │
│  calculate()                │  ┌─────────────────────────┐  │
│  ┌─────────────────────┐    │  │ int[] (id: 2002)        │  │
│  │ int y = 20          │    │  │ [1, 2, 3, 4, 5]         │  │
│  │ double z = 3.14     │    │  └─────────────────────────┘  │
│  └─────────────────────┘    │                               │
└─────────────────────────────┴───────────────────────────────┘
```

### Pass-by-Value 시각화
```
┌─────────────────────────────────────────────────────────────┐
│  main()에서 호출: modifyPerson(p)                            │
├─────────────────────────────────────────────────────────────┤
│  Stack                      │  Heap                         │
│                             │                               │
│  main()                     │  ┌─────────────────────────┐  │
│  ┌─────────────────────┐    │  │ Person (id: 1001)       │  │
│  │ p = 0x1001 ─────────────────→│ name: "Kim" → "Lee"    │  │
│  └─────────────────────┘    │  │ age: 25 → 30            │  │
│                             │  └─────────────────────────┘  │
│  modifyPerson()             │                               │
│  ┌─────────────────────┐    │  참조값 복사!                 │
│  │ p = 0x1001 (복사본)─────────→│ (같은 객체를 가리킴)      │  │
│  └─────────────────────┘    │                               │
│                             │                               │
│  ※ 메서드 내에서 p = new Person() 해도                      │
│     main의 p는 여전히 0x1001을 가리킴!                       │
└─────────────────────────────────────────────────────────────┘
```

### 상속과 다형성 시각화
```
┌─────────────────────────────────────────────────────────────┐
│  Animal animal = new Dog();                                 │
├─────────────────────────────────────────────────────────────┤
│  변수 타입: Animal           실제 객체: Dog                 │
│                             │                               │
│  animal ────────────────────→  ┌─────────────────────────┐  │
│  (Animal 타입 참조)            │ Dog 객체                 │  │
│                                │ ├── name (Animal에서)    │  │
│  컴파일러가 보는 것:           │ ├── breed (Dog에서)      │  │
│  - Animal의 메서드만           │ └── speak() → "멍멍!"   │  │
│                                └─────────────────────────┘  │
│  런타임에 실행되는 것:                                       │
│  - Dog의 speak() (오버라이딩된 메서드)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 구현 계획

1. `prisma/content/java/curriculum.json` 생성 (10챕터 구조)
2. `java-1-1.json` ~ `java-10-4.json` (40레슨)
3. `seed.ts`에서 Java 로드
4. 프론트엔드 Java 시각화 컴포넌트
   - Stack/Heap Memory Visualizer
   - Reference vs Value Visualizer
   - Inheritance Hierarchy Visualizer

## 참고 자료

- https://dl.acm.org/doi/10.1145/268084.268132 (Avoiding Object Misconceptions)
- https://dl.acm.org/doi/10.1145/331795.331854 (Student-Constructed Rules)
- https://dl.acm.org/doi/10.1145/1151954.1067473 (Novice Programmers' Conceptions)
- https://www.baeldung.com/java-pass-by-value-or-pass-by-reference
- https://www.baeldung.com/java-stack-heap
- https://www.baeldung.com/java-interface-vs-abstract-class
- https://docs.oracle.com/javase/tutorial/java/IandI/override.html
