/**
 * Standalone Quiz 시드 스크립트
 *
 * WHY: 하드코딩된 퀴즈 데이터를 DB로 이관
 * - JSON 파일에서 퀴즈 데이터 읽기
 * - StandaloneQuiz 테이블에 upsert
 *
 * 사용법:
 *   pnpm tsx prisma/seed-quizzes.ts
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// 타입 정의
// =============================================

interface QuizData {
  language: string;
  quizType: string;
  chapterId: string;
  chapterTitle: string;
  quizzes: Array<{
    id: string;
    question: string;
    options?: string[];
    answer: string;
    explanation: string;
    concepts: string[];
    difficulty: string;
    orderNum: number;
  }>;
}

async function seedQuizzes() {
  const quizDir = path.join(__dirname, 'content/quizzes');
  const languages = ['c', 'javascript', 'java', 'python'];
  const types = ['ox', 'multiple-choice', 'fill-blank'];

  let totalQuizzes = 0;

  for (const lang of languages) {
    for (const type of types) {
      const dir = path.join(quizDir, lang, type);

      if (!fs.existsSync(dir)) {
        console.log(`⏭️  Skipping ${lang}/${type} (directory not found)`);
        continue;
      }

      const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

      if (files.length === 0) {
        console.log(`⏭️  Skipping ${lang}/${type} (no JSON files)`);
        continue;
      }

      console.log(`\n📂 Processing ${lang}/${type}...`);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const data: QuizData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        console.log(`  📄 ${file} (${data.quizzes.length} quizzes)`);

        for (const quiz of data.quizzes) {
          await prisma.standaloneQuiz.upsert({
            where: { id: quiz.id },
            update: {
              question: quiz.question,
              options: quiz.options,
              answer: quiz.answer,
              explanation: quiz.explanation,
              concepts: quiz.concepts,
              difficulty: quiz.difficulty,
              orderNum: quiz.orderNum,
              isActive: true,
              updatedAt: new Date(),
            },
            create: {
              id: quiz.id,
              language: data.language,
              quizType: data.quizType,
              chapterId: data.chapterId,
              chapterTitle: data.chapterTitle,
              question: quiz.question,
              options: quiz.options,
              answer: quiz.answer,
              explanation: quiz.explanation,
              concepts: quiz.concepts,
              difficulty: quiz.difficulty,
              orderNum: quiz.orderNum,
              isActive: true,
            },
          });

          totalQuizzes++;
        }

        console.log(`  ✅ ${data.chapterTitle} - ${data.quizzes.length}개 저장 완료`);
      }
    }
  }

  console.log(`\n🎉 총 ${totalQuizzes}개 퀴즈 시드 완료!`);
}

async function main() {
  try {
    console.log('🌱 Starting quiz seed...\n');
    await seedQuizzes();
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
