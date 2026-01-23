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
            // FileManager adds 5 lines of wrapper when wrapping user code:
            // Line 1: empty, Line 2: imports, Line 3: empty, Line 4: class Main {, Line 5: main method
            const needsWrapper = !sourceCode.includes('class Main');
            const LINE_OFFSET = needsWrapper ? 5 : 0;

            const adjustedSnapshots = snapshots.map((snapshot: any) => ({
                ...snapshot,
                line: snapshot.line ? Math.max(1, snapshot.line - LINE_OFFSET) : snapshot.line,
                lineNumber: snapshot.lineNumber ? Math.max(1, snapshot.lineNumber - LINE_OFFSET) : snapshot.lineNumber,
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