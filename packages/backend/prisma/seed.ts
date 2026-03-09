/**
 * Course Seed Script (UPSERT 방식 - 사용자 데이터 보존!)
 *
 * JSON 콘텐츠 파일에서 커리큘럼을 로드하여 DB에 upsert합니다.
 *
 * ⚠️ 중요: 사용자 데이터(UserProgress, User 등)는 절대 삭제되지 않습니다!
 *
 * 📌 실행 방법:
 *   npx prisma db seed
 *
 * 📌 백업/복원 스크립트:
 *   - 백업: npx ts-node prisma/backup-user-data.ts
 *   - 복원: npx ts-node prisma/restore-user-data.ts
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { expandDeltaSteps } from './utils/expandDeltaSteps';

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
  [key: string]: unknown;
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
    deltaFormat?: boolean;
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
// 유령 레슨 정리 (Soft-delete)
// =============================================

/**
 * curriculum에 없는 유령 레슨을 비활성화 (isActive: false)
 *
 * WHY: seed가 UPSERT만 사용하기 때문에, curriculum에서 제거된 레슨이
 * DB에 유령 데이터로 남아 사용자에게 노출됨.
 * Hard delete 불가: LessonActivity, StepActivity, UserNote가 onDelete: Restrict
 */
async function deactivateStaleLessons(languageId: string, validLessonIds: string[]) {
  // 해당 언어의 모든 챕터 ID 조회
  const chapters = await prisma.chapter.findMany({
    where: { languageId },
    select: { id: true },
  });
  const chapterIds = chapters.map(c => c.id);

  if (chapterIds.length === 0) return;

  // 현재 active인데 curriculum에 없는 레슨 찾기
  const staleLessons = await prisma.lesson.findMany({
    where: {
      chapterId: { in: chapterIds },
      isActive: true,
      id: { notIn: validLessonIds },
    },
    select: { id: true, title: true },
  });

  if (staleLessons.length > 0) {
    await prisma.lesson.updateMany({
      where: {
        id: { in: staleLessons.map(l => l.id) },
      },
      data: { isActive: false },
    });
    console.log(`    🧹 Deactivated ${staleLessons.length} stale lesson(s): ${staleLessons.map(l => l.id).join(', ')}`);
  }

  // curriculum에 복귀한 레슨 재활성화
  const reactivated = await prisma.lesson.updateMany({
    where: {
      id: { in: validLessonIds },
      isActive: false,
    },
    data: { isActive: true },
  });

  if (reactivated.count > 0) {
    console.log(`    ♻️  Reactivated ${reactivated.count} lesson(s)`);
  }
}

/**
 * curriculum에 없는 유령 챕터를 비활성화 (isActive: false)
 *
 * WHY: seed가 UPSERT만 사용하기 때문에, curriculum에서 제거된 챕터가
 * DB에 유령 데이터로 남아 빈 챕터가 사용자에게 노출됨.
 * (예: python-chapter-1 vs python-ch1)
 */
async function deactivateStaleChapters(languageId: string, validChapterIds: string[]) {
  const staleChapters = await prisma.chapter.findMany({
    where: {
      languageId,
      isActive: true,
      id: { notIn: validChapterIds },
    },
    select: { id: true, title: true },
  });

  if (staleChapters.length > 0) {
    await prisma.chapter.updateMany({
      where: {
        id: { in: staleChapters.map(c => c.id) },
      },
      data: { isActive: false },
    });
    console.log(`    🧹 Deactivated ${staleChapters.length} stale chapter(s): ${staleChapters.map(c => c.id).join(', ')}`);
  }

  // curriculum에 복귀한 챕터 재활성화
  const reactivated = await prisma.chapter.updateMany({
    where: {
      id: { in: validChapterIds },
      isActive: false,
    },
    data: { isActive: true },
  });

  if (reactivated.count > 0) {
    console.log(`    ♻️  Reactivated ${reactivated.count} chapter(s)`);
  }
}

// =============================================
// Seed 함수
// =============================================

async function seed() {
  console.log('🌱 Seeding database...');

  // ========================================
  // 🔒 사용자 데이터 절대 보존! (UPSERT 방식)
  // ========================================
  // ⚠️ 사용자 관련 테이블은 절대 삭제하지 않음:
  // - User, UserProfile, UserStreak, UserNote
  // - UserProgress (학습 진행상황) ← 가장 중요!
  // - QuizAttempt, LessonActivity, StepActivity, SessionContext
  // - ChatHistory
  //
  // 컨텐츠는 upsert로 업데이트 (있으면 수정, 없으면 생성)
  console.log('  🔒 Using UPSERT mode (USER DATA PRESERVED)...');

  // 2. Languages upsert (있으면 업데이트, 없으면 생성)
  console.log('  📝 Upserting Languages...');

  await prisma.language.upsert({
    where: { id: 'c' },
    update: { name: 'C', description: '포인터와 메모리를 직접 다루는 시스템 프로그래밍 언어', icon: 'C', color: '#00599C', order: 1 },
    create: { id: 'c', name: 'C', description: '포인터와 메모리를 직접 다루는 시스템 프로그래밍 언어', icon: 'C', color: '#00599C', order: 1 },
  });
  console.log('    ✅ C');

  await prisma.language.upsert({
    where: { id: 'cpp' },
    update: { name: 'C++', description: 'C 기반에 객체지향과 제네릭을 더한 고성능 시스템 프로그래밍 언어', icon: 'C++', color: '#6366F1', order: 2 },
    create: { id: 'cpp', name: 'C++', description: 'C 기반에 객체지향과 제네릭을 더한 고성능 시스템 프로그래밍 언어', icon: 'C++', color: '#6366F1', order: 2 },
  });
  console.log('    ✅ C++');

  await prisma.language.upsert({
    where: { id: 'python' },
    update: { name: 'Python', description: '간결하고 읽기 쉬운 문법의 고급 프로그래밍 언어', icon: '🐍', color: '#3776AB', order: 3 },
    create: { id: 'python', name: 'Python', description: '간결하고 읽기 쉬운 문법의 고급 프로그래밍 언어', icon: '🐍', color: '#3776AB', order: 3 },
  });
  console.log('    ✅ Python');

  await prisma.language.upsert({
    where: { id: 'java' },
    update: { name: 'Java', description: '객체지향 프로그래밍과 JVM 기반 언어', icon: '☕', color: '#007396', order: 4 },
    create: { id: 'java', name: 'Java', description: '객체지향 프로그래밍과 JVM 기반 언어', icon: '☕', color: '#007396', order: 4 },
  });
  console.log('    ✅ Java');

  await prisma.language.upsert({
    where: { id: 'javascript' },
    update: { name: 'JavaScript', description: '웹 개발의 핵심 언어, 비동기와 프로토타입', icon: '⚡', color: '#F7DF1E', order: 5 },
    create: { id: 'javascript', name: 'JavaScript', description: '웹 개발의 핵심 언어, 비동기와 프로토타입', icon: '⚡', color: '#F7DF1E', order: 5 },
  });
  console.log('    ✅ JavaScript');

  await prisma.language.upsert({
    where: { id: 'python-practical' },
    update: { name: 'Python (업무 자동화)', description: '급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화 & 데이터 분석', icon: '🚀', color: '#FFA500', isSequential: false, order: 6 },
    create: { id: 'python-practical', name: 'Python (업무 자동화)', description: '급하게 배우는 파이썬 - 엑셀/PDF/PPT 자동화 & 데이터 분석', icon: '🚀', color: '#FFA500', isSequential: false, order: 6 },
  });
  console.log('    ✅ Python (업무 자동화)');

  await prisma.language.upsert({
    where: { id: 'ai-literacy' },
    update: { name: 'AI Code Literacy', description: 'AI가 작성한 코드를 이해하고 검증하고 수정하는 실전 트랙', icon: '🛡️', color: '#0EA5E9', isSequential: false, order: 7 },
    create: { id: 'ai-literacy', name: 'AI Code Literacy', description: 'AI가 작성한 코드를 이해하고 검증하고 수정하는 실전 트랙', icon: '🛡️', color: '#0EA5E9', isSequential: false, order: 7 },
  });
  console.log('    ✅ AI Code Literacy');

  // 3. C 커리큘럼 로드 및 생성
  console.log('  📚 Loading C curriculum from JSON...');
  const cCurriculum = loadCurriculum('c');

  if (cCurriculum) {
    let contentCount = 0;
    let quizCount = 0;
    const cValidLessonIds: string[] = [];
    const cValidChapterIds: string[] = [];

    for (const chapterData of cCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      cValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'c',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        part: chapterData.part,
        partLabel: chapterData.partLabel,
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      // 각 챕터의 레슨 upsert
      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

        console.log(`      ├─ Lesson ${lessonData.order}: ${lessonData.title}`);

        const lessonPayload = {
          chapterId: chapter.id,
          title: lessonData.title,
          description: lessonData.description,
          difficulty: lessonData.difficulty,
          order: lessonData.order,
          estimatedTime: lessonData.estimatedTime,
        };
        const lesson = await prisma.lesson.upsert({
          where: { id: lessonData.id },
          update: lessonPayload,
          create: { id: lessonData.id, ...lessonPayload },
        });
        cValidLessonIds.push(lessonData.id);

        // 레슨 콘텐츠 upsert
        const content = loadLessonContent('c', lessonData.id);
        if (content) {
          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'c',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonData.id}` },
            update: contentPayload,
            create: { id: `content-${lessonData.id}`, ...contentPayload },
          });
          contentCount++;

          // 퀴즈 upsert
          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonData.id}` },
              update: quizPayload,
              create: { id: `quiz-${lessonData.id}`, ...quizPayload },
            });
            quizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${contentCount} lesson contents`);
    console.log(`    ❓ Loaded ${quizCount} quizzes`);
    await deactivateStaleLessons('c', cValidLessonIds);
    await deactivateStaleChapters('c', cValidChapterIds);
  }

  // 4. C++ 커리큘럼 로드 및 생성
  console.log('  📚 Loading C++ curriculum from JSON...');
  const cppCurriculum = loadCurriculum('cpp');

  if (cppCurriculum) {
    let cppContentCount = 0;
    let cppQuizCount = 0;
    const cppValidLessonIds: string[] = [];
    const cppValidChapterIds: string[] = [];

    for (const chapterData of cppCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      cppValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'cpp',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        part: chapterData.part,
        partLabel: chapterData.partLabel,
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

        console.log(`      ├─ Lesson ${lessonData.order}: ${lessonData.title}`);

        const lessonPayload = {
          chapterId: chapter.id,
          title: lessonData.title,
          description: lessonData.description,
          difficulty: lessonData.difficulty,
          order: lessonData.order,
          estimatedTime: lessonData.estimatedTime,
        };
        const lesson = await prisma.lesson.upsert({
          where: { id: lessonData.id },
          update: lessonPayload,
          create: { id: lessonData.id, ...lessonPayload },
        });
        cppValidLessonIds.push(lessonData.id);

        const content = loadLessonContent('cpp', lessonData.id);
        if (content) {
          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'cpp',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonData.id}` },
            update: contentPayload,
            create: { id: `content-${lessonData.id}`, ...contentPayload },
          });
          cppContentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonData.id}` },
              update: quizPayload,
              create: { id: `quiz-${lessonData.id}`, ...quizPayload },
            });
            cppQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${cppContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${cppQuizCount} quizzes`);
    await deactivateStaleLessons('cpp', cppValidLessonIds);
    await deactivateStaleChapters('cpp', cppValidChapterIds);
  }

  // 5. JavaScript 커리큘럼 upsert
  console.log('  📚 Loading JavaScript curriculum from JSON...');
  const jsCurriculum = loadCurriculum('javascript');

  if (jsCurriculum) {
    let jsContentCount = 0;
    let jsQuizCount = 0;
    const jsValidLessonIds: string[] = [];
    const jsValidChapterIds: string[] = [];

    for (const chapterData of jsCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      jsValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'javascript',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion || '',
        part: 'basics',
        partLabel: '기초',
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonId = getLessonId(chapterData.lessons[lessonIdx]);
        const content = loadLessonContent('javascript', lessonId);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lessonPayload = {
            chapterId: chapter.id,
            title: content.title,
            description: content.concept,
            difficulty: 'basic',
            order: lessonIdx + 1,
            estimatedTime: 10,
          };
          const lesson = await prisma.lesson.upsert({
            where: { id: lessonId },
            update: lessonPayload,
            create: { id: lessonId, ...lessonPayload },
          });
          jsValidLessonIds.push(lessonId);

          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'javascript',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonId}` },
            update: contentPayload,
            create: { id: `content-${lessonId}`, ...contentPayload },
          });
          jsContentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonId}` },
              update: quizPayload,
              create: { id: `quiz-${lessonId}`, ...quizPayload },
            });
            jsQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${jsContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${jsQuizCount} quizzes`);
    await deactivateStaleLessons('javascript', jsValidLessonIds);
    await deactivateStaleChapters('javascript', jsValidChapterIds);
  }

  // 6. Java 커리큘럼 upsert
  console.log('  📚 Loading Java curriculum from JSON...');
  const javaCurriculum = loadCurriculum('java');

  if (javaCurriculum) {
    let javaContentCount = 0;
    let javaQuizCount = 0;
    const javaValidLessonIds: string[] = [];
    const javaValidChapterIds: string[] = [];

    for (const chapterData of javaCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      javaValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'java',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion || '',
        part: 'basics',
        partLabel: '기초',
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonId = getLessonId(chapterData.lessons[lessonIdx]);
        const content = loadLessonContent('java', lessonId);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lessonPayload = {
            chapterId: chapter.id,
            title: content.title,
            description: content.concept,
            difficulty: 'basic',
            order: lessonIdx + 1,
            estimatedTime: 10,
          };
          const lesson = await prisma.lesson.upsert({
            where: { id: lessonId },
            update: lessonPayload,
            create: { id: lessonId, ...lessonPayload },
          });
          javaValidLessonIds.push(lessonId);

          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'java',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonId}` },
            update: contentPayload,
            create: { id: `content-${lessonId}`, ...contentPayload },
          });
          javaContentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonId}` },
              update: quizPayload,
              create: { id: `quiz-${lessonId}`, ...quizPayload },
            });
            javaQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${javaContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${javaQuizCount} quizzes`);
    await deactivateStaleLessons('java', javaValidLessonIds);
    await deactivateStaleChapters('java', javaValidChapterIds);
  }

  // 7. Python (기초) 커리큘럼 upsert
  console.log('  📚 Loading Python curriculum from JSON...');
  const pythonCurriculum = loadCurriculum('python');

  if (pythonCurriculum) {
    let pythonContentCount = 0;
    let pythonQuizCount = 0;
    const pythonValidLessonIds: string[] = [];
    const pythonValidChapterIds: string[] = [];

    for (const chapterData of pythonCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      pythonValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'python',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion || '',
        part: 'basics',
        partLabel: '기초',
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonId = getLessonId(chapterData.lessons[lessonIdx]);
        const content = loadLessonContent('python', lessonId);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lessonPayload = {
            chapterId: chapter.id,
            title: content.title,
            description: content.concept,
            difficulty: 'basic',
            order: lessonIdx + 1,
            estimatedTime: 10,
          };
          const lesson = await prisma.lesson.upsert({
            where: { id: lessonId },
            update: lessonPayload,
            create: { id: lessonId, ...lessonPayload },
          });
          pythonValidLessonIds.push(lessonId);

          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'python',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonId}` },
            update: contentPayload,
            create: { id: `content-${lessonId}`, ...contentPayload },
          });
          pythonContentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonId}` },
              update: quizPayload,
              create: { id: `quiz-${lessonId}`, ...quizPayload },
            });
            pythonQuizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${pythonContentCount} lesson contents`);
    console.log(`    ❓ Loaded ${pythonQuizCount} quizzes`);
    await deactivateStaleLessons('python', pythonValidLessonIds);
    await deactivateStaleChapters('python', pythonValidChapterIds);
  }

  // 8. Python (업무 자동화) 커리큘럼 upsert
  console.log('  📚 Loading Python (업무 자동화) curriculum from JSON...');
  const pythonPracticalCurriculum = loadCurriculum('python-practical');

  if (pythonPracticalCurriculum) {
    let contentCount = 0;
    let quizCount = 0;
    const ppValidLessonIds: string[] = [];
    const ppValidChapterIds: string[] = [];

    for (const chapterData of pythonPracticalCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      ppValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'python-practical',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion || '',
        part: 'automation',
        partLabel: '업무 자동화',
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

        const content = loadLessonContent('python-practical', lessonData.id);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lessonPayload = {
            chapterId: chapter.id,
            title: content.title,
            description: content.concept,
            difficulty: 'basic',
            order: lessonIdx + 1,
            estimatedTime: 10,
          };
          const lesson = await prisma.lesson.upsert({
            where: { id: lessonData.id },
            update: lessonPayload,
            create: { id: lessonData.id, ...lessonPayload },
          });
          ppValidLessonIds.push(lessonData.id);

          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'python-practical',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonData.id}` },
            update: contentPayload,
            create: { id: `content-${lessonData.id}`, ...contentPayload },
          });
          contentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonData.id}` },
              update: quizPayload,
              create: { id: `quiz-${lessonData.id}`, ...quizPayload },
            });
            quizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${contentCount} lesson contents`);
    console.log(`    ❓ Loaded ${quizCount} quizzes`);
    await deactivateStaleLessons('python-practical', ppValidLessonIds);
    await deactivateStaleChapters('python-practical', ppValidChapterIds);
  }

  // 9. AI Code Literacy 커리큘럼 upsert
  console.log('  📚 Loading AI Code Literacy curriculum from JSON...');
  const aiLiteracyCurriculum = loadCurriculum('ai-literacy');

  if (aiLiteracyCurriculum) {
    let contentCount = 0;
    let quizCount = 0;
    const aiValidLessonIds: string[] = [];
    const aiValidChapterIds: string[] = [];

    for (const chapterData of aiLiteracyCurriculum.chapters) {
      console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

      const chapterId = getChapterId(chapterData);
      aiValidChapterIds.push(chapterId);
      const chapterPayload = {
        languageId: 'ai-literacy',
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion || '',
        part: chapterData.part || 'verification',
        partLabel: chapterData.partLabel || 'AI 검증',
        order: chapterData.order,
      };
      const chapter = await prisma.chapter.upsert({
        where: { id: chapterId },
        update: chapterPayload,
        create: { id: chapterId, ...chapterPayload },
      });

      for (let lessonIdx = 0; lessonIdx < chapterData.lessons.length; lessonIdx++) {
        const lessonItem = chapterData.lessons[lessonIdx];
        const lessonData = typeof lessonItem === 'string' ? null : lessonItem;
        if (!lessonData) continue;

        const content = loadLessonContent('ai-literacy', lessonData.id);
        if (content) {
          console.log(`      ├─ Lesson: ${content.title}`);

          const lessonPayload = {
            chapterId: chapter.id,
            title: content.title,
            description: content.concept,
            difficulty: lessonData.difficulty || 'basic',
            order: lessonData.order || lessonIdx + 1,
            estimatedTime: lessonData.estimatedTime || 10,
          };
          const lesson = await prisma.lesson.upsert({
            where: { id: lessonData.id },
            update: lessonPayload,
            create: { id: lessonData.id, ...lessonPayload },
          });
          aiValidLessonIds.push(lessonData.id);

          const contentPayload = {
            lessonId: lesson.id,
            code: content.content.code,
            language: 'ai-literacy',
            steps: JSON.stringify(expandDeltaSteps(content.content.steps, content.content.deltaFormat === true)),
          };
          await prisma.lessonContent.upsert({
            where: { id: `content-${lessonData.id}` },
            update: contentPayload,
            create: { id: `content-${lessonData.id}`, ...contentPayload },
          });
          contentCount++;

          if (content.quiz) {
            const quizPayload = {
              lessonId: lesson.id,
              type: 'multiple_choice',
              question: content.quiz.question,
              options: content.quiz.options,
              answer: String(content.quiz.correctIndex),
              explanation: content.quiz.explanation,
              order: 1,
            };
            await prisma.quiz.upsert({
              where: { id: `quiz-${lessonData.id}` },
              update: quizPayload,
              create: { id: `quiz-${lessonData.id}`, ...quizPayload },
            });
            quizCount++;
          }
        }
      }
    }

    console.log(`    📄 Loaded ${contentCount} lesson contents`);
    console.log(`    ❓ Loaded ${quizCount} quizzes`);
    await deactivateStaleLessons('ai-literacy', aiValidLessonIds);
    await deactivateStaleChapters('ai-literacy', aiValidChapterIds);
  }

  // 10. 결과 확인
  const stats = {
    languages: await prisma.language.count(),
    chapters: await prisma.chapter.count(),
    activeLessons: await prisma.lesson.count({ where: { isActive: true } }),
    inactiveLessons: await prisma.lesson.count({ where: { isActive: false } }),
    contents: await prisma.lessonContent.count(),
    quizzes: await prisma.quiz.count(),
  };

  console.log('\n✅ Seeding complete!');
  console.log('  📊 Stats:');
  console.log(`     - Languages: ${stats.languages}`);
  console.log(`     - Chapters: ${stats.chapters}`);
  console.log(`     - Lessons: ${stats.activeLessons} active, ${stats.inactiveLessons} inactive`);
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
