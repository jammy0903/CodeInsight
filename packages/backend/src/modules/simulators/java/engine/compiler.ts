import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class JavaCompiler {
  /**
   * 해당 프로젝트 폴더의 Main.java를 컴파일합니다.
   * @param projectPath 프로젝트 폴더 경로
   */
  async compile(projectPath: string): Promise<void> {
    const sourceFile = path.join(projectPath, 'Main.java');
    
    // -g: 디버깅 정보(변수명 등) 포함
    // -d .: 컴파일된 .class 파일을 같은 폴더에 저장
    // -encoding UTF-8: 한글 깨짐 방지
    const command = `javac -g -encoding UTF-8 -d "${projectPath}" "${sourceFile}"`;

    try {
      await execAsync(command);
    } catch (error: any) {
      // 컴파일 에러 발생 시 stderr 내용을 추출하여 사용자에게 보여줄 메시지로 변환
      const errorMessage = error.stderr || error.message;
      throw new Error(`Compilation Error:\n${errorMessage}`);
    }
  }
}