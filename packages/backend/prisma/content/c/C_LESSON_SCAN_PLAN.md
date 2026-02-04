# C 레슨 정밀 스캔 & 리팩토링 계획

---

## 핵심 전제: 우리 시뮬레이터는 "범용"이 아니다

### 우리 시뮬레이터란?

기존 범용 C 컴파일러(gcc)와 다르다. **우리만의 커스텀 인터프리터**다.

```
일반 gcc:     모든 C 코드 실행 가능
우리 시뮬레이터: 특정 패턴만 step-by-step 메모리 추적 가능
```

### 시뮬레이터 구조 (핸들러 우선순위)

```
packages/backend/src/modules/simulators/c/
├── handlers/
│   ├── malloc.handler (priority: 30)         - malloc/free
│   ├── function-pointer.handler (27)         - 함수 포인터
│   ├── double-pointer.handler (26)           - 이중 포인터
│   ├── pointer.handler (25)                  - 포인터 역참조
│   ├── struct.handler (22)                   - 구조체
│   ├── array.handler (20)                    - 배열
│   ├── bitwise.handler (18)                  - 비트 연산
│   ├── io.handler (15)                       - printf/scanf
│   ├── variable.handler (10)                 - 변수 선언/대입
│   └── function.handler (5)                  - 함수 호출
```

### 지원 vs 미지원

| 지원됨 | 미지원/제한적 |
|--------|-------------|
| int, char, float, double, long | 파일 I/O (fopen/fread) |
| 포인터 선언/역참조 | pthread (멀티쓰레드) |
| malloc/free | 복잡한 매크로 (#define) |
| 배열 선언/접근 | VLA (가변 길이 배열) |
| 구조체 정의/멤버 접근 | 재귀 (깊이 제한) |
| 함수 호출/반환 | 표준 라이브러리 함수 대부분 |
| 비트 연산 | union |
| 이중 포인터 | 복잡한 캐스팅 |
| 함수 포인터 | 전처리기 동작 시뮬레이션 |
| printf (기본 포맷) | scanf (제한적) |

---

## 검사 기준: "우리 시뮬레이터가 추적 가능한가?"

### 각 레슨마다 확인할 5가지

#### 1. 코드 실행 가능성
- 우리 시뮬레이터가 이 코드를 파싱할 수 있는가?
- 지원되지 않는 문법이 포함되어 있는가?
- 예: `#include <string.h>`의 `strlen()` → 우리가 지원하는가?

#### 2. 메모리 시각화 정확성
- `steps[]`의 `stack` 배열이 변수의 값/주소/타입을 정확히 보여주는가?
- `heap` 배열이 malloc 영역을 정확히 추적하는가?
- 포인터가 올바른 주소를 가리키는가?

#### 3. 단계별 추적 품질
- 각 step이 의미 있는 상태 변화를 보여주는가?
- 변수가 선언만 되고 변화가 없는 step은 없는가?
- step 수가 너무 많거나(>20) 너무 적지(<3) 않은가?

#### 4. 교육적 일관성
- `explanation`이 코드 동작을 정확히 설명하는가?
- `quiz`의 정답이 실제 코드 결과와 일치하는가?
- `misconceptions`가 학생들의 실제 오해를 다루는가?

#### 5. 시뮬레이터 한계와의 충돌
- Ch9 (전처리기) → 시뮬레이터가 #define 동작을 추적할 수 있는가?
- Ch10 (파일 I/O) → 시뮬레이터가 fopen을 지원하는가?
- Ch8 (함수 포인터) → 핸들러가 정상 작동하는가?

---

## Phase 1: 기초 레슨 검증 (Ch1-2, 10개)

### 왜 먼저?
- 모든 학생이 가장 먼저 접하는 레슨
- 변수, 포인터 기초 → 시뮬레이터의 가장 기본 기능
- 여기서 문제 있으면 전체 학습 경험이 무너짐

### 대상 레슨

| 레슨 | 제목 | 핵심 검사 항목 |
|------|------|--------------|
| c-1-1 | 선언과 메모리 할당 | stack 배열에 변수 표시되는가 |
| c-1-2 | 초기화와 쓰레기 값 | 쓰레기 값(garbage) 시각화 가능한가 |
| c-1-3 | 주소 연산자(&)와 sizeof | &연산자, sizeof 결과 추적 |
| c-1-4 | 스택 메모리의 생명주기 | 함수 종료 시 변수 제거 추적 |
| c-2-1 | 주소 연산자 (&) | 포인터 핸들러 기본 동작 |
| c-2-2 | 포인터 선언 (*) | 포인터 변수 stack 표시 |
| c-2-3 | 역참조: 값 읽기 | *p 읽기 동작 추적 |
| c-2-4 | Dereferencing (Writing) | *p 쓰기 동작 추적 |
| c-2-5 | The NULL Pointer | NULL 체크 시각화 |
| c-2-6 | 포인터 타입과 크기 | sizeof(int*) 등 |

### 검사 방법
```bash
# 1. 각 레슨의 code 필드 추출
# 2. POST /api/memory/trace 로 시뮬레이터 실행
# 3. 응답의 steps 배열 확인
#    - stack에 변수가 제대로 나오는가?
#    - 각 step마다 상태 변화가 있는가?
# 4. 레슨 JSON의 steps와 시뮬레이터 결과 비교
```

### 완료 기준
- [ ] 10개 레슨 모두 시뮬레이터 실행 성공
- [ ] stack/heap 데이터가 레슨 JSON과 일치
- [ ] 문제 레슨 목록 작성

---

## Phase 2: 핵심 메모리 레슨 검증 (Ch3-5, 16개)

### 왜 두 번째?
- 배열, 함수, malloc → C 메모리 교육의 핵심
- 포인터 산술, 스택 프레임, 힙 할당 → 시뮬레이터의 고급 기능
- 가장 많은 핸들러가 관여하는 구간

### 대상 레슨

| 레슨 | 제목 | 핵심 검사 항목 |
|------|------|--------------|
| c-3-1 | Array Memory Layout | 배열 연속 메모리 시각화 |
| c-3-2 | Pointer Arithmetic | p+1, p-1 주소 계산 |
| c-3-3 | Array Name vs Pointer | arr vs &arr[0] |
| c-3-4 | Arrays as Function Args | 배열 인자 전달 (decay) |
| c-3-5 | Traversing with Pointers | 포인터 순회 |
| c-4-1 | Stack Frames | 함수 호출 시 프레임 생성/제거 |
| c-4-2 | Call by Value | 값 복사 시각화 |
| c-4-3 | Call by Reference | 포인터 인자 전달 |
| c-4-4 | Array Parameters | 배열 파라미터 |
| c-4-5 | Returning Stack Addresses | 댕글링 포인터 경고 |
| c-5-1 | Stack vs Heap | 두 영역 비교 시각화 |
| c-5-2 | malloc usage | 힙 할당 추적 |
| c-5-3 | free usage | 힙 해제 추적 |
| c-5-4 | Memory Leaks | 누수 감지 시각화 |
| c-5-5 | Dangling Pointers | 해제 후 접근 경고 |
| c-5-6 | Dynamic Arrays | 동적 배열 할당 |

### 주의 사항
- **c-4-5 (댕글링 포인터)**: 시뮬레이터가 dangling 상태를 표시할 수 있는가?
- **c-5-4 (메모리 누수)**: 시뮬레이터가 leak 감지를 시각화하는가?
- **c-3-2 (포인터 산술)**: p+1이 sizeof(int)만큼 이동하는 것을 보여주는가?

### 완료 기준
- [ ] 16개 레슨 모두 시뮬레이터 실행 성공
- [ ] malloc/free 추적 정확성 확인
- [ ] 스택 프레임 생성/제거 시각화 확인
- [ ] 문제 레슨 목록 작성

---

## Phase 3: 고급 기능 레슨 검증 (Ch6-8, 12개)

### 왜 세 번째?
- 구조체, 이중 포인터, 함수 포인터 → 고급 핸들러 의존
- 시뮬레이터 한계에 가장 가까운 영역
- 문제 발견 확률이 가장 높음

### 대상 레슨

| 레슨 | 제목 | 위험도 | 핵심 검사 항목 |
|------|------|--------|--------------|
| c-6-1 | String Memory Structure | 중 | char[] 메모리 배치 |
| c-6-2 | Char Array vs Char Pointer | 중 | 스택 vs 데이터 영역 |
| c-6-3 | Struct Basics | 중 | 구조체 멤버 메모리 |
| c-6-4 | Struct Pointers (->) | 중 | -> 연산자 추적 |
| c-7-1 | Double Pointers (int **) | 높 | 이중 포인터 핸들러 |
| c-7-2 | Pointers to Arrays | 높 | 배열 포인터 |
| c-7-3 | Dynamic 2D Arrays | 높 | malloc 중첩 호출 |
| c-7-4 | Void Pointers | 높 | void* 캐스팅 |
| c-8-1 | Function Pointer Syntax | 높 | 함수 포인터 핸들러 |
| c-8-2 | Implementing Callbacks | 높 | 콜백 실행 추적 |
| c-8-3 | qsort and Comparators | 높 | 표준 라이브러리 함수 |
| c-8-4 | Jump Tables | 높 | 함수 포인터 배열 |

### 위험 요소
- **c-7-3**: malloc을 여러 번 호출 → 힙 영역 복잡도 증가
- **c-8-3**: `qsort()` → 표준 라이브러리 함수, 시뮬레이터가 지원하는가?
- **c-8-4**: 함수 포인터 배열 → handler가 처리 가능한가?

### 완료 기준
- [ ] 12개 레슨 시뮬레이터 실행 결과 확인
- [ ] 지원 불가 코드 패턴 식별
- [ ] 대체 코드 제안 (필요 시)

---

## Phase 4: 시뮬레이터 한계 레슨 검증 (Ch9-10, 8개)

### 왜 마지막?
- 전처리기, 파일 I/O → 시뮬레이터가 지원하지 않을 가능성 높음
- 이 레슨들은 "정적 시각화"로 전환해야 할 수도 있음
- JS의 비동기 레슨(js-1-2~1-4)처럼 특별 처리 필요

### 대상 레슨

| 레슨 | 제목 | 예상 문제 |
|------|------|---------|
| c-9-1 | Preprocessor Phases | #include, #define 동작 추적 불가 |
| c-9-2 | Macro Pitfalls | 매크로 확장 시뮬레이션 불가 |
| c-9-3 | Conditional Compilation | #ifdef 분기 추적 불가 |
| c-9-4 | Token Pasting (##) | 토큰 연결 시뮬레이션 불가 |
| c-10-1 | Standard Streams | stdin/stdout/stderr 개념 |
| c-10-2 | File Modes | fopen() 미지원 |
| c-10-3 | Buffered I/O | fread/fwrite 미지원 |
| c-10-4 | Binary Input/Output | 바이너리 파일 미지원 |

### 예상 결론
- Ch9: 전처리기는 컴파일 전 단계 → 런타임 시뮬레이터로 추적 불가
  - 해결: 정적 시각화 (미리 작성된 steps)로 교육
- Ch10: 파일 I/O는 OS 시스템 콜 → 시뮬레이터 범위 밖
  - 해결: printf/scanf 기반 개념 설명 + 정적 시각화

### 완료 기준
- [ ] 시뮬레이터 실행 가능한 레슨 식별
- [ ] 정적 시각화 전환 대상 확정
- [ ] 정적 시각화 레슨의 steps 품질 확인

---

## Phase 5: 종합 결과 & 수정 실행

### 작업 순서

```
1. Phase 1-4 결과 종합
   ├── 완벽한 레슨 목록
   ├── 수정 필요 레슨 목록 (유형별)
   └── 정적 시각화 전환 레슨 목록

2. 수정 작업
   ├── 코드 수정 (시뮬레이터 호환)
   ├── steps 데이터 수정 (stack/heap 정확성)
   └── quiz/misconceptions 검증

3. 테스트
   ├── 시뮬레이터 실행 테스트 (API 호출)
   ├── 프론트엔드 시각화 확인
   └── seed.ts로 DB 반영

4. 커밋 & 배포
   └── git push origin main → Render 자동 배포
```

### 문서 업데이트
- 이 문서(C_LESSON_SCAN_PLAN.md)에 각 Phase 결과 기록
- 최종 결론 섹션 추가

---

## 전체 레슨 목록 (46개)

### Ch1: 변수와 메모리 (4개) - Phase 1
- c-1-1: 선언과 메모리 할당
- c-1-2: 초기화와 쓰레기 값
- c-1-3: 주소 연산자(&)와 sizeof
- c-1-4: 스택 메모리의 생명주기

### Ch2: 포인터의 시작 (6개) - Phase 1
- c-2-1: 주소 연산자 (&)
- c-2-2: 포인터 선언 (*)
- c-2-3: 역참조: 값 읽기
- c-2-4: Dereferencing (Writing)
- c-2-5: The NULL Pointer
- c-2-6: 포인터 타입과 크기

### Ch3: 배열과 포인터 (5개) - Phase 2
- c-3-1: Array Memory Layout
- c-3-2: Pointer Arithmetic
- c-3-3: Array Name vs Pointer
- c-3-4: Arrays as Function Args
- c-3-5: Traversing with Pointers

### Ch4: 함수와 메모리 모델 (5개) - Phase 2
- c-4-1: Stack Frames
- c-4-2: Call by Value
- c-4-3: Call by Reference (Pointer)
- c-4-4: Array Parameters
- c-4-5: Returning Stack Addresses

### Ch5: 동적 메모리 할당 (6개) - Phase 2
- c-5-1: Stack vs Heap
- c-5-2: malloc usage
- c-5-3: free usage
- c-5-4: Memory Leaks
- c-5-5: Dangling Pointers
- c-5-6: Dynamic Arrays

### Ch6: 구조체와 문자열 (4개) - Phase 3
- c-6-1: String Memory Structure
- c-6-2: Char Array vs Char Pointer
- c-6-3: Struct Basics
- c-6-4: Struct Pointers (->)

### Ch7: 고급 포인터 (4개) - Phase 3
- c-7-1: Double Pointers (int **)
- c-7-2: Pointers to Arrays
- c-7-3: Dynamic 2D Arrays
- c-7-4: Void Pointers

### Ch8: 함수 포인터와 콜백 (4개) - Phase 3
- c-8-1: Function Pointer Syntax
- c-8-2: Implementing Callbacks
- c-8-3: qsort and Comparators
- c-8-4: Jump Tables

### Ch9: 전처리기와 매크로 (4개) - Phase 4
- c-9-1: Preprocessor Phases
- c-9-2: Macro Pitfalls
- c-9-3: Conditional Compilation
- c-9-4: Token Pasting (##)

### Ch10: 파일 I/O (4개) - Phase 4
- c-10-1: Standard Streams
- c-10-2: File Modes
- c-10-3: Buffered I/O
- c-10-4: Binary Input/Output

---

## 진행 상태

| Phase | 대상 | 레슨 수 | 상태 |
|-------|------|---------|------|
| Phase 1 | Ch1-2 기초 | 10개 | **완료** (8 완벽, 2 수정완료: c-2-5, c-2-6 stack 누락 fix) |
| Phase 2 | Ch3-5 핵심 메모리 | 16개 | **완료** (14 완벽, 2 수정완료: c-3-1, c-3-3 stack 누락 fix) |
| Phase 3 | Ch6-8 고급 기능 | 12개 | **완료** (10 완벽, 2 수정완료: c-7-3 printf step stack/heap 누락, c-8-4 범위검사 step stack 누락 fix) |
| Phase 4 | Ch9-10 한계 영역 | 8개 | **완료** (5 완벽, 3 수정완료: c-9-2 변수 `a` 누락, c-10-2 `fp`/`buffer` 누락 6곳, c-10-4 `saved`/`loaded` 누락 3곳 fix) |
| Phase 5 | 종합 수정 | - | **완료** (아래 종합 결과 참고) |

---

---

## 종합 결과 (Phase 5)

### 전체 통계
- **총 레슨**: 46개
- **explanation 존재율**: 100% (모든 step에 explanation 있음)
- **완벽한 레슨**: 37개
- **수정된 레슨**: 9개 (모두 동일 패턴: printf/출력/조건 step에서 stack 데이터 누락)

### 수정 내역

| 레슨 | 문제 | 수정 내용 |
|------|------|---------|
| c-2-5 | steps 5,6에서 ptr 누락 | NULL ptr stack 데이터 추가 |
| c-2-6 | steps 5,6,7,8에서 a,c,pi,pc 누락 | 4개 변수 stack 데이터 추가 |
| c-3-1 | steps 4,5,6에서 arr 누락 | arr 배열 stack 데이터 추가 |
| c-3-3 | steps 5,6에서 arr,p 누락 | arr+p stack 데이터 추가 |
| c-7-3 | step 9(printf)에서 stack/heap 누락 | rows,cols,matrix + heap 데이터 추가 |
| c-8-4 | step 6(범위검사)에서 choice,actions 누락 | choice+actions stack 데이터 추가 |
| c-9-2 | steps 7,8에서 변수 a 누락 | a 변수 stack에 복원, stdout 수정 |
| c-10-2 | 6개 step에서 fp/buffer 누락 | fp, buffer stack 데이터 추가 |
| c-10-4 | 3개 step에서 saved/loaded 누락 | 구조체 stack 데이터 추가 |

### 발견된 공통 패턴
- **"printf step에서 변수 사라짐"**: 레슨 작성 시 printf 출력 step에서 stack 배열을 비워둔 경향
- 변수는 함수가 return하기 전까지 stack에 남아있어야 함
- 이 패턴은 Ch1~Ch10 전체에 걸쳐 반복적으로 발생

### 시뮬레이터 호환성 결론
- **Ch1-8 (38개)**: 시뮬레이터 실행 가능한 코드 패턴 사용
- **Ch9 (4개)**: 전처리기 관련 → 정적 시각화 (시뮬레이터가 #define 동작을 런타임에 추적하지 않지만, 치환 결과 코드는 실행 가능)
- **Ch10 (4개)**: 파일 I/O → 정적 시각화 (fopen/fclose/fwrite/fread는 시뮬레이터 미지원이지만, 교육적 step은 정적 데이터로 충분)

## 시작일: 2026-02-04
## 완료일: 2026-02-04
