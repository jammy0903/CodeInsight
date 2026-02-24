/**
 * 📚 교육용 Java 메모리 시뮬레이터 v2
 *
 * 🏗️ 아키텍처 (JDI 디버거 기반):
 *   - FileManager: 임시 프로젝트 생성/삭제 (Main.java)
 *   - JavaCompiler: javac 컴파일러 래퍼 (.java → .class)
 *   - DebuggerClient: JDI 에이전트로 스텝별 메모리 스냅샷 수집
 *
 * 🔄 4단계 파이프라인:
 *   1️⃣ Setup    → 임시 디렉토리에 Main.java 생성 (코드 래핑)
 *   2️⃣ Compile  → javac로 .class 파일 생성
 *   3️⃣ Debug    → JDI Agent로 라인별 스냅샷 수집
 *   4️⃣ Cleanup  → 임시 파일/디렉토리 삭제
 *
 * ⚡ 에러 처리 원칙:
 *   - 재시도 없이 즉시 에러 반환 (빠른 실패)
 *   - 프론트엔드가 Toast 알림으로 사용자 피드백 담당
 *   - 디버거 타임아웃: 30초 (무한 루프 방지)
 *
 * 📦 의존성:
 *   - Java 17+ (JDI 사용)
 *   - agent/DebuggerAgent.java (JDI 구현체)
 *   - jackson-databind (JSON 직렬화)
 */

import { FileManager } from './engine/file-manager';
import { JavaCompiler } from './engine/compiler';
import { DebuggerClient } from './engine/debugger-client';
import { normalizeJavaEvents } from './normalizer';
import { checkCodeSecurity } from './engine/security';

/**
 * Java 시뮬레이션 서비스 메인 클래스
 *
 * 🎯 역할:
 *   - 사용자 코드를 Main.java로 래핑 (class 정의 없으면 자동 추가)
 *   - 컴파일 → 디버그 → 정리 파이프라인 오케스트레이션
 *   - 라인 번호 오프셋 보정 (래핑 코드 7줄 제거)
 *
 * 💡 설계 의도:
 *   - 각 요청마다 새 인스턴스 생성 (stateless)
 *   - 멀티 유저 동시 시뮬레이션 안전 (격리된 임시 디렉토리)
 */
export class JavaSimulationService {
    // 📁 파일 시스템 관리 (임시 프로젝트 생성/삭제)
    private fileManager: FileManager;

    // 🔨 컴파일러 (javac 래퍼)
    private compiler: JavaCompiler;

    // 🐛 디버거 클라이언트 (JDI 통신)
    private debuggerClient: DebuggerClient;

    /**
     * 생성자 - 의존성 초기화
     *
     * 💡 각 시뮬레이션 요청마다 새 인스턴스 생성됨
     *    → 상태 공유 없음 (thread-safe)
     */
    constructor() {
        this.fileManager = new FileManager();
        this.compiler = new JavaCompiler();
        this.debuggerClient = new DebuggerClient();
    }

    /**
     * 🚀 Java 코드 시뮬레이션 실행 (메인 엔트리포인트)
     *
     * 📝 동작 흐름:
     *   1. 사용자 코드 분석 (class 정의 있는지 검사)
     *   2. 없으면 Main.java로 자동 래핑 (import + class + main 추가)
     *   3. 임시 프로젝트 디렉토리 생성 (/tmp/java-sim-XXXXXX)
     *   4. javac 컴파일 실행 (Main.java → Main.class)
     *   5. JDI 디버거로 스텝별 스냅샷 수집
     *   6. 라인 번호 보정 (래핑 코드 7줄 제거)
     *   7. 실행 전 스냅샷 필터링 (line <= 0)
     *   8. 임시 파일 정리
     *
     * ⚠️ 주의사항:
     *   - 사용자 코드에 class 정의 없으면 LINE_OFFSET=7
     *   - class 정의 있으면 LINE_OFFSET=0 (래핑 안 함)
     *   - 래핑 구조:
     *     Line 1: (빈 줄, template literal 시작)
     *     Line 2: (빈 줄, imports 없을 때)
     *     Line 3: import java.util.*;
     *     Line 4: import java.io.*;
     *     Line 5: (빈 줄)
     *     Line 6: public class Main {
     *     Line 7: public static void main(String[] args) {
     *     Line 8: ← 사용자 코드 시작!
     *
     * @param sourceCode 실행할 Java 소스 코드 (class 정의 선택적)
     * @returns 성공 여부 + 스냅샷 배열 또는 에러 메시지
     *
     * @example
     * // class 정의 없는 코드 (자동 래핑)
     * const result = await service.simulate('int x = 10;\nSystem.out.println(x);');
     * // → LINE_OFFSET=7 적용
     *
     * @example
     * // class 정의 있는 코드 (래핑 안 함)
     * const result = await service.simulate('public class Main { ... }');
     * // → LINE_OFFSET=0
     */
    public async simulate(sourceCode: string) {
        // 🏷️ 메인 클래스명 (고정값, FileManager와 동일해야 함)
        const mainClassName = 'Main';
        // 📂 임시 프로젝트 경로 (cleanup용)
        let projectPath: string | null = null;

        try {
            // ═══════════════════════════════════════════════════════
            // 0️⃣ Security: 보안 검증
            // ═══════════════════════════════════════════════════════
            const security = checkCodeSecurity(sourceCode);
            if (!security.safe) {
                return {
                    success: false,
                    error: security.reason || 'Code contains potentially dangerous operations',
                };
            }

            // ═══════════════════════════════════════════════════════
            // 1️⃣ Setup: 임시 프로젝트 생성
            // ═══════════════════════════════════════════════════════
            // 💡 /tmp/java-sim-XXXXXX 디렉토리에 Main.java 생성
            //    class 정의 없으면 자동 래핑 (import + class + main)
            projectPath = await this.fileManager.createProject(sourceCode);

            // ═══════════════════════════════════════════════════════
            // 2️⃣ Compile: javac 컴파일
            // ═══════════════════════════════════════════════════════
            // 💡 Main.java → Main.class 생성
            //    컴파일 에러 발생 시 catch 블록으로 이동
            await this.compiler.compile(projectPath);

            // ═══════════════════════════════════════════════════════
            // 3️⃣ Debug: JDI 디버거 실행
            // ═══════════════════════════════════════════════════════
            // 💡 DebuggerAgent.java가 JDI로 Main.class 실행
            //    각 라인마다 스냅샷 수집 (변수, 스택, 힙 상태)
            const snapshots = await this.debuggerClient.run(projectPath, mainClassName);

            // ═══════════════════════════════════════════════════════
            // 4️⃣ Post-process: 라인 번호 보정
            // ═══════════════════════════════════════════════════════
            // 🔍 래핑 여부 감지 (class 정의 있는지 확인)
            const hasClassDefinition = /\b(public\s+)?(class|interface|enum)\s+\w+/.test(sourceCode);

            // 📏 라인 오프셋 계산
            //    - class 없음 → 7줄 래핑 (LINE_OFFSET=7)
            //    - class 있음 → 래핑 안 함 (LINE_OFFSET=0)
            const LINE_OFFSET = !hasClassDefinition ? 7 : 0;

            // 📝 소스 코드를 라인별로 분리 (빈 줄 필터링용)
            const sourceLines = sourceCode.split('\n');

            // 🔄 스냅샷 변환: 디버거 라인 → 사용자 코드 라인
            const adjustedSnapshots = snapshots
                // ❌ 실행 전 스냅샷 제거 (line <= 0 또는 래핑 영역)
                .filter((snapshot: any) => {
                    const adjustedLine = (snapshot.line || snapshot.lineNumber) - LINE_OFFSET;
                    return adjustedLine >= 1;
                })
                // ✅ 라인 번호 보정 (래핑 코드 줄 수만큼 빼기)
                .map((snapshot: any) => ({
                    ...snapshot,
                    line: snapshot.line ? snapshot.line - LINE_OFFSET : snapshot.line,
                    lineNumber: snapshot.lineNumber ? snapshot.lineNumber - LINE_OFFSET : snapshot.lineNumber,
                }))
                // 빈 줄 스텝 제거 (공백만 있는 라인)
                // 빈 줄 스텝이 끼어들면 프론트엔드와 인덱스가 밀림
                .filter((snapshot: any) => {
                    const line = snapshot.line || snapshot.lineNumber;
                    const lineContent = sourceLines[line - 1] || '';
                    return lineContent.trim() !== '';
                });

            // ═══════════════════════════════════════════════════════
            // 5️⃣ Normalize: SimulatorEvent[] 추가 (dual path)
            // ═══════════════════════════════════════════════════════
            const normalizedSteps = adjustedSnapshots.map((step: any) => ({
                ...step,
                normalizedEvents: normalizeJavaEvents(step),
            }));

            // 🎉 성공 반환
            return {
                success: true,
                steps: normalizedSteps,
            };

        } catch (error: any) {
            // 🚨 에러 처리 (컴파일/런타임 에러)
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
}