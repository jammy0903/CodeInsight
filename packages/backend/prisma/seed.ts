/**
 * Course Seed Script
 *
 * 연구 기반 C언어 6개 챕터 × 30개 레슨 시드 데이터
 * JSON 콘텐츠 파일에서 로드
 *
 * 실행: npx prisma db seed
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
  id?: string;
  chapterId?: string;  // Java/Python 형식 지원
  order: number;
  title: string;
  description: string;
  keyQuestion?: string;
  part?: 'syntax' | 'design' | string;
  partLabel?: string;
  misconceptions?: string[];
  lessons: (CurriculumLesson | string)[];  // 객체 배열 또는 문자열 배열 모두 지원
}

// 챕터 ID를 추출하는 헬퍼 함수
function getChapterId(chapter: CurriculumChapter): string {
  return chapter.id || chapter.chapterId || `ch-${chapter.order}`;
}

// 레슨 ID를 추출하는 헬퍼 함수
function getLessonId(lesson: CurriculumLesson | string): string {
  return typeof lesson === 'string' ? lesson : lesson.id;
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

  await prisma.language.create({
    data: {
      id: 'python-practical',
      name: 'Python (업무 자동화)',
      description: '급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화 & 데이터 분석',
      icon: '🚀',
      color: '#FFA500',
      isSequential: false, // 모든 챕터 즉시 열림
      order: 5,
    },
  });
  console.log('    ✅ Python (업무 자동화)');

  // 3. C 커리큘럼 로드 및 생성
  console.log('  📚 Loading C curriculum from JSON...');
  const cCurriculum = loadCurriculum('c');

  if (cCurriculum) {
    let contentCount = 0;
    let quizCount = 0;

    for (const chapterData of cCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          languageId: 'c',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion,
          part: chapterData.part,
          partLabel: chapterData.partLabel,
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        // C 커리큘럼은 객체 배열 형식 사용
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

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
                options: content.quiz.options, // Prisma Json 타입은 배열을 직접 저장
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

  // 4. JavaScript 커리큘럼 로드
  console.log('  📚 Loading JavaScript curriculum from JSON...');
  const jsCurriculum = loadCurriculum('javascript');

  if (jsCurriculum) {
    let contentCount = 0;
    let quizCount = 0;

    for (const chapterData of jsCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          languageId: 'javascript',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion,
          part: chapterData.part,
          partLabel: chapterData.partLabel,
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        // JavaScript 커리큘럼은 객체 배열 형식 사용
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

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
        const content = loadLessonContent('javascript', lessonData.id);
        if (content) {
          await prisma.lessonContent.create({
            data: {
              id: `content-${lessonData.id}`,
              lessonId: lesson.id,
              code: content.content.code,
              language: 'javascript',
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
                options: content.quiz.options,
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

  // 5. Java 커리큘럼 로드
  console.log('  📚 Loading Java curriculum from JSON...');
  const javaCurriculum = loadCurriculum('java');

  if (javaCurriculum) {
    let javaContentCount = 0;
    let javaQuizCount = 0;

    for (const chapterData of javaCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          languageId: 'java',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion || '',
          part: 'basics',
          partLabel: '기초',
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonId = getLessonId(chapterData.lessons[lessonIdx]);
        const content = loadLessonContent('java', lessonId);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lesson = await prisma.lesson.create({
            data: {
              id: lessonId,
              chapterId: chapter.id,
              title: content.title,
              description: content.concept,
              difficulty: 'basic',
              order: lessonIdx + 1,
              estimatedTime: 10,
            },
          });

          await prisma.lessonContent.create({
            data: {
              id: `content-${lessonId}`,
              lessonId: lesson.id,
              code: content.content.code,
              language: 'java',
              steps: JSON.stringify(content.content.steps),
            },
          });
          javaContentCount++;

          // 퀴즈 생성
          if (content.quiz) {
            await prisma.quiz.create({
              data: {
                id: `quiz-${lessonId}`,
                lessonId: lesson.id,
                type: 'multiple_choice',
                question: content.quiz.question,
                options: content.quiz.options,
                answer: String(content.quiz.correctIndex),
                explanation: content.quiz.explanation,
                order: 1,
              },
            });
            javaQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${javaContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${javaQuizCount} quizzes`);
  }

  // 6. Python (기초) 커리큘럼 로드
  console.log('  📚 Loading Python curriculum from JSON...');
  const pythonCurriculum = loadCurriculum('python');

  if (pythonCurriculum) {
    let pythonContentCount = 0;
    let pythonQuizCount = 0;

    for (const chapterData of pythonCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          languageId: 'python',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion || '',
          part: 'basics',
          partLabel: '기초',
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonId = getLessonId(chapterData.lessons[lessonIdx]);
        const content = loadLessonContent('python', lessonId);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lesson = await prisma.lesson.create({
            data: {
              id: lessonId,
              chapterId: chapter.id,
              title: content.title,
              description: content.concept,
              difficulty: 'basic',
              order: lessonIdx + 1,
              estimatedTime: 10,
            },
          });

          await prisma.lessonContent.create({
            data: {
              id: `content-${lessonId}`,
              lessonId: lesson.id,
              code: content.content.code,
              language: 'python',
              steps: JSON.stringify(content.content.steps),
            },
          });
          pythonContentCount++;

          // 퀴즈 생성
          if (content.quiz) {
            await prisma.quiz.create({
              data: {
                id: `quiz-${lessonId}`,
                lessonId: lesson.id,
                type: 'multiple_choice',
                question: content.quiz.question,
                options: content.quiz.options,
                answer: String(content.quiz.correctIndex),
                explanation: content.quiz.explanation,
                order: 1,
              },
            });
            pythonQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${pythonContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${pythonQuizCount} quizzes`);
  }

  // 7. Python 실무 코스 커리큘럼 로드
  console.log('  📚 Loading Python (업무 자동화) curriculum from JSON...');
  const pythonPracticalCurriculum = loadCurriculum('python-practical');

  if (pythonPracticalCurriculum) {
    let contentCount = 0;
    let quizCount = 0;

    for (const chapterData of pythonPracticalCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      const chapter = await prisma.chapter.create({
        data: {
          id: chapterId,
          languageId: 'python-practical',
          title: chapterData.title,
          description: chapterData.description,
          keyQuestion: chapterData.keyQuestion,
          part: chapterData.part,
          partLabel: chapterData.partLabel,
          order: chapterData.order,
        },
      });

      // 각 챕터의 레슨 생성
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        // python-practical은 객체 배열 형식 사용
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

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
        const content = loadLessonContent('python-practical', lessonData.id);
        if (content) {
          await prisma.lessonContent.create({
            data: {
              id: `content-${lessonData.id}`,
              lessonId: lesson.id,
              code: content.content.code,
              language: 'python',
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
                options: content.quiz.options,
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

  // 6. 결과 확인
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
    await pool.end();
  });
