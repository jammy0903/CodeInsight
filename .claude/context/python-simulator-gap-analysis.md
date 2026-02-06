# Python 시뮬레이터 갭 분석

> Playground가 레슨 46개를 모두 커버할 수 있도록 업그레이드하기 위한 분석 문서

---

## 1. 현재 아키텍처

### 실행 파이프라인

```
사용자 코드 → 검증 → 임시파일 생성 → python3 subprocess(debugger_agent.py) → JSON 결과 → 핸들러 처리 → Step[] 변환
```

### 핵심 구성 요소

| 파일 | 역할 |
|------|------|
| `python-simulation.service.ts` | 4단계 파이프라인 (validate → setup → trace → cleanup) |
| `agent/debugger_agent.py` | `sys.settrace()` 기반 실행 추적 (446줄) |
| `engine/debugger-client.ts` | python3 프로세스 스폰, 10초 타임아웃 |
| `handlers/*.ts` | 12개 핸들러, 우선순위 기반 매칭 |
| `routes.ts` | POST `/api/v1/simulators/python/simulate` |

### C 시뮬레이터와의 근본적 차이

| | C 시뮬레이터 (기존) | Python 시뮬레이터 |
|---|---|---|
| **엔진** | regex 기반 (한계 명확) | `sys.settrace()` (제어 흐름 처리 가능) |
| **접근법** | 엔진 교체 (regex → GDB/MI) | 기존 엔진 강화 |
| **제어 흐름** | ❌ 처리 불가 | ✅ 이미 처리됨 |
| **문제 영역** | 엔진 자체 한계 | 고급 문법 요소 미지원 |

---

## 2. debugger_agent.py 분석

### sys.settrace() 동작 방식

```python
sys.settrace(agent.trace_func)

def trace_func(self, frame, event, arg):
    if event == 'call':
        # 프레임 진입 결정 (사용자 코드만 추적)
        return self.trace_func or None
    if event != 'line':
        return self.trace_func  # ← return/exception 이벤트 무시!
    # line 이벤트: 이전 줄 상태 캡처 후 현재 줄 기록
```

### 캡처하는 데이터

| 데이터 | 내용 | 형식 |
|--------|------|------|
| **names** | 스코프 내 변수명 + 가리키는 객체ID | `{name, scope, pointsTo}` |
| **objects** | 객체의 타입, 값, 뮤터블 여부 | `{id, type, value, mutable}` |
| **callStack** | 함수 호출 스택 | `{functionName, depth, localNames}` |
| **stdout** | print 출력 | StringIO 캡처 |

### 객체 추적 시스템

```python
# 안정적 hex ID 매핑 (Python id() → 0x001, 0x002, ...)
def get_hex_address(self, obj):
    obj_id = id(obj)
    if obj_id not in self.id_map:
        self.id_map[obj_id] = f"0x{self.object_id_counter:03X}"
        self.object_id_counter += 1
    return self.id_map[obj_id]
```

### 타입별 처리

| 타입 | 추적 방식 | 상태 |
|------|----------|------|
| None, bool, int, float, str | 값 직접 저장 (immutable) | ✅ |
| list | 요소별 objectId 참조 (mutable) | ✅ |
| tuple | 요소별 objectId 참조 (immutable) | ✅ |
| dict | key-value objectId 쌍 | ✅ |
| set/frozenset | 요소별 objectId | ✅ |
| function | name + params (inspect.signature) | ✅ |
| class (type) | name + methods 열거 | ⚠️ |
| instance | className + attributes | ⚠️ |
| generator | ❌ 미지원 | ❌ |

### 현재 한계점

| 한계 | 원인 | 영향 |
|------|------|------|
| **return 이벤트 무시** | `if event != 'line': return` | 반환값 추적 불가 |
| **exception 이벤트 무시** | 위와 동일 | try/except 흐름 불가 |
| **클래스 본체 스킵** | 휴리스틱으로 class body 제외 | 클래스 변수 생성 못 봄 |
| **generator 미지원** | settrace가 yield 후 재진입 안 함 | Ch8 전체 미지원 |
| **async 미지원** | 비동기 이벤트 훅 없음 | Ch10 전체 미지원 |

---

## 3. TypeScript 핸들러 분석 (12개)

### 코드 핸들러 (Statement Level)

| 핸들러 | 우선순위 | 문법 요소 | 주요 한계 |
|--------|---------|----------|----------|
| ReturnHandler | 30 | `return value` | 단순 표현식만 (산술, 리터럴, 변수) |
| AssignBuiltinHandler | 29 | `x = id/type/len()` | 3개 내장함수만 |
| BuiltinFunctionHandler | 28 | `id/type/len()` | 3개 내장함수만 |
| AssignMethodCallHandler | 27 | `x = obj.method()` | 인자 타입 제한 |
| InstanceCreateHandler | 26 | `x = Class()` | 대문자 시작 클래스만 |
| AssignFunctionCallHandler | 25 | `x = func()` | 인자 타입 제한 |
| AttributeAssignHandler | 22 | `obj.attr = value` | 단순 값만 |
| MethodCallHandler | 21 | `obj.method()` | 인자 타입 제한 |
| FunctionCallHandler | 20 | `func()` | 인자 타입 제한 |
| PrintHandler | 15 | `print()` | 기본 f-string만 |
| AssignHandler | 10 | `x = expr` | 복합 표현식 제한 |
| GlobalNonlocalHandler | 5 | `global/nonlocal` | nonlocal 부분 구현 |

### 블록 핸들러 (Definition Level)

| 핸들러 | 우선순위 | 문법 요소 | 주요 한계 |
|--------|---------|----------|----------|
| ClassDefHandler | 55 | `class Name:` | 클래스 속성/프로퍼티/데코레이터 미지원 |
| FunctionDefHandler | 50 | `def func():` | *args/**kwargs/데코레이터 미지원 |

### 누락된 핸들러

| 필요 핸들러 | 대상 문법 | 관련 레슨 |
|------------|----------|----------|
| LambdaHandler | `lambda x: x + 1` | py-4-3 |
| DecoratorHandler | `@decorator` | py-9-2, py-9-3, py-9-4 |
| ArgsKwargsHandler | `*args, **kwargs` | py-4-2 |
| ComprehensionHandler | `[x for x in ...]` | - |
| TryExceptHandler | `try/except/finally` | - |
| WithHandler | `with open() as f:` | - |

---

## 4. 레슨별 갭 분석 (46개)

### Chapter 1: 기초 (5개) — ✅ 완전 지원

| 레슨 | 제목 | 상태 | 비고 |
|------|------|------|------|
| py-1-1 | 변수는 이름표다 | ✅ | 변수, 객체 참조 |
| py-1-2 | 숫자 타입: /와 //의 차이 | ✅ | 나눗셈 연산자 |
| py-1-3 | 문자열: 데이터의 나열 | ✅ | 인덱싱, 슬라이싱 |
| py-1-4 | 불리언과 형변환 | ✅ | int(), str(), float() |
| py-1-5 | 재할당: 라벨 옮기기 | ✅ | 재할당, GC 개념 |

### Chapter 2: 제어 흐름 (5개) — ✅ 완전 지원

| 레슨 | 제목 | 상태 | 비고 |
|------|------|------|------|
| py-2-1 | 조건문 | ✅ | if/elif/else |
| py-2-2 | While 반복문 | ✅ | while 루프 |
| py-2-3 | For 반복문 | ✅ | for + range() |
| py-2-4 | Break와 Continue | ✅ | 반복 제어 |
| py-2-5 | String Interning | ✅ | 객체 동일성 |

### Chapter 3: 자료구조 (6개) — ✅ 완전 지원

| 레슨 | 제목 | 상태 | 비고 |
|------|------|------|------|
| py-3-1 | Lists (Mutable) | ✅ | 리스트 생성, 변이 |
| py-3-2 | Tuples (Immutable) | ✅ | 튜플, 언패킹 |
| py-3-3 | Dictionaries | ✅ | 딕셔너리 |
| py-3-4 | Sets (Unique) | ✅ | 셋 연산 |
| py-3-5 | Dictionary Mutability | ✅ | 얕은/깊은 복사 |
| py-3-6 | Set Mutability | ✅ | frozenset |

### Chapter 4: 함수 (5개) — ⚠️ 부분 지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-4-1 | Function Basics | ✅ | - |
| py-4-2 | Arguments & Return | ⚠️ | *args, **kwargs, keyword args 처리 제한 |
| py-4-3 | Lambda Functions | ❌ | lambda 핸들러 없음 |
| py-4-4 | Modules & Imports | ⚠️ | import 시각화 제한 (외부 모듈 추적 불가) |
| py-4-5 | Return & Reference | ⚠️ | return 이벤트 미캡처 → 반환값 추적 불완전 |

### Chapter 5: OOP 기초 (4개) — ⚠️ 부분 지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-5-1 | Class & Object | ⚠️ | 클래스 본체 실행 스킵됨 |
| py-5-2 | Instance Attributes | ✅ | self.attr 추적 가능 |
| py-5-3 | Constructor (__init__) | ⚠️ | __init__ 내부 추적 제한적 |
| py-5-4 | Inheritance | ⚠️ | super() 추적 제한, MRO 시각화 없음 |

### Chapter 6: OOP 심화 (6개) — ⚠️ 부분 지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-6-1 | 클래스 정의 | ⚠️ | 클래스 변수 생성 과정 안 보임 (본체 스킵) |
| py-6-2 | __init__과 self | ⚠️ | __new__ vs __init__ 구분 불가 |
| py-6-3 | 인스턴스 변수 | ✅ | 인스턴스 격리 추적 가능 |
| py-6-4 | 클래스 변수 공유 함정 | ⚠️ | 클래스 변수 뮤터블 공유 시각화 제한 |
| py-6-5 | 메서드 바인딩 | ⚠️ | bound method 객체 추적 제한 |
| py-6-6 | 추가 레슨 | ⚠️ | - |

### Chapter 7: 메모리/GC (4개) — ⚠️ 부분 지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-7-1 | 참조 카운팅 | ⚠️ | sys.getrefcount() 시각화 제한 |
| py-7-2 | del 키워드 | ⚠️ | del 후 객체 소멸 시각화 불완전 |
| py-7-3 | 순환 참조 | ⚠️ | 순환 감지 시각화 없음 |
| py-7-4 | 가비지 컬렉터 | ❌ | gc 모듈 호출 추적 불가 |

### Chapter 8: 이터레이터/제너레이터 (4개) — ❌ 미지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-8-1 | 이터레이터 프로토콜 | ❌ | __iter__/__next__ 추적 불가 (클래스 본체 스킵) |
| py-8-2 | 제너레이터 함수 | ❌ | yield 후 재진입 추적 불가 |
| py-8-3 | 제너레이터 표현식 | ❌ | 제너레이터 객체 내부 추적 불가 |
| py-8-4 | itertools | ❌ | 내장 모듈 추적 불가 |

### Chapter 9: 클로저/데코레이터 (4개) — ❌ 미지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-9-1 | 클로저 | ⚠️ | cell 객체 시각화 불완전, nonlocal 부분 구현 |
| py-9-2 | 데코레이터 | ❌ | 데코레이터 핸들러 없음 |
| py-9-3 | 인자있는 데코레이터 | ❌ | 3단 중첩 추적 불가 |
| py-9-4 | 클래스 데코레이터 | ❌ | __call__ 추적 불가 |

### Chapter 10: 동시성/비동기 (4개) — ❌ 미지원

| 레슨 | 제목 | 상태 | 미지원 요소 |
|------|------|------|------------|
| py-10-1 | GIL | ❌ | 개념적 — 시각화 불가 |
| py-10-2 | 스레딩 vs 멀티프로세싱 | ❌ | 멀티프로세스 추적 불가 |
| py-10-3 | asyncio 기초 | ❌ | async/await 이벤트 훅 없음 |
| py-10-4 | asyncio.gather | ❌ | 동시 실행 시각화 불가 |

---

## 5. 요약 통계

| 상태 | 레슨 수 | 비율 |
|------|---------|------|
| ✅ 완전 지원 | 19 | 41% |
| ⚠️ 부분 지원 | 15 | 33% |
| ❌ 미지원 | 12 | 26% |
| **합계** | **46** | **100%** |

---

## 6. 업그레이드 전략: 3단계 접근

### Phase 1: debugger_agent.py 강화 (ROI 최고)

**목표**: 부분 지원 15개 → 완전 지원으로 업그레이드

| 작업 | 효과 | 난이도 |
|------|------|--------|
| `return` 이벤트 캡처 추가 | 반환값 추적 가능 → py-4-5 완전 지원 | 낮음 |
| `exception` 이벤트 캡처 | try/except 흐름 추적 | 낮음 |
| 클래스 본체 tracing 활성화 | 클래스 변수 시각화 → py-5-1, py-6-1~6-5 완전 지원 | 중간 |
| `__iter__`/`__next__` 추적 | 이터레이터 프로토콜 → py-8-1 지원 | 중간 |

**예상 결과**: ⚠️ 15개 중 ~10개 → ✅ 완전 지원

### Phase 2: 핸들러 추가/강화

**목표**: 누락된 문법 요소 커버

| 핸들러 | 대상 레슨 | 난이도 |
|--------|----------|--------|
| LambdaHandler | py-4-3 | 낮음 |
| DecoratorHandler | py-9-2, py-9-3, py-9-4 | 중간 |
| ArgsKwargsHandler | py-4-2 | 낮음 |
| nonlocal 완전 구현 | py-9-1 | 중간 |
| 표현식 평가기 강화 | 여러 레슨 | 중간 |

**예상 결과**: ❌ 12개 중 ~5개 → ✅ 완전 지원

### Phase 3: 고급 기능

**목표**: generator, async 등 최고난도 기능

| 작업 | 대상 레슨 | 난이도 | 접근법 |
|------|----------|--------|--------|
| generator/yield 추적 | py-8-2, py-8-3 | 높음 | generator protocol 래핑 |
| itertools 시각화 | py-8-4 | 중간 | conceptual 시각화 |
| GIL 시각화 | py-10-1 | 중간 | 개념적 애니메이션 |
| async/await | py-10-3, py-10-4 | 높음 | event loop 시뮬레이션 |
| threading | py-10-2 | 높음 | 개념적 시각화 |

**Ch10 참고**: GIL/threading/async는 본질적으로 시각화가 어려운 주제. conceptual 방식(사전 스크립팅)이 더 효과적일 수 있음.

---

## 7. Phase별 예상 커버리지

| Phase | 완전 지원 | 부분 지원 | 미지원 | 커버율 |
|-------|----------|----------|--------|--------|
| 현재 | 19 | 15 | 12 | 41% |
| Phase 1 완료 후 | 29 | 10 | 7 | 63% |
| Phase 2 완료 후 | 37 | 5 | 4 | 80% |
| Phase 3 완료 후 | 42+ | 2~4 | 0~2 | 91%+ |

**참고**: Ch10 (동시성) 4개 레슨은 Playground보다 Lesson 모드(사전 스크립팅)가 더 적합할 수 있음. 이 경우 실질 커버율은 42/42 = 100% (동시성 제외).

---

## 8. 파일 구조 (현재 → 예상 변경)

```
packages/backend/src/modules/simulators/python/
├── agent/
│   └── debugger_agent.py          ← Phase 1에서 대폭 수정
├── engine/
│   └── debugger-client.ts
├── handlers/
│   ├── index.ts                   ← 새 핸들러 등록
│   ├── assign.handler.ts
│   ├── attribute.handler.ts
│   ├── builtin.handler.ts
│   ├── class-def.handler.ts       ← Phase 1에서 수정
│   ├── function-call.handler.ts   ← Phase 2에서 수정
│   ├── function-def.handler.ts    ← Phase 2에서 수정
│   ├── global.handler.ts          ← Phase 2에서 수정 (nonlocal)
│   ├── instance-create.handler.ts
│   ├── method-call.handler.ts
│   ├── print.handler.ts
│   └── return.handler.ts
│   ├── lambda.handler.ts          ← Phase 2 신규
│   ├── decorator.handler.ts       ← Phase 2 신규
│   └── args-kwargs.handler.ts     ← Phase 2 신규
├── python-simulation.service.ts
├── routes.ts
└── types.ts
```
