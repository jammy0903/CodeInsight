/**
 * Java Content Seed - Chapter 7: 인터페이스
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 7: 인터페이스
// =============================================

const ch7_lesson1 = {
  lessonId: 'j-7-1',
  language: 'java',
  code: `// 인터페이스: "이것을 할 수 있다"는 약속
interface Flyable {
    void fly();  // 구현 없이 선언만!
}

interface Swimmable {
    void swim();
}

// 인터페이스는 객체를 만들 수 없다
// Flyable f = new Flyable();  // 컴파일 에러!

public class InterfaceIntro {
    public static void main(String[] args) {
        // 인터페이스는 "계약서"와 같다
        // "fly() 메서드를 반드시 가질 것"이라는 약속
        System.out.println("인터페이스 = 능력의 약속");
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '인터페이스 선언',
      explanation:
        'interface 키워드로 선언합니다. 메서드는 선언만 하고 구현하지 않습니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '인터페이스는 "무엇을 할 수 있는지"만 정의합니다. "어떻게 하는지"는 구현 클래스가 결정합니다.',
    },
    {
      line: 3,
      title: 'void fly()',
      explanation:
        '메서드 선언만 있고 본문({})이 없습니다. 구현 클래스가 반드시 구현해야 합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
    },
    {
      line: 10,
      title: '인터페이스로 객체 생성 불가',
      explanation:
        '인터페이스는 구현이 없으므로 직접 객체를 만들 수 없습니다. 구현 클래스가 필요합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      analogy:
        '인터페이스는 "자격증"과 같습니다. 운전면허(Drivable)가 있으면 "운전할 수 있다"는 것이 보장됩니다. 하지만 면허증 자체가 차는 아닙니다.',
    },
  ]),
};

const ch7_lesson2 = {
  lessonId: 'j-7-2',
  language: 'java',
  code: `interface Flyable {
    void fly();
}

// implements로 인터페이스 구현
class Bird implements Flyable {
    @Override
    public void fly() {  // 반드시 구현해야 함!
        System.out.println("새가 날개로 납니다");
    }
}

class Airplane implements Flyable {
    @Override
    public void fly() {
        System.out.println("비행기가 엔진으로 납니다");
    }
}

public class ImplementsKeyword {
    public static void main(String[] args) {
        Bird bird = new Bird();
        Airplane plane = new Airplane();

        bird.fly();   // 새가 날개로 납니다
        plane.fly();  // 비행기가 엔진으로 납니다
    }
}`,
  steps: JSON.stringify([
    {
      line: 6,
      title: 'implements Flyable',
      explanation:
        'Bird 클래스가 Flyable 인터페이스를 구현합니다. fly() 메서드를 반드시 구현해야 합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        'implements는 "이 인터페이스의 모든 메서드를 구현하겠다"는 약속입니다. 하나라도 빠지면 컴파일 에러!',
    },
    {
      line: 8,
      title: 'public void fly()',
      explanation:
        '인터페이스의 메서드를 구현합니다. 인터페이스 메서드는 기본적으로 public이므로 구현도 public이어야 합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
    },
    {
      line: 23,
      title: '다른 구현, 같은 인터페이스',
      explanation:
        'Bird와 Airplane은 둘 다 Flyable이지만, fly()의 구현 방식이 다릅니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'bird', type: 'Bird', value: '0x100 →' },
              { name: 'plane', type: 'Airplane', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Bird', note: 'fly(): "날개로..."' },
          { address: '0x200', type: 'Airplane', note: 'fly(): "엔진으로..."' },
        ],
      },
      analogy:
        '인터페이스는 "USB 포트"와 같습니다. 마우스든 키보드든 USB만 지원하면 연결할 수 있습니다. 구현 방식(마우스 vs 키보드)은 각자 다릅니다.',
    },
  ]),
};

const ch7_lesson3 = {
  lessonId: 'j-7-3',
  language: 'java',
  code: `interface Flyable {
    void fly();
}

interface Swimmable {
    void swim();
}

// 다중 구현: 여러 인터페이스 동시 구현 가능!
class Duck implements Flyable, Swimmable {
    @Override
    public void fly() {
        System.out.println("오리가 날아갑니다");
    }

    @Override
    public void swim() {
        System.out.println("오리가 수영합니다");
    }
}

public class MultipleInterface {
    public static void main(String[] args) {
        Duck duck = new Duck();
        duck.fly();   // 오리가 날아갑니다
        duck.swim();  // 오리가 수영합니다

        // 다양한 타입으로 참조 가능
        Flyable f = duck;
        Swimmable s = duck;

        f.fly();   // OK
        s.swim();  // OK
        // f.swim();  // 컴파일 에러! Flyable에는 swim()이 없음
    }
}`,
  steps: JSON.stringify([
    {
      line: 10,
      title: 'implements Flyable, Swimmable',
      explanation:
        '콤마로 구분하여 여러 인터페이스를 동시에 구현합니다. 모든 메서드를 구현해야 합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        'Java는 클래스 다중 상속은 안 되지만, 인터페이스 다중 구현은 가능합니다! 여러 능력을 가질 수 있습니다.',
    },
    {
      line: 29,
      title: '다양한 타입으로 참조',
      explanation:
        'Duck은 Flyable이기도 하고 Swimmable이기도 합니다. 어떤 타입으로 보느냐에 따라 사용 가능한 메서드가 다릅니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'duck', type: 'Duck', value: '0x100 →' },
              { name: 'f', type: 'Flyable', value: '0x100 →' },
              { name: 's', type: 'Swimmable', value: '0x100 →' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Duck',
            note: 'Flyable + Swimmable 모두 구현',
            highlight: true,
          },
        ],
      },
      analogy:
        '다중 구현은 "여러 자격증"과 같습니다. 운전면허(Flyable)도 있고 수영자격증(Swimmable)도 있으면, 상황에 따라 다른 능력을 발휘할 수 있습니다.',
    },
  ]),
};

const ch7_lesson4 = {
  lessonId: 'j-7-4',
  language: 'java',
  code: `interface Drawable {
    void draw();
}

class Circle implements Drawable {
    @Override
    public void draw() { System.out.println("○"); }
}

class Rectangle implements Drawable {
    @Override
    public void draw() { System.out.println("□"); }
}

class Triangle implements Drawable {
    @Override
    public void draw() { System.out.println("△"); }
}

public class InterfacePolymorphism {
    public static void main(String[] args) {
        // 인터페이스 타입으로 다양한 객체를 다룸
        Drawable[] shapes = {
            new Circle(),
            new Rectangle(),
            new Triangle()
        };

        // 같은 코드, 다른 동작 (다형성!)
        for (Drawable shape : shapes) {
            shape.draw();
        }
    }

    // 인터페이스를 매개변수로 받는 메서드
    static void drawTwice(Drawable d) {
        d.draw();
        d.draw();
    }
}`,
  steps: JSON.stringify([
    {
      line: 23,
      title: 'Drawable 배열',
      explanation:
        '인터페이스 타입 배열에 다양한 구현 클래스 객체를 담습니다. 느슨한 결합의 시작입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'shapes', type: 'Drawable[]', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Drawable[]',
            values: ['0x200 →', '0x300 →', '0x400 →'],
          },
          { address: '0x200', type: 'Circle' },
          { address: '0x300', type: 'Rectangle' },
          { address: '0x400', type: 'Triangle' },
        ],
      },
      keyInsight:
        '인터페이스를 사용하면 구현 클래스가 바뀌어도 코드를 수정할 필요가 없습니다. 이것이 "느슨한 결합"입니다.',
    },
    {
      line: 30,
      title: 'shape.draw() 호출',
      explanation:
        '같은 draw() 호출이지만, 실제 객체에 따라 ○, □, △가 출력됩니다. 인터페이스 다형성입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'for 루프',
            variables: [{ name: 'shape', type: 'Drawable', value: '0x200 →' }],
          },
        ],
        heap: [
          { address: '0x200', type: 'Circle', note: 'draw() → "○"', highlight: true },
          { address: '0x300', type: 'Rectangle', note: 'draw() → "□"' },
          { address: '0x400', type: 'Triangle', note: 'draw() → "△"' },
        ],
      },
    },
    {
      line: 36,
      title: '인터페이스를 매개변수로',
      explanation:
        'Drawable 인터페이스를 매개변수로 받으면, Circle, Rectangle, Triangle 어떤 것이든 전달할 수 있습니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      analogy:
        '인터페이스는 "콘센트 규격"과 같습니다. 220V 규격(인터페이스)만 맞으면 어떤 가전제품이든 꽂을 수 있습니다. 제조사(구현 클래스)가 달라도 상관없습니다.',
    },
  ]),
};

const ch7_lesson5 = {
  lessonId: 'j-7-5',
  language: 'java',
  code: `// 추상 클래스: 일부 구현 + 일부 미구현
abstract class Animal {
    String name;  // 필드 가질 수 있음

    Animal(String name) {  // 생성자 가질 수 있음
        this.name = name;
    }

    void eat() {  // 일반 메서드 (구현 있음)
        System.out.println(name + " 먹습니다");
    }

    abstract void speak();  // 추상 메서드 (구현 없음)
}

// 인터페이스: 순수한 약속
interface Flyable {
    void fly();  // 모든 메서드가 추상
}

class Bird extends Animal implements Flyable {
    Bird(String name) { super(name); }

    @Override
    void speak() { System.out.println("짹짹!"); }

    @Override
    public void fly() { System.out.println("훨훨~"); }
}

public class AbstractVsInterface {
    public static void main(String[] args) {
        Bird bird = new Bird("참새");
        bird.eat();    // 부모의 구현 사용
        bird.speak();  // 직접 구현
        bird.fly();    // 인터페이스 구현
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: 'abstract class',
      explanation:
        '추상 클래스는 필드, 생성자, 일반 메서드를 가질 수 있습니다. 추상 메서드도 가질 수 있습니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '추상 클래스는 "부분적으로 완성된 설계도"입니다. 공통 기능은 구현하고, 다른 부분만 자식이 구현하게 합니다.',
    },
    {
      line: 17,
      title: 'interface',
      explanation:
        '인터페이스는 순수한 약속입니다. 필드(상수 제외), 생성자 없이 메서드 선언만 있습니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
    },
    {
      line: 21,
      title: 'extends + implements',
      explanation:
        '클래스는 하나만 상속(extends)할 수 있지만, 인터페이스는 여러 개 구현(implements)할 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'bird', type: 'Bird', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Bird',
            fields: { name: '"참새"' },
            note: 'Animal 상속 + Flyable 구현',
          },
        ],
      },
      analogy:
        '추상 클래스는 "반쯤 완성된 레고 세트"와 같습니다. 기본 조립은 되어 있고, 나머지만 완성하면 됩니다. 인터페이스는 "부품 연결 규격"과 같습니다. 어떤 부품이든 규격만 맞으면 연결할 수 있습니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContentCh7() {
  console.log('☕ Seeding Java LessonContent - Chapter 7 (인터페이스)...\n');

  const contents = [
    ch7_lesson1,
    ch7_lesson2,
    ch7_lesson3,
    ch7_lesson4,
    ch7_lesson5,
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

seedJavaContentCh7()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
