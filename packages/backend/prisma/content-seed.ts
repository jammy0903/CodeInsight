/**
 * LessonContent Seed Script
 * C언어 레슨 콘텐츠 추가
 *
 * ID 자동 생성: c-{chapterOrder}-{lessonOrder}
 * 실행: npx tsx prisma/content-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// 콘텐츠 타입 정의
// =============================================
interface LessonContentData {
  chapter: number;
  lesson: number;
  language: string;
  code: string;
  steps: object[];
}

// ID 자동 생성 함수
const makeLessonId = (lang: string, chapter: number, lesson: number) =>
  `${lang}-${chapter}-${lesson}`;

// =============================================
// Chapter 1: 변수와 메모리 기초
// =============================================
const cContents: LessonContentData[] = [
  {
    chapter: 1,
    lesson: 1,
    language: 'c',
    code: `#include <stdio.h>

int main() {
    int a;
    a = 10;
    int b = 20;

    printf("a = %d\\n", a);
    printf("b = %d\\n", b);

    return 0;
}`,
    steps: [
      {
        line: 3,
        title: 'main 함수 시작',
        explanation:
          "프로그램이 시작되면 main 함수를 위한 '스택 프레임'이 메모리에 생성됩니다. 이 공간에 지역 변수들이 저장됩니다.",
        memoryChanges: {
          stack: { action: 'create_frame', frame: 'main' },
        },
      },
      {
        line: 4,
        title: '변수 선언 (초기화 없음)',
        explanation:
          "int a;는 '정수형 변수 a를 위한 4바이트 공간을 확보해라'라는 의미입니다. 아직 값을 넣지 않았으므로 쓰레기 값(garbage value)이 들어있습니다.",
        memoryChanges: {
          stack: {
            action: 'add_variable',
            name: 'a',
            type: 'int',
            size: 4,
            value: '???',
            address: '0x7ffd1234',
          },
        },
        misconception:
          '초기화하지 않은 변수는 0이 아닙니다! 이전에 그 메모리에 있던 쓰레기 값이 그대로 있습니다.',
      },
      {
        line: 5,
        title: '값 대입',
        explanation:
          "a = 10;은 'a라는 이름표가 붙은 메모리 공간에 10을 저장해라'라는 의미입니다. 쓰레기 값이 10으로 덮어씌워집니다.",
        memoryChanges: {
          stack: { action: 'update_variable', name: 'a', oldValue: '???', newValue: 10 },
        },
        analogy: '빈 상자(a)에 물건(10)을 넣는 것과 같습니다.',
      },
      {
        line: 6,
        title: '선언과 초기화를 동시에',
        explanation:
          "int b = 20;은 '4바이트 공간 확보 + 즉시 20 저장'을 한 번에 합니다. 이 방식이 더 안전합니다.",
        memoryChanges: {
          stack: {
            action: 'add_variable',
            name: 'b',
            type: 'int',
            size: 4,
            value: 20,
            address: '0x7ffd1238',
          },
        },
        tip: '변수는 선언과 동시에 초기화하는 습관을 들이세요!',
      },
      { line: 8, title: '값 출력 (a)', explanation: 'printf가 a의 메모리 주소에서 값을 읽어와 화면에 출력합니다.', output: 'a = 10' },
      { line: 9, title: '값 출력 (b)', explanation: 'printf가 b의 메모리 주소에서 값을 읽어와 화면에 출력합니다.', output: 'b = 20' },
      {
        line: 11,
        title: '함수 종료',
        explanation: 'main 함수가 종료되면 스택 프레임이 제거되고, a와 b의 메모리 공간도 함께 해제됩니다.',
        memoryChanges: {
          stack: { action: 'destroy_frame', frame: 'main', freed: ['a', 'b'] },
        },
      },
    ],
  },
  {
    chapter: 1,
    lesson: 2,
    language: 'c',
    code: `#include <stdio.h>

int main() {
    int a = 10;
    int b = 20;

    printf("a의 값: %d\\n", a);
    printf("a의 주소: %p\\n", &a);
    printf("b의 값: %d\\n", b);
    printf("b의 주소: %p\\n", &b);

    return 0;
}`,
    steps: [
      {
        line: 4,
        title: '변수 a 생성',
        explanation: '변수 a가 스택 메모리에 생성됩니다. 이때 특정 메모리 주소가 할당됩니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'a', type: 'int', size: 4, value: 10, address: '0x7ffd1000' },
        },
      },
      {
        line: 5,
        title: '변수 b 생성',
        explanation: '변수 b가 a 바로 다음 메모리 공간에 생성됩니다. 스택은 연속된 공간을 사용합니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'b', type: 'int', size: 4, value: 20, address: '0x7ffd1004' },
        },
        tip: 'int는 4바이트이므로, 주소가 4만큼 증가합니다 (1000 → 1004)',
      },
      { line: 7, title: '값 출력', explanation: 'a 변수에 저장된 값 10을 출력합니다.', output: 'a의 값: 10' },
      {
        line: 8,
        title: '주소 출력 (&a)',
        explanation: '& 연산자는 변수의 메모리 주소를 반환합니다. %p는 포인터(주소)를 출력하는 형식 지정자입니다.',
        output: 'a의 주소: 0x7ffd1000',
        misconception: '주소는 실행할 때마다 달라집니다. 운영체제가 매번 다른 위치에 메모리를 할당하기 때문입니다.',
      },
      { line: 9, title: '값 출력', explanation: 'b 변수에 저장된 값 20을 출력합니다.', output: 'b의 값: 20' },
      {
        line: 10,
        title: '주소 출력 (&b)',
        explanation: 'b의 주소는 a보다 4바이트 뒤에 있습니다. int 타입이 4바이트를 차지하기 때문입니다.',
        output: 'b의 주소: 0x7ffd1004',
        analogy: '메모리는 아파트와 같습니다. 각 변수는 호수(주소)를 가지고, & 연산자로 호수를 알아낼 수 있습니다.',
      },
    ],
  },
  {
    chapter: 1,
    lesson: 3,
    language: 'c',
    code: `#include <stdio.h>

int main() {
    char c = 'A';
    short s = 100;
    int i = 1000;
    long l = 10000L;
    float f = 3.14f;
    double d = 3.141592;

    printf("char: %zu bytes\\n", sizeof(c));
    printf("short: %zu bytes\\n", sizeof(s));
    printf("int: %zu bytes\\n", sizeof(i));
    printf("long: %zu bytes\\n", sizeof(l));
    printf("float: %zu bytes\\n", sizeof(f));
    printf("double: %zu bytes\\n", sizeof(d));

    return 0;
}`,
    steps: [
      {
        line: 4,
        title: 'char 타입 (1바이트)',
        explanation: "char는 문자 1개를 저장하며, 1바이트(8비트)를 사용합니다. 'A'는 ASCII 코드 65로 저장됩니다.",
        memoryChanges: {
          stack: { action: 'add_variable', name: 'c', type: 'char', size: 1, value: "'A' (65)", address: '0x7ffd1000' },
        },
      },
      {
        line: 5,
        title: 'short 타입 (2바이트)',
        explanation: 'short는 작은 정수를 저장하며, 2바이트(16비트)를 사용합니다. -32,768 ~ 32,767 범위의 값을 저장할 수 있습니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 's', type: 'short', size: 2, value: 100, address: '0x7ffd1002' },
        },
      },
      {
        line: 6,
        title: 'int 타입 (4바이트)',
        explanation: 'int는 가장 흔히 사용하는 정수 타입으로, 4바이트(32비트)를 사용합니다. 약 ±21억 범위의 값을 저장할 수 있습니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'i', type: 'int', size: 4, value: 1000, address: '0x7ffd1004' },
        },
        tip: '대부분의 경우 정수는 int를 사용하면 됩니다.',
      },
      {
        line: 7,
        title: 'long 타입 (8바이트)',
        explanation: 'long은 더 큰 정수를 저장하며, 64비트 시스템에서 8바이트를 사용합니다. 숫자 뒤에 L을 붙여 long 리터럴임을 명시합니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'l', type: 'long', size: 8, value: 10000, address: '0x7ffd1008' },
        },
      },
      {
        line: 8,
        title: 'float 타입 (4바이트)',
        explanation: 'float는 소수점이 있는 숫자(부동소수점)를 저장하며, 4바이트를 사용합니다. 정밀도는 약 7자리입니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'f', type: 'float', size: 4, value: 3.14, address: '0x7ffd1010' },
        },
      },
      {
        line: 9,
        title: 'double 타입 (8바이트)',
        explanation: 'double은 더 정밀한 소수점 숫자를 저장하며, 8바이트를 사용합니다. 정밀도는 약 15자리입니다.',
        memoryChanges: {
          stack: { action: 'add_variable', name: 'd', type: 'double', size: 8, value: 3.141592, address: '0x7ffd1018' },
        },
        tip: '정밀한 계산이 필요하면 float보다 double을 사용하세요.',
      },
      {
        line: 11,
        title: 'sizeof 연산자',
        explanation: 'sizeof()는 변수나 타입의 크기(바이트 수)를 반환합니다. 컴파일 시점에 계산됩니다.',
        output: 'char: 1 bytes',
      },
    ],
  },
  {
    chapter: 1,
    lesson: 4,
    language: 'c',
    code: `#include <stdio.h>

void innerFunction() {
    int inner = 100;
    printf("inner 생성: %d\\n", inner);
}

int main() {
    int outer = 10;
    printf("outer 생성: %d\\n", outer);

    {
        int block = 50;
        printf("block 생성: %d\\n", block);
    }
    // block은 여기서 소멸됨

    innerFunction();
    // inner는 함수 종료 시 소멸됨

    printf("outer 아직 살아있음: %d\\n", outer);
    return 0;
}`,
    steps: [
      {
        line: 8,
        title: 'main 함수 시작',
        explanation: "main 함수의 스택 프레임이 생성됩니다. 이 프레임 안에서 선언된 변수들은 함수가 끝날 때까지 '살아있습니다'.",
        memoryChanges: { stack: { action: 'create_frame', frame: 'main' } },
      },
      {
        line: 9,
        title: 'outer 변수 생성',
        explanation: 'outer는 main 함수의 지역 변수입니다. main이 끝날 때까지 살아있습니다 (함수 스코프).',
        memoryChanges: { stack: { action: 'add_variable', name: 'outer', type: 'int', value: 10, scope: 'main' } },
      },
      {
        line: 12,
        title: '블록 시작 { }',
        explanation: '중괄호 { }는 새로운 스코프(범위)를 만듭니다. 이 안에서 선언된 변수는 블록이 끝나면 사라집니다.',
        memoryChanges: { stack: { action: 'enter_block' } },
      },
      {
        line: 13,
        title: 'block 변수 생성',
        explanation: 'block은 중괄호 안에서만 존재하는 변수입니다 (블록 스코프).',
        memoryChanges: { stack: { action: 'add_variable', name: 'block', type: 'int', value: 50, scope: 'block' } },
      },
      {
        line: 15,
        title: '블록 종료 }',
        explanation: '중괄호가 닫히면 block 변수는 즉시 소멸됩니다. 이후로는 block을 사용할 수 없습니다.',
        memoryChanges: { stack: { action: 'remove_variable', name: 'block', reason: 'block scope ended' } },
        misconception: '블록 밖에서 block을 사용하면 컴파일 에러가 발생합니다!',
      },
      {
        line: 18,
        title: 'innerFunction 호출',
        explanation: '새로운 함수가 호출되면 새로운 스택 프레임이 main 위에 쌓입니다.',
        memoryChanges: { stack: { action: 'create_frame', frame: 'innerFunction' } },
      },
      {
        line: 4,
        title: 'inner 변수 생성',
        explanation: 'inner는 innerFunction 안에서만 존재합니다. 함수가 끝나면 사라집니다.',
        memoryChanges: { stack: { action: 'add_variable', name: 'inner', type: 'int', value: 100, scope: 'innerFunction' } },
      },
      {
        line: 6,
        title: 'innerFunction 종료',
        explanation: '함수가 종료되면 스택 프레임 전체가 제거되고, inner도 함께 소멸됩니다.',
        memoryChanges: { stack: { action: 'destroy_frame', frame: 'innerFunction', freed: ['inner'] } },
      },
      {
        line: 21,
        title: 'outer는 아직 살아있음',
        explanation: 'outer는 main 함수에 속하므로 아직 살아있습니다. main이 return할 때 비로소 소멸됩니다.',
        output: 'outer 아직 살아있음: 10',
        analogy: "변수의 생명주기는 '탄생(선언) → 생존(스코프 내) → 죽음(스코프 종료)'입니다.",
      },
    ],
  },
];

// =============================================
// Seed 실행
// =============================================
async function seedContent() {
  console.log('🌱 Seeding C LessonContent...\n');

  for (const content of cContents) {
    const lessonId = makeLessonId(content.language, content.chapter, content.lesson);

    // 기존 콘텐츠가 있으면 삭제
    await prisma.lessonContent.deleteMany({
      where: { lessonId },
    });

    // 새 콘텐츠 생성
    await prisma.lessonContent.create({
      data: {
        id: `content-${lessonId}`,
        lessonId,
        language: content.language,
        code: content.code,
        steps: JSON.stringify(content.steps),
      },
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    console.log(`✅ [${lessonId}] ${lesson?.title || 'Unknown'}`);
  }

  // 결과 확인
  const cCount = await prisma.lessonContent.count({
    where: { language: 'c' },
  });
  console.log(`\n📊 C LessonContents: ${cCount}`);
}

seedContent()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
