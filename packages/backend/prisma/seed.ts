/**
 * Course Seed Script
 *
 * 연구 기반 C언어 6개 챕터 × 30개 레슨 시드 데이터
 * JSON 콘텐츠 파일에서 로드
 *
 * 실행: npx prisma db seed
 */

import { PrismaClient } from '.prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Create better-sqlite3 client for local SQLite file
const dbPath = path.resolve(__dirname, 'dev.db');
console.log('📁 Database path:', dbPath);
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter: adapterFactory });

// =============================================
// JSON 로더
// =============================================

interface CurriculumLesson {
  id: string;
  order: number;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

interface CurriculumChapter {
  id: string;
  order: number;
  title: string;
  description: string;
  keyQuestion: string;
  misconceptions?: string[];
  lessons: CurriculumLesson[];
}

interface CurriculumLanguage {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface Curriculum {
  language: CurriculumLanguage;
  chapters: CurriculumChapter[];
}

interface LessonContentStep {
  line: number;
  title: string;
  explanation: string;
  highlight?: number[];
  memoryChanges?: object[];
}

interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LessonContentData {
  lessonId: string;
  title: string;
  concept: string;
  content: {
    code: string;
    steps: LessonContentStep[];
  };
  quiz: LessonQuiz;
  misconceptions?: object[];
  keyTakeaway: string;
}

function loadCurriculum(langId: string): Curriculum | null {
  const curriculumPath = path.join(
    __dirname,
    'content',
    langId,
    'curriculum.json'
  );

  if (!fs.existsSync(curriculumPath)) {
    console.log(`  ⚠️  ${langId} curriculum not found`);
    return null;
  }

  const data = fs.readFileSync(curriculumPath, 'utf-8');
  return JSON.parse(data) as Curriculum;
}

function loadLessonContent(langId: string, lessonId: string): LessonContentData | null {
  const lessonPath = path.join(
    __dirname,
    'content',
    langId,
    'lessons',
    `${lessonId}.json`
  );

  if (!fs.existsSync(lessonPath)) {
    return null;
  }

  const data = fs.readFileSync(lessonPath, 'utf-8');
  return JSON.parse(data) as LessonContentData;
}

// =============================================
// Seed 함수
// =============================================

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. 기존 데이터 삭제 (개발용)
  console.log('  🗑️  Cleaning existing data...');
  await prisma.userProgress.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.lessonContent.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.chapter.deleteMany();
  await prisma.language.deleteMany();

  // 2. Languages 생성
  console.log('  📝 Creating Languages...');

  await prisma.language.create({
    data: {
      id: 'c',
      name: 'C',
      description: '포인터와 메모리를 직접 다루는 시스템 프로그래밍 언어',
      icon: 'C',
      color: '#00599C',
      order: 1,
    },
  });
  console.log('    ✅ C');

  await prisma.language.create({
    data: {
      id: 'python',
      name: 'Python',
      description: '간결하고 읽기 쉬운 문법의 고급 프로그래밍 언어',
      icon: '🐍',
      color: '#3776AB',
      order: 2,
    },
  });
  console.log('    ✅ Python');

  await prisma.language.create({
    data: {
      id: 'java',
      name: 'Java',
      description: '객체지향 프로그래밍과 JVM 기반 언어',
      icon: '☕',
      color: '#007396',
      order: 3,
    },
  });
  console.log('    ✅ Java');

  await prisma.language.create({
    data: {
      id: 'javascript',
      name: 'JavaScript',
      description: '웹 개발의 핵심 언어, 비동기와 프로토타입',
      icon: '⚡',
      color: '#F7DF1E',
      order: 4,
    },
  });
  console.log('    ✅ JavaScript');

  // 3. C 커리큘럼 로드 및 생성
  console.log('  📚 Loading C curriculum from JSON...');
  const cCurriculum = loadCurriculum('c');

  if (cCurriculum) {
    let contentCount = 0;
    let quizCount = 0;

    for (const chapterData of cCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapter = await prisma.chapter.create({
        data: {
          id: chapterData.id,
          languageId: 'c',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion,
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (const lessonData of chapterData.lessons) {
        console.log(`      ├─ Lesson ${lessonData.order}: ${lessonData.title}`);

        const lesson = await prisma.lesson.create({
          data: {
            id: lessonData.id,
            chapterId: chapter.id,
            title: lessonData.title,
            description: lessonData.description,
            difficulty: lessonData.difficulty,
            order: lessonData.order,
            estimatedTime: lessonData.estimatedTime,
          },
        });

        // 레슨 콘텐츠 로드
        const content = loadLessonContent('c', lessonData.id);
        if (content) {
          await prisma.lessonContent.create({
            data: {
              id: `content-${lessonData.id}`,
              lessonId: lesson.id,
              code: content.content.code,
              language: 'c',
              steps: JSON.stringify(content.content.steps),
            },
          });
          contentCount++;

          // 퀴즈 생성
          if (content.quiz) {
            await prisma.quiz.create({
              data: {
                id: `quiz-${lessonData.id}`,
                lessonId: lesson.id,
                type: 'multiple_choice',
                question: content.quiz.question,
                options: JSON.stringify(content.quiz.options),
                answer: String(content.quiz.correctIndex),
                explanation: content.quiz.explanation,
                order: 1,
              },
            });
            quizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${contentCount} lesson contents`);
    console.log(`    ❓ Loaded ${quizCount} quizzes`);
  }

  // 4. 결과 확인
  const stats = {
    languages: await prisma.language.count(),
    chapters: await prisma.chapter.count(),
    lessons: await prisma.lesson.count(),
    contents: await prisma.lessonContent.count(),
    quizzes: await prisma.quiz.count(),
  };

  console.log('\n✅ Seeding complete!');
  console.log('  📊 Stats:');
  console.log(`     - Languages: ${stats.languages}`);
  console.log(`     - Chapters: ${stats.chapters}`);
  console.log(`     - Lessons: ${stats.lessons}`);
  console.log(`     - Contents: ${stats.contents}`);
  console.log(`     - Quizzes: ${stats.quizzes}`);
}

// 실행
seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
