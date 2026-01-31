/**
 * User Data Restore Script
 *
 * 백업 파일에서 사용자 데이터를 복원합니다.
 *
 * 실행: npx ts-node prisma/restore-user-data.ts [backup-file.json]
 * 예시: npx ts-node prisma/restore-user-data.ts backups/backup-2024-01-15-12-30-00.json
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function restore() {
  // 백업 파일 경로 가져오기
  let backupFile = process.argv[2];

  if (!backupFile) {
    // 최신 백업 파일 자동 선택
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      console.error('❌ No backup directory found');
      process.exit(1);
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length === 0) {
      console.error('❌ No backup files found');
      process.exit(1);
    }

    backupFile = path.join(backupDir, files[0]);
    console.log(`📂 Using latest backup: ${files[0]}`);
  } else {
    // 상대 경로 처리
    if (!path.isAbsolute(backupFile)) {
      backupFile = path.join(__dirname, backupFile);
    }
  }

  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  console.log(`📖 Reading backup from: ${backupFile}\n`);
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

  console.log(`  📅 Backup time: ${data.backupTime}`);
  console.log('  🔄 Restoring user data...\n');

  let restored = {
    users: 0,
    userProfiles: 0,
    userProgress: 0,
    userStreaks: 0,
    userNotes: 0,
    quizAttempts: 0,
    lessonActivities: 0,
    stepActivities: 0,
    sessionContexts: 0,
    chatHistories: 0,
  };

  // Users (upsert)
  for (const user of data.users || []) {
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user,
      });
      restored.users++;
    } catch (e) {
      console.log(`  ⚠️  Skipped user ${user.id}: ${(e as Error).message}`);
    }
  }

  // UserProfiles (upsert)
  for (const profile of data.userProfiles || []) {
    try {
      await prisma.userProfile.upsert({
        where: { id: profile.id },
        update: profile,
        create: profile,
      });
      restored.userProfiles++;
    } catch (e) {
      console.log(`  ⚠️  Skipped profile: ${(e as Error).message}`);
    }
  }

  // UserProgress (upsert) - lesson이 존재하는 것만
  for (const progress of data.userProgress || []) {
    try {
      const lessonExists = await prisma.lesson.findUnique({ where: { id: progress.lessonId } });
      if (lessonExists) {
        await prisma.userProgress.upsert({
          where: { id: progress.id },
          update: progress,
          create: progress,
        });
        restored.userProgress++;
      }
    } catch (e) {
      // 무시 (lesson이 없으면 skip)
    }
  }

  // UserStreaks
  for (const streak of data.userStreaks || []) {
    try {
      await prisma.userStreak.upsert({
        where: { id: streak.id },
        update: streak,
        create: streak,
      });
      restored.userStreaks++;
    } catch (e) {
      // 무시
    }
  }

  // UserNotes
  for (const note of data.userNotes || []) {
    try {
      await prisma.userNote.upsert({
        where: { id: note.id },
        update: note,
        create: note,
      });
      restored.userNotes++;
    } catch (e) {
      // 무시
    }
  }

  // QuizAttempts
  for (const attempt of data.quizAttempts || []) {
    try {
      await prisma.quizAttempt.upsert({
        where: { id: attempt.id },
        update: attempt,
        create: attempt,
      });
      restored.quizAttempts++;
    } catch (e) {
      // 무시
    }
  }

  // LessonActivities
  for (const activity of data.lessonActivities || []) {
    try {
      await prisma.lessonActivity.upsert({
        where: { id: activity.id },
        update: activity,
        create: activity,
      });
      restored.lessonActivities++;
    } catch (e) {
      // 무시
    }
  }

  // StepActivities
  for (const activity of data.stepActivities || []) {
    try {
      await prisma.stepActivity.upsert({
        where: { id: activity.id },
        update: activity,
        create: activity,
      });
      restored.stepActivities++;
    } catch (e) {
      // 무시
    }
  }

  // SessionContexts
  for (const session of data.sessionContexts || []) {
    try {
      await prisma.sessionContext.upsert({
        where: { id: session.id },
        update: session,
        create: session,
      });
      restored.sessionContexts++;
    } catch (e) {
      // 무시
    }
  }

  // ChatHistories
  for (const chat of data.chatHistories || []) {
    try {
      await prisma.chatHistory.upsert({
        where: { id: chat.id },
        update: chat,
        create: chat,
      });
      restored.chatHistories++;
    } catch (e) {
      // 무시
    }
  }

  console.log('  ✅ Restore stats:');
  console.log(`     - Users: ${restored.users}`);
  console.log(`     - UserProfiles: ${restored.userProfiles}`);
  console.log(`     - UserProgress: ${restored.userProgress}`);
  console.log(`     - UserStreaks: ${restored.userStreaks}`);
  console.log(`     - UserNotes: ${restored.userNotes}`);
  console.log(`     - QuizAttempts: ${restored.quizAttempts}`);
  console.log(`     - LessonActivities: ${restored.lessonActivities}`);
  console.log(`     - StepActivities: ${restored.stepActivities}`);
  console.log(`     - SessionContexts: ${restored.sessionContexts}`);
  console.log(`     - ChatHistories: ${restored.chatHistories}`);

  console.log('\n✅ Restore complete!');
}

restore()
  .catch((e) => {
    console.error('❌ Restore error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
