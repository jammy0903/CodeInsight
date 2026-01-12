/**
 * C Lesson Content Seed from JSON files
 * JSON 파일에서 레슨 콘텐츠 읽어오기
 *
 * 실행: npx ts-node prisma/c-json-content-seed.ts
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

// JSON 파일 경로
const LESSONS_DIR = path.join(__dirname, 'content/c/lessons');

interface LessonJson {
  lessonId: string;
  title: string;
  concept: string;
  content: {
    code: string;
    steps: object[];
  };
  quiz?: object;
  misconceptions?: object[];
  keyTakeaway?: string;
}

async function seedFromJson() {
  console.log('🌱 Seeding C LessonContent from JSON files...\n');
  console.log(`📂 Lessons directory: ${LESSONS_DIR}\n`);

  // JSON 파일 목록
  const files = fs.readdirSync(LESSONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`📄 Found ${files.length} JSON files\n`);

  let updated = 0;
  for (const file of files) {
    const filePath = path.join(LESSONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lesson: LessonJson = JSON.parse(content);

    const lessonId = lesson.lessonId;

    // 기존 콘텐츠 업데이트 또는 생성
    await prisma.lessonContent.upsert({
      where: { lessonId },
      update: {
        code: lesson.content.code,
        steps: JSON.stringify(lesson.content.steps),
      },
      create: {
        id: `content-${lessonId}`,
        lessonId,
        language: 'c',
        code: lesson.content.code,
        steps: JSON.stringify(lesson.content.steps),
      },
    });

    // stdout이 있는 스텝 개수 확인
    const stepsWithStdout = lesson.content.steps.filter(
      (s: any) => s.stdout
    ).length;
    const stdoutInfo = stepsWithStdout > 0 ? ` (stdout: ${stepsWithStdout})` : '';

    console.log(`✅ [${lessonId}] ${lesson.title}${stdoutInfo}`);
    updated++;
  }

  console.log(`\n📊 Updated ${updated} lessons from JSON files`);
}

seedFromJson()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
