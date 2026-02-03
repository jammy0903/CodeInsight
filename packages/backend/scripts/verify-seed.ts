/**
 * 테스트 데이터 검증 스크립트
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verifyData() {
  console.log('🔍 Verifying test data...\n');

  // 1. Admin/Test 유저 찾기
  const testUser = await prisma.user.findFirst({
    where: {
      OR: [
        { nickname: { contains: 'admin', mode: 'insensitive' } },
        { nickname: { contains: 'TestAdmin' } },
      ],
    },
  });

  if (!testUser) {
    console.log('❌ No test user found');
    return;
  }

  console.log(`✅ Found user: ${testUser.nickname} (${testUser.id})\n`);

  // 2. 퀴즈 시도 통계
  const attempts = await prisma.standaloneQuizAttempt.findMany({
    where: { userId: testUser.id },
    include: {
      quiz: {
        select: {
          chapterId: true,
          chapterTitle: true,
          concepts: true,
        },
      },
    },
  });

  console.log(`📊 Total attempts: ${attempts.length}\n`);

  // 3. 챕터별 통계
  const chapterStats: Record<string, { total: number; correct: number }> = {};

  attempts.forEach(attempt => {
    const chapterId = attempt.quiz.chapterId;
    if (!chapterStats[chapterId]) {
      chapterStats[chapterId] = { total: 0, correct: 0 };
    }
    chapterStats[chapterId].total++;
    if (attempt.isCorrect) {
      chapterStats[chapterId].correct++;
    }
  });

  console.log('📈 Chapter Statistics:');
  for (const [chapterId, stats] of Object.entries(chapterStats)) {
    const accuracy = Math.round((stats.correct / stats.total) * 100);
    const chapterTitle = attempts.find(a => a.quiz.chapterId === chapterId)?.quiz.chapterTitle || chapterId;
    console.log(`  ${chapterTitle}: ${stats.total}회 시도, ${stats.correct}회 정답, ${accuracy}% 정답률`);
  }

  // 4. 취약 개념 통계
  const conceptCount: Record<string, { wrong: number; total: number }> = {};

  attempts.forEach(attempt => {
    attempt.quiz.concepts.forEach(concept => {
      if (!conceptCount[concept]) {
        conceptCount[concept] = { wrong: 0, total: 0 };
      }
      conceptCount[concept].total++;
      if (!attempt.isCorrect) {
        conceptCount[concept].wrong++;
      }
    });
  });

  const weakConcepts = Object.entries(conceptCount)
    .map(([concept, stats]) => ({
      concept,
      errorRate: Math.round((stats.wrong / stats.total) * 100),
      wrong: stats.wrong,
      total: stats.total,
    }))
    .sort((a, b) => b.wrong - a.wrong)
    .slice(0, 5);

  console.log('\n🔴 Top 5 Weak Concepts:');
  weakConcepts.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.concept}: ${item.wrong}/${item.total}회 오답 (${item.errorRate}% 오답률)`);
  });

  console.log('\n✅ Verification complete!');
  console.log('\n💡 Next step: Open http://localhost:5174/report in browser to see the results');
}

async function main() {
  try {
    await verifyData();
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
