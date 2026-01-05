/**
 * Java Content Seed - Chapter 5: 클래스 설계
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 5: 클래스 설계
// =============================================

const ch5_lesson1 = {
  lessonId: 'j-5-1',
  language: 'java',
  code: `// 클래스 = 객체의 설계도
class Dog {
    // 필드 (데이터)
    String name;
    int age;

    // 메서드 (행동)
    void bark() {
        System.out.println(name + "이(가) 짖습니다!");
    }
}

public class ClassAsBlueprint {
    public static void main(String[] args) {
        // 클래스로 객체 생성
        Dog dog1 = new Dog();
        dog1.name = "바둑이";
        dog1.age = 3;

        Dog dog2 = new Dog();
        dog2.name = "멍멍이";
        dog2.age = 5;

        dog1.bark();  // 바둑이이(가) 짖습니다!
        dog2.bark();  // 멍멍이이(가) 짖습니다!
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '클래스 정의',
      explanation:
        '클래스는 객체를 만드는 "설계도"입니다. Dog 클래스는 name, age 필드와 bark() 메서드를 정의합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '클래스는 객체의 청사진입니다. 클래스 자체는 메모리에 객체를 만들지 않습니다.',
    },
    {
      line: 15,
      title: '첫 번째 객체 생성',
      explanation:
        'new Dog()로 Heap에 Dog 객체가 생성됩니다. dog1은 그 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'dog1', type: 'Dog', value: 'dog_1', ref: 'dog_1', highlight: true }],
          },
        ],
        heap: [
          {
            id: 'dog_1',
            type: 'Dog',
            fields: { name: '바둑이', age: '3' },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 19,
      title: '두 번째 객체 생성',
      explanation:
        '같은 클래스로 또 다른 객체를 생성합니다. 각 객체는 독립적인 데이터를 가집니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'dog1', type: 'Dog', value: 'dog_1', ref: 'dog_1' },
              { name: 'dog2', type: 'Dog', value: 'dog_2', ref: 'dog_2', highlight: true },
            ],
          },
        ],
        heap: [
          {
            id: 'dog_1',
            type: 'Dog',
            fields: { name: '바둑이', age: '3' },
          },
          {
            id: 'dog_2',
            type: 'Dog',
            fields: { name: '멍멍이', age: '5' },
            highlight: true,
          },
        ],
      },
      analogy:
        '클래스는 "붕어빵 틀"과 같습니다. 틀은 하나지만, 붕어빵은 여러 개 만들 수 있습니다. 각 붕어빵은 다른 속을 넣을 수 있습니다.',
    },
  ]),
};

const ch5_lesson2 = {
  lessonId: 'j-5-2',
  language: 'java',
  code: `class Person {
    String name;
    int age;

    // 생성자: 객체 초기화를 담당
    Person(String n, int a) {
        name = n;
        age = a;
    }

    void introduce() {
        System.out.println("저는 " + name + ", " + age + "살입니다.");
    }
}

public class Constructor {
    public static void main(String[] args) {
        // 생성자 호출 (객체 생성 + 초기화)
        Person p1 = new Person("철수", 20);
        Person p2 = new Person("영희", 25);

        p1.introduce();  // 저는 철수, 20살입니다.
        p2.introduce();  // 저는 영희, 25살입니다.
    }
}`,
  steps: JSON.stringify([
    {
      line: 6,
      title: '생성자 정의',
      explanation:
        '생성자는 클래스명과 같은 이름의 메서드입니다. 반환 타입이 없습니다. 객체 생성 시 자동 호출됩니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '생성자는 객체가 생성될 때 딱 한 번 호출됩니다. 객체의 초기 상태를 설정하는 역할을 합니다.',
    },
    {
      line: 19,
      title: 'new Person("철수", 20)',
      explanation:
        'new 키워드가 (1) Heap에 공간 할당, (2) 생성자 호출, (3) 주소 반환을 수행합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p1', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
          {
            name: 'Person(생성자)',
            variables: [
              { name: 'n', type: 'String', value: '철수' },
              { name: 'a', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: '철수', age: '20' },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 20,
      title: '두 번째 객체',
      explanation: '다른 인자로 생성자를 호출하면 다른 초기값을 가진 객체가 생성됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'p1', type: 'Person', value: 'person_1', ref: 'person_1' },
              { name: 'p2', type: 'Person', value: 'person_2', ref: 'person_2', highlight: true },
            ],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: '철수', age: '20' },
          },
          {
            id: 'person_2',
            type: 'Person',
            fields: { name: '영희', age: '25' },
            highlight: true,
          },
        ],
      },
      analogy:
        '생성자는 "공장의 조립 라인"과 같습니다. 부품(인자)을 넣으면 완성된 제품(초기화된 객체)이 나옵니다.',
    },
  ]),
};

const ch5_lesson3 = {
  lessonId: 'j-5-3',
  language: 'java',
  code: `class Person {
    String name;
    int age;

    // this = 이 객체 자신
    Person(String name, int age) {
        this.name = name;  // this.name = 필드, name = 매개변수
        this.age = age;
    }

    void printAddress() {
        System.out.println("이 객체: " + this);
    }
}

public class ThisKeyword {
    public static void main(String[] args) {
        Person p = new Person("철수", 20);
        p.printAddress();
        System.out.println("p가 가리키는: " + p);  // 같은 주소!
    }
}`,
  steps: JSON.stringify([
    {
      line: 6,
      title: '매개변수와 필드 이름 충돌',
      explanation:
        '생성자의 매개변수 name과 필드 name이 같은 이름입니다. 어떻게 구분할까요?',
      memoryChanges: {
        stack: [
          {
            name: 'Person(생성자)',
            variables: [
              { name: 'name', type: 'String', value: '철수' },
              { name: 'age', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: 'null', age: '0' },
          },
        ],
      },
    },
    {
      line: 7,
      title: 'this.name = name',
      explanation:
        'this.name은 이 객체의 필드, name은 매개변수입니다. this로 "내 것"을 명확히 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'Person(생성자)',
            variables: [
              { name: 'this', type: 'Person', value: 'person_1', ref: 'person_1', highlight: true },
              { name: 'name', type: 'String', value: '철수' },
              { name: 'age', type: 'int', value: '20' },
            ],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: '철수', age: '20' },
            highlight: true,
          },
        ],
      },
      keyInsight:
        'this는 "이 객체 자신"을 가리킵니다. 메서드/생성자 안에서 자신의 필드와 매개변수를 구분할 때 사용합니다.',
    },
    {
      line: 12,
      title: 'this 출력',
      explanation: 'this를 출력하면 객체의 주소(해시코드)가 나옵니다. p와 같은 값입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'p', type: 'Person', value: 'person_1', ref: 'person_1' }],
          },
          {
            name: 'printAddress',
            variables: [{ name: 'this', type: 'Person', value: 'person_1', ref: 'person_1', highlight: true }],
          },
        ],
        heap: [
          {
            id: 'person_1',
            type: 'Person',
            fields: { name: '철수', age: '20' },
          },
        ],
      },
      analogy:
        'this는 "나 자신"을 가리키는 이름표입니다. "내 이름은 철수입니다"에서 "내"가 this입니다.',
    },
  ]),
};

const ch5_lesson4 = {
  lessonId: 'j-5-4',
  language: 'java',
  code: `class Counter {
    int count = 0;  // 인스턴스 변수: 각 객체마다 독립

    void increment() {
        count++;
    }
}

public class InstanceVariable {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();

        c1.increment();
        c1.increment();
        c1.increment();

        c2.increment();

        System.out.println("c1.count: " + c1.count);  // 3
        System.out.println("c2.count: " + c2.count);  // 1
    }
}`,
  steps: JSON.stringify([
    {
      line: 11,
      title: '두 객체 생성',
      explanation: '각 객체는 자신만의 count 변수를 가집니다. 둘 다 초기값 0입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'c1', type: 'Counter', value: '0x100 →' },
              { name: 'c2', type: 'Counter', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Counter', fields: { count: 0 } },
          { address: '0x200', type: 'Counter', fields: { count: 0 } },
        ],
      },
      keyInsight:
        '인스턴스 변수는 각 객체마다 독립적으로 존재합니다. c1의 count와 c2의 count는 별개입니다.',
    },
    {
      line: 14,
      title: 'c1 세 번 증가',
      explanation: 'c1.increment()를 3번 호출합니다. c1의 count만 증가합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'c1', type: 'Counter', value: '0x100 →' },
              { name: 'c2', type: 'Counter', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Counter', fields: { count: 3 }, highlight: true },
          { address: '0x200', type: 'Counter', fields: { count: 0 } },
        ],
      },
    },
    {
      line: 18,
      title: 'c2 한 번 증가',
      explanation: 'c2.increment()를 호출합니다. c2의 count만 증가합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'c1', type: 'Counter', value: '0x100 →' },
              { name: 'c2', type: 'Counter', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Counter', fields: { count: 3 } },
          { address: '0x200', type: 'Counter', fields: { count: 1 }, highlight: true },
        ],
      },
      analogy:
        '인스턴스 변수는 "각자의 주머니"와 같습니다. 내 주머니에 동전을 넣어도 친구 주머니에는 영향이 없습니다.',
    },
  ]),
};

const ch5_lesson5 = {
  lessonId: 'j-5-5',
  language: 'java',
  code: `class Counter {
    static int totalCount = 0;  // static 변수: 클래스에 하나, 모든 객체가 공유
    int myCount = 0;            // 인스턴스 변수: 각 객체마다 독립

    void increment() {
        totalCount++;  // 공유 변수 증가
        myCount++;     // 개인 변수 증가
    }
}

public class StaticVariable {
    public static void main(String[] args) {
        Counter c1 = new Counter();
        Counter c2 = new Counter();

        c1.increment();
        c1.increment();
        c2.increment();

        System.out.println("c1.myCount: " + c1.myCount);      // 2
        System.out.println("c2.myCount: " + c2.myCount);      // 1
        System.out.println("totalCount: " + Counter.totalCount);  // 3
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: 'static 변수 선언',
      explanation:
        'static 변수는 클래스에 하나만 존재합니다. 객체를 만들지 않아도 존재합니다.',
      memoryChanges: {
        metaspace: [{ class: 'Counter', staticFields: { totalCount: 0 } }],
        stack: [],
        heap: [],
      },
      keyInsight:
        'static 변수는 클래스 로딩 시 Metaspace에 생성됩니다. 모든 객체가 같은 변수를 공유합니다.',
    },
    {
      line: 13,
      title: '객체 생성',
      explanation:
        '객체를 생성해도 static 변수는 새로 만들어지지 않습니다. 인스턴스 변수만 각 객체에 생성됩니다.',
      memoryChanges: {
        metaspace: [{ class: 'Counter', staticFields: { totalCount: 0 } }],
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'c1', type: 'Counter', value: '0x100 →' },
              { name: 'c2', type: 'Counter', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Counter', fields: { myCount: 0 } },
          { address: '0x200', type: 'Counter', fields: { myCount: 0 } },
        ],
      },
    },
    {
      line: 16,
      title: 'increment 3번 호출',
      explanation:
        'c1 2번, c2 1번 호출. totalCount는 3 (공유), myCount는 각각 2, 1 (독립)',
      memoryChanges: {
        metaspace: [
          { class: 'Counter', staticFields: { totalCount: 3 }, highlight: true },
        ],
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'c1', type: 'Counter', value: '0x100 →' },
              { name: 'c2', type: 'Counter', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Counter', fields: { myCount: 2 } },
          { address: '0x200', type: 'Counter', fields: { myCount: 1 } },
        ],
      },
      analogy:
        'static 변수는 "교실의 칠판"과 같습니다. 학생마다 개인 노트(인스턴스 변수)가 있지만, 칠판은 모두가 공유합니다.',
    },
  ]),
};

const ch5_lesson6 = {
  lessonId: 'j-5-6',
  language: 'java',
  code: `class MathUtils {
    // static 메서드: 객체 없이 호출 가능
    static int add(int a, int b) {
        return a + b;
    }

    static int multiply(int a, int b) {
        return a * b;
    }

    // static 메서드에서는 this 사용 불가!
    // void printThis() { System.out.println(this); }  // 컴파일 에러
}

public class StaticMethod {
    public static void main(String[] args) {
        // 객체 생성 없이 바로 호출
        int sum = MathUtils.add(3, 5);
        int product = MathUtils.multiply(4, 6);

        System.out.println("합: " + sum);       // 8
        System.out.println("곱: " + product);   // 24

        // Math 클래스도 static 메서드 사용
        double sqrt = Math.sqrt(16);
        System.out.println("제곱근: " + sqrt);  // 4.0
    }
}`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'static 메서드 정의',
      explanation:
        'static 메서드는 클래스에 속한 메서드입니다. 객체를 만들지 않아도 호출할 수 있습니다.',
      memoryChanges: {
        metaspace: [
          {
            class: 'MathUtils',
            staticMethods: ['add(int, int)', 'multiply(int, int)'],
          },
        ],
        stack: [],
        heap: [],
      },
      keyInsight:
        'static 메서드는 객체가 없어도 호출할 수 있습니다. 대신 this를 사용할 수 없습니다 (가리킬 객체가 없으니까).',
    },
    {
      line: 18,
      title: 'MathUtils.add(3, 5)',
      explanation:
        '클래스명.메서드명()으로 호출합니다. 객체를 만들지 않았습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'sum', type: 'int', value: 8, highlight: true }],
          },
          {
            name: 'MathUtils.add',
            variables: [
              { name: 'a', type: 'int', value: 3 },
              { name: 'b', type: 'int', value: 5 },
            ],
          },
        ],
        heap: [],
      },
    },
    {
      line: 25,
      title: 'Math.sqrt() 사용',
      explanation:
        'Java의 Math 클래스도 static 메서드들로 구성되어 있습니다. 객체 생성 없이 바로 사용합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'sum', type: 'int', value: 8 },
              { name: 'product', type: 'int', value: 24 },
              { name: 'sqrt', type: 'double', value: 4.0, highlight: true },
            ],
          },
        ],
        heap: [],
      },
      analogy:
        'static 메서드는 "공용 도구함"의 도구와 같습니다. 누구나 바로 사용할 수 있고, 개인 물건(객체 필드)에 접근하지 않습니다.',
    },
  ]),
};

const ch5_lesson7 = {
  lessonId: 'j-5-7',
  language: 'java',
  code: `class Circle {
    final double PI = 3.14159;  // final 필드: 한 번 초기화 후 변경 불가
    final double radius;

    Circle(double r) {
        this.radius = r;  // 생성자에서 딱 한 번 초기화 가능
    }

    double getArea() {
        return PI * radius * radius;
    }
}

public class FinalKeyword {
    public static void main(String[] args) {
        final int MAX = 100;  // final 지역 변수
        // MAX = 200;  // 컴파일 에러!

        Circle c = new Circle(5);
        System.out.println("넓이: " + c.getArea());

        // c.radius = 10;  // 컴파일 에러! final이므로 변경 불가

        // final 참조 변수
        final Circle c2 = c;
        // c2 = new Circle(10);  // 컴파일 에러! 참조 변경 불가
        // 하지만 객체 내용은 변경 가능 (final이 아닌 필드가 있다면)
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: 'final 필드',
      explanation:
        'final 필드는 한 번 초기화되면 변경할 수 없습니다. 상수로 사용됩니다.',
      memoryChanges: {
        stack: [],
        heap: [
          {
            address: '0x100',
            type: 'Circle',
            fields: { PI: 3.14159, radius: 5 },
            note: 'PI, radius 모두 final',
          },
        ],
      },
      keyInsight:
        'final은 "최종", "변경 불가"를 의미합니다. 변수에 붙이면 재할당 금지, 메서드에 붙이면 오버라이딩 금지, 클래스에 붙이면 상속 금지.',
    },
    {
      line: 16,
      title: 'final 지역 변수',
      explanation: 'final 지역 변수도 한 번 초기화 후 변경할 수 없습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'MAX', type: 'int', value: 100, note: 'final' },
              { name: 'c', type: 'Circle', value: '0x100 →' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Circle',
            fields: { PI: 3.14159, radius: 5 },
          },
        ],
      },
    },
    {
      line: 24,
      title: 'final 참조 변수',
      explanation:
        'final 참조 변수는 다른 객체를 가리키도록 변경할 수 없습니다. 하지만 객체의 내용(필드)은 변경 가능합니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'MAX', type: 'int', value: 100, note: 'final' },
              { name: 'c', type: 'Circle', value: '0x100 →' },
              {
                name: 'c2',
                type: 'Circle',
                value: '0x100 →',
                note: 'final (다른 객체 가리킬 수 없음)',
                highlight: true,
              },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Circle',
            fields: { PI: 3.14159, radius: 5 },
          },
        ],
      },
      analogy:
        'final 참조 변수는 "주소록에 고정된 집 주소"와 같습니다. 주소를 바꿀 순 없지만, 그 집 안의 가구 배치는 바꿀 수 있습니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContentCh5() {
  console.log('☕ Seeding Java LessonContent - Chapter 5 (클래스 설계)...\n');

  const contents = [
    ch5_lesson1,
    ch5_lesson2,
    ch5_lesson3,
    ch5_lesson4,
    ch5_lesson5,
    ch5_lesson6,
    ch5_lesson7,
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

seedJavaContentCh5()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
