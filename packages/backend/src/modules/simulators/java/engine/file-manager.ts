import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class FileManager {
  // 임시 파일들이 저장될 기본 경로 (OS 임시 폴더 혹은 프로젝트 내 tmp)
  private readonly BASE_DIR = path.resolve(process.cwd(), 'tmp');

  constructor() {
    // 기본 tmp 폴더가 없으면 생성
    fs.mkdir(this.BASE_DIR, { recursive: true }).catch(() => {});
  }

  /**
   * 사용자 코드를 위한 고유한 임시 프로젝트 폴더를 생성하고 Main.java를 저장합니다.
   * @param code 사용자 Java 코드
   * @returns 생성된 프로젝트 폴더의 절대 경로
   */
  async createProject(code: string): Promise<string> {
    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.BASE_DIR, projectId);
    
    // 1. 프로젝트 폴더 생성
    await fs.mkdir(projectPath, { recursive: true });

    // 2. Main.java 파일 작성
    // (주의: 사용자 코드는 반드시 'public class Main' 혹은 class Main'이어야 함)
    await fs.writeFile(path.join(projectPath, 'Main.java'), code, 'utf-8');

    return projectPath;
  }

  /**
   * 임시 프로젝트 폴더를 삭제합니다.
   * @param projectPath 삭제할 프로젝트 경로
   */
  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup project ${projectPath}:`, error);
    }
  }
}