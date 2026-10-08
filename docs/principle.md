# CodeInsight Playground 시뮬레이터 원리

## 개요

Playground 모드는 사용자가 입력한 코드를 **실제 실행**하면서 매 라인마다 메모리 상태를 캡처하여 시각화하는 시스템이다. 4개 언어(C, Python, JavaScript, Java) 모두 동일한 파이프라인 구조를 따르되, 실행/추적 메커니즘만 언어별로 다르다.

---

## 공통 파이프라인 (10단계)

```
사용자 코드 입력
    ↓
① API 수신 (POST /api/v1/simulators/{lang}/…)
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
⑩ 시각화 렌더링 (언어·개념별 뷰)
```

---

## ① API 수신

각 언어별 Fastify 라우트가 `app.ts`에 등록되어 있다. 모든 API에 IP당 분당 100회 rate limit이 걸린다.

| 언어 | 단계 추적 엔드포인트 | 요청 본문 |
|------|---------------------|-----------|
| C | `POST /api/v1/simulators/c/trace` | `{ code, stdin? }` |
| Python | `POST /api/v1/simulators/python/simulate` | `{ code }` |
| JavaScript | `POST /api/v1/simulators/javascript/simulate` | `{ code }` |
| Java | `POST /api/v1/simulators/java/simulate` | `{ sourceCode }` |

C의 `POST /c/simulate`는 단계 추적 없이 컴파일·실행 결과(stdout, exit code)만 돌려준다.

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

### JavaScript — V8 Inspector (기본 엔진)

```
Node.js → spawn('node', ['--inspect-brk=0', 'main.js'])  → WebSocket으로 Inspector 연결
```

1. 사용자 코드를 `main.js`로 저장하고 `node --inspect-brk=0`으로 실행 (첫 줄에서 정지)
2. 출력된 `ws://` 주소로 Inspector에 연결 (Node 22의 global `WebSocket` 사용)
3. `Runtime.enable`, `Debugger.enable` 후 `Debugger.stepInto` / `stepOver`로 한 단계씩 진행
4. `Debugger.paused` 이벤트마다 콜 프레임과 `Runtime.getProperties`로 스코프 변수를 읽어 스냅샷 생성
5. 스냅샷에 개념별 상태를 덧붙인다
   - `event-loop-state-tracker` → `eventLoopState` (Call Stack, Web APIs, Task/Microtask Queue)
   - `scope-state-tracker`, `this-state-tracker`, `prototype-state-tracker`

**특징:**
- 코드를 변형하지 않고 실제 V8 디버거로 추적
- 스텝 상한 초과 시 `MAX_STEPS_EXCEEDED` 에러
- 비동기 콜백이 큐에서 꺼내져 실행되는 순서는 레슨에서 사전 제작 데이터(`eventLoopState`)로 보여준다

**레거시 엔진**: `JS_SIM_ENGINE=legacy`이면 `agent/debugger_agent.js`가 Acorn으로 AST를 파싱해 `__capture__(line)` 호출을 삽입하고 `vm` 샌드박스에서 실행한다.

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

`LessonFlowVisualizer`가 언어에 맞는 뷰를 고른다 (Playground와 레슨이 같은 컴포넌트를 쓴다).

| 언어 | 주요 뷰 |
|------|---------|
| C | `CReferenceView` (스택 프레임 + 포인터 화살표), 메모리 탭, 반복문 트랙·분기 표시 |
| Python | `PythonReferenceView` (이름표 → 객체 참조 그래프) |
| Java | `JavaReferenceView` / `JavaMemoryView` (호출 스택 + 힙 객체) |
| JavaScript | `EventLoopView`, `ScopeView`, `ThisBindingView`, `PrototypeChainView`, `PromiseView` |

- **코드 하이라이트**: 현재 실행 라인 강조
- **출력 영역**: stdout 누적 표시 (`useLessonTerminal`)

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
| 데이터 출처 | 시뮬레이터가 동적 생성 | JSON에 사전 작성 (delta 형식 → 서버에서 펼침) |
| 설명(explanation) | 없음 (빈 문자열) | JSON에 포함, 시각화 위에 표시 |
| 예측 질문 | 없음 | 스텝의 `predict` 필드 |
| 시각화 데이터 | 자동 수집 | 수동 작성 |
| 보안 위험 | 있음 (프로세스 격리·제한) | 없음 |
| 응답 속도 | 느림 (실행 필요) | 빠름 (DB 조회만) |

홈 화면 데모는 두 경로의 결과를 녹화해 재생한다 (`packages/frontend/scripts/record-home-demo.mjs`).

---

## 파일 위치 총정리

### 백엔드 시뮬레이터

```
packages/backend/src/modules/simulators/
├── safe-env.ts                       # 자식 프로세스용 최소 환경변수
├── shared/gdb/                       # GDB/MI 엔진·파서·스냅샷 정규화 (C)
├── c/
│   ├── routes.ts                     # /trace, /simulate
│   ├── c-simulation.service.ts       # GDB 기반 추적 서비스
│   ├── engine/                       # c-compiler, c-gdb-client, c-file-manager
│   ├── executor/                     # 실행 전용 (/simulate) + 보안 검사
│   └── services/emscripten-validator.service.ts
├── python/
│   ├── routes.ts
│   ├── python-simulation.service.ts
│   ├── agent/debugger_agent.py       # sys.settrace() 트레이서
│   └── engine/                       # debugger-client, file-manager
├── javascript/
│   ├── routes.ts
│   ├── javascript-simulation.service.ts
│   ├── engine/
│   │   ├── inspector-runner.ts       # node --inspect-brk 실행
│   │   ├── inspector-client.ts       # Inspector WebSocket 클라이언트
│   │   ├── inspector-snapshot-builder.ts
│   │   └── *-state-tracker.ts        # event loop / scope / this / prototype
│   ├── agent/debugger_agent.js       # 레거시 AST 엔진
│   └── normalizer/
└── java/
    ├── routes.ts
    ├── java-simulation.service.ts
    ├── agent/src/main/java/com/vis/  # DebuggerAgent, SnapshotMaker, JsonWriter (JDI)
    ├── engine/                       # compiler, debugger-client, file-manager, security
    └── normalizer/
```

### 프론트엔드 시뮬레이터 클라이언트

```
packages/frontend/src/services/simulator/
├── index.ts                # 언어별 라우팅
├── cSimulator.ts           # C API 호출 + 변환
├── pythonSimulator.ts      # Python API 호출 + toPythonLessonSteps
├── jsSimulator.ts          # JS API 호출 + toJsLessonSteps
└── javaSimulator.ts        # Java API 호출 + 변환
```
