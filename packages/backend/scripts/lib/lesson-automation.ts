/**
 * Shared lesson automation logic
 *
 * All language-specific automate-*-lessons.ts scripts delegate to this module.
 * Each script only provides a config object and a generateSteps function.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// ========================================
// Types
// ========================================

export interface LessonTemplate {
  lessonId: string;
  title: string;
  concept: string;
  code: string;
  annotations: Array<{
    line: number;
    title: string;
    explanation: string;
  }>;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  misconceptions: Array<{
    wrong: string;
    correct: string;
    why: string;
  }>;
  keyTakeaway: string;
}

export interface GeneratedLesson {
  lessonId: string;
  title: string;
  concept: string;
  content: {
    code: string;
    steps: any[];
  };
  quiz: LessonTemplate['quiz'];
  misconceptions: LessonTemplate['misconceptions'];
  keyTakeaway: string;
}

export interface AutomationConfig {
  language: string;
  languageId: string;
  displayName: string;
  templatesDir: string;
  outputDir: string;
  memoryStateKey: string;
  visualizationType: string;
  chapterIdFromLessonId: (lessonId: string) => { chapterId: string; chapterNum: string; lessonOrder: number };
  simulate: (code: string) => Promise<{ success: boolean; steps: any[]; error?: string }>;
  snapshotToMemoryState: (snapshot: any, outputLines: string[], note: string) => any;
}

// ========================================
// Database setup
// ========================================

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ========================================
// Shared utilities
// ========================================

export function parseOutput(stdout: string | undefined): string[] {
  if (!stdout) return [];
  return stdout.split('\n').filter(line => line.trim() !== '');
}

// ========================================
// Step generation (YAML + simulation -> steps)
// ========================================

async function generateJsonFromYaml(yamlPath: string, config: AutomationConfig): Promise<GeneratedLesson> {
  console.log(`   Loading: ${path.basename(yamlPath)}`);

  const templateContent = fs.readFileSync(yamlPath, 'utf-8');
  const template: LessonTemplate = yaml.parse(templateContent);

  console.log(`      - Lesson ID: ${template.lessonId}`);
  console.log(`      - Title: ${template.title}`);

  const result = await config.simulate(template.code);

  if (!result.success || !result.steps) {
    throw new Error(`Simulation failed: ${result.error}`);
  }

  console.log(`      Simulation: ${result.steps.length} snapshots`);

  const steps: any[] = [];
  const sortedAnnotations = [...template.annotations].sort((a, b) => a.line - b.line);
  let accumulatedOutput: string[] = [];

  for (const annotation of sortedAnnotations) {
    const snapshot = result.steps.find((s: any) => s.line === annotation.line);
    if (!snapshot) continue;

    if (snapshot.stdout) {
      accumulatedOutput.push(...parseOutput(snapshot.stdout));
    }

    const step: any = {
      line: annotation.line,
      title: annotation.title,
      explanation: annotation.explanation,
      highlight: [annotation.line],
      visualizationType: config.visualizationType,
      [config.memoryStateKey]: config.snapshotToMemoryState(
        snapshot,
        [...accumulatedOutput],
        `Line ${annotation.line} executed`
      ),
    };

    steps.push(step);
  }

  console.log(`      Generated: ${steps.length} steps\n`);

  return {
    lessonId: template.lessonId,
    title: template.title,
    concept: template.concept,
    content: { code: template.code, steps },
    quiz: template.quiz,
    misconceptions: template.misconceptions,
    keyTakeaway: template.keyTakeaway,
  };
}

// ========================================
// DB import
// ========================================

async function ensureLessonExists(lesson: GeneratedLesson, config: AutomationConfig): Promise<void> {
  const lessonId = lesson.lessonId;

  const existingLesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
  });

  if (existingLesson) return;

  const { chapterId, chapterNum, lessonOrder } = config.chapterIdFromLessonId(lessonId);

  const existingChapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
  });

  if (!existingChapter) {
    await prisma.chapter.create({
      data: {
        id: chapterId,
        languageId: config.languageId,
        title: `${config.displayName} ${chapterNum}`,
        description: '',
        order: parseInt(chapterNum, 10),
      },
    });
    console.log(`   Created chapter: ${chapterId}`);
  }

  await prisma.lesson.create({
    data: {
      id: lessonId,
      chapterId,
      title: lesson.title,
      description: lesson.concept,
      difficulty: 'basic',
      order: lessonOrder,
      estimatedTime: 10,
    },
  });
  console.log(`   Created lesson: ${lessonId}`);
}

async function importJsonToDb(lesson: GeneratedLesson, config: AutomationConfig): Promise<boolean> {
  const lessonId = lesson.lessonId;

  await ensureLessonExists(lesson, config);

  await prisma.lessonContent.upsert({
    where: { lessonId },
    update: {
      code: lesson.content.code,
      steps: JSON.stringify(lesson.content.steps),
    },
    create: {
      id: `content-${lessonId}`,
      lessonId,
      language: config.language,
      code: lesson.content.code,
      steps: JSON.stringify(lesson.content.steps),
    },
  });

  if (lesson.quiz) {
    await prisma.quiz.upsert({
      where: { id: `quiz-${lessonId}` },
      update: {
        lessonId,
        question: lesson.quiz.question,
        options: lesson.quiz.options,
        answer: String(lesson.quiz.correctIndex),
        explanation: lesson.quiz.explanation,
        order: 1,
      },
      create: {
        id: `quiz-${lessonId}`,
        lessonId,
        type: 'multiple_choice',
        question: lesson.quiz.question,
        options: lesson.quiz.options,
        answer: String(lesson.quiz.correctIndex),
        explanation: lesson.quiz.explanation,
        order: 1,
      },
    });
  }

  const stepsWithMemory = lesson.content.steps.filter(
    (s: any) => s[config.memoryStateKey] || s.memoryChanges
  ).length;

  console.log(`   [${lessonId}] ${lesson.title} (${lesson.content.steps.length} steps, ${stepsWithMemory} memory)`);
  return true;
}

// ========================================
// Main automation runner
// ========================================

export async function runAutomation(config: AutomationConfig): Promise<void> {
  console.log(`${config.displayName} lesson automation starting\n`);
  console.log('='.repeat(60));
  console.log('');

  // 1. Find YAML files
  console.log('Step 1: Finding YAML files\n');

  if (!fs.existsSync(config.templatesDir)) {
    console.error(`Templates directory not found: ${config.templatesDir}`);
    process.exit(1);
  }

  const yamlFiles = fs.readdirSync(config.templatesDir)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .sort();

  console.log(`   Found ${yamlFiles.length} YAML files in ${config.templatesDir}\n`);

  if (yamlFiles.length === 0) {
    console.log('No YAML files found. Exiting...');
    return;
  }

  if (!fs.existsSync(config.outputDir)) {
    fs.mkdirSync(config.outputDir, { recursive: true });
    console.log(`   Created output directory: ${config.outputDir}\n`);
  }

  // 2. YAML -> JSON conversion
  console.log('='.repeat(60));
  console.log('Step 2: YAML -> JSON conversion\n');

  const generatedLessons: GeneratedLesson[] = [];
  let yamlErrors = 0;

  for (const yamlFile of yamlFiles) {
    const yamlPath = path.join(config.templatesDir, yamlFile);

    try {
      const lesson = await generateJsonFromYaml(yamlPath, config);
      generatedLessons.push(lesson);

      const jsonPath = path.join(config.outputDir, `${lesson.lessonId}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(lesson, null, 2));
    } catch (error: any) {
      console.error(`   Error processing ${yamlFile}: ${error.message}\n`);
      yamlErrors++;
    }
  }

  console.log('='.repeat(60));
  console.log(`JSON conversion done: ${generatedLessons.length} succeeded, ${yamlErrors} failed\n`);

  if (generatedLessons.length === 0) {
    console.log('No lessons to import. Exiting...');
    return;
  }

  // 3. JSON -> DB import
  console.log('='.repeat(60));
  console.log('Step 3: JSON -> DB import\n');

  let imported = 0;
  let skipped = 0;

  for (const lesson of generatedLessons) {
    try {
      const success = await importJsonToDb(lesson, config);
      if (success) {
        imported++;
      } else {
        skipped++;
      }
    } catch (error: any) {
      console.error(`   Error importing ${lesson.lessonId}: ${error.message}`);
      skipped++;
    }
  }

  // 4. Final stats
  console.log('');
  console.log('='.repeat(60));
  console.log('Final results\n');
  console.log(`   YAML files: ${yamlFiles.length}`);
  console.log(`   JSON generated: ${generatedLessons.length}`);
  console.log(`   Conversion failed: ${yamlErrors}`);
  console.log(`   DB imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);

  const totalContent = await prisma.lessonContent.count({
    where: { language: config.language },
  });
  console.log(`   Total ${config.displayName} lessons in DB: ${totalContent}`);

  console.log('');
  console.log('='.repeat(60));
  console.log('Automation complete!\n');
}

export function runWithCleanup(config: AutomationConfig): void {
  runAutomation(config)
    .catch((error) => {
      console.error('Fatal Error:', error.message);
      console.error(error.stack);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
      await pool.end();
    });
}
