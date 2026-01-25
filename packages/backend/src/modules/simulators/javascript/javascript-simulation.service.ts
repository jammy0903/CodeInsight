import { JavaScriptFileManager } from './engine/file-manager';
import {
  JavaScriptDebuggerClient,
  JavaScriptSnapshot,
} from './engine/debugger-client';

export interface JavaScriptSimulationResult {
  success: boolean;
  steps?: JavaScriptSnapshot[];
  error?: string;
}

export class JavaScriptSimulationService {
  private fileManager: JavaScriptFileManager;
  private debuggerClient: JavaScriptDebuggerClient;

  constructor() {
    this.fileManager = new JavaScriptFileManager();
    this.debuggerClient = new JavaScriptDebuggerClient();
  }

  /**
   * Runs a JavaScript simulation, returning all step snapshots.
   * @param sourceCode The JavaScript source code to simulate.
   * @returns A promise that resolves with simulation results.
   */
  public async simulate(
    sourceCode: string
  ): Promise<JavaScriptSimulationResult> {
    let projectPath: string | null = null;

    try {
      // 1. Validate code (basic security check)
      this.validateCode(sourceCode);

      // 2. Create a temporary project directory and write main.js
      projectPath = await this.fileManager.createProject(sourceCode);

      // 3. Run the debugger agent and get all snapshots
      const snapshots = await this.debuggerClient.run(projectPath);

      // 4. Post-process snapshots
      const processedSnapshots = this.processSnapshots(snapshots, sourceCode);

      return {
        success: true,
        steps: processedSnapshots,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    } finally {
      // 5. Clean up the temporary project directory
      if (projectPath) {
        await this.fileManager.cleanup(projectPath);
      }
    }
  }

  /**
   * Basic code validation before execution.
   */
  private validateCode(code: string): void {
    if (!code || typeof code !== 'string') {
      throw new Error('Invalid source code');
    }

    // Check for potentially dangerous operations
    const dangerousPatterns = [
      /\brequire\s*\(\s*['"]child_process['"]\s*\)/,
      /\brequire\s*\(\s*['"]fs['"]\s*\)/,
      /\brequire\s*\(\s*['"]net['"]\s*\)/,
      /\brequire\s*\(\s*['"]http['"]\s*\)/,
      /\brequire\s*\(\s*['"]https['"]\s*\)/,
      /\bprocess\.exit\s*\(/,
      /\bprocess\.env\b/,
      /\bglobal\b/,
      /\b__dirname\b/,
      /\b__filename\b/,
      /\beval\s*\(/,
      /\bFunction\s*\(/,
      /\bimport\s*\(/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        throw new Error(
          'Code contains potentially dangerous operations that are not allowed'
        );
      }
    }
  }

  /**
   * Post-process snapshots to ensure validity.
   */
  private processSnapshots(
    snapshots: JavaScriptSnapshot[],
    sourceCode: string
  ): JavaScriptSnapshot[] {
    const lines = sourceCode.split('\n');
    const maxLine = lines.length;

    return snapshots
      .filter((snapshot) => {
        // Filter out snapshots with invalid line numbers
        if (snapshot.line < 1 || snapshot.line > maxLine) {
          return false;
        }
        return true;
      })
      .map((snapshot) => ({
        ...snapshot,
        // Add source code line for reference
        code: lines[snapshot.line - 1] || '',
      }));
  }
}
