/**
 * C 언어 데이터 타입 정의
 * 모든 C primitive types + 메모리 크기 + 패턴
 */

export interface TypeInfo {
  name: string;
  size: number; // bytes
  category: 'integer' | 'float' | 'char' | 'void' | 'pointer';
  signed: boolean;
  minValue?: number | bigint;
  maxValue?: number | bigint;
  format: 'decimal' | 'hex' | 'char' | 'ieee754' | 'none';
  description: string;
}

/**
 * C 언어 타입 정의 (x86-64 Linux 기준)
 */
export const C_TYPES: Record<string, TypeInfo> = {
  // === 정수 타입 (signed) ===
  char: {
    name: 'char',
    size: 1,
    category: 'char',
    signed: true,
    minValue: -128,
    maxValue: 127,
    format: 'char',
    description: '문자/1바이트 정수',
  },
  short: {
    name: 'short',
    size: 2,
    category: 'integer',
    signed: true,
    minValue: -32768,
    maxValue: 32767,
    format: 'decimal',
    description: '2바이트 정수',
  },
  int: {
    name: 'int',
    size: 4,
    category: 'integer',
    signed: true,
    minValue: -2147483648,
    maxValue: 2147483647,
    format: 'decimal',
    description: '4바이트 정수',
  },
  long: {
    name: 'long',
    size: 8, // x86-64 Linux
    category: 'integer',
    signed: true,
    minValue: BigInt('-9223372036854775808'),
    maxValue: BigInt('9223372036854775807'),
    format: 'decimal',
    description: '8바이트 정수',
  },
  'long long': {
    name: 'long long',
    size: 8,
    category: 'integer',
    signed: true,
    minValue: BigInt('-9223372036854775808'),
    maxValue: BigInt('9223372036854775807'),
    format: 'decimal',
    description: '8바이트 정수',
  },

  // === 정수 타입 (unsigned) ===
  'unsigned char': {
    name: 'unsigned char',
    size: 1,
    category: 'integer',
    signed: false,
    minValue: 0,
    maxValue: 255,
    format: 'decimal',
    description: '1바이트 부호없는 정수',
  },
  'unsigned short': {
    name: 'unsigned short',
    size: 2,
    category: 'integer',
    signed: false,
    minValue: 0,
    maxValue: 65535,
    format: 'decimal',
    description: '2바이트 부호없는 정수',
  },
  'unsigned int': {
    name: 'unsigned int',
    size: 4,
    category: 'integer',
    signed: false,
    minValue: 0,
    maxValue: 4294967295,
    format: 'decimal',
    description: '4바이트 부호없는 정수',
  },
  'unsigned long': {
    name: 'unsigned long',
    size: 8,
    category: 'integer',
    signed: false,
    minValue: 0,
    maxValue: BigInt('18446744073709551615'),
    format: 'decimal',
    description: '8바이트 부호없는 정수',
  },
  'unsigned long long': {
    name: 'unsigned long long',
    size: 8,
    category: 'integer',
    signed: false,
    minValue: 0,
    maxValue: BigInt('18446744073709551615'),
    format: 'decimal',
    description: '8바이트 부호없는 정수',
  },

  // === 부동소수점 타입 ===
  float: {
    name: 'float',
    size: 4,
    category: 'float',
    signed: true,
    format: 'ieee754',
    description: '단정밀도 부동소수점 (32비트)',
  },
  double: {
    name: 'double',
    size: 8,
    category: 'float',
    signed: true,
    format: 'ieee754',
    description: '배정밀도 부동소수점 (64비트)',
  },
  'long double': {
    name: 'long double',
    size: 16, // x86-64
    category: 'float',
    signed: true,
    format: 'ieee754',
    description: '확장정밀도 부동소수점',
  },

  // === 특수 타입 ===
  void: {
    name: 'void',
    size: 0,
    category: 'void',
    signed: false,
    format: 'none',
    description: '반환값 없음',
  },
};

/**
 * 포인터 타입 정보 생성
 */
export function getPointerType(baseType: string): TypeInfo {
  return {
    name: `${baseType}*`,
    size: 8, // x86-64
    category: 'pointer',
    signed: false,
    format: 'hex',
    description: `${baseType}에 대한 포인터`,
  };
}

/**
 * 타입 이름 정규화 (여러 표기법 통일)
 * 예: "unsigned int" = "uint" = "unsigned"
 */
export const TYPE_ALIASES: Record<string, string> = {
  // short 별칭
  'short int': 'short',
  'signed short': 'short',
  'signed short int': 'short',

  // int 별칭
  'signed': 'int',
  'signed int': 'int',

  // long 별칭
  'long int': 'long',
  'signed long': 'long',
  'signed long int': 'long',

  // long long 별칭
  'long long int': 'long long',
  'signed long long': 'long long',
  'signed long long int': 'long long',

  // unsigned 별칭
  'unsigned': 'unsigned int',
  'unsigned short int': 'unsigned short',
  'unsigned long int': 'unsigned long',
  'unsigned long long int': 'unsigned long long',
};

/**
 * 타입 이름 정규화
 */
export function normalizeTypeName(typeName: string): string {
  const trimmed = typeName.trim().replace(/\s+/g, ' ');
  return TYPE_ALIASES[trimmed] || trimmed;
}

/**
 * 타입 정보 조회
 */
export function getTypeInfo(typeName: string): TypeInfo | null {
  const normalized = normalizeTypeName(typeName);

  // 포인터 타입 처리
  if (normalized.endsWith('*')) {
    const baseType = normalized.slice(0, -1).trim();
    return getPointerType(baseType);
  }

  return C_TYPES[normalized] || null;
}

/**
 * 값을 바이트 배열로 변환
 */
export function valueToBytes(value: number, typeInfo: TypeInfo): number[] {
  const bytes: number[] = [];

  if (typeInfo.category === 'float') {
    if (typeInfo.size === 4) {
      // float (32-bit IEEE 754)
      const buffer = new ArrayBuffer(4);
      new DataView(buffer).setFloat32(0, value, true); // little-endian
      const arr = new Uint8Array(buffer);
      for (let i = 0; i < 4; i++) bytes.push(arr[i]);
    } else if (typeInfo.size === 8) {
      // double (64-bit IEEE 754)
      const buffer = new ArrayBuffer(8);
      new DataView(buffer).setFloat64(0, value, true);
      const arr = new Uint8Array(buffer);
      for (let i = 0; i < 8; i++) bytes.push(arr[i]);
    }
  } else {
    // 정수 타입 (리틀 엔디안)
    let v = value;
    if (v < 0 && typeInfo.signed) {
      // 2의 보수 처리
      v = v >>> 0;
      if (typeInfo.size === 8) {
        // BigInt 필요
        const bigV = BigInt(value) & BigInt('0xFFFFFFFFFFFFFFFF');
        for (let i = 0; i < 8; i++) {
          bytes.push(Number((bigV >> BigInt(i * 8)) & BigInt(0xff)));
        }
        return bytes;
      }
    }
    for (let i = 0; i < typeInfo.size; i++) {
      bytes.push((v >> (i * 8)) & 0xff);
    }
  }

  return bytes;
}
