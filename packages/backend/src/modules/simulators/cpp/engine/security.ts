/**
 * C++ 코드 보안 검사
 *
 * C security.ts 기반 + C++ 전용 차단 패턴 추가
 *
 * 차단 대상:
 * - 시스템 호출, 권한 상승, 어셈블리, 동적 로딩 (C 공통)
 * - 멀티스레딩 (std::thread, std::async)
 * - 파일시스템 (<filesystem>)
 * - 네트워크 소켓
 */

const FORBIDDEN_PATTERNS: RegExp[] = [
  // === 프로세스/시스템 호출 (C 공통) ===
  /system\s*\(/,
  /exec[lvpe]*\s*\(/,
  /fork\s*\(/,
  /popen\s*\(/,
  /clone\s*\(/,
  /vfork\s*\(/,

  // === 권한 상승 ===
  /setuid\s*\(/,
  /setgid\s*\(/,
  /seteuid\s*\(/,
  /setegid\s*\(/,
  /setreuid\s*\(/,
  /setregid\s*\(/,

  // === 디버깅/추적 ===
  /ptrace\s*\(/,

  // === 어셈블리 ===
  /__asm__/,
  /__asm\s+volatile/,
  /\basm\s*\(/,

  // === 동적 로딩 ===
  /dlopen\s*\(/,
  /dlsym\s*\(/,

  // === 메모리 실행 ===
  /mprotect\s*\(/,
  /mmap\s*\([^)]*PROT_EXEC/,

  // === 환경변수/시크릿 접근 ===
  /getenv\s*\(/,                // getenv("DATABASE_URL") 등
  /\bextern\s+char\s*\*\*\s*environ\b/,  // extern char **environ
  /\/proc\/self\/environ/,      // /proc/self/environ 파일 읽기
  /\/proc\/\d+\/environ/,       // /proc/<pid>/environ

  // === 위험한 C 헤더 ===
  /#\s*include\s*<\s*unistd\.h/,
  /#\s*include\s*<\s*sys\//,
  /#\s*include\s*<\s*pthread\.h/,
  /#\s*include\s*<\s*signal\.h/,
  /#\s*include\s*<\s*socket\.h/,
  /#\s*include\s*<\s*netinet\//,
  /#\s*include\s*<\s*arpa\//,
  /#\s*include\s*<\s*dlfcn\.h/,

  // === C++ 추가 차단: 멀티스레딩 ===
  /#\s*include\s*<\s*thread\s*>/,
  /#\s*include\s*<\s*mutex\s*>/,
  /#\s*include\s*<\s*future\s*>/,
  /#\s*include\s*<\s*condition_variable\s*>/,
  /#\s*include\s*<\s*atomic\s*>/,
  /std::thread\b/,
  /std::async\b/,
  /std::mutex\b/,

  // === C++ 추가 차단: 파일시스템 ===
  /#\s*include\s*<\s*filesystem\s*>/,
  /std::filesystem\b/,

  // === C++ 추가 차단: 네트워크 ===
  /#\s*include\s*<\s*netdb\.h/,
];

export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Forbidden pattern detected: ${pattern.source}` };
    }
  }
  return { safe: true };
}
