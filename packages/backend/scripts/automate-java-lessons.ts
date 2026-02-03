#!/usr/bin/env tsx
/**
 * Java lesson automation
 * Usage: pnpm run automate:java
 */

import path from 'path';
import { runWithCleanup, type AutomationConfig } from './lib/lesson-automation';
import { JavaSimulationService } from '../src/modules/simulators/java/java-simulation.service';
import type { JavaSimulationResult } from '../src/modules/simulators/java/runtime/types';

const config: AutomationConfig = {
  language: 'java',
  languageId: 'java',
  displayName: 'Java',
  templatesDir: path.join(__dirname, '../lesson-templates/java'),
  outputDir: path.join(__dirname, '../prisma/content/java/lessons'),
  memoryStateKey: 'javaMemoryState',
  visualizationType: 'javaMemory',

  chapterIdFromLessonId(lessonId: string) {
    const parts = lessonId.split('-');
    const chapterNum = parts[1];
    return {
      chapterId: `java-ch${chapterNum}`,
      chapterNum,
      lessonOrder: parseInt(parts[2], 10),
    };
  },

  async simulate(code: string) {
    const simulator = new JavaSimulationService();
    const result: JavaSimulationResult = await simulator.simulate(code);
    return {
      success: result.success,
      steps: result.steps || [],
      error: result.error || 'Unknown error',
    };
  },

  snapshotToMemoryState(snapshot: any, outputLines: string[], note: string) {
    return {
      stack: snapshot.stack || [],
      heap: snapshot.heap || [],
      output: outputLines,
      note,
    };
  },
};

runWithCleanup(config);
