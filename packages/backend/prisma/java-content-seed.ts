/**
 * Java Content Seed - Chapter 1: 기본 타입 vs 참조 타입
 * 통일 형식: stack frames + heap objects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 1: 기본 타입 vs 참조 타입
// =============================================

const ch1_lesson1 = {
  lessonId: 'j-1-1',
  language: 'java',
  code: `public class PrimitiveTypes {
    public static void main(String[] args) {
        // 8가지 기본 타입
        byte b = 127;           // 1바이트 정수
        short s = 32767;        // 2바이트 정수
        int i = 2147483647;     // 4바이트 정수
        long l = 9223372036854775807L;  // 8바이트 정수

        float f = 3.14f;        // 4바이트 실수
        double d = 3.14159265;  // 8바이트 실수

        char c = 'A';           // 2바이트 문자
        boolean bool = true;    // 참/거짓

        System.out.println("int: " + i);
        System.out.println("double: " + d);
        System.out.println("char: " + c);
        System.out.println("boolean: " + bool);
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '정수형 기본 타입',
      explanation:
        'byte, short, int, long은 정수를 저장합니다. 각각 1, 2, 4, 8바이트 크기입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'b', type: 'byte', value: '127' },
              { name: 's', type: 'short', value: '32767' },
              { name: 'i', type: 'int', value: '2147483647' },
              { name: 'l', type: 'long', value: '9223372036854775807L' },
            ],
          },
        ],
      },
      keyInsight: '기본 타입은 값 자체를 저장합니다. 객체가 아니라 "순수한 값"입니다.',
    },
    {
      line: 9,
      title: '실수형 기본 타입',
      explanation:
        'float(4바이트)와 double(8바이트)은 소수점 있는 숫자를 저장합니다. float는 f를 붙여야 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'b', type: 'byte', value: '127' },
              { name: 's', type: 'short', value: '32767' },
              { name: 'i', type: 'int', value: '2147483647' },
              { name: 'l', type: 'long', value: '9223372036854775807L' },
              { name: 'f', type: 'float', value: '3.14f', highlight: true },
              { name: 'd', type: 'double', value: '3.14159265', highlight: true },
            ],
          },
        ],
      },
    },
    {
      line: 12,
      title: 'char와 boolean',
      explanation:
        "char는 하나의 문자(2바이트), boolean은 true/false 값을 저장합니다.",
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'b', type: 'byte', value: '127' },
              { name: 's', type: 'short', value: '32767' },
              { name: 'i', type: 'int', value: '2147483647' },
              { name: 'l', type: 'long', value: '9223372036854775807L' },
              { name: 'f', type: 'float', value: '3.14f' },
              { name: 'd', type: 'double', value: '3.14159265' },
              { name: 'c', type: 'char', value: "'A'", highlight: true },
              { name: 'bool', type: 'boolean', value: 'true', highlight: true },
            ],
          },
        ],
      },
      analogy:
        '기본 타입은 "상자에 직접 물건을 넣는 것"입니다. 상자 안에 값 자체가 들어있습니다.',
    },
  ]),
};

const ch1_lesson2 = {
  lessonId: 'j-1-2',
  language: 'java',
  code: `public class PrimitiveMemory {
    public static void main(String[] args) {
        int a = 10;
        int b = a;  // 값이 복사됨

        System.out.println("a = " + a);  // 10
        System.out.println("b = " + b);  // 10

        b = 20;  // b만 변경

        System.out.println("a = " + a);  // 10 (그대로!)
        System.out.println("b = " + b);  // 20
    }
}`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a에 10 저장',
      explanation:
        'int a = 10은 Stack에 4바이트 공간을 만들고, 그 안에 10을 직접 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'a', type: 'int', value: '10', highlight: true }],
          },
        ],
        heap: [],
      },
    },
    {
      line: 4,
      title: '값 복사',
      explanation:
        'int b = a는 a의 "값"을 복사해서 b에 저장합니다. a와 b는 독립적인 공간입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '10', highlight: true },
            ],
          },
        ],
        heap: [],
      },
      keyInsight:
        '기본 타입은 할당 시 값이 복사됩니다. 두 변수는 완전히 독립적입니다.',
    },
    {
      line: 9,
      title: 'b만 변경',
      explanation:
        'b = 20은 b의 공간에 20을 저장합니다. a는 영향받지 않습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '20', highlight: true },
            ],
          },
        ],
        heap: [],
      },
      analogy:
        '기본 타입 복사는 "종이에 숫자를 베끼는 것"입니다. 원본 종이를 지워도 베낀 종이는 그대로입니다.',
    },
  ]),
};

const ch1_lesson3 = {
  lessonId: 'j-1-3',
  language: 'java',
  code: `public class ReferenceType {
    public static void main(String[] args) {
        // 참조 타입: 배열
        int[] arr = new int[3];
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;

        // 참조 타입: 객체
        String name = "Alice";

        // 참조 변수에는 무엇이 저장될까?
        System.out.println("arr = " + arr);  // [I@15db9742 (주소!)
        System.out.println("name = " + name);
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '배열 생성',
      explanation:
        'new int[3]은 Heap에 배열 객체를 생성합니다. arr 변수에는 이 객체의 "주소"가 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[0, 0, 0]', highlight: true },
        ],
      },
      keyInsight:
        '참조 타입 변수는 객체 자체가 아니라 "객체의 주소"를 저장합니다.',
    },
    {
      line: 5,
      title: '배열 요소 수정',
      explanation:
        'arr[0] = 10은 arr이 가리키는 Heap의 배열에서 첫 번째 요소를 수정합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[10, 20, 30]', highlight: true },
        ],
      },
    },
    {
      line: 10,
      title: 'String도 참조 타입',
      explanation:
        'String도 객체입니다. name 변수에는 "Alice" 문자열 객체의 주소가 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'name', type: 'String', value: 'str_1', ref: 'str_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[10, 20, 30]' },
          { id: 'str_1', type: 'String', value: '"Alice"', highlight: true },
        ],
      },
      analogy:
        '참조 변수는 "리모컨"과 같습니다. 리모컨(참조)을 누르면 TV(객체)가 동작합니다. 리모컨 자체가 TV는 아닙니다.',
    },
  ]),
};

const ch1_lesson4 = {
  lessonId: 'j-1-4',
  language: 'java',
  code: `public class EqualsOperator {
    public static void main(String[] args) {
        // 기본 타입: == 는 값 비교
        int a = 10;
        int b = 10;
        System.out.println("a == b: " + (a == b));  // true

        // 참조 타입: == 는 주소 비교!
        int[] arr1 = {1, 2, 3};
        int[] arr2 = {1, 2, 3};
        System.out.println("arr1 == arr2: " + (arr1 == arr2));  // false!

        // 같은 객체를 가리키면?
        int[] arr3 = arr1;
        System.out.println("arr1 == arr3: " + (arr1 == arr3));  // true
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '기본 타입 비교',
      explanation:
        'int a = 10, int b = 10은 각각 Stack에 10을 저장합니다. == 는 값을 비교하므로 true입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '10' },
            ],
          },
        ],
      },
      keyInsight: '기본 타입에서 == 는 "값이 같은가?"를 비교합니다.',
    },
    {
      line: 9,
      title: '참조 타입 비교 (함정!)',
      explanation:
        'arr1과 arr2는 내용은 같지만 다른 객체입니다. == 는 주소를 비교하므로 false입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '10' },
              { name: 'arr1', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'arr2', type: 'int[]', value: 'arr_2', ref: 'arr_2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[1, 2, 3]' },
          { id: 'arr_2', type: 'int[3]', value: '[1, 2, 3]', highlight: true },
        ],
      },
      keyInsight:
        '참조 타입에서 == 는 "같은 객체인가?" (주소가 같은가?)를 비교합니다. 내용이 같아도 false일 수 있습니다!',
    },
    {
      line: 14,
      title: '같은 객체 참조',
      explanation:
        'arr3 = arr1은 같은 객체를 가리킵니다. == 비교 시 주소가 같으므로 true입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '10' },
              { name: 'arr1', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'arr2', type: 'int[]', value: 'arr_2', ref: 'arr_2' },
              { name: 'arr3', type: 'int[]', value: 'arr_1', ref: 'arr_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[1, 2, 3]', highlight: true },
          { id: 'arr_2', type: 'int[3]', value: '[1, 2, 3]' },
        ],
      },
      analogy:
        '== 연산자는 기본 타입에선 "숫자가 같니?", 참조 타입에선 "같은 집을 가리키니?" 를 묻습니다.',
    },
  ]),
};

const ch1_lesson5 = {
  lessonId: 'j-1-5',
  language: 'java',
  code: `public class NullMeaning {
    public static void main(String[] args) {
        // null = 아무것도 가리키지 않음
        String name = null;
        int[] arr = null;

        System.out.println("name = " + name);  // null

        // null인 상태에서 메서드 호출하면?
        // name.length();  // NullPointerException!

        // null 체크
        if (name != null) {
            System.out.println("길이: " + name.length());
        } else {
            System.out.println("name이 null입니다");
        }

        // 기본 타입은 null 불가!
        // int x = null;  // 컴파일 에러!
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: 'null 할당',
      explanation:
        'null은 "아무 객체도 가리키지 않음"을 의미합니다. 참조 변수의 초기 상태입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'name', type: 'String', value: 'null' },
              { name: 'arr', type: 'int[]', value: 'null' },
            ],
          },
        ],
        heap: [],
      },
      keyInsight: 'null은 "리모컨은 있지만 연결된 TV가 없는 상태"입니다.',
    },
    {
      line: 10,
      title: 'NullPointerException',
      explanation:
        'null인 참조로 메서드를 호출하면 NullPointerException이 발생합니다. "없는 TV를 켜려는 것"과 같습니다.',
    },
    {
      line: 13,
      title: 'null 체크',
      explanation:
        'null을 사용하기 전에 != null로 체크하는 것이 안전합니다.',
    },
    {
      line: 20,
      title: '기본 타입은 null 불가',
      explanation:
        'int x = null은 컴파일 에러입니다. 기본 타입은 항상 값을 가져야 합니다.',
      analogy:
        '기본 타입은 "상자에 항상 뭔가가 있어야 함", 참조 타입은 "리모컨이 아무것도 가리키지 않을 수 있음"입니다.',
    },
  ]),
};

const ch1_lesson6 = {
  lessonId: 'j-1-6',
  language: 'java',
  code: `public class AutoBoxing {
    public static void main(String[] args) {
        // 기본 타입 → 래퍼 클래스 (오토박싱)
        int primitiveInt = 10;
        Integer wrapperInt = primitiveInt;  // 자동 변환!

        // 래퍼 클래스 → 기본 타입 (언박싱)
        Integer boxed = Integer.valueOf(20);
        int unboxed = boxed;  // 자동 변환!

        System.out.println("wrapperInt = " + wrapperInt);
        System.out.println("unboxed = " + unboxed);

        // 주의: Integer끼리 == 비교
        Integer a = 127;
        Integer b = 127;
        System.out.println("a == b: " + (a == b));  // true (캐싱)

        Integer c = 128;
        Integer d = 128;
        System.out.println("c == d: " + (c == d));  // false!
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '오토박싱',
      explanation:
        'int를 Integer에 할당하면 자동으로 Integer 객체가 생성됩니다. 이를 오토박싱이라 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'primitiveInt', type: 'int', value: '10' },
              { name: 'wrapperInt', type: 'Integer', value: 'int_10', ref: 'int_10', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_10', type: 'Integer', value: '10', highlight: true },
        ],
      },
      keyInsight: '오토박싱: 기본 타입 → 래퍼 객체 (int → Integer)',
    },
    {
      line: 8,
      title: '언박싱',
      explanation:
        'Integer를 int에 할당하면 자동으로 값이 추출됩니다. 이를 언박싱이라 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'primitiveInt', type: 'int', value: '10' },
              { name: 'wrapperInt', type: 'Integer', value: 'int_10', ref: 'int_10' },
              { name: 'boxed', type: 'Integer', value: 'int_20', ref: 'int_20' },
              { name: 'unboxed', type: 'int', value: '20', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_10', type: 'Integer', value: '10' },
          { id: 'int_20', type: 'Integer', value: '20' },
        ],
      },
      keyInsight: '언박싱: 래퍼 객체 → 기본 타입 (Integer → int)',
    },
    {
      line: 15,
      title: 'Integer 캐싱 함정',
      explanation:
        '-128 ~ 127 범위의 Integer는 캐싱되어 재사용됩니다. 이 범위에서는 == 가 true입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Integer', value: 'cache_127', ref: 'cache_127' },
              { name: 'b', type: 'Integer', value: 'cache_127', ref: 'cache_127', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'cache_127', type: 'Integer', value: '127', highlight: true },
        ],
      },
    },
    {
      line: 19,
      title: '캐싱 범위 밖',
      explanation:
        '128은 캐싱 범위 밖이므로 새 객체가 생성됩니다. c와 d는 다른 객체이므로 == 가 false입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Integer', value: 'cache_127', ref: 'cache_127' },
              { name: 'b', type: 'Integer', value: 'cache_127', ref: 'cache_127' },
              { name: 'c', type: 'Integer', value: 'int_128_a', ref: 'int_128_a' },
              { name: 'd', type: 'Integer', value: 'int_128_b', ref: 'int_128_b', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'cache_127', type: 'Integer', value: '127' },
          { id: 'int_128_a', type: 'Integer', value: '128' },
          { id: 'int_128_b', type: 'Integer', value: '128', highlight: true },
        ],
      },
      analogy:
        'Integer 비교 시 == 대신 .equals()를 사용하세요. 캐싱 때문에 예상치 못한 결과가 나올 수 있습니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContent() {
  console.log('☕ Seeding Java LessonContent - Chapter 1...\n');

  const contents = [
    ch1_lesson1,
    ch1_lesson2,
    ch1_lesson3,
    ch1_lesson4,
    ch1_lesson5,
    ch1_lesson6,
  ];

  for (const content of contents) {
    await prisma.lessonContent.deleteMany({
      where: { lessonId: content.lessonId },
    });

    await prisma.lessonContent.create({
      data: {
        id: content.lessonId,
        lessonId: content.lessonId,
        language: content.language,
        code: content.code,
        steps: content.steps,
      },
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: content.lessonId },
    });
    console.log(`✅ ${lesson?.title}`);
  }

  const total = await prisma.lessonContent.count({
    where: { language: 'java' },
  });
  console.log(`\n📊 Total Java LessonContents: ${total}`);
}

seedJavaContent()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
