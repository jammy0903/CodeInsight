/**
 * Course Data Backup Script
 *
 * 코스 데이터(Language, Chapter, Lesson, Content, Quiz)만 백업
 * 사용자 데이터는 제외
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function backup() {
  console.log('📦 Backing up course data...\n');

  try {
    // 1. Language 백업
    console.log('  📚 Languages...');
    const languages = await prisma.language.findMany({
      orderBy: { order: 'asc' },
    });
    console.log(`     ✅ ${languages.length} languages`);

    // 2. Chapter 백업
    console.log('  📖 Chapters...');
    const chapters = await prisma.chapter.findMany({
      orderBy: [{ languageId: 'asc' }, { order: 'asc' }],
    });
    console.log(`     ✅ ${chapters.length} chapters`);

    // 3. Lesson 백업
    console.log('  📝 Lessons...');
    const lessons = await prisma.lesson.findMany({
      orderBy: [{ chapterId: 'asc' }, { order: 'asc' }],
    });
    console.log(`     ✅ ${lessons.length} lessons`);

    // 4. LessonContent 백업
    console.log('  📄 Lesson Contents...');
    const contents = await prisma.lessonContent.findMany();
    console.log(`     ✅ ${contents.length} contents`);

    // 5. Quiz 백업
    console.log('  🧠 Quizzes...');
    const quizzes = await prisma.quiz.findMany({
      orderBy: [{ lessonId: 'asc' }, { order: 'asc' }],
    });
    console.log(`     ✅ ${quizzes.length} quizzes`);

    // 백업 데이터 생성
    const backupData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        languages,
        chapters,
        lessons,
        contents,
        quizzes,
      },
    };

    // JSON 파일로 저장
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `courses-backup-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log(`\n✅ Backup complete!`);
    console.log(`   📁 File: ${filepath}`);
    console.log(`   📊 Stats:`);
    console.log(`      - Languages: ${languages.length}`);
    console.log(`      - Chapters: ${chapters.length}`);
    console.log(`      - Lessons: ${lessons.length}`);
    console.log(`      - Contents: ${contents.length}`);
    console.log(`      - Quizzes: ${quizzes.length}`);

    return filepath;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

// 실행
backup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
