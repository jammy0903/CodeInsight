# C 시뮬레이터 V2: GDB/MI Protocol 기반 리팩토링 계획

> **프로젝트 코드명**: C-SIM-V2
> **목표**: GDB/MI Protocol 기반 실제 디버거로 전환
> **예상 기간**: 4-5주 (Phase별 진행)
> **현재 버전**: V1 (정규식 기반 인터프리터)
> **목표 버전**: V2 (GDB/MI + 실제 메모리 추적)
> **문서 버전**: 2.0 (이슈 반영 완료)

---

## 📋 목차

1. [Executive Summary](#1-executive-summary)
2. [현재 문제점 분석](#2-현재-문제점-분석)
3. [기술 스택 및 API 선정](#3-기술-스택-및-api-선정)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [세부 구현 계획](#5-세부-구현-계획)
6. [타입 정의](#6-타입-정의)
7. [Explanation 생성 시스템](#7-explanation-생성-시스템)
8. [교육 범위 정의](#8-교육-범위-정의)
9. [테스트 전략](#9-테스트-전략)
10. [마이그레이션 계획](#10-마이그레이션-계획)
11. [리스크 및 대응책](#11-리스크-및-대응책)

---

## 1. Executive Summary

### 1.1 배경

현재 C 시뮬레이터(V1)는 **정규식 기반 순수 인터프리터**로 구현되어 있습니다.
메모리 시각화 교육에는 효과적이지만, 다음과 같은 한계가 있습니다:

- 복잡한 표현식 처리 불가 (`add(multiply(2, 3), 4)`)
- 표준 라이브러리 미지원 (`strlen`, `strcpy` 등)
- 시뮬레이션과 실제 실행 간 불일치 가능성

### 1.2 해결책

**GDB/MI (Machine Interface) Protocol**을 사용하여 **실제 GCC 컴파일 + GDB 디버깅**을 수행합니다.

### 1.3 핵심 성과 지표

| 지표 | V1 (현재) | V2 (목표) |
|------|----------|----------|
| 실행 정확도 | ~80% | 100% |
| 표현식 지원 | 기본 | 모든 C 표현식 |
| 표준 라이브러리 | 일부 | 전체 |
| 메모리 주소 | 가상 | 실제 |
| 속도 | ~1ms | ~100-500ms |

### 1.4 V1/V2 병행 운영

| 사용 시점 | V1 | V2 |
|----------|:--:|:--:|
| 기본값 (간단한 코드) | ✅ | |
| 복잡한 코드/정확성 필요 | | ✅ |
| 표준 라이브러리 사용 | | ✅ |

---

## 2. 현재 문제점 분석

### 2.1 V1 구현 방식

```
원본 코드 → 정규식 파싱 → HandlerRegistry → 핸들러 실행 → Step 생성
```

### 2.2 핵심 문제

#### 문제 1: 정규식 기반 파싱의 한계

```c
// ❌ V1 미지원 - 중첩 함수 호출
int result = add(multiply(2, 3), 4);

// ❌ V1 미지원 - 복합 표현식
arr[i++] += value * factor;
```

#### 문제 2: 표준 라이브러리 미지원

```c
// ❌ V1 미지원
char *copy = strcpy(dest, src);
double result = sqrt(pow(x, 2) + pow(y, 2));
```

### 2.3 근본 원인

**정규식 기반 인터프리터로는 C 언어의 복잡성을 완전히 처리할 수 없음**

---

## 3. 기술 스택 및 API 선정

### 3.1 GDB/MI Protocol 개요

```
+-------------------+        stdin/stdout       +--------------------+
|  Target Process   | ←----------------------→ |  GDB Process       |
|  (a.out)          |                          |  (gdb --interpreter=mi3) |
+-------------------+                          +--------------------+
```

### 3.2 핵심 GDB/MI 명령어

#### 실행 제어
| 명령어 | 용도 |
|--------|------|
| `-exec-run` | 프로그램 시작 |
| `-exec-next` | Step Over |
| `-exec-step` | Step Into |
| `-exec-finish` | 현재 함수 종료까지 |

#### 변수/메모리 조회
| 명령어 | 용도 |
|--------|------|
| `-stack-list-frames` | 콜스택 조회 |
| `-stack-list-locals --all-values` | 지역 변수 |
| `-data-evaluate-expression expr` | 표현식 평가 |
| `-data-read-memory addr fmt count` | 메모리 읽기 |

### 3.3 기술 스택 요약

```yaml
Compiler: GCC 11+ (with -g debug symbols)
Debugger: GDB 10+ (--interpreter=mi3)
Protocol: GDB/MI v3
Process Management: child_process.spawn
IPC: stdin/stdout pipe + 파일 기반 stdin
```

---

## 4. 아키텍처 설계

### 4.1 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                      C Simulator V2                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌───────────────────────────────────┐  │
│  │ FileManager      │    │ GDBClient                         │  │
│  │ - createProject  │    │ - spawn(executable)               │  │
│  │ - compile(gcc)   │    │ - setBreakpoint(line)             │  │
│  │ - writeStdin     │    │ - stepInto() / stepOver()         │  │
│  │ - cleanup        │    │ - getLocals() / getStackFrames()  │  │
│  └────────┬─────────┘    │ - readMemory(addr, size)          │  │
│           │              │ - evaluateExpression(expr)        │  │
│           ▼              └───────────────┬───────────────────┘  │
│  ┌──────────────────┐                    │                      │
│  │ GCCCompiler      │    ┌───────────────┴───────────────────┐  │
│  │ - compile()      │    │ SnapshotBuilder                   │  │
│  │ - parseErrors()  │    │ - buildStack()                    │  │
│  └──────────────────┘    │ - buildHeap()                     │  │
│                          │ - buildEvents()                   │  │
│  ┌──────────────────┐    │ - generateExplanation()           │  │
│  │ MIParser         │    └───────────────────────────────────┘  │
│  │ - parseResponse  │                                           │
│  │ - parseRecord    │    ┌───────────────────────────────────┐  │
│  │ - parseValue     │    │ ExplanationGenerator              │  │
│  └──────────────────┘    │ - 한국어 설명 + 비유적 표현       │  │
│                          └───────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 디렉토리 구조

```
packages/backend/src/modules/simulators/c/
├── index.ts                           # 라우터 (기존 유지)
├── routes.ts                          # Express 라우트 (수정)
├── simulator.ts                       # V1 시뮬레이터 (유지)
│
├── v2/                                # V2 엔진 (신규)
│   ├── c-simulation.service.ts        # V2 메인 서비스
│   ├── engine/
│   │   ├── file-manager.ts            # 파일 + stdin 관리
│   │   ├── gcc-compiler.ts            # GCC 래퍼 + 에러 파서
│   │   ├── gdb-client.ts              # GDB/MI 클라이언트
│   │   ├── mi-parser.ts               # MI 응답 파서
│   │   ├── snapshot-builder.ts        # 스냅샷 생성
│   │   └── explanation-generator.ts   # 설명 생성 (비유적 표현)
│   │
│   ├── types/
│   │   ├── gdb.ts                     # GDB/MI 타입
│   │   ├── snapshot.ts                # 스냅샷 타입 (V1 호환)
│   │   ├── errors.ts                  # 에러 코드
│   │   └── index.ts
│   │
│   └── __tests__/
```

### 4.3 실행 흐름

```
1. 요청 수신 (/api/v1/simulators/c/trace)
        │
        ▼
2. validateCode(code) - 보안 검증
        │
        ▼
3. FileManager.createProject(code)
   FileManager.writeStdinFile(stdin)  ← stdin 파일로 저장
        │
        ▼
4. GCCCompiler.compile()
   → 실패 시 parseErrors()로 구조화된 에러 반환
        │
        ▼
5. GDBClient.spawn(executable)
   → stdin 파일 리다이렉션 설정
        │
        ▼
6. 메인 루프: 스냅샷 수집
        │
        ▼
7. 정리 및 응답 반환 (V1 호환 형식)
```

---

## 5. 세부 구현 계획

### Phase 1: 기반 구조 (1주차)

#### 5.1.1 FileManager 구현

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/file-manager.ts

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const BASE_DIR = path.resolve(process.cwd(), 'tmp', 'c-sim');

export class FileManager {
  private projectPath: string | null = null;

  async createProject(code: string): Promise<string> {
    await fs.mkdir(BASE_DIR, { recursive: true });

    const projectId = uuidv4();
    this.projectPath = path.join(BASE_DIR, projectId);
    await fs.mkdir(this.projectPath, { recursive: true });

    const sourcePath = path.join(this.projectPath, 'main.c');
    await fs.writeFile(sourcePath, code, 'utf-8');

    return this.projectPath;
  }

  /**
   * stdin을 파일로 저장 (GDB에서 리다이렉션용)
   * V1과 동일하게 공백 기준 토큰으로 처리
   */
  async writeStdinFile(stdin?: string): Promise<string | null> {
    if (!stdin || !this.projectPath) return null;

    const stdinPath = path.join(this.projectPath, 'stdin.txt');
    // 토큰별로 줄바꿈 처리 (scanf 호환)
    const tokens = stdin.trim().split(/\s+/).filter(s => s.length > 0);
    await fs.writeFile(stdinPath, tokens.join('\n') + '\n', 'utf-8');

    return stdinPath;
  }

  getSourcePath(): string {
    return path.join(this.projectPath!, 'main.c');
  }

  getExecutablePath(): string {
    return path.join(this.projectPath!, 'main');
  }

  getStdinPath(): string {
    return path.join(this.projectPath!, 'stdin.txt');
  }

  async cleanup(): Promise<void> {
    if (this.projectPath) {
      try {
        await fs.rm(this.projectPath, { recursive: true, force: true });
      } catch {
        // 무시
      }
      this.projectPath = null;
    }
  }
}
```

#### 5.1.2 GCCCompiler 구현 (에러 파서 포함)

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/gcc-compiler.ts

import { spawn } from 'child_process';

export interface CompileError {
  file: string;
  line: number;
  column: number;
  type: 'error' | 'warning' | 'note';
  message: string;
}

export interface CompileResult {
  success: boolean;
  stdout: string;
  stderr: string;
  executablePath?: string;
  errors?: CompileError[];
}

export class GCCCompiler {
  async compile(sourcePath: string, outputPath: string): Promise<CompileResult> {
    return new Promise((resolve) => {
      const gcc = spawn('gcc', [
        '-g',                       // 디버그 심볼
        '-O0',                      // 최적화 끔
        '-fno-omit-frame-pointer',  // 프레임 포인터 유지
        '-Wall',                    // 경고 활성화
        '-o', outputPath,
        sourcePath
      ]);

      let stdout = '';
      let stderr = '';

      gcc.stdout.on('data', (data) => { stdout += data.toString(); });
      gcc.stderr.on('data', (data) => { stderr += data.toString(); });

      gcc.on('close', (code) => {
        const errors = this.parseErrors(stderr);

        resolve({
          success: code === 0,
          stdout,
          stderr,
          executablePath: code === 0 ? outputPath : undefined,
          errors: errors.length > 0 ? errors : undefined
        });
      });

      gcc.on('error', (err) => {
        resolve({
          success: false,
          stdout,
          stderr: err.message,
          errors: [{ file: '', line: 0, column: 0, type: 'error', message: err.message }]
        });
      });
    });
  }

  /**
   * GCC 에러 메시지 파싱
   * 형식: main.c:5:10: error: expected ';' before 'return'
   */
  private parseErrors(stderr: string): CompileError[] {
    const errors: CompileError[] = [];
    const lines = stderr.split('\n');

    const errorPattern = /^(.+?):(\d+):(\d+):\s*(error|warning|note):\s*(.+)$/;

    for (const line of lines) {
      const match = line.match(errorPattern);
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          type: match[4] as 'error' | 'warning' | 'note',
          message: match[5]
        });
      }
    }

    return errors;
  }
}
```

### Phase 2: GDB/MI 클라이언트 (2주차)

#### 5.2.1 MIParser 구현 (강화)

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/mi-parser.ts

import type { MIRecord, MIResultRecord, MIAsyncRecord, MIStreamRecord, MIValue, MITuple, MIList } from '../types';

export class MIParser {
  private buffer: string = '';

  /**
   * 데이터 추가 및 완전한 레코드 파싱
   */
  addData(data: string): MIRecord[] {
    this.buffer += data;
    const records: MIRecord[] = [];
    const lines = this.buffer.split('\n');

    // 마지막 불완전한 줄은 버퍼에 유지
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === '(gdb)') continue;

      const record = this.parseRecord(trimmed);
      if (record) {
        records.push(record);
      }
    }

    return records;
  }

  /**
   * MI 응답 한 줄 파싱
   */
  parseRecord(line: string): MIRecord | null {
    // 토큰 추출 (숫자로 시작하면 토큰)
    let token: number | undefined;
    let rest = line;

    const tokenMatch = line.match(/^(\d+)(.*)$/);
    if (tokenMatch) {
      token = parseInt(tokenMatch[1], 10);
      rest = tokenMatch[2];
    }

    const firstChar = rest[0];

    // Result Record: ^done, ^error, ^running
    if (firstChar === '^') {
      return this.parseResultRecord(rest, token);
    }

    // Async Record: *stopped, *running, =thread-created
    if (firstChar === '*' || firstChar === '+' || firstChar === '=') {
      return this.parseAsyncRecord(rest);
    }

    // Stream Record: ~, @, &
    if (firstChar === '~' || firstChar === '@' || firstChar === '&') {
      return this.parseStreamRecord(rest);
    }

    return null;
  }

  private parseResultRecord(line: string, token?: number): MIResultRecord {
    const match = line.match(/^\^(\w+)(?:,(.*))?$/);
    if (!match) {
      return { type: 'result', class: 'error', results: {}, token };
    }

    const [, resultClass, resultsStr] = match;
    const results = resultsStr ? this.parseResults(resultsStr) : {};

    return {
      type: 'result',
      class: resultClass as 'done' | 'running' | 'connected' | 'error' | 'exit',
      results,
      token
    };
  }

  private parseAsyncRecord(line: string): MIAsyncRecord {
    const asyncType = line[0] as '*' | '+' | '=';
    const match = line.slice(1).match(/^(\S+?)(?:,(.*))?$/);

    if (!match) {
      return { type: 'async', asyncClass: 'unknown', asyncType, results: {} };
    }

    const [, asyncClass, resultsStr] = match;
    const results = resultsStr ? this.parseResults(resultsStr) : {};

    return { type: 'async', asyncType, asyncClass, results };
  }

  private parseStreamRecord(line: string): MIStreamRecord {
    const streamType = line[0] as '~' | '@' | '&';
    const content = line.slice(1);

    let text = '';
    if (content.startsWith('"') && content.endsWith('"')) {
      text = this.unescapeString(content.slice(1, -1));
    }

    return { type: 'stream', streamType, content: text };
  }

  private parseResults(str: string): Record<string, MIValue> {
    const results: Record<string, MIValue> = {};
    let pos = 0;

    while (pos < str.length) {
      const keyMatch = str.slice(pos).match(/^(\w+)=/);
      if (!keyMatch) break;

      const key = keyMatch[1];
      pos += keyMatch[0].length;

      const { value, newPos } = this.parseValue(str, pos);
      results[key] = value;
      pos = newPos;

      if (str[pos] === ',') pos++;
    }

    return results;
  }

  private parseValue(str: string, pos: number): { value: MIValue; newPos: number } {
    const char = str[pos];

    if (char === '"') {
      const endPos = this.findStringEnd(str, pos + 1);
      const value = this.unescapeString(str.slice(pos + 1, endPos));
      return { value, newPos: endPos + 1 };
    }

    if (char === '{') {
      return this.parseTuple(str, pos);
    }

    if (char === '[') {
      return this.parseList(str, pos);
    }

    const match = str.slice(pos).match(/^[\w\-.<>]+/);
    if (match) {
      return { value: match[0], newPos: pos + match[0].length };
    }

    return { value: '', newPos: pos };
  }

  private parseTuple(str: string, pos: number): { value: MITuple; newPos: number } {
    pos++; // { 스킵
    const tuple: MITuple = {};

    while (str[pos] !== '}' && pos < str.length) {
      const keyMatch = str.slice(pos).match(/^(\w+)=/);
      if (!keyMatch) break;

      const key = keyMatch[1];
      pos += keyMatch[0].length;

      const { value, newPos } = this.parseValue(str, pos);
      tuple[key] = value;
      pos = newPos;

      if (str[pos] === ',') pos++;
    }

    return { value: tuple, newPos: pos + 1 };
  }

  private parseList(str: string, pos: number): { value: MIList; newPos: number } {
    pos++; // [ 스킵
    const list: MIValue[] = [];

    while (str[pos] !== ']' && pos < str.length) {
      // key=value 형태 처리
      const keyMatch = str.slice(pos).match(/^(\w+)=/);
      if (keyMatch) {
        pos += keyMatch[0].length;
      }

      const { value, newPos } = this.parseValue(str, pos);
      list.push(value);
      pos = newPos;

      if (str[pos] === ',') pos++;
    }

    return { value: list, newPos: pos + 1 };
  }

  private findStringEnd(str: string, start: number): number {
    let pos = start;
    while (pos < str.length) {
      if (str[pos] === '\\') {
        pos += 2;
      } else if (str[pos] === '"') {
        return pos;
      } else {
        pos++;
      }
    }
    return pos;
  }

  private unescapeString(str: string): string {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  }
}
```

#### 5.2.2 GDBClient 구현 (stdin 파일 지원)

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/gdb-client.ts

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { MIParser } from './mi-parser';
import type { MIResultRecord, StoppedEvent, StackFrame, LocalVariable, MemoryContent } from '../types';

export class GDBClient extends EventEmitter {
  private process: ChildProcess | null = null;
  private parser: MIParser;
  private pendingCommands: Map<number, {
    resolve: (result: MIResultRecord) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private tokenCounter: number = 1;
  private stdinPath: string | null = null;

  constructor() {
    super();
    this.parser = new MIParser();
  }

  /**
   * GDB 프로세스 시작
   */
  async spawn(executablePath: string, stdinPath?: string): Promise<void> {
    this.stdinPath = stdinPath || null;

    return new Promise((resolve, reject) => {
      this.process = spawn('gdb', [
        '--interpreter=mi3',
        '--quiet',
        executablePath
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.process.stdout?.on('data', (data) => {
        this.handleOutput(data.toString());
      });

      this.process.stderr?.on('data', (data) => {
        console.error('[GDB stderr]', data.toString());
      });

      this.process.on('error', reject);

      this.process.on('exit', (code) => {
        this.emit('exit', code);
      });

      setTimeout(resolve, 100);
    });
  }

  private handleOutput(data: string): void {
    const records = this.parser.addData(data);

    for (const record of records) {
      if (record.type === 'result') {
        const token = (record as any).token;
        if (token !== undefined && this.pendingCommands.has(token)) {
          const { resolve } = this.pendingCommands.get(token)!;
          this.pendingCommands.delete(token);
          resolve(record as MIResultRecord);
        }
      } else if (record.type === 'async') {
        if (record.asyncClass === 'stopped') {
          this.emit('stopped', this.parseStoppedEvent(record));
        }
      } else if (record.type === 'stream') {
        if (record.streamType === '@') {
          this.emit('target', record.content);
        } else if (record.streamType === '~') {
          this.emit('console', record.content);
        }
      }
    }
  }

  private async execute(command: string): Promise<MIResultRecord> {
    return new Promise((resolve, reject) => {
      const token = this.tokenCounter++;
      this.pendingCommands.set(token, { resolve, reject });

      const fullCommand = `${token}${command}\n`;
      this.process?.stdin?.write(fullCommand);

      setTimeout(() => {
        if (this.pendingCommands.has(token)) {
          this.pendingCommands.delete(token);
          reject(new Error(`GDB command timeout: ${command}`));
        }
      }, 10000);
    });
  }

  async setBreakpoint(location: string): Promise<void> {
    const result = await this.execute(`-break-insert ${location}`);
    if (result.class === 'error') {
      throw new Error(`Failed to set breakpoint: ${location}`);
    }
  }

  /**
   * 프로그램 실행 시작 (stdin 파일 리다이렉션)
   */
  async run(): Promise<void> {
    if (this.stdinPath) {
      // stdin 파일에서 입력 받도록 설정
      await this.execute(`-exec-arguments < ${this.stdinPath}`);
    }
    await this.execute('-exec-run');
  }

  async stepInto(): Promise<void> {
    await this.execute('-exec-step');
  }

  async stepOver(): Promise<void> {
    await this.execute('-exec-next');
  }

  async getStackFrames(): Promise<StackFrame[]> {
    const result = await this.execute('-stack-list-frames');
    if (result.class !== 'done') return [];

    const stack = result.results.stack as any[];
    if (!Array.isArray(stack)) return [];

    return stack.map((frame: any) => ({
      level: parseInt(frame.level, 10),
      func: frame.func || 'unknown',
      file: frame.file || frame.fullname || '',
      line: parseInt(frame.line, 10) || 0,
      addr: frame.addr || ''
    }));
  }

  async getLocals(frameLevel: number = 0): Promise<LocalVariable[]> {
    await this.execute(`-stack-select-frame ${frameLevel}`);
    const result = await this.execute('-stack-list-locals --all-values');
    if (result.class !== 'done') return [];

    const locals = result.results.locals as any[];
    if (!Array.isArray(locals)) return [];

    return locals.map((local: any) => ({
      name: local.name,
      value: local.value,
      type: local.type || 'unknown'
    }));
  }

  async getArguments(frameLevel: number = 0): Promise<LocalVariable[]> {
    await this.execute(`-stack-select-frame ${frameLevel}`);
    const result = await this.execute('-stack-list-arguments --all-values 0 0');
    if (result.class !== 'done') return [];

    const frameArgs = result.results['stack-args'] as any[];
    if (!Array.isArray(frameArgs) || frameArgs.length === 0) return [];

    const frame = frameArgs[0];
    const args = frame?.args as any[];
    if (!Array.isArray(args)) return [];

    return args.map((arg: any) => ({
      name: arg.name,
      value: arg.value,
      type: arg.type || 'unknown'
    }));
  }

  async evaluate(expression: string): Promise<string> {
    const result = await this.execute(`-data-evaluate-expression "${expression}"`);
    if (result.class === 'error') {
      throw new Error(`Failed to evaluate: ${expression} - ${result.results.msg}`);
    }
    return result.results.value as string;
  }

  async getAddress(varName: string): Promise<string> {
    try {
      const result = await this.evaluate(`&${varName}`);
      // GDB 반환: (int *) 0x7fff... 형태
      const match = result.match(/0x[0-9a-fA-F]+/);
      return match ? match[0] : '';
    } catch {
      return '';
    }
  }

  async getType(varName: string): Promise<string> {
    try {
      const result = await this.execute(`-var-create - * ${varName}`);
      if (result.class === 'done') {
        // 생성된 var-object 정리
        const name = result.results.name as string;
        await this.execute(`-var-delete ${name}`);
        return result.results.type as string || 'unknown';
      }
    } catch {
      // 무시
    }
    return 'unknown';
  }

  async readMemory(address: string, count: number): Promise<MemoryContent> {
    try {
      const result = await this.execute(
        `-data-read-memory-bytes ${address} ${count}`
      );

      if (result.class !== 'done') {
        return { address, bytes: [] };
      }

      const memory = result.results.memory as any[];
      if (!Array.isArray(memory) || memory.length === 0) {
        return { address, bytes: [] };
      }

      const contents = memory[0].contents as string;
      const bytes: number[] = [];
      for (let i = 0; i < contents.length; i += 2) {
        bytes.push(parseInt(contents.slice(i, i + 2), 16));
      }

      return { address, bytes };
    } catch {
      return { address, bytes: [] };
    }
  }

  /**
   * 포인터 역참조 값 조회
   */
  async dereferencePointer(pointerName: string): Promise<string> {
    try {
      return await this.evaluate(`*${pointerName}`);
    } catch {
      return '(invalid)';
    }
  }

  /**
   * 이중 포인터 역참조
   */
  async dereferenceDoublePointer(pointerName: string): Promise<{ first: string; second: string }> {
    try {
      const first = await this.evaluate(`*${pointerName}`);
      const second = await this.evaluate(`**${pointerName}`);
      return { first, second };
    } catch {
      return { first: '(invalid)', second: '(invalid)' };
    }
  }

  private parseStoppedEvent(record: any): StoppedEvent {
    const results = record.results;
    const frame = results.frame as any;

    return {
      reason: results.reason as string,
      frame: frame ? {
        level: parseInt(frame.level, 10) || 0,
        func: frame.func || '',
        file: frame.file || '',
        line: parseInt(frame.line, 10) || 0,
        addr: frame.addr || ''
      } : undefined,
      threadId: results['thread-id'] as string,
      signal: results['signal-name'] as string
    };
  }

  async quit(): Promise<void> {
    try {
      await this.execute('-gdb-exit');
    } catch {
      // 무시
    }

    if (this.process && !this.process.killed) {
      this.process.kill('SIGKILL');
    }
    this.process = null;
  }
}
```

### Phase 3: 스냅샷 빌더 (3주차)

#### 5.3.1 SnapshotBuilder 구현 (V1 호환)

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/snapshot-builder.ts

import { GDBClient } from './gdb-client';
import { ExplanationGenerator } from './explanation-generator';
import type {
  Step,
  MemoryBlock,
  StackFrame,
  VisualizationEvent,
  StoppedEvent
} from '../types';

interface MallocTracker {
  address: string;
  size: number;
  varName: string;
}

export class SnapshotBuilder {
  private previousSnapshot: Step | null = null;
  private mallocBlocks: Map<string, MallocTracker> = new Map();
  private stdoutBuffer: string = '';
  private explanationGen: ExplanationGenerator;

  constructor(private client: GDBClient) {
    this.explanationGen = new ExplanationGenerator();
  }

  async capture(
    event: StoppedEvent,
    sourceLines: string[]
  ): Promise<Step | null> {
    const frames = await this.client.getStackFrames();
    if (frames.length === 0) return null;

    const currentFrame = frames[0];

    // 사용자 코드만
    if (!currentFrame.file || !currentFrame.file.endsWith('.c')) {
      return null;
    }

    const lineNumber = currentFrame.line;
    const code = sourceLines[lineNumber - 1] || '';

    // 스택 빌드 (V1 형식: MemoryBlock[])
    const stack = await this.buildStack(frames);

    // 힙 빌드 (V1 형식: MemoryBlock[])
    const heap = await this.buildHeap();

    // 이벤트 생성 (V1 shared 패키지 호환)
    const events = this.buildEvents(stack, heap, currentFrame);

    // 설명 생성 (비유적 표현 포함)
    const explanation = this.explanationGen.generate(
      code,
      currentFrame.func,
      stack,
      this.previousSnapshot
    );

    const step: Step = {
      line: lineNumber,
      code,
      stack,
      heap,  // MemoryBlock[] (V1 호환)
      explanation,
      rsp: await this.getRSP(),
      rbp: await this.getRBP(),
      functionName: currentFrame.func,
      callDepth: frames.filter(f => f.file?.endsWith('.c')).length,
      stdout: this.stdoutBuffer || undefined,
      events
    };

    this.previousSnapshot = step;
    return step;
  }

  /**
   * 스택 변수 빌드 (V1 MemoryBlock 형식)
   */
  private async buildStack(frames: StackFrame[]): Promise<MemoryBlock[]> {
    const blocks: MemoryBlock[] = [];

    for (const frame of frames) {
      if (!frame.file?.endsWith('.c')) continue;

      const locals = await this.client.getLocals(frame.level);
      const args = await this.client.getArguments(frame.level);
      const allVars = [...args, ...locals];

      for (const variable of allVars) {
        const address = await this.client.getAddress(variable.name);
        const type = await this.client.getType(variable.name);
        const size = this.getTypeSize(type);
        const bytes = await this.getBytes(address, size);

        const block: MemoryBlock = {
          name: `${frame.func}.${variable.name}`,
          address: this.formatAddress(address),
          type: this.formatType(type),
          size,
          bytes,
          value: this.formatValue(variable.value, type),
          points_to: null,  // V1 형식: null 또는 string
          explanation: ''   // V1 형식: 각 변수 설명
        };

        // 포인터 처리
        if (type.includes('*')) {
          block.points_to = this.formatAddress(variable.value);

          // 이중 포인터 처리
          if (type.includes('**')) {
            try {
              const deref = await this.client.dereferenceDoublePointer(variable.name);
              block.points_to = this.formatAddress(deref.first);
            } catch {
              // 무시
            }
          }
        }

        blocks.push(block);
      }
    }

    return blocks;
  }

  /**
   * 힙 빌드 (V1 MemoryBlock 형식)
   */
  private async buildHeap(): Promise<MemoryBlock[]> {
    const blocks: MemoryBlock[] = [];

    for (const [address, tracker] of this.mallocBlocks) {
      const memory = await this.client.readMemory(address, Math.min(tracker.size, 64));

      blocks.push({
        name: tracker.varName,
        address: this.formatAddress(address),
        type: 'heap',
        size: tracker.size,
        bytes: memory.bytes,
        value: this.formatHeapContent(memory.bytes, tracker.size),
        points_to: null,
        explanation: `malloc(${tracker.size})로 할당됨`
      });
    }

    return blocks;
  }

  /**
   * malloc 추적 (주소 기반)
   */
  trackMalloc(varName: string, address: string, size: number): void {
    const normalizedAddr = this.formatAddress(address);
    this.mallocBlocks.set(normalizedAddr, { address: normalizedAddr, size, varName });
  }

  trackFree(address: string): void {
    const normalizedAddr = this.formatAddress(address);
    this.mallocBlocks.delete(normalizedAddr);
  }

  appendStdout(text: string): void {
    this.stdoutBuffer += text;
  }

  /**
   * 이벤트 빌드 (V1 shared 패키지 VisualizationEvent 형식)
   */
  private buildEvents(
    stack: MemoryBlock[],
    heap: MemoryBlock[],
    currentFrame: StackFrame
  ): VisualizationEvent[] {
    const events: VisualizationEvent[] = [];

    if (!this.previousSnapshot) {
      // 첫 스냅샷: 프레임 push + 변수 declare
      events.push({
        type: 'frame',
        action: 'push',
        name: currentFrame.func
      });

      for (const block of stack) {
        const [frame, name] = block.name.split('.');
        events.push({
          type: 'variable',
          action: 'declare',
          frame,
          name,
          varType: block.type,
          value: block.value,
          address: block.address,
          size: block.size
        });
      }
      return events;
    }

    const prevStack = new Map(this.previousSnapshot.stack.map(b => [b.name, b]));
    const prevHeap = new Map(this.previousSnapshot.heap.map(b => [b.address, b]));

    // 프레임 변경
    const prevFunc = this.previousSnapshot.functionName;
    const currFunc = currentFrame.func;

    if (prevFunc !== currFunc) {
      if ((this.previousSnapshot.callDepth || 0) < stack.length) {
        events.push({ type: 'frame', action: 'push', name: currFunc });
      } else {
        events.push({ type: 'frame', action: 'pop', name: prevFunc! });
      }
    }

    // 변수 변경
    for (const block of stack) {
      const [frame, name] = block.name.split('.');
      const prev = prevStack.get(block.name);

      if (!prev) {
        events.push({
          type: 'variable',
          action: 'declare',
          frame,
          name,
          varType: block.type,
          value: block.value,
          address: block.address,
          size: block.size
        });
      } else if (prev.value !== block.value) {
        events.push({
          type: 'variable',
          action: 'assign',
          frame,
          name,
          value: block.value,
          previousValue: prev.value
        });

        // 포인터 변경
        if (block.points_to && block.points_to !== prev.points_to) {
          events.push({
            type: 'pointer',
            action: 'assign',
            pointer: block.name,
            targetAddress: block.points_to,
            frame
          });
        }
      }
    }

    // 힙 변경
    for (const block of heap) {
      const prev = prevHeap.get(block.address);

      if (!prev) {
        events.push({
          type: 'heap',
          action: 'allocate',
          address: block.address,
          size: block.size,
          name: block.name,
          heapType: 'int'
        });
      } else if (JSON.stringify(prev.bytes) !== JSON.stringify(block.bytes)) {
        events.push({
          type: 'heap',
          action: 'write',
          address: block.address,
          value: block.value
        });
      }
    }

    // 해제된 힙
    for (const [addr] of prevHeap) {
      if (!heap.find(b => b.address === addr)) {
        events.push({
          type: 'heap',
          action: 'free',
          address: addr
        });
      }
    }

    // stdout 변경
    if (this.stdoutBuffer && this.stdoutBuffer !== this.previousSnapshot.stdout) {
      const newOutput = this.stdoutBuffer.slice(this.previousSnapshot.stdout?.length || 0);
      if (newOutput) {
        events.push({
          type: 'output',
          stream: 'stdout',
          text: newOutput
        });
      }
    }

    return events;
  }

  private async getRSP(): Promise<string> {
    try {
      const result = await this.client.evaluate('$rsp');
      return this.formatAddress(result);
    } catch {
      return '0x0';
    }
  }

  private async getRBP(): Promise<string> {
    try {
      const result = await this.client.evaluate('$rbp');
      return this.formatAddress(result);
    } catch {
      return '0x0';
    }
  }

  private async getBytes(address: string, size: number): Promise<number[]> {
    if (!address || address === '0x0') return [];
    try {
      const memory = await this.client.readMemory(address, size);
      return memory.bytes;
    } catch {
      return [];
    }
  }

  private formatAddress(address: string): string {
    if (!address) return '0x0';
    const match = address.match(/0x[0-9a-fA-F]+/);
    return match ? match[0] : '0x0';
  }

  private formatType(type: string): string {
    return type.replace(/\s+/g, ' ').trim();
  }

  private getTypeSize(type: string): number {
    if (type.includes('*')) return 8;
    if (type.includes('char')) return 1;
    if (type.includes('short')) return 2;
    if (type.includes('int')) return 4;
    if (type.includes('long long')) return 8;
    if (type.includes('long')) return 8;
    if (type.includes('float')) return 4;
    if (type.includes('double')) return 8;
    return 4;
  }

  private formatValue(value: string, type: string): string {
    if (!value) return '(uninitialized)';

    if (type.includes('char') && !type.includes('*')) {
      const code = parseInt(value, 10);
      if (!isNaN(code) && code >= 32 && code < 127) {
        return `'${String.fromCharCode(code)}'`;
      }
    }
    return value;
  }

  private formatHeapContent(bytes: number[], size: number): string {
    if (bytes.length === 0) return '(uninitialized)';

    if (size % 4 === 0 && bytes.length >= 4) {
      const ints: number[] = [];
      for (let i = 0; i < Math.min(bytes.length, 20); i += 4) {
        if (i + 3 < bytes.length) {
          const val = bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16) | (bytes[i + 3] << 24);
          ints.push(val);
        }
      }
      return `[${ints.join(', ')}]`;
    }

    return bytes.slice(0, 16).map(b => b.toString(16).padStart(2, '0')).join(' ');
  }
}
```

---

## 6. 타입 정의

### 6.1 GDB 관련 타입 (`types/gdb.ts`)

```typescript
// packages/backend/src/modules/simulators/c/v2/types/gdb.ts

export type MIValue = string | MITuple | MIList;
export type MITuple = Record<string, MIValue>;
export type MIList = MIValue[];

export interface MIRecord {
  type: 'result' | 'async' | 'stream';
}

export interface MIResultRecord extends MIRecord {
  type: 'result';
  class: 'done' | 'running' | 'connected' | 'error' | 'exit';
  results: Record<string, MIValue>;
  token?: number;
}

export interface MIAsyncRecord extends MIRecord {
  type: 'async';
  asyncType: '*' | '+' | '=';
  asyncClass: string;
  results: Record<string, MIValue>;
}

export interface MIStreamRecord extends MIRecord {
  type: 'stream';
  streamType: '~' | '@' | '&';
  content: string;
}

export interface StackFrame {
  level: number;
  func: string;
  file: string;
  line: number;
  addr: string;
}

export interface LocalVariable {
  name: string;
  value: string;
  type: string;
}

export interface MemoryContent {
  address: string;
  bytes: number[];
}

export interface StoppedEvent {
  reason: string;
  frame?: StackFrame;
  threadId?: string;
  signal?: string;
}
```

### 6.2 스냅샷 타입 - V1 호환 (`types/snapshot.ts`)

```typescript
// packages/backend/src/modules/simulators/c/v2/types/snapshot.ts

// V1과 동일한 MemoryBlock 타입 (API 호환성)
export interface MemoryBlock {
  name: string;           // main.x, swap.a
  address: string;        // 0x7fff...
  type: string;           // int, int*, float
  size: number;           // 바이트 크기
  bytes: number[];        // [0x0a, 0x00, 0x00, 0x00]
  value: string;          // 10, 0x555...
  points_to: string | null;  // V1 형식: null 또는 주소
  explanation: string;    // V1 형식: 각 변수 설명
}

// V1 shared 패키지의 VisualizationEvent import
import type { VisualizationEvent } from '@codeinsight/shared';
export type { VisualizationEvent };

// Step 타입 (V1 호환)
export interface Step {
  line: number;
  code: string;
  stack: MemoryBlock[];
  heap: MemoryBlock[];    // V1 형식: MemoryBlock[] (HeapBlock 아님)
  explanation: string;
  rsp: string;
  rbp: string;
  functionName?: string;
  callDepth?: number;
  stdout?: string;
  events?: VisualizationEvent[];
}

// 시뮬레이션 결과 (V1 호환)
export interface CSimulationResult {
  success: boolean;
  steps?: Step[];
  source_lines?: string[];
  warnings?: string[];    // V1 형식: 경고 배열
  // V1 호환 에러 형식
  error?: string;
  message?: string;
  details?: Array<{
    file: string;
    line: number;
    column: number;
    type: string;
    message: string;
  }>;
}
```

### 6.3 에러 코드 (`types/errors.ts`)

```typescript
// packages/backend/src/modules/simulators/c/v2/types/errors.ts

export type SimulationErrorCode =
  | 'CODE_TOO_LONG'
  | 'DANGEROUS_CODE'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIMEOUT'
  | 'MAX_STEPS_EXCEEDED'
  | 'GDB_ERROR'
  | 'INTERNAL_ERROR';

// V1 호환 에러 타입
export type V1ErrorType = 'compilation_error' | 'runtime_error' | 'internal_error';

export function toV1ErrorType(code: SimulationErrorCode): V1ErrorType {
  switch (code) {
    case 'COMPILE_ERROR':
      return 'compilation_error';
    case 'RUNTIME_ERROR':
    case 'TIMEOUT':
    case 'MAX_STEPS_EXCEEDED':
      return 'runtime_error';
    default:
      return 'internal_error';
  }
}
```

---

## 7. Explanation 생성 시스템

### 7.1 ExplanationGenerator 구현

```typescript
// packages/backend/src/modules/simulators/c/v2/engine/explanation-generator.ts

import type { MemoryBlock, Step } from '../types';

/**
 * 한국어 설명 + 비유적 표현 생성기
 *
 * 목표:
 * - 기술적 설명과 함께 비유적 표현으로 이해도 향상
 * - 포인터를 "화살표", 메모리를 "사물함" 등으로 비유
 */
export class ExplanationGenerator {
  /**
   * 코드 라인에 대한 설명 생성
   */
  generate(
    code: string,
    funcName: string,
    stack: MemoryBlock[],
    prevSnapshot: Step | null
  ): string {
    const trimmedCode = code.trim();

    // 함수 진입
    if (!prevSnapshot || prevSnapshot.functionName !== funcName) {
      return this.functionEntry(funcName);
    }

    // 패턴 매칭으로 설명 생성
    const explanation =
      this.tryVariableDecl(trimmedCode, stack, prevSnapshot) ||
      this.tryPointerDecl(trimmedCode, stack, prevSnapshot) ||
      this.tryPointerDeref(trimmedCode, stack, prevSnapshot) ||
      this.tryMalloc(trimmedCode, stack) ||
      this.tryFree(trimmedCode) ||
      this.tryArrayAccess(trimmedCode, stack, prevSnapshot) ||
      this.tryPrintf(trimmedCode) ||
      this.tryScanf(trimmedCode) ||
      this.tryReturn(trimmedCode) ||
      this.tryFunctionCall(trimmedCode) ||
      this.defaultExplanation(trimmedCode, funcName);

    return explanation;
  }

  private functionEntry(funcName: string): string {
    if (funcName === 'main') {
      return `🚀 프로그램 시작: main() 함수에 입장했습니다.\n` +
        `💡 비유: 프로그램이라는 건물의 정문(main)을 열고 들어온 것과 같아요.`;
    }
    return `📞 함수 호출: ${funcName}() 함수에 입장했습니다.\n` +
      `💡 비유: 새로운 방(${funcName})에 들어가서 일을 시작해요. 이전 방의 물건(변수)들은 그대로 두고 왔어요.`;
  }

  private tryVariableDecl(
    code: string,
    stack: MemoryBlock[],
    prevSnapshot: Step
  ): string | null {
    // int x = 10; 또는 int x;
    const match = code.match(/^(int|float|char|double|long)\s+(\w+)(?:\s*=\s*(.+))?;$/);
    if (!match) return null;

    const [, type, name, value] = match;
    const block = stack.find(b => b.name.endsWith(`.${name}`));

    if (!block) return null;

    const typeDesc = this.getTypeDescription(type);
    const sizeDesc = `${block.size}바이트`;

    if (value) {
      return `📦 변수 선언 + 초기화: ${type} ${name} = ${value}\n` +
        `• ${name}이라는 이름표가 붙은 ${typeDesc} 크기(${sizeDesc})의 사물함을 만들고, ${value}를 넣었습니다.\n` +
        `• 주소: ${block.address}\n` +
        `💡 비유: "${name}"이라고 쓰인 사물함을 하나 받아서 그 안에 ${value}를 보관했어요.`;
    }

    return `📦 변수 선언: ${type} ${name}\n` +
      `• ${name}이라는 이름의 ${typeDesc} 사물함(${sizeDesc})을 만들었습니다. 아직 값은 없어요.\n` +
      `• 주소: ${block.address}\n` +
      `💡 비유: 빈 사물함을 받아서 "${name}"이라는 이름표를 붙였어요.`;
  }

  private tryPointerDecl(
    code: string,
    stack: MemoryBlock[],
    prevSnapshot: Step
  ): string | null {
    // int *p = &x;
    const match = code.match(/^(int|float|char|double)\s*\*\s*(\w+)\s*=\s*&(\w+);$/);
    if (!match) return null;

    const [, type, ptrName, targetName] = match;
    const ptrBlock = stack.find(b => b.name.endsWith(`.${ptrName}`));
    const targetBlock = stack.find(b => b.name.endsWith(`.${targetName}`));

    if (!ptrBlock || !targetBlock) return null;

    return `🔗 포인터 선언: ${type}* ${ptrName} = &${targetName}\n` +
      `• ${ptrName}은 "${targetName}의 주소"를 저장하는 특별한 변수입니다.\n` +
      `• ${ptrName}의 값: ${ptrBlock.points_to} (= ${targetName}의 주소)\n` +
      `💡 비유: ${ptrName}은 "${targetName} 사물함의 위치를 가리키는 화살표"예요. ` +
      `화살표를 따라가면 ${targetName}의 값(${targetBlock.value})을 찾을 수 있어요.`;
  }

  private tryPointerDeref(
    code: string,
    stack: MemoryBlock[],
    prevSnapshot: Step
  ): string | null {
    // *p = 20;
    const assignMatch = code.match(/^\*(\w+)\s*=\s*(.+);$/);
    if (assignMatch) {
      const [, ptrName, value] = assignMatch;
      const ptrBlock = stack.find(b => b.name.endsWith(`.${ptrName}`));

      return `✏️ 포인터를 통한 값 변경: *${ptrName} = ${value}\n` +
        `• ${ptrName}이 가리키는 곳(${ptrBlock?.points_to || '?'})의 값을 ${value}로 변경했습니다.\n` +
        `💡 비유: ${ptrName} 화살표가 가리키는 사물함을 열어서, 안에 있던 값을 ${value}로 바꿨어요.`;
    }

    return null;
  }

  private tryMalloc(code: string, stack: MemoryBlock[]): string | null {
    const match = code.match(/(\w+)\s*=\s*(?:\([^)]+\))?\s*malloc\s*\((.+)\)/);
    if (!match) return null;

    const [, varName, sizeExpr] = match;

    return `🏗️ 동적 메모리 할당: ${varName} = malloc(${sizeExpr})\n` +
      `• 힙(heap) 영역에서 ${sizeExpr} 크기의 메모리를 빌렸습니다.\n` +
      `• ${varName}에 할당받은 메모리의 주소가 저장됩니다.\n` +
      `💡 비유: 창고(힙)에서 빈 공간을 빌리고, 그 위치를 ${varName} 화살표에 적어뒀어요. ` +
      `나중에 반드시 free()로 반납해야 해요!`;
  }

  private tryFree(code: string): string | null {
    const match = code.match(/free\s*\(\s*(\w+)\s*\)/);
    if (!match) return null;

    const [, varName] = match;

    return `🗑️ 메모리 해제: free(${varName})\n` +
      `• ${varName}이 가리키던 힙 메모리를 시스템에 반환했습니다.\n` +
      `• 주의: ${varName}은 이제 유효하지 않은 주소를 가리킵니다!\n` +
      `💡 비유: 창고에서 빌렸던 공간을 반납했어요. ` +
      `${varName} 화살표는 아직 그 위치를 가리키지만, 그 공간은 이제 다른 사람 거예요.`;
  }

  private tryArrayAccess(
    code: string,
    stack: MemoryBlock[],
    prevSnapshot: Step
  ): string | null {
    const match = code.match(/(\w+)\[(.+)\]\s*=\s*(.+);/);
    if (!match) return null;

    const [, arrName, index, value] = match;

    return `📝 배열 요소 접근: ${arrName}[${index}] = ${value}\n` +
      `• ${arrName} 배열의 ${index}번째 칸에 ${value}를 저장했습니다.\n` +
      `💡 비유: ${arrName}이라는 연속된 사물함 중 ${index}번 사물함을 열어서 ${value}를 넣었어요.`;
  }

  private tryPrintf(code: string): string | null {
    if (!code.includes('printf')) return null;

    return `📢 출력: printf 호출\n` +
      `• 화면에 텍스트를 출력합니다.\n` +
      `💡 비유: 프로그램이 우리에게 말을 걸고 있어요!`;
  }

  private tryScanf(code: string): string | null {
    if (!code.includes('scanf')) return null;

    return `⌨️ 입력: scanf 호출\n` +
      `• 사용자로부터 값을 입력받아 변수에 저장합니다.\n` +
      `💡 비유: 프로그램이 우리에게 질문하고, 대답을 기다리고 있어요!`;
  }

  private tryReturn(code: string): string | null {
    const match = code.match(/return\s*(.+)?;/);
    if (!match) return null;

    const value = match[1]?.trim();

    if (value) {
      return `↩️ 함수 종료: return ${value}\n` +
        `• 현재 함수를 마치고 ${value}를 돌려줍니다.\n` +
        `💡 비유: 이 방에서 할 일을 마치고, ${value}라는 선물을 들고 이전 방으로 돌아가요.`;
    }

    return `↩️ 함수 종료: return\n` +
      `• 현재 함수를 마치고 돌아갑니다.\n` +
      `💡 비유: 이 방에서 할 일을 마치고 이전 방으로 돌아가요.`;
  }

  private tryFunctionCall(code: string): string | null {
    const match = code.match(/(\w+)\s*\(/);
    if (!match) return null;

    const funcName = match[1];
    if (['printf', 'scanf', 'malloc', 'free', 'if', 'while', 'for'].includes(funcName)) {
      return null;
    }

    return `📞 함수 호출: ${funcName}()\n` +
      `• ${funcName} 함수를 호출합니다.\n` +
      `💡 비유: ${funcName}이라는 방에 들어가서 일을 시켜요.`;
  }

  private defaultExplanation(code: string, funcName: string): string {
    return `📍 ${funcName}() 함수 실행 중\n` +
      `• 코드: ${code}`;
  }

  private getTypeDescription(type: string): string {
    switch (type) {
      case 'int': return '정수형(int)';
      case 'float': return '실수형(float)';
      case 'double': return '실수형(double)';
      case 'char': return '문자형(char)';
      case 'long': return '긴 정수형(long)';
      default: return type;
    }
  }
}
```

---

## 8. 교육 범위 정의

### 8.1 V2에서 지원하는 기능

```c
// ✅ 모든 기본 타입
int, float, double, char, long, short

// ✅ 모든 포인터 연산
int *p = &x;
*p = 20;
int **pp = &p;
**pp = 30;

// ✅ 배열
int arr[5] = {1, 2, 3, 4, 5};
arr[2] = 100;

// ✅ 동적 메모리
int *heap = malloc(sizeof(int) * 10);
free(heap);

// ✅ 구조체
struct Point { int x; int y; };
struct Point p1 = {10, 20};

// ✅ 중첩 함수 호출
int result = add(multiply(2, 3), 4);

// ✅ 표준 라이브러리
strlen, strcpy, sqrt, pow 등
```

### 8.2 제한 사항 (보안상)

```c
// ❌ 금지 - 프로세스/네트워크
fork(), exec(), system()
socket(), connect()
```

---

## 9. 테스트 전략

### 9.1 단위 테스트

```typescript
describe('MIParser', () => {
  it('should parse multi-line response', () => {
    const parser = new MIParser();
    parser.addData('^done,locals=[\n');
    parser.addData('{name="x",value="10"}\n');
    parser.addData(']\n');
    // 검증
  });

  it('should parse error response', () => {
    const parser = new MIParser();
    const records = parser.addData('^error,msg="Variable not found"\n');
    expect(records[0].class).toBe('error');
  });
});
```

### 9.2 통합 테스트

```typescript
describe('C Simulator V2', () => {
  it('should trace pointer operations', async () => {
    const code = `
      int main() {
        int x = 10;
        int *p = &x;
        *p = 20;
        return 0;
      }
    `;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    // V1 형식 검증
    expect(result.steps![0].heap).toBeInstanceOf(Array);
    expect(result.warnings).toBeDefined();
  });

  it('should handle stdin correctly', async () => {
    const code = `
      #include <stdio.h>
      int main() {
        int x;
        scanf("%d", &x);
        printf("%d", x * 2);
        return 0;
      }
    `;
    const result = await service.simulate(code, '21');

    expect(result.success).toBe(true);
    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stdout).toContain('42');
  });
});
```

---

## 10. 마이그레이션 계획

### 10.1 Feature Flag 구현

```typescript
// routes.ts
const USE_V2_SIMULATOR = process.env.C_SIMULATOR_VERSION === 'v2';

router.post('/trace', async (req, res, next) => {
  const { code, stdin } = req.body;

  if (USE_V2_SIMULATOR) {
    const service = new CSimulationServiceV2();
    const result = await service.simulate(code, stdin);
    return res.json(result);  // V1 호환 형식
  } else {
    // 기존 V1 로직
    const result = await simulateCode(code, stdin);
    return res.json(result);
  }
});
```

### 10.2 V1 호환 응답 형식

```typescript
// V2 서비스에서 V1 형식으로 응답
async simulate(code: string, stdin?: string): Promise<CSimulationResult> {
  // ...
  if (compileResult.success === false) {
    // V1 형식 에러 응답
    return {
      success: false,
      error: 'compilation_error',
      message: '컴파일 에러가 발생했습니다.',
      details: compileResult.errors
    };
  }
  // ...
  return {
    success: true,
    steps,
    source_lines: sourceLines,
    warnings: this.collectWarnings()
  };
}
```

---

## 11. 리스크 및 대응책

### 11.1 기술적 리스크

| 리스크 | 확률 | 영향 | 대응책 |
|--------|------|------|--------|
| GDB 프로세스 불안정 | 중 | 높음 | 타임아웃 + 강제 kill |
| stdin 처리 실패 | 중 | 중 | 파일 기반 리다이렉션 |
| MI 파싱 에러 | 중 | 중 | 버퍼링 + 로깅 |
| 성능 저하 (100-500ms) | 높 | 중 | V1 기본값, V2 선택적 |

### 11.2 호환성 리스크

| 리스크 | 대응책 |
|--------|--------|
| Step 타입 불일치 | V1 MemoryBlock[] 형식 유지 |
| 에러 응답 불일치 | V1 형식 (`error: string`) 유지 |
| VisualizationEvent 불일치 | shared 패키지 import 사용 |

---

## 📅 일정 요약

| Phase | 기간 | 산출물 |
|-------|------|--------|
| Phase 1 | 1주차 | FileManager, GCCCompiler |
| Phase 2 | 2주차 | MIParser, GDBClient |
| Phase 3 | 3주차 | SnapshotBuilder, ExplanationGenerator |
| Phase 4 | 4주차 | 서비스 통합, 테스트 |
| Phase 5 | 5주차 | V1/V2 병행, 전환 |

---

## 📝 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-02-02 | 초안 작성 |
| 2.0 | 2026-02-02 | 이슈 반영 완료 |

### v2.0 변경 사항
- ✅ Step.heap 타입 V1 호환 (MemoryBlock[])
- ✅ MemoryBlock에 points_to: string | null, explanation 추가
- ✅ VisualizationEvent를 shared 패키지에서 import
- ✅ stdin 처리 방식 명확화 (파일 기반 리다이렉션)
- ✅ 에러 응답 V1 형식 유지 (error: string)
- ✅ warnings 필드 추가
- ✅ 컴파일 에러 파서 추가 (GCC stderr → 구조화)
- ✅ MIParser 강화 (버퍼링, 토큰, 에러 처리)
- ✅ ExplanationGenerator 추가 (비유적 표현)
- ✅ 이중 포인터 처리 추가
- ✅ V1 호환성 테스트 케이스 추가

---

> **문서 버전**: 2.0
> **최종 수정일**: 2026-02-02
> **상태**: Ready for Implementation
