import { FileManager } from './engine/file-manager';
import { JavaCompiler } from './engine/compiler';
import { DebuggerClient } from './engine/debugger-client';

export class JavaSimulationService {
    private fileManager: FileManager;
    private compiler: JavaCompiler;
    private debuggerClient: DebuggerClient;

    constructor() {
        this.fileManager = new FileManager();
        this.compiler = new JavaCompiler();
        this.debuggerClient = new DebuggerClient();
    }

    /**
     * Compiles and runs a Java simulation, returning all step snapshots.
     * This is a complete, one-off simulation.
     * @param sourceCode The Java source code to simulate.
     * @returns A promise that resolves with an array of all snapshots from the run.
     */
    public async simulate(sourceCode: string) {
        // The new file manager assumes the class is named 'Main'
        const mainClassName = 'Main';
        let projectPath: string | null = null;

        try {
            // 1. Create a temporary project directory and write the Main.java file.
            projectPath = await this.fileManager.createProject(sourceCode);

            // 2. Compile the Main.java file.
            await this.compiler.compile(projectPath);

            // 3. Run the debugger agent and get all snapshot steps.
            const snapshots = await this.debuggerClient.run(projectPath, mainClassName);

            // 4. Adjust line numbers if code was wrapped
            // FileManager wraps user code with these lines:
            // Line 1: empty (template literal start)
            // Line 2: empty (from ${imports.join} when no imports)
            // Line 3: import java.util.*;
            // Line 4: import java.io.*;
            // Line 5: empty
            // Line 6: public class Main {
            // Line 7: public static void main(String[] args) {
            // Line 8: USER CODE STARTS
            const hasClassDefinition = /\b(public\s+)?(class|interface|enum)\s+\w+/.test(sourceCode);
            const LINE_OFFSET = !hasClassDefinition ? 8 : 0;

            const adjustedSnapshots = snapshots
                // 첫 번째 스텝 필터링 (실행 전 상태, line <= 0)
                .filter((snapshot: any) => {
                    const adjustedLine = (snapshot.line || snapshot.lineNumber) - LINE_OFFSET;
                    return adjustedLine >= 1;
                })
                .map((snapshot: any) => ({
                    ...snapshot,
                    line: snapshot.line ? snapshot.line - LINE_OFFSET : snapshot.line,
                    lineNumber: snapshot.lineNumber ? snapshot.lineNumber - LINE_OFFSET : snapshot.lineNumber,
                }));

            return {
                success: true,
                steps: adjustedSnapshots,
            };

        } catch (error: any) {
            return {
                success: false,
                error: error.message,
            };
        } finally {
            // 4. Clean up the temporary project directory.
            if (projectPath) {
                await this.fileManager.cleanup(projectPath);
            }
        }
    }
}