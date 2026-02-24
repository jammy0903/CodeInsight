/**
 * 자식 프로세스용 안전한 환경변수 생성
 *
 * WHY: 시뮬레이터가 사용자 코드를 실행할 때 process.env를 그대로 전달하면
 *      DATABASE_URL, FIREBASE_PRIVATE_KEY 등 서버 시크릿이 전부 노출됨.
 *      (CVE: /proc/self/environ 읽기, os.environ, System.getenv() 등)
 *
 * FIX: 최소한의 환경변수만 전달 (PATH, HOME, LANG, TMPDIR + 언어별 필수값)
 */

/**
 * 안전한 기본 환경변수 (모든 언어 공통)
 *
 * PATH  — 컴파일러/런타임 바이너리 탐색에 필수
 * HOME  — 일부 런타임이 설정 파일을 찾을 때 필요
 * LANG  — 문자 인코딩 처리
 * TMPDIR — 임시 파일 경로
 */
function baseEnv(): Record<string, string> {
  const env: Record<string, string> = {};

  if (process.env.PATH) env.PATH = process.env.PATH;
  if (process.env.HOME) env.HOME = process.env.HOME;
  if (process.env.LANG) env.LANG = process.env.LANG;
  if (process.env.TMPDIR) env.TMPDIR = process.env.TMPDIR;

  return env;
}

/** Python 자식 프로세스용 환경변수 */
export function pythonSafeEnv(): Record<string, string> {
  return {
    ...baseEnv(),
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8',
  };
}

/** Node.js(JavaScript) 자식 프로세스용 환경변수 */
export function nodeSafeEnv(): Record<string, string> {
  return {
    ...baseEnv(),
    NODE_OPTIONS: '--no-warnings',
  };
}

/** C/C++ 컴파일 및 실행용 환경변수 */
export function cSafeEnv(): Record<string, string> {
  return baseEnv();
}

/** Java 자식 프로세스용 환경변수 */
export function javaSafeEnv(): Record<string, string> {
  const env = baseEnv();
  if (process.env.JAVA_HOME) env.JAVA_HOME = process.env.JAVA_HOME;
  return env;
}

/** GDB(C++) 자식 프로세스용 환경변수 */
export function gdbSafeEnv(): Record<string, string> {
  return baseEnv();
}
