import { spawnSync } from 'child_process';
import { JavaScriptSimulationService } from './javascript-simulation.service';

describe('JavaScript Inspector Async Ordering', () => {
  const canSpawnChildNode = !spawnSync('node', ['-v'], { encoding: 'utf8' }).error;
  const suite = canSpawnChildNode ? describe : describe.skip;

  const prevEngine = process.env.JS_SIM_ENGINE;
  process.env.JS_SIM_ENGINE = 'inspector';

  suite('inspector async cases', () => {
    const service = new JavaScriptSimulationService();

    afterAll(() => {
      process.env.JS_SIM_ENGINE = prevEngine;
    });

    it('captures async scheduling steps without runtime failure', async () => {
      const code = [
        'setTimeout(() => {',
        '  const macro = 1;',
        '}, 0);',
        'Promise.resolve().then(() => {',
        '  const micro = 1;',
        '});',
      ].join('\n');

      const result = await service.simulate(code);
      expect(result.success).toBe(true);
      expect(result.engine).toBe('inspector');

      const steps = result.steps ?? [];
      expect(steps.length).toBeGreaterThanOrEqual(6);
      const lines = steps.map((s) => s.line);
      expect(lines).toContain(1);
      expect(lines).toContain(4);
      expect(lines).toContain(5);
      expect(lines).toContain(6);
      expect(lines).toContain(2);
      expect(lines).toContain(3);

      // Promise microtask callback(4,5,6) should run before timeout callback(2,3)
      expect(lines.indexOf(4)).toBeLessThan(lines.indexOf(2));
    });

    it('keeps async/await flow executable in inspector mode', async () => {
      const code = [
        'async function run() {',
        '  const x = await Promise.resolve(5);',
        '  const y = x + 1;',
        '}',
        'run();',
      ].join('\n');

      const result = await service.simulate(code);
      expect(result.success).toBe(true);
      expect(result.engine).toBe('inspector');

      const steps = result.steps ?? [];
      expect(steps.length).toBeGreaterThan(0);
      expect(steps.some((s) => s.line === 5)).toBe(true);
    });
  });
});
