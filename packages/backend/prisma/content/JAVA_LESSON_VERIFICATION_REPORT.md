# Java 레슨 검증 보고서

검증 일시: 2026-01-31
검증 대상: packages/backend/prisma/content/java/lessons/*.json
총 파일 수: 40개

---

## 검증 결과 요약

| 상태 | 파일 수 |
|------|--------|
| ✅ 정상 | 37개 |
| ✅ 수정 완료 | 3개 |

**모든 파일 수정 완료됨!**

---

## ✅ 정상 파일 목록

### java-1-x 시리즈 (5개) - 모두 정상
- java-1-1.json: == vs .equals()
- java-1-2.json: String Pool
- java-1-3.json: Integer caching
- java-1-4.json: Array comparison
- java-1-5.json: equals/hashCode

### java-2-x 시리즈 (4개) - 모두 정상
- java-2-1.json: NullPointerException 이해
- java-2-2.json: null 체크 패턴
- java-2-3.json: Optional 사용법
- java-2-4.json: null-safe 컬렉션

### java-3-x 시리즈 (4개) - 모두 정상
- java-3-1.json: 기본 타입 전달
- java-3-2.json: 객체 참조 전달
- java-3-3.json: 배열 전달
- java-3-4.json: swap이 안 되는 이유

### java-4-x 시리즈 (4개) - 모두 정상
- java-4-1.json: String 불변성
- java-4-2.json: String vs StringBuilder
- java-4-3.json: String Pool과 intern()
- java-4-4.json: 문자열 비교 총정리

### java-5-x 시리즈 (4개) - 모두 정상
- java-5-1.json: final 변수
- java-5-2.json: final 클래스와 메서드
- java-5-3.json: static 필드
- java-5-4.json: static 메서드

### java-6-x 시리즈 (4/5개 정상)
- java-6-1.json: 스택 트레이스와 예외 처리 기초 ✅
- java-6-2.json: 예외의 종류: Checked vs Unchecked ✅
- java-6-3.json: Finally와 예외 떠넘기기(throws) ✅
- java-6-5.json: 추상 클래스 vs 인터페이스 ✅

### java-7-x 시리즈 (2/4개 정상)
- java-7-2.json: 타입 소거 (Type Erasure)의 비밀 ✅
- java-7-4.json: 와일드카드와 타입 제한 ✅

### java-8-x 시리즈 (4개) - 모두 정상
- java-8-1.json: ArrayList: 늘어나는 배열의 비밀
- java-8-2.json: HashMap: 해시 함수의 마법
- java-8-3.json: HashSet: 중복은 절대 금지!
- java-8-4.json: LinkedList: 데이터의 기차놀이

### java-9-x 시리즈 (4개) - 모두 정상
- java-9-1.json: GC: 힙 영역의 든든한 청소부
- java-9-2.json: JVM 구조: 힙 영역의 3세대
- java-9-3.json: Stop-the-World: 청소부의 방식
- java-9-4.json: 메모리 누수: 도망간 객체를 잡아라

### java-10-x 시리즈 (4개) - 모두 정상
- java-10-1.json: 쓰레드: 우리 공장의 새로운 일꾼
- java-10-2.json: 동기화: 하나씩 차례대로!
- java-10-3.json: 경쟁 상태: 누가 먼저 도착할까?
- java-10-4.json: 쓰레드 풀: 일꾼 인력 사무소

---

## ⚠️ 수정 필요 파일 상세

### 1. java-6-4.json (사용자 정의 예외 만들기)

**문제 유형:** 라인 번호 불일치

**코드 구조:**
```
line 16: try {
line 17:     withdraw(1000);
line 18: } catch (InsufficientFundsException e) {
line 19:     System.out.println("Error: " + e.getMessage());
...
line 26: double balance = 500;
line 27: if (amount > balance) {
```

**수정 필요 사항:**

| Step | 현재 line | Title | 실제 line | 올바른 line |
|------|-----------|-------|-----------|-------------|
| 3 | 16 | 메서드 호출 | `try {` | 17 |
| 4 | 26 | 잔고 확인 | `double balance = 500;` | 27 |
| 5 | 17 | 구체적인 예외 잡기 | `withdraw(1000);` | 18 |
| 6 | 18 | 예외 정보 출력 | `catch (...) {` | 19 |

---

### 2. java-7-1.json (제네릭 기초: 타입 안전성)

**문제 유형:** 라인 번호 불일치 (1씩 밀림)

**코드 구조:**
```
line 17: Box<String> stringBox = new Box<>();
line 18: stringBox.set("Hello Generics");
...
line 23: System.out.println(stringBox.get());
...
line 25: Box<Integer> intBox = new Box<>();
line 26: intBox.set(42);
line 27: System.out.println(intBox.get());
```

**수정 필요 사항:**

| Step | 현재 line | Title | 올바른 line |
|------|-----------|-------|-------------|
| 2 | 17 | 값 설정 | 18 |
| 3 | 25 | 정수 값 설정 | 26 |
| 4 | 26 | 정수 값 출력 | 27 |

**누락된 Step:**
- line 23: `stringBox.get()` 출력 Step이 빠져 있음

---

### 3. java-7-3.json (제네릭 메서드와 타입 추론)

**문제 유형:** 라인 번호 불일치 (1씩 밀림)

**코드 구조:**
```
line 11: Integer[] intArray = {1, 2, 3};
line 12: String[] strArray = {"A", "B", "C"};
...
line 14: System.out.print("Integer Array: ");
line 15: printArray(intArray);
...
line 17: System.out.print("String Array: ");
line 18: printArray(strArray);
...
line 20: // printArray(new int[]{1, 2}); // Error!
line 21: }
```

**수정 필요 사항:**

| Step | 현재 line | Title | 올바른 line |
|------|-----------|-------|-------------|
| 2 | 12 | Integer 배열 생성 | 11 |
| 3 | 15 | 레이블 출력 | 14 |
| 4 | 18 | 두 번째 레이블 출력 | 17 |
| 5 | 21 | 원시 타입 에러 | 20 |

---

## 수정 방법

각 파일의 `steps` 배열에서 `line` 값을 위 표에 따라 수정하면 됩니다.

### 예시 (java-7-1.json Step 2):
```json
// Before
{
  "line": 17,
  "title": "값 설정",
  ...
}

// After
{
  "line": 18,
  "title": "값 설정",
  ...
}
```

---

## 검증 완료

- [x] java-1-x 시리즈 (5개)
- [x] java-2-x 시리즈 (4개)
- [x] java-3-x 시리즈 (4개)
- [x] java-4-x 시리즈 (4개)
- [x] java-5-x 시리즈 (4개)
- [x] java-6-x 시리즈 (5개)
- [x] java-7-x 시리즈 (4개)
- [x] java-8-x 시리즈 (4개)
- [x] java-9-x 시리즈 (4개)
- [x] java-10-x 시리즈 (4개)
