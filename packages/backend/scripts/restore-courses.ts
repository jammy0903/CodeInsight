/**
 * Course Data Restore Script
 *
 * 백업된 코스 데이터를 복원
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function restore(backupFile?: string) {
  console.log('📥 Restoring course data...\n');

  try {
    // 백업 파일 찾기
    let filepath: string;
    if (backupFile) {
      filepath = backupFile;
    } else {
      // backups 폴더에서 최신 백업 파일 찾기
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        throw new Error('No backup directory found');
      }

      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith('courses-backup-') && f.endsWith('.json'))
        .sort()
        .reverse();

      if (files.length === 0) {
        throw new Error('No backup files found');
      }

      filepath = path.join(backupDir, files[0]);
      console.log(`  📁 Using latest backup: ${files[0]}\n`);
    }

    // 백업 파일 읽기
    const backupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const { languages, chapters, lessons, contents, quizzes } = backupData.data;

    console.log(`  📊 Backup Info:`);
    console.log(`     - Timestamp: ${backupData.timestamp}`);
    console.log(`     - Languages: ${languages.length}`);
    console.log(`     - Chapters: ${chapters.length}`);
    console.log(`     - Lessons: ${lessons.length}`);
    console.log(`     - Contents: ${contents.length}`);
    console.log(`     - Quizzes: ${quizzes.length}\n`);

    // 1. Language 복원
    console.log('  📚 Restoring Languages...');
    for (const lang of languages) {
      await prisma.language.create({ data: lang });
    }
    console.log(`     ✅ ${languages.length} languages restored`);

    // 2. Chapter 복원
    console.log('  📖 Restoring Chapters...');
    for (const chapter of chapters) {
      await prisma.chapter.create({ data: chapter });
    }
    console.log(`     ✅ ${chapters.length} chapters restored`);

    // 3. Lesson 복원
    console.log('  📝 Restoring Lessons...');
    for (const lesson of lessons) {
      await prisma.lesson.create({ data: lesson });
    }
    console.log(`     ✅ ${lessons.length} lessons restored`);

    // 4. LessonContent 복원
    console.log('  📄 Restoring Lesson Contents...');
    for (const content of contents) {
      await prisma.lessonContent.create({ data: content });
    }
    console.log(`     ✅ ${contents.length} contents restored`);

    // 5. Quiz 복원
    console.log('  🧠 Restoring Quizzes...');
    for (const quiz of quizzes) {
      await prisma.quiz.create({ data: quiz });
    }
    console.log(`     ✅ ${quizzes.length} quizzes restored`);

    console.log(`\n✅ Restore complete!`);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  }
}

// CLI 인자로 백업 파일 경로를 받을 수 있음
const backupFile = process.argv[2];

restore(backupFile)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
