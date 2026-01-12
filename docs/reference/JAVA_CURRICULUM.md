# Java Curriculum (경험 있는 개발자용)

> 대상: Python, JavaScript, C++ 등 다른 언어 경험이 있는 개발자
> 초점: 실수하기 좋은, 오해하기 쉬운, 이해하기 어려운 Java만의 특성

---

## 1. 실수하기 좋은 부분 (Common Mistakes)

### 1.1 동등성 비교 함정

#### == vs .equals() 기본
```java
String a = new String("hello");
String b = new String("hello");
a == b       // false! (참조 비교)
a.equals(b)  // true (값 비교)
```

#### String Pool 함정
```java
String c = "hello";
String d = "hello";
c == d       // true! (같은 Pool 객체)

String e = new String("hello");
c == e       // false! (new는 Pool 안 씀)
c == e.intern()  // true (intern()으로 Pool 등록)
```

#### Integer 캐싱 함정
```java
Integer a = 127;
Integer b = 127;
a == b  // true (캐싱 범위 -128~127)

Integer x = 128;
Integer y = 128;
x == y  // false! (캐싱 범위 밖)

// 안전한 비교
x.equals(y)  // true
Objects.equals(x, y)  // null-safe
```

#### 배열 비교
```java
int[] arr1 = {1, 2, 3};
int[] arr2 = {1, 2, 3};
arr1 == arr2           // false
arr1.equals(arr2)      // false! (Object.equals)
Arrays.equals(arr1, arr2)  // true

// 다차원 배열
int[][] deep1 = {{1, 2}, {3, 4}};
int[][] deep2 = {{1, 2}, {3, 4}};
Arrays.equals(deep1, deep2)      // false!
Arrays.deepEquals(deep1, deep2)  // true
```

#### equals() 오버라이드 실수
```java
class Person {
    String name;

    // 잘못된 오버라이드 (오버로딩됨!)
    public boolean equals(Person other) {
        return name.equals(other.name);
    }

    // 올바른 오버라이드
    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (!(obj instanceof Person)) return false;
        Person other = (Person) obj;
        return Objects.equals(name, other.name);
    }

    // hashCode도 반드시!
    @Override
    public int hashCode() {
        return Objects.hash(name);
    }
}
```

---

### 1.2 Null 관련 실수

#### NullPointerException 기본
```java
String str = null;
str.length();  // NPE!
str.equals("hello");  // NPE!
"hello".equals(str);  // false (안전)
```

#### null 체크 패턴
```java
// 전통적 방식
if (str != null && str.length() > 0) { }

// Objects 유틸리티
Objects.isNull(str)
Objects.nonNull(str)
Objects.requireNonNull(str, "str must not be null")

// Optional (Java 8+)
Optional<String> opt = Optional.ofNullable(str);
opt.orElse("default")
opt.orElseThrow(() -> new IllegalArgumentException())
opt.ifPresent(s -> System.out.println(s))
```

#### 배열/컬렉션 null
```java
String[] arr = null;
arr.length;  // NPE!
arr[0];      // NPE!

List<String> list = null;
list.size();     // NPE!
list.isEmpty();  // NPE!

// 빈 컬렉션 반환 권장
return list != null ? list : Collections.emptyList();
```

#### Map의 null
```java
Map<String, Integer> map = new HashMap<>();
map.put("key", null);  // OK (HashMap은 null 허용)

Map<String, Integer> map2 = new ConcurrentHashMap<>();
map2.put("key", null);  // NPE! (ConcurrentHashMap은 null 불가)

// getOrDefault
map.getOrDefault("missing", 0);  // null 대신 기본값
```

---

### 1.3 Collection 실수

#### 순회 중 수정
```java
List<String> list = new ArrayList<>(Arrays.asList("a", "b", "c"));

// 잘못됨: ConcurrentModificationException
for (String s : list) {
    if (s.equals("b")) {
        list.remove(s);
    }
}

// 방법 1: Iterator
Iterator<String> it = list.iterator();
while (it.hasNext()) {
    if (it.next().equals("b")) {
        it.remove();
    }
}

// 방법 2: removeIf (Java 8+)
list.removeIf(s -> s.equals("b"));

// 방법 3: 역순 인덱스
for (int i = list.size() - 1; i >= 0; i--) {
    if (list.get(i).equals("b")) {
        list.remove(i);
    }
}
```

#### Arrays.asList() 함정
```java
List<String> list = Arrays.asList("a", "b", "c");
list.add("d");     // UnsupportedOperationException!
list.remove("a");  // UnsupportedOperationException!
list.set(0, "x");  // OK (수정은 가능)

// 가변 리스트 원하면
List<String> mutable = new ArrayList<>(Arrays.asList("a", "b", "c"));
```

#### List.of() 함정 (Java 9+)
```java
List<String> list = List.of("a", "b", "c");
list.add("d");     // UnsupportedOperationException!
list.set(0, "x");  // UnsupportedOperationException! (완전 불변)
list.contains(null);  // NPE! (null 불허)
```

#### Mutable 객체를 Key로
```java
List<String> key = new ArrayList<>();
key.add("a");

Map<List<String>, String> map = new HashMap<>();
map.put(key, "value");
map.get(key);  // "value"

key.add("b");  // key 수정!
map.get(key);  // null! (hashCode 변경됨)
```

---

### 1.4 문자열 실수

#### String 불변성
```java
String s = "hello";
s.toUpperCase();    // s는 여전히 "hello"
s.concat(" world"); // s는 여전히 "hello"

s = s.toUpperCase();  // 새 객체 할당 필요
```

#### 문자열 연결 성능
```java
// 나쁨: 루프에서 + 사용 (매번 새 객체)
String result = "";
for (int i = 0; i < 1000; i++) {
    result += i;  // O(n²)
}

// 좋음: StringBuilder
StringBuilder sb = new StringBuilder();
for (int i = 0; i < 1000; i++) {
    sb.append(i);  // O(n)
}
String result = sb.toString();
```

#### substring() 주의 (구버전)
```java
// Java 6 이하: 원본 char[] 공유 → 메모리 누수 가능
String huge = "very long string...";
String small = huge.substring(0, 5);
// small이 huge의 char[] 참조 유지

// Java 7+: 새 char[] 복사 → 안전
```

---

### 1.5 제어문 실수

#### switch fall-through
```java
int day = 1;
switch (day) {
    case 1:
        System.out.println("Monday");
        // break 누락!
    case 2:
        System.out.println("Tuesday");
        break;
}
// 출력: Monday, Tuesday (둘 다!)

// Java 14+ switch expression
String name = switch (day) {
    case 1 -> "Monday";
    case 2 -> "Tuesday";
    default -> "Unknown";
};
```

#### 부동소수점 비교
```java
double a = 0.1 + 0.2;
double b = 0.3;
a == b  // false! (0.30000000000000004)

// 올바른 비교
Math.abs(a - b) < 0.0001  // epsilon 비교

// 정확한 계산 필요시
BigDecimal x = new BigDecimal("0.1");
BigDecimal y = new BigDecimal("0.2");
x.add(y).equals(new BigDecimal("0.3"))  // true
```

#### 정수 오버플로우
```java
int max = Integer.MAX_VALUE;  // 2147483647
max + 1  // -2147483648 (오버플로우, 예외 없음!)

// 안전한 연산 (Java 8+)
Math.addExact(max, 1)  // ArithmeticException

// 큰 수
long bigNum = 3_000_000_000L;  // L 필수!
int wrong = 3_000_000_000;     // 컴파일 에러
```

---

## 2. 오해하기 쉬운 부분 (Misconceptions)

### 2.1 Pass by Value

#### 기본 타입
```java
void increment(int x) {
    x++;  // 지역 변수만 변경
}

int a = 10;
increment(a);
System.out.println(a);  // 10 (변경 안 됨)
```

#### 객체 참조
```java
void changeName(Dog d) {
    d.name = "Max";  // 원본 객체 수정됨!
}

void reassign(Dog d) {
    d = new Dog("Rex");  // 지역 변수만 변경
}

Dog myDog = new Dog("Buddy");
changeName(myDog);
System.out.println(myDog.name);  // "Max"

reassign(myDog);
System.out.println(myDog.name);  // 여전히 "Max"
```

#### swap이 안 되는 이유
```java
void swap(Integer a, Integer b) {
    Integer temp = a;
    a = b;
    b = temp;
    // 지역 변수들만 교환됨
}

Integer x = 1, y = 2;
swap(x, y);
// x=1, y=2 (변경 안 됨)
```

#### 배열은?
```java
void modifyArray(int[] arr) {
    arr[0] = 100;  // 원본 수정됨
    arr = new int[]{999};  // 지역 변수만 변경
}

int[] nums = {1, 2, 3};
modifyArray(nums);
// nums = {100, 2, 3}
```

---

### 2.2 final 키워드

#### 변수
```java
final int x = 10;
x = 20;  // 컴파일 에러!

final List<String> list = new ArrayList<>();
list.add("item");  // OK! 내용 변경 가능
list = new ArrayList<>();  // 컴파일 에러! 재할당 불가
```

#### 메서드
```java
class Parent {
    final void cannotOverride() { }
}

class Child extends Parent {
    void cannotOverride() { }  // 컴파일 에러!
}
```

#### 클래스
```java
final class ImmutableClass { }

class Extended extends ImmutableClass { }  // 컴파일 에러!

// 예: String, Integer는 final 클래스
```

#### effectively final (Java 8+)
```java
int count = 0;
// 람다에서 사용하려면 effectively final이어야 함
Runnable r = () -> System.out.println(count);  // OK
count++;  // 이 줄 추가하면 위 람다 컴파일 에러!
```

---

### 2.3 static 키워드

#### static 변수 (클래스 변수)
```java
class Counter {
    static int count = 0;  // 모든 인스턴스가 공유
    int id;

    Counter() {
        count++;
        id = count;
    }
}

Counter c1 = new Counter();  // count=1, c1.id=1
Counter c2 = new Counter();  // count=2, c2.id=2
Counter.count;  // 2 (클래스명으로 접근 권장)
```

#### static 메서드
```java
class MathUtils {
    static int add(int a, int b) {
        return a + b;
    }

    static void cannotUseThis() {
        // this.xxx;  // 컴파일 에러!
        // 인스턴스 변수 접근 불가
    }
}

MathUtils.add(1, 2);  // 인스턴스 없이 호출
```

#### static 블록
```java
class Config {
    static Map<String, String> settings;

    static {
        // 클래스 로딩 시 한 번만 실행
        settings = new HashMap<>();
        settings.put("env", "prod");
    }
}
```

#### static import
```java
import static java.lang.Math.PI;
import static java.lang.Math.sqrt;

double area = PI * r * r;
double root = sqrt(16);
```

---

### 2.4 상속과 다형성

#### 메서드 오버라이딩
```java
class Animal {
    void speak() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override
    void speak() { System.out.println("Woof!"); }
}

Animal a = new Dog();
a.speak();  // "Woof!" (런타임에 Dog.speak() 호출)
```

#### 필드는 오버라이딩 안 됨
```java
class Parent {
    int x = 10;
}

class Child extends Parent {
    int x = 20;  // 숨김(hiding), 오버라이딩 아님
}

Parent p = new Child();
p.x;  // 10 (Parent.x)
((Child) p).x;  // 20 (Child.x)
```

#### super 키워드
```java
class Child extends Parent {
    Child() {
        super();  // 부모 생성자 호출 (첫 줄에만 가능)
    }

    @Override
    void method() {
        super.method();  // 부모 메서드 호출
    }
}
```

#### 업캐스팅 / 다운캐스팅
```java
Dog dog = new Dog();
Animal animal = dog;  // 업캐스팅 (자동)

Animal animal2 = new Dog();
Dog dog2 = (Dog) animal2;  // 다운캐스팅 (명시적)

Animal animal3 = new Cat();
Dog dog3 = (Dog) animal3;  // ClassCastException!

// 안전한 다운캐스팅
if (animal3 instanceof Dog) {
    Dog d = (Dog) animal3;
}

// Java 16+ 패턴 매칭
if (animal3 instanceof Dog d) {
    d.bark();
}
```

---

### 2.5 Interface vs Abstract Class

#### Interface
```java
interface Flyable {
    void fly();  // 추상 메서드 (자동 public abstract)

    default void land() {  // Java 8+ 기본 구현
        System.out.println("Landing...");
    }

    static void info() {  // Java 8+ static 메서드
        System.out.println("Flyable interface");
    }
}

class Bird implements Flyable {
    @Override
    public void fly() { }
}
```

#### Abstract Class
```java
abstract class Animal {
    String name;  // 상태(필드) 가질 수 있음

    Animal(String name) {  // 생성자 가능
        this.name = name;
    }

    abstract void speak();  // 추상 메서드

    void eat() {  // 일반 메서드
        System.out.println(name + " eats");
    }
}
```

#### 차이점
| 특성 | Interface | Abstract Class |
|------|-----------|----------------|
| 다중 상속 | 가능 | 불가능 |
| 필드 | 상수만 (public static final) | 인스턴스 변수 가능 |
| 생성자 | 없음 | 있음 |
| 접근 제어자 | public만 (Java 9+ private 가능) | 모두 가능 |

---

### 2.6 Garbage Collection 오해

#### GC가 있어도 메모리 누수
```java
// 1. static 컬렉션
static List<Object> cache = new ArrayList<>();
cache.add(hugeObject);  // 영원히 참조

// 2. 리스너 등록 후 해제 안 함
button.addActionListener(listener);
// removeActionListener 안 하면 누수

// 3. 내부 클래스의 외부 참조
class Outer {
    byte[] data = new byte[1000000];
    class Inner { }  // Inner가 Outer 참조 유지
}

// 4. ThreadLocal
ThreadLocal<Object> local = new ThreadLocal<>();
local.set(hugeObject);
// local.remove() 안 하면 스레드 살아있는 동안 유지
```

#### finalize() 문제
```java
// deprecated (Java 9+)
@Override
protected void finalize() {
    // GC 타이밍 예측 불가
    // 성능 저하
    // 예외 무시됨
}

// 대안: try-with-resources, Cleaner
```

---

## 3. 이해하기 어려운 부분 (Hard to Understand)

### 3.1 Checked vs Unchecked Exception

#### 예외 계층
```
Throwable
├── Error (시스템 오류, 처리 X)
│   ├── OutOfMemoryError
│   └── StackOverflowError
└── Exception
    ├── IOException (Checked)
    ├── SQLException (Checked)
    └── RuntimeException (Unchecked)
        ├── NullPointerException
        ├── IllegalArgumentException
        └── IndexOutOfBoundsException
```

#### Checked Exception
```java
// 반드시 처리하거나 선언해야 함
public void readFile() throws IOException {
    FileReader fr = new FileReader("file.txt");
}

// 또는 try-catch
public void readFile() {
    try {
        FileReader fr = new FileReader("file.txt");
    } catch (FileNotFoundException e) {
        e.printStackTrace();
    }
}
```

#### Unchecked Exception
```java
// 처리 선택적
public void divide(int a, int b) {
    return a / b;  // ArithmeticException 가능, 선언 불필요
}
```

#### 언제 어떤 걸 써야 하나?
```java
// Checked: 복구 가능한 상황
throw new IOException("File not found");

// Unchecked: 프로그래밍 오류
throw new IllegalArgumentException("Age must be positive");
```

---

### 3.2 try-with-resources

#### 전통적 방식
```java
FileReader fr = null;
try {
    fr = new FileReader("file.txt");
    // 사용
} catch (IOException e) {
    e.printStackTrace();
} finally {
    if (fr != null) {
        try {
            fr.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
```

#### try-with-resources (Java 7+)
```java
try (FileReader fr = new FileReader("file.txt")) {
    // 사용
} catch (IOException e) {
    e.printStackTrace();
}
// 자동으로 close() 호출
```

#### 여러 리소스
```java
try (
    FileReader fr = new FileReader("input.txt");
    FileWriter fw = new FileWriter("output.txt")
) {
    // 역순으로 close (fw → fr)
}
```

#### AutoCloseable 인터페이스
```java
class MyResource implements AutoCloseable {
    @Override
    public void close() {
        System.out.println("Closed!");
    }
}

try (MyResource r = new MyResource()) {
    // 사용
}
// "Closed!" 출력
```

---

### 3.3 Generics 기초

#### 기본 사용
```java
List<String> strings = new ArrayList<>();
strings.add("hello");
String s = strings.get(0);  // 캐스팅 불필요

List rawList = new ArrayList();  // raw type (경고)
rawList.add("string");
rawList.add(123);  // 컴파일됨, 위험!
```

#### 제네릭 클래스
```java
class Box<T> {
    private T value;

    public void set(T value) { this.value = value; }
    public T get() { return value; }
}

Box<String> stringBox = new Box<>();
stringBox.set("hello");
```

#### 제네릭 메서드
```java
public <T> T getFirst(List<T> list) {
    return list.isEmpty() ? null : list.get(0);
}

String first = getFirst(List.of("a", "b"));
```

#### 타입 제한
```java
// extends: 상한 경계
class NumberBox<T extends Number> {
    T value;
    double getDoubleValue() {
        return value.doubleValue();  // Number 메서드 사용 가능
    }
}

NumberBox<Integer> intBox = new NumberBox<>();  // OK
NumberBox<String> strBox = new NumberBox<>();   // 컴파일 에러!
```

---

### 3.4 Type Erasure

#### 런타임에 타입 정보 없음
```java
List<String> strings = new ArrayList<>();
List<Integer> integers = new ArrayList<>();

strings.getClass() == integers.getClass()  // true!
// 둘 다 ArrayList.class
```

#### 불가능한 것들
```java
class Box<T> {
    T value;

    void create() {
        // new T();  // 컴파일 에러!
        // T[] arr = new T[10];  // 컴파일 에러!
        // if (value instanceof T)  // 컴파일 에러!
    }
}
```

#### 우회 방법
```java
class Box<T> {
    private Class<T> type;

    Box(Class<T> type) {
        this.type = type;
    }

    T create() throws Exception {
        return type.getDeclaredConstructor().newInstance();
    }
}

Box<String> box = new Box<>(String.class);
```

#### Heap Pollution
```java
List<String> strings = new ArrayList<>();
List rawList = strings;  // raw type 할당
rawList.add(123);        // 컴파일됨!
String s = strings.get(0);  // ClassCastException at runtime!
```

---

### 3.5 와일드카드

#### 읽기 전용: ? extends
```java
// Number 또는 하위 타입
List<? extends Number> nums = new ArrayList<Integer>();
Number n = nums.get(0);  // OK
// nums.add(1);  // 컴파일 에러! (어떤 타입인지 모름)
```

#### 쓰기 전용: ? super
```java
// Integer 또는 상위 타입
List<? super Integer> ints = new ArrayList<Number>();
ints.add(1);  // OK
// Integer i = ints.get(0);  // 컴파일 에러! (Object로만 받음)
Object o = ints.get(0);  // OK
```

#### PECS 원칙
```java
// Producer Extends, Consumer Super
public static <T> void copy(
    List<? extends T> src,   // 읽기 (생산)
    List<? super T> dest     // 쓰기 (소비)
) {
    for (T item : src) {
        dest.add(item);
    }
}
```

#### 무제한: ?
```java
List<?> anything = new ArrayList<String>();
Object o = anything.get(0);  // OK
// anything.add("x");  // 컴파일 에러! (null만 가능)
anything.add(null);  // OK
```

---

### 3.6 동시성 기초

#### 가시성 문제
```java
class Stopper {
    boolean running = true;

    void stop() {
        running = false;
    }

    void run() {
        while (running) {  // 무한 루프 가능!
            // ...
        }
    }
}
```
**이유**: 각 스레드가 CPU 캐시에 복사본 보유

#### volatile
```java
class Stopper {
    volatile boolean running = true;  // 메인 메모리에서 읽기
    // ...
}
```

#### synchronized
```java
class Counter {
    private int count = 0;

    // 메서드 전체
    synchronized void increment() {
        count++;
    }

    // 블록
    void add(int n) {
        synchronized(this) {
            count += n;
        }
    }
}
```

#### 교착 상태 (Deadlock)
```java
Object lock1 = new Object();
Object lock2 = new Object();

// Thread 1
synchronized(lock1) {
    synchronized(lock2) { }
}

// Thread 2
synchronized(lock2) {
    synchronized(lock1) { }  // Deadlock!
}
```

#### Thread-safe 컬렉션
```java
// 방법 1: synchronized wrapper
List<String> syncList = Collections.synchronizedList(new ArrayList<>());

// 방법 2: Concurrent 컬렉션
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
CopyOnWriteArrayList<String> list = new CopyOnWriteArrayList<>();
```

---

## 4. 다른 언어와 비교

| 개념 | Java | Python | JavaScript | C++ |
|------|------|--------|------------|-----|
| 타입 시스템 | 정적 | 동적 | 동적 | 정적 |
| == 비교 | 참조 | 값 | 값/참조 | 값 |
| null | NPE | None | null/undefined | nullptr |
| 상속 | 단일 | 다중 | 프로토타입 | 다중 |
| 예외 | Checked/Unchecked | Unchecked | Unchecked | Unchecked |
| 제네릭 | Type Erasure | Duck Typing | 없음 | 템플릿 |
| 메모리 | GC | GC | GC | 수동 |
| final/const | 재할당 금지 | 없음 | const=재할당금지 | const=불변 |

---

## 5. 레슨 계획 (10 Chapters, 40+ Lessons)

### Chapter 1: 동등성 비교의 함정 (5 Lessons)
- [ ] java-1-1: == vs .equals() 기본 (참조 vs 값)
- [ ] java-1-2: String Pool의 비밀
- [ ] java-1-3: Integer 캐싱 (-128~127)
- [ ] java-1-4: 배열 비교 (Arrays.equals, deepEquals)
- [ ] java-1-5: equals/hashCode 계약

### Chapter 2: Null의 모든 것 (4 Lessons)
- [ ] java-2-1: NullPointerException 이해
- [ ] java-2-2: null 체크 패턴
- [ ] java-2-3: Optional 사용법
- [ ] java-2-4: null-safe 컬렉션

### Chapter 3: Pass by Value의 진실 (4 Lessons)
- [ ] java-3-1: 기본 타입 전달
- [ ] java-3-2: 객체 참조 전달
- [ ] java-3-3: 배열 전달
- [ ] java-3-4: swap이 안 되는 이유

### Chapter 4: String 깊이 이해 (4 Lessons)
- [ ] java-4-1: String 불변성
- [ ] java-4-2: String vs StringBuilder
- [ ] java-4-3: String Pool과 intern()
- [ ] java-4-4: 문자열 비교 총정리

### Chapter 5: final과 static (4 Lessons)
- [ ] java-5-1: final 변수
- [ ] java-5-2: final 메서드/클래스
- [ ] java-5-3: static 변수/메서드
- [ ] java-5-4: static 블록과 초기화 순서

### Chapter 6: 상속과 다형성 (5 Lessons)
- [ ] java-6-1: 메서드 오버라이딩
- [ ] java-6-2: 필드 숨김 (hiding)
- [ ] java-6-3: super 키워드
- [ ] java-6-4: 업캐스팅/다운캐스팅
- [ ] java-6-5: Interface vs Abstract Class

### Chapter 7: Collection 함정 (4 Lessons)
- [ ] java-7-1: 순회 중 수정 문제
- [ ] java-7-2: Arrays.asList vs List.of
- [ ] java-7-3: Mutable key 문제
- [ ] java-7-4: 컬렉션 선택 가이드

### Chapter 8: 예외 처리 (5 Lessons)
- [ ] java-8-1: 예외 계층 구조
- [ ] java-8-2: Checked vs Unchecked
- [ ] java-8-3: try-catch-finally 흐름
- [ ] java-8-4: try-with-resources
- [ ] java-8-5: 예외 전파 전략

### Chapter 9: 제네릭 심화 (5 Lessons)
- [ ] java-9-1: 제네릭 기초
- [ ] java-9-2: 제네릭 메서드
- [ ] java-9-3: Type Erasure 이해
- [ ] java-9-4: 와일드카드 (?, extends, super)
- [ ] java-9-5: PECS 원칙

### Chapter 10: 동시성 기초 (5 Lessons)
- [ ] java-10-1: 가시성 문제
- [ ] java-10-2: volatile 키워드
- [ ] java-10-3: synchronized 블록
- [ ] java-10-4: 교착 상태
- [ ] java-10-5: Thread-safe 컬렉션

---

## 참고 자료

- [Top 10 Java Pitfalls of Experienced Developers](https://blog.codepipes.com/java/top-java-pitfalls.html)
- [Buggy Java Code: Top Common Mistakes](https://www.toptal.com/java/top-10-most-common-java-development-mistakes)
- [100 Java Mistakes and How to Avoid Them](https://www.manning.com/books/100-java-mistakes-and-how-to-avoid-them)
- [Java Threading Gotchas](https://www.techrepublic.com/article/avoid-these-java-threading-gotchas/)
- [C vs C++ vs Java vs Python](https://www.geeksforgeeks.org/java/c-vs-java-vs-python/)
