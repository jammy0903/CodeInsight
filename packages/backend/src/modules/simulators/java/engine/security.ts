/**
 * Java 코드 보안 검사
 *
 * 차단 대상:
 * - 프로세스 실행 (Runtime.exec, ProcessBuilder)
 * - 환경변수 접근 (System.getenv)
 * - 파일 시스템 조작 (File.delete, Files.write 등)
 * - 네트워크 접근 (Socket, URL, HttpClient)
 * - 리플렉션 (Class.forName, Method.invoke)
 * - JNI/네이티브 코드 (System.loadLibrary)
 * - 보안 매니저 조작 (System.setSecurityManager)
 */

const FORBIDDEN_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // === 프로세스/시스템 호출 ===
  { pattern: /Runtime\s*\.\s*getRuntime\s*\(\s*\)\s*\.\s*exec/, reason: 'Runtime.exec() - 외부 프로세스 실행' },
  { pattern: /new\s+ProcessBuilder/, reason: 'ProcessBuilder - 외부 프로세스 실행' },

  // === 환경변수/시크릿 접근 ===
  { pattern: /System\s*\.\s*getenv/, reason: 'System.getenv() - 환경변수 접근' },
  { pattern: /System\s*\.\s*getProperty/, reason: 'System.getProperty() - 시스템 속성 접근' },
  { pattern: /\/proc\/self\/environ/, reason: '/proc/self/environ - 환경변수 파일 접근' },

  // === 파일 시스템 조작 ===
  { pattern: /new\s+File\s*\(/, reason: 'File - 파일 시스템 접근' },
  { pattern: /Files\s*\./, reason: 'Files - 파일 시스템 접근' },
  { pattern: /FileWriter/, reason: 'FileWriter - 파일 쓰기' },
  { pattern: /FileOutputStream/, reason: 'FileOutputStream - 파일 쓰기' },
  { pattern: /FileInputStream/, reason: 'FileInputStream - 파일 읽기' },
  { pattern: /BufferedWriter/, reason: 'BufferedWriter - 파일 쓰기' },
  { pattern: /RandomAccessFile/, reason: 'RandomAccessFile - 파일 접근' },
  { pattern: /FileReader/, reason: 'FileReader - 파일 읽기' },

  // === 네트워크 접근 ===
  { pattern: /new\s+Socket\s*\(/, reason: 'Socket - 네트워크 접근' },
  { pattern: /new\s+ServerSocket/, reason: 'ServerSocket - 네트워크 서버' },
  { pattern: /new\s+URL\s*\(/, reason: 'URL - 네트워크 접근' },
  { pattern: /HttpClient/, reason: 'HttpClient - HTTP 통신' },
  { pattern: /HttpURLConnection/, reason: 'HttpURLConnection - HTTP 통신' },
  { pattern: /import\s+java\.net\./, reason: 'java.net - 네트워크 패키지' },

  // === 리플렉션 ===
  { pattern: /Class\s*\.\s*forName/, reason: 'Class.forName() - 리플렉션' },
  { pattern: /\.getDeclaredMethod/, reason: 'getDeclaredMethod() - 리플렉션' },
  { pattern: /\.getDeclaredField/, reason: 'getDeclaredField() - 리플렉션' },
  { pattern: /Method\s*\.\s*invoke/, reason: 'Method.invoke() - 리플렉션 호출' },

  // === JNI/네이티브 코드 ===
  { pattern: /System\s*\.\s*loadLibrary/, reason: 'System.loadLibrary() - 네이티브 코드 로딩' },
  { pattern: /System\s*\.\s*load\s*\(/, reason: 'System.load() - 네이티브 코드 로딩' },
  { pattern: /\bnative\s+\w/, reason: 'native 메소드 선언' },

  // === 보안 매니저/스레드 ===
  { pattern: /System\s*\.\s*setSecurityManager/, reason: 'SecurityManager 변경' },
  { pattern: /System\s*\.\s*exit/, reason: 'System.exit() - 프로세스 종료' },
  { pattern: /Thread\s*\.\s*sleep\s*\(\s*\d{5,}/, reason: 'Thread.sleep() - 장시간 대기 (DoS)' },

  // === 위험한 import ===
  { pattern: /import\s+java\.lang\.reflect\./, reason: 'java.lang.reflect - 리플렉션 패키지' },
  { pattern: /import\s+javax\.script\./, reason: 'javax.script - 스크립트 엔진' },
  { pattern: /import\s+java\.security\./, reason: 'java.security - 보안 패키지 조작' },
];

export function checkCodeSecurity(code: string): { safe: boolean; reason?: string } {
  for (const { pattern, reason } of FORBIDDEN_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `금지된 패턴 감지: ${reason}` };
    }
  }
  return { safe: true };
}
