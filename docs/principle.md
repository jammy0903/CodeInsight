# CodeInsight Playground 시뮬레이터 원리

## 개요

Playground 모드는 사용자가 입력한 코드를 **실제 실행**하면서 매 라인마다 메모리 상태를 캡처하여 시각화하는 시스템이다. 4개 언어(C, Python, JavaScript, Java) 모두 동일한 파이프라인 구조를 따르되, 실행/추적 메커니즘만 언어별로 다르다.

---

## 공통 파이프라인 (10단계)

```
사용자 코드 입력
    ↓
① API 수신 (POST /api/v1/simulators/{lang}/simulate)
    ↓
② 보안 검증 (위험 패턴 차단)
    ↓
③ 임시 파일 생성 (/tmp/{lang}/{UUID}/main.{ext})
    ↓
④ 컴파일 (C: GCC, Java: javac) 또는 생략 (Python, JS)
    ↓
⑤ 실행 + 라인별 추적 (언어별 메커니즘)
    ↓
⑥ 스냅샷 수집 (매 라인: 변수, 메모리, 콜스택)
    ↓
⑦ 후처리 (빈 라인 제거, 라인 번호 조정)
    ↓
⑧ 임시 파일 삭제 (finally 블록)
    ↓
⑨ 프론트엔드 변환 (스냅샷 → LessonStep[])
    ↓
⑩ 시각화 렌더링 (ReferenceGraphView)
```

---

## ① API 수신

각 언어별 Fastify 라우트가 등록되어 있다.

| 언어 | 엔드포인트 | 등록 위치 |
|------|-----------|----------|
| C | `POST /api/v1/simulators/c/simulate` | `app.ts` |
| Python | `POST /api/v1/simulators/python/simulate` | `app.ts` |
| JavaScript | `POST /api/v1/simulators/javascript/simulate` | `app.ts` |
| Java | `POST /api/v1/simulators/java/simulate` | `app.ts` |

**요청 형태:**
```json
{ "code": "사용자가 입력한 소스 코드" }
```

**응답 형태:**
```json
{
  "success": true,
  "steps": [
    { "line": 3, "stack": [...], "heap": [...], "stdout": "..." },
    ...
  ]
}
```

모든 언어가 요청마다 **새 서비스 인스턴스**를 생성한다 (Stateless). 동시 요청 간 상태 공유 없음.

---

## ② 보안 검증

시뮬레이터는 사용자 코드를 **실제 실행**하므로 보안이 핵심이다.

### C
- 위험 시스템 콜 차단: `system()`, `exec()`, `fork()`, `popen()`
- 파일 I/O 차단: `fopen()`, `fwrite()` 등
- 네트워크 차단: `socket()`, `connect()`

### Python
- `subprocess`, `os.system()`, `os.popen()` 차단
- `eval()`, `exec()`, `__import__()` 차단
- 파일 쓰기: `open(..., 'w')`, `open(..., 'a')` 차단
- `shutil.rmtree()` 차단

### JavaScript
- 19개 위험 패턴 정규식 검사
- `require('fs')`, `require('net')`, `require('http')` 차단
- `eval()`, `new Function()`, `import()` 차단
- `process.exit()`, `process.env`, `global` 접근 차단
- **추가 제한**: 코드 길이 10,000자, 500줄 상한
- 구문 검증: `new Function(code)`로 파싱 테스트

### Java
- JDI가 별도 JVM에서 실행하므로 프로세스 격리로 보안 확보
- 별도 패턴 검증 없음

---

## ③ 임시 파일 생성

| 언어 | 경로 | 파일명 |
|------|------|--------|
| C | `/tmp/c/{UUID}/` | `main.c` |
| Python | `/tmp/python/{UUID}/` | `main.py` |
| JavaScript | `/tmp/js-sim-{UUID}/` | `main.js` |
| Java | `/tmp/java-sim-{UUID}/` | `Main.java` |

**Java 특수 처리 — 코드 래핑:**
사용자가 클래스 없이 코드만 입력하면 자동으로 `Main` 클래스로 감싼다:
```java
import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        // 사용자 코드가 여기에 삽입됨
    }
}
```
이때 **LINE_OFFSET = 7**이 기록되어 후처리 단계에서 라인 번호를 보정한다.

---

## ④ 컴파일

### C — GCC
```bash
gcc -g -o main main.c    # -g: 디버그 심볼 포함 (GDB 필수)
```

### Java — javac
```bash
javac -g -encoding UTF-8 -d "{path}" Main.java
# -g: 디버그 정보 포함 (JDI가 변수명/라인 번호 읽기 위해 필수)
# -encoding UTF-8: 한글 깨짐 방지
```

### Python, JavaScript
컴파일 단계 없음. 인터프리터/VM이 직접 실행.

---

## ⑤ 실행 + 라인별 추적 (핵심 차이점)

이 단계가 4개 언어의 가장 큰 차이다. 각각 완전히 다른 메커니즘을 사용한다.

### C — GDB/MI (Machine Interface)

```
Node.js → spawn('gdb', ['--interpreter=mi', './main'])
```

1. GDB를 MI 모드로 실행 (사람용 CLI 대신 기계용 프로토콜)
2. `break main` → `run`으로 메인 함수 진입
3. `next` (step over) 또는 `step` (step into)로 한 줄씩 실행
4. 매 라인에서 `-stack-list-variables`, `-stack-list-frames` 등으로 상태 조회
5. GDB 응답을 파싱하여 스냅샷 생성

**특징:**
- 컴파일된 바이너리를 외부 디버거로 제어
- DWARF 디버그 심볼(`-g`)이 없으면 변수명을 알 수 없음
- 포인터, 메모리 주소를 직접 조회 가능 (C의 강점)

### Python — sys.settrace()

```
Node.js → spawn('python3', ['debugger_agent.py', 'main.py'])
```

1. Python 내장 `sys.settrace(callback)` 호출
2. 인터프리터가 매 라인 실행 전 콜백 호출 (`'line'` 이벤트)
3. 콜백에서 `frame.f_locals`로 현재 스코프의 모든 변수 수집
4. 콜스택: 프레임 체인을 역으로 순회하며 수집
5. 객체 추적: `id(obj)` → hex 주소로 안정적 참조

**스냅샷 구조:**
```json
{
  "line": 3,
  "event": "STEP",
  "names": [
    { "name": "x", "scope": "global", "pointsTo": "0x001" }
  ],
  "objects": [
    { "id": "0x001", "type": "int", "value": 10, "mutable": false }
  ],
  "callStack": [
    { "functionName": "add", "depth": 1, "localNames": [...] }
  ]
}
```

**특징:**
- 인터프리터 내장 훅이라 오버헤드 최소
- `names` + `objects` 분리 구조 (참조 기반 시각화에 적합)
- 불변/가변(mutable) 구분 가능
- 컨테이너 내부 최대 50개 항목 제한

### JavaScript — VM + AST 인스트루먼트

```
Node.js → spawn('node', ['debugger_agent.js', 'main.js'])
```

1. **Acorn**으로 소스 코드를 AST로 파싱 (ES2020)
2. **acorn-walk**으로 AST를 순회하며 18종 노드에 캡처 코드 삽입
3. 변환된 코드를 `vm.createContext()` 샌드박스에서 실행
4. `__capture__(line)` 콜이 매 라인에서 호출되어 상태 수집
5. 비동기 처리: microtask(Promise) → macrotask(setTimeout) 순서

**변환 예시:**
```javascript
// 원본:
let x = 5;
x = x + 1;

// 인스트루먼트 후:
var x = 5; __capture__(1);
x = x + 1; __capture__(2);
```

**스냅샷 구조:**
```json
{
  "line": 1,
  "event": "STEP",
  "stack": [
    { "methodName": "__main__", "className": "Main", "variables": { "x": 5 } }
  ],
  "heap": [
    { "id": "@1", "address": "@1", "type": "Array", "content": "[1,2,3]", "length": 3 }
  ]
}
```

**특징:**
- 디버거 없이 코드 자체를 변형하여 추적
- `vm` 모듈로 완전 격리 (require, fs 접근 불가)
- 비동기(Promise, setTimeout) 시뮬레이션 가능
- 특수값 인코딩: `undefined` → `"@@UNDEFINED@@"`, `NaN` → `"@@NaN@@"`

### Java — JDI (Java Debug Interface)

```
Node.js → spawn('java', ['-jar', 'debugger-agent.jar', 'Main'])
```

1. Java Agent가 **JDI LaunchingConnector**로 대상 JVM 실행
2. `ClassPrepareEvent`로 Main 클래스 로드 감지
3. `StepRequest(STEP_LINE, STEP_INTO)`로 한 줄씩 진행
4. 각 `StepEvent`에서 **SnapshotMaker**가 메모리 상태 수집:
   - `frame.getValues(frame.visibleVariables())` — 지역 변수
   - `ObjectReference` → 힙 객체 (필드, 배열 요소)
5. **JsonWriter**가 수동 JSON 직렬화 (외부 라이브러리 없음)

**스냅샷 구조:**
```json
{
  "line": 8,
  "event": "STEP",
  "stack": [
    {
      "methodName": "main",
      "className": "Main",
      "variables": { "x": 10, "arr": { "type": "Reference", "id": "0x1A2", "class": "int[]" } }
    }
  ],
  "heap": [
    { "address": "0x1A2", "type": "int[]", "content": "[1, 2, 3]", "length": 3 }
  ]
}
```

**특징:**
- 별도 JVM 프로세스에서 실행 (완전 격리)
- JDI는 JVM 공식 디버그 프로토콜 (IDE 디버거와 동일 원리)
- `-g` 컴파일 필수 (디버그 심볼)
- 지연 스냅샷: 현재 라인의 상태는 **다음 라인 진입 시** 캡처 (실행 후 상태)

---

## ⑥ 스냅샷 수집 요약

| 언어 | 변수 수집 방법 | 힙 추적 | 콜스택 |
|------|--------------|---------|--------|
| C | GDB `-stack-list-variables` | GDB 메모리 조회 | GDB `-stack-list-frames` |
| Python | `frame.f_locals` | `id(obj)` → hex 매핑 | 프레임 체인 순회 |
| JS | 샌드박스 스코프 변수 | WeakMap + 카운터 (`@N`) | 수동 관리 (enter/exit) |
| Java | JDI `frame.getValues()` | `ObjectReference` | JDI 스택 프레임 |

---

## ⑦ 후처리

모든 언어 공통:

1. **빈 라인 스텝 제거**: 소스 코드에서 해당 라인이 공백만 있으면 필터링
2. **범위 밖 라인 제거**: `line < 1` 또는 `line > maxLine`인 스텝 제거
3. **소스 코드 추가**: 각 스텝에 `code` 필드 추가 (라인 번호 → 소스 텍스트)
4. **ERROR 이벤트 분리**: 에러 스냅샷은 별도 처리

**Java 추가 처리:**
- `LINE_OFFSET` 보정: 자동 래핑된 경우 라인 번호에서 7을 빼서 사용자 코드 기준으로 조정

**JavaScript 추가 처리:**
- 정규화(Normalization): 연속 스냅샷 간 diff를 계산하여 `SimulatorEvent[]` 생성
  - `variable declare/assign/destroy`
  - `frame push/pop`
  - `scope enter/exit`
  - `object create/update/destroy`

---

## ⑧ 임시 파일 삭제

```typescript
// 모든 언어 동일 패턴 (finally 블록)
finally {
  await fileManager.cleanup();  // fs.rm(projectPath, { recursive: true })
}
```

성공/실패 무관하게 **항상 실행**. 디스크 누적 방지.

---

## ⑨ 프론트엔드 변환

각 언어의 시뮬레이터 클라이언트가 백엔드 응답을 `LessonStep[]`로 변환한다.

| 언어 | 변환 파일 | 핵심 필드 매핑 |
|------|----------|--------------|
| C | `cSimulator.ts` | `stack` → `memoryState.stack`, `heap` → `memoryState.heap` |
| Python | `pythonSimulator.ts` | `names` → `pyNames`, `objects` → `pyObjects` |
| JS | `jsSimulator.ts` | `stack`, `heap` 직접 매핑 |
| Java | `javaSimulator.ts` | `stack` → `memoryState.stack`, `heap` → `memoryState.heap` |

**공통 필드:**
```typescript
interface LessonStep {
  line: number;                    // 실행된 라인 번호
  code: string;                    // 해당 라인의 소스 코드
  explanation: string;             // Playground에서는 빈 문자열
  visualizationType: string;       // 'c' | 'python' | 'javascript' | 'java'
  stdout?: string;                 // console.log/print 출력
  // + 언어별 메모리 데이터
}
```

---

## ⑩ 시각화 렌더링

모든 언어가 최종적으로 **ReferenceGraphView** 컴포넌트로 렌더링된다.

- **스택 영역**: 함수 프레임 → 지역 변수 → 값 또는 참조 화살표
- **힙 영역**: 객체, 배열, 문자열 등 참조 타입
- **출력 영역**: stdout 누적 표시
- **코드 하이라이트**: 현재 실행 라인 강조

---

## 실행 제약 조건

| 항목 | C | Python | JavaScript | Java |
|------|---|--------|-----------|------|
| 타임아웃 | 10초 | 10초 | 10초 | 10초 |
| 최대 스텝 | - | - | 1,000 | - |
| 코드 길이 | - | - | 10,000자 | - |
| 코드 줄 수 | - | - | 500줄 | - |
| 힙 깊이 | - | 컨테이너 50항목 | 3레벨 | - |

---

## 에러 처리 흐름

```
컴파일 에러 (C, Java)     →  { success: false, error: "Compilation Error: ..." }
보안 차단 (전체)           →  { success: false, error: "위험한 코드가 감지되었습니다" }
런타임 에러 (전체)         →  { success: false, error: "ReferenceError: x is not defined" }
타임아웃 (전체)           →  { success: false, error: "시간 초과 (10초)" }
최대 스텝 초과 (JS)       →  { success: false, error: "무한 루프가 있는지 확인해주세요" }
```

**공통 원칙**: 재시도 없음. 에러 즉시 반환. 빠른 피드백 우선.

---

## Lesson 모드와의 차이

| 항목 | Playground | Lesson |
|------|-----------|--------|
| 코드 실행 | 실제 실행 | 실행 안 함 |
| 데이터 출처 | 시뮬레이터가 동적 생성 | JSON에 사전 작성 |
| 설명(explanation) | 없음 (빈 문자열) | JSON에 포함 |
| 시각화 데이터 | 자동 수집 | 수동 작성 |
| 보안 위험 | 있음 (격리 필요) | 없음 |
| 응답 속도 | 느림 (실행 필요) | 빠름 (DB 조회만) |

---

## 파일 위치 총정리

### 백엔드 시뮬레이터

```
packages/backend/src/modules/simulators/
├── c/
│   ├── routes.ts                    # API 엔드포인트
│   ├── simulator.ts                 # 메인 서비스 (regex 기반)
│   └── engine/
│       ├── gdb-tracer.ts           # GDB/MI 통신
│       └── file-manager.ts         # 임시 파일 관리
├── python/
│   ├── routes.ts
│   ├── python-simulation.service.ts # 메인 서비스
│   ├── agent/
│   │   └── debugger_agent.py       # sys.settrace() 트레이서
│   └── engine/
│       ├── debugger-client.ts      # Python 프로세스 관리
│       └── file-manager.ts
├── javascript/
│   ├── routes.ts
│   ├── javascript-simulation.service.ts
│   ├── agent/
│   │   └── debugger_agent.js       # AST 인스트루먼트 + VM 실행
│   ├── engine/
│   │   ├── debugger-client.ts
│   │   └── file-manager.ts
│   └── normalizer/
│       └── js-snapshot-normalizer.ts  # diff 기반 이벤트 생성
└── java/
    ├── routes.ts
    ├── java-simulation.service.ts
    ├── agent/src/main/java/com/vis/
    │   ├── DebuggerAgent.java      # JDI 이벤트 루프
    │   ├── SnapshotMaker.java      # 메모리 상태 캡처
    │   └── JsonWriter.java         # JSON 직렬화
    ├── engine/
    │   ├── compiler.ts             # javac 래퍼
    │   ├── debugger-client.ts
    │   └── file-manager.ts
    └── normalizer/
        └── java-event-normalizer.ts
```

### 프론트엔드 시뮬레이터 클라이언트

```
packages/frontend/src/services/simulator/
├── index.ts                # 언어별 라우팅
├── cSimulator.ts           # C API 호출 + 변환
├── pythonSimulator.ts      # Python API 호출 + 변환
├── jsSimulator.ts          # JS API 호출 + 변환
└── javaSimulator.ts        # Java API 호출 + 변환
```
