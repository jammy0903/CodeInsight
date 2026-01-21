/**
 * Java Simulator 간단 테스트
 */

import { createSimulator } from './src/modules/simulators/java/simulator';

const testCode = `
public class Main {
    public static void main(String[] args) {
        int x = 10;
        int y = 20;
        int sum = x + y;
        System.out.println(sum);
    }
}
`;

async function test() {
  console.log('=== Java Simulator Test ===\n');
  console.log('Test Code:');
  console.log(testCode);
  console.log('\n--- Simulation Start ---\n');

  const simulator = createSimulator();
  const result = await simulator.simulate(testCode);

  if (result.success) {
    console.log('✅ Simulation SUCCESS');
    console.log(`Total Steps: ${result.steps.length}`);
    console.log('\nSteps:');

    result.steps.forEach((step, index) => {
      console.log(`\n[Step ${index + 1}] Line ${step.lineNumber}: ${step.code}`);
      console.log(`  Explanation: ${step.explanation}`);
      console.log(`  Stack Depth: ${step.callDepth}`);
      console.log(`  Stack Variables:`, step.stack.frames[0]?.localVariables.size || 0);
      console.log(`  Heap Objects:`, step.heap.objects.length);
      if (step.stdout) {
        console.log(`  Output: ${step.stdout.trim()}`);
      }
    });

    if (result.steps.length > 0) {
      const lastStep = result.steps[result.steps.length - 1];
      console.log('\n--- Final State ---');
      console.log('Output:', lastStep.stdout?.trim() || '(no output)');
    }

  } else {
    console.log('❌ Simulation FAILED');
    console.log('Error:', result.error);
  }
}

test().catch(console.error);
