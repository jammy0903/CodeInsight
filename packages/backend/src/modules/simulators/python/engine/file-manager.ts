import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export class PythonFileManager {
  private readonly BASE_DIR = path.resolve(process.cwd(), 'tmp', 'python');

  constructor() {
    fs.mkdir(this.BASE_DIR, { recursive: true }).catch(() => {});
  }

  /**
   * Creates a unique temporary project directory and writes the Python source file.
   * @param code User Python code
   * @returns The absolute path to the project directory
   */
  async createProject(code: string): Promise<string> {
    const projectId = crypto.randomUUID();
    const projectPath = path.join(this.BASE_DIR, projectId);

    // 1. Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    // 2. Write main.py file
    await fs.writeFile(path.join(projectPath, 'main.py'), code, 'utf-8');

    return projectPath;
  }

  /**
   * Returns the path to the source file within a project.
   * @param projectPath The project directory path
   * @returns The absolute path to main.py
   */
  getSourcePath(projectPath: string): string {
    return path.join(projectPath, 'main.py');
  }

  /**
   * Cleans up the temporary project directory.
   * @param projectPath The project directory to delete
   */
  async cleanup(projectPath: string): Promise<void> {
    try {
      await fs.rm(projectPath, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup Python project ${projectPath}:`, error);
    }
  }
}
