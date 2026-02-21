/**
 * Content Update Script (사용자 데이터 보존)
 *
 * 레슨 컨텐츠만 업데이트하고, 사용자 진행상황(UserProgress)은 유지합니다.
 *
 * 실행: npx ts-node prisma/update-content.ts
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { expandDeltaSteps } from '../src/utils/expandDeltaSteps';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface LessonContentData {
  lessonId: string;
  title: string;
  concept: string;
  content: {
    code: string;
    steps: object[];
    deltaFormat?: boolean;
  };
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
  keyTakeaway: string;
}

function loadLessonContent(langId: string, lessonId: string): LessonContentData | null {
  const lessonPath = path.join(__dirname, 'content', langId, 'lessons', `${lessonId}.json`);
  if (!fs.existsSync(lessonPath)) return null;
  return JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
}

async function updateContent() {
  console.log('🔄 Updating lesson content (preserving user progress)...\n');

  const languages = ['c', 'cpp', 'python', 'java', 'javascript', 'python-practical'];
  let updatedCount = 0;
  let createdCount = 0;

  for (const langId of languages) {
    const lessonsDir = path.join(__dirname, 'content', langId, 'lessons');
    if (!fs.existsSync(lessonsDir)) {
      console.log(`  ⏭️  Skipping ${langId} (no lessons directory)`);
      continue;
    }

    const files = fs.readdirSync(lessonsDir).filter(f => f.endsWith('.json'));
    console.log(`  📚 Processing ${langId} (${files.length} lessons)...`);

    for (const file of files) {
      const lessonId = file.replace('.json', '');
      const content = loadLessonContent(langId, lessonId);
      if (!content) continue;

      // LessonContent upsert (있으면 업데이트, 없으면 생성)
      const contentId = `content-${lessonId}`;
      const existing = await prisma.lessonContent.findUnique({ where: { id: contentId } });

      const expandedSteps = expandDeltaSteps(
        content.content.steps,
        content.content.deltaFormat === true,
      );

      if (existing) {
        await prisma.lessonContent.update({
          where: { id: contentId },
          data: {
            code: content.content.code,
            steps: JSON.stringify(expandedSteps),
          },
        });
        updatedCount++;
      } else {
        // lesson이 존재하는지 확인
        const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
        if (lesson) {
          await prisma.lessonContent.create({
            data: {
              id: contentId,
              lessonId: lessonId,
              code: content.content.code,
              language: langId,
              steps: JSON.stringify(expandedSteps),
            },
          });
          createdCount++;
        }
      }

      // Quiz upsert
      if (content.quiz) {
        const quizId = `quiz-${lessonId}`;
        const existingQuiz = await prisma.quiz.findUnique({ where: { id: quizId } });

        if (existingQuiz) {
          await prisma.quiz.update({
            where: { id: quizId },
            data: {
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
            },
          });
        }
      }
    }
  }

  console.log('\n✅ Content update complete!');
  console.log(`   📝 Updated: ${updatedCount} lessons`);
  console.log(`   ➕ Created: ${createdCount} new lessons`);
  console.log('   👤 User progress: PRESERVED');
}

updateContent()
  .catch((e) => {
    console.error('❌ Update error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
