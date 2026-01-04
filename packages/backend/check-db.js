/**
 * DB 데이터 확인 스크립트
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const languages = await prisma.language.count();
  const chapters = await prisma.chapter.count();
  const lessons = await prisma.lesson.count();
  const contents = await prisma.lessonContent.count();
  const quizzes = await prisma.quiz.count();

  console.log('📊 DB Stats:');
  console.log(`  Languages: ${languages}`);
  console.log(`  Chapters: ${chapters}`);
  console.log(`  Lessons: ${lessons}`);
  console.log(`  LessonContents: ${contents}`);
  console.log(`  Quizzes: ${quizzes}`);

  if (languages > 0) {
    const cLang = await prisma.language.findUnique({ where: { id: 'c' } });
    console.log('\n✅ C language exists:', cLang?.name);

    const firstChapter = await prisma.chapter.findFirst({
      where: { languageId: 'c' },
      orderBy: { order: 'asc' }
    });
    console.log('✅ First chapter:', firstChapter?.title);

    const sampleLesson = await prisma.lesson.findFirst({
      where: { chapterId: firstChapter?.id },
      include: { content: true }
    });
    console.log('✅ Sample lesson:', sampleLesson?.title);
    console.log('   Has content?', !!sampleLesson?.content);
  }

  await prisma.$disconnect();
}

check();
