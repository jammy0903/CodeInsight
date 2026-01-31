# Java OOP 챕터 추가 컨텐츠 계획

## 📌 개요

**목적**: 학습자들이 가장 어려워하는 OOP 핵심 개념을 체계적으로 다루는 챕터 추가
**위치**: Ch2 "객체와 참조" 직후 (기존 Ch3 이후로 순서 변경)
**챕터 ID**: `java-ch11`
**레슨 수**: 5개

---

## 📚 Ch11: 객체지향 프로그래밍 (OOP) 핵심

### 챕터 메타데이터
```json
{
  "chapterId": "java-ch11",
  "title": "객체지향 프로그래밍 (OOP)",
  "description": "상속, 다형성, 추상화 - Java OOP의 모든 것",
  "order": 11
}
```

---

## 레슨 1: `java-11-1` - 상속의 기초

### 기본 정보
- **제목**: "상속의 기초 - is-a 관계"
- **핵심 개념**: extends 키워드로 부모 클래스의 필드/메서드를 상속받아 코드를 재사용한다

### 코드
```java
class Animal {
    String name;
    void eat() { 
        System.out.println("먹는다"); 
    }
}

class Dog extends Animal {
    void bark() { 
        System.out.println("멍멍!"); 
    }
    
    @Override
    void eat() { 
        super.eat();
        System.out.println("개처럼 먹는다"); 
    }
}

Dog dog = new Dog();
dog.name = "뽀삐";
dog.eat();
dog.bark();
```

### 단계별 설명

#### Step 1: Animal 클래스 정의
**설명**:
부모 클래스(슈퍼클래스)인 `Animal`을 정의합니다. 이 클래스는 모든 동물이 공통으로 가지는 속성(`name`)과 행동(`eat()`)을 담고 있습니다.

**상속이란?**
기존 클래스(부모)의 필드와 메서드를 새로운 클래스(자식)가 물려받는 것입니다. 마치 부모의 재산을 자식이 상속받는 것처럼요.

**is-a 관계란?**
"Dog is an Animal" (개는 동물이다)처럼 "~은 ~이다" 관계가 성립할 때 상속을 사용합니다.

**Key Insight**: 상속 = 코드 재사용의 핵심

#### Step 2: Dog 클래스 정의 (extends)
**설명**:
`extends` 키워드를 사용하여 `Dog`가 `Animal`을 상속받습니다. 이제 `Dog`는 자동으로 `name` 필드와 `eat()` 메서드를 가지게 됩니다.

추가로 `Dog`만의 고유한 메서드 `bark()`를 정의했습니다.

**메모리 구조**:
- Dog 객체는 Animal의 필드(`name`)를 포함합니다
- 메서드는 클래스 정의에 저장되고, 객체는 참조만 가집니다

**Key Insight**: extends = 부모의 모든 것을 물려받음

#### Step 3: 메서드 오버라이딩 (@Override)
**설명**:
`@Override` 어노테이션을 사용하여 부모의 `eat()` 메서드를 재정의합니다. 

`super.eat()`를 호출하면 부모 클래스의 원본 메서드를 실행할 수 있습니다.

**오버라이딩 vs 오버로딩**:
- 오버라이딩: 부모 메서드를 **재정의** (같은 시그니처)
- 오버로딩: 같은 이름, **다른 매개변수**

**Key Insight**: @Override = 부모 메서드 재정의

#### Step 4: Dog 객체 생성
**설명**:
`new Dog()`로 객체를 생성하면, Heap에 Dog 객체가 만들어집니다. 이 객체는 Animal의 필드도 포함합니다.

**메모리 시각화**:
```
Stack:
  dog -> 0x001

Heap:
  0x001: Dog 객체
    - name: null (Animal에서 상속)
    - eat() 메서드 (오버라이드됨)
    - bark() 메서드 (Dog 고유)
```

#### Step 5: 상속받은 필드 사용
**설명**:
`dog.name = "뽀삐"`처럼 부모 클래스의 필드를 직접 사용할 수 있습니다. Dog 클래스에 `name`을 정의하지 않았지만, 상속받았기 때문에 사용 가능합니다.

#### Step 6: 오버라이드된 메서드 호출
**설명**:
`dog.eat()`를 호출하면:
1. Dog의 `eat()` 메서드가 실행됩니다
2. 내부에서 `super.eat()`로 Animal의 `eat()`도 호출됩니다
3. 출력: "먹는다" → "개처럼 먹는다"

#### Step 7: 자식 고유 메서드 호출
**설명**:
`dog.bark()`는 Dog 클래스에만 있는 메서드입니다. 상속은 부모→자식 방향이므로, Animal 객체는 `bark()`를 호출할 수 없습니다.

### Quiz
**질문**: "다음 중 상속의 장점이 아닌 것은?"

**선택지**:
1. 코드 재사용
2. 다중 상속 지원 ✅ (정답)
3. 계층 구조 표현
4. 유지보수 용이

**해설**: Java는 클래스 다중 상속을 지원하지 않습니다. 하나의 클래스만 extends 가능합니다. (인터페이스는 다중 구현 가능)

### Misconceptions
1. **잘못된 생각**: "Java는 다중 상속을 지원한다"
   - **올바른 이해**: Java는 단일 상속만 지원합니다 (인터페이스로 다중 구현 가능)
   - **이유**: 다중 상속은 "다이아몬드 문제"를 일으킵니다. 두 부모가 같은 메서드를 가지면 어떤 것을 상속받아야 할지 모호해집니다.

2. **잘못된 생각**: "private 멤버도 상속된다"
   - **올바른 이해**: private 멤버는 상속되지만 직접 접근은 불가능합니다
   - **이유**: 캡슐화 원칙을 지키기 위해 private은 클래스 내부에서만 접근 가능합니다.

### Key Takeaway
"상속은 'is-a' 관계일 때만 사용하세요. 코드 재사용이 목적이라면 Composition(구성)을 고려하세요."

---

## 레슨 2: `java-11-2` - 다형성의 진실

### 기본 정보
- **제목**: "다형성 - 런타임 바인딩"
- **핵심 개념**: 부모 타입 변수로 자식 객체를 참조하면, 실제 객체 타입에 따라 메서드가 동적으로 결정된다

### 코드
```java
class Animal {
    void speak() { 
        System.out.println("..."); 
    }
}

class Dog extends Animal {
    @Override
    void speak() { 
        System.out.println("멍멍!"); 
    }
    void wagTail() { 
        System.out.println("꼬리 흔들기"); 
    }
}

Animal a = new Dog();
a.speak();

if (a instanceof Dog) {
    Dog d = (Dog) a;
    d.wagTail();
}
```

### 단계별 설명

#### Step 1: 업캐스팅 (Upcasting)
**설명**:
`Animal a = new Dog();`는 자식 객체를 부모 타입 변수에 할당하는 것입니다. 이를 업캐스팅이라고 하며, 자동으로 이루어집니다.

**메모리 상태**:
```
Stack:
  a (타입: Animal) -> 0x001

Heap:
  0x001: Dog 객체 (실제 타입)
```

**다형성이란?**
"하나의 변수가 여러 형태의 객체를 참조할 수 있는 능력"입니다. `Animal` 타입 변수가 Dog, Cat, Bird 등 다양한 객체를 가리킬 수 있습니다.

**Key Insight**: 업캐스팅 = 자식을 부모 타입으로 (자동)

#### Step 2: 동적 메서드 디스패치
**설명**:
`a.speak()`를 호출하면 어떤 메서드가 실행될까요?

**컴파일 타임**: 컴파일러는 `a`의 타입(Animal)을 보고 `Animal.speak()`가 있는지만 확인합니다.

**런타임**: JVM은 `a`가 실제로 가리키는 객체(Dog)를 확인하고 `Dog.speak()`를 호출합니다.

**출력**: "멍멍!" (Dog의 메서드)

**동적 바인딩이란?**
메서드 호출이 컴파일 시점이 아닌 **실행 시점**에 결정되는 것입니다.

**Key Insight**: 실제 객체 타입에 따라 메서드 결정

#### Step 3: 컴파일 타임 제약
**설명**:
```java
// a.wagTail();  // 컴파일 에러!
```

`a`의 타입은 `Animal`이므로, 컴파일러는 `Animal` 클래스에 정의된 메서드만 허용합니다. `wagTail()`은 `Dog`에만 있으므로 컴파일 에러가 발생합니다.

**왜 이런 제약이 있을까?**
컴파일러는 타입 안정성을 보장하기 위해 변수의 선언 타입만 봅니다. 런타임에 어떤 객체가 들어올지 모르기 때문입니다.

#### Step 4: instanceof 연산자
**설명**:
`a instanceof Dog`는 `a`가 실제로 Dog 객체를 가리키는지 확인합니다. 결과는 `true`입니다.

**사용 이유**:
다운캐스팅 전에 타입을 확인하여 `ClassCastException`을 방지합니다.

**Key Insight**: instanceof = 실제 타입 확인

#### Step 5: 다운캐스팅 (Downcasting)
**설명**:
`Dog d = (Dog) a;`는 부모 타입을 자식 타입으로 변환하는 것입니다. 이는 **명시적 캐스팅**이 필요합니다.

**주의사항**:
```java
Animal a2 = new Animal();
Dog d2 = (Dog) a2;  // ClassCastException!
```
실제 객체가 Dog가 아니면 런타임 에러가 발생합니다.

**Key Insight**: 다운캐스팅 = 명시적 + instanceof 확인 필수

#### Step 6: 다운캐스팅 후 메서드 호출
**설명**:
이제 `d`는 `Dog` 타입이므로 `wagTail()`을 호출할 수 있습니다.

### Quiz
**질문**: "`Animal a = new Dog(); a.speak();`의 출력은?"

**선택지**:
1. "..." (Animal의 speak)
2. "멍멍!" (Dog의 speak) ✅
3. 컴파일 에러
4. 런타임 에러

**해설**: 런타임에 실제 객체 타입(Dog)에 따라 메서드가 결정됩니다. 이것이 다형성의 핵심입니다.

### Misconceptions
1. **잘못된 생각**: "변수 타입(Animal)에 따라 메서드가 결정된다"
   - **올바른 이해**: 실제 객체 타입(Dog)에 따라 런타임에 메서드가 결정됩니다
   - **이유**: Java는 동적 바인딩을 사용하여 다형성을 구현합니다.

2. **잘못된 생각**: "다운캐스팅은 항상 안전하다"
   - **올바른 이해**: instanceof로 확인하지 않으면 ClassCastException 발생 가능
   - **이유**: 컴파일러는 타입 변환 문법만 확인하고, 실제 객체 타입은 런타임에 확인됩니다.

### Key Takeaway
"다형성의 핵심: 컴파일 타임에는 변수 타입으로 검사, 런타임에는 실제 객체 타입으로 실행"

---

## 레슨 3: `java-11-3` - 추상 클래스 vs 인터페이스

### 기본 정보
- **제목**: "추상 클래스 vs 인터페이스 선택 가이드"
- **핵심 개념**: 추상 클래스는 부분 구현 + is-a, 인터페이스는 계약 정의 + can-do

### 코드
```java
abstract class Vehicle {
    String brand;
    abstract void start();
    void stop() { 
        System.out.println("정지"); 
    }
}

interface Flyable {
    void fly();
    default void land() {
        System.out.println("착륙");
    }
}

class Helicopter extends Vehicle implements Flyable {
    @Override
    void start() { 
        System.out.println("로터 회전"); 
    }
    
    @Override
    public void fly() { 
        System.out.println("이륙!"); 
    }
}

Helicopter h = new Helicopter();
h.start();
h.fly();
h.land();
h.stop();
```

### 단계별 설명

#### Step 1: 추상 클래스 정의
**설명**:
`abstract class Vehicle`은 인스턴스를 생성할 수 없는 클래스입니다. 추상 메서드(`start()`)와 구현된 메서드(`stop()`)를 모두 가질 수 있습니다.

**추상 메서드란?**
구현부(`{}`)가 없는 메서드로, 자식 클래스가 반드시 구현해야 합니다.

**언제 사용하나?**
- 공통 구현을 제공하고 싶을 때
- "is-a" 관계일 때
- 단일 상속으로 충분할 때

**Key Insight**: 추상 클래스 = 부분 구현 제공

#### Step 2: 인터페이스 정의
**설명**:
`interface Flyable`은 "날 수 있는" 능력을 정의합니다. 모든 메서드는 기본적으로 `public abstract`입니다.

Java 8부터 `default` 메서드로 기본 구현을 제공할 수 있습니다.

**언제 사용하나?**
- 다중 구현이 필요할 때
- "can-do" 관계일 때 (능력, 역할)
- 완전한 추상화가 필요할 때

**Key Insight**: 인터페이스 = 계약(contract) 정의

#### Step 3: 다중 구현
**설명**:
`class Helicopter extends Vehicle implements Flyable`처럼 하나의 클래스를 상속받고, 여러 인터페이스를 구현할 수 있습니다.

**다중 상속 문제 해결**:
인터페이스는 구현이 없으므로(default 제외) 다이아몬드 문제가 발생하지 않습니다.

#### Step 4: 추상 메서드 구현
**설명**:
`Helicopter`는 `Vehicle`의 추상 메서드 `start()`를 반드시 구현해야 합니다. 구현하지 않으면 컴파일 에러가 발생합니다.

#### Step 5: 인터페이스 메서드 구현
**설명**:
`Flyable`의 `fly()` 메서드를 구현합니다. 인터페이스 메서드는 반드시 `public`이어야 합니다.

#### Step 6: default 메서드 사용
**설명**:
`land()` 메서드는 `Flyable` 인터페이스에 `default`로 구현되어 있으므로, `Helicopter`에서 오버라이드하지 않아도 사용할 수 있습니다.

#### Step 7: 상속받은 메서드 사용
**설명**:
`stop()` 메서드는 `Vehicle`에 이미 구현되어 있으므로, `Helicopter`에서 그대로 사용할 수 있습니다.

### 선택 가이드 (Decision Tree)
```
공통 구현(필드, 메서드)이 필요한가?
├─ Yes → Abstract Class
└─ No → Interface

다중 상속이 필요한가?
├─ Yes → Interface
└─ No → Abstract Class 또는 Interface

관계가 "is-a"인가 "can-do"인가?
├─ is-a → Abstract Class
└─ can-do → Interface
```

### Quiz
**질문**: "Interface의 특징이 아닌 것은?"

**선택지**:
1. 다중 구현 가능
2. 생성자 가질 수 있음 ✅ (정답)
3. default method 가능 (Java 8+)
4. 모든 메서드 public

**해설**: 인터페이스는 생성자를 가질 수 없습니다. 인스턴스를 생성할 수 없기 때문입니다.

### Misconceptions
1. **잘못된 생각**: "Interface는 메서드만 선언할 수 있다"
   - **올바른 이해**: Java 8부터 default/static 메서드 구현 가능합니다
   - **이유**: 하위 호환성을 유지하면서 인터페이스에 새 기능을 추가하기 위해 도입되었습니다.

2. **잘못된 생각**: "추상 클래스는 추상 메서드만 가질 수 있다"
   - **올바른 이해**: 일반 메서드, 필드, 생성자도 가질 수 있습니다
   - **이유**: 추상 클래스의 목적은 부분 구현을 제공하는 것입니다.

### Key Takeaway
"is-a 관계 + 공통 구현 → 추상 클래스 / can-do 관계 + 다중 구현 → 인터페이스"

---

## 레슨 4: `java-11-4` - 생성자 체이닝

### 기본 정보
- **제목**: "생성자 체이닝과 초기화 순서"
- **핵심 개념**: this()는 같은 클래스, super()는 부모 클래스 생성자를 호출하며, 반드시 첫 줄에 와야 한다

### 코드
```java
class Parent {
    Parent() { 
        System.out.println("1. Parent()"); 
    }
    Parent(String s) { 
        System.out.println("2. Parent: " + s); 
    }
}

class Child extends Parent {
    Child() {
        this("기본값");
        System.out.println("3. Child()");
    }
    
    Child(String s) {
        super(s);
        System.out.println("4. Child: " + s);
    }
}

Child c = new Child();
```

### 단계별 설명

#### Step 1: Child() 생성자 호출
**설명**:
`new Child()`를 실행하면 `Child()` 생성자가 호출됩니다. 첫 줄에 `this("기본값")`이 있으므로, 먼저 `Child(String)` 생성자로 이동합니다.

**생성자 체이닝이란?**
한 생성자가 다른 생성자를 호출하는 것입니다. 코드 중복을 줄이고 초기화 로직을 한 곳에 모을 수 있습니다.

**Key Insight**: this() = 같은 클래스의 다른 생성자

#### Step 2: Child(String) 생성자 호출
**설명**:
`Child(String)` 생성자의 첫 줄에 `super(s)`가 있으므로, 부모 클래스 `Parent(String)` 생성자를 호출합니다.

**왜 첫 줄이어야 하나?**
부모 객체가 먼저 초기화되어야 자식 객체를 안전하게 초기화할 수 있기 때문입니다.

**Key Insight**: super() = 부모 생성자 호출

#### Step 3: Parent(String) 생성자 실행
**설명**:
`Parent(String)` 생성자가 실행되어 "2. Parent: 기본값"을 출력합니다.

**출력**: `2. Parent: 기본값`

#### Step 4: Child(String) 생성자 본문 실행
**설명**:
부모 생성자가 끝나면, `Child(String)` 생성자의 나머지 부분이 실행됩니다.

**출력**: `4. Child: 기본값`

#### Step 5: Child() 생성자 본문 실행
**설명**:
`Child(String)` 생성자가 끝나면, 원래 호출했던 `Child()` 생성자의 나머지 부분이 실행됩니다.

**출력**: `3. Child()`

**전체 출력 순서**:
```
2. Parent: 기본값
4. Child: 기본값
3. Child()
```

#### Step 6: 암시적 super() 호출
**설명**:
만약 생성자에 `this()`나 `super()`를 명시하지 않으면, 컴파일러가 자동으로 `super()`를 첫 줄에 삽입합니다.

```java
Child() {
    // super();  // 컴파일러가 자동 삽입
    System.out.println("Child");
}
```

**주의**: 부모 클래스에 기본 생성자가 없으면 컴파일 에러가 발생합니다.

### 초기화 순서 정리
1. 부모 클래스의 static 블록
2. 자식 클래스의 static 블록
3. 부모 클래스의 인스턴스 블록
4. 부모 클래스의 생성자
5. 자식 클래스의 인스턴스 블록
6. 자식 클래스의 생성자

### Quiz
**질문**: "생성자에서 this()와 super()를 동시에 쓸 수 있나요?"

**선택지**:
1. 가능
2. 불가능 ✅ (정답)
3. 순서만 맞으면 가능
4. Java 버전에 따라 다름

**해설**: 둘 다 첫 줄에 와야 하므로 동시에 사용할 수 없습니다. 하나만 선택해야 합니다.

### Misconceptions
1. **잘못된 생각**: "super()를 안 쓰면 부모 생성자가 호출 안 됨"
   - **올바른 이해**: 명시 안 하면 컴파일러가 자동으로 super() 삽입합니다
   - **이유**: 모든 객체는 Object 클래스까지 거슬러 올라가며 초기화되어야 합니다.

2. **잘못된 생각**: "this()와 super()를 순서만 바꾸면 같이 쓸 수 있다"
   - **올바른 이해**: 둘 다 반드시 첫 줄이어야 하므로 불가능합니다
   - **이유**: 부모 초기화가 먼저 완료되어야 자식 초기화가 안전하기 때문입니다.

### Key Takeaway
"생성자 체이닝으로 초기화 로직을 중앙화하세요. this()는 같은 클래스, super()는 부모 클래스 생성자를 호출합니다."

---

## 레슨 5: `java-11-5` - 접근 제어자

### 기본 정보
- **제목**: "접근 제어자 완전 정복"
- **핵심 개념**: private(클래스), default(패키지), protected(패키지+자식), public(모든 곳)

### 코드
```java
package com.example;

class Parent {
    private int a = 1;
    int b = 2;
    protected int c = 3;
    public int d = 4;
}

package com.example;
class SamePackage {
    void test() {
        Parent p = new Parent();
        // p.a;  // 에러!
        p.b;  // OK
        p.c;  // OK
        p.d;  // OK
    }
}

package com.other;
class Child extends Parent {
    void test() {
        // a;  // 에러!
        // b;  // 에러!
        c;  // OK
        d;  // OK
    }
}
```

### 단계별 설명

#### Step 1: private - 클래스 내부만
**설명**:
`private int a`는 오직 `Parent` 클래스 내부에서만 접근 가능합니다. 같은 패키지의 다른 클래스나 자식 클래스에서도 접근할 수 없습니다.

**사용 목적**:
캡슐화의 핵심입니다. 외부에서 직접 수정하지 못하도록 막고, getter/setter로만 접근하게 합니다.

**Key Insight**: private = 완전 은폐

#### Step 2: default (package-private) - 같은 패키지
**설명**:
접근 제어자를 명시하지 않으면 `default`(package-private)입니다. 같은 패키지 내의 클래스에서만 접근 가능합니다.

**사용 목적**:
패키지 내부 구현을 외부에 노출하지 않을 때 사용합니다.

**Key Insight**: default = 패키지 친구들만

#### Step 3: protected - 같은 패키지 + 자식 클래스
**설명**:
`protected int c`는 같은 패키지의 클래스와 다른 패키지의 자식 클래스에서 접근 가능합니다.

**주의사항**:
다른 패키지의 자식 클래스에서는 **상속받은 멤버**로만 접근 가능합니다. 다른 객체의 protected 멤버는 접근 불가합니다.

```java
class Child extends Parent {
    void test() {
        c;  // OK (상속받은 멤버)
        
        Parent p = new Parent();
        // p.c;  // 에러! (다른 객체)
    }
}
```

**Key Insight**: protected = 패키지 + 상속

#### Step 4: public - 모든 곳
**설명**:
`public int d`는 어디서든 접근 가능합니다. API로 공개할 메서드나 필드에 사용합니다.

**사용 목적**:
외부에 공개할 인터페이스를 정의할 때 사용합니다.

**Key Insight**: public = 완전 공개

### 접근 범위 표

| 제어자 | 같은 클래스 | 같은 패키지 | 자식 클래스 (다른 패키지) | 모든 곳 |
|--------|-------------|-------------|---------------------------|---------|
| private | ✅ | ❌ | ❌ | ❌ |
| default | ✅ | ✅ | ❌ | ❌ |
| protected | ✅ | ✅ | ✅ | ❌ |
| public | ✅ | ✅ | ✅ | ✅ |

### 캡슐화 원칙
1. 필드는 `private`으로 선언
2. 필요한 경우 `public` getter/setter 제공
3. 내부 구현은 숨기고, 인터페이스만 공개

### Quiz
**질문**: "protected 멤버는 어디서 접근 가능한가?"

**선택지**:
1. 같은 클래스만
2. 같은 패키지 + 모든 자식 클래스 ✅ (정답)
3. 같은 패키지만
4. 모든 곳

**해설**: protected는 같은 패키지의 모든 클래스와 다른 패키지의 자식 클래스에서 접근 가능합니다.

### Misconceptions
1. **잘못된 생각**: "default는 private과 같다"
   - **올바른 이해**: default는 같은 패키지 내에서 접근 가능합니다
   - **이유**: default는 패키지 단위 캡슐화를 제공합니다.

2. **잘못된 생각**: "protected는 자식 클래스에서 모든 객체의 멤버에 접근 가능하다"
   - **올바른 이해**: 상속받은 멤버로만 접근 가능합니다
   - **이유**: 캡슐화를 유지하기 위해 다른 객체의 protected 멤버는 접근 불가합니다.

### Key Takeaway
"최소 권한 원칙: 가장 제한적인 접근 제어자부터 시작하세요. 필요할 때만 범위를 넓히세요."

---

## 📊 커리큘럼 재배치 계획

### 변경 전
```
Ch1: 변수와 자료형
Ch2: 객체와 참조
Ch3: Pass-by-Value
...
```

### 변경 후
```
Ch1: 변수와 자료형
Ch2: 객체와 참조
→ Ch11: OOP 핵심 (NEW!)
Ch3: Pass-by-Value (순서 변경 없음, 번호만 유지)
...
```

**참고**: 챕터 번호는 `order` 필드로 관리되므로, 기존 Ch3~Ch10의 JSON 파일명은 변경하지 않고 `order` 값만 조정합니다.

---

## ✅ 다음 단계

1. **검토 및 피드백**: 이 MD 파일 내용을 검토해주세요
2. **JSON 파일 생성**: 승인되면 5개 레슨 JSON 파일 작성
3. **커리큘럼 업데이트**: `curriculum.json`에 Ch11 추가
4. **DB 시딩**: `pnpm seed` 실행하여 DB 반영
