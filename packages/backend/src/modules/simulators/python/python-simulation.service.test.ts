import { describe, it, expect, beforeEach } from 'vitest';
import { PythonSimulationService } from './python-simulation.service';

describe('PythonSimulationService (Debugger-based)', () => {
  let service: PythonSimulationService;

  beforeEach(() => {
    service = new PythonSimulationService();
  });

  it('should capture variable assignments', async () => {
    const code = `x = 10
y = 20
z = x + y`;
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
    const code = `name = "hello"`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);
    expect(lastStep.heap[0].type).toBe('str');
    expect(lastStep.heap[0].content).toContain('hello');
  }, 15000);

  it('should capture lists on heap', async () => {
    const code = `arr = [1, 2, 3]`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    expect(lastStep.heap.length).toBeGreaterThan(0);
    expect(lastStep.heap[0].type).toBe('list');
    expect(lastStep.heap[0].length).toBe(3);
  }, 15000);

  it('should capture function calls with call stack', async () => {
    const code = `def add(a, b):
    result = a + b
    return result

x = 5
y = 10
total = add(x, y)`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    // Find a step where we're inside the add function
    const functionStep = result.steps!.find(
      (s) => s.stack.length > 1 || s.stack[0]?.methodName === 'add'
    );
    expect(functionStep).toBeDefined();
  }, 15000);

  it('should return error for syntax errors', async () => {
    const code = `x = 10
y = (20`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  }, 15000);

  it('should reject dangerous code patterns', async () => {
    const code = `import subprocess
subprocess.run(['ls'])`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('dangerous');
  }, 15000);

  it('should handle objects/classes', async () => {
    const code = `class Person:
    def __init__(self, name):
        self.name = name

p = Person("Alice")`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    // Should have the Person class and instance on heap
    expect(lastStep.heap.length).toBeGreaterThan(0);
  }, 15000);

  it('should handle dictionaries', async () => {
    const code = `data = {"name": "test", "value": 42}`;
    const result = await service.simulate(code);

    expect(result.success).toBe(true);
    expect(result.steps).toBeDefined();

    const lastStep = result.steps![result.steps!.length - 1];
    const dictHeap = lastStep.heap.find((h) => h.type === 'dict');
    expect(dictHeap).toBeDefined();
    expect(dictHeap?.length).toBe(2);
  }, 15000);

  it('should handle timeout for infinite loops', async () => {
    const code = `while True:
    pass`;
    const result = await service.simulate(code);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Time Limit Exceeded');
  }, 15000);
});
