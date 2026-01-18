/**
 * Python Course Seed Script
 * Python 언어의 핵심 원리 학습 코스
 *
 * C와 다른 Python의 특징:
 * - 모든 것이 객체
 * - 변수는 객체에 대한 참조(이름표)
 * - 가비지 컬렉션으로 자동 메모리 관리
 * - mutable vs immutable
 *
 * 실행: npx ts-node prisma/python-seed.ts
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
console.log('📁 Database:', connectionString.replace(/:[^:@]+@/, ':***@'));

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// Python 챕터와 레슨 구조
// =============================================

interface LessonData {
  order: number;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number;
}

interface ChapterData {
  order: number;
  title: string;
  description: string;
  keyQuestion: string;
  lessons: LessonData[];
}

const pythonChapters: ChapterData[] = [
  // ========== Chapter 1: 변수와 객체 ==========
  {
    order: 1,
    title: '변수와 객체',
    description: 'Python에서 변수는 값이 아닌 객체를 가리키는 이름표',
    keyQuestion: 'Python 변수는 C 변수와 어떻게 다른가?',
    lessons: [
      {
        order: 1,
        title: '변수는 이름표다',
        description: 'a = 10은 "10이라는 객체에 a라는 이름표를 붙인다"는 의미입니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '모든 것은 객체',
        description: '숫자, 문자열, 함수까지 모든 것이 객체입니다.',
        difficulty: 'basic',
        estimatedTime: 7,
      },
      {
        order: 3,
        title: 'id()로 정체 확인',
        description: 'id() 함수로 객체의 고유 주소를 확인합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 4,
        title: 'is vs ==',
        description: '같은 객체인가(is) vs 같은 값인가(==)의 차이를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: '재할당의 진실',
        description: 'a = 20은 a가 가리키는 대상을 바꾸는 것입니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
    ],
  },

  // ========== Chapter 2: 불변 객체 (Immutable) ==========
  {
    order: 2,
    title: '불변 객체 (Immutable)',
    description: '숫자, 문자열, 튜플은 변경할 수 없다',
    keyQuestion: '불변 객체는 왜 필요한가?',
    lessons: [
      {
        order: 1,
        title: '숫자의 불변성',
        description: 'a += 1은 새 객체를 만드는 것입니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '문자열의 불변성',
        description: "s[0] = 'X'가 안 되는 이유를 이해합니다.",
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 3,
        title: '문자열 메서드',
        description: 'upper(), replace()는 새 문자열을 반환합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 4,
        title: '튜플 (tuple)',
        description: '변경 불가능한 리스트, 언제 사용하는가?',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: '정수 캐싱',
        description: 'Python이 작은 정수를 재사용하는 이유',
        difficulty: 'intermediate',
        estimatedTime: 9,
      },
    ],
  },

  // ========== Chapter 3: 가변 객체 (Mutable) ==========
  {
    order: 3,
    title: '가변 객체 (Mutable)',
    description: '리스트, 딕셔너리는 내용을 변경할 수 있다',
    keyQuestion: '가변 객체 사용 시 주의할 점은?',
    lessons: [
      {
        order: 1,
        title: '리스트 생성과 수정',
        description: 'lst[0] = 100으로 내용을 직접 변경할 수 있습니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '같은 리스트를 가리키면?',
        description: 'a = b일 때 a를 수정하면 b도 바뀌는 이유',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: '얕은 복사 (Shallow Copy)',
        description: 'list()나 [:]로 복사해도 안전하지 않은 경우',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 4,
        title: '깊은 복사 (Deep Copy)',
        description: 'copy.deepcopy()로 완전히 독립된 복사본 만들기',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: '딕셔너리 기본',
        description: '키-값 쌍으로 데이터를 저장하는 자료구조',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 6,
        title: '딕셔너리 수정',
        description: '딕셔너리도 가변 객체입니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
    ],
  },

  // ========== Chapter 4: 함수와 인자 전달 ==========
  {
    order: 4,
    title: '함수와 인자 전달',
    description: '함수에 인자를 전달하면 무슨 일이 일어나는가?',
    keyQuestion: 'Python은 Call by Value인가 Call by Reference인가?',
    lessons: [
      {
        order: 1,
        title: '함수 정의와 호출',
        description: 'def로 함수를 만들고 호출하는 기본',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '인자 전달의 진실',
        description: 'Python은 "Call by Object Reference"입니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '불변 객체를 인자로',
        description: '함수 안에서 숫자나 문자열을 바꿔도 원본은 그대로',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '가변 객체를 인자로',
        description: '함수 안에서 리스트를 수정하면 원본도 바뀐다!',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 5,
        title: '기본값 인자의 함정',
        description: 'def f(lst=[])의 위험성',
        difficulty: 'advanced',
        estimatedTime: 12,
      },
    ],
  },

  // ========== Chapter 5: 스코프와 네임스페이스 ==========
  {
    order: 5,
    title: '스코프와 네임스페이스',
    description: '변수가 보이는 범위와 이름 저장소',
    keyQuestion: '같은 이름의 변수가 여러 개 있으면?',
    lessons: [
      {
        order: 1,
        title: '지역 변수와 전역 변수',
        description: '함수 안과 밖에서 같은 이름을 쓰면?',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 2,
        title: 'global 키워드',
        description: '함수 안에서 전역 변수를 수정하고 싶을 때',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: 'LEGB 규칙',
        description: 'Local → Enclosing → Global → Built-in 순서',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 4,
        title: '클로저 (Closure)',
        description: '외부 함수의 변수를 기억하는 내부 함수',
        difficulty: 'advanced',
        estimatedTime: 14,
      },
    ],
  },

  // ========== Chapter 6: 클래스와 객체 ==========
  {
    order: 6,
    title: '클래스와 객체',
    description: '나만의 객체 타입 만들기',
    keyQuestion: 'self는 왜 필요한가?',
    lessons: [
      {
        order: 1,
        title: '클래스 정의',
        description: 'class로 새로운 타입을 만듭니다.',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '__init__과 self',
        description: '객체 초기화와 self의 의미',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '인스턴스 변수',
        description: '각 객체가 독립적으로 가지는 데이터',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '클래스 변수',
        description: '모든 인스턴스가 공유하는 변수',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 5,
        title: '메서드',
        description: '객체가 할 수 있는 동작 정의하기',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 6,
        title: '상속',
        description: '기존 클래스를 확장하여 새 클래스 만들기',
        difficulty: 'intermediate',
        estimatedTime: 13,
      },
    ],
  },

  // ========== Chapter 7: 메모리 관리 ==========
  {
    order: 7,
    title: '메모리 관리',
    description: 'Python이 메모리를 자동으로 관리하는 방법',
    keyQuestion: 'del은 객체를 삭제하는 것인가?',
    lessons: [
      {
        order: 1,
        title: '참조 카운팅',
        description: '객체를 가리키는 이름표 개수 세기',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 2,
        title: 'del의 진실',
        description: 'del a는 객체가 아닌 이름표를 제거합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: '가비지 컬렉션',
        description: '아무도 가리키지 않는 객체는 자동 삭제',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 4,
        title: '순환 참조',
        description: '서로 가리키는 객체들의 문제',
        difficulty: 'advanced',
        estimatedTime: 13,
      },
    ],
  },
];

// =============================================
// Seed 함수
// =============================================

async function seedPython() {
  console.log('🐍 Seeding Python Course...\n');

  // 1. Python 언어 생성 (없으면)
  let language = await prisma.language.findUnique({ where: { id: 'python' } });

  if (!language) {
    console.log('📝 Creating Python language...');
    language = await prisma.language.create({
      data: {
        id: 'python',
        name: 'Python',
        description: '읽기 쉽고 강력한 범용 프로그래밍 언어',
        icon: '🐍',
        color: '#3776AB',
        order: 2,
      },
    });
  } else {
    console.log('✅ Python language already exists');
  }

  // 2. 챕터와 레슨 생성/업데이트 (upsert 패턴 - user_progress 보존)
  console.log('\n📚 Creating/Updating Chapters and Lessons...');
  for (const chapterData of pythonChapters) {
    console.log(`\n[Ch${chapterData.order}] ${chapterData.title}`);

    const chapterId = `python-ch${chapterData.order}`;
    const chapter = await prisma.chapter.upsert({
      where: { id: chapterId },
      create: {
        id: chapterId,
        languageId: language.id,
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        order: chapterData.order,
      },
      update: {
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        order: chapterData.order,
      },
    });

    for (const lessonData of chapterData.lessons) {
      console.log(`  ├─ L${lessonData.order}: ${lessonData.title}`);

      // Chapter 5+ 는 p-* 패턴, Chapter 1-4는 py-* 패턴 (기존 데이터 호환)
      const lessonId = chapterData.order >= 5
        ? `p-${chapterData.order}-${lessonData.order}`
        : `py-${chapterData.order}-${lessonData.order}`;

      await prisma.lesson.upsert({
        where: { id: lessonId },
        create: {
          id: lessonId,
          chapterId: chapter.id,
          title: lessonData.title,
          description: lessonData.description,
          difficulty: lessonData.difficulty,
          order: lessonData.order,
          estimatedTime: lessonData.estimatedTime,
        },
        update: {
          title: lessonData.title,
          description: lessonData.description,
          difficulty: lessonData.difficulty,
          order: lessonData.order,
          estimatedTime: lessonData.estimatedTime,
        },
      });
    }
  }

  // 4. 결과 확인
  const stats = {
    chapters: await prisma.chapter.count({ where: { languageId: 'python' } }),
    lessons: await prisma.lesson.count({
      where: { chapter: { languageId: 'python' } },
    }),
  };

  console.log('\n✅ Python seeding complete!');
  console.log('📊 Stats:');
  console.log(`   - Chapters: ${stats.chapters}`);
  console.log(`   - Lessons: ${stats.lessons}`);
}

seedPython()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
