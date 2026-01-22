import { spawn } from 'child_process';
import * as path from 'path';

export class DebuggerClient {
  // 빌드된 Java Agent의 JAR 파일 경로 (경로는 프로젝트 구조에 따라 조정 필요)
  private readonly AGENT_JAR_PATH = path.resolve(
    __dirname, 
    '../../agent/build/debugger-agent.jar'
  );

  /**
   * Java Agent를 실행하여 사용자 코드를 디버깅하고 스냅샷을 가져옵니다.
   * @param projectPath 컴파일된 코드가 있는 폴더
   * @param mainClass 실행할 메인 클래스 이름 (보통 'Main')
   */
  async run(projectPath: string, mainClass: string = 'Main'): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const steps: any[] = [];
      
      // 1. Java 프로세스 실행 (Agent와 함께)
      const child = spawn('java', [
        '-jar', 
        this.AGENT_JAR_PATH, // Agent 실행
        mainClass            // 타겟 클래스 (Agent에게 전달되는 인자)
      ], {
        cwd: projectPath,    // 작업 디렉토리를 사용자 프로젝트 폴더로 설정
        // 보안 정책 파일이 있다면 여기에 추가 옵션 (-Djava.security.manager 등)을 넣습니다.
      });

      let errorBuffer = '';

      // 2. 표준 출력(stdout) 수신: Agent가 보내는 JSON 데이터
      child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const snapshot = JSON.parse(line);
            steps.push(snapshot);
          } catch (e) {
            // JSON이 아닌 일반 출력(System.out.print)일 수도 있음 -> 무시하거나 로그 수집
            // console.log('Program Output:', line);
          }
        }
      });

      // 3. 표준 에러(stderr) 수신: 런타임 에러 등
      child.stderr.on('data', (data) => {
        errorBuffer += data.toString();
      });

      // 4. 프로세스 종료 처리
      child.on('close', (code) => {
        if (code === 0) {
          resolve(steps);
        } else {
          // 비정상 종료 시 에러 반환
          reject(new Error(`Runtime Error (Exit Code ${code}):\n${errorBuffer}`));
        }
      });

      // 5. 타임아웃 (무한 루프 방지, 5초)
      setTimeout(() => {
        if (!child.killed) {
          child.kill();
          reject(new Error('Time Limit Exceeded (5s)'));
        }
      }, 5000);
    });
  }
}