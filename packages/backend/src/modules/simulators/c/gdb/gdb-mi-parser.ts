/**
 * GDB/MI (Machine Interface) 출력 파서
 *
 * GDB/MI 프로토콜 형식:
 *   ^done,key="value",list=[item1,item2],tuple={a="1",b="2"}
 *   *stopped,reason="breakpoint-hit",frame={...}
 *   ~"console output\n"
 *   @"target output\n"
 *   &"log output\n"
 *   (gdb)
 *
 * 참고: https://sourceware.org/gdb/current/onlinedocs/gdb.html/GDB_002fMI-Output-Syntax.html
 */

import type { MiRecord, MiValue, MiTuple } from './types';

/**
 * GDB/MI 원시 출력을 파싱하여 구조화된 MiRecord 배열로 변환
 */
export function parseMiOutput(raw: string): MiRecord[] {
  const records: MiRecord[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '(gdb)') continue;

    const record = parseMiLine(trimmed);
    if (record) {
      records.push(record);
    }
  }

  return records;
}

/**
 * 단일 MI 라인 파싱
 */
function parseMiLine(line: string): MiRecord | null {
  if (line.length === 0) return null;

  const firstChar = line[0];

  // Stream records: ~"...", @"...", &"..."
  if (firstChar === '~' || firstChar === '@' || firstChar === '&') {
    const type = firstChar === '~' ? 'console'
      : firstChar === '@' ? 'target'
      : 'log';

    return {
      type,
      data: { text: parseCString(line.slice(1)) },
      raw: line,
    };
  }

  // Result record: ^class,results...
  if (firstChar === '^') {
    return parseAsyncOrResult('result', line.slice(1), line);
  }

  // Exec async record: *class,results...
  if (firstChar === '*') {
    return parseAsyncOrResult('exec', line.slice(1), line);
  }

  // Notify async record: =class,results...
  if (firstChar === '=') {
    return parseAsyncOrResult('notify', line.slice(1), line);
  }

  // Token-prefixed records (e.g., "123^done,...")
  const tokenMatch = line.match(/^(\d+)([*^=])/);
  if (tokenMatch) {
    const rest = line.slice(tokenMatch[0].length);
    const type = tokenMatch[2] === '^' ? 'result'
      : tokenMatch[2] === '*' ? 'exec'
      : 'notify';
    return parseAsyncOrResult(type, rest, line);
  }

  return null;
}

/**
 * Result/Async record 파싱
 * 입력: "done,key=value,..." 또는 "stopped,reason=..."
 */
function parseAsyncOrResult(
  type: MiRecord['type'],
  content: string,
  raw: string
): MiRecord {
  // class와 결과 분리
  const commaIdx = content.indexOf(',');
  let recordClass: string;
  let resultPart: string;

  if (commaIdx === -1) {
    recordClass = content;
    resultPart = '';
  } else {
    recordClass = content.slice(0, commaIdx);
    resultPart = content.slice(commaIdx + 1);
  }

  const data: Record<string, MiValue> = {};
  if (resultPart) {
    parseResults(resultPart, data);
  }

  return { type, class: recordClass, data, raw };
}

// ============================================
// MI 값 파서 (재귀적)
// ============================================

/**
 * 커서 기반 파서 상태
 */
class Parser {
  pos = 0;
  constructor(public input: string) {}

  peek(): string { return this.input[this.pos] ?? ''; }
  advance(): string { return this.input[this.pos++] ?? ''; }
  hasMore(): boolean { return this.pos < this.input.length; }
  skipWhitespace(): void {
    while (this.pos < this.input.length && this.input[this.pos] === ' ') {
      this.pos++;
    }
  }
}

/**
 * key=value 쌍들을 파싱하여 data 객체에 채움
 */
function parseResults(input: string, data: Record<string, MiValue>): void {
  const parser = new Parser(input);

  while (parser.hasMore()) {
    parser.skipWhitespace();
    if (!parser.hasMore()) break;

    // key 파싱
    const key = parseIdentifier(parser);
    if (!key) break;

    // '=' 기대
    if (parser.peek() !== '=') break;
    parser.advance();

    // value 파싱
    const value = parseValue(parser);
    data[key] = value;

    // ',' 스킵 (다음 쌍)
    if (parser.peek() === ',') {
      parser.advance();
    }
  }
}

/**
 * MI 식별자 파싱 (알파벳, 숫자, 하이픈, 언더스코어)
 */
function parseIdentifier(parser: Parser): string {
  let id = '';
  while (parser.hasMore()) {
    const ch = parser.peek();
    if (/[a-zA-Z0-9_-]/.test(ch)) {
      id += parser.advance();
    } else {
      break;
    }
  }
  return id;
}

/**
 * MI 값 파싱 (문자열, 리스트, 튜플)
 */
function parseValue(parser: Parser): MiValue {
  const ch = parser.peek();

  if (ch === '"') {
    return parseString(parser);
  }
  if (ch === '{') {
    return parseTuple(parser);
  }
  if (ch === '[') {
    return parseList(parser);
  }

  // fallback: 다음 구분자까지 읽기
  let val = '';
  while (parser.hasMore() && parser.peek() !== ',' && parser.peek() !== '}' && parser.peek() !== ']') {
    val += parser.advance();
  }
  return val;
}

/**
 * C 스타일 문자열 파싱 ("..." with escapes)
 */
function parseString(parser: Parser): string {
  if (parser.peek() !== '"') return '';
  parser.advance(); // 시작 "

  let result = '';
  while (parser.hasMore()) {
    const ch = parser.advance();
    if (ch === '"') break;
    if (ch === '\\') {
      const escaped = parser.advance();
      switch (escaped) {
        case 'n': result += '\n'; break;
        case 't': result += '\t'; break;
        case 'r': result += '\r'; break;
        case '\\': result += '\\'; break;
        case '"': result += '"'; break;
        case '0': result += '\0'; break;
        default: result += '\\' + escaped;
      }
    } else {
      result += ch;
    }
  }
  return result;
}

/**
 * MI 튜플 파싱 ({key=value,...})
 */
function parseTuple(parser: Parser): MiTuple {
  if (parser.peek() !== '{') return {};
  parser.advance(); // {

  const tuple: MiTuple = {};

  while (parser.hasMore() && parser.peek() !== '}') {
    parser.skipWhitespace();
    if (parser.peek() === '}') break;

    const key = parseIdentifier(parser);
    if (!key) {
      // 값만 있는 경우 (리스트 안의 튜플)
      if (parser.peek() === '"' || parser.peek() === '{' || parser.peek() === '[') {
        // anonymous tuple 처리 불필요, break
      }
      break;
    }

    if (parser.peek() === '=') {
      parser.advance();
      tuple[key] = parseValue(parser);
    }

    if (parser.peek() === ',') {
      parser.advance();
    }
  }

  if (parser.peek() === '}') parser.advance(); // }
  return tuple;
}

/**
 * MI 리스트 파싱 ([value,...] 또는 [key=value,...])
 */
function parseList(parser: Parser): MiValue[] {
  if (parser.peek() !== '[') return [];
  parser.advance(); // [

  const items: MiValue[] = [];

  while (parser.hasMore() && parser.peek() !== ']') {
    parser.skipWhitespace();
    if (parser.peek() === ']') break;

    // key=value 형태인지 확인 (리스트 내 tuple)
    const saved = parser.pos;
    const maybeKey = parseIdentifier(parser);

    if (maybeKey && parser.peek() === '=') {
      // key=value 형태 → 튜플로 래핑
      parser.advance(); // =
      const val = parseValue(parser);
      items.push({ [maybeKey]: val });
    } else {
      // 일반 값
      parser.pos = saved;
      items.push(parseValue(parser));
    }

    if (parser.peek() === ',') {
      parser.advance();
    }
  }

  if (parser.peek() === ']') parser.advance(); // ]
  return items;
}

// ============================================
// 헬퍼: 스트림 문자열 파싱
// ============================================

/**
 * MI 스트림 레코드의 C 문자열 파싱
 * 예: '"Hello\\nWorld\\n"' → 'Hello\nWorld\n'
 */
function parseCString(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const inner = trimmed.slice(1, -1);
    return inner
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(/\\\\/g, '\\')
      .replace(/\\"/g, '"');
  }
  return trimmed;
}

// ============================================
// 편의 함수: 특정 타입 레코드 추출
// ============================================

/** result record 중 ^done 찾기 */
export function findResult(records: MiRecord[]): MiRecord | undefined {
  return records.find(r => r.type === 'result');
}

/** exec async record 중 *stopped 찾기 */
export function findStopped(records: MiRecord[]): MiRecord | undefined {
  return records.find(r => r.type === 'exec' && r.class === 'stopped');
}

/** console 출력 (~"...") 합치기 */
export function collectConsoleOutput(records: MiRecord[]): string {
  return records
    .filter(r => r.type === 'console')
    .map(r => r.data.text as string)
    .join('');
}

/** target 출력 (@"...") 합치기 — 프로그램 stdout */
export function collectTargetOutput(records: MiRecord[]): string {
  return records
    .filter(r => r.type === 'target')
    .map(r => r.data.text as string)
    .join('');
}

/**
 * MI 튜플에서 안전하게 문자열 추출
 */
export function getString(tuple: MiTuple, key: string): string | undefined {
  const val = tuple[key];
  return typeof val === 'string' ? val : undefined;
}

/**
 * MI 튜플에서 안전하게 숫자 추출
 */
export function getNumber(tuple: MiTuple, key: string): number | undefined {
  const val = tuple[key];
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}
