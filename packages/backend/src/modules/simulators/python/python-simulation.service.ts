/**
 * 📚 교육용 Python 메모리 시뮬레이터 v2
 *
 * 🏗️ 아키텍처 (sys.settrace 기반):
 *   - PythonFileManager: 임시 프로젝트 생성/삭제 (main.py)
 *   - PythonDebuggerClient: sys.settrace()로 라인별 트레이싱
 *   - 인터프리터 직접 실행 (컴파일 단계 없음)
 *
 * 🔄 4단계 파이프라인:
 *   1️⃣ Validate → 위험 코드 검증 (subprocess, eval, file write 차단)
 *   2️⃣ Setup    → 임시 디렉토리에 main.py + tracer.py 생성
 *   3️⃣ Trace    → python3 main.py 실행 + sys.settrace()로 스냅샷 수집
 *   4️⃣ Cleanup  → 임시 파일/디렉토리 삭제
 *
 * ⚡ 에러 처리 원칙:
 *   - 재시도 없이 즉시 에러 반환 (빠른 실패)
 *   - 프론트엔드가 Toast 알림으로 사용자 피드백 담당
 *   - 실행 타임아웃: 30초 (무한 루프 방지)
 *
 * 🛡️ 보안 정책:
 *   - subprocess, os.system, eval, exec 차단
 *   - 파일 쓰기 모드('w', 'a') open() 차단
 *   - import 화이트리스트 (표준 라이브러리만 허용)
 *
 * 📦 의존성:
 *   - Python 3.8+
 *   - agent/tracer.py (sys.settrace 구현체)
 */

import { PythonFileManager } from './engine/file-manager';
import { PythonDebuggerClient, PythonSnapshot } from './engine/debugger-client';

/**
 * Python 시뮬레이션 결과 타입
 */
export interface PythonSimulationResult {
  success: boolean;
  steps?: PythonSnapshot[];
  error?: string;
}

/**
 * Python 시뮬레이션 서비스 메인 클래스
 *
 * 🎯 역할:
 *   - 사용자 코드 보안 검증 (위험 패턴 차단)
 *   - sys.settrace() 기반 라인별 트레이싱
 *   - 스냅샷 후처리 (유효성 검증)
 *
 * 💡 설계 의도:
 *   - Java와 달리 컴파일 단계 없음 (인터프리터 언어)
 *   - 각 요청마다 새 인스턴스 생성 (stateless)
 *   - 멀티 유저 동시 시뮬레이션 안전
 */
export class PythonSimulationService {
  // 📁 파일 시스템 관리 (임시 프로젝트 생성/삭제)
  private fileManager: PythonFileManager;

  // 🐛 디버거 클라이언트 (sys.settrace 통신)
  private debuggerClient: PythonDebuggerClient;

  /**
   * 생성자 - 의존성 초기화
   *
   * 💡 각 시뮬레이션 요청마다 새 인스턴스 생성됨
   */
  constructor() {
    this.fileManager = new PythonFileManager();
    this.debuggerClient = new PythonDebuggerClient();
  }

  /**
   * 🚀 Python 코드 시뮬레이션 실행 (메인 엔트리포인트)
   *
   * 📝 동작 흐름:
   *   1. 코드 보안 검증 (validateCode)
   *   2. 임시 프로젝트 디렉토리 생성 (/tmp/python-sim-XXXXXX)
   *   3. main.py + tracer.py 파일 생성
   *   4. python3 main.py 실행 + sys.settrace()로 스냅샷 수집
   *   5. 스냅샷 후처리 (유효 라인 검증, 코드 추가)
   *   6. 임시 파일 정리
   *
   * ⚠️ 주의사항:
   *   - subprocess, eval, exec 등 위험 코드 차단
   *   - 파일 쓰기 금지 (보안상 이유)
   *   - 라인 번호는 1부터 시작 (0 이하 스냅샷 제거)
   *
   * @param sourceCode 실행할 Python 소스 코드
   * @returns 성공 여부 + 스냅샷 배열 또는 에러 메시지
   *
   * @example
   * const result = await service.simulate('x = 10\nprint(x)');
   * // → { success: true, steps: [...] }
   *
   * @example
   * const result = await service.simulate('import subprocess');
   * // → { success: false, error: '위험한 코드...' }
   */
  public async simulate(sourceCode: string): Promise<PythonSimulationResult> {
    // 📂 임시 프로젝트 경로 (cleanup용)
    let projectPath: string | null = null;

    try {
      // ═══════════════════════════════════════════════════════
      // 1️⃣ Validate: 보안 검증
      // ═══════════════════════════════════════════════════════
      // 💡 위험 패턴 검사 (subprocess, eval, file write 등)
      //    검증 실패 시 에러 throw → catch 블록으로 이동
      this.validateCode(sourceCode);

      // ═══════════════════════════════════════════════════════
      // 2️⃣ Setup: 임시 프로젝트 생성
      // ═══════════════════════════════════════════════════════
      // 💡 /tmp/python-sim-XXXXXX 디렉토리에 main.py 생성
      //    + tracer.py (sys.settrace 구현체) 복사
      projectPath = await this.fileManager.createProject(sourceCode);

      // ═══════════════════════════════════════════════════════
      // 3️⃣ Trace: sys.settrace() 실행
      // ═══════════════════════════════════════════════════════
      // 💡 python3 main.py 실행
      //    각 라인마다 스냅샷 수집 (변수, 스택, 힙 상태)
      //    stdout을 통해 JSON 스냅샷 수신
      const snapshots = await this.debuggerClient.run(projectPath);

      // ═══════════════════════════════════════════════════════
      // 4️⃣ Post-process: 스냅샷 후처리
      // ═══════════════════════════════════════════════════════
      // 💡 유효하지 않은 라인 번호 필터링 (line < 1 또는 > maxLine)
      //    각 스냅샷에 소스 코드 라인 추가 (code 필드)
      const processedSnapshots = this.processSnapshots(snapshots, sourceCode);

      // 🎉 성공 반환
      return {
        success: true,
        steps: processedSnapshots,
      };
    } catch (error: any) {
      // 🚨 에러 처리 (보안 검증 실패/런타임 에러)
      // 💡 재시도 없이 즉시 반환 → 프론트엔드가 Toast 알림
      return {
        success: false,
        error: error.message,
      };
    } finally {
      // ═══════════════════════════════════════════════════════
      // 5️⃣ Cleanup: 임시 파일 정리
      // ═══════════════════════════════════════════════════════
      // 💡 성공/실패 관계없이 항상 실행
      //    디스크 공간 누수 방지
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }

  /**
   * 🛡️ 코드 보안 검증 (실행 전 필수)
   *
   * 📝 검증 항목:
   *   - 위험한 import 차단 (subprocess, os.system 등)
   *   - 동적 코드 실행 차단 (eval, exec, __import__)
   *   - 파일 쓰기 차단 (open(..., 'w'), os.remove 등)
   *
   * ⚠️ 차단되는 패턴:
   *   - import subprocess / from subprocess
   *   - eval() / exec()
   *   - open(..., 'w') / open(..., 'a')
   *   - os.system() / os.popen() / os.exec* / os.spawn*
   *   - os.remove() / os.unlink() / shutil.rmtree()
   *
   * @param code 검증할 Python 코드
   * @throws Error 위험 패턴 발견 시
   */
  private validateCode(code: string): void {
    // ✅ 기본 타입 검증
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid source code');
    }

    // 🚨 위험 패턴 목록 (정규식)
    // 💡 각 패턴은 보안상 차단해야 하는 Python 코드
    const dangerousPatterns = [
      // 프로세스 실행
      /\bimport\s+subprocess\b/,        // import subprocess
      /\bfrom\s+subprocess\b/,          // from subprocess import ...

      // 동적 코드 실행
      /\b__import__\s*\(/,              // __import__('os')
      /\bexec\s*\(/,                    // exec('malicious code')
      /\beval\s*\(/,                    // eval('malicious code')

      // 파일 시스템 조작
      /\bopen\s*\([^)]*['"][wa]/i,      // open(..., 'w') or open(..., 'a')
      /\bos\.system\s*\(/,              // os.system('rm -rf /')
      /\bos\.popen\s*\(/,               // os.popen('malicious command')
      /\bos\.exec/,                     // os.exec*, os.execv 등
      /\bos\.spawn/,                    // os.spawn*, os.spawnv 등
      /\bos\.remove\s*\(/,              // os.remove('file')
      /\bos\.unlink\s*\(/,              // os.unlink('file')
      /\bshutil\.rmtree\s*\(/,          // shutil.rmtree('dir')

      // 환경변수/시크릿 접근 차단
      /\bos\.environ\b/,                // os.environ → 전체 환경변수 노출
      /\/proc\/self\/environ/,          // /proc/self/environ 파일 읽기
      /\/proc\/\d+\/environ/,           // /proc/<pid>/environ
      /\bos\.getenv\s*\(/,              // os.getenv('DATABASE_URL')

      // 네트워크 접근 차단
      /\bimport\s+socket\b/,            // import socket
      /\bfrom\s+socket\b/,              // from socket import ...
      /\bimport\s+http/,                // import http, http.client 등
      /\bfrom\s+http/,                  // from http import ...
      /\bimport\s+urllib/,              // import urllib
      /\bfrom\s+urllib/,                // from urllib import ...
      /\bimport\s+requests\b/,          // import requests

      // 추가 위험 패턴
      /\bimport\s+ctypes\b/,            // ctypes로 C 함수 호출
      /\bfrom\s+ctypes\b/,              // from ctypes import ...
      /\bimport\s+signal\b/,            // signal 핸들러 조작
      /\bimport\s+multiprocessing\b/,   // 프로세스 생성
    ];

    // 🔍 코드 검사: 위험 패턴이 하나라도 있으면 차단
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(
          'Code contains potentially dangerous operations that are not allowed'
        );
      }
    }
  }

  /**
   * 🔄 스냅샷 후처리 (유효성 검증 + 코드 추가)
   *
   * 📝 처리 내용:
   *   1. 유효하지 않은 라인 번호 필터링
   *      - line < 1 → 제거 (실행 전 상태)
   *      - line > maxLine → 제거 (범위 초과)
   *   2. 각 스냅샷에 소스 코드 라인 추가
   *      - code 필드 = sourceCode.split('\n')[line - 1]
   *
   * 💡 목적:
   *   - 프론트엔드가 라인 번호로 코드를 매핑할 필요 없음
   *   - 스냅샷 자체에 실행된 코드 포함
   *
   * @param snapshots 디버거에서 수집한 원본 스냅샷
   * @param sourceCode 사용자가 입력한 원본 코드
   * @returns 처리된 스냅샷 배열 (code 필드 추가)
   */
  private processSnapshots(
    snapshots: PythonSnapshot[],
    sourceCode: string
  ): PythonSnapshot[] {
    // 📝 소스 코드를 라인별로 분리
    const lines = sourceCode.split('\n');
    const maxLine = lines.length;

    return snapshots
      // ❌ 유효하지 않은 라인 번호 제거
      .filter((snapshot) => {
        // line < 1: 실행 전 상태 (초기화)
        // line > maxLine: 범위 초과 (에러 상태)
        if (snapshot.line < 1 || snapshot.line > maxLine) {
          return false;
        }
        // 빈 줄 스텝 제거 (공백만 있는 라인)
        // 빈 줄 스텝이 끼어들면 프론트엔드와 인덱스가 밀림
        const lineContent = lines[snapshot.line - 1] || '';
        if (lineContent.trim() === '') {
          return false;
        }
        return true;
      })
      // ✅ 각 스냅샷에 소스 코드 라인 추가
      .map((snapshot) => ({
        ...snapshot,
        // 💡 프론트엔드가 line 번호만으로 코드 표시 가능
        code: lines[snapshot.line - 1] || '',
      }));
  }
}
