/**
 * AST Types for C Program Parsing
 * C 프로그램 파싱을 위한 AST 노드 타입 정의
 */

// 기본 노드 타입
export type NodeType =
  | 'program'
  | 'include'
  | 'global_var'
  | 'function_def'
  | 'statement'
  | 'declaration'
  | 'assignment'
  | 'function_call'
  | 'return'
  | 'if'
  | 'while'
  | 'for'
  | 'block';

// 기본 AST 노드
export interface ASTNode {
  type: NodeType;
  line: number;
  raw: string; // 원본 코드
}

// #include 노드
export interface IncludeNode extends ASTNode {
  type: 'include';
  library: string; // e.g., "stdio.h", "stdlib.h"
  isSystem: boolean; // <> vs ""
}

// 타입 정보
export interface TypeInfo {
  baseType: string; // int, char, float, void, struct명 등
  pointerLevel: number; // 0 = 일반, 1 = *, 2 = ** 등
  isArray: boolean;
  arraySize?: number;
  isConst: boolean;
  isUnsigned: boolean;
}

// 전역 변수 노드
export interface GlobalVarNode extends ASTNode {
  type: 'global_var';
  varType: TypeInfo;
  name: string;
  initialValue?: string;
}

// 함수 파라미터
export interface ParamNode {
  name: string;
  varType: TypeInfo;
}

// 함수 정의 노드
export interface FunctionDefNode extends ASTNode {
  type: 'function_def';
  name: string;
  returnType: TypeInfo;
  params: ParamNode[];
  body: StatementNode[];
  startLine: number;
  endLine: number;
}

// 문장 노드 (함수 내부)
export interface StatementNode extends ASTNode {
  type: 'statement' | 'declaration' | 'assignment' | 'function_call' | 'return' | 'if' | 'while' | 'for' | 'block';
}

// 변수 선언
export interface DeclarationNode extends StatementNode {
  type: 'declaration';
  varType: TypeInfo;
  name: string;
  initialValue?: string;
  isPointerAssignment?: boolean;
  pointsTo?: string; // 포인터가 가리키는 변수명
}

// 변수 할당
export interface AssignmentNode extends StatementNode {
  type: 'assignment';
  target: string;
  value: string;
  isDeref?: boolean; // *ptr = value
  isArrayAccess?: boolean;
  arrayIndex?: string;
}

// 함수 호출
export interface FunctionCallNode extends StatementNode {
  type: 'function_call';
  functionName: string;
  args: string[];
  assignTo?: string; // int result = add(1, 2);
}

// return 문
export interface ReturnNode extends StatementNode {
  type: 'return';
  value?: string;
}

// if 문
export interface IfNode extends StatementNode {
  type: 'if';
  condition: string;
  thenBody: StatementNode[];
  elseBody?: StatementNode[];
}

// while 문
export interface WhileNode extends StatementNode {
  type: 'while';
  condition: string;
  body: StatementNode[];
}

// for 문
export interface ForNode extends StatementNode {
  type: 'for';
  init?: string;
  condition?: string;
  update?: string;
  body: StatementNode[];
}

// 블록
export interface BlockNode extends StatementNode {
  type: 'block';
  statements: StatementNode[];
}

// 전체 프로그램 노드
export interface ProgramNode extends ASTNode {
  type: 'program';
  includes: IncludeNode[];
  globals: GlobalVarNode[];
  functions: FunctionDefNode[];
  main?: FunctionDefNode;
}

// Type guards
export function isDeclaration(node: StatementNode): node is DeclarationNode {
  return node.type === 'declaration';
}

export function isAssignment(node: StatementNode): node is AssignmentNode {
  return node.type === 'assignment';
}

export function isFunctionCall(node: StatementNode): node is FunctionCallNode {
  return node.type === 'function_call';
}

export function isReturn(node: StatementNode): node is ReturnNode {
  return node.type === 'return';
}

export function isIf(node: StatementNode): node is IfNode {
  return node.type === 'if';
}

export function isWhile(node: StatementNode): node is WhileNode {
  return node.type === 'while';
}

export function isFor(node: StatementNode): node is ForNode {
  return node.type === 'for';
}
