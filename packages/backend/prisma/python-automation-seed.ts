/**
 * Python Automation LessonContent Seed Script
 * Python 자동화 레슨 콘텐츠 추가 (통일 형식)
 *
 * 실행: npx ts-node prisma/python-automation-seed.ts
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// Chapter 1: Python 자동화 기초
// =============================================

const ch1_automation_lesson1 = {
  id: 'p-8-1',
  lessonId: 'p-8-1',
  language: 'python',
  code: `# 첫 자동화 스크립트: Hello Automation!\n\nprint("Hello, Automation!")\n`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '자동화 스크립트 실행',
      explanation:
        '이것은 Python 자동화의 첫걸음입니다. 간단한 "Hello, Automation!" 메시지를 출력합니다.',
      visualizationType: 'python',
      pyNames: [],
      pyObjects: [],
      output: 'Hello, Automation!',
      analogy:
        "자동화는 컴퓨터에게 지루한 작업을 대신 시키는 마법과 같습니다. 첫 주문은 '인사하기'!",
    },
  ]),
};

// =============================================
// Seed 실행
// =============================================

async function seedPythonAutomationContent() {
  console.log('🐍 Seeding Python Automation LessonContent...\n');

  const contents = [
    // Chapter 1: Python 자동화 기초
    ch1_automation_lesson1,
  ];

  for (const content of contents) {
    // 기존 콘텐츠가 있으면 삭제
    await prisma.lessonContent.deleteMany({
      where: { lessonId: content.lessonId },
    });

    // 새 콘텐츠 생성
    await prisma.lessonContent.create({
      data: content,
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: content.lessonId },
    });

    console.log(`✅ ${lesson?.title || content.lessonId}`); // lesson?.title이 없을 경우 lessonId 출력
  }

  // 결과 확인
  const count = await prisma.lessonContent.count({
    where: { language: 'python', lessonId: { startsWith: 'p-8-' } }, // 'p-8-'로 시작하는 자동화 레슨만 카운트
  });
  console.log(`\n📊 Total Python Automation LessonContents: ${count}`);
}

seedPythonAutomationContent()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
