/**
 * Expression Parser
 * 재귀 하강 파서로 AST 생성
 *
 * 연산자 우선순위 (낮음 → 높음):
 * 1. ?: (삼항)
 * 2. || (논리 OR)
 * 3. && (논리 AND)
 * 4. ==, != (동등)
 * 5. <, >, <=, >= (비교)
 * 6. +, - (덧셈)
 * 7. *, /, % (곱셈)
 * 8. 단항: -, !, *, &
 * 9. 후위: [], ()
 * 10. 기본: 숫자, 변수
 */

import type { Token, TokenType, ASTNode } from './types';
import { tokenize } from './tokenizer';

export class Parser {
  private tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const result = this.parseTernary();
    if (this.current().type !== 'EOF') {
      // 남은 토큰이 있으면 무시 (세미콜론 등)
    }
    return result;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '', position: -1 };
  }

  private peek(offset: number = 1): Token {
    return this.tokens[this.pos + offset] || { type: 'EOF', value: '', position: -1 };
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private match(...types: TokenType[]): boolean {
    return types.includes(this.current().type);
  }

  private consume(type: TokenType, message: string): Token {
    if (this.current().type === type) {
      return this.advance();
    }
    throw new Error(`Parse error: ${message}, got ${this.current().type}`);
  }

  // ?: 삼항 연산자
  private parseTernary(): ASTNode {
    let condition = this.parseOr();

    if (this.match('QUESTION')) {
      this.advance(); // ?
      const consequent = this.parseTernary();
      this.consume('COLON', 'Expected ":" in ternary');
      const alternate = this.parseTernary();
      return {
        kind: 'TernaryExpr',
        condition,
        consequent,
        alternate,
      };
    }

    return condition;
  }

  // || 논리 OR
  private parseOr(): ASTNode {
    let left = this.parseAnd();

    while (this.match('OR')) {
      const op = this.advance().value;
      const right = this.parseAnd();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // && 논리 AND
  private parseAnd(): ASTNode {
    let left = this.parseEquality();

    while (this.match('AND')) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // ==, != 동등
  private parseEquality(): ASTNode {
    let left = this.parseComparison();

    while (this.match('EQ', 'NE')) {
      const op = this.advance().value;
      const right = this.parseComparison();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // <, >, <=, >= 비교
  private parseComparison(): ASTNode {
    let left = this.parseAdditive();

    while (this.match('LT', 'GT', 'LE', 'GE')) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // +, - 덧셈/뺄셈
  private parseAdditive(): ASTNode {
    let left = this.parseMultiplicative();

    while (this.match('PLUS', 'MINUS')) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // *, /, % 곱셈/나눗셈
  private parseMultiplicative(): ASTNode {
    let left = this.parseUnary();

    while (this.match('STAR', 'SLASH', 'PERCENT')) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = { kind: 'BinaryExpr', operator: op, left, right };
    }

    return left;
  }

  // 단항 연산자: -, !, *, &
  private parseUnary(): ASTNode {
    if (this.match('MINUS', 'NOT', 'STAR', 'AMP')) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return { kind: 'UnaryExpr', operator: op, operand };
    }

    return this.parsePostfix();
  }

  // 후위: [], ()
  private parsePostfix(): ASTNode {
    let expr = this.parsePrimary();

    while (true) {
      if (this.match('LBRACKET')) {
        // 배열 인덱싱: arr[i]
        this.advance(); // [
        const index = this.parseTernary();
        this.consume('RBRACKET', 'Expected "]"');

        if (expr.kind === 'Identifier') {
          expr = { kind: 'IndexExpr', array: expr.name, index };
        } else {
          throw new Error('Array index on non-identifier');
        }
      } else if (this.match('LPAREN') && expr.kind === 'Identifier') {
        // 함수 호출: func(args)
        this.advance(); // (
        const args: ASTNode[] = [];

        if (!this.match('RPAREN')) {
          args.push(this.parseTernary());
          while (this.match('COMMA')) {
            this.advance();
            args.push(this.parseTernary());
          }
        }

        this.consume('RPAREN', 'Expected ")"');
        expr = { kind: 'CallExpr', callee: expr.name, args };
      } else {
        break;
      }
    }

    return expr;
  }

  // 기본: 숫자, 문자, 변수, sizeof, 괄호
  private parsePrimary(): ASTNode {
    const token = this.current();

    // 숫자
    if (token.type === 'NUMBER') {
      this.advance();
      let value: number;
      if (token.value.startsWith('0x') || token.value.startsWith('0X')) {
        value = parseInt(token.value, 16);
      } else if (token.value.includes('.')) {
        value = parseFloat(token.value);
      } else {
        value = parseInt(token.value, 10);
      }
      return { kind: 'NumberLiteral', value };
    }

    // 문자 리터럴
    if (token.type === 'CHAR') {
      this.advance();
      return { kind: 'CharLiteral', value: token.value.charCodeAt(0) };
    }

    // sizeof
    if (token.type === 'SIZEOF') {
      this.advance();
      this.consume('LPAREN', 'Expected "(" after sizeof');
      const operand = this.current().value;
      this.advance();
      this.consume('RPAREN', 'Expected ")" after sizeof');
      return { kind: 'SizeofExpr', operand };
    }

    // 식별자 (변수 또는 함수)
    if (token.type === 'IDENTIFIER') {
      this.advance();
      return { kind: 'Identifier', name: token.value };
    }

    // 괄호
    if (token.type === 'LPAREN') {
      this.advance();
      const expr = this.parseTernary();
      this.consume('RPAREN', 'Expected ")"');
      return expr;
    }

    throw new Error(`Unexpected token: ${token.type} "${token.value}"`);
  }
}

/** 편의 함수: 문자열 → AST */
export function parse(input: string): ASTNode {
  const tokens = tokenize(input);
  return new Parser(tokens).parse();
}
