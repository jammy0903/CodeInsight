/**
 * Java Course Seed Script
 * Java 언어의 핵심 원리 학습 코스
 *
 * Java의 특징:
 * - 기본 타입 vs 참조 타입
 * - Stack vs Heap 메모리
 * - 정적 타입, 클래스 기반 OOP
 * - 가비지 컬렉션
 *
 * 실행: npx ts-node prisma/java-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Java 챕터와 레슨 구조
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

const javaChapters: ChapterData[] = [
  // ========== Chapter 1: 기본 타입 vs 참조 타입 ==========
  {
    order: 1,
    title: '기본 타입 vs 참조 타입',
    description: 'int와 Integer는 완전히 다르다',
    keyQuestion: 'int와 Integer는 왜 다른가?',
    lessons: [
      {
        order: 1,
        title: '8가지 기본 타입',
        description: 'int, double, boolean... 값 자체를 저장하는 타입들',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '기본 타입과 메모리',
        description: 'Stack에 값이 직접 저장되는 원리',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: '참조 타입이란',
        description: '객체의 "주소"를 저장하는 변수',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '== 의 두 얼굴',
        description: '기본 타입은 값 비교, 참조 타입은 주소 비교',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: 'null의 의미',
        description: '아무것도 가리키지 않음, NullPointerException',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 6,
        title: '오토박싱과 언박싱',
        description: 'int ↔ Integer 자동 변환의 비밀',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 2: 객체와 메모리 ==========
  {
    order: 2,
    title: '객체와 메모리',
    description: 'new가 하는 일, Stack과 Heap의 차이',
    keyQuestion: 'new가 하는 일은 무엇인가?',
    lessons: [
      {
        order: 1,
        title: 'new 키워드',
        description: 'Heap에 객체를 생성하고 주소를 반환',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: 'Stack vs Heap',
        description: '지역변수는 Stack, 객체는 Heap에 저장',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '참조 변수의 정체',
        description: '리모컨(주소)을 들고 있는 것과 같다',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '같은 객체 vs 같은 값',
        description: '== vs equals() 제대로 이해하기',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: '배열도 객체다',
        description: 'int[]도 Heap에 생성되는 객체',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 6,
        title: '다차원 배열의 진실',
        description: '배열의 배열 = 참조의 참조',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
    ],
  },

  // ========== Chapter 3: String의 비밀 ==========
  {
    order: 3,
    title: 'String의 비밀',
    description: 'String은 특별한 객체다',
    keyQuestion: 'String은 왜 특별한가?',
    lessons: [
      {
        order: 1,
        title: 'String은 불변',
        description: '한 번 만들면 수정할 수 없다',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: 'String Pool',
        description: '리터럴 "hello"는 재사용된다',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: 'new String() vs 리터럴',
        description: '완전히 다른 객체가 생성된다!',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: 'String 비교의 함정',
        description: '==를 쓰면 안 되는 이유',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: 'StringBuilder',
        description: '가변 문자열이 필요할 때',
        difficulty: 'basic',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 4: 메서드와 매개변수 ==========
  {
    order: 4,
    title: '메서드와 매개변수',
    description: 'Java는 항상 Call by Value',
    keyQuestion: 'Java는 Call by Value인가?',
    lessons: [
      {
        order: 1,
        title: '메서드 호출 원리',
        description: 'Stack Frame이 생성된다',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '기본 타입 전달',
        description: '값이 복사되어 전달된다',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: '참조 타입 전달',
        description: '주소가 복사된다 (객체가 아님!)',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 4,
        title: 'swap이 안 되는 이유',
        description: '참조 자체는 바꿀 수 없다',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: '객체 내용 수정은 가능',
        description: '같은 객체를 가리키니까',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 5: 클래스 설계 ==========
  {
    order: 5,
    title: '클래스 설계',
    description: 'this, static, final의 의미',
    keyQuestion: 'this와 static의 차이는?',
    lessons: [
      {
        order: 1,
        title: '클래스 = 설계도',
        description: '객체를 만드는 틀',
        difficulty: 'basic',
        estimatedTime: 8,
      },
      {
        order: 2,
        title: '생성자',
        description: '객체 초기화를 담당',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: 'this 키워드',
        description: '이 객체 자신을 가리킴',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '인스턴스 변수',
        description: '각 객체마다 독립적인 데이터',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 5,
        title: 'static 변수',
        description: '클래스에 하나, 모든 객체가 공유',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 6,
        title: 'static 메서드',
        description: 'this 없이 호출 가능',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 7,
        title: 'final 키워드',
        description: '상수, 불변, 상속 제한',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 6: 상속과 다형성 ==========
  {
    order: 6,
    title: '상속과 다형성',
    description: '부모 타입에 자식을 담는 마법',
    keyQuestion: '부모 타입에 자식을 담으면?',
    lessons: [
      {
        order: 1,
        title: '상속의 개념',
        description: 'extends로 기능 확장',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '메서드 오버라이딩',
        description: '부모의 메서드를 재정의',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: 'super 키워드',
        description: '부모를 가리킴',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '업캐스팅',
        description: '자식 → 부모 타입으로',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: '다형성의 힘',
        description: '같은 코드, 다른 동작',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 6,
        title: '다운캐스팅',
        description: 'instanceof로 안전하게',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 7: 인터페이스 ==========
  {
    order: 7,
    title: '인터페이스',
    description: '"할 수 있는 것"의 약속',
    keyQuestion: '왜 인터페이스가 필요한가?',
    lessons: [
      {
        order: 1,
        title: '인터페이스란',
        description: '"이것을 할 수 있다"는 약속',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: 'implements',
        description: '인터페이스 구현하기',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 3,
        title: '다중 구현',
        description: '여러 인터페이스 구현 가능',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: '인터페이스와 다형성',
        description: '느슨한 결합의 힘',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: '추상 클래스와 차이',
        description: '언제 뭘 쓸까?',
        difficulty: 'intermediate',
        estimatedTime: 10,
      },
    ],
  },

  // ========== Chapter 8: 가비지 컬렉션 ==========
  {
    order: 8,
    title: '가비지 컬렉션',
    description: '객체는 언제 사라지는가',
    keyQuestion: '객체는 언제 사라지는가?',
    lessons: [
      {
        order: 1,
        title: 'C vs Java 메모리',
        description: 'free() 없는 세상',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 2,
        title: '도달 가능성',
        description: 'GC Root에서 닿을 수 있는가?',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 3,
        title: '참조가 끊기면',
        description: 'GC 대상이 된다',
        difficulty: 'basic',
        estimatedTime: 10,
      },
      {
        order: 4,
        title: 'GC의 동작',
        description: 'Mark and Sweep 기본 원리',
        difficulty: 'intermediate',
        estimatedTime: 12,
      },
      {
        order: 5,
        title: 'Java 메모리 누수',
        description: 'Java에서도 발생 가능!',
        difficulty: 'advanced',
        estimatedTime: 12,
      },
    ],
  },
];

// =============================================
// Seed 함수
// =============================================

async function seedJava() {
  console.log('☕ Seeding Java Course...\n');

  // 1. Java 언어 생성 (없으면)
  let language = await prisma.language.findUnique({ where: { id: 'java' } });

  if (!language) {
    console.log('📝 Creating Java language...');
    language = await prisma.language.create({
      data: {
        id: 'java',
        name: 'Java',
        description: '정적 타입, 클래스 기반 객체지향 언어',
        icon: '☕',
        color: '#ED8B00',
        order: 3,
      },
    });
  } else {
    console.log('✅ Java language already exists');
  }

  // 2. 기존 Java 챕터/레슨 삭제 (개발용)
  console.log('🗑️  Cleaning existing Java data...');
  const existingChapters = await prisma.chapter.findMany({
    where: { languageId: 'java' },
  });
  for (const ch of existingChapters) {
    await prisma.lessonContent.deleteMany({
      where: { lesson: { chapterId: ch.id } },
    });
    await prisma.lesson.deleteMany({ where: { chapterId: ch.id } });
  }
  await prisma.chapter.deleteMany({ where: { languageId: 'java' } });

  // 3. 챕터와 레슨 생성
  console.log('\n📚 Creating Chapters and Lessons...');
  for (const chapterData of javaChapters) {
    console.log(`\n[Ch${chapterData.order}] ${chapterData.title}`);

    const chapter = await prisma.chapter.create({
      data: {
        id: `j-${chapterData.order}`,
        languageId: language.id,
        title: chapterData.title,
        description: chapterData.description,
        keyQuestion: chapterData.keyQuestion,
        order: chapterData.order,
      },
    });

    for (const lessonData of chapterData.lessons) {
      console.log(`  ├─ L${lessonData.order}: ${lessonData.title}`);

      await prisma.lesson.create({
        data: {
          id: `j-${chapterData.order}-${lessonData.order}`,
          chapterId: chapter.id,
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
    chapters: await prisma.chapter.count({ where: { languageId: 'java' } }),
    lessons: await prisma.lesson.count({
      where: { chapter: { languageId: 'java' } },
    }),
  };

  console.log('\n✅ Java seeding complete!');
  console.log('📊 Stats:');
  console.log(`   - Chapters: ${stats.chapters}`);
  console.log(`   - Lessons: ${stats.lessons}`);
}

seedJava()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
