/**
 * Java Content Seed - Chapter 4: 메서드와 매개변수
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 4: 메서드와 매개변수
// =============================================

const ch4_lesson1 = {
  lessonId: 'j-4-1',
  language: 'java',
  code: `public class StackFrame {
    public static void main(String[] args) {
        int x = 10;
        int result = addOne(x);
        System.out.println(result);  // 11
    }

    static int addOne(int n) {
        n = n + 1;
        return n;
    }
}`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'main 시작',
      explanation: 'main 메서드의 Stack Frame이 생성됩니다. x = 10이 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'x', type: 'int', value: '10' }],
          },
        ],
        heap: [],
      },
    },
    {
      line: 4,
      title: 'addOne 호출',
      explanation:
        'addOne 메서드의 Stack Frame이 main 위에 쌓입니다. x의 값 10이 n에 복사됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'x', type: 'int', value: '10' }],
          },
          {
            name: 'addOne',
            variables: [{ name: 'n', type: 'int', value: '10', highlight: true }],
          },
        ],
        heap: [],
      },
      keyInsight:
        '메서드 호출 = 새 Stack Frame 생성. 매개변수는 호출 시 값이 복사되어 전달됩니다.',
    },
    {
      line: 8,
      title: 'n 수정',
      explanation: 'addOne의 n이 11로 변경됩니다. main의 x는 그대로입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'x', type: 'int', value: '10' }],
          },
          {
            name: 'addOne',
            variables: [{ name: 'n', type: 'int', value: '11', highlight: true }],
          },
        ],
        heap: [],
      },
    },
    {
      line: 9,
      title: 'return',
      explanation: '11을 반환하고 addOne Stack Frame이 제거됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'x', type: 'int', value: '10' },
              { name: 'result', type: 'int', value: '11', highlight: true },
            ],
          },
        ],
        heap: [],
      },
      analogy:
        '메서드 호출은 새 방에 들어가는 것입니다. 들어갈 때 필요한 값을 복사해서 가져가고, 방을 나오면 그 방의 모든 것은 사라집니다.',
    },
  ]),
};

const ch4_lesson2 = {
  lessonId: 'j-4-2',
  language: 'java',
  code: `public class PrimitivePass {
    public static void main(String[] args) {
        int a = 10;
        int b = 20;

        System.out.println("전: a=" + a + ", b=" + b);
        changeValues(a, b);
        System.out.println("후: a=" + a + ", b=" + b);
    }

    static void changeValues(int x, int y) {
        x = 100;
        y = 200;
        System.out.println("내부: x=" + x + ", y=" + y);
    }
}

// 출력:
// 전: a=10, b=20
// 내부: x=100, y=200
// 후: a=10, b=20  <-- 변경 안 됨!`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '변수 선언',
      explanation: 'main에 a=10, b=20이 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [],
      },
    },
    {
      line: 7,
      title: 'changeValues 호출',
      explanation: 'a, b의 값이 x, y에 복사됩니다. x, y는 a, b와 완전히 별개입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '20' },
            ],
          },
          {
            name: 'changeValues',
            variables: [
              { name: 'x', type: 'int', value: '10', highlight: true },
              { name: 'y', type: 'int', value: '20', highlight: true },
            ],
          },
        ],
        heap: [],
      },
      keyInsight:
        '기본 타입은 값 자체가 복사되어 전달됩니다. 메서드 안에서 아무리 바꿔도 원본에 영향이 없습니다!',
    },
    {
      line: 12,
      title: 'x, y 수정',
      explanation: 'changeValues의 x, y만 변경됩니다. main의 a, b는 그대로입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '20' },
            ],
          },
          {
            name: 'changeValues',
            variables: [
              { name: 'x', type: 'int', value: '100', highlight: true },
              { name: 'y', type: 'int', value: '200', highlight: true },
            ],
          },
        ],
        heap: [],
      },
    },
    {
      line: 8,
      title: '메서드 종료 후',
      explanation: 'changeValues가 종료됩니다. a, b는 처음 그대로입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int', value: '10' },
              { name: 'b', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [],
      },
      analogy:
        '기본 타입 전달은 숫자를 메모지에 적어서 전달하는 것입니다. 받은 사람이 메모를 고쳐도 내 원본 메모는 그대로입니다.',
    },
  ]),
};

const ch4_lesson3 = {
  lessonId: 'j-4-3',
  language: 'java',
  code: `public class ReferencePass {
    public static void main(String[] args) {
        int[] arr = {1, 2, 3};

        System.out.println("전: " + arr[0]);  // 1
        modifyArray(arr);
        System.out.println("후: " + arr[0]);  // 100 - 변경됨!
    }

    static void modifyArray(int[] a) {
        a[0] = 100;  // 같은 객체를 수정
    }
}`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '배열 생성',
      explanation: 'Heap에 배열이 생성되고, arr은 그 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' }],
          },
        ],
        heap: [{ id: 'arr_1', type: 'int[]', value: '[1, 2, 3]' }],
      },
    },
    {
      line: 6,
      title: 'modifyArray 호출',
      explanation:
        'arr의 값(주소)이 a에 복사됩니다. 객체가 아니라 주소가 복사된 것입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' }],
          },
          {
            name: 'modifyArray',
            variables: [{ name: 'a', type: 'int[]', value: 'arr_1', ref: 'arr_1', highlight: true }],
          },
        ],
        heap: [{ id: 'arr_1', type: 'int[]', value: '[1, 2, 3]' }],
      },
      keyInsight:
        '참조 타입도 "주소 값"이 복사되는 것입니다! 객체 자체가 전달되는 게 아닙니다. 하지만 같은 주소를 가지므로 같은 객체를 가리킵니다.',
    },
    {
      line: 11,
      title: 'a[0] 수정',
      explanation:
        'a가 가리키는 배열(= arr이 가리키는 배열)의 첫 번째 요소를 수정합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' }],
          },
          {
            name: 'modifyArray',
            variables: [{ name: 'a', type: 'int[]', value: 'arr_1', ref: 'arr_1' }],
          },
        ],
        heap: [
          {
            id: 'arr_1',
            type: 'int[]',
            value: '[100, 2, 3]',
            highlight: true,
          },
        ],
      },
    },
    {
      line: 7,
      title: '메서드 종료 후',
      explanation: 'arr이 가리키는 배열의 내용이 바뀌어 있습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'arr', type: 'int[]', value: 'arr_1', ref: 'arr_1' }],
          },
        ],
        heap: [{ id: 'arr_1', type: 'int[]', value: '[100, 2, 3]' }],
      },
      analogy:
        '참조 타입 전달은 집 열쇠를 복사해서 주는 것입니다. 받은 사람도 같은 집에 들어갈 수 있으니 가구 배치를 바꾸면 내가 보는 집도 바뀝니다!',
    },
  ]),
};

const ch4_lesson4 = {
  lessonId: 'j-4-4',
  language: 'java',
  code: `public class SwapFail {
    public static void main(String[] args) {
        int[] a = {1, 2, 3};
        int[] b = {10, 20, 30};

        System.out.println("전: a[0]=" + a[0] + ", b[0]=" + b[0]);
        swap(a, b);
        System.out.println("후: a[0]=" + a[0] + ", b[0]=" + b[0]);
    }

    static void swap(int[] x, int[] y) {
        int[] temp = x;
        x = y;
        y = temp;
        // x, y 참조만 바뀜. a, b는 그대로!
    }
}

// 출력:
// 전: a[0]=1, b[0]=10
// 후: a[0]=1, b[0]=10  <-- swap 안 됨!`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '배열 2개 생성',
      explanation: 'a와 b가 각각 다른 배열을 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int[]', value: 'arr_a', ref: 'arr_a' },
              { name: 'b', type: 'int[]', value: 'arr_b', ref: 'arr_b' },
            ],
          },
        ],
        heap: [
          { id: 'arr_a', type: 'int[]', value: '[1, 2, 3]' },
          { id: 'arr_b', type: 'int[]', value: '[10, 20, 30]' },
        ],
      },
    },
    {
      line: 7,
      title: 'swap 호출',
      explanation: 'a, b의 주소가 x, y에 복사됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int[]', value: 'arr_a', ref: 'arr_a' },
              { name: 'b', type: 'int[]', value: 'arr_b', ref: 'arr_b' },
            ],
          },
          {
            name: 'swap',
            variables: [
              { name: 'x', type: 'int[]', value: 'arr_a', ref: 'arr_a', highlight: true },
              { name: 'y', type: 'int[]', value: 'arr_b', ref: 'arr_b', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'arr_a', type: 'int[]', value: '[1, 2, 3]' },
          { id: 'arr_b', type: 'int[]', value: '[10, 20, 30]' },
        ],
      },
      keyInsight:
        'Java는 항상 Call by Value입니다! 참조 변수도 "주소 값"이 복사되는 것입니다. 메서드 안에서 참조 자체를 바꿔봤자 원본 참조는 그대로입니다.',
    },
    {
      line: 14,
      title: 'swap 내부에서 교환',
      explanation: 'x, y의 주소가 서로 바뀝니다. 하지만 a, b는 변하지 않습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int[]', value: 'arr_a', ref: 'arr_a' },
              { name: 'b', type: 'int[]', value: 'arr_b', ref: 'arr_b' },
            ],
          },
          {
            name: 'swap',
            variables: [
              { name: 'x', type: 'int[]', value: 'arr_b', ref: 'arr_b', highlight: true },
              { name: 'y', type: 'int[]', value: 'arr_a', ref: 'arr_a', highlight: true },
              { name: 'temp', type: 'int[]', value: 'arr_a', ref: 'arr_a' },
            ],
          },
        ],
        heap: [
          { id: 'arr_a', type: 'int[]', value: '[1, 2, 3]' },
          { id: 'arr_b', type: 'int[]', value: '[10, 20, 30]' },
        ],
      },
    },
    {
      line: 8,
      title: 'swap 종료 후',
      explanation: 'swap의 Stack Frame이 제거됩니다. a, b는 처음 그대로입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'int[]', value: 'arr_a', ref: 'arr_a' },
              { name: 'b', type: 'int[]', value: 'arr_b', ref: 'arr_b' },
            ],
          },
        ],
        heap: [
          { id: 'arr_a', type: 'int[]', value: '[1, 2, 3]' },
          { id: 'arr_b', type: 'int[]', value: '[10, 20, 30]' },
        ],
      },
      analogy:
        '열쇠 복사본을 받아서 다른 열쇠와 바꿔도, 원래 내 열쇠는 그대로입니다. 복사본끼리 바꾼 것이니까요!',
    },
  ]),
};

const ch4_lesson5 = {
  lessonId: 'j-4-5',
  language: 'java',
  code: `class Person {
    String name;
    Person(String name) { this.name = name; }
}

public class ModifyContent {
    public static void main(String[] args) {
        Person p = new Person("Alice");

        System.out.println("전: " + p.name);  // Alice
        changeName(p);
        System.out.println("후: " + p.name);  // Bob - 변경됨!
    }

    static void changeName(Person person) {
        person.name = "Bob";  // 같은 객체의 내용 수정
    }
}`,
  steps: JSON.stringify([
    {
      line: 8,
      title: 'Person 생성',
      explanation: 'Heap에 Person 객체가 생성되고, p는 그 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: 'Alice' },
          },
        ],
      },
    },
    {
      line: 11,
      title: 'changeName 호출',
      explanation:
        'p의 주소가 person에 복사됩니다. 둘 다 같은 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
          {
            name: 'changeName',
            variables: [{ name: 'person', type: 'Person', value: 'person_1', ref: 'person_1', highlight: true }],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: 'Alice' },
          },
        ],
      },
    },
    {
      line: 16,
      title: 'name 수정',
      explanation: 'person이 가리키는 객체(= p가 가리키는 객체)의 name을 수정합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
          {
            name: 'changeName',
            variables: [{ name: 'person', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: 'Bob' },
            highlight: true,
          },
        ],
      },
      keyInsight:
        '참조 자체를 바꾸는 건 안 되지만, 참조가 가리키는 객체의 내용을 바꾸는 건 가능합니다! 같은 객체를 가리키니까요.',
    },
    {
      line: 12,
      title: '메서드 종료 후',
      explanation: 'p가 가리키는 객체의 name이 Bob으로 바뀌어 있습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: 'Bob' },
          },
        ],
      },
      analogy:
        '열쇠 복사본으로 집에 들어가서 가구 배치를 바꾸면, 원래 열쇠로 들어가도 바뀐 가구 배치가 보입니다. 같은 집이니까요!',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContentCh4() {
  console.log('☕ Seeding Java LessonContent - Chapter 4 (메서드와 매개변수)...\n');

  const contents = [ch4_lesson1, ch4_lesson2, ch4_lesson3, ch4_lesson4, ch4_lesson5];

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

seedJavaContentCh4()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
