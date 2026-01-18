/**
 * Complete all lessons for a specific user
 * Usage: npx tsx scripts/complete-all-lessons.ts <firebase_uid>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function completeAllLessons(firebaseUid: string) {
  try {
    // 1. Find user by Firebase UID (from OAuth account)
    const oauthAccount = await prisma.oAuthAccount.findFirst({
      where: { providerId: firebaseUid },
      include: { user: true },
    });

    if (!oauthAccount) {
      console.error(`❌ User not found with Firebase UID: ${firebaseUid}`);
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

    // 3. Create or update UserProgress for each lesson
    const now = new Date();
    let completed = 0;
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

      if (progress.status === 'completed') {
        if (progress.startedAt && progress.startedAt.getTime() === now.getTime()) {
          created++;
        } else {
          updated++;
        }
        completed++;
      }

      console.log(
        `  ✓ ${lesson.chapter.language.name} > ${lesson.chapter.title} > ${lesson.title}`
      );
    }

    console.log('\n🎉 Completion summary:');
    console.log(`   Total processed: ${lessons.length}`);
    console.log(`   Newly created: ${created}`);
    console.log(`   Updated existing: ${updated}`);
    console.log(`   Total completed: ${completed}`);
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Get Firebase UID from command line
const firebaseUid = process.argv[2];

if (!firebaseUid) {
  console.error('Usage: npx tsx scripts/complete-all-lessons.ts <firebase_uid>');
  console.error('Example: npx tsx scripts/complete-all-lessons.ts REDACTED_ADMIN_UID');
  process.exit(1);
}

completeAllLessons(firebaseUid);
