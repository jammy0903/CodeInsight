/**
 * TypeRegistry - 다중 언어 타입 시스템
 *
 * 언어별 타입 정보와 패턴을 관리하는 중앙 레지스트리
 * 현재 C 언어 지원, 추후 Java/Python/Go/JS 확장 가능
 */

import { C_TYPES, getTypeInfo, normalizeTypeName, valueToBytes, type TypeInfo } from './c-types';

export type SupportedLanguage = 'c' | 'java' | 'python' | 'javascript' | 'go';

/**
 * 변수 선언 패턴 정의
 */
export interface DeclPattern {
  // 정규식 패턴
  regex: RegExp;
  // 캡처 그룹 설명
  groups: {
    type?: number; // 타입 캡처 그룹 인덱스
    name?: number; // 변수명 캡처 그룹 인덱스
    value?: number; // 초기값 캡처 그룹 인덱스
    size?: number; // 배열 크기 캡처 그룹 인덱스
  };
  // 설명
  description: string;
}

/**
 * C 언어 변수 선언 패턴
 */
const C_PATTERNS: Record<string, DeclPattern> = {
  // === 기본 타입 선언 + 초기화 ===
  // int x = 10;
  INT_DECL_INIT: {
    regex: /^(int|short|long|long long)\s+(\w+)\s*=\s*(-?\d+)$/,
    groups: { type: 1, name: 2, value: 3 },
    description: '정수 선언 및 초기화',
  },
  // int x;
  INT_DECL_ONLY: {
    regex: /^(int|short|long|long long)\s+(\w+)\s*$/,
    groups: { type: 1, name: 2 },
    description: '정수 선언만',
  },

  // === unsigned 타입 ===
  // unsigned int x = 10;
  UNSIGNED_DECL_INIT: {
    regex: /^(unsigned\s+(?:char|short|int|long|long long))\s+(\w+)\s*=\s*(\d+)$/,
    groups: { type: 1, name: 2, value: 3 },
    description: 'unsigned 선언 및 초기화',
  },
  // unsigned int x;
  UNSIGNED_DECL_ONLY: {
    regex: /^(unsigned\s+(?:char|short|int|long|long long))\s+(\w+)\s*$/,
    groups: { type: 1, name: 2 },
    description: 'unsigned 선언만',
  },

  // === 부동소수점 ===
  // float x = 3.14; or double x = 0.5;
  FLOAT_DECL_INIT: {
    regex: /^(float|double|long double)\s+(\w+)\s*=\s*(-?[\d.]+(?:e[+-]?\d+)?f?)$/i,
    groups: { type: 1, name: 2, value: 3 },
    description: '부동소수점 선언 및 초기화',
  },
  // float x;
  FLOAT_DECL_ONLY: {
    regex: /^(float|double|long double)\s+(\w+)\s*$/,
    groups: { type: 1, name: 2 },
    description: '부동소수점 선언만',
  },

  // === char ===
  // char c = 'A';
  CHAR_DECL_INIT: {
    regex: /^char\s+(\w+)\s*=\s*'(.)'$/,
    groups: { name: 1, value: 2 },
    description: 'char 선언 및 초기화',
  },
  // char c;
  CHAR_DECL_ONLY: {
    regex: /^char\s+(\w+)\s*$/,
    groups: { name: 1 },
    description: 'char 선언만',
  },

  // === 배열 ===
  // int arr[5];
  ARRAY_DECL_ONLY: {
    regex: /^(\w+)\s+(\w+)\[(\d+)\]\s*$/,
    groups: { type: 1, name: 2, size: 3 },
    description: '배열 선언',
  },
  // int arr[5] = {1,2,3};
  ARRAY_DECL_INIT: {
    regex: /^(\w+)\s+(\w+)\[(\d+)\]\s*=\s*\{([^}]*)\}$/,
    groups: { type: 1, name: 2, size: 3, value: 4 },
    description: '배열 선언 및 초기화',
  },
  // arr[0] = 10;
  ARRAY_ASSIGN: {
    regex: /^(\w+)\[(\d+)\]\s*=\s*(.+)$/,
    groups: { name: 1, size: 2, value: 3 },
    description: '배열 요소 대입',
  },

  // === 포인터 ===
  // int *p;
  PTR_DECL_ONLY: {
    regex: /^(\w+)\s*\*\s*(\w+)\s*$/,
    groups: { type: 1, name: 2 },
    description: '포인터 선언',
  },
  // int *p = &x;
  PTR_DECL_ADDR: {
    regex: /^(\w+)\s*\*\s*(\w+)\s*=\s*&(\w+)$/,
    groups: { type: 1, name: 2, value: 3 },
    description: '포인터 선언 및 주소 할당',
  },
  // *p = 20;
  PTR_DEREF_ASSIGN: {
    regex: /^\*(\w+)\s*=\s*(.+)$/,
    groups: { name: 1, value: 2 },
    description: '포인터 역참조 대입',
  },
};

/**
 * TypeRegistry 클래스
 */
export class TypeRegistry {
  private language: SupportedLanguage;

  constructor(language: SupportedLanguage = 'c') {
    this.language = language;
  }

  /**
   * 타입 정보 조회
   */
  getType(typeName: string): TypeInfo | null {
    if (this.language === 'c') {
      return getTypeInfo(typeName);
    }
    // TODO: 다른 언어 지원 추가
    return null;
  }

  /**
   * 타입 이름 정규화
   */
  normalizeType(typeName: string): string {
    if (this.language === 'c') {
      return normalizeTypeName(typeName);
    }
    return typeName;
  }

  /**
   * 모든 타입 목록
   */
  getAllTypes(): TypeInfo[] {
    if (this.language === 'c') {
      return Object.values(C_TYPES);
    }
    return [];
  }

  /**
   * 카테고리별 타입 조회
   */
  getTypesByCategory(category: TypeInfo['category']): TypeInfo[] {
    return this.getAllTypes().filter((t) => t.category === category);
  }

  /**
   * 값을 바이트 배열로 변환
   */
  toBytes(typeName: string, value: number): number[] {
    const typeInfo = this.getType(typeName);
    if (!typeInfo) return [];
    return valueToBytes(value, typeInfo);
  }

  /**
   * 선언 패턴 매칭
   */
  matchDeclaration(code: string): {
    pattern: string;
    match: RegExpMatchArray;
    type?: string;
    name?: string;
    value?: string;
    size?: number;
  } | null {
    if (this.language !== 'c') return null;

    for (const [patternName, patternDef] of Object.entries(C_PATTERNS)) {
      const match = code.match(patternDef.regex);
      if (match) {
        const result: {
          pattern: string;
          match: RegExpMatchArray;
          type?: string;
          name?: string;
          value?: string;
          size?: number;
        } = {
          pattern: patternName,
          match,
        };

        if (patternDef.groups.type !== undefined) {
          result.type = match[patternDef.groups.type];
        }
        if (patternDef.groups.name !== undefined) {
          result.name = match[patternDef.groups.name];
        }
        if (patternDef.groups.value !== undefined) {
          result.value = match[patternDef.groups.value];
        }
        if (patternDef.groups.size !== undefined) {
          result.size = parseInt(match[patternDef.groups.size], 10);
        }

        // char 타입 특별 처리
        if (patternName.startsWith('CHAR_')) {
          result.type = 'char';
        }

        return result;
      }
    }

    return null;
  }

  /**
   * 패턴 조회
   */
  getPattern(patternName: string): DeclPattern | null {
    if (this.language === 'c') {
      return C_PATTERNS[patternName] || null;
    }
    return null;
  }

  /**
   * 모든 패턴 목록
   */
  getAllPatterns(): Record<string, DeclPattern> {
    if (this.language === 'c') {
      return C_PATTERNS;
    }
    return {};
  }
}

// 싱글톤 인스턴스 (C 언어 기본)
export const cTypeRegistry = new TypeRegistry('c');

// Re-export
export { type TypeInfo } from './c-types';
