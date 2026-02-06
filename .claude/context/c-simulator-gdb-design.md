# C Simulator GDB/MI 기반 재설계

> **목적**: 현재 regex 기반 C 시뮬레이터를 GDB/MI 기반으로 교체하여 C 언어 전체 문법 커버리지 달성
> **작성일**: 2026-02-06
> **상태**: 설계 단계

---

## 1. 왜 GDB/MI인가?

### 현재 시뮬레이터의 한계

```
사용자 코드 → [regex 패턴 매칭] → 핸들러 실행 → Step 생성
                    ↑
             여기가 병목
             (if/for/while/재귀 불가)
```

| 문제 | 원인 |
|------|------|
| 제어 흐름 불가 | 라인별 regex로는 분기/반복 실행 순서를 결정할 수 없음 |
| 코딩 스타일 취약 | `int x=10;` vs `int x = 10;` 같은 변형에 깨짐 |
| 재귀 불가 | 함수 재진입 로직 없음 |
| 전처리기 미지원 | 매크로 치환을 직접 구현 불가 |
| 커버리지 | 44개 레슨 중 ~28개만 Playground에서 재현 가능 |

### GDB/MI 방식의 이점

```
사용자 코드 → [gcc -g 컴파일] → 바이너리 → [GDB 스텝 실행] → 변수/메모리 추출 → Step 생성
                  ↑                              ↑
           세계 표준 C 파서                  디버그 심볼 기반
           (모든 문법 지원)                  (코딩 스타일 무관)
```

| 항목 | 현재 (regex) | GDB/MI |
|------|:---:|:---:|
| if/else | X | O |
| for/while | X | O |
| 재귀 | X | O |
| 전처리기 (#define) | X | O (gcc가 처리) |
| 다양한 코딩 스타일 | 취약 | 무관 |
| 에러 메시지 품질 | 자체 메시지 | gcc 표준 에러 |
| 레슨 커버리지 | ~28/44 | **44/44** |

---

## 2. 전체 아키텍처

```
┌──────────────────────────────────────────────────────────────────┐
│                         Frontend (변경 없음)                      │
│  CMemoryView.tsx ← 동일한 Step[], MemoryBlock[] 인터페이스       │
└──────────────────┬───────────────────────────────────────────────┘
                   │ POST /api/v1/simulators/c/trace
                   │ { code: string, stdin?: string }
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│                     Backend Route (변경 최소)                     │
│  routes.ts → 기존 엔드포인트 유지                                 │
│  ├─ POST /trace     → GDB 기반 트레이싱                          │
│  ├─ POST /simulate  → 기존 gcc 실행 유지                         │
│  └─ POST /judge     → 기존 gcc 실행 유지                         │
└──────────────────┬───────────────────────────────────────────────┘
                   ↓
┌──────────────────────────────────────────────────────────────────┐
│               GdbTracer (새로 구현)                                │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │ SecurityCheck│→│ GccCompiler  │→│ GdbSession              │  │
│  │ (기존 재사용) │  │ gcc -g -O0   │  │ gdb --interpreter=mi   │  │
│  └─────────────┘  └──────────────┘  │                         │  │
│                                      │  ┌───────────────────┐ │  │
│                                      │  │ StepCollector     │ │  │
│                                      │  │ - 매 스텝마다:     │ │  │
│                                      │  │   · 현재 라인      │ │  │
│                                      │  │   · 로컬 변수      │ │  │
│                                      │  │   · 스택 프레임    │ │  │
│                                      │  │   · 힙 상태       │ │  │
│                                      │  │   · stdout        │ │  │
│                                      │  └───────────────────┘ │  │
│                                      │                         │  │
│                                      │  ┌───────────────────┐ │  │
│                                      │  │ HeapTracker       │ │  │
│                                      │  │ - malloc BP       │ │  │
│                                      │  │ - free BP         │ │  │
│                                      │  │ - 블록 추적       │ │  │
│                                      │  └───────────────────┘ │  │
│                                      └─────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ StepBuilder                                                 │  │
│  │ GDB 출력 → 기존 Step/MemoryBlock 포맷으로 변환               │  │
│  │ (프론트엔드 호환성 100% 유지)                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. 핵심 모듈 설계

### 3.1 GdbSession — GDB 프로세스 관리

```typescript
// packages/backend/src/modules/simulators/c/gdb/gdb-session.ts

class GdbSession {
  private process: ChildProcess;
  private commandQueue: Queue<GdbCommand>;

  // GDB 프로세스 시작
  async start(binaryPath: string, stdinData?: string): Promise<void>;

  // MI 명령어 전송 + 응답 대기
  async send(command: string): Promise<GdbMiResponse>;

  // 주요 명령어 래퍼
  async setBreakpoint(location: string): Promise<void>;
  async stepLine(): Promise<StepResult>;           // -exec-next (같은 프레임 내 한 줄)
  async stepInto(): Promise<StepResult>;           // -exec-step (함수 안으로)
  async getLocals(): Promise<GdbVariable[]>;       // -stack-list-locals
  async getArgs(): Promise<GdbVariable[]>;         // -stack-list-arguments
  async getFrames(): Promise<GdbFrame[]>;          // -stack-list-frames
  async readMemory(addr: string, size: number): Promise<number[]>;  // -data-read-memory-bytes
  async evaluate(expr: string): Promise<string>;   // -data-evaluate-expression

  // 정리
  async kill(): Promise<void>;

  // 타임아웃 관리
  private timeout: NodeJS.Timeout;
  private maxSteps: number;  // 무한루프 방지 (기본 1000)
}
```

### 3.2 GDB/MI 프로토콜 상세

GDB/MI는 구조화된 텍스트 프로토콜입니다:

```
# 요청 (우리 → GDB)
-exec-next                              # 한 줄 실행
-stack-list-locals --all-values         # 로컬 변수 + 값
-stack-list-frames                      # 콜 스택
-data-evaluate-expression &x            # 변수 주소
-data-read-memory-bytes 0x7fff 4        # 메모리 바이트 읽기

# 응답 (GDB → 우리)
^done,locals=[
  {name="x",type="int",value="42"},
  {name="p",type="int *",value="0x7fffffffde00"},
  {name="arr",type="int [5]",value="{1,2,3,4,5}"}
]

^done,stack=[
  frame={level="0",func="swap",file="main.c",line="5"},
  frame={level="1",func="main",file="main.c",line="15"}
]
```

### 3.3 GdbMiParser — MI 출력 파싱

```typescript
// packages/backend/src/modules/simulators/c/gdb/gdb-mi-parser.ts

class GdbMiParser {
  // MI 출력 → 구조화된 객체
  parse(rawOutput: string): GdbMiResponse;

  // 응답 타입 분류
  // ^done     → 정상 완료
  // ^error    → 에러
  // *stopped  → 실행 중단 (브레이크포인트, 스텝 완료, 시그널)
  // ~"..."    → 콘솔 출력 (stdout 캡처용)
  // @"..."    → 타겟 출력 (프로그램의 stdout)
}

// GDB/MI 응답 타입
interface GdbMiResponse {
  type: 'done' | 'error' | 'stopped' | 'running';
  data: Record<string, any>;
  console?: string;      // 프로그램 stdout
}

interface GdbVariable {
  name: string;
  type: string;
  value: string;
}

interface GdbFrame {
  level: number;
  func: string;
  file: string;
  line: number;
  addr: string;
}
```

### 3.4 HeapTracker — 동적 메모리 추적

GDB는 malloc/free를 자동 추적하지 않으므로, 브레이크포인트 기반으로 추적합니다:

```typescript
// packages/backend/src/modules/simulators/c/gdb/heap-tracker.ts

class HeapTracker {
  private blocks: Map<string, HeapBlock>;  // address → block info

  // GDB 세션에 malloc/free 브레이크포인트 설정
  async setup(session: GdbSession): Promise<void> {
    // malloc 반환 직후 중단 → 반환값(주소)과 인자(크기) 캡처
    await session.send('break malloc');
    await session.send('break free');

    // malloc 내부 진입 방지를 위해 finish로 빠져나옴
    // malloc BP hit → finish → $rax(반환값=주소), 첫째 인자(크기) 기록
    // free BP hit → 첫째 인자(주소) 기록 → 블록 제거
  }

  // malloc 브레이크포인트 히트 시
  async onMallocHit(session: GdbSession): Promise<void> {
    // 1. finish로 malloc 완료까지 실행
    await session.send('-exec-finish');
    // 2. 반환값 (할당된 주소) 가져오기
    const addr = await session.evaluate('$rax');  // x86-64 반환값 레지스터
    // 3. 인자 (요청 크기) 가져오기
    const size = await session.evaluate('$rdi');  // x86-64 첫째 인자 레지스터
    // 4. 블록 등록
    this.blocks.set(addr, { address: addr, size, freed: false });
  }

  // free 브레이크포인트 히트 시
  async onFreeHit(session: GdbSession): Promise<void> {
    const addr = await session.evaluate('$rdi');
    // 블록 해제 표시
    if (this.blocks.has(addr)) {
      this.blocks.get(addr)!.freed = true;
    }
  }

  // 현재 힙 상태 반환
  getActiveBlocks(): HeapBlock[];

  // 메모리 누수 감지 (프로그램 종료 시)
  getLeakedBlocks(): HeapBlock[];
}
```

### 3.5 StepBuilder — GDB 데이터 → 기존 Step 포맷 변환

```typescript
// packages/backend/src/modules/simulators/c/gdb/step-builder.ts

class StepBuilder {
  // GDB에서 추출한 원시 데이터를 기존 Step 인터페이스로 변환
  // *** 프론트엔드는 전혀 변경 불필요 ***

  buildStep(raw: {
    line: number;
    code: string;
    frames: GdbFrame[];
    locals: GdbVariable[];
    args: GdbVariable[];
    heapBlocks: HeapBlock[];
    stdout: string;
  }): Step {
    return {
      line: raw.line,
      code: raw.code,

      // GDB 변수 → MemoryBlock[] 변환
      stack: this.buildStackBlocks(raw.locals, raw.args, raw.frames),

      // HeapTracker 블록 → MemoryBlock[] 변환
      heap: this.buildHeapBlocks(raw.heapBlocks),

      explanation: this.generateExplanation(raw),

      // GDB에서 실제 레지스터 값 가져옴 (시뮬레이션이 아닌 진짜 값!)
      rsp: raw.frames[0]?.addr,
      rbp: undefined,  // $rbp 레지스터로 별도 쿼리 가능

      functionName: raw.frames[0]?.func,
      callDepth: raw.frames.length,
      stdout: raw.stdout,

      // 이벤트 생성 (이전 스텝과 비교하여 변경사항 감지)
      events: this.buildEvents(raw),
    };
  }

  // GDB 변수를 MemoryBlock으로 변환
  private buildStackBlocks(
    locals: GdbVariable[],
    args: GdbVariable[],
    frames: GdbFrame[]
  ): MemoryBlock[] {
    // GDB가 제공하는 정보:
    //   name: "x", type: "int", value: "42"
    //
    // 추가로 쿼리해야 하는 정보:
    //   address: -data-evaluate-expression &x
    //   bytes:   -data-read-memory-bytes <addr> <size>
    //   size:    sizeof 타입 매핑 테이블 참조
    //
    // 변환 결과:
    //   { name: "x", address: "0x7fff...", type: "int",
    //     size: 4, bytes: [42,0,0,0], value: "42", points_to: null }
  }

  // 포인터 타겟 해석
  private resolvePointerTarget(
    ptrValue: string,       // "0x7fffffffde00"
    allVars: GdbVariable[]  // 모든 변수 목록
  ): string | null {
    // 포인터 값(주소)이 어떤 변수의 주소와 일치하는지 찾기
    // → points_to 필드 설정 (프론트엔드 포인터 화살표 표시용)
  }
}
```

### 3.6 GdbTracer — 메인 오케스트레이터

```typescript
// packages/backend/src/modules/simulators/c/gdb/gdb-tracer.ts

class GdbTracer {
  private session: GdbSession;
  private heapTracker: HeapTracker;
  private stepBuilder: StepBuilder;

  async trace(code: string, stdin?: string): Promise<TraceResponse> {
    const workDir = `/tmp/gdb-trace-${uuid()}/`;

    try {
      // ──────────────────────────────────────
      // Phase 1: 보안 검사 (기존 로직 재사용)
      // ──────────────────────────────────────
      const security = checkSecurity(code);
      if (!security.safe) {
        return { success: false, error: security.reason, steps: [], source_lines: [] };
      }

      // ──────────────────────────────────────
      // Phase 2: 컴파일
      // ──────────────────────────────────────
      const sourceFile = path.join(workDir, 'main.c');
      const binaryFile = path.join(workDir, 'a.out');
      await fs.writeFile(sourceFile, code);

      const compileResult = await exec(
        `gcc -g -O0 -Wall -o ${binaryFile} ${sourceFile} 2>&1`,
        { timeout: 30000 }
      );

      if (compileResult.exitCode !== 0) {
        return {
          success: false,
          error: 'compile_error',
          details: this.parseGccErrors(compileResult.stderr),
          steps: [],
          source_lines: code.split('\n'),
        };
      }

      // ──────────────────────────────────────
      // Phase 3: GDB 세션 시작
      // ──────────────────────────────────────
      this.session = new GdbSession();
      await this.session.start(binaryFile, stdin);

      // 힙 트래커 설정 (malloc/free 브레이크포인트)
      this.heapTracker = new HeapTracker();
      await this.heapTracker.setup(this.session);

      // main에 브레이크포인트 설정
      await this.session.setBreakpoint('main');
      await this.session.send('-exec-run');

      // ──────────────────────────────────────
      // Phase 4: 스텝별 실행 + 데이터 수집
      // ──────────────────────────────────────
      const steps: Step[] = [];
      const sourceLines = code.split('\n');
      let stepCount = 0;
      const MAX_STEPS = 1000;  // 무한루프 방지

      while (stepCount < MAX_STEPS) {
        // 한 줄 실행 (함수 내부로 진입)
        const stepResult = await this.session.stepInto();

        // 프로그램 종료 체크
        if (stepResult.reason === 'exited-normally' ||
            stepResult.reason === 'exited') {
          break;
        }

        // malloc/free 브레이크포인트 히트 처리
        if (stepResult.reason === 'breakpoint-hit') {
          const func = stepResult.frame?.func;
          if (func === 'malloc' || func === 'calloc' || func === 'realloc') {
            await this.heapTracker.onMallocHit(this.session);
            continue;  // 사용자 코드가 아니므로 스텝에 추가 안 함
          }
          if (func === 'free') {
            await this.heapTracker.onFreeHit(this.session);
            continue;
          }
        }

        // 라이브러리 함수 내부는 스킵 (printf 내부 등)
        if (!stepResult.frame?.file?.includes('main.c')) {
          await this.session.send('-exec-finish');  // 함수 빠져나오기
          continue;
        }

        // 현재 상태 수집 (병렬 쿼리)
        const [locals, args, frames] = await Promise.all([
          this.session.getLocals(),
          this.session.getArgs(),
          this.session.getFrames(),
        ]);

        // 각 변수의 주소와 바이트 데이터 수집
        const enrichedLocals = await this.enrichVariables(locals);
        const enrichedArgs = await this.enrichVariables(args);

        // Step 생성
        const step = this.stepBuilder.buildStep({
          line: stepResult.frame.line,
          code: sourceLines[stepResult.frame.line - 1] || '',
          frames,
          locals: enrichedLocals,
          args: enrichedArgs,
          heapBlocks: this.heapTracker.getActiveBlocks(),
          stdout: this.session.getStdout(),
        });

        steps.push(step);
        stepCount++;
      }

      // ──────────────────────────────────────
      // Phase 5: 메모리 누수 감지
      // ──────────────────────────────────────
      const leaks = this.heapTracker.getLeakedBlocks();
      if (leaks.length > 0) {
        steps.push(this.stepBuilder.buildLeakWarningStep(leaks));
      }

      return {
        success: true,
        steps,
        source_lines: sourceLines,
        message: `Traced ${steps.length} steps`,
        warnings: leaks.length > 0
          ? [`Memory leak: ${leaks.length} block(s) not freed`]
          : undefined,
      };

    } finally {
      // 정리
      await this.session?.kill();
      await fs.rm(workDir, { recursive: true, force: true });
    }
  }

  // 변수에 주소/바이트 정보 추가
  private async enrichVariables(vars: GdbVariable[]): Promise<EnrichedVariable[]> {
    return Promise.all(vars.map(async (v) => {
      const addr = await this.session.evaluate(`(void*)&${v.name}`);
      const size = TYPE_SIZE_MAP[v.type] || 4;
      const bytes = await this.session.readMemory(addr, size);
      return { ...v, address: addr, size, bytes };
    }));
  }
}
```

---

## 4. 힙 추적 전략 상세

malloc/free는 C 표준 라이브러리 함수이므로 GDB가 자동 추적하지 않습니다.
3가지 전략 중 선택:

### 전략 A: GDB 브레이크포인트 (권장)

```
장점: 추가 의존성 없음, GDB만으로 가능
단점: 레지스터 컨벤션 의존 (x86-64 한정)

흐름:
  break malloc → hit → finish → $rax = 주소, $rdi = 크기
  break free   → hit → $rdi = 주소 → 블록 제거
```

### 전략 B: LD_PRELOAD 래퍼

```c
// heap_tracker.c (LD_PRELOAD 라이브러리)
#define _GNU_SOURCE
#include <dlfcn.h>
#include <stdio.h>

void* malloc(size_t size) {
    void* (*real_malloc)(size_t) = dlsym(RTLD_NEXT, "malloc");
    void* ptr = real_malloc(size);
    fprintf(stderr, "HEAP_ALLOC:%p:%zu\n", ptr, size);
    return ptr;
}

void free(void* ptr) {
    void* (*real_free)(void*) = dlsym(RTLD_NEXT, "free");
    fprintf(stderr, "HEAP_FREE:%p\n", ptr);
    real_free(ptr);
}
```

```
장점: 레지스터 컨벤션 독립적, 정확함
단점: 추가 .so 파일 빌드 필요, LD_PRELOAD 보안 이슈
```

### 전략 C: 코드 삽입 (하이브리드)

```
컴파일 전에 #define으로 malloc/free를 래핑:

#define malloc(s) tracked_malloc(s, __LINE__)
#define free(p)   tracked_free(p, __LINE__)

장점: 간단, 라인 번호까지 추적 가능
단점: 사용자 코드에 매크로가 이미 정의되어 있으면 충돌
```

**권장: 전략 A (GDB 브레이크포인트)**
- 추가 빌드 불필요
- Docker 이미지 변경 최소
- 충분히 정확

---

## 5. stdout 캡처 방식

### 문제

GDB 내에서 실행되는 프로그램의 stdout을 캡처해야 합니다.

### 해결

```
방법 1: GDB의 tty 리다이렉션
  (gdb) set inferior-tty /dev/pts/X
  → 프로그램 stdout을 별도 pty로 분리

방법 2: 파일 리다이렉션 (권장, 더 간단)
  (gdb) run < input.txt > output.txt 2>&1
  → 매 스텝마다 output.txt 읽어서 누적 stdout 파악

방법 3: GDB MI @"..." 출력 파싱
  → GDB/MI의 target output stream (@) 활용
  → 파싱이 까다로울 수 있음
```

**권장: 방법 2 (파일 리다이렉션)**
- 구현 가장 단순
- 매 스텝마다 파일 크기 확인 → 이전보다 커졌으면 새 출력 발생

---

## 6. 제어 흐름 처리 — 기존 시뮬레이터와의 핵심 차이

### 현재 시뮬레이터

```
라인 1 → 라인 2 → 라인 3 → ... (순차적으로만 진행)
```

### GDB 기반

```
GDB가 실제 실행 순서를 알려줌:

  main.c:3  → int x = 10;
  main.c:4  → if (x > 5) {        ← GDB가 조건 평가 후 분기
  main.c:5  →   x = x * 2;        ← true이면 여기로
  main.c:8  → for (int i = 0; ...) ← 루프 진입
  main.c:9  →   arr[i] = i;       ← 반복 1
  main.c:8  → for (int i = 0; ...) ← 조건 재평가
  main.c:9  →   arr[i] = i;       ← 반복 2
  ...
```

**우리가 할 일**: GDB가 알려주는 라인 번호 + 변수 상태를 그대로 Step으로 만들면 됨.
제어 흐름 로직을 직접 구현할 필요 없음.

---

## 7. 파일 구조 (신규 모듈)

```
packages/backend/src/modules/simulators/c/
├── gdb/                          ← 새 디렉토리
│   ├── gdb-session.ts            ← GDB 프로세스 관리 + MI 통신
│   ├── gdb-mi-parser.ts          ← MI 출력 텍스트 → 객체 파싱
│   ├── gdb-tracer.ts             ← 메인 오케스트레이터 (trace 함수)
│   ├── heap-tracker.ts           ← malloc/free 추적
│   ├── step-builder.ts           ← GDB 데이터 → Step/MemoryBlock 변환
│   ├── explanation-generator.ts  ← 교육용 설명 생성
│   └── constants.ts              ← 타입 크기 매핑, 스텝 제한 등
│
├── handlers/                     ← 기존 (레거시, 점진적 제거)
├── evaluator/                    ← 기존 (레거시, 점진적 제거)
├── runtime/                      ← 기존 (레거시, 점진적 제거)
├── simulator.ts                  ← 기존 (레거시 심볼 유지)
├── executor/                     ← 기존 유지 (/simulate, /judge용)
└── routes.ts                     ← 수정: /trace만 GDB로 전환
```

---

## 8. API 변경 사항

### 변경되는 것

```
POST /api/v1/simulators/c/trace
  - 내부 구현만 변경 (regex 시뮬레이터 → GdbTracer)
  - 입출력 인터페이스 동일
  - 프론트엔드 변경 없음
```

### 변경되지 않는 것

```
POST /api/v1/simulators/c/simulate  → 기존 gcc 실행 유지
POST /api/v1/simulators/c/judge     → 기존 gcc 실행 유지
프론트엔드 컴포넌트                   → 전혀 변경 없음
Step/MemoryBlock 인터페이스           → 동일
VisualizationEvent 인터페이스         → 동일
```

---

## 9. Docker 변경 사항

```dockerfile
# 기존 (packages/backend/Dockerfile)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3 \
    python3-pip \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

# 변경 후 — gdb 추가
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    gdb \            # ← 추가
    python3 \
    python3-pip \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*
```

gdb 패키지 크기: ~15MB (이미지 크기 영향 미미)

---

## 10. 보안 고려사항

### 기존 보안 체크 유지

```typescript
// 기존 security.ts의 FORBIDDEN_PATTERNS 그대로 사용
// gcc 컴파일 전에 소스 코드 검사
const security = checkSecurity(code);
if (!security.safe) return error;
```

### 추가 보안 대책

| 위협 | 대책 |
|------|------|
| 무한루프 | MAX_STEPS = 1000 + GDB 세션 타임아웃 (30초) |
| fork bomb | 기존 forbidden pattern으로 차단 |
| 파일시스템 접근 | 기존 forbidden pattern + /tmp 격리 |
| 네트워크 접근 | 기존 forbidden pattern |
| GDB 탈출 | GDB는 MI 모드로 실행 → 사용자 입력 없음 |
| 메모리 폭탄 | ulimit 설정 + GDB 세션 타임아웃 |

### 프로세스 격리

```bash
# GDB 실행 시 리소스 제한
timeout 30s \
  gdb --batch --interpreter=mi \
  -ex "set confirm off" \
  -ex "set pagination off" \
  -ex "set print elements 100" \      # 배열 출력 제한
  -ex "set print repeats 10" \         # 반복 출력 제한
  ./a.out
```

---

## 11. 성능 예측

| 단계 | 현재 (regex) | GDB/MI (예상) |
|------|:---:|:---:|
| 보안 검사 | ~1ms | ~1ms (동일) |
| 컴파일 | 없음 (시뮬레이션) | ~500ms (gcc -g) |
| 실행/추적 | ~50ms | ~1-3초 (GDB 스텝별) |
| **합계** | **~50ms** | **~1.5-3.5초** |

### 최적화 방안

```
1. 변수 쿼리 병렬화
   → getLocals() + getArgs() + getFrames() 동시 요청

2. 불필요한 스텝 스킵
   → 라이브러리 함수 내부 (printf, malloc) 진입 안 함
   → -exec-next (step over) vs -exec-step (step into) 사용 분기

3. 메모리 읽기 최소화
   → 변경된 변수만 바이트 데이터 갱신
   → 이전 스텝과 diff해서 변경된 것만 readMemory

4. GDB 세션 재사용 (향후)
   → 동일 사용자의 연속 요청 시 세션 풀링
```

---

## 12. 교육 설명 (explanation) 생성

현재 시뮬레이터는 핸들러 내부에서 직접 설명을 생성합니다.
GDB 방식에서는 **코드 패턴 + 상태 변화 기반**으로 설명을 생성합니다:

```typescript
// packages/backend/src/modules/simulators/c/gdb/explanation-generator.ts

class ExplanationGenerator {
  generate(
    code: string,          // 실행된 코드 라인
    prevStep: Step | null, // 이전 상태
    currStep: Step,        // 현재 상태
    events: VisualizationEvent[]
  ): string {
    // 패턴 매칭으로 설명 생성
    if (code.match(/malloc/))
      return `힙에 ${size}바이트 메모리를 할당했습니다. 주소: ${addr}`;

    if (code.match(/free/))
      return `힙 메모리(${addr})를 해제했습니다.`;

    if (events.some(e => e.type === 'frame' && e.action === 'push'))
      return `함수 ${funcName}()이 호출되어 새 스택 프레임이 생성되었습니다.`;

    if (events.some(e => e.type === 'variable' && e.action === 'assign'))
      return `변수 ${name}의 값이 ${prev} → ${curr}로 변경되었습니다.`;

    // 제어 흐름 설명 (기존에 없던 새 기능!)
    if (code.match(/if\s*\(/))
      return `조건식을 평가합니다. 결과: ${condResult ? 'true → 블록 진입' : 'false → 건너뜀'}`;

    if (code.match(/for\s*\(/))
      return `반복문 조건 확인: ${condExpr} → ${condResult ? '계속 반복' : '루프 종료'}`;

    // 기본 설명
    return `${code} 를 실행했습니다.`;
  }
}
```

---

## 13. 마이그레이션 계획

### Phase 1: 기반 구축 (1-2주)

```
[ ] gdb-session.ts — GDB 프로세스 관리 + MI 통신
[ ] gdb-mi-parser.ts — MI 출력 파서
[ ] 단위 테스트: 간단한 C 코드로 GDB 세션 생성/스텝/종료
```

### Phase 2: 핵심 트레이싱 (1-2주)

```
[ ] gdb-tracer.ts — 메인 트레이싱 루프
[ ] step-builder.ts — GDB 데이터 → Step/MemoryBlock 변환
[ ] 직선 코드(변수, 포인터, 배열) 테스트
```

### Phase 3: 힙 + 제어 흐름 (1주)

```
[ ] heap-tracker.ts — malloc/free 추적
[ ] 제어 흐름 테스트 (if/else, for, while)
[ ] 재귀 함수 테스트
```

### Phase 4: 통합 + 설명 (1주)

```
[ ] routes.ts에 GDB 트레이서 연결 (기존 시뮬레이터 대체)
[ ] explanation-generator.ts — 교육 설명 생성
[ ] 프론트엔드 호환성 검증 (기존 CMemoryView와 정상 동작 확인)
```

### Phase 5: 안정화 + Docker (1주)

```
[ ] Dockerfile에 gdb 패키지 추가
[ ] 보안 테스트 (forbidden pattern + 타임아웃)
[ ] 성능 테스트 + 최적화
[ ] 기존 시뮬레이터를 fallback으로 유지 (feature flag)
```

### 점진적 전환 전략

```typescript
// routes.ts — feature flag로 점진 전환
const USE_GDB_TRACER = process.env.USE_GDB_TRACER === 'true';

if (USE_GDB_TRACER) {
  const tracer = new GdbTracer();
  return tracer.trace(code, stdin);
} else {
  const sim = new CSimulator();
  return sim.simulate(code, stdin);
}
```

---

## 14. 리스크 및 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|:---:|:---:|------|
| GDB 응답 파싱 실패 | 중 | 높음 | MI 파서 테스트 강화 + fallback to regex 시뮬레이터 |
| 성능 저하 (3초+) | 높음 | 중 | 변수 쿼리 병렬화 + 스텝 스킵 최적화 |
| 힙 추적 부정확 | 낮음 | 중 | LD_PRELOAD 방식으로 전환 가능 |
| Docker 이미지 크기 증가 | 낮음 | 낮음 | gdb는 ~15MB (무시 가능) |
| 코드 보안 우회 | 낮음 | 높음 | 기존 보안 체크 유지 + GDB 샌드박스 |
| x86 외 아키텍처 호환성 | 낮음 | 중 | 현재 x86-64 서버만 사용, ARM 고려 시 레지스터 매핑 변경 |

---

## 15. 성공 기준

```
✅ 기존 28개 레슨 코드가 GDB 트레이서에서도 동일한 Step 출력 생성
✅ if/else, for, while, do-while 코드의 실행 순서 정확히 추적
✅ 재귀 함수 (팩토리얼, 피보나치) 스택 프레임 시각화
✅ malloc/free 힙 블록 추적 + 메모리 누수 감지
✅ 전처리기 매크로가 gcc에 의해 정상 확장 후 실행
✅ 프론트엔드 CMemoryView 컴포넌트 변경 없이 정상 렌더링
✅ 응답 시간 < 5초 (일반적인 교육용 코드 기준)
✅ 보안 테스트 통과 (fork, exec, system 등 차단)
```
