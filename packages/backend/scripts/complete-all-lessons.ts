/**
 * Complete all lessons for a specific user
 *
 * Usage: npx tsx scripts/complete-all-lessons.ts <firebase_uid>          ← dry-run
 *        npx tsx scripts/complete-all-lessons.ts <firebase_uid> --apply  ← 실제 실행
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const applyFlag = args.includes('--apply');
const firebaseUid = args.find(a => a !== '--apply');

if (!firebaseUid) {
  console.error('Usage: npx tsx scripts/complete-all-lessons.ts <firebase_uid> [--apply]');
  console.error('Example: npx tsx scripts/complete-all-lessons.ts REDACTED_ADMIN_UID --apply');
  process.exit(1);
}

async function completeAllLessons(uid: string) {
  try {
    // 1. Find user by Firebase UID (from OAuth account)
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: { providerId: uid },
      include: { user: true },
    });

    if (!oauthAccount) {
      console.error(`❌ User not found with Firebase UID: ${uid}`);
      process.exit(1);
    }

    const user = oauthAccount.user;
    console.log(`✅ Found user: ${user.nickname} (${user.id})`);

    // 2. Get all lessons
    const lessons = await prisma.lesson.findMany({
      where: { isActive: true },
      include: { chapter: { include: { language: true } } },
    });

    console.log(`📚 Total lessons: ${lessons.length}`);

    // 3. Check current progress
    const currentCompleted = await prisma.userProgress.count({
      where: { userId: user.id, status: 'completed' },
    });
    console.log(`📊 Currently completed: ${currentCompleted}/${lessons.length}`);
    console.log(`   → ${lessons.length - currentCompleted}개 레슨이 새로 완료 처리됩니다.`);

    if (!applyFlag) {
      console.log('\n⚠️  DRY-RUN: 실제 실행하려면 --apply 플래그를 추가하세요.');
      console.log(`   예: npx tsx scripts/complete-all-lessons.ts ${uid} --apply`);
      return;
    }

    console.log('\n⚙️  Applying changes (--apply)...\n');

    // 4. Create or update UserProgress for each lesson
    const now = new Date();
    let created = 0;
    let updated = 0;

    for (const lesson of lessons) {
      const progress = await prisma.userProgress.upsert({
        where: {
          userId_lessonId: {
            userId: user.id,
            lessonId: lesson.id,
          },
        },
        create: {
          userId: user.id,
          lessonId: lesson.id,
          status: 'completed',
          currentStep: 0,
          startedAt: now,
          completedAt: now,
        },
        update: {
          status: 'completed',
          completedAt: now,
        },
      });

      if (progress.startedAt && progress.startedAt.getTime() === now.getTime()) {
        created++;
      } else {
        updated++;
      }

      console.log(
        `  ✓ ${lesson.chapter.language.name} > ${lesson.chapter.title} > ${lesson.title}`
      );
    }

    console.log('\n🎉 Completion summary:');
    console.log(`   Newly created: ${created}`);
    console.log(`   Updated existing: ${updated}`);
    console.log(`   Total: ${lessons.length}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

completeAllLessons(firebaseUid);
