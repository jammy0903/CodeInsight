import { describe, it, expect, beforeEach } from 'vitest';
import { JavaScriptSimulationService } from '../../modules/simulators/javascript/javascript-simulation.service';

describe('Debug class test', () => {
  let service: JavaScriptSimulationService;

  beforeEach(() => {
    service = new JavaScriptSimulationService();
  });

  it('should handle class definition', async () => {
    const code = `class Person {
  constructor(name) {
    this.name = name;
  }
}
let person = new Person("John");`;
    const result = await service.simulate(code);
    
    console.log('Full result:', JSON.stringify(result, null, 2));
    console.log('Error details:', result.error);

    if (!result.success) {
      console.error('Simulation failed!');
      console.error('Error code:', result.error?.code);
      console.error('Error message:', result.error?.message);
    }

    expect(result.success).toBe(true);
  }, 20000);
});
