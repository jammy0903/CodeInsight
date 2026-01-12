/**
 * Struct Handler
 * 구조체 정의, 선언, 멤버 접근 처리
 *
 * 지원 패턴:
 * - struct Point { int x; int y; };       (정의)
 * - struct Point p;                        (선언)
 * - struct Point p = {10, 20};            (선언 + 초기화)
 * - p.x = 5;                              (멤버 대입)
 */

import type { CodeHandler, SimContext, Step } from './types';
import { cTypeRegistry } from '../types';

// 구조체 정의 저장소
interface StructMember {
  name: string;
  type: string;
  size: number;
  offset: number; // 구조체 시작부터의 오프셋
}

interface StructDef {
  name: string;
  members: StructMember[];
  totalSize: number;
}

// 전역 구조체 정의 저장소
const structDefs = new Map<string, StructDef>();

// 패턴 정의
const PATTERNS = {
  // struct Point { int x; int y; };
  STRUCT_DEF: /^struct\s+(\w+)\s*\{([^}]+)\}\s*;?\s*$/,
  // struct Point p;
  STRUCT_DECL: /^struct\s+(\w+)\s+(\w+)\s*;?\s*$/,
  // struct Point p = {10, 20};
  STRUCT_INIT: /^struct\s+(\w+)\s+(\w+)\s*=\s*\{([^}]+)\}\s*;?\s*$/,
  // p.x = value;
  MEMBER_ASSIGN: /^(\w+)\.(\w+)\s*=\s*(.+?)\s*;?\s*$/,
};

export const StructHandler: CodeHandler = {
  name: 'struct',
  priority: 22, // ArrayHandler보다 높음

  canHandle(code: string): boolean {
    return (
      PATTERNS.STRUCT_DEF.test(code) ||
      PATTERNS.STRUCT_DECL.test(code) ||
      PATTERNS.STRUCT_INIT.test(code) ||
      PATTERNS.MEMBER_ASSIGN.test(code)
    );
  },

  handle(ctx: SimContext, lineNum: number, code: string): Step | null {
    // struct Point { int x; int y; };
    const defMatch = code.match(PATTERNS.STRUCT_DEF);
    if (defMatch) {
      return handleStructDef(ctx, lineNum, code, defMatch[1], defMatch[2]);
    }

    // struct Point p = {10, 20};
    const initMatch = code.match(PATTERNS.STRUCT_INIT);
    if (initMatch) {
      return handleStructDecl(ctx, lineNum, code, initMatch[1], initMatch[2], initMatch[3]);
    }

    // struct Point p;
    const declMatch = code.match(PATTERNS.STRUCT_DECL);
    if (declMatch) {
      return handleStructDecl(ctx, lineNum, code, declMatch[1], declMatch[2], null);
    }

    // p.x = value;
    const memberMatch = code.match(PATTERNS.MEMBER_ASSIGN);
    if (memberMatch) {
      return handleMemberAssign(ctx, lineNum, code, memberMatch[1], memberMatch[2], memberMatch[3]);
    }

    return null;
  },
};

/**
 * 구조체 멤버 파싱
 */
function parseMembers(membersStr: string): StructMember[] {
  const members: StructMember[] = [];
  let offset = 0;

  // "int x; int y;" → ["int x", "int y"]
  const lines = membersStr.split(';').filter((s) => s.trim());

  for (const line of lines) {
    const trimmed = line.trim();
    // "int x" → type="int", name="x"
    const match = trimmed.match(/^(\w+(?:\s+\w+)?)\s+(\w+)$/);
    if (match) {
      const typeName = match[1];
      const memberName = match[2];
      const typeInfo = cTypeRegistry.getType(typeName);

      if (typeInfo) {
        members.push({
          name: memberName,
          type: typeName,
          size: typeInfo.size,
          offset,
        });
        offset += typeInfo.size;
      }
    }
  }

  return members;
}

/**
 * 구조체 정의
 */
function handleStructDef(
  ctx: SimContext,
  lineNum: number,
  code: string,
  structName: string,
  membersStr: string
): Step {
  const members = parseMembers(membersStr);
  const totalSize = members.reduce((sum, m) => sum + m.size, 0);

  // 구조체 정의 저장
  structDefs.set(structName, {
    name: structName,
    members,
    totalSize,
  });

  const memberList = members.map((m) => `  ${m.type} ${m.name}; // offset: ${m.offset}, ${m.size}바이트`).join('\n');

  const explanation = `📦 구조체 '${structName}' 정의

• 총 크기: ${totalSize}바이트
• 멤버:
${memberList}

💡 구조체는 여러 변수를 하나로 묶은 사용자 정의 타입
   메모리에 멤버들이 순서대로 배치됨`;

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 구조체 변수 선언
 */
function handleStructDecl(
  ctx: SimContext,
  lineNum: number,
  code: string,
  structName: string,
  varName: string,
  valuesStr: string | null
): Step {
  const def = structDefs.get(structName);

  if (!def) {
    return ctx.createStep(lineNum, code, `❌ 정의되지 않은 구조체: ${structName}`);
  }

  const addr = ctx.allocateStack(def.totalSize);
  let bytesList: number[] = [];
  let explanation: string;

  if (valuesStr) {
    // 초기화 값 파싱
    const values = valuesStr.split(',').map((s) => s.trim());

    for (let i = 0; i < def.members.length; i++) {
      const member = def.members[i];
      const valueStr = values[i] || '0';
      const typeInfo = cTypeRegistry.getType(member.type);

      if (typeInfo) {
        let value: number;
        if (typeInfo.category === 'char') {
          const charMatch = valueStr.match(/^'(.)'$/);
          value = charMatch ? charMatch[1].charCodeAt(0) : parseInt(valueStr);
        } else if (typeInfo.category === 'float') {
          value = parseFloat(valueStr.replace(/f$/i, ''));
        } else {
          value = parseInt(valueStr);
        }
        bytesList.push(...cTypeRegistry.toBytes(member.type, value));
      }
    }

    // 부족한 바이트는 0으로 채움
    while (bytesList.length < def.totalSize) {
      bytesList.push(0);
    }

    const initValues = values.slice(0, def.members.length).join(', ');
    explanation = `📦 구조체 변수 '${varName}' 선언 및 초기화

• 타입: struct ${structName} (${def.totalSize}바이트)
• 스택 주소: ${ctx.toHex(addr)}
• 초기값: {${initValues}}

💡 멤버별 위치:
${def.members.map((m) => `   ${varName}.${m.name} → ${ctx.toHex(addr - m.offset)}`).join('\n')}`;
  } else {
    // 초기화 없음
    bytesList = new Array(def.totalSize).fill(0);

    explanation = `📦 구조체 변수 '${varName}' 선언 (초기화 안됨)

• 타입: struct ${structName} (${def.totalSize}바이트)
• 스택 주소: ${ctx.toHex(addr)}
• ⚠️ 초기화 안됨 → 쓰레기값 포함!

💡 멤버별 위치:
${def.members.map((m) => `   ${varName}.${m.name} → ${ctx.toHex(addr - m.offset)}`).join('\n')}`;
  }

  ctx.variables.set(varName, {
    address: ctx.toHex(addr),
    type: `struct ${structName}`,
    size: def.totalSize,
    bytes: bytesList,
    value: `{${def.members.map((m) => m.name).join(', ')}}`,
    is_struct: true,
    struct_name: structName,
  });

  return ctx.createStep(lineNum, code, explanation);
}

/**
 * 구조체 멤버 대입
 */
function handleMemberAssign(
  ctx: SimContext,
  lineNum: number,
  code: string,
  varName: string,
  memberName: string,
  valueStr: string
): Step {
  const variable = ctx.variables.get(varName);

  if (!variable?.is_struct) {
    return ctx.createStep(lineNum, code, `❌ '${varName}'은 구조체가 아님`);
  }

  const structName = variable.struct_name;
  const def = structDefs.get(structName || '');

  if (!def) {
    return ctx.createStep(lineNum, code, `❌ 구조체 정의를 찾을 수 없음: ${structName}`);
  }

  const member = def.members.find((m) => m.name === memberName);

  if (!member) {
    return ctx.createStep(lineNum, code, `❌ 멤버를 찾을 수 없음: ${structName}.${memberName}`);
  }

  const typeInfo = cTypeRegistry.getType(member.type);
  if (!typeInfo) {
    return ctx.createStep(lineNum, code, `❌ 지원하지 않는 타입: ${member.type}`);
  }

  // 값 파싱
  let value: number;
  if (typeInfo.category === 'char') {
    const charMatch = valueStr.trim().match(/^'(.)'$/);
    value = charMatch ? charMatch[1].charCodeAt(0) : parseInt(valueStr);
  } else if (typeInfo.category === 'float') {
    value = parseFloat(valueStr.replace(/f$/i, ''));
  } else {
    value = parseInt(valueStr);
  }

  // 바이트 업데이트
  const newBytes = cTypeRegistry.toBytes(member.type, value);
  variable.bytes.splice(member.offset, member.size, ...newBytes);

  const baseAddr = parseInt(variable.address, 16);
  const memberAddr = baseAddr - member.offset;

  // 표시용 값
  let displayValue: string;
  if (typeInfo.category === 'char') {
    displayValue = `'${String.fromCharCode(value)}' (ASCII: ${value})`;
  } else if (typeInfo.category === 'float') {
    displayValue = value.toFixed(6);
  } else {
    displayValue = String(value);
  }

  const explanation = `✏️ 구조체 멤버 '${varName}.${memberName}' 값 변경

• ${varName}.${memberName} = ${displayValue}
• 멤버 타입: ${member.type} (${member.size}바이트)
• 멤버 주소: ${ctx.toHex(memberAddr)}
• 오프셋: ${member.offset}바이트

💡 멤버 주소 계산:
   주소 = 구조체주소 - 오프셋
   ${ctx.toHex(memberAddr)} = ${variable.address} - ${member.offset}`;

  return ctx.createStep(lineNum, code, explanation);
}

// 구조체 정의 조회 (외부에서 사용)
export function getStructDef(name: string): StructDef | undefined {
  return structDefs.get(name);
}

// 구조체 정의 초기화 (테스트용)
export function clearStructDefs(): void {
  structDefs.clear();
}

export default StructHandler;
