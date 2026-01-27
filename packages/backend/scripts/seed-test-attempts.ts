/**
 * 테스트용 퀴즈 시도 데이터 생성
 *
 * WHY: admin 계정으로 실제 사용자처럼 퀴즈 시도 기록 생성
 * - 취약 개념 분석 테스트용
 * - 리포트 페이지 동작 확인용
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedTestAttempts() {
  console.log('🌱 Starting test attempts seed...\n');

  // 1. admin 사용자 찾기 (nickname으로)
  const adminUser = await prisma.user.findFirst({
    where: {
      nickname: {
        contains: 'admin',
        mode: 'insensitive',
      },
    },
  });

  if (!adminUser) {
    console.log('❌ Admin user not found. Creating a test user...');

    // admin 유저가 없으면 테스트 유저 생성
    const testUser = await prisma.user.create({
      data: {
        nickname: 'TestAdmin',
      },
    });

    console.log('✅ Created test user:', testUser.nickname);
    await generateAttempts(testUser.id);
  } else {
    console.log('✅ Found user:', adminUser.nickname, `(${adminUser.id})`);
    await generateAttempts(adminUser.id);
  }

  console.log('\n🎉 Test attempts seed completed!');
}

async function generateAttempts(userId: string) {
  // 2. 모든 C 언어 OX 퀴즈 가져오기
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

  console.log(`\n📚 Found ${quizzes.length} C OX quizzes`);

  // 3. 각 챕터별로 다른 정답률 설정
  const chapterAccuracy: Record<string, number> = {
    'c-var': 0.8,   // 변수와 자료형: 80% 정답률 (쉬움)
    'c-ptr': 0.5,   // 포인터 기초: 50% 정답률 (취약!)
    'c-mem': 0.4,   // 동적 메모리: 40% 정답률 (매우 취약!)
  };

  let totalAttempts = 0;

  for (const quiz of quizzes) {
    const accuracy = chapterAccuracy[quiz.chapterId] || 0.7;

    // 각 퀴즈를 1-3번 시도 (랜덤)
    const attemptCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < attemptCount; i++) {
      // 정답률에 따라 정답 여부 결정
      const isCorrect = Math.random() < accuracy;

      // 랜덤 소요 시간 (5-30초)
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

  console.log(`\n✅ Created ${totalAttempts} test attempts`);

  // 4. 챕터별 통계 출력
  console.log('\n📊 Statistics by chapter:');

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

  // 5. 취약 개념 미리보기
  console.log('\n🔴 Top 5 weak concepts:');

  const attempts = await prisma.standaloneQuizAttempt.findMany({
    where: {
      userId,
      isCorrect: false,
    },
    include: {
      quiz: {
        select: {
          concepts: true,
        },
      },
    },
  });

  const conceptCount: Record<string, number> = {};
  attempts.forEach(attempt => {
    attempt.quiz.concepts.forEach(concept => {
      conceptCount[concept] = (conceptCount[concept] || 0) + 1;
    });
  });

  const sortedConcepts = Object.entries(conceptCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  sortedConcepts.forEach(([concept, count], index) => {
    console.log(`  ${index + 1}. ${concept}: ${count}회 오답`);
  });
}

async function main() {
  try {
    await seedTestAttempts();
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
