# JavaScript 시뮬레이터 V3: Inspector Protocol 기반 리팩토링 계획

> **프로젝트 코드명**: JS-SIM-V3
> **목표**: Node.js Inspector Protocol (CDP) 기반 실제 디버거로 전환
> **예상 기간**: 3-4주 (Phase별 진행)
> **현재 버전**: V2 (AST 계측 + vm 모듈)
> **목표 버전**: V3 (Inspector Protocol + 실제 디버깅)
> **문서 버전**: 2.0 (이슈 반영 완료)

---

## 📋 목차

1. [Executive Summary](#1-executive-summary)
2. [현재 문제점 분석](#2-현재-문제점-분석)
3. [기술 스택 및 API 선정](#3-기술-스택-및-api-선정)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [세부 구현 계획](#5-세부-구현-계획)
6. [타입 정의](#6-타입-정의)
7. [교육 범위 정의](#7-교육-범위-정의)
8. [테스트 전략](#8-테스트-전략)
9. [마이그레이션 계획](#9-마이그레이션-계획)
10. [리스크 및 대응책](#10-리스크-및-대응책)

---

## 1. Executive Summary

### 1.1 배경
현재 JavaScript 시뮬레이터(V2)는 AST 기반 정적 분석으로 라인별 `__capture__()` 호출을 삽입하는 방식입니다.
이 방식은 **루프에서 순서 반복**, **조건문에서 스킵** 등의 문제가 발생합니다.

### 1.2 해결책
Node.js Inspector Protocol (Chrome DevTools Protocol과 호환)을 사용하여 **실제 런타임 디버깅**을 수행합니다.
Java의 JDI, Python의 `sys.settrace()`와 동일한 수준의 정확도를 달성합니다.

### 1.3 핵심 성과 지표
| 지표 | V2 (현재) | V3 (목표) |
|------|----------|----------|
| 실행 순서 정확도 | ~70% | 100% |
| 루프 순서 정확도 | ~50% | 100% |
| 조건문 분기 추적 | 부분적 | 완전 |
| 비동기 코드 지원 | 불완전 | 동기 코드만 (교육 범위) |
| 지원 문법 범위 | 제한적 | ES2020+ |

---

## 2. 현재 문제점 분석

### 2.1 V2 구현 방식
```
원본 코드 → AST 파싱 → __capture__() 삽입 → vm.runInContext() → 스냅샷 수집
```

**파일 위치**: `packages/backend/src/modules/simulators/javascript/agent/debugger_agent.js`

### 2.2 핵심 문제

#### 문제 1: 루프에서 순서 반복
```javascript
// 원본
for (let i = 0; i < 3; i++) {  // Line 1
  console.log(i);               // Line 2
}

// V2 결과: 1→2→1→2→1→2 (for문 조건도 매번 캡처됨)
// 기대 결과: 1→2→1→2→1→2 (OK지만, 변수 상태가 혼란스러움)
```

#### 문제 2: 조건문 스킵
```javascript
if (x > 5) {        // Line 1
  y = 10;           // Line 2 (false면 캡처 안됨)
}
console.log(y);     // Line 3

// V2 결과: 1→3 (Line 2 스킵)
// 기대 결과: 1→3 (OK지만, 사용자에게 혼란)
```

#### 문제 3: 객체 리터럴 내부 캡처 오류
```javascript
const obj = {
  name: "John",     // 캡처되면 안 됨
  age: 20           // 캡처되면 안 됨
};
```

### 2.3 근본 원인
**정적 분석(AST)으로는 런타임 제어 흐름을 정확히 예측할 수 없음**

---

## 3. 기술 스택 및 API 선정

### 3.1 Inspector Protocol 개요

Node.js는 V8 Inspector Protocol을 내장하고 있으며, 이는 Chrome DevTools Protocol (CDP)과 호환됩니다.

```
+-------------------+        WebSocket        +--------------------+
|  Target Process   | ←-------------------→  |  Debugger Client   |
|  (node --inspect) |    ws://127.0.0.1:9229 |  (우리가 구현)      |
+-------------------+                        +--------------------+
         ↓                                            ↓
   Debugger.paused                            stepInto/stepOver
   CallFrame, Scope                           Runtime.getProperties
```

### 3.2 핵심 CDP 도메인 및 메서드

#### Debugger 도메인
| 메서드 | 용도 |
|--------|------|
| `Debugger.enable` | 디버거 활성화 |
| `Debugger.setBreakpointByUrl` | 특정 라인에 브레이크포인트 설정 |
| `Debugger.setBreakpoint` | scriptId 기반 브레이크포인트 설정 |
| `Debugger.stepInto` | 다음 문장으로 이동 (함수 진입) |
| `Debugger.stepOver` | 다음 문장으로 이동 (함수 스킵) |
| `Debugger.resume` | 실행 재개 |
| `Debugger.evaluateOnCallFrame` | 콜프레임에서 표현식 평가 |
| `Debugger.setAsyncCallStackDepth` | 비동기 콜스택 깊이 설정 |

#### Debugger 이벤트
| 이벤트 | 용도 |
|--------|------|
| `Debugger.paused` | 브레이크포인트/스텝에서 일시정지 |
| `Debugger.scriptParsed` | 스크립트 파싱 완료 (scriptId 획득) |
| `Debugger.resumed` | 실행 재개됨 |

#### Runtime 도메인
| 메서드 | 용도 |
|--------|------|
| `Runtime.enable` | Runtime 도메인 활성화 |
| `Runtime.getProperties` | 객체의 속성(변수) 조회 |
| `Runtime.evaluate` | 표현식 평가 |
| `Runtime.runIfWaitingForDebugger` | --inspect-brk 후 실행 시작 |

#### Runtime 이벤트
| 이벤트 | 용도 |
|--------|------|
| `Runtime.consoleAPICalled` | console.log 등 호출 감지 |
| `Runtime.exceptionThrown` | 예외 발생 감지 |

### 3.3 라이브러리 선정

#### 옵션 A: `chrome-remote-interface` (채택)
```bash
npm install chrome-remote-interface
npm install --save-dev @types/chrome-remote-interface
```
- ✅ 가장 널리 사용되는 CDP 클라이언트
- ✅ 완전한 CDP 지원
- ✅ TypeScript 타입 정의 제공
- ✅ 활발한 유지보수

#### 옵션 B: `node:inspector` 내장 모듈
```javascript
const inspector = require('node:inspector');
```
- ✅ 외부 의존성 없음
- ❌ 저수준 API (구현 복잡)
- ❌ 별도 프로세스 디버깅에 제한적

#### 결정: `chrome-remote-interface` 사용

### 3.4 기술 스택 요약

```yaml
Runtime: Node.js 18+ (LTS)
Language: TypeScript 5.x
Debugger Protocol: Chrome DevTools Protocol (CDP)
CDP Client: chrome-remote-interface
Process Management: child_process.spawn
IPC: WebSocket (ws://127.0.0.1:random_port)
```

---

## 4. 아키텍처 설계

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    JavaScript Simulator V3                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ FileManager      │    │ InspectorClient                   │  │
│  │                  │    │                                   │  │
│  │ - createProject  │    │ - connect(port)                   │  │
│  │ - writeSource    │    │ - enableDebugger()                │  │
│  │ - cleanup        │    │ - waitForScript()                 │  │
│  └────────┬─────────┘    │ - setBreakpointOnFirstLine()      │  │
│           │              │ - stepInto()                      │  │
│           │              │ - captureSnapshot()               │  │
│           ▼              │ - onPaused(callback)              │  │
│  ┌──────────────────┐    │ - onConsoleAPICalled(callback)    │  │
│  │ ProcessManager   │◄───└───────────────┬───────────────────┘  │
│  │                  │                    │                      │
│  │ - spawn()        │    WebSocket       │                      │
│  │ - getPort()      │    ws://127.0.0.1:{port}                  │
│  │ - kill()         │                                           │
│  └────────┬─────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                           │
│  │ SnapshotBuilder  │                                           │
│  │                  │                                           │
│  │ - buildStack()   │                                           │
│  │ - buildHeap()    │                                           │
│  │ - formatOutput() │                                           │
│  └──────────────────┘                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 디렉토리 구조

```
packages/backend/src/modules/simulators/javascript/
├── index.ts                           # 라우터 (기존 유지)
├── routes.ts                          # Express 라우트 (기존 유지)
├── javascript-simulation.service.ts   # 메인 서비스 (V3로 교체)
│
├── engine/                            # 코어 엔진
│   ├── file-manager.ts                # 임시 파일 관리 (기존 유지)
│   ├── process-manager.ts             # 노드 프로세스 관리 (신규)
│   ├── inspector-client.ts            # CDP 클라이언트 (신규)
│   └── snapshot-builder.ts            # 스냅샷 생성 (신규)
│
├── types/                             # 타입 정의 (신규)
│   ├── cdp.ts                         # CDP 관련 타입
│   ├── snapshot.ts                    # 스냅샷 타입
│   ├── errors.ts                      # 에러 코드 정의
│   └── index.ts                       # 타입 re-export
│
├── agent/                             # 레거시 (V2) - 추후 삭제
│   └── debugger_agent.js              # 기존 AST 계측 에이전트
│
└── __tests__/                         # 테스트
    ├── inspector-client.test.ts
    ├── snapshot-builder.test.ts
    └── integration.test.ts
```

### 4.3 실행 흐름

```
1. 요청 수신 (/api/v1/simulators/javascript/simulate)
        │
        ▼
2. validateCode(code)
   → 보안 검증 (12개 위험 패턴)
   → 길이 검증 (10000자, 500줄)
        │
        ▼
3. FileManager.createProject(code)
   → {BASE_DIR}/{uuid}/main.js 생성
        │
        ▼
4. ProcessManager.spawn()
   → node --inspect-brk=0 main.js
   → stderr에서 ws://127.0.0.1:{port}/... 파싱
        │
        ▼
5. InspectorClient.connect(port)
   → WebSocket 연결
   → Debugger.enable()
   → Runtime.enable()
   → Runtime.runIfWaitingForDebugger()
   → scriptParsed 이벤트 대기 (scriptId 획득)
        │
        ▼
6. 메인 루프:
   while (not finished && stepCount < MAX_STEPS) {
     ├─ Debugger.paused 이벤트 대기
     ├─ SnapshotBuilder.capture(callFrames)
     │  ├─ buildStack() - 콜스택 빌드
     │  ├─ buildHeap() - 힙 객체 빌드
     │  └─ attachConsoleOutput() - stdout 첨부
     └─ Debugger.stepInto()
   }
        │
        ▼
7. ProcessManager.kill()
   FileManager.cleanup()
        │
        ▼
8. 응답 반환 { success: true, steps: [...] }
```

### 4.4 Java (JDI) vs JavaScript (CDP) 비교

| 측면 | Java (JDI) | JavaScript (CDP) |
|------|------------|------------------|
| 연결 방식 | LaunchingConnector | WebSocket |
| 스텝 명령 | StepRequest | Debugger.stepInto |
| 일시정지 이벤트 | StepEvent | Debugger.paused |
| 변수 조회 | StackFrame.visibleVariables() | Runtime.getProperties |
| 프로세스 관리 | JDI 내장 | child_process.spawn |
| 콘솔 출력 | System.out 리다이렉트 | Runtime.consoleAPICalled |

**유사점**: 둘 다 "실제 런타임 디버깅" 방식으로 동일한 패턴

---

## 5. 세부 구현 계획

### Phase 1: 기반 구조 (1주차)

#### 5.1.1 ProcessManager 구현
```typescript
// packages/backend/src/modules/simulators/javascript/engine/process-manager.ts

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import type { InspectorInfo } from '../types';

export class ProcessManager extends EventEmitter {
  private process: ChildProcess | null = null;
  private inspectorInfo: InspectorInfo | null = null;

  /**
   * Node.js 프로세스를 디버그 모드로 시작
   * @param scriptPath 실행할 스크립트 경로
   * @returns Inspector 연결 정보
   */
  async spawn(scriptPath: string): Promise<InspectorInfo> {
    return new Promise((resolve, reject) => {
      // --inspect-brk=0: 랜덤 포트 사용, 첫 줄에서 정지
      this.process = spawn('node', ['--inspect-brk=0', scriptPath], {
        env: { ...process.env, NODE_OPTIONS: '' },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stderrBuffer = '';

      this.process.stderr?.on('data', (data) => {
        stderrBuffer += data.toString();

        // Inspector URL 파싱: "Debugger listening on ws://127.0.0.1:9229/..."
        const match = stderrBuffer.match(
          /Debugger listening on ws:\/\/(.+?):(\d+)\/(.+)/
        );

        if (match) {
          this.inspectorInfo = {
            host: match[1],
            port: parseInt(match[2], 10),
            wsUrl: `ws://${match[1]}:${match[2]}/${match[3]}`
          };
          resolve(this.inspectorInfo);
        }
      });

      this.process.on('error', (err) => {
        reject(new Error(`프로세스 시작 실패: ${err.message}`));
      });

      this.process.on('exit', (code, signal) => {
        this.emit('exit', { code, signal });
      });

      // 타임아웃
      setTimeout(() => {
        if (!this.inspectorInfo) {
          this.kill();
          reject(new Error('Inspector 포트 감지 타임아웃 (5초)'));
        }
      }, 5000);
    });
  }

  /**
   * 프로세스 강제 종료
   */
  kill(): void {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGKILL');
      this.process = null;
    }
  }

  /**
   * 프로세스 실행 중 여부
   */
  isRunning(): boolean {
    return this.process !== null && !this.process.killed;
  }
}
```

#### 5.1.2 FileManager 구현 (V2 호환)
```typescript
// packages/backend/src/modules/simulators/javascript/engine/file-manager.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// V2와 동일한 BASE_DIR 사용 (일관성 유지)
const BASE_DIR = path.resolve(process.cwd(), 'tmp', 'javascript');

export class FileManager {
  private projectPath: string | null = null;

  /**
   * 임시 프로젝트 디렉토리 생성 및 소스 파일 작성
   * @param code 사용자 코드
   * @returns 프로젝트 경로
   */
  async createProject(code: string): Promise<string> {
    // BASE_DIR 존재 확인
    await fs.mkdir(BASE_DIR, { recursive: true });

    // UUID 기반 프로젝트 디렉토리 생성
    const projectId = uuidv4();
    this.projectPath = path.join(BASE_DIR, projectId);
    await fs.mkdir(this.projectPath, { recursive: true });

    // main.js 작성
    const mainPath = path.join(this.projectPath, 'main.js');
    await fs.writeFile(mainPath, code, 'utf-8');

    return this.projectPath;
  }

  /**
   * 소스 파일 경로 반환
   */
  getSourcePath(projectPath: string): string {
    return path.join(projectPath, 'main.js');
  }

  /**
   * 프로젝트 정리
   */
  async cleanup(): Promise<void> {
    if (this.projectPath) {
      try {
        await fs.rm(this.projectPath, { recursive: true, force: true });
      } catch {
        // 정리 실패해도 무시 (임시 파일이므로)
      }
      this.projectPath = null;
    }
  }
}
```

### Phase 2: Inspector 클라이언트 (2주차)

#### 5.2.1 InspectorClient 구현
```typescript
// packages/backend/src/modules/simulators/javascript/engine/inspector-client.ts

import CDP from 'chrome-remote-interface';
import type { Protocol } from 'chrome-remote-interface';
import type { PausedEvent, ConsoleMessage } from '../types';

export class InspectorClient {
  private client: CDP.Client | null = null;
  private scriptId: string | null = null;
  private consoleMessages: ConsoleMessage[] = [];

  // 이벤트 콜백
  private pausedCallback: ((event: PausedEvent) => void) | null = null;

  /**
   * Inspector에 연결
   */
  async connect(port: number): Promise<void> {
    this.client = await CDP({ port });

    // Debugger 도메인 활성화
    await this.client.Debugger.enable({});

    // Runtime 도메인 활성화
    await this.client.Runtime.enable();

    // 비동기 콜스택 깊이 설정 (디버깅 정보 향상)
    await this.client.Debugger.setAsyncCallStackDepth({ maxDepth: 32 });

    // scriptParsed 이벤트: scriptId 획득
    this.client.Debugger.on('scriptParsed', (event) => {
      if (event.url.endsWith('main.js')) {
        this.scriptId = event.scriptId;
      }
    });

    // paused 이벤트 등록
    this.client.Debugger.on('paused', (event) => {
      if (this.pausedCallback) {
        this.pausedCallback(event as PausedEvent);
      }
    });

    // console.log 캡처
    this.client.Runtime.on('consoleAPICalled', (event) => {
      if (event.type === 'log' || event.type === 'info' || event.type === 'warn' || event.type === 'error') {
        const text = event.args
          .map(arg => this.formatConsoleArg(arg))
          .join(' ');
        this.consoleMessages.push({
          type: event.type,
          text,
          timestamp: event.timestamp
        });
      }
    });

    // --inspect-brk로 일시정지된 상태에서 실행 시작
    await this.client.Runtime.runIfWaitingForDebugger();
  }

  /**
   * scriptParsed 이벤트 대기
   */
  async waitForScript(timeout: number = 5000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.scriptId) {
        resolve(this.scriptId);
        return;
      }

      const checkInterval = setInterval(() => {
        if (this.scriptId) {
          clearInterval(checkInterval);
          clearTimeout(timeoutId);
          resolve(this.scriptId);
        }
      }, 50);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('스크립트 파싱 대기 타임아웃'));
      }, timeout);
    });
  }

  /**
   * 첫 번째 라인에 브레이크포인트 설정
   */
  async setBreakpointOnFirstLine(): Promise<void> {
    if (!this.scriptId) {
      throw new Error('scriptId가 없습니다. waitForScript()를 먼저 호출하세요.');
    }

    await this.client!.Debugger.setBreakpoint({
      location: {
        scriptId: this.scriptId,
        lineNumber: 0
      }
    });
  }

  /**
   * paused 이벤트 리스너 등록
   */
  onPaused(callback: (event: PausedEvent) => void): void {
    this.pausedCallback = callback;
  }

  /**
   * stepInto 실행
   */
  async stepInto(): Promise<void> {
    await this.client!.Debugger.stepInto({});
  }

  /**
   * stepOver 실행
   */
  async stepOver(): Promise<void> {
    await this.client!.Debugger.stepOver({});
  }

  /**
   * resume 실행 (다음 브레이크포인트까지)
   */
  async resume(): Promise<void> {
    await this.client!.Debugger.resume({});
  }

  /**
   * 스코프에서 변수 조회
   */
  async getScopeVariables(
    scopeObjectId: string
  ): Promise<Record<string, any>> {
    const result = await this.client!.Runtime.getProperties({
      objectId: scopeObjectId,
      ownProperties: true
    });

    const variables: Record<string, any> = {};

    for (const prop of result.result) {
      // 내부 변수 스킵
      if (prop.name.startsWith('__')) continue;
      if (prop.name === 'this') continue;

      if (prop.value) {
        variables[prop.name] = this.parseRemoteObject(prop.value);
      }
    }

    return variables;
  }

  /**
   * 객체의 속성 조회 (힙 빌드용)
   */
  async getObjectProperties(objectId: string): Promise<Protocol.Runtime.PropertyDescriptor[]> {
    const result = await this.client!.Runtime.getProperties({
      objectId,
      ownProperties: true
    });
    return result.result;
  }

  /**
   * 콘솔 출력 가져오고 초기화
   */
  getAndClearConsoleOutput(): string | undefined {
    if (this.consoleMessages.length === 0) return undefined;

    const output = this.consoleMessages
      .map(msg => msg.text)
      .join('\n');
    this.consoleMessages = [];
    return output;
  }

  /**
   * RemoteObject를 JavaScript 값으로 변환
   */
  private parseRemoteObject(obj: Protocol.Runtime.RemoteObject): any {
    switch (obj.type) {
      case 'undefined':
        return { type: 'undefined', value: undefined };

      case 'boolean':
      case 'number':
      case 'string':
        return obj.value;

      case 'object':
        if (obj.subtype === 'null') {
          return null;
        }
        if (obj.subtype === 'array') {
          return {
            type: 'Array',
            objectId: obj.objectId,
            preview: obj.description || '[]'
          };
        }
        return {
          type: 'Object',
          objectId: obj.objectId,
          className: obj.className || 'Object',
          preview: obj.description || '{}'
        };

      case 'function':
        return {
          type: 'Function',
          name: obj.description?.split('(')[0] || 'anonymous'
        };

      case 'symbol':
        return {
          type: 'Symbol',
          description: obj.description
        };

      case 'bigint':
        return {
          type: 'BigInt',
          value: obj.unserializableValue
        };

      default:
        // NaN, Infinity 등 unserializable 값
        if (obj.unserializableValue) {
          return {
            type: 'special',
            value: obj.unserializableValue
          };
        }
        return String(obj.value);
    }
  }

  /**
   * 콘솔 인자 포맷팅
   */
  private formatConsoleArg(arg: Protocol.Runtime.RemoteObject): string {
    switch (arg.type) {
      case 'undefined':
        return 'undefined';
      case 'boolean':
      case 'number':
      case 'string':
        return String(arg.value);
      case 'object':
        if (arg.subtype === 'null') return 'null';
        return arg.description || '[object Object]';
      case 'function':
        return '[Function]';
      default:
        return arg.unserializableValue || String(arg.value);
    }
  }

  /**
   * 연결 종료
   */
  async close(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch {
        // 이미 닫혔을 수 있음
      }
      this.client = null;
    }
  }
}
```

### Phase 3: 스냅샷 빌더 (2주차)

#### 5.3.1 SnapshotBuilder 구현
```typescript
// packages/backend/src/modules/simulators/javascript/engine/snapshot-builder.ts

import { InspectorClient } from './inspector-client';
import type { Protocol } from 'chrome-remote-interface';
import type {
  JavaScriptSnapshot,
  StackFrame,
  HeapObject,
  PausedEvent
} from '../types';

export class SnapshotBuilder {
  private heapObjects: Map<string, HeapObject> = new Map();
  private heapIdCounter: number = 1;

  constructor(private client: InspectorClient) {}

  /**
   * 현재 상태에서 스냅샷 생성
   */
  async capture(
    event: PausedEvent,
    sourceLines: string[]
  ): Promise<JavaScriptSnapshot | null> {
    const callFrames = event.callFrames;

    // main.js 파일의 프레임만 필터
    const mainFrame = callFrames.find(f =>
      f.url.endsWith('main.js')
    );

    if (!mainFrame) {
      return null; // 내부 코드는 스킵
    }

    // 힙 초기화 (스냅샷마다)
    this.heapObjects.clear();

    const lineNumber = mainFrame.location.lineNumber + 1; // 1-indexed
    const stack = await this.buildStack(callFrames);
    const heap = await this.buildHeap();
    const stdout = this.client.getAndClearConsoleOutput();

    return {
      line: lineNumber,
      event: 'STEP',
      stack,
      heap,
      stdout,
      code: sourceLines[lineNumber - 1] || ''
    };
  }

  /**
   * 콜스택 빌드
   */
  private async buildStack(
    callFrames: Protocol.Debugger.CallFrame[]
  ): Promise<StackFrame[]> {
    const stack: StackFrame[] = [];

    for (const frame of callFrames) {
      // 내부 스크립트 스킵
      if (frame.url.includes('node:') ||
          frame.url.includes('internal/') ||
          !frame.url.endsWith('main.js')) {
        continue;
      }

      const variables: Record<string, any> = {};

      // 각 스코프에서 변수 추출
      for (const scope of frame.scopeChain) {
        if (scope.type === 'local' || scope.type === 'block') {
          if (scope.object.objectId) {
            const scopeVars = await this.client.getScopeVariables(
              scope.object.objectId
            );

            // 힙 객체 참조 처리
            for (const [name, value] of Object.entries(scopeVars)) {
              if (value && typeof value === 'object' && value.objectId) {
                // 객체/배열인 경우 힙에 추가하고 참조로 대체
                const heapId = await this.addToHeap(value);
                variables[name] = heapId;
              } else {
                variables[name] = value;
              }
            }
          }
        }
      }

      stack.push({
        methodName: frame.functionName || '__main__',
        className: 'Main',
        variables
      });
    }

    return stack;
  }

  /**
   * 객체/배열을 힙에 추가
   */
  private async addToHeap(value: any): Promise<string> {
    const { objectId, type: valueType } = value;

    // 이미 힙에 있는지 확인
    if (this.heapObjects.has(objectId)) {
      return this.heapObjects.get(objectId)!.address;
    }

    const address = `@${this.heapIdCounter++}`;

    // 객체 속성 조회
    const props = await this.client.getObjectProperties(objectId);

    let heapObj: HeapObject;

    if (valueType === 'Array') {
      // 배열 처리
      const elements: any[] = [];
      let length = 0;

      for (const prop of props) {
        if (prop.name === 'length' && prop.value) {
          length = prop.value.value as number;
        } else if (/^\d+$/.test(prop.name) && prop.value) {
          const index = parseInt(prop.name, 10);
          elements[index] = this.formatHeapValue(prop.value);
        }
      }

      heapObj = {
        id: objectId,
        address,
        type: 'Array',
        content: `[${elements.slice(0, length).join(', ')}]`,
        length
      };
    } else {
      // 객체 처리
      const entries: string[] = [];

      for (const prop of props) {
        // 내부 속성 스킵
        if (prop.name.startsWith('__')) continue;
        if (!prop.enumerable) continue;

        if (prop.value) {
          const formattedValue = this.formatHeapValue(prop.value);
          entries.push(`${prop.name}: ${formattedValue}`);
        }
      }

      heapObj = {
        id: objectId,
        address,
        type: value.className || 'Object',
        content: `{${entries.join(', ')}}`
      };
    }

    this.heapObjects.set(objectId, heapObj);
    return address;
  }

  /**
   * 힙 값 포맷팅
   */
  private formatHeapValue(value: Protocol.Runtime.RemoteObject): string {
    switch (value.type) {
      case 'undefined':
        return 'undefined';
      case 'boolean':
      case 'number':
        return String(value.value);
      case 'string':
        return `"${value.value}"`;
      case 'object':
        if (value.subtype === 'null') return 'null';
        if (value.subtype === 'array') return value.description || '[]';
        return value.description || '{}';
      case 'function':
        return '[Function]';
      default:
        return value.unserializableValue || String(value.value);
    }
  }

  /**
   * 힙 배열 반환
   */
  private async buildHeap(): Promise<HeapObject[]> {
    return Array.from(this.heapObjects.values());
  }
}
```

### Phase 4: 메인 서비스 통합 (3주차)

#### 5.4.1 JavaScriptSimulationService V3
```typescript
// packages/backend/src/modules/simulators/javascript/javascript-simulation.service.ts

import { FileManager } from './engine/file-manager';
import { ProcessManager } from './engine/process-manager';
import { InspectorClient } from './engine/inspector-client';
import { SnapshotBuilder } from './engine/snapshot-builder';
import type {
  JavaScriptSimulationResult,
  JavaScriptSnapshot,
  SimulationErrorCode
} from './types';

export class JavaScriptSimulationService {
  private fileManager: FileManager;
  private processManager: ProcessManager;

  // 제한 설정
  private readonly MAX_STEPS = 1000;
  private readonly MAX_CODE_LENGTH = 10000;
  private readonly MAX_LINES = 500;
  private readonly TIMEOUT = 10000; // 10초

  // 위험 패턴 (V2와 동일한 12개)
  private readonly DANGEROUS_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
    // 파일 시스템 접근
    { pattern: /\brequire\s*\(\s*['"]fs['"]\s*\)/, reason: '파일 시스템 접근' },
    { pattern: /\brequire\s*\(\s*['"]path['"]\s*\)/, reason: '경로 조작' },

    // 프로세스 제어
    { pattern: /\brequire\s*\(\s*['"]child_process['"]\s*\)/, reason: '프로세스 생성' },
    { pattern: /\bprocess\.exit\s*\(/, reason: '프로세스 종료' },
    { pattern: /\bprocess\.kill\s*\(/, reason: '프로세스 종료' },
    { pattern: /\bprocess\.env\b/, reason: '환경 변수 접근' },

    // 네트워크 접근
    { pattern: /\brequire\s*\(\s*['"]net['"]\s*\)/, reason: '네트워크 접근' },
    { pattern: /\brequire\s*\(\s*['"]http['"]\s*\)/, reason: '네트워크 접근' },
    { pattern: /\brequire\s*\(\s*['"]https['"]\s*\)/, reason: '네트워크 접근' },
    { pattern: /\bfetch\s*\(/, reason: '네트워크 요청' },

    // 동적 코드 실행
    { pattern: /\beval\s*\(/, reason: '동적 코드 실행' },
    { pattern: /\bnew\s+Function\s*\(/, reason: '동적 함수 생성' },
    { pattern: /\bimport\s*\(/, reason: '동적 임포트' },

    // 샌드박스 탈출 시도
    { pattern: /\bthis\.constructor\b/, reason: 'VM 탈출 시도' },
    { pattern: /\bObject\.getPrototypeOf\s*\(/, reason: '프로토타입 체인 접근' },
  ];

  constructor() {
    this.fileManager = new FileManager();
    this.processManager = new ProcessManager();
  }

  async simulate(sourceCode: string): Promise<JavaScriptSimulationResult> {
    let projectPath: string | null = null;
    let client: InspectorClient | null = null;

    try {
      // 1. 코드 검증
      this.validateCode(sourceCode);

      // 2. 임시 프로젝트 생성
      projectPath = await this.fileManager.createProject(sourceCode);
      const scriptPath = this.fileManager.getSourcePath(projectPath);

      // 3. 디버그 모드로 프로세스 시작
      const inspectorInfo = await this.processManager.spawn(scriptPath);

      // 4. Inspector 연결
      client = new InspectorClient();
      await client.connect(inspectorInfo.port);

      // 5. 스크립트 로드 대기
      await client.waitForScript();

      // 6. 스냅샷 수집
      const snapshots = await this.collectSnapshots(client, sourceCode);

      return {
        success: true,
        steps: snapshots
      };

    } catch (error: any) {
      return this.handleError(error);

    } finally {
      // 7. 정리
      await client?.close();
      this.processManager.kill();
      await this.fileManager.cleanup();
    }
  }

  /**
   * 스냅샷 수집 루프
   */
  private async collectSnapshots(
    client: InspectorClient,
    sourceCode: string
  ): Promise<JavaScriptSnapshot[]> {
    const snapshots: JavaScriptSnapshot[] = [];
    const builder = new SnapshotBuilder(client);
    const sourceLines = sourceCode.split('\n');

    return new Promise((resolve, reject) => {
      let stepCount = 0;
      let finished = false;

      // 타임아웃 설정
      const timeout = setTimeout(() => {
        if (!finished) {
          finished = true;
          reject(this.createError('TIMEOUT', '실행 시간이 초과되었습니다. 무한 루프가 있는지 확인해주세요.'));
        }
      }, this.TIMEOUT);

      // 프로세스 종료 감지
      this.processManager.on('exit', () => {
        if (!finished) {
          finished = true;
          clearTimeout(timeout);
          resolve(snapshots);
        }
      });

      // paused 이벤트 핸들러
      client.onPaused(async (event) => {
        if (finished) return;

        try {
          stepCount++;

          // 최대 스텝 초과 확인
          if (stepCount > this.MAX_STEPS) {
            finished = true;
            clearTimeout(timeout);
            reject(this.createError(
              'MAX_STEPS_EXCEEDED',
              `최대 실행 단계(${this.MAX_STEPS}회)를 초과했습니다. 무한 루프가 있는지 확인해주세요.`
            ));
            return;
          }

          // 스냅샷 캡처
          const snapshot = await builder.capture(event, sourceLines);

          if (snapshot) {
            snapshots.push(snapshot);
          }

          // 다음 스텝
          await client.stepInto();

        } catch (error: any) {
          // 정상 종료 케이스들
          const isNormalExit =
            error.message?.includes('Session closed') ||
            error.message?.includes('Target closed') ||
            error.message?.includes('Protocol error') ||
            error.message?.includes('WebSocket is not open') ||
            error.code === 'ECONNRESET';

          if (isNormalExit && !finished) {
            finished = true;
            clearTimeout(timeout);
            resolve(snapshots);
          } else if (!finished) {
            finished = true;
            clearTimeout(timeout);
            reject(error);
          }
        }
      });

      // 첫 번째 stepInto로 실행 시작
      client.stepInto().catch((error) => {
        // 이미 paused 상태일 수 있음 - 무시
        if (!error.message?.includes('Cannot step')) {
          // 실제 에러면 처리
          if (!finished) {
            finished = true;
            clearTimeout(timeout);
            reject(error);
          }
        }
      });
    });
  }

  /**
   * 코드 유효성 검사
   */
  private validateCode(code: string): void {
    // 길이 검증
    if (code.length > this.MAX_CODE_LENGTH) {
      throw this.createError(
        'CODE_TOO_LONG',
        `코드가 너무 깁니다. (최대 ${this.MAX_CODE_LENGTH}자)`
      );
    }

    // 줄 수 검증
    const lineCount = code.split('\n').length;
    if (lineCount > this.MAX_LINES) {
      throw this.createError(
        'CODE_TOO_LONG',
        `코드 줄 수가 너무 많습니다. (최대 ${this.MAX_LINES}줄)`
      );
    }

    // 위험 패턴 검사
    for (const { pattern, reason } of this.DANGEROUS_PATTERNS) {
      if (pattern.test(code)) {
        throw this.createError(
          'DANGEROUS_CODE',
          `보안 위험: ${reason}은(는) 허용되지 않습니다.`
        );
      }
    }

    // 구문 검사 (간단히)
    try {
      new Function(code);
    } catch (syntaxError: any) {
      throw this.createError(
        'SYNTAX_ERROR',
        `구문 오류: ${syntaxError.message}`
      );
    }
  }

  /**
   * 에러 객체 생성
   */
  private createError(code: SimulationErrorCode, message: string): Error & { code: SimulationErrorCode } {
    const error = new Error(message) as Error & { code: SimulationErrorCode };
    error.code = code;
    return error;
  }

  /**
   * 에러 처리 및 응답 생성
   */
  private handleError(error: any): JavaScriptSimulationResult {
    const code: SimulationErrorCode = error.code || 'INTERNAL_ERROR';

    return {
      success: false,
      error: {
        code,
        message: error.message || '알 수 없는 오류가 발생했습니다.'
      }
    };
  }
}
```

---

## 6. 타입 정의

### 6.1 CDP 관련 타입 (`types/cdp.ts`)
```typescript
// packages/backend/src/modules/simulators/javascript/types/cdp.ts

import type { Protocol } from 'chrome-remote-interface';

// CDP 타입 re-export
export type CallFrame = Protocol.Debugger.CallFrame;
export type Scope = Protocol.Debugger.Scope;
export type RemoteObject = Protocol.Runtime.RemoteObject;
export type PropertyDescriptor = Protocol.Runtime.PropertyDescriptor;
export type Location = Protocol.Debugger.Location;

// Inspector 연결 정보
export interface InspectorInfo {
  port: number;
  host: string;
  wsUrl: string;
}

// Debugger.paused 이벤트
export interface PausedEvent {
  callFrames: CallFrame[];
  reason: string;
  hitBreakpoints?: string[];
  asyncStackTrace?: Protocol.Runtime.StackTrace;
  data?: any;
}

// Console 메시지
export interface ConsoleMessage {
  type: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: number;
}
```

### 6.2 스냅샷 타입 (`types/snapshot.ts`)
```typescript
// packages/backend/src/modules/simulators/javascript/types/snapshot.ts

// 스택 프레임
export interface StackFrame {
  methodName: string;
  className: string;
  variables: Record<string, any>;
}

// 힙 객체
export interface HeapObject {
  id: string;
  address: string;
  type: string;
  content: string;
  length?: number;
}

// 스냅샷
export interface JavaScriptSnapshot {
  line: number;
  event: 'STEP' | 'ERROR';
  stack: StackFrame[];
  heap: HeapObject[];
  stdout?: string;
  code?: string;
  error?: {
    type: string;
    message: string;
  };
}

// 시뮬레이션 결과
export interface JavaScriptSimulationResult {
  success: boolean;
  steps?: JavaScriptSnapshot[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}
```

### 6.3 에러 코드 정의 (`types/errors.ts`)
```typescript
// packages/backend/src/modules/simulators/javascript/types/errors.ts

// 시뮬레이션 에러 코드
export type SimulationErrorCode =
  | 'CODE_TOO_LONG'        // 코드 길이/줄 수 초과
  | 'DANGEROUS_CODE'       // 보안 위험 코드 감지
  | 'SYNTAX_ERROR'         // 구문 오류
  | 'TIMEOUT'              // 실행 시간 초과 (10초)
  | 'MAX_STEPS_EXCEEDED'   // 최대 스텝 초과 (1000회)
  | 'RUNTIME_ERROR'        // 런타임 에러
  | 'FILE_SYSTEM_ERROR'    // 파일 시스템 에러
  | 'INTERNAL_ERROR';      // 내부 에러

// 에러 메시지 매핑
export const ERROR_MESSAGES: Record<SimulationErrorCode, string> = {
  CODE_TOO_LONG: '코드가 너무 깁니다.',
  DANGEROUS_CODE: '보안상 허용되지 않는 코드입니다.',
  SYNTAX_ERROR: '구문 오류가 있습니다.',
  TIMEOUT: '실행 시간이 초과되었습니다.',
  MAX_STEPS_EXCEEDED: '최대 실행 단계를 초과했습니다.',
  RUNTIME_ERROR: '런타임 에러가 발생했습니다.',
  FILE_SYSTEM_ERROR: '파일 처리 중 오류가 발생했습니다.',
  INTERNAL_ERROR: '내부 오류가 발생했습니다.'
};
```

### 6.4 타입 Re-export (`types/index.ts`)
```typescript
// packages/backend/src/modules/simulators/javascript/types/index.ts

export * from './cdp';
export * from './snapshot';
export * from './errors';
```

---

## 7. 교육 범위 정의

### 7.1 V3에서 지원하는 문법 (교육 범위)

Inspector Protocol 기반이므로 **모든 ES2020+ 문법**을 지원합니다.

#### 완전 지원
```javascript
// ✅ 변수 및 상수
let x = 10;
const name = "hello";
var legacy = true;

// ✅ 기본 자료형
let num = 42;
let str = "text";
let bool = true;
let nil = null;
let undef = undefined;

// ✅ 연산자
x = x + 5;
y = x > 5 ? 'big' : 'small';

// ✅ 조건문
if (x > 5) { ... } else if (x > 0) { ... } else { ... }
switch (day) { case 1: ... break; default: ... }

// ✅ 반복문
for (let i = 0; i < 10; i++) { ... }
for (const item of array) { ... }
for (const key in object) { ... }
while (condition) { ... }
do { ... } while (condition);

// ✅ 함수
function add(a, b) { return a + b; }
const mul = function(a, b) { return a * b; };
const div = (a, b) => a / b;

// ✅ 배열 및 객체
const arr = [1, 2, 3];
const obj = { name: "John", age: 20 };

// ✅ 구조 분해 (ES6+)
const { name, age } = person;
const [first, ...rest] = arr;

// ✅ 클래스 (ES6+)
class Person {
  constructor(name) { this.name = name; }
  greet() { return `Hello, ${this.name}`; }
}

// ✅ console.log (출력 캡처됨)
console.log(x, arr, obj);
```

### 7.2 교육 범위 외 (비동기)

> **설계 결정**: V3는 **동기 코드만** 정식 지원합니다.
> 비동기 코드는 CDP로 추적 가능하지만, 교육 목적상 복잡도가 높아 별도 챕터로 분리합니다.

```javascript
// ⚠️ 비동기 코드 - 교육 범위 외
// (실행은 되지만 스텝 순서가 직관적이지 않음)

async function fetchData() {
  const data = await somePromise();
  return data;
}

setTimeout(() => console.log("delayed"), 1000);

Promise.resolve().then(() => console.log("microtask"));
```

**비동기 처리 가이드라인:**
1. 교육 콘텐츠에서 비동기는 별도 "고급" 챕터로 분리
2. 비동기 코드 실행 시 경고 메시지 표시 고려
3. 향후 비동기 전용 뷰 개발 검토

### 7.3 제한 사항 (보안상)

```javascript
// ❌ 파일 시스템 접근
require('fs');
require('path');

// ❌ 네트워크 접근
require('net');
require('http');
fetch(url);

// ❌ 프로세스 생성/제어
require('child_process');
process.exit();
process.env.SECRET;

// ❌ 동적 코드 실행
eval('code');
new Function('code');
import('module');
```

---

## 8. 테스트 전략

### 8.1 단위 테스트

#### ProcessManager 테스트
```typescript
// packages/backend/src/modules/simulators/javascript/__tests__/process-manager.test.ts

describe('ProcessManager', () => {
  it('should spawn node process with inspector', async () => {
    const pm = new ProcessManager();
    const info = await pm.spawn('/tmp/test.js');

    expect(info.port).toBeGreaterThan(0);
    expect(info.host).toBe('127.0.0.1');
    expect(info.wsUrl).toMatch(/^ws:\/\//);

    pm.kill();
  });

  it('should detect inspector port from stderr', async () => {
    // ...
  });

  it('should timeout if inspector not available', async () => {
    // ...
  });

  it('should kill process on request', async () => {
    // ...
  });
});
```

#### InspectorClient 테스트
```typescript
// packages/backend/src/modules/simulators/javascript/__tests__/inspector-client.test.ts

describe('InspectorClient', () => {
  it('should connect to inspector port', async () => {
    // ...
  });

  it('should receive paused events on step', async () => {
    // ...
  });

  it('should retrieve scope variables', async () => {
    // ...
  });

  it('should capture console.log output', async () => {
    // ...
  });

  it('should handle connection close gracefully', async () => {
    // ...
  });
});
```

#### SnapshotBuilder 테스트
```typescript
// packages/backend/src/modules/simulators/javascript/__tests__/snapshot-builder.test.ts

describe('SnapshotBuilder', () => {
  it('should build stack from call frames', async () => {
    // ...
  });

  it('should add objects to heap', async () => {
    // ...
  });

  it('should format array content correctly', async () => {
    // ...
  });

  it('should handle nested objects', async () => {
    // ...
  });
});
```

### 8.2 통합 테스트

```typescript
// packages/backend/src/modules/simulators/javascript/__tests__/integration.test.ts

describe('JavaScript Simulator V3', () => {
  const service = new JavaScriptSimulationService();

  describe('Basic Operations', () => {
    it('should trace simple variable assignment', async () => {
      const code = `let x = 10;\nx = x + 5;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps).toHaveLength(2);
      expect(result.steps![0].stack[0].variables.x).toBe(10);
      expect(result.steps![1].stack[0].variables.x).toBe(15);
    });

    it('should capture console.log output', async () => {
      const code = `let x = 42;\nconsole.log("Value:", x);`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      // console.log가 있는 스텝에서 stdout 확인
      const logStep = result.steps!.find(s => s.stdout);
      expect(logStep?.stdout).toContain('Value: 42');
    });
  });

  describe('Control Flow', () => {
    it('should trace for loop correctly', async () => {
      const code = `
        let sum = 0;
        for (let i = 0; i < 3; i++) {
          sum += i;
        }
      `;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps!.length).toBeGreaterThan(3);

      // 마지막 스텝에서 sum 확인
      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.sum).toBe(3); // 0+1+2
    });

    it('should trace if-else branches correctly', async () => {
      const code = `
        let x = 10;
        let result;
        if (x > 5) {
          result = "big";
        } else {
          result = "small";
        }
      `;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      const lastStep = result.steps![result.steps!.length - 1];
      expect(lastStep.stack[0].variables.result).toBe("big");
    });
  });

  describe('Data Structures', () => {
    it('should track array in heap', async () => {
      const code = `const arr = [1, 2, 3];`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      expect(result.steps![0].heap.length).toBeGreaterThan(0);

      const arrHeap = result.steps![0].heap.find(h => h.type === 'Array');
      expect(arrHeap).toBeDefined();
      expect(arrHeap!.content).toContain('1');
      expect(arrHeap!.length).toBe(3);
    });

    it('should track object in heap', async () => {
      const code = `const obj = { name: "John", age: 20 };`;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      const objHeap = result.steps![0].heap.find(h => h.type === 'Object');
      expect(objHeap).toBeDefined();
      expect(objHeap!.content).toContain('name');
    });
  });

  describe('Functions', () => {
    it('should trace function calls', async () => {
      const code = `
        function add(a, b) {
          return a + b;
        }
        let result = add(2, 3);
      `;
      const result = await service.simulate(code);

      expect(result.success).toBe(true);
      // 함수 내부 스텝 확인
      const funcStep = result.steps!.find(s =>
        s.stack.some(f => f.methodName === 'add')
      );
      expect(funcStep).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should reject dangerous code', async () => {
      const code = `require('fs').readFileSync('/etc/passwd');`;
      const result = await service.simulate(code);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('DANGEROUS_CODE');
    });

    it('should handle syntax errors', async () => {
      const code = `let x = ;`;
      const result = await service.simulate(code);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYNTAX_ERROR');
    });

    it('should timeout on infinite loop', async () => {
      const code = `while(true) {}`;
      const result = await service.simulate(code);

      expect(result.success).toBe(false);
      expect(['TIMEOUT', 'MAX_STEPS_EXCEEDED']).toContain(result.error?.code);
    }, 15000);
  });
});
```

### 8.3 성능 테스트

```typescript
describe('Performance', () => {
  it('should complete 100-line code within 5 seconds', async () => {
    const code = Array(100).fill('let x = 1;').join('\n');

    const start = Date.now();
    const result = await service.simulate(code);
    const elapsed = Date.now() - start;

    expect(result.success).toBe(true);
    expect(elapsed).toBeLessThan(5000);
  });

  it('should handle rapid sequential requests', async () => {
    const code = `let x = 1;`;
    const promises = Array(5).fill(null).map(() => service.simulate(code));

    const results = await Promise.all(promises);
    expect(results.every(r => r.success)).toBe(true);
  });
});
```

---

## 9. 마이그레이션 계획

### 9.1 단계별 전환

```
Week 1: V3 기반 구조 개발 (V2 유지)
        ├─ ProcessManager 구현
        ├─ FileManager 확인 (V2 재사용)
        └─ 타입 정의 작성
        │
Week 2: V3 Inspector 클라이언트 개발
        ├─ InspectorClient 구현
        ├─ SnapshotBuilder 구현
        └─ 단위 테스트 작성
        │
Week 3: V3 통합 및 테스트
        ├─ JavaScriptSimulationServiceV3 통합
        ├─ 통합 테스트 작성
        └─ 성능 테스트
        │
Week 4: V2 → V3 전환
        ├─ Feature Flag로 V3 활성화
        ├─ 기존 테스트 케이스 V3로 검증
        ├─ 스테이징 환경 테스트
        └─ V2 코드 삭제 (agent/debugger_agent.js)
```

### 9.2 API 호환성

V3는 V2와 **동일한 API 응답 형식**을 유지합니다:

```typescript
// 요청 (변경 없음)
POST /api/v1/simulators/javascript/simulate
{ "code": "let x = 10;" }

// 응답 (변경 없음)
{
  "success": true,
  "steps": [
    {
      "line": 1,
      "event": "STEP",
      "stack": [...],
      "heap": [...],
      "stdout": "...",
      "code": "let x = 10;"
    }
  ]
}
```

### 9.3 Feature Flag 구현

```typescript
// 환경 변수로 V2/V3 전환
const USE_V3_SIMULATOR = process.env.JS_SIMULATOR_VERSION === 'v3';

// javascript-simulation.service.ts (또는 routes.ts)
export async function simulate(code: string): Promise<JavaScriptSimulationResult> {
  if (USE_V3_SIMULATOR) {
    const service = new JavaScriptSimulationServiceV3();
    return service.simulate(code);
  } else {
    const service = new JavaScriptSimulationServiceV2();
    return service.simulate(code);
  }
}
```

### 9.4 롤백 계획

문제 발생 시:
1. `JS_SIMULATOR_VERSION=v2` 환경 변수 설정
2. 서버 재시작
3. V2로 즉시 롤백 완료

---

## 10. 리스크 및 대응책

### 10.1 기술적 리스크

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| CDP 연결 불안정 | 중 | 높음 | 재연결 로직 + 타임아웃 + 정상 종료 케이스 다양화 |
| 포트 충돌 | 낮 | 중 | `--inspect-brk=0` 사용 (OS가 포트 할당) |
| 메모리 누수 | 중 | 중 | 프로세스 격리 + finally에서 강제 kill |
| 무한 루프 | 높 | 중 | MAX_STEPS(1000) + 타임아웃(10초) |
| WebSocket 끊김 | 중 | 중 | 다양한 종료 메시지 패턴 처리 |

### 10.2 성능 리스크

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| CDP 오버헤드 | 중 | 중 | 필요한 이벤트만 구독 |
| 프로세스 생성 비용 | 중 | 중 | 캐시/풀링 (장기 검토) |
| 대용량 코드 | 낮 | 높 | MAX_CODE_LENGTH(10000자), MAX_LINES(500줄) |
| 대용량 힙 | 중 | 중 | 힙 객체 수 제한 (100개) |

### 10.3 일정 리스크

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| CDP 학습 곡선 | 중 | 중 | 공식 문서 + 예제 코드 + chrome-remote-interface |
| 테스트 케이스 부족 | 중 | 중 | 기존 V2 테스트를 V3로 이관 |
| 예상치 못한 버그 | 높 | 중 | Feature Flag로 점진적 롤아웃 |

---

## 📅 일정 요약

| Phase | 기간 | 산출물 |
|-------|------|--------|
| Phase 1: 기반 구조 | 1주차 | ProcessManager, FileManager, 타입 정의 |
| Phase 2: Inspector | 2주차 | InspectorClient, SnapshotBuilder |
| Phase 3: 통합 | 3주차 | JavaScriptSimulationServiceV3, 테스트 |
| Phase 4: 전환 | 4주차 | V2→V3 마이그레이션, 검증, V2 삭제 |

---

## 📚 참고 자료

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started)
- [Chrome DevTools Protocol - Debugger Domain](https://chromedevtools.github.io/devtools-protocol/tot/Debugger/)
- [Chrome DevTools Protocol - Runtime Domain](https://chromedevtools.github.io/devtools-protocol/tot/Runtime/)
- [chrome-remote-interface NPM](https://www.npmjs.com/package/chrome-remote-interface)
- [V8 Inspector Protocol](https://v8.dev/docs/inspector)

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-02 | 초안 작성 |
| 2.0 | 2026-02-02 | 이슈 반영 완료 |

### v2.0 변경 사항
- ✅ CDP 타입 수정 (`CDP.Debugger` → `Protocol.Debugger`)
- ✅ 타입 정의 파일 추가 (`types/cdp.ts`, `types/snapshot.ts`, `types/errors.ts`, `types/index.ts`)
- ✅ 위험 패턴 전체 추가 (3개 → 15개)
- ✅ console.log 출력 캡처 로직 추가 (`Runtime.consoleAPICalled`)
- ✅ 힙 빌드 로직 구현 (`buildHeap()`, `addToHeap()`)
- ✅ `scriptParsed` 이벤트 처리 추가 (`waitForScript()`)
- ✅ 프로세스 종료 감지 개선 (다양한 종료 케이스)
- ✅ `Runtime.runIfWaitingForDebugger()` 호출 추가
- ✅ 비동기 처리 전략 명확화 (동기 코드만 정식 지원)
- ✅ 에러 코드 enum 정의 (`SimulationErrorCode`)
- ✅ FileManager 경로 V2와 일관성 유지

---

> **문서 버전**: 2.0
> **최종 수정일**: 2026-02-02
> **작성자**: AI Assistant
> **상태**: Ready for Implementation
