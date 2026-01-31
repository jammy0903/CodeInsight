/**
 * User Data Backup Script
 *
 * 모든 사용자 데이터를 JSON 파일로 백업합니다.
 *
 * 실행: npx ts-node prisma/backup-user-data.ts
 * 결과: prisma/backups/backup-YYYY-MM-DD-HH-mm-ss.json
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

async function backup() {
  console.log('💾 Starting user data backup...\n');

  // 백업할 테이블들
  const data = {
    backupTime: new Date().toISOString(),
    users: await prisma.user.findMany(),
    userProfiles: await prisma.userProfile.findMany(),
    userProgress: await prisma.userProgress.findMany(),
    userStreaks: await prisma.userStreak.findMany(),
    userNotes: await prisma.userNote.findMany(),
    quizAttempts: await prisma.quizAttempt.findMany(),
    lessonActivities: await prisma.lessonActivity.findMany(),
    stepActivities: await prisma.stepActivity.findMany(),
    sessionContexts: await prisma.sessionContext.findMany(),
    chatHistories: await prisma.chatHistory.findMany(),
  };

  // 통계 출력
  console.log('  📊 Backup stats:');
  console.log(`     - Users: ${data.users.length}`);
  console.log(`     - UserProfiles: ${data.userProfiles.length}`);
  console.log(`     - UserProgress: ${data.userProgress.length}`);
  console.log(`     - UserStreaks: ${data.userStreaks.length}`);
  console.log(`     - UserNotes: ${data.userNotes.length}`);
  console.log(`     - QuizAttempts: ${data.quizAttempts.length}`);
  console.log(`     - LessonActivities: ${data.lessonActivities.length}`);
  console.log(`     - StepActivities: ${data.stepActivities.length}`);
  console.log(`     - SessionContexts: ${data.sessionContexts.length}`);
  console.log(`     - ChatHistories: ${data.chatHistories.length}`);

  // 백업 디렉토리 생성
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 파일명 생성
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  // 저장
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`\n✅ Backup complete!`);
  console.log(`   📄 File: ${filepath}`);
  console.log(`   📦 Size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
}

backup()
  .catch((e) => {
    console.error('❌ Backup error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
