import { describe, it, expect, beforeEach } from 'vitest';
import { JavaScriptSimulationService } from './javascript-simulation.service';

describe('JavaScriptSimulationService (Debugger-based)', () => {
  let service: JavaScriptSimulationService;

  beforeEach(() => {
    service = new JavaScriptSimulationService();
  });

  it('should capture variable assignments', async () => {
    const code = `let x = 10;
let y = 20;
let z = x + y;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();
    expect(result.steps).toBeInstanceOf(Array);
    expect(result.steps!.length).toBeGreaterThan(0);

    // Check that variables are captured
    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep).toHaveProperty('line');
    expect(lastStep).toHaveProperty('event', 'STEP');
    expect(lastStep).toHaveProperty('stack');
    expect(lastStep.stack[0].variables).toHaveProperty('x', 10);
    expect(lastStep.stack[0].variables).toHaveProperty('y', 20);
    expect(lastStep.stack[0].variables).toHaveProperty('z', 30);
  }, 15000);

  it('should capture strings on heap', async () => {
    const code = `let name = "hello";`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);
    expect(lastStep.heap[0].type).toBe('String');
    expect(lastStep.heap[0].content).toContain('hello');
  }, 15000);

  it('should capture arrays on heap', async () => {
    const code = `let arr = [1, 2, 3];`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);

    const arrayHeap = lastStep.heap.find((h) => h.type === 'Array');
    expect(arrayHeap).toBeDefined();
    expect(arrayHeap?.length).toBe(3);
  }, 15000);

  it('should capture function definitions', async () => {
    const code = `function add(a, b) {
    return a + b;
}

let x = 5;
let y = 10;
let total = add(x, y);`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    // Check that function is captured
    const stepWithFunction = result.steps!.find((s) =>
      s.stack[0]?.variables?.add
    );
    expect(stepWithFunction).toBeDefined();
    expect(stepWithFunction!.stack[0].variables.add.class).toBe('Function');
  }, 15000);

  it('should capture objects on heap', async () => {
    const code = `let obj = { name: "test", value: 42 };`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    const objectHeap = lastStep.heap.find((h) => h.type === 'Object');
    expect(objectHeap).toBeDefined();
    expect(objectHeap?.content).toContain('name');
    expect(objectHeap?.content).toContain('value');
  }, 15000);

  it('should return error for syntax errors', async () => {
    const code = `let x = 10;
let y = (20;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 15000);

  it('should reject dangerous code patterns', async () => {
    const code = `const fs = require('fs');
fs.readFileSync('/etc/passwd');`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('dangerous');
  }, 15000);

  it('should handle const and let declarations', async () => {
    const code = `const PI = 3.14;
let radius = 5;
let area = PI * radius * radius;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('PI', 3.14);
    expect(lastStep.stack[0].variables).toHaveProperty('radius', 5);
  }, 15000);

  it('should handle timeout for infinite loops', async () => {
    const code = `while (true) {}`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Time Limit Exceeded');
  }, 15000);

  it('should handle boolean values', async () => {
    const code = `let isActive = true;
let isDisabled = false;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('isActive', true);
    expect(lastStep.stack[0].variables).toHaveProperty('isDisabled', false);
  }, 15000);

  it('should handle null values', async () => {
    const code = `let empty = null;`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.stack[0].variables).toHaveProperty('empty', null);
  }, 15000);
});
