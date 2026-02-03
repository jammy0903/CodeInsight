/**
 * validate-simulators.ts
 *
 * All lessons simulation validation script.
 *
 * This script iterates through all lessons in the database and runs the corresponding
 * live simulator against the lesson's code. It's used to verify that all
 * existing lesson content is compatible with the live simulators before
 * migrating away from pre-authored 'steps' data.
 *
 * Usage:
 *   pnpm ts-node packages/backend/scripts/validate-simulators.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment variables.');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
import { simulateCode as simulateCCode } from '../src/modules/simulators/c/simulator';
import { JavaSimulationService } from '../src/modules/simulators/java/java-simulation.service';
import { simulatePython } from '../src/modules/simulators/python/simulator';
import { simulate as simulateJsCode } from '../src/modules/simulators/javascript/service';


const javaSimService = new JavaSimulationService();

async function main() {
  console.log('🚀 Starting simulation validation for all lessons...');

  const lessons = await prisma.lesson.findMany({
    include: {
      content: true,
    },
  });

  console.log(`🔍 Found ${lessons.length} lessons to validate.`);

  let failedCount = 0;
  const failedLessons: { id: string; lang: string; error: string }[] = [];

  for (const lesson of lessons) {
    if (!lesson.content || !lesson.content.code || !lesson.content.language) {
      console.warn(`⚠️ Skipping lesson ${lesson.id} due to missing content, code, or language.`);
      continue;
    }

    const { id } = lesson;
    const { language, code } = lesson.content;
    let result: { success: boolean; error?: string; message?: string };

    try {
      switch (language) {
        case 'c':
          const cResult = simulateCCode(code);
          result = { success: cResult.success, error: cResult.error, message: cResult.message };
          break;

        case 'java':
          result = await javaSimService.simulate(code);
          break;

        case 'python':
          result = simulatePython({ code });
          break;

        case 'javascript':
          // This is async, let's await it
          const jsResult = await simulateJsCode(code);
          result = { success: jsResult.steps.length > 0, error: undefined, message: undefined }; // Assuming success if steps are produced
          break;

        default:
          console.warn(`🤷‍♂️ No simulator for language: ${language}. Skipping lesson ${id}.`);
          continue;
      }

      if (result.success) {
        console.log(`✅ [${language.toUpperCase()}] Lesson ${id}: OK`);
      } else {
        failedCount++;
        const errorMsg = result.error || result.message || 'Unknown simulation error';
        failedLessons.push({ id, lang: language, error: errorMsg });
        console.error(`❌ [${language.toUpperCase()}] Lesson ${id}: FAILED - ${errorMsg}`);
      }
    } catch (e: any) {
        failedCount++;
        const errorMsg = e.message || 'A critical error occurred during simulation.';
        failedLessons.push({ id, lang: language, error: errorMsg });
        console.error(`💥 [${language.toUpperCase()}] Lesson ${id}: CRASHED - ${errorMsg}`);
    }
  }

  console.log('\n🏁 Validation Complete!');
  if (failedCount === 0) {
    console.log('🎉 All lessons passed simulation successfully!');
  } else {
    console.log(`\n🚨 Found ${failedCount} failed simulations:`);
    failedLessons.forEach(({ id, lang, error }) => {
      console.log(`  - Lesson ID: ${id} (${lang.toUpperCase()})`);
      console.log(`    Error: ${error}\n`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
