/**
 * 특정 사용자에게 테스트 데이터 추가
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedForUser(userId: string, userName: string) {
  console.log(`🌱 Adding test data for user: ${userName} (${userId})\n`);

  // 모든 C 언어 OX 퀴즈 가져오기
  const quizzes = await prisma.standaloneQuiz.findMany({
    where: {
      language: 'c',
      quizType: 'ox',
      isActive: true,
    },
    orderBy: [
      { chapterId: 'asc' },
      { orderNum: 'asc' },
    ],
  });

  console.log(`📚 Found ${quizzes.length} C OX quizzes\n`);

  // 챕터별 정답률 설정
  const chapterAccuracy: Record<string, number> = {
    'c-var': 0.8,   // 변수와 자료형: 80% 정답률
    'c-ptr': 0.5,   // 포인터 기초: 50% 정답률 (취약!)
    'c-mem': 0.4,   // 동적 메모리: 40% 정답률 (매우 취약!)
  };

  let totalAttempts = 0;

  for (const quiz of quizzes) {
    const accuracy = chapterAccuracy[quiz.chapterId] || 0.7;

    // 각 퀴즈를 1-3번 시도 (랜덤)
    const attemptCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < attemptCount; i++) {
      const isCorrect = Math.random() < accuracy;
      const timeSpent = Math.floor(Math.random() * 25000) + 5000;

      // 랜덤 시간 (최근 30일 내)
      const daysAgo = Math.floor(Math.random() * 30);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      await prisma.standaloneQuizAttempt.create({
        data: {
          userId,
          quizId: quiz.id,
          userAnswer: isCorrect ? quiz.answer : (quiz.answer === 'true' ? 'false' : 'true'),
          isCorrect,
          timeSpent,
          attemptNumber: i + 1,
          createdAt,
        },
      });

      totalAttempts++;
    }
  }

  console.log(`✅ Created ${totalAttempts} test attempts for ${userName}\n`);

  // 챕터별 통계 출력
  console.log('📊 Statistics by chapter:');

  for (const chapterId of Object.keys(chapterAccuracy)) {
    const chapterQuizzes = quizzes.filter(q => q.chapterId === chapterId);
    const chapterTitle = chapterQuizzes[0]?.chapterTitle || chapterId;

    const attempts = await prisma.standaloneQuizAttempt.findMany({
      where: {
        userId,
        quiz: {
          chapterId,
        },
      },
    });

    const correctCount = attempts.filter(a => a.isCorrect).length;
    const accuracy = attempts.length > 0
      ? Math.round((correctCount / attempts.length) * 100)
      : 0;

    console.log(`  ${chapterTitle}: ${attempts.length}회 시도, ${correctCount}회 정답, ${accuracy}% 정답률`);
  }

  console.log('\n🎉 Test data added successfully!');
  console.log(`💡 Now login as "${userName}" and visit http://localhost:5174/report`);
}

async function main() {
  try {
    // 모든 유저에게 데이터 추가 (TestAdmin 제외)
    const users = await prisma.user.findMany({
      where: {
        nickname: {
          not: 'TestAdmin',
        },
      },
    });

    console.log(`Found ${users.length} users (excluding TestAdmin)\n`);

    for (const user of users) {
      // 이미 데이터가 있는지 확인
      const existingAttempts = await prisma.standaloneQuizAttempt.count({
        where: { userId: user.id },
      });

      if (existingAttempts > 0) {
        console.log(`⏭️  Skipping ${user.nickname} (already has ${existingAttempts} attempts)\n`);
        continue;
      }

      await seedForUser(user.id, user.nickname);
      console.log('\n---\n');
    }

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
