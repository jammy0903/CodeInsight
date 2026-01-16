#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, '../prisma/content');
const languages = ['c', 'java', 'javascript', 'python', 'python-practical'];

console.log('📚 CodeInsight Course Structure\n');
console.log('='.repeat(80));
console.log();

languages.forEach((lang) => {
  const curriculumPath = path.join(contentDir, lang, 'curriculum.json');

  if (!fs.existsSync(curriculumPath)) {
    console.log(`⚠️  ${lang}: curriculum.json not found`);
    return;
  }

  const curriculum = JSON.parse(fs.readFileSync(curriculumPath, 'utf-8'));

  // C는 language.name, 다른 언어는 title 사용
  const courseName = curriculum.language?.name || curriculum.title || lang.toUpperCase();
  const courseDesc = curriculum.language?.description || curriculum.description || '';

  console.log(`📖 ${courseName} (${lang})`);
  if (courseDesc) {
    console.log(`   ${courseDesc}`);
  }
  console.log();

  curriculum.chapters.forEach((chapter, chapterIdx) => {
    const isLastChapter = chapterIdx === curriculum.chapters.length - 1;
    const chapterPrefix = isLastChapter ? '└──' : '├──';
    const lessonPrefix = isLastChapter ? '   ' : '│  ';

    console.log(`${chapterPrefix} Chapter ${chapter.order}: ${chapter.title}`);
    console.log(`${lessonPrefix}    ${chapter.description}`);

    if (chapter.lessons && chapter.lessons.length > 0) {
      chapter.lessons.forEach((lesson, lessonIdx) => {
        const isLastLesson = lessonIdx === chapter.lessons.length - 1;
        const lessonSymbol = isLastLesson ? '└──' : '├──';

        // lesson이 객체인지 문자열인지 확인
        let lessonId, lessonOrder, lessonTitle;

        if (typeof lesson === 'string') {
          // Java/Python 형식: lesson ID만 있음
          lessonId = lesson;
          const lessonPath = path.join(contentDir, lang, 'lessons', `${lessonId}.json`);

          if (fs.existsSync(lessonPath)) {
            const lessonData = JSON.parse(fs.readFileSync(lessonPath, 'utf-8'));
            lessonOrder = lessonData.order || lessonIdx + 1;
            lessonTitle = lessonData.title || lessonId;
          } else {
            lessonOrder = lessonIdx + 1;
            lessonTitle = lessonId;
          }
        } else {
          // C 형식: lesson 객체에 title, order 포함
          lessonId = lesson.id;
          lessonOrder = lesson.order;
          lessonTitle = lesson.title;
        }

        // Lesson 파일 존재 확인
        const lessonPath = path.join(contentDir, lang, 'lessons', `${lessonId}.json`);
        const exists = fs.existsSync(lessonPath);
        const statusIcon = exists ? '✓' : '✗';

        console.log(`${lessonPrefix} ${lessonSymbol} ${statusIcon} Lesson ${lessonOrder}: ${lessonTitle}`);
      });
    }

    console.log();
  });

  console.log('─'.repeat(80));
  console.log();
});

console.log('\n✓ = Lesson file exists | ✗ = Lesson file missing');
