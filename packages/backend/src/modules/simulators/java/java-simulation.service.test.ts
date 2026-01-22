
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { JavaSimulationService } from './java-simulation.service';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Before running any tests, we need to ensure the Java agent is built.
// This replicates the 'build' script in package.json.
beforeAll(async () => {
    const agentDir = path.resolve(__dirname, './agent');
    const buildCommand = `
        mkdir -p build/classes && 
        javac -encoding UTF-8 -d build/classes src/main/java/com/vis/*.java && 
        jar cfe build/debugger-agent.jar com.vis.DebuggerAgent -C build/classes .
    `.trim();

    try {
        await execAsync(buildCommand, { cwd: agentDir });
    } catch (error) {
        console.error("Failed to build Java agent for tests:", error);
        throw error; // Fail all tests if agent can't be built
    }
}, 30000); // 30s timeout for building

describe('JavaSimulationService', () => {
    let service: JavaSimulationService;

    beforeEach(() => {
        service = new JavaSimulationService();
    });

    it('should successfully simulate a valid simple Java code', async () => {
        const code = `
            public class Main {
                public static void main(String[] args) {
                    int x = 10;
                    x = 20;
                }
            }
        `;
        const result = await service.simulate(code);

        // For debugging purposes
        // console.log(JSON.stringify(result.snapshots, null, 2));

        expect(result.success).toBe(true);
        expect(result.snapshots).toBeInstanceOf(Array);
        expect(result.snapshots.length).toBeGreaterThan(0);

        // Check the last step, after all assignments have been made
        const lastStep = result.snapshots[result.snapshots.length - 1];
        expect(lastStep).toHaveProperty('line');
        expect(lastStep).toHaveProperty('event', 'STEP');
        expect(lastStep).toHaveProperty('stack');
        expect(lastStep.stack[0].variables).toHaveProperty('x');
    }, 15000);

    it('should return a compilation error for invalid code', async () => {
        const code = `
            public class Main {
                public static void main(String[] args) {
                    int x = 10 // missing semicolon
                }
            }
        `;
        const result = await service.simulate(code);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Compilation Error');
    }, 15000);

    it('should return a runtime error for code that throws an exception', async () => {
        const code = `
            public class Main {
                public static void main(String[] args) {
                    int x = 1 / 0;
                }
            }
        `;
        const result = await service.simulate(code);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Runtime Error');
    }, 15000);

    it('should return a timeout error for an infinite loop', async () => {
        const code = `
            public class Main {
                public static void main(String[] args) {
                    while (true) {}
                }
            }
        `;
        const result = await service.simulate(code);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Time Limit Exceeded');
    }, 15000);
});
