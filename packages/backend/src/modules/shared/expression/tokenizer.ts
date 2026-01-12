/**
 * Expression Tokenizer
 * 표현식 문자열을 토큰으로 분리
 *
 * 언어에 무관한 공통 토큰화 로직
 */

import type { Token, TokenType } from './types';

const KEYWORDS: Record<string, TokenType> = {
  sizeof: 'SIZEOF',
};

const SINGLE_CHAR_TOKENS: Record<string, TokenType> = {
  '+': 'PLUS',
  '-': 'MINUS',
  '*': 'STAR',
  '/': 'SLASH',
  '%': 'PERCENT',
  '(': 'LPAREN',
  ')': 'RPAREN',
  '[': 'LBRACKET',
  ']': 'RBRACKET',
  ',': 'COMMA',
  '?': 'QUESTION',
  ':': 'COLON',
  '!': 'NOT',
  '&': 'AMP',
  '<': 'LT',
  '>': 'GT',
};

export class Tokenizer {
  private input: string;
  private pos: number = 0;
  private tokens: Token[] = [];

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    while (this.pos < this.input.length) {
      this.skipWhitespace();
      if (this.pos >= this.input.length) break;

      const char = this.input[this.pos];

      // 숫자 (정수, 16진수, 실수)
      if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek(1)))) {
        this.readNumber();
        continue;
      }

      // 문자 리터럴 'a', '\n'
      if (char === "'") {
        this.readChar();
        continue;
      }

      // 식별자 또는 키워드
      if (this.isAlpha(char) || char === '_') {
        this.readIdentifier();
        continue;
      }

      // 2글자 연산자 확인
      const twoChar = this.input.slice(this.pos, this.pos + 2);
      if (this.readTwoCharOperator(twoChar)) {
        continue;
      }

      // 1글자 연산자
      if (SINGLE_CHAR_TOKENS[char]) {
        this.tokens.push({
          type: SINGLE_CHAR_TOKENS[char],
          value: char,
          position: this.pos,
        });
        this.pos++;
        continue;
      }

      // 알 수 없는 문자는 건너뜀
      this.pos++;
    }

    this.tokens.push({ type: 'EOF', value: '', position: this.pos });
    return this.tokens;
  }

  private skipWhitespace(): void {
    while (this.pos < this.input.length && /\s/.test(this.input[this.pos])) {
      this.pos++;
    }
  }

  private peek(offset: number = 0): string {
    return this.input[this.pos + offset] || '';
  }

  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  private isAlpha(char: string): boolean {
    return /[a-zA-Z_]/.test(char);
  }

  private isAlphaNumeric(char: string): boolean {
    return /[a-zA-Z0-9_]/.test(char);
  }

  private readNumber(): void {
    const start = this.pos;
    let value = '';

    // 16진수: 0x...
    if (this.input[this.pos] === '0' && (this.peek(1) === 'x' || this.peek(1) === 'X')) {
      value = '0x';
      this.pos += 2;
      while (this.pos < this.input.length && /[0-9a-fA-F]/.test(this.input[this.pos])) {
        value += this.input[this.pos++];
      }
    } else {
      // 정수 또는 실수
      while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
        value += this.input[this.pos++];
      }
      // 소수점
      if (this.input[this.pos] === '.' && this.isDigit(this.peek(1))) {
        value += this.input[this.pos++];
        while (this.pos < this.input.length && this.isDigit(this.input[this.pos])) {
          value += this.input[this.pos++];
        }
      }
    }

    this.tokens.push({ type: 'NUMBER', value, position: start });
  }

  private readChar(): void {
    const start = this.pos;
    this.pos++; // skip '
    let value = '';

    if (this.input[this.pos] === '\\') {
      // 이스케이프 시퀀스
      this.pos++;
      const escapeChar = this.input[this.pos++];
      switch (escapeChar) {
        case 'n': value = '\n'; break;
        case 't': value = '\t'; break;
        case 'r': value = '\r'; break;
        case '0': value = '\0'; break;
        case '\\': value = '\\'; break;
        case "'": value = "'"; break;
        default: value = escapeChar;
      }
    } else {
      value = this.input[this.pos++];
    }

    this.pos++; // skip closing '
    this.tokens.push({ type: 'CHAR', value, position: start });
  }

  private readIdentifier(): void {
    const start = this.pos;
    let value = '';

    while (this.pos < this.input.length && this.isAlphaNumeric(this.input[this.pos])) {
      value += this.input[this.pos++];
    }

    // 키워드 확인
    const type = KEYWORDS[value] || 'IDENTIFIER';
    this.tokens.push({ type, value, position: start });
  }

  private readTwoCharOperator(twoChar: string): boolean {
    const twoCharOps: Record<string, TokenType> = {
      '==': 'EQ',
      '!=': 'NE',
      '<=': 'LE',
      '>=': 'GE',
      '&&': 'AND',
      '||': 'OR',
    };

    if (twoCharOps[twoChar]) {
      this.tokens.push({
        type: twoCharOps[twoChar],
        value: twoChar,
        position: this.pos,
      });
      this.pos += 2;
      return true;
    }
    return false;
  }
}

/** 편의 함수: 문자열 → 토큰 배열 */
export function tokenize(input: string): Token[] {
  return new Tokenizer(input).tokenize();
}
