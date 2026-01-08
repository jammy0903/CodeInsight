/**
 * Lesson Template Generator (All Languages)
 *
 * DB의 모든 Lesson을 읽어서 JSON 템플릿 자동 생성
 *
 * 실행:
 * cd packages/backend
 * npx ts-node scripts/generate-lesson-templates.ts
 *
 * 생성 결과:
 * - data/lessons/*.json (C, Python, Java, JavaScript 모든 레슨)
 * - CURRICULUM에 콘텐츠가 있으면 자동 추출
 * - 없으면 빈 템플릿 (TODO)
 */

import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LessonTemplate {
  lessonId: string;
  code: string;
  steps: Array<{
    line: number;
    explanation: string;
    misconception?: string;
    memoryState: {
      stack: Array<{
        name: string;
        value: string | number;
        address: string;
        type?: string;
      }>;
    };
  }>;
  quizzes: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
  }>;
}

// CURRICULUM.md에서 Lesson 추출
interface ParsedLesson {
  number: number;
  title: string;
  code: string;
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
  };
  misconception?: string;
}

async function parseCurriculum(): Promise<ParsedLesson[]> {
  const curriculumPath = path.join(
    __dirname,
    '../../../docs/reference/CURRICULUM.md'
  );
  const content = await fs.readFile(curriculumPath, 'utf-8');

  const lessons: ParsedLesson[] = [];
  const lessonRegex = /### Lesson (\d+): (.+?)\n\n[\s\S]*?```c\n([\s\S]*?)\n```/g;

  let match;
  while ((match = lessonRegex.exec(content)) !== null) {
    const [, number, title, code] = match;

    // 퀴즈 추출 (옵션)
    const quizMatch = content
      .slice(match.index)
      .match(/\*\*퀴즈\*\*\n> Q: (.+?)\n((?:> - .+\n)+)/);

    let quiz;
    if (quizMatch) {
      const question = quizMatch[1];
      const optionsText = quizMatch[2];
      const options: string[] = [];
      let correctAnswer = 0;

      const optionLines = optionsText.split('\n').filter((l) => l.startsWith('> - '));
      optionLines.forEach((line, idx) => {
        const optionText = line.replace('> - ', '').replace(' ✓', '');
        options.push(optionText);
        if (line.includes('✓')) {
          correctAnswer = idx;
        }
      });

      quiz = { question, options, correctAnswer };
    }

    // 착각 포인트 추출 (옵션)
    const misconceptionMatch = content
      .slice(match.index)
      .match(/\*\*착각 포인트\*\*\n> "(.+?)"/);
    const misconception = misconceptionMatch?.[1];

    lessons.push({
      number: parseInt(number),
      title,
      code: code.trim(),
      quiz,
      misconception,
    });
  }

  return lessons;
}

// 레슨 ID 매핑 (CURRICULUM Lesson → DB Lesson)
function getLessonId(lessonNumber: number): string {
  const mapping: Record<number, string> = {
    1: 'c-1-1', // 변수와 메모리 주소
    2: 'c-2-1', // 포인터는 값이다
    3: 'c-2-5', // 포인터 역참조
    4: 'c-3-4', // 배열과 포인터
    5: 'c-4-2', // 함수와 값 전달
    6: 'c-4-3', // 함수와 포인터 전달
    7: 'c-5-1', // Stack vs Heap
    8: 'c-5-2', // 동적 메모리 할당
    9: 'c-8-1', // 이중 포인터
    10: 'c-6-4', // 구조체와 포인터
  };

  return mapping[lessonNumber] || `c-${lessonNumber}-1`;
}

// JSON 템플릿 생성
function generateTemplate(lesson: ParsedLesson): LessonTemplate {
  const lessonId = getLessonId(lesson.number);
  const codeLines = lesson.code.split('\n');

  return {
    lessonId,
    code: lesson.code,
    steps: codeLines.map((line, idx) => ({
      line: idx + 1,
      explanation: 'TODO: 이 줄의 동작을 설명하세요',
      ...(idx === 0 && lesson.misconception
        ? { misconception: lesson.misconception }
        : {}),
      memoryState: {
        stack: [
          // TODO: 수동 작성
          // {
          //   name: "변수명",
          //   value: 10,
          //   address: "0x1000",
          //   type: "int"
          // }
        ],
      },
    })),
    quizzes: lesson.quiz
      ? [
          {
            question: lesson.quiz.question,
            options: lesson.quiz.options,
            correctAnswer: lesson.quiz.correctAnswer,
            explanation: 'TODO: 퀴즈 해설을 작성하세요',
          },
        ]
      : [],
  };
}

// 빈 템플릿 생성 (CURRICULUM에 내용 없을 때)
function generateEmptyTemplate(lessonId: string): LessonTemplate {
  return {
    lessonId,
    code: '// TODO: 코드를 작성하세요',
    steps: [
      {
        line: 1,
        explanation: 'TODO: 이 줄의 동작을 설명하세요',
        memoryState: {
          stack: [],
        },
      },
    ],
    quizzes: [
      {
        question: 'TODO: 퀴즈 질문을 작성하세요',
        options: ['옵션1', '옵션2', '옵션3'],
        correctAnswer: 0,
        explanation: 'TODO: 퀴즈 해설을 작성하세요',
      },
    ],
  };
}

// 메인 함수
async function main() {
  console.log('📚 데이터베이스에서 모든 Lesson 조회 중...\n');

  // DB에서 모든 레슨 조회
  const dbLessons = await prisma.lesson.findMany({
    orderBy: [{ chapterId: 'asc' }, { order: 'asc' }],
    include: {
      chapter: {
        include: {
          language: true,
        },
      },
    },
  });

  console.log(`✅ ${dbLessons.length}개 레슨 발견\n`);

  // CURRICULUM 파싱 (C 언어 콘텐츠)
  const curriculumLessons = await parseCurriculum();
  const curriculumMap = new Map(
    curriculumLessons.map((l) => [getLessonId(l.number), l])
  );

  const outputDir = path.join(__dirname, '../data/lessons');
  await fs.mkdir(outputDir, { recursive: true });

  let created = 0;
  let skipped = 0;

  for (const dbLesson of dbLessons) {
    const filename = `${dbLesson.id}.json`;
    const filepath = path.join(outputDir, filename);

    // 이미 존재하면 건너뛰기
    try {
      await fs.access(filepath);
      console.log(`  ⏭️  SKIP: ${filename} (이미 존재)`);
      skipped++;
      continue;
    } catch {
      // 파일 없음 → 생성
    }

    // CURRICULUM에 콘텐츠가 있으면 사용, 없으면 빈 템플릿
    let template: LessonTemplate;
    const curriculumLesson = curriculumMap.get(dbLesson.id);

    if (curriculumLesson) {
      template = generateTemplate(curriculumLesson);
      console.log(`  ✅ CREATE: ${filename} (CURRICULUM 콘텐츠 포함)`);
    } else {
      template = generateEmptyTemplate(dbLesson.id);
      console.log(`  ✅ CREATE: ${filename} (빈 템플릿)`);
    }

    await fs.writeFile(filepath, JSON.stringify(template, null, 2), 'utf-8');
    created++;
  }

  await prisma.$disconnect();

  console.log(`\n📊 결과:`);
  console.log(`   - 생성: ${created}개`);
  console.log(`   - 건너뜀: ${skipped}개`);
  console.log(`   - 총 레슨: ${dbLessons.length}개`);
  console.log(`\n✨ 다음 단계:`);
  console.log(`   1. data/lessons/*.json 파일 열기`);
  console.log(`   2. "TODO" 검색`);
  console.log(`   3. explanation, memoryState, 코드 작성`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
