/**
 * Course Seed Script
 *
 * C언어 10개 챕터 × 60개 레슨 시드 데이터
 *
 * 실행: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// 챕터와 레슨 데이터 구조
// =============================================

interface LessonData {
  order: number;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: number; // 분
  // code, steps, quiz는 나중에 추가
}

interface ChapterData {
  order: number;
  title: string;
  description: string;
  keyQuestion: string;
  lessons: LessonData[];
}

// =============================================
// C언어 10개 챕터 데이터
// =============================================

const cChapters: ChapterData[] = [
  // ========== Chapter 1: 변수와 메모리 기초 ==========
  {
    order: 1,
    title: '변수와 메모리 기초',
    description: '변수가 메모리에 어떻게 저장되는지 이해',
    keyQuestion: '변수는 메모리 어디에 저장되는가?',
    lessons: [
      {
        order: 1,
        title: '변수 선언과 초기화',
        description: 'int a = 10;의 내부 동작을 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '메모리 주소',
        description: '변수가 저장되는 위치를 확인합니다.',
        difficulty: 'basic',
        estimatedTime: 7,
      },
      {
        order: 3,
        title: '데이터 타입과 크기',
        description: 'int(4바이트), char(1바이트) 등 타입별 메모리 크기를 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '변수의 생명주기',
        description: '스택 메모리의 할당과 해제를 시각화합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
    ],
  },

  // ========== Chapter 2: 포인터 기본 ==========
  {
    order: 2,
    title: '포인터 기본',
    description: '포인터는 "주소를 담는 변수"라는 개념 확립',
    keyQuestion: '포인터는 왜 필요한가?',
    lessons: [
      {
        order: 1,
        title: '포인터 개념',
        description: '포인터가 왜 필요한지 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '주소 연산자 (&)',
        description: '&a로 변수의 주소를 얻는 방법을 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 7,
      },
      {
        order: 3,
        title: '포인터 선언',
        description: 'int *p;의 의미를 정확히 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 4,
        title: '역참조 (*) - 읽기',
        description: '*p로 포인터가 가리키는 값을 읽습니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 5,
        title: '역참조 (*) - 쓰기',
        description: '*p = 20;으로 값을 변경하는 원리를 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 6,
        title: 'NULL 포인터',
        description: '초기화되지 않은 포인터의 위험성을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 8,
      },
      {
        order: 7,
        title: 'const와 포인터',
        description: 'const int *p와 int *const p의 차이를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
    ],
  },

  // ========== Chapter 3: 배열 ==========
  {
    order: 3,
    title: '배열',
    description: '배열은 연속된 메모리 블록',
    keyQuestion: '배열은 메모리에 어떻게 배치되는가?',
    lessons: [
      {
        order: 1,
        title: '배열 선언과 초기화',
        description: 'int arr[5] = {1,2,3,4,5};의 메모리 구조를 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '배열의 메모리 배치',
        description: '연속된 메모리 공간에 저장되는 원리를 시각화합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 3,
        title: '배열 인덱스 접근',
        description: 'arr[2]가 실제로 어떻게 동작하는지 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 7,
      },
      {
        order: 4,
        title: '배열과 포인터 관계',
        description: 'arr == &arr[0]의 의미를 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: '포인터 산술 연산',
        description: 'p+1이 왜 4바이트 증가하는지 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 6,
        title: '배열을 함수에 전달',
        description: '배열이 포인터로 전달되는 원리를 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 4: 함수와 메모리 ==========
  {
    order: 4,
    title: '함수와 메모리',
    description: 'Call by Value의 진실',
    keyQuestion: '함수 호출 시 메모리는 어떻게 변하는가?',
    lessons: [
      {
        order: 1,
        title: '함수 호출과 스택',
        description: '함수 호출 시 스택 프레임이 생성되는 과정을 시각화합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 2,
        title: '값 전달 (Call by Value)',
        description: '인자가 복사본으로 전달되는 원리를 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 3,
        title: '포인터 전달',
        description: '포인터를 통해 원본을 변경하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '배열 전달',
        description: '왜 배열은 원본이 변경되는지 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 5,
        title: '반환값과 포인터',
        description: '지역변수 주소를 반환하는 것의 위험성을 학습합니다.',
        difficulty: 'advanced',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 5: 동적 메모리 관리 ==========
  {
    order: 5,
    title: '동적 메모리 관리',
    description: 'Stack vs Heap 완벽 이해',
    keyQuestion: '언제 Stack을 쓰고 언제 Heap을 쓰는가?',
    lessons: [
      {
        order: 1,
        title: 'Stack vs Heap',
        description: '두 메모리 영역의 차이와 사용 시기를 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 2,
        title: 'malloc으로 할당',
        description: 'malloc(sizeof(int))의 동작 원리를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: 'free로 해제',
        description: '할당된 메모리를 반환하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 9,
      },
      {
        order: 4,
        title: 'Dangling Pointer',
        description: 'free(p) 후 p의 위험성을 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 11,
      },
      {
        order: 5,
        title: 'Memory Leak',
        description: 'free를 하지 않으면 생기는 문제를 학습합니다.',
        difficulty: 'advanced',
        estimatedTime: 10,
      },
      {
        order: 6,
        title: 'calloc과 realloc',
        description: '초기화와 재할당 함수를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 7,
        title: '동적 배열',
        description: 'malloc으로 배열을 생성하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 6: 구조체 ==========
  {
    order: 6,
    title: '구조체',
    description: '사용자 정의 타입의 메모리 구조',
    keyQuestion: '구조체는 메모리에 어떻게 저장되는가?',
    lessons: [
      {
        order: 1,
        title: '구조체 기본',
        description: 'struct Point { int x, y; }의 메모리 배치를 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '구조체의 메모리 배치',
        description: '패딩과 정렬의 원리를 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '구조체 초기화',
        description: '여러 가지 초기화 방법을 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 4,
        title: '구조체 포인터',
        description: 'p->x와 (*p).x의 차이를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 9,
      },
      {
        order: 5,
        title: '구조체 배열',
        description: 'struct Point arr[10]의 메모리 구조를 시각화합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 6,
        title: '구조체 동적 할당',
        description: 'malloc으로 구조체를 생성하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 7,
        title: 'typedef',
        description: '타입 별칭을 만드는 방법을 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 7,
      },
    ],
  },

  // ========== Chapter 7: 문자열 ==========
  {
    order: 7,
    title: '문자열',
    description: '문자열은 char 배열이다',
    keyQuestion: '문자열은 메모리에 어떻게 저장되는가?',
    lessons: [
      {
        order: 1,
        title: '문자 vs 문자열',
        description: "'A'와 \"A\"의 차이를 이해합니다.",
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '문자열의 메모리 구조',
        description: '"hello"가 {\'h\',\'e\',\'l\',\'l\',\'o\',\'\\0\'}로 저장되는 원리를 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 3,
        title: '문자열 포인터',
        description: 'char *s와 char s[]의 차이를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 4,
        title: '문자열 길이 (strlen)',
        description: '문자열 길이를 직접 계산하는 방법을 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 5,
        title: '문자열 복사 (strcpy)',
        description: '버퍼 오버플로우 위험성을 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 12,
      },
      {
        order: 6,
        title: '문자열 비교 (strcmp)',
        description: '==로 비교하면 안 되는 이유를 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 7,
        title: '문자열 동적 할당',
        description: 'malloc으로 문자열을 생성하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 8: 고급 포인터 ==========
  {
    order: 8,
    title: '고급 포인터',
    description: '복잡한 포인터 표현 이해',
    keyQuestion: '포인터의 포인터는 어떻게 사용하는가?',
    lessons: [
      {
        order: 1,
        title: '이중 포인터 (**)',
        description: '포인터를 가리키는 포인터의 개념을 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 13,
      },
      {
        order: 2,
        title: '다차원 배열',
        description: 'int arr[3][4]의 메모리 배치를 시각화합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '포인터 배열',
        description: 'char *arr[3] (배열 of 포인터)를 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 13,
      },
      {
        order: 4,
        title: '배열 포인터',
        description: 'int (*p)[4] (포인터 to 배열)를 학습합니다.',
        difficulty: 'advanced',
        estimatedTime: 14,
      },
      {
        order: 5,
        title: '함수 포인터',
        description: '함수도 주소를 가진다는 개념을 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 15,
      },
      {
        order: 6,
        title: 'void 포인터',
        description: '타입 없는 범용 포인터를 학습합니다.',
        difficulty: 'advanced',
        estimatedTime: 12,
      },
    ],
  },

  // ========== Chapter 9: 파일과 전처리기 ==========
  {
    order: 9,
    title: '파일과 전처리기',
    description: 'I/O와 컴파일 전 처리',
    keyQuestion: '파일은 어떻게 읽고 쓰는가?',
    lessons: [
      {
        order: 1,
        title: '파일 열기/닫기',
        description: 'fopen과 fclose의 사용법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '파일 읽기',
        description: 'fread와 fscanf로 데이터를 읽는 방법을 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 3,
        title: '파일 쓰기',
        description: 'fwrite와 fprintf로 데이터를 저장하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 4,
        title: '#define',
        description: '매크로 상수를 정의하는 방법을 이해합니다.',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 5,
        title: '#include',
        description: '헤더 파일을 포함하는 원리를 학습합니다.',
        difficulty: 'basic',
        estimatedTime: 9,
      },
      {
        order: 6,
        title: '조건부 컴파일',
        description: '#ifdef와 #endif의 사용법을 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 10: 자료구조 입문 ==========
  {
    order: 10,
    title: '자료구조 입문',
    description: '메모리 관점에서 자료구조 이해',
    keyQuestion: '자료구조는 메모리에 어떻게 구현되는가?',
    lessons: [
      {
        order: 1,
        title: '배열 기반 스택',
        description: 'push와 pop을 배열로 구현합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 2,
        title: '배열 기반 큐',
        description: 'enqueue와 dequeue를 배열로 구현합니다.',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '링크드 리스트 - 노드',
        description: 'struct Node { int data; Node *next; }의 구조를 이해합니다.',
        difficulty: 'intermediate',
        estimatedTime: 11,
      },
      {
        order: 4,
        title: '링크드 리스트 - 삽입',
        description: '앞, 중간, 뒤에 노드를 삽입하는 방법을 학습합니다.',
        difficulty: 'intermediate',
        estimatedTime: 13,
      },
      {
        order: 5,
        title: '링크드 리스트 - 삭제',
        description: '노드 삭제 시 메모리 해제를 주의하는 방법을 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 13,
      },
      {
        order: 6,
        title: '포인터 기반 스택',
        description: '링크드 리스트로 스택을 구현합니다.',
        difficulty: 'advanced',
        estimatedTime: 14,
      },
      {
        order: 7,
        title: '이진 트리 기초',
        description: 'struct Node { int data; Node *left, *right; }의 구조를 이해합니다.',
        difficulty: 'advanced',
        estimatedTime: 15,
      },
    ],
  },
];

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

  const cLanguage = await prisma.language.create({
    data: {
      id: 'c',
      name: 'C',
      description: '포인터와 메모리를 직접 다루는 시스템 프로그래밍 언어',
      icon: '🔧',
      color: '#00599C',
      order: 1,
    },
  });
  console.log('    ✅ C');

  const pythonLanguage = await prisma.language.create({
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

  const javaLanguage = await prisma.language.create({
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

  const jsLanguage = await prisma.language.create({
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

  const language = cLanguage; // 기존 변수명 유지 (아래 C 챕터 생성에서 사용)

  // 3. Chapter와 Lesson 생성
  console.log('  📚 Creating Chapters and Lessons...');
  for (const chapterData of cChapters) {
    console.log(`    Ch ${chapterData.order}: ${chapterData.title}`);

    const chapter = await prisma.chapter.create({
      data: {
        id: `c-${chapterData.order}`,
        languageId: language.id,
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        order: chapterData.order,
      },
    });

    // 각 챕터의 레슨 생성
    for (const lessonData of chapterData.lessons) {
      console.log(`      ├─ Lesson ${lessonData.order}: ${lessonData.title}`);

      await prisma.lesson.create({
        data: {
          id: `c-${chapterData.order}-${lessonData.order}`,
          chapterId: chapter.id,
          title: lessonData.title,
          description: lessonData.description,
          difficulty: lessonData.difficulty,
          order: lessonData.order,
          estimatedTime: lessonData.estimatedTime,
          // content와 quizzes는 나중에 추가
        },
      });
    }
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
