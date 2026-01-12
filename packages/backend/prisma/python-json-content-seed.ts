/**
 * Python Lesson Content Seed from JSON files
 * JSON 파일에서 레슨 콘텐츠 읽어오기
 *
 * 실행: npx ts-node prisma/python-json-content-seed.ts
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
const LESSONS_DIR = path.join(__dirname, 'content/python/lessons');

interface PythonLessonJson {
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
  console.log('🐍 Seeding Python LessonContent from JSON files...\n');
  console.log(`📂 Lessons directory: ${LESSONS_DIR}\n`);

  // 디렉토리 존재 확인
  if (!fs.existsSync(LESSONS_DIR)) {
    console.error(`❌ Directory not found: ${LESSONS_DIR}`);
    process.exit(1);
  }

  // JSON 파일 목록
  const files = fs.readdirSync(LESSONS_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  console.log(`📄 Found ${files.length} JSON files\n`);

  if (files.length === 0) {
    console.log('⚠️  No JSON files found. Create lesson files first.');
    return;
  }

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    const filePath = path.join(LESSONS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    let lesson: PythonLessonJson;
    try {
      lesson = JSON.parse(content);
    } catch (e) {
      console.log(`⚠️  Skipping ${file}: Invalid JSON`);
      skipped++;
      continue;
    }

    const lessonId = lesson.lessonId;

    // 레슨 존재 확인
    const existingLesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!existingLesson) {
      console.log(`⚠️  Skipping ${lessonId}: Lesson not found in DB (run python-seed.ts first)`);
      skipped++;
      continue;
    }

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
        language: 'python',
        code: lesson.content.code,
        steps: JSON.stringify(lesson.content.steps),
      },
    });

    // pythonMemoryState가 있는 스텝 개수 확인
    const stepsWithMemory = lesson.content.steps.filter(
      (s: any) => s.pythonMemoryState || s.memoryChanges
    ).length;
    const memoryInfo = stepsWithMemory > 0 ? ` (memory: ${stepsWithMemory})` : '';

    console.log(`✅ [${lessonId}] ${lesson.title}${memoryInfo}`);
    updated++;
  }

  console.log(`\n📊 Results:`);
  console.log(`   - Updated: ${updated} lessons`);
  console.log(`   - Skipped: ${skipped} files`);

  // 최종 통계
  const totalContent = await prisma.lessonContent.count({
    where: { language: 'python' },
  });
  console.log(`   - Total Python LessonContents in DB: ${totalContent}`);
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
