/**
 * C 코드 보안 검사
 *
 * 금지된 패턴:
 * - 시스템 호출 (system, exec, fork 등)
 * - 권한 상승 (setuid, setgid 등)
 * - 동적 로딩 (dlopen, dlsym)
 * - 위험한 헤더 (unistd.h, sys/* 등)
 */

export const FORBIDDEN_PATTERNS = [
  // === 프로세스/시스템 호출 ===
  /system\s*\(/,
  /exec[lvpe]*\s*\(/,
  /fork\s*\(/,
  /popen\s*\(/,
  /clone\s*\(/,           // 프로세스 복제
  /vfork\s*\(/,           // fork 변형

  // === 권한 상승 ===
  /setuid\s*\(/,
  /setgid\s*\(/,
  /seteuid\s*\(/,
  /setegid\s*\(/,
  /setreuid\s*\(/,
  /setregid\s*\(/,

  // === 디버깅/추적 ===
  /ptrace\s*\(/,          // 프로세스 추적

  // === 어셈블리 ===
  /__asm__/,
  /__asm\s+volatile/,
  /\basm\s*\(/,           // asm("...")

  // === 동적 로딩 ===
  /dlopen\s*\(/,
  /dlsym\s*\(/,

  // === 메모리 실행 ===
  /mprotect\s*\(/,        // 메모리 보호 변경
  /mmap\s*\([^)]*PROT_EXEC/,  // 실행 가능 메모리

  // === 환경변수/시크릿 접근 ===
  /getenv\s*\(/,                // getenv("DATABASE_URL") 등
  /\bextern\s+char\s*\*\*\s*environ\b/,  // extern char **environ
  /\/proc\/self\/environ/,      // /proc/self/environ 파일 읽기
  /\/proc\/\d+\/environ/,       // /proc/<pid>/environ

  // === 위험한 헤더 ===
  /#\s*include\s*<\s*unistd\.h/,
  /#\s*include\s*<\s*sys\//,
  /#\s*include\s*<\s*pthread\.h/,
  /#\s*include\s*<\s*signal\.h/,
  /#\s*include\s*<\s*socket\.h/,
  /#\s*include\s*<\s*netinet\//,
  /#\s*include\s*<\s*arpa\//,
  /#\s*include\s*<\s*dlfcn\.h/,  // dlopen/dlsym
];

/**
 * C 코드 보안 검사
 *
 * @param code C 소스 코드
 * @returns { safe, reason? }
 */
export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `금지된 패턴 감지: ${pattern.source}` };
    }
  }
  return { safe: true };
}
