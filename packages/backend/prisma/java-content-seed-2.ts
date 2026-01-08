/**
 * Java Content Seed - Chapter 2: 객체와 메모리
 * 통일 형식: stack frames + heap objects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 2: 객체와 메모리
// =============================================

const ch2_lesson1 = {
  lessonId: 'j-2-1',
  language: 'java',
  code: `class Person {
    String name;
    int age;
}

public class NewKeyword {
    public static void main(String[] args) {
        // new가 하는 일:
        // 1. Heap에 객체 공간 할당
        // 2. 필드 기본값 초기화
        // 3. 객체 주소 반환
        Person p = new Person();
        p.name = "Alice";
        p.age = 25;

        System.out.println("이름: " + p.name);
        System.out.println("나이: " + p.age);

        // p에는 무엇이 저장될까?
        System.out.println("p = " + p);  // Person@15db9742 (주소!)
    }
}`,
  steps: JSON.stringify([
    {
      line: 11,
      title: 'new Person() 실행',
      explanation:
        'new 키워드는 3가지 일을 합니다: (1) Heap에 Person 크기만큼 공간 할당, (2) 필드를 기본값으로 초기화, (3) 객체 주소 반환',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'p', type: 'Person', value: 'person_1', ref: 'person_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'person_1', type: 'Person', fields: { name: 'null', age: '0' }, highlight: true },
        ],
      },
      keyInsight:
        'new는 Heap에 객체를 생성하고 그 "주소"를 반환합니다. 변수 p에는 객체가 아니라 주소가 저장됩니다.',
    },
    {
      line: 12,
      title: '필드 값 설정',
      explanation:
        'p.name = "Alice"는 p가 가리키는 Heap의 객체에서 name 필드를 수정합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' },
            ],
          },
        ],
        heap: [
          { id: 'person_1', type: 'Person', fields: { name: '"Alice"', age: '25' }, highlight: true },
        ],
      },
    },
    {
      line: 19,
      title: 'p를 출력하면?',
      explanation:
        'p를 출력하면 클래스명@해시코드 형태로 나옵니다. 이것이 객체의 "주소"(정확히는 해시코드)입니다.',
      analogy:
        'new는 "집을 짓고 주소를 알려주는 것"입니다. 변수 p는 집 자체가 아니라 집의 주소를 저장합니다.',
    },
  ]),
};

const ch2_lesson2 = {
  lessonId: 'j-2-2',
  language: 'java',
  code: `class Box {
    int value;
}

public class StackVsHeap {
    public static void main(String[] args) {
        // Stack: 지역 변수, 기본 타입 값
        int x = 10;
        int y = 20;

        // Heap: 객체
        Box box = new Box();
        box.value = 100;

        // 메모리 구조:
        // Stack         Heap
        // ─────         ────
        // x: 10
        // y: 20
        // box: 0x100 ──→ [Box: value=100]
    }
}`,
  steps: JSON.stringify([
    {
      line: 8,
      title: 'Stack에 기본 타입',
      explanation:
        'int x = 10, int y = 20은 Stack에 직접 값을 저장합니다. Stack은 메서드 실행 시 사용되는 빠른 메모리입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'x', type: 'int', value: '10' },
              { name: 'y', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [],
      },
    },
    {
      line: 12,
      title: 'Heap에 객체',
      explanation:
        'new Box()는 Heap에 객체를 생성합니다. box 변수는 Stack에 있고, 객체 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'x', type: 'int', value: '10' },
              { name: 'y', type: 'int', value: '20' },
              { name: 'box', type: 'Box', value: 'box_1', ref: 'box_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'box_1', type: 'Box', fields: { value: '100' }, highlight: true },
        ],
      },
      keyInsight:
        'Stack: 지역 변수, 기본 타입 값, 참조(주소). Heap: 객체 실체.',
    },
    {
      line: 15,
      title: '메모리 구조 이해',
      explanation:
        'Stack은 메서드가 끝나면 자동 정리됩니다. Heap은 GC가 정리합니다. 참조 변수는 Stack에서 Heap을 "가리킵니다".',
      analogy:
        'Stack은 "책상 위", Heap은 "창고"입니다. 책상 위에는 작은 것(기본 타입)과 창고 열쇠(참조)가 있고, 큰 물건(객체)은 창고에 있습니다.',
    },
  ]),
};

const ch2_lesson3 = {
  lessonId: 'j-2-3',
  language: 'java',
  code: `class Dog {
    String name;
}

public class ReferenceVariable {
    public static void main(String[] args) {
        Dog dog1 = new Dog();
        dog1.name = "Buddy";

        // dog2는 같은 객체를 가리킴
        Dog dog2 = dog1;

        System.out.println("dog1.name: " + dog1.name);  // Buddy
        System.out.println("dog2.name: " + dog2.name);  // Buddy

        // dog2로 수정하면?
        dog2.name = "Max";

        System.out.println("dog1.name: " + dog1.name);  // Max!
        System.out.println("dog2.name: " + dog2.name);  // Max
    }
}`,
  steps: JSON.stringify([
    {
      line: 7,
      title: '첫 번째 객체 생성',
      explanation:
        'new Dog()로 Heap에 객체 생성, dog1은 그 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'dog1', type: 'Dog', value: 'dog_1', ref: 'dog_1' },
            ],
          },
        ],
        heap: [
          { id: 'dog_1', type: 'Dog', fields: { name: '"Buddy"' } },
        ],
      },
    },
    {
      line: 11,
      title: '참조 복사',
      explanation:
        'dog2 = dog1은 주소를 복사합니다. dog2도 같은 객체를 가리킵니다. 새 객체가 생기는 게 아닙니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'dog1', type: 'Dog', value: 'dog_1', ref: 'dog_1' },
              { name: 'dog2', type: 'Dog', value: 'dog_1', ref: 'dog_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'dog_1', type: 'Dog', fields: { name: '"Buddy"' }, highlight: true },
        ],
      },
      keyInsight:
        '참조 변수를 복사하면 주소가 복사됩니다. 두 변수가 같은 객체를 가리키게 됩니다.',
    },
    {
      line: 17,
      title: 'dog2로 수정',
      explanation:
        'dog2.name = "Max"는 dog_1 객체의 name을 바꿉니다. dog1도 같은 객체를 가리키므로 dog1.name도 "Max"입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'dog1', type: 'Dog', value: 'dog_1', ref: 'dog_1' },
              { name: 'dog2', type: 'Dog', value: 'dog_1', ref: 'dog_1' },
            ],
          },
        ],
        heap: [
          { id: 'dog_1', type: 'Dog', fields: { name: '"Max"' }, highlight: true },
        ],
      },
      analogy:
        '참조 변수는 "리모컨"입니다. 리모컨을 복사하면 같은 TV를 가리킵니다. 한 리모컨으로 채널을 바꾸면 다른 리모컨으로 봐도 바뀐 채널이 보입니다.',
    },
  ]),
};

const ch2_lesson4 = {
  lessonId: 'j-2-4',
  language: 'java',
  code: `class Point {
    int x, y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj instanceof Point) {
            Point other = (Point) obj;
            return this.x == other.x && this.y == other.y;
        }
        return false;
    }
}

public class EqualsMethod {
    public static void main(String[] args) {
        Point p1 = new Point(3, 4);
        Point p2 = new Point(3, 4);
        Point p3 = p1;

        // == : 같은 객체인가? (주소 비교)
        System.out.println("p1 == p2: " + (p1 == p2));  // false
        System.out.println("p1 == p3: " + (p1 == p3));  // true

        // equals: 같은 값인가? (내용 비교)
        System.out.println("p1.equals(p2): " + p1.equals(p2));  // true
        System.out.println("p1.equals(p3): " + p1.equals(p3));  // true
    }
}`,
  steps: JSON.stringify([
    {
      line: 20,
      title: '두 개의 Point 객체',
      explanation:
        'p1과 p2는 같은 좌표(3, 4)를 가지지만, 다른 객체입니다. 메모리에 2개의 객체가 존재합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'p1', type: 'Point', value: 'point_1', ref: 'point_1' },
              { name: 'p2', type: 'Point', value: 'point_2', ref: 'point_2' },
            ],
          },
        ],
        heap: [
          { id: 'point_1', type: 'Point', fields: { x: '3', y: '4' } },
          { id: 'point_2', type: 'Point', fields: { x: '3', y: '4' } },
        ],
      },
    },
    {
      line: 25,
      title: '== 비교',
      explanation:
        'p1 == p2는 주소를 비교합니다. point_1 ≠ point_2이므로 false입니다. p1 == p3은 같은 주소이므로 true입니다.',
      keyInsight: '== 는 "같은 객체인가?" (주소 비교)',
    },
    {
      line: 29,
      title: 'equals 비교',
      explanation:
        'p1.equals(p2)는 우리가 정의한 대로 x, y 값을 비교합니다. 값이 같으므로 true입니다.',
      keyInsight: 'equals()는 "같은 값인가?" (내용 비교) - 직접 오버라이드해야 함',
      analogy:
        '== 는 "같은 집인가?", equals()는 "집 안의 가구가 같은가?"를 묻습니다.',
    },
  ]),
};

const ch2_lesson5 = {
  lessonId: 'j-2-5',
  language: 'java',
  code: `public class ArrayIsObject {
    public static void main(String[] args) {
        // 배열도 객체다!
        int[] arr = new int[3];
        arr[0] = 10;
        arr[1] = 20;
        arr[2] = 30;

        // 배열 변수에는 주소가 저장됨
        System.out.println("arr = " + arr);  // [I@15db9742

        // 배열 복사의 함정
        int[] arr2 = arr;  // 주소 복사!
        arr2[0] = 999;

        System.out.println("arr[0] = " + arr[0]);   // 999!
        System.out.println("arr2[0] = " + arr2[0]); // 999

        // 진짜 복사하려면?
        int[] arr3 = arr.clone();
        arr3[0] = 111;
        System.out.println("arr[0] = " + arr[0]);   // 999 (그대로)
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '배열 생성',
      explanation:
        'new int[3]은 Heap에 배열 객체를 생성합니다. 배열도 객체이므로 참조 타입입니다.',
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
          { id: 'arr_1', type: 'int[3]', value: '[10, 20, 30]' },
        ],
      },
      keyInsight: '배열도 객체입니다! int[]는 기본 타입이 아닌 참조 타입입니다.',
    },
    {
      line: 13,
      title: '배열 복사의 함정',
      explanation:
        'arr2 = arr은 주소를 복사합니다. arr과 arr2는 같은 배열을 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'arr2', type: 'int[]', value: 'arr_1', ref: 'arr_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[999, 20, 30]', highlight: true },
        ],
      },
    },
    {
      line: 20,
      title: 'clone()으로 진짜 복사',
      explanation:
        'arr.clone()은 새로운 배열 객체를 만들어 반환합니다. 독립적인 복사본입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'arr2', type: 'int[]', value: 'arr_1', ref: 'arr_1' },
              { name: 'arr3', type: 'int[]', value: 'arr_3', ref: 'arr_3', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_1', type: 'int[3]', value: '[999, 20, 30]' },
          { id: 'arr_3', type: 'int[3]', value: '[111, 20, 30]', highlight: true },
        ],
      },
      analogy:
        '배열 할당(=)은 "같은 사진 앨범 공유", clone()은 "사진을 복사해서 새 앨범 만들기"입니다.',
    },
  ]),
};

const ch2_lesson6 = {
  lessonId: 'j-2-6',
  language: 'java',
  code: `public class MultiDimensionalArray {
    public static void main(String[] args) {
        // 2차원 배열 = 배열의 배열
        int[][] matrix = new int[2][3];
        matrix[0][0] = 1;
        matrix[0][1] = 2;
        matrix[1][0] = 4;

        // matrix는 무엇을 가리킬까?
        System.out.println("matrix = " + matrix);       // [[I@...
        System.out.println("matrix[0] = " + matrix[0]); // [I@...
        System.out.println("matrix[1] = " + matrix[1]); // [I@...

        // 각 행은 독립적인 배열!
        int[][] jagged = new int[2][];
        jagged[0] = new int[3];  // 첫 행: 3칸
        jagged[1] = new int[5];  // 둘째 행: 5칸
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '2차원 배열 생성',
      explanation:
        'int[2][3]은 "2개의 int[3] 배열을 담는 배열"을 만듭니다. 총 3개의 배열 객체가 Heap에 생성됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'matrix', type: 'int[][]', value: 'matrix_1', ref: 'matrix_1' },
            ],
          },
        ],
        heap: [
          { id: 'matrix_1', type: 'int[2][]', value: '[→row_0, →row_1]' },
          { id: 'row_0', type: 'int[3]', value: '[1, 2, 0]' },
          { id: 'row_1', type: 'int[3]', value: '[4, 0, 0]' },
        ],
      },
      keyInsight:
        '2차원 배열 = 배열의 배열. matrix는 int[] 참조들을 담는 배열입니다.',
    },
    {
      line: 10,
      title: 'matrix[0]은 배열',
      explanation:
        'matrix[0]은 첫 번째 행 배열(row_0)을 가리킵니다. 그래서 matrix[0][1]로 그 배열의 요소에 접근합니다.',
    },
    {
      line: 15,
      title: '가변 길이 배열',
      explanation:
        'Java에서 각 행은 독립적인 배열이므로, 행마다 길이가 다를 수 있습니다. 이를 jagged array라 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'matrix', type: 'int[][]', value: 'matrix_1', ref: 'matrix_1' },
              { name: 'jagged', type: 'int[][]', value: 'jagged_1', ref: 'jagged_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'matrix_1', type: 'int[2][]', value: '[→row_0, →row_1]' },
          { id: 'row_0', type: 'int[3]', value: '[1, 2, 0]' },
          { id: 'row_1', type: 'int[3]', value: '[4, 0, 0]' },
          { id: 'jagged_1', type: 'int[2][]', value: '[→jrow_0, →jrow_1]', highlight: true },
          { id: 'jrow_0', type: 'int[3]', value: '[0, 0, 0]' },
          { id: 'jrow_1', type: 'int[5]', value: '[0, 0, 0, 0, 0]' },
        ],
      },
      analogy:
        '2차원 배열은 "서랍장"입니다. 서랍장(matrix)에는 서랍(행 배열)들이 있고, 각 서랍 안에 물건(값)이 있습니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContent2() {
  console.log('☕ Seeding Java LessonContent - Chapter 2...\n');

  const contents = [
    ch2_lesson1,
    ch2_lesson2,
    ch2_lesson3,
    ch2_lesson4,
    ch2_lesson5,
    ch2_lesson6,
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

seedJavaContent2()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
