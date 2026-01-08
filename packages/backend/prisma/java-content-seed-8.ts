/**
 * Java Content Seed - Chapter 8: 가비지 컬렉션
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 8: 가비지 컬렉션
// =============================================

const ch8_lesson1 = {
  lessonId: 'j-8-1',
  language: 'java',
  code: `// C 언어: 수동 메모리 관리
// int* p = malloc(sizeof(int));
// *p = 10;
// free(p);  // 개발자가 직접 해제!

// Java: 자동 메모리 관리
public class CvsJavaMemory {
    public static void main(String[] args) {
        // 객체 생성
        Object obj = new Object();

        // 사용 후...
        obj = null;  // 참조 제거

        // free() 같은 것 없음!
        // GC가 알아서 정리해줌
        System.gc();  // GC 요청 (강제는 아님)

        System.out.println("Java는 메모리를 자동 관리합니다");
    }
}`,
  steps: JSON.stringify([
    {
      line: 2,
      title: 'C: 수동 메모리 관리',
      explanation:
        'C에서는 malloc()으로 메모리를 할당하고, 사용 후 반드시 free()로 해제해야 합니다. 잊으면 메모리 누수!',
      memoryChanges: {
        stack: [],
        heap: [{ address: '0x100', type: '?', note: 'C: malloc 후 free 필요' }],
      },
    },
    {
      line: 11,
      title: 'Java: new만 하면 됨',
      explanation:
        'Java에서는 new로 객체를 만들기만 하면 됩니다. 해제는 GC가 알아서 처리합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'obj', type: 'Object', value: '0x100 →' }],
          },
        ],
        heap: [{ address: '0x100', type: 'Object', highlight: true }],
      },
      keyInsight:
        'Java의 가비지 컬렉션(GC)은 사용하지 않는 객체를 자동으로 찾아 메모리를 해제합니다. 개발자는 메모리 해제를 신경 쓰지 않아도 됩니다.',
    },
    {
      line: 14,
      title: 'obj = null',
      explanation:
        '참조를 null로 설정하면 객체에 더 이상 접근할 수 없습니다. GC의 수거 대상이 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'obj', type: 'Object', value: 'null' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Object',
            note: '도달 불가 → GC 대상',
            highlight: true,
          },
        ],
      },
      analogy:
        'GC는 "자동 청소 로봇"과 같습니다. 방을 돌아다니며 쓰지 않는(참조 없는) 물건을 자동으로 치워줍니다.',
    },
  ]),
};

const ch8_lesson2 = {
  lessonId: 'j-8-2',
  language: 'java',
  code: `class Node {
    Node next;
    String data;
    Node(String data) { this.data = data; }
}

public class Reachability {
    public static void main(String[] args) {
        // GC Root: main 메서드의 지역 변수
        Node a = new Node("A");
        Node b = new Node("B");
        Node c = new Node("C");

        // 연결: a → b → c
        a.next = b;
        b.next = c;

        // a에서 시작해서 b, c 모두 도달 가능
        // GC Root → a → b → c (모두 도달 가능!)

        // b.next = null 하면?
        b.next = null;
        // GC Root → a → b (도달 가능)
        // c는 도달 불가! GC 대상
    }
}`,
  steps: JSON.stringify([
    {
      line: 10,
      title: '3개 객체 생성',
      explanation: 'Node 객체 a, b, c가 생성됩니다. 모두 지역 변수에서 참조됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main (GC Root)',
            variables: [
              { name: 'a', type: 'Node', value: '0x100 →' },
              { name: 'b', type: 'Node', value: '0x200 →' },
              { name: 'c', type: 'Node', value: '0x300 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Node', fields: { data: '"A"', next: 'null' } },
          { address: '0x200', type: 'Node', fields: { data: '"B"', next: 'null' } },
          { address: '0x300', type: 'Node', fields: { data: '"C"', next: 'null' } },
        ],
      },
      keyInsight:
        'GC Root는 Stack의 지역 변수, static 변수 등입니다. GC Root에서 "도달 가능한" 객체는 살아남습니다.',
    },
    {
      line: 15,
      title: 'a → b → c 연결',
      explanation: '체인으로 연결됩니다. GC Root(a)에서 b, c 모두 도달 가능합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main (GC Root)',
            variables: [
              { name: 'a', type: 'Node', value: '0x100 →' },
              { name: 'b', type: 'Node', value: '0x200 →' },
              { name: 'c', type: 'Node', value: '0x300 →' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Node',
            fields: { data: '"A"', next: '0x200 →' },
            note: 'GC Root에서 직접 도달',
          },
          {
            address: '0x200',
            type: 'Node',
            fields: { data: '"B"', next: '0x300 →' },
            note: 'a.next로 도달',
          },
          {
            address: '0x300',
            type: 'Node',
            fields: { data: '"C"', next: 'null' },
            note: 'a.next.next로 도달',
          },
        ],
      },
    },
    {
      line: 21,
      title: 'b.next = null',
      explanation:
        'b에서 c로 가는 연결을 끊습니다. 이제 c는 어디서도 도달할 수 없습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main (GC Root)',
            variables: [
              { name: 'a', type: 'Node', value: '0x100 →' },
              { name: 'b', type: 'Node', value: '0x200 →' },
              { name: 'c', type: 'Node', value: '0x300 →' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Node',
            fields: { data: '"A"', next: '0x200 →' },
          },
          {
            address: '0x200',
            type: 'Node',
            fields: { data: '"B"', next: 'null' },
            highlight: true,
          },
          {
            address: '0x300',
            type: 'Node',
            fields: { data: '"C"' },
            note: '도달 불가! GC 대상',
            unreachable: true,
          },
        ],
      },
      analogy:
        '도달 가능성은 "섬과 다리"와 같습니다. 본섬(GC Root)에서 다리를 통해 갈 수 있는 섬만 살아남습니다. 다리가 끊긴 섬(c)은 GC가 정리합니다.',
    },
  ]),
};

const ch8_lesson3 = {
  lessonId: 'j-8-3',
  language: 'java',
  code: `class Data {
    String value;
    Data(String v) { this.value = v; }
}

public class ReferenceBreak {
    public static void main(String[] args) {
        Data d1 = new Data("원본");

        // 케이스 1: null 할당
        d1 = null;
        // "원본" 객체는 GC 대상

        // 케이스 2: 다른 객체 할당
        Data d2 = new Data("첫번째");
        d2 = new Data("두번째");
        // "첫번째" 객체는 GC 대상

        // 케이스 3: 스코프 종료
        createAndForget();
        // 메서드 안에서 만든 객체는 메서드 종료 시 GC 대상

        System.out.println("참조가 끊기면 GC 대상!");
    }

    static void createAndForget() {
        Data temp = new Data("임시");
        // 메서드 종료 시 temp가 사라지므로 "임시" 객체는 GC 대상
    }
}`,
  steps: JSON.stringify([
    {
      line: 11,
      title: '케이스 1: null 할당',
      explanation:
        'd1 = null로 참조를 끊으면, "원본" 객체는 도달 불가가 되어 GC 대상이 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'd1', type: 'Data', value: 'null' }],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Data',
            fields: { value: '"원본"' },
            note: '참조 끊김 → GC 대상',
            unreachable: true,
          },
        ],
      },
      keyInsight:
        '참조가 끊기는 순간 = GC 대상이 되는 순간입니다. 다만 GC가 언제 실행될지는 JVM이 결정합니다.',
    },
    {
      line: 16,
      title: '케이스 2: 다른 객체 할당',
      explanation:
        '새 객체를 할당하면 이전 객체에 대한 참조가 끊깁니다. "첫번째" 객체는 GC 대상이 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [{ name: 'd2', type: 'Data', value: '0x300 →' }],
          },
        ],
        heap: [
          {
            address: '0x200',
            type: 'Data',
            fields: { value: '"첫번째"' },
            note: 'GC 대상',
            unreachable: true,
          },
          {
            address: '0x300',
            type: 'Data',
            fields: { value: '"두번째"' },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 20,
      title: '케이스 3: 스코프 종료',
      explanation:
        '메서드가 종료되면 지역 변수가 사라집니다. 참조가 없어진 객체는 GC 대상이 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [],
          },
        ],
        heap: [
          {
            address: '0x400',
            type: 'Data',
            fields: { value: '"임시"' },
            note: 'temp 사라짐 → GC 대상',
            unreachable: true,
          },
        ],
      },
      analogy:
        '참조 끊기는 "풍선 줄 놓기"와 같습니다. 줄(참조)을 놓으면 풍선(객체)은 날아가고(GC 대상), 결국 터집니다(메모리 해제).',
    },
  ]),
};

const ch8_lesson4 = {
  lessonId: 'j-8-4',
  language: 'java',
  code: `// GC의 기본 동작: Mark and Sweep

// 1. Mark 단계: GC Root에서 시작해서 도달 가능한 객체 표시
// 2. Sweep 단계: 표시되지 않은 객체 메모리 해제

class Box {
    String name;
    Box(String n) { name = n; }
}

public class MarkAndSweep {
    public static void main(String[] args) {
        Box a = new Box("A");
        Box b = new Box("B");
        Box c = new Box("C");

        // a → b 연결
        // c는 독립

        // b에 대한 직접 참조 제거
        b = null;

        // Mark 단계:
        // - a: 도달 가능 (GC Root에서 직접)
        // - b(0x200): a.next로 도달 가능 (만약 연결되어 있다면)
        // - c: 도달 가능 (GC Root에서 직접)

        // Sweep 단계:
        // - 표시 안 된 객체 메모리 해제

        System.gc();  // GC 실행 요청 (권장일 뿐, 강제 아님)
    }
}`,
  steps: JSON.stringify([
    {
      line: 1,
      title: 'Mark and Sweep 알고리즘',
      explanation:
        'GC의 가장 기본적인 알고리즘입니다. (1) 도달 가능한 객체 표시(Mark), (2) 표시 안 된 객체 제거(Sweep).',
      memoryChanges: {
        stack: [],
        heap: [],
      },
      keyInsight:
        'GC는 "도달 가능성"을 기준으로 살아있는 객체와 죽은 객체를 구분합니다. GC Root에서 시작해서 참조를 따라갑니다.',
    },
    {
      line: 21,
      title: 'b = null 후 상태',
      explanation:
        'b에 대한 직접 참조가 끊겼습니다. 하지만 다른 곳에서 참조하고 있다면 여전히 살아있을 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main (GC Root)',
            variables: [
              { name: 'a', type: 'Box', value: '0x100 →', note: 'Mark!' },
              { name: 'b', type: 'Box', value: 'null' },
              { name: 'c', type: 'Box', value: '0x300 →', note: 'Mark!' },
            ],
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'Box',
            fields: { name: '"A"' },
            note: '✓ 도달 가능',
          },
          {
            address: '0x200',
            type: 'Box',
            fields: { name: '"B"' },
            note: '도달 가능 여부 확인 필요',
          },
          {
            address: '0x300',
            type: 'Box',
            fields: { name: '"C"' },
            note: '✓ 도달 가능',
          },
        ],
      },
    },
    {
      line: 31,
      title: 'System.gc() 호출',
      explanation:
        'GC 실행을 "요청"합니다. JVM이 적절한 시점에 실행합니다. 강제가 아닙니다!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'a', type: 'Box', value: '0x100 →' },
              { name: 'b', type: 'Box', value: 'null' },
              { name: 'c', type: 'Box', value: '0x300 →' },
            ],
          },
        ],
        heap: [
          { address: '0x100', type: 'Box', fields: { name: '"A"' }, note: '유지' },
          { address: '0x300', type: 'Box', fields: { name: '"C"' }, note: '유지' },
        ],
      },
      analogy:
        'Mark and Sweep은 "집 청소"와 같습니다. 먼저 필요한 물건에 스티커를 붙이고(Mark), 스티커 없는 물건을 버립니다(Sweep).',
    },
  ]),
};

const ch8_lesson5 = {
  lessonId: 'j-8-5',
  language: 'java',
  code: `import java.util.ArrayList;
import java.util.List;

class BigObject {
    byte[] data = new byte[1024 * 1024];  // 1MB
}

public class JavaMemoryLeak {
    // static 컬렉션에 계속 추가하면 메모리 누수!
    static List<BigObject> cache = new ArrayList<>();

    public static void main(String[] args) {
        // 메모리 누수 예시 1: static 컬렉션
        for (int i = 0; i < 100; i++) {
            cache.add(new BigObject());  // 계속 쌓임!
            // cache가 static이라 GC가 수거 못 함
        }

        // 메모리 누수 예시 2: 닫지 않은 리소스
        // FileInputStream fis = new FileInputStream("file.txt");
        // fis.close();  // 반드시 닫아야 함!

        // 메모리 누수 예시 3: 리스너 등록 후 해제 안 함
        // button.addActionListener(listener);
        // button.removeActionListener(listener);  // 해제 필요!

        // 해결책: 사용 후 명시적으로 제거
        cache.clear();
        System.out.println("메모리 누수 방지!");
    }
}`,
  steps: JSON.stringify([
    {
      line: 10,
      title: 'static 컬렉션',
      explanation:
        'static 변수는 프로그램 종료까지 살아있습니다. 여기에 객체를 계속 추가하면 GC가 수거할 수 없습니다!',
      memoryChanges: {
        metaspace: [
          {
            class: 'JavaMemoryLeak',
            staticFields: { cache: '0x100 → (ArrayList)' },
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'ArrayList',
            note: 'static이라 GC Root에서 항상 도달 가능',
          },
        ],
      },
      keyInsight:
        'Java에서도 메모리 누수는 발생합니다! "도달 가능하지만 실제로는 사용하지 않는" 객체가 쌓이면 메모리 누수입니다.',
    },
    {
      line: 15,
      title: '반복문에서 계속 추가',
      explanation:
        '100개의 1MB 객체가 cache에 추가됩니다. 약 100MB가 해제되지 않습니다.',
      memoryChanges: {
        metaspace: [
          {
            class: 'JavaMemoryLeak',
            staticFields: { cache: '0x100 →' },
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'ArrayList',
            note: '100개의 BigObject 참조',
            highlight: true,
          },
          { address: '0x200', type: 'BigObject', note: '1MB' },
          { address: '0x300', type: 'BigObject', note: '1MB' },
          { note: '... 98개 더 ...' },
        ],
      },
    },
    {
      line: 28,
      title: 'cache.clear()',
      explanation:
        '명시적으로 컬렉션을 비우면 객체들의 참조가 끊기고 GC 대상이 됩니다.',
      memoryChanges: {
        metaspace: [
          {
            class: 'JavaMemoryLeak',
            staticFields: { cache: '0x100 →' },
          },
        ],
        heap: [
          {
            address: '0x100',
            type: 'ArrayList',
            note: '비어있음 (size=0)',
            highlight: true,
          },
          {
            address: '0x200',
            type: 'BigObject',
            note: 'GC 대상',
            unreachable: true,
          },
          {
            address: '0x300',
            type: 'BigObject',
            note: 'GC 대상',
            unreachable: true,
          },
        ],
      },
      analogy:
        'Java 메모리 누수는 "버리지 않는 쓰레기"와 같습니다. GC가 치워줄 수 있는데도(참조만 끊으면), 참조를 유지해서 치울 수 없게 만드는 것입니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContentCh8() {
  console.log('☕ Seeding Java LessonContent - Chapter 8 (가비지 컬렉션)...\n');

  const contents = [
    ch8_lesson1,
    ch8_lesson2,
    ch8_lesson3,
    ch8_lesson4,
    ch8_lesson5,
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

seedJavaContentCh8()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
