import { PythonFileManager } from './engine/file-manager';
import { PythonDebuggerClient, PythonSnapshot } from './engine/debugger-client';

export interface PythonSimulationResult {
  success: boolean;
  steps?: PythonSnapshot[];
  error?: string;
}

export class PythonSimulationService {
  private fileManager: PythonFileManager;
  private debuggerClient: PythonDebuggerClient;

  constructor() {
    this.fileManager = new PythonFileManager();
    this.debuggerClient = new PythonDebuggerClient();
  }

  /**
   * Runs a Python simulation, returning all step snapshots.
   * @param sourceCode The Python source code to simulate.
   * @returns A promise that resolves with simulation results.
   */
  public async simulate(sourceCode: string): Promise<PythonSimulationResult> {
    let projectPath: string | null = null;

    try {
      // 1. Validate code (basic syntax check)
      this.validateCode(sourceCode);

      // 2. Create a temporary project directory and write main.py
      projectPath = await this.fileManager.createProject(sourceCode);

      // 3. Run the debugger agent and get all snapshots
      const snapshots = await this.debuggerClient.run(projectPath);

      // 4. Post-process snapshots (filter invalid lines, etc.)
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

    // Check for potentially dangerous imports/operations
    const dangerousPatterns = [
      /\bimport\s+subprocess\b/,
      /\bfrom\s+subprocess\b/,
      /\b__import__\s*\(/,
      /\bexec\s*\(/,
      /\beval\s*\(/,
      /\bopen\s*\([^)]*['"][wa]/i, // open() with write mode
      /\bos\.system\s*\(/,
      /\bos\.popen\s*\(/,
      /\bos\.exec/,
      /\bos\.spawn/,
      /\bos\.remove\s*\(/,
      /\bos\.unlink\s*\(/,
      /\bshutil\.rmtree\s*\(/,
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
    snapshots: PythonSnapshot[],
    sourceCode: string
  ): PythonSnapshot[] {
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
