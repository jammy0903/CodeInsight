/**
 * Java Content Seed - Chapter 6: 상속과 다형성
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 6: 상속과 다형성
// =============================================

const ch6_lesson1 = {
  lessonId: 'j-6-1',
  language: 'java',
  code: `// 부모 클래스
class Animal {
    String name;

    void eat() {
        System.out.println(name + "이(가) 먹습니다.");
    }
}

// 자식 클래스: extends로 상속
class Dog extends Animal {
    void bark() {
        System.out.println(name + "이(가) 짖습니다!");
    }
}

public class Inheritance {
    public static void main(String[] args) {
        Dog dog = new Dog();
        dog.name = "바둑이";  // 부모의 필드 사용
        dog.eat();           // 부모의 메서드 사용
        dog.bark();          // 자신의 메서드 사용
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '부모 클래스 Animal',
      explanation: 'Animal 클래스는 name 필드와 eat() 메서드를 가집니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
    },
    {
      line: 10,
      title: 'Dog extends Animal',
      explanation:
        'Dog는 Animal을 상속받습니다. Dog는 Animal의 모든 필드와 메서드를 물려받습니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '상속은 코드 재사용의 핵심입니다. 자식 클래스는 부모의 모든 것을 물려받고, 자신만의 기능을 추가할 수 있습니다.',
    },
    {
      line: 17,
      title: 'Dog 객체 생성',
      explanation:
        'Dog 객체는 Animal의 name 필드도 가집니다. 부모의 것도 내 것처럼 사용합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'dog', type: 'Dog', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            fields: { name: '"바둑이"' },
            note: 'Animal의 필드도 포함',
            highlight: true,
          },
        ],
      },
      analogy:
        '상속은 "가족의 재산 상속"과 같습니다. 부모님의 집과 차를 물려받으면, 내 것처럼 사용하면서 새 가구를 추가할 수 있습니다.',
    },
  ]),
};

const ch6_lesson2 = {
  lessonId: 'j-6-2',
  language: 'java',
  code: `class Animal {
    void speak() {
        System.out.println("동물이 소리를 냅니다.");
    }
}

class Dog extends Animal {
    @Override  // 오버라이딩: 부모 메서드를 재정의
    void speak() {
        System.out.println("멍멍!");
    }
}

class Cat extends Animal {
    @Override
    void speak() {
        System.out.println("야옹!");
    }
}

public class Override {
    public static void main(String[] args) {
        Animal a = new Animal();
        Dog d = new Dog();
        Cat c = new Cat();

        a.speak();  // 동물이 소리를 냅니다.
        d.speak();  // 멍멍!
        c.speak();  // 야옹!
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '부모의 speak()',
      explanation: 'Animal의 speak()는 일반적인 메시지를 출력합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
    },
    {
      line: 9,
      title: 'Dog이 speak() 오버라이딩',
      explanation:
        'Dog는 부모의 speak()를 자신에게 맞게 재정의합니다. @Override 어노테이션은 오버라이딩임을 명시합니다.',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        '오버라이딩은 부모의 메서드를 자식이 "덮어쓰기"하는 것입니다. 메서드 이름과 매개변수가 같아야 합니다.',
    },
    {
      line: 27,
      title: '각각 speak() 호출',
      explanation:
        '같은 메서드 이름이지만, 각 객체의 타입에 따라 다른 동작을 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Animal', value: '0x100 →' },
              { name: 'd', type: 'Dog', value: '0x200 →' },
              { name: 'c', type: 'Cat', value: '0x300 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Animal', note: 'speak(): "동물이..."' },
          { address: '0x200', type: 'Dog', note: 'speak(): "멍멍!"', highlight: true },
          { address: '0x300', type: 'Cat', note: 'speak(): "야옹!"', highlight: true },
        ],
      },
      analogy:
        '오버라이딩은 "회사의 업무 매뉴얼을 부서별로 수정"하는 것과 같습니다. 본사 매뉴얼이 있지만, 각 부서는 자신에게 맞게 수정해서 사용합니다.',
    },
  ]),
};

const ch6_lesson3 = {
  lessonId: 'j-6-3',
  language: 'java',
  code: `class Animal {
    String name;

    Animal(String name) {
        this.name = name;
        System.out.println("Animal 생성: " + name);
    }

    void eat() {
        System.out.println(name + " 먹습니다.");
    }
}

class Dog extends Animal {
    String breed;

    Dog(String name, String breed) {
        super(name);  // 부모 생성자 호출 (반드시 첫 줄!)
        this.breed = breed;
        System.out.println("Dog 생성: " + breed);
    }

    @Override
    void eat() {
        super.eat();  // 부모의 eat() 호출
        System.out.println("사료를 먹습니다.");
    }
}

public class SuperKeyword {
    public static void main(String[] args) {
        Dog dog = new Dog("바둑이", "진돗개");
        dog.eat();
    }
}

// 출력:
// Animal 생성: 바둑이
// Dog 생성: 진돗개
// 바둑이 먹습니다.
// 사료를 먹습니다.`,
  steps: JSON.stringify([
    {
      line: 17,
      title: 'super(name) 호출',
      explanation:
        'super()는 부모 생성자를 호출합니다. 반드시 생성자의 첫 줄에 와야 합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [],
          },
          {
            name: 'Dog(생성자)',
            variables: [
              { name: 'name', type: 'String', value: '"바둑이"' },
              { name: 'breed', type: 'String', value: '"진돗개"' },
            ],
          },
          {
            name: 'Animal(생성자)',
            variables: [{ name: 'name', type: 'String', value: '"바둑이"' }],
            highlight: true,
          },
        ],
        heap: [],
      },
      keyInsight:
        'super()는 부모 생성자를 호출합니다. 자식 객체를 만들 때 부모 부분이 먼저 초기화되어야 합니다.',
    },
    {
      line: 24,
      title: 'super.eat() 호출',
      explanation:
        'super.메서드()는 부모의 메서드를 호출합니다. 오버라이딩 후에도 부모 버전을 사용할 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'dog', type: 'Dog', value: '0x100 →' }],
          },
          {
            name: 'Dog.eat',
            variables: [{ name: 'this', type: 'Dog', value: '0x100 →' }],
          },
          {
            name: 'Animal.eat (super)',
            variables: [],
            highlight: true,
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            fields: { name: '"바둑이"', breed: '"진돗개"' },
          },
        ],
      },
      analogy:
        'super는 "부모님께 여쭤보기"와 같습니다. 내가 처리할 수 있지만, 먼저 부모님 방식을 참고하고 싶을 때 사용합니다.',
    },
  ]),
};

const ch6_lesson4 = {
  lessonId: 'j-6-4',
  language: 'java',
  code: `class Animal {
    void eat() { System.out.println("먹습니다"); }
}

class Dog extends Animal {
    void bark() { System.out.println("짖습니다"); }
}

public class Upcasting {
    public static void main(String[] args) {
        // 업캐스팅: 자식 → 부모 타입으로
        Animal a = new Dog();  // Dog 객체를 Animal 타입으로!

        a.eat();   // OK: Animal에 있는 메서드
        // a.bark();  // 컴파일 에러! Animal에는 bark()가 없음

        // 실제 객체는 Dog, 하지만 Animal로 "보는" 것
        System.out.println(a.getClass().getSimpleName());  // Dog
    }
}`,
  steps: JSON.stringify([
    {
      line: 12,
      title: '업캐스팅',
      explanation:
        'Dog 객체를 Animal 타입 변수에 담습니다. 자동으로 변환됩니다 (묵시적 형변환).',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              {
                name: 'a',
                type: 'Animal',
                value: '0x100 →',
                note: '실제는 Dog!',
                highlight: true,
              },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            note: 'Dog 객체지만 Animal로 참조',
            highlight: true,
          },
        ],
      },
      keyInsight:
        '업캐스팅은 자식 객체를 부모 타입으로 참조하는 것입니다. 실제 객체는 Dog이지만, Animal의 시각으로 보는 것입니다.',
    },
    {
      line: 14,
      title: 'eat()은 가능, bark()는 불가',
      explanation:
        'Animal 타입으로 보고 있으므로, Animal에 정의된 메서드만 호출할 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'a', type: 'Animal', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            methods: ['eat() ✓', 'bark() ✗'],
          },
        ],
      },
    },
    {
      line: 18,
      title: '실제 타입 확인',
      explanation:
        'getClass()로 확인하면 실제 객체 타입은 Dog입니다. 업캐스팅은 "보는 시각"만 바꾼 것입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'a', type: 'Animal', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            note: '실제 타입은 여전히 Dog!',
          },
        ],
      },
      analogy:
        '업캐스팅은 "선글라스를 끼는 것"과 같습니다. Dog를 Animal 선글라스로 보면, 공통적인 부분(eat)만 보입니다. 하지만 실제 대상은 여전히 Dog입니다.',
    },
  ]),
};

const ch6_lesson5 = {
  lessonId: 'j-6-5',
  language: 'java',
  code: `class Animal {
    void speak() { System.out.println("..."); }
}

class Dog extends Animal {
    @Override void speak() { System.out.println("멍멍!"); }
}

class Cat extends Animal {
    @Override void speak() { System.out.println("야옹!"); }
}

class Bird extends Animal {
    @Override void speak() { System.out.println("짹짹!"); }
}

public class Polymorphism {
    public static void main(String[] args) {
        // 다형성: 하나의 타입으로 여러 종류를 다룬다
        Animal[] animals = new Animal[3];
        animals[0] = new Dog();
        animals[1] = new Cat();
        animals[2] = new Bird();

        // 같은 코드, 다른 동작!
        for (Animal a : animals) {
            a.speak();  // 각각 다르게 동작
        }
    }
}

// 출력:
// 멍멍!
// 야옹!
// 짹짹!`,
  steps: JSON.stringify([
    {
      line: 20,
      title: 'Animal 배열에 다양한 동물',
      explanation:
        'Animal 타입 배열에 Dog, Cat, Bird 객체를 담습니다. 업캐스팅이 적용됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'animals', type: 'Animal[]', value: '0x100 →' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Animal[]',
            values: ['0x200 →', '0x300 →', '0x400 →'],
          },
          { address: '0x200', type: 'Dog' },
          { address: '0x300', type: 'Cat' },
          { address: '0x400', type: 'Bird' },
        ],
      },
      keyInsight:
        '다형성은 "하나의 타입으로 여러 형태를 다루는 것"입니다. Animal 타입 하나로 Dog, Cat, Bird를 모두 다룹니다.',
    },
    {
      line: 26,
      title: 'a.speak() 호출',
      explanation:
        '같은 speak() 호출이지만, 실제 객체 타입에 따라 다르게 동작합니다. 이것이 다형성입니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'animals', type: 'Animal[]', value: '0x100 →' },
              { name: 'a', type: 'Animal', value: '0x200 →', note: '루프 중' },
            ],
          },
        ],
        heap: [
          {
            address: '0x200',
            type: 'Dog',
            note: 'speak() → "멍멍!"',
            highlight: true,
          },
          { address: '0x300', type: 'Cat', note: 'speak() → "야옹!"' },
          { address: '0x400', type: 'Bird', note: 'speak() → "짹짹!"' },
        ],
      },
      analogy:
        '다형성은 "리모컨 하나로 여러 기기를 조작"하는 것과 같습니다. 같은 버튼(speak)을 눌러도 TV는 켜지고, 에어컨은 시원한 바람을 내고, 스피커는 음악을 틀어줍니다.',
    },
  ]),
};

const ch6_lesson6 = {
  lessonId: 'j-6-6',
  language: 'java',
  code: `class Animal {
    void eat() { System.out.println("먹습니다"); }
}

class Dog extends Animal {
    void bark() { System.out.println("멍멍!"); }
}

public class Downcasting {
    public static void main(String[] args) {
        Animal a = new Dog();  // 업캐스팅

        // a.bark();  // 컴파일 에러! Animal에는 bark()가 없음

        // 다운캐스팅: 부모 → 자식 타입으로 (명시적 형변환 필요)
        Dog d = (Dog) a;  // OK: 실제로 Dog 객체이므로
        d.bark();  // 멍멍!

        // 위험한 다운캐스팅
        Animal a2 = new Animal();
        // Dog d2 = (Dog) a2;  // 런타임 에러! ClassCastException

        // instanceof로 안전하게 확인
        if (a instanceof Dog) {
            Dog d3 = (Dog) a;
            d3.bark();
        }
    }
}`,
  steps: JSON.stringify([
    {
      line: 16,
      title: '다운캐스팅',
      explanation:
        '(Dog)로 명시적으로 타입을 변환합니다. 실제 객체가 Dog이므로 안전합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Animal', value: '0x100 →' },
              { name: 'd', type: 'Dog', value: '0x100 →', highlight: true },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            note: '같은 객체를 Dog 타입으로 봄',
          },
        ],
      },
      keyInsight:
        '다운캐스팅은 부모 타입을 자식 타입으로 변환하는 것입니다. 명시적으로 (타입) 캐스팅이 필요하고, 실제 객체가 해당 타입이어야 합니다.',
    },
    {
      line: 21,
      title: '위험한 다운캐스팅',
      explanation:
        'Animal 객체를 Dog으로 캐스팅하면 ClassCastException이 발생합니다. 실제로 Dog이 아니니까요!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a2', type: 'Animal', value: '0x200 →' },
            ],
          },
        ],
        heap: [
          { address: '0x200', type: 'Animal', note: 'Dog이 아님! 캐스팅 불가' },
        ],
      },
    },
    {
      line: 24,
      title: 'instanceof로 안전 확인',
      explanation:
        'instanceof는 객체가 특정 타입인지 확인합니다. 다운캐스팅 전에 항상 확인하면 안전합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Animal', value: '0x100 →' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Dog',
            note: 'instanceof Dog → true',
            highlight: true,
          },
        ],
      },
      analogy:
        '다운캐스팅은 "포장 뜯기"와 같습니다. 선물 상자(Animal)를 열어서 내용물(Dog)을 꺼내는 것입니다. 하지만 실제로 Dog이 들어있는지 먼저 확인(instanceof)해야 합니다!',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContentCh6() {
  console.log('☕ Seeding Java LessonContent - Chapter 6 (상속과 다형성)...\n');

  const contents = [
    ch6_lesson1,
    ch6_lesson2,
    ch6_lesson3,
    ch6_lesson4,
    ch6_lesson5,
    ch6_lesson6,
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

seedJavaContentCh6()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
