#!/usr/bin/env tsx
/**
 * Python lesson automation
 * Usage: pnpm run automate:python
 */

import path from 'path';
import { runWithCleanup, parseOutput, type AutomationConfig } from './lib/lesson-automation';
import { PythonSimulationService } from '../src/modules/simulators/python/python-simulation.service';

function formatValue(value: any): string {
  if (value === null) return 'None';
  if (value === undefined) return 'None';
  if (typeof value === 'object' && value.type === 'Reference') {
    if (value.displayValue !== undefined) {
      return value.class === 'str' ? `"${value.displayValue}"` : value.displayValue;
    }
    return `<${value.class} object>`;
  }
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') {
    if (value.__class__) return `<${value.__class__} object>`;
    return `{${Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')}}`;
  }
  return String(value);
}

function getType(value: any): string {
  if (value === null || value === undefined) return 'NoneType';
  if (typeof value === 'object' && value.type === 'Reference') return value.class || 'object';
  if (typeof value === 'string') return 'str';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
  if (typeof value === 'boolean') return 'bool';
  if (Array.isArray(value)) return 'list';
  if (typeof value === 'object') return value.__class__ ? 'instance' : 'dict';
  return 'unknown';
}

const config: AutomationConfig = {
  language: 'python',
  languageId: 'python',
  displayName: 'Python',
  templatesDir: path.join(__dirname, '../lesson-templates/python'),
  outputDir: path.join(__dirname, '../prisma/content/python/lessons'),
  memoryStateKey: 'pythonMemoryState',
  visualizationType: 'pythonMemory',

  chapterIdFromLessonId(lessonId: string) {
    const parts = lessonId.split('-');
    return {
      chapterId: `${parts[0]}-${parts[1]}`,
      chapterNum: parts[1],
      lessonOrder: parseInt(parts[2], 10),
    };
  },

  async simulate(code: string) {
    const simulator = new PythonSimulationService();
    const result = await simulator.simulate(code);
    return {
      success: result.success,
      steps: result.steps || [],
      error: result.error,
    };
  },

  snapshotToMemoryState(snapshot: any, outputLines: string[], note: string) {
    const variables: Array<{ name: string; value: string; type: string; id?: string }> = [];

    if (snapshot.stack && snapshot.stack.length > 0) {
      const frame = snapshot.stack[0];
      if (frame.variables) {
        for (const [name, value] of Object.entries(frame.variables)) {
          if (name.startsWith('__')) continue;
          variables.push({
            name,
            value: formatValue(value),
            type: getType(value),
            id: typeof value === 'object' && value !== null ? `0x${variables.length + 1}000` : undefined,
          });
        }
      }
    }

    return { variables, output: outputLines, note, names: [], objects: [] };
  },
};

runWithCleanup(config);
