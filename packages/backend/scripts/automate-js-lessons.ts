#!/usr/bin/env tsx
/**
 * JavaScript lesson automation
 * Usage: pnpm run automate:js
 */

import path from 'path';
import { runWithCleanup, type AutomationConfig } from './lib/lesson-automation';
import { JavaScriptSimulationService } from '../src/modules/simulators/javascript/javascript-simulation.service';

function formatValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(formatValue).join(', ')}]`;
  if (typeof value === 'object') {
    return `{${Object.entries(value).map(([k, v]) => `${k}: ${formatValue(v)}`).join(', ')}}`;
  }
  return String(value);
}

function getType(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'Array';
  if (typeof value === 'object') return 'Object';
  if (typeof value === 'function') return 'function';
  return 'unknown';
}

const config: AutomationConfig = {
  language: 'javascript',
  languageId: 'javascript',
  displayName: 'JavaScript',
  templatesDir: path.join(__dirname, '../lesson-templates/js'),
  outputDir: path.join(__dirname, '../prisma/content/js/lessons'),
  memoryStateKey: 'jsMemoryState',
  visualizationType: 'jsMemory',

  chapterIdFromLessonId(lessonId: string) {
    const parts = lessonId.split('-');
    return {
      chapterId: `${parts[0]}-${parts[1]}`,
      chapterNum: parts[1],
      lessonOrder: parseInt(parts[2], 10),
    };
  },

  async simulate(code: string) {
    const simulator = new JavaScriptSimulationService();
    const result = await simulator.simulate(code);
    return {
      success: result.success,
      steps: result.steps || [],
      error: result.error?.message || 'Unknown error',
    };
  },

  snapshotToMemoryState(snapshot: any, outputLines: string[], note: string) {
    const variables: Array<{ name: string; value: string; type: string; id?: string }> = [];

    if (snapshot.scope) {
      for (const [name, value] of Object.entries(snapshot.scope)) {
        if (name.startsWith('__')) continue;
        variables.push({
          name,
          value: formatValue(value),
          type: getType(value),
          id: typeof value === 'object' && value !== null ? `0x${variables.length + 1}000` : undefined,
        });
      }
    }

    return { variables, output: outputLines, note, names: [], objects: [] };
  },
};

runWithCleanup(config);
