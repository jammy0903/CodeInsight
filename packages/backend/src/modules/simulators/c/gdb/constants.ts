/**
 * GDB 기반 C 시뮬레이터 상수 정의
 */

// ============================================
// C 타입 크기 매핑 (x86-64 LP64)
// ============================================

export const TYPE_SIZE_MAP: Record<string, number> = {
  // 정수형
  'char': 1,
  'signed char': 1,
  'unsigned char': 1,
  'short': 2,
  'short int': 2,
  'unsigned short': 2,
  'unsigned short int': 2,
  'int': 4,
  'unsigned int': 4,
  'unsigned': 4,
  'long': 8,
  'long int': 8,
  'unsigned long': 8,
  'unsigned long int': 8,
  'long long': 8,
  'long long int': 8,
  'unsigned long long': 8,
  'unsigned long long int': 8,

  // 부동소수점
  'float': 4,
  'double': 8,
  'long double': 16,

  // 불리언
  '_Bool': 1,

  // 포인터 (x86-64)
  'pointer': 8,
};

/**
 * GDB 타입 문자열에서 크기 추출
 * 포인터는 항상 8바이트 (x86-64)
 */
export function getTypeSize(gdbType: string): number {
  // 포인터 타입 (*, [] 포함)
  if (gdbType.includes('*') || gdbType.endsWith(']')) {
    return 8;
  }

  // 정규화: const/volatile/restrict 제거
  const normalized = gdbType
    .replace(/\b(const|volatile|restrict|static|register)\b/g, '')
    .trim();

  return TYPE_SIZE_MAP[normalized] ?? 4; // 기본 4바이트 (int)
}

// ============================================
// GDB 세션 기본값
// ============================================

/** 최대 스텝 수 (무한루프 방지) */
export const DEFAULT_MAX_STEPS = 1000;

/** GDB 세션 타임아웃 (ms) */
export const DEFAULT_TIMEOUT = 30_000;

/** 단일 MI 명령 타임아웃 (ms) */
export const MI_COMMAND_TIMEOUT = 5_000;

/** 배열 출력 최대 요소 수 */
export const MAX_ARRAY_ELEMENTS = 100;

/** 문자열 출력 최대 길이 */
export const MAX_STRING_LENGTH = 200;

// ============================================
// GDB 초기화 명령어
// ============================================

/** GDB 세션 시작 시 실행할 설정 명령어들 */
export const GDB_INIT_COMMANDS = [
  'set confirm off',                            // 확인 프롬프트 끄기
  'set pagination off',                         // 페이지네이션 끄기
  `set print elements ${MAX_ARRAY_ELEMENTS}`,   // 배열 출력 제한
  'set print repeats 10',                       // 반복 출력 제한
  'set print null-stop on',                     // null 문자에서 문자열 중단
  'set print pretty off',                       // 컴팩트 출력
  'set print address on',                       // 주소 표시
  'set print array off',                        // 배열 한 줄 출력
  `set print characters ${MAX_STRING_LENGTH}`,  // 문자열 길이 제한
];

// ============================================
// 스킵할 함수/파일 목록
// ============================================

/** GDB step-into 시 진입하지 않을 라이브러리 함수 */
export const SKIP_FUNCTIONS = new Set([
  'printf', 'fprintf', 'sprintf', 'snprintf',
  'scanf', 'fscanf', 'sscanf',
  'puts', 'fputs', 'putchar', 'fputc',
  'gets', 'fgets', 'getchar', 'fgetc',
  'strlen', 'strcpy', 'strncpy', 'strcat', 'strcmp', 'strncmp',
  'memcpy', 'memmove', 'memset', 'memcmp',
  'atoi', 'atof', 'atol', 'strtol', 'strtod',
  'abs', 'fabs', 'sqrt', 'pow',
  'fopen', 'fclose', 'fread', 'fwrite', 'fseek', 'ftell', 'rewind',
  'exit', 'abort', 'atexit',
  'qsort', 'bsearch',
  // 내부 함수
  '_start', '__libc_start_main', '__libc_csu_init', '__libc_csu_fini',
  '_init', '_fini', '__do_global_dtors_aux', 'frame_dummy',
  'register_tm_clones', 'deregister_tm_clones',
]);

/** 사용자 소스 파일인지 판별 — 이 파일명이 포함되면 사용자 코드 */
export const USER_SOURCE_FILE = 'main.c';
