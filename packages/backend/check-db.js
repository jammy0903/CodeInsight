/**
 * DB 데이터 확인 스크립트
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const lang = process.argv[2] || 'python'; // 기본값 python

  const chapters = await prisma.chapter.findMany({
    where: { languageId: lang },
    orderBy: { order: 'asc' },
    include: {
      lessons: {
        orderBy: { order: 'asc' },
        include: { content: true }
      }
    }
  });

  console.log(`📚 ${lang.toUpperCase()} 레슨 목록:\n`);

  for (const chapter of chapters) {
    console.log(`\n[Ch${chapter.order}] ${chapter.title}`);
    for (const lesson of chapter.lessons) {
      const hasContent = lesson.content ? '✅' : '❌';
      console.log(`  ${hasContent} L${lesson.order}: ${lesson.title} (ID: ${lesson.id})`);
    }
  }

  await prisma.$disconnect();
}

check();
