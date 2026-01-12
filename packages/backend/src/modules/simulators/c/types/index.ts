/**
 * Types Module - 타입 시스템 공개 API
 */

// C 언어 타입 정의
export {
  C_TYPES,
  getTypeInfo,
  normalizeTypeName,
  valueToBytes,
  getPointerType,
  TYPE_ALIASES,
  type TypeInfo,
} from './c-types';

// 타입 레지스트리
export {
  TypeRegistry,
  cTypeRegistry,
  type SupportedLanguage,
  type DeclPattern,
} from './type-registry';
