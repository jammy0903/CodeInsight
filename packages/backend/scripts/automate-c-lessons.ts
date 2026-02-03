#!/usr/bin/env tsx
/**
 * C lesson automation
 * Usage: pnpm run automate:c
 */

import path from 'path';
import { runWithCleanup, type AutomationConfig } from './lib/lesson-automation';
import { simulateCode } from '../src/modules/simulators/c/simulator';

const config: AutomationConfig = {
  language: 'c',
  languageId: 'c',
  displayName: 'C',
  templatesDir: path.join(__dirname, '../lesson-templates/c'),
  outputDir: path.join(__dirname, '../prisma/content/c/lessons'),
  memoryStateKey: 'cMemoryState',
  visualizationType: 'cMemory',

  chapterIdFromLessonId(lessonId: string) {
    const parts = lessonId.split('-');
    return {
      chapterId: `${parts[0]}-${parts[1]}`,
      chapterNum: parts[1],
      lessonOrder: parseInt(parts[2], 10),
    };
  },

  async simulate(code: string) {
    const result = simulateCode(code, '');
    return {
      success: result.success,
      steps: result.steps || [],
      error: result.message,
    };
  },

  snapshotToMemoryState(snapshot: any, outputLines: string[], note: string) {
    return {
      stack: snapshot.frames || [],
      heap: snapshot.heap || [],
      output: outputLines,
      note,
    };
  },
};

runWithCleanup(config);
