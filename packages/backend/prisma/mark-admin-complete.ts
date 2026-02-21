/**
 * Mark All Lessons as Complete for Admin User
 *
 * 어드민 사용자의 모든 레슨을 완료 상태로 업데이트합니다.
 * 테스트/데모 용도로 빠르게 진행상황을 채우기 위해 사용합니다.
 *
 * 실행: npx ts-node prisma/mark-admin-complete.ts          ← dry-run (미리보기)
 *       npx ts-node prisma/mark-admin-complete.ts --apply  ← 실제 실행
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const applyFlag = process.argv.includes('--apply');

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function markAdminComplete() {
  console.log('🚀 Marking all lessons as complete for admin user...\n');

  // 1. 어드민 사용자 찾기 (role = 'admin')
  const admins = await prisma.user.findMany({
    where: { role: 'admin' },
    select: { id: true, nickname: true },
  });

  if (admins.length === 0) {
    console.log('❌ No admin users found!');
    process.exit(1);
  }

  console.log(`  👤 Found ${admins.length} admin user(s):`);
  admins.forEach(admin => {
    console.log(`     - ${admin.nickname}`);
  });

  // 2. 모든 레슨 가져오기
  const lessons = await prisma.lesson.findMany({
    select: { id: true, title: true },
  });

  console.log(`\n  📚 Found ${lessons.length} lessons`);

  if (!applyFlag) {
    // Dry-run: 영향 범위만 보여줌
    for (const admin of admins) {
      const existing = await prisma.userProgress.count({
        where: { userId: admin.id, status: 'completed' },
      });
      console.log(`\n  📊 ${admin.nickname}: 현재 ${existing}/${lessons.length} 완료`);
      console.log(`     → ${lessons.length - existing}개 레슨이 새로 완료 처리됩니다.`);
    }
    console.log('\n⚠️  DRY-RUN: 실제 실행하려면 --apply 플래그를 추가하세요.');
    console.log('   예: npx ts-node prisma/mark-admin-complete.ts --apply');
    return;
  }

  console.log('\n  ⚙️  Applying changes (--apply)...\n');

  // 3. 각 어드민 사용자에 대해 모든 레슨을 완료로 마크
  for (const admin of admins) {
    console.log(`  ⚙️  Processing admin: ${admin.nickname}`);

    let completed = 0;
    let updated = 0;

    for (const lesson of lessons) {
      try {
        const progress = await prisma.userProgress.upsert({
          where: {
            userId_lessonId: {
              userId: admin.id,
              lessonId: lesson.id,
            },
          },
          update: {
            status: 'completed',
            currentStep: 100, // 진행도 100%
            completedAt: new Date(),
            quizScore: 100,
            quizTotal: 100,
          },
          create: {
            userId: admin.id,
            lessonId: lesson.id,
            status: 'completed',
            currentStep: 100,
            completedAt: new Date(),
            quizScore: 100,
            quizTotal: 100,
          },
        });

        // createdAt === updatedAt → 새로 생성, 다르면 기존 레코드 업데이트
        if (progress.createdAt.getTime() === progress.updatedAt.getTime()) {
          completed++;
        } else {
          updated++;
        }
      } catch (e) {
        console.log(`     ⚠️  Skipped ${lesson.id}: ${(e as Error).message}`);
      }
    }

    console.log(`     ✅ Created: ${completed}, Updated: ${updated}`);
  }

  // 4. 통계 출력
  console.log('\n  📊 Summary:');
  for (const admin of admins) {
    const total = await prisma.userProgress.count({
      where: {
        userId: admin.id,
        status: 'completed',
      },
    });
    console.log(`     - ${admin.nickname}: ${total}/${lessons.length} lessons completed`);
  }

  console.log('\n✅ Admin progress marked complete!');
}

markAdminComplete()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
