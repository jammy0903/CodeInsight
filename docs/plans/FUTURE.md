# 미래 계획 (Future Plans)

> **마지막 업데이트**: 2026-01-18
> **상태**: 연기됨 (DAU 조건부) 또는 Phase 2+

---

## 목차

1. [연기된 계획 (DAU 조건부)](#1-연기된-계획-dau-조건부)
2. [멀티언어 커리큘럼](#2-멀티언어-커리큘럼)
3. [Misconceptions 연구](#3-misconceptions-연구)

---

## 1. 연기된 계획 (DAU 조건부)

### 1.1 Chapter 구조 개편 (DAU 50+)

> **진입 조건**: DAU 50 이상 달성 시
> **예상 작업**: 2주

**현재 구조 문제점**:
- Language → Chapter → Lesson 구조가 언어 비교 어려움
- 같은 개념(변수, 포인터 등)을 언어별로 찾아야 함

**제안 구조**:
```
현재: /courses/c → /courses/c/c-1 → /courses/c/c-1/c-1-1
제안: /concepts/variables → /concepts/variables/c, /concepts/variables/python
```

**마이그레이션 계획**:
1. ConceptPage 생성 (언어 탭 포함)
2. 기존 Lesson을 Concept-Language 매핑
3. URL 리다이렉트 설정
4. SEO 고려한 점진적 전환

**DB 스키마 변경**:
```prisma
model Concept {
  id          String   @id
  name        String
  description String?
  lessons     Lesson[]  // 언어별 레슨 연결
}

model Lesson {
  conceptId   String?
  concept     Concept?  @relation(...)
}
```

---

### 1.2 Progress DB 서버 저장 (DAU 100+)

> **진입 조건**: DAU 100 이상 달성 시
> **예상 작업**: 3주

**현재 상태**:
- localStorage에 진행 상태 저장
- 디바이스/브라우저 간 동기화 불가
- 데이터 손실 위험

**목표**:
- 서버 DB에 진행 상태 저장
- 크로스 디바이스 동기화
- 학습 분석 기반 데이터 축적

**구현 범위**:
```typescript
interface UserProgress {
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  currentStep: number;
  completedAt?: Date;
  quizScores: QuizScore[];
}
```

**API 설계**:
- `GET /api/me/progress` - 전체 진행 상태
- `PUT /api/me/progress/:lessonId` - 레슨 진행 업데이트
- `POST /api/me/progress/sync` - 로컬 → 서버 동기화

**마이그레이션 전략**:
1. localStorage 백업 API 추가
2. 로그인 시 localStorage → DB 동기화
3. 점진적 localStorage 의존도 감소

---

## 2. 멀티언어 커리큘럼

### 2.1 Python 커리큘럼 (10 Chapters)

> **상태**: 연구 완료, 구현 대기 (Phase 4)

| Chapter | 주제 | 핵심 Misconception |
|---------|------|-------------------|
| 1 | 객체와 변수 | 변수는 박스가 아닌 라벨 |
| 2 | 문자열 | 불변성, 슬라이싱 |
| 3 | 리스트/튜플 | 얕은 복사 vs 깊은 복사 |
| 4 | 함수 | Pass by assignment, 가변 기본값 |
| 5 | 스코프 | LEGB 규칙, global/nonlocal |
| 6 | 딕셔너리/집합 | 해싱, mutable key 금지 |
| 7 | 반복자/제너레이터 | lazy evaluation |
| 8 | 클래스 | 클래스 변수 vs 인스턴스 변수 |
| 9 | 상속 | MRO, super() |
| 10 | 데코레이터 | 함수는 일급 객체 |

**핵심 시각화**:
- Names Panel (변수명) ↔ Objects Panel (실제 객체)
- 화살표로 참조 관계 표시
- id() 값 실시간 표시

---

### 2.2 Java 커리큘럼 (10 Chapters)

> **상태**: 연구 완료, 구현 대기 (Phase 5)

| Chapter | 주제 | 핵심 Misconception |
|---------|------|-------------------|
| 1 | 기본 타입 vs 참조 타입 | 메모리 저장 위치 |
| 2 | String | String Pool, == vs equals() |
| 3 | 배열 | 참조 타입임을 이해 |
| 4 | 래퍼 클래스 | 오토박싱, Integer Cache |
| 5 | 메서드 | Pass by Value (참조의 복사) |
| 6 | 클래스/객체 | this 키워드, 생성자 |
| 7 | static | 클래스 변수 vs 인스턴스 변수 |
| 8 | 상속 | Override vs Overload |
| 9 | 인터페이스/추상클래스 | 다형성 |
| 10 | 예외 처리 | Checked vs Unchecked |

**핵심 시각화**:
- Stack (원시값 + 참조) / Heap (객체)
- String Pool 영역 표시
- `==` vs `equals()` 비교 애니메이션

---

### 2.3 JavaScript 커리큘럼 (10 Chapters)

> **상태**: 일부 구현됨 (Ch 1 Event Loop)

| Chapter | 주제 | 핵심 Misconception |
|---------|------|-------------------|
| 1 | Event Loop | ✅ 구현됨 (js-1-1 ~ js-1-4) |
| 2 | 타입과 강제 변환 | == vs ===, typeof quirks |
| 3 | 함수 | 호이스팅, 기본값 |
| 4 | this | 동적 바인딩, 화살표 함수 |
| 5 | 클로저 | 루프 + var 트랩 |
| 6 | 프로토타입 | 체인 룩업, 객체 참조 |
| 7 | 클래스 | 문법적 설탕 |
| 8 | 비동기 기초 | 콜백, 타이머 |
| 9 | Promise | .then() 체이닝 |
| 10 | async/await | 순차 vs 병렬 |

---

## 3. Misconceptions 연구

### 3.1 Python Misconceptions (TOP 7)

| # | Misconception | 설명 | 레슨 매핑 |
|---|--------------|------|----------|
| 1 | **가변 기본값** | `def f(x=[])` - 리스트가 공유됨 | py-4-4 |
| 2 | **변수는 라벨** | `b = a` - 같은 객체를 가리킴 | py-1-1 |
| 3 | **Late Binding** | 클로저가 값이 아닌 변수 캡처 | py-5-4 |
| 4 | **Pass by Assignment** | 재할당 vs 뮤테이션 차이 | py-4-1~3 |
| 5 | **LEGB 스코프** | 할당이 있으면 전체 함수에서 로컬 | py-5-1~3 |
| 6 | **Integer Caching** | -5~256 사이만 캐시됨 | py-1-2 |
| 7 | **String 불변성** | `+=`는 새 객체 생성 | py-2-1 |

---

### 3.2 Java Misconceptions (TOP 7)

| # | Misconception | 설명 | 레슨 매핑 |
|---|--------------|------|----------|
| 1 | **== vs equals()** | String Pool로 인한 혼란 | java-2-3 |
| 2 | **Pass by Value** | 참조의 복사, swap 불가 | java-3-1~4 |
| 3 | **Integer Cache** | -128~127만 캐시됨 | java-5-3 |
| 4 | **Stack vs Heap** | 원시 vs 참조 저장 위치 | java-1-3 |
| 5 | **static 접근** | static에서 인스턴스 접근 불가 | java-7-3~4 |
| 6 | **String 불변성** | concat()은 원본 안 바꿈 | java-4-3~4 |
| 7 | **Override vs Overload** | 시그니처와 해결 시점 | java-8-2~3 |

---

### 3.3 JavaScript Misconceptions (TOP 10)

| # | Misconception | 상태 |
|---|--------------|------|
| 1 | setTimeout(0)은 즉시 아님 | ✅ js-1-2 |
| 2 | Microtask > Task 우선순위 | ✅ js-1-3 |
| 3 | 무한 Microtask 위험 | ✅ js-1-3 |
| 4 | 렌더링 타이밍 | ✅ js-1-4 |
| 5 | Loop + var 클로저 | 📝 js-5-4 |
| 6 | 콜백에서 this | 📝 js-4-3 |
| 7 | Arrow function this | 📝 js-4-4 |
| 8 | == vs === | 📝 js-2-3 |
| 9 | Truthy/Falsy | 📝 js-2-4 |
| 10 | 객체 참조 vs 복사 | 📝 js-6-x |

---

## 참고 자료

### 학술 논문
- SIGCSE 1997 - Avoiding Object Misconceptions
- SIGCSE 2010 - Identifying Student Misconceptions
- ACM ICER 2018 - K-12 Programming Misconceptions
- ITiCSE 2005 - Novice Java Programmers' Conceptions

### 커뮤니티/실무
- Hitchhiker's Guide to Python - Common Gotchas
- Stack Overflow - Most voted questions per language
- FreeCodeCamp - Common Mistakes series
- Baeldung - Java Interview Questions

---

*마지막 업데이트: 2026-01-18*
