/**
 * User Data Restore Script
 *
 * 백업 파일에서 사용자 데이터를 복원합니다.
 *
 * 실행: npx ts-node prisma/restore-user-data.ts [backup-file.json]        ← dry-run (미리보기)
 *       npx ts-node prisma/restore-user-data.ts [backup-file.json] --apply ← 실제 실행
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const applyFlag = args.includes('--apply');
const fileArg = args.find(a => a !== '--apply');

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function restore() {
  // 백업 파일 경로 가져오기
  let backupFile = fileArg;

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

  // Dry-run: 요약만 보여주고 종료
  const summary = {
    users: (data.users || []).length,
    userProfiles: (data.userProfiles || []).length,
    userProgress: (data.userProgress || []).length,
    userStreaks: (data.userStreaks || []).length,
    userNotes: (data.userNotes || []).length,
    quizAttempts: (data.quizAttempts || []).length,
    lessonActivities: (data.lessonActivities || []).length,
    stepActivities: (data.stepActivities || []).length,
    sessionContexts: (data.sessionContexts || []).length,
    chatHistories: (data.chatHistories || []).length,
  };

  console.log('\n  📊 Backup contains:');
  for (const [key, count] of Object.entries(summary)) {
    console.log(`     - ${key}: ${count}`);
  }

  if (!applyFlag) {
    console.log('\n⚠️  DRY-RUN: 실제 복원하려면 --apply 플래그를 추가하세요.');
    console.log('   예: npx ts-node prisma/restore-user-data.ts --apply');
    return;
  }

  console.log('\n  🔄 Restoring user data (--apply)...\n');

  const restored = {
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
  for (const [key, count] of Object.entries(restored)) {
    console.log(`     - ${key}: ${count}`);
  }

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
