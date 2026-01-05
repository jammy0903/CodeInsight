/**
 * Java Content Seed - Chapter 3: String의 비밀
 * 통일 형식: stack frames + heap objects
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 3: String의 비밀
// =============================================

const ch3_lesson1 = {
  lessonId: 'j-3-1',
  language: 'java',
  code: `public class StringImmutable {
    public static void main(String[] args) {
        String s = "Hello";
        System.out.println("원본: " + s);

        // 문자열 수정 시도
        s.toUpperCase();
        System.out.println("toUpperCase 후: " + s);  // Hello (그대로!)

        // 결과를 받아야 함
        String upper = s.toUpperCase();
        System.out.println("새 변수: " + upper);  // HELLO

        // concat도 마찬가지
        s.concat(" World");
        System.out.println("concat 후: " + s);  // Hello (그대로!)

        s = s.concat(" World");
        System.out.println("재할당 후: " + s);  // Hello World
    }
}`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'String 객체 생성',
      explanation:
        '"Hello" 문자열 객체가 생성되고 s가 그 주소를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's', type: 'String', value: 'str_hello', ref: 'str_hello' },
            ],
          },
        ],
        heap: [
          { id: 'str_hello', type: 'String', value: '"Hello"' },
        ],
      },
    },
    {
      line: 7,
      title: '수정 시도 - 실패!',
      explanation:
        's.toUpperCase()는 원본을 수정하지 않습니다! 새로운 문자열을 만들어 반환하지만, 우리가 받지 않았습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's', type: 'String', value: 'str_hello', ref: 'str_hello' },
            ],
          },
        ],
        heap: [
          { id: 'str_hello', type: 'String', value: '"Hello"' },
          { id: 'str_HELLO', type: 'String', value: '"HELLO"', highlight: true },
        ],
      },
      keyInsight:
        'String은 불변(immutable)입니다. 모든 String 메서드는 원본을 수정하지 않고 새 객체를 반환합니다.',
    },
    {
      line: 11,
      title: '반환값 저장',
      explanation:
        '결과를 새 변수에 저장하면 새로 만들어진 "HELLO" 객체에 접근할 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's', type: 'String', value: 'str_hello', ref: 'str_hello' },
              { name: 'upper', type: 'String', value: 'str_upper', ref: 'str_upper', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'str_hello', type: 'String', value: '"Hello"' },
          { id: 'str_upper', type: 'String', value: '"HELLO"', highlight: true },
        ],
      },
      analogy:
        'String은 "돌에 새긴 글씨"와 같습니다. 지울 수 없으니, 수정하려면 새 돌에 새로 새겨야 합니다.',
    },
  ]),
};

const ch3_lesson2 = {
  lessonId: 'j-3-2',
  language: 'java',
  code: `public class StringPool {
    public static void main(String[] args) {
        // 리터럴은 String Pool에 저장
        String s1 = "Hello";
        String s2 = "Hello";

        // 같은 객체를 공유!
        System.out.println("s1 == s2: " + (s1 == s2));  // true!

        // new로 생성하면 Pool 사용 안 함
        String s3 = new String("Hello");
        System.out.println("s1 == s3: " + (s1 == s3));  // false

        // intern()으로 Pool에 등록
        String s4 = s3.intern();
        System.out.println("s1 == s4: " + (s1 == s4));  // true
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: 'String Pool에 저장',
      explanation:
        '리터럴 "Hello"는 Heap의 특별한 영역인 String Pool에 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's1', type: 'String', value: 'pool_hello', ref: 'pool_hello' },
            ],
          },
        ],
        heap: [
          { id: 'pool_hello', type: 'String (Pool)', value: '"Hello"' },
        ],
      },
    },
    {
      line: 5,
      title: 'Pool에서 재사용',
      explanation:
        '같은 리터럴 "Hello"가 또 나오면, 새 객체를 만들지 않고 Pool의 기존 객체를 재사용합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's1', type: 'String', value: 'pool_hello', ref: 'pool_hello' },
              { name: 's2', type: 'String', value: 'pool_hello', ref: 'pool_hello', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'pool_hello', type: 'String (Pool)', value: '"Hello"', highlight: true },
        ],
      },
      keyInsight:
        'String Pool: 동일한 문자열 리터럴은 메모리를 공유합니다. 그래서 s1 == s2가 true입니다.',
    },
    {
      line: 11,
      title: 'new는 Pool 무시',
      explanation:
        'new String("Hello")는 Pool을 무시하고 Heap에 새 객체를 만듭니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 's1', type: 'String', value: 'pool_hello', ref: 'pool_hello' },
              { name: 's2', type: 'String', value: 'pool_hello', ref: 'pool_hello' },
              { name: 's3', type: 'String', value: 'str_new', ref: 'str_new', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'pool_hello', type: 'String (Pool)', value: '"Hello"' },
          { id: 'str_new', type: 'String', value: '"Hello"', highlight: true },
        ],
      },
    },
    {
      line: 15,
      title: 'intern()으로 Pool 등록',
      explanation:
        's3.intern()은 Pool에서 같은 문자열을 찾아 반환합니다. 없으면 Pool에 등록합니다.',
      analogy:
        'String Pool은 "도서관"과 같습니다. 같은 책(문자열)이 필요하면 새로 사지 않고 도서관에서 빌립니다.',
    },
  ]),
};

const ch3_lesson3 = {
  lessonId: 'j-3-3',
  language: 'java',
  code: `public class NewStringVsLiteral {
    public static void main(String[] args) {
        // 리터럴: String Pool 사용
        String literal1 = "Java";
        String literal2 = "Java";

        // new: 항상 새 객체
        String newStr1 = new String("Java");
        String newStr2 = new String("Java");

        // == 비교
        System.out.println("literal1 == literal2: " + (literal1 == literal2));  // true
        System.out.println("newStr1 == newStr2: " + (newStr1 == newStr2));      // false
        System.out.println("literal1 == newStr1: " + (literal1 == newStr1));    // false

        // equals 비교 (권장!)
        System.out.println("literal1.equals(newStr1): " + literal1.equals(newStr1));  // true
    }
}`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '리터럴 방식',
      explanation:
        '"Java" 리터럴은 String Pool에 하나만 존재합니다. literal1과 literal2는 같은 객체를 공유합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'literal1', type: 'String', value: 'pool_java', ref: 'pool_java' },
              { name: 'literal2', type: 'String', value: 'pool_java', ref: 'pool_java' },
            ],
          },
        ],
        heap: [
          { id: 'pool_java', type: 'String (Pool)', value: '"Java"' },
        ],
      },
    },
    {
      line: 8,
      title: 'new 방식',
      explanation:
        'new String("Java")는 매번 새 객체를 만듭니다. newStr1과 newStr2는 다른 객체입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'literal1', type: 'String', value: 'pool_java', ref: 'pool_java' },
              { name: 'literal2', type: 'String', value: 'pool_java', ref: 'pool_java' },
              { name: 'newStr1', type: 'String', value: 'str_new1', ref: 'str_new1', highlight: true },
              { name: 'newStr2', type: 'String', value: 'str_new2', ref: 'str_new2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'pool_java', type: 'String (Pool)', value: '"Java"' },
          { id: 'str_new1', type: 'String', value: '"Java"' },
          { id: 'str_new2', type: 'String', value: '"Java"' },
        ],
      },
      keyInsight:
        'new String()은 불필요한 객체를 만듭니다. 특별한 이유가 없다면 리터럴을 사용하세요.',
    },
    {
      line: 17,
      title: 'equals() 사용',
      explanation:
        '문자열 비교는 항상 equals()를 사용하세요. ==는 객체 주소를 비교하므로 예상치 못한 결과가 나올 수 있습니다.',
      analogy:
        '리터럴은 "공용 게시판에 글 쓰기", new는 "개인 메모지에 글 쓰기"입니다. 같은 내용이지만 다른 종이입니다.',
    },
  ]),
};

const ch3_lesson4 = {
  lessonId: 'j-3-4',
  language: 'java',
  code: `import java.util.Scanner;

public class StringComparisonTrap {
    public static void main(String[] args) {
        String password = "secret123";

        // 사용자 입력 시뮬레이션
        String input = new String("secret123");  // 실제론 Scanner 등으로 입력받음

        // 잘못된 비교 (==)
        if (password == input) {
            System.out.println("== : 로그인 성공!");
        } else {
            System.out.println("== : 로그인 실패!");  // 이게 출력됨!
        }

        // 올바른 비교 (equals)
        if (password.equals(input)) {
            System.out.println("equals: 로그인 성공!");  // 이게 출력됨!
        }

        // 더 안전한 비교 (null 방지)
        if ("secret123".equals(input)) {
            System.out.println("안전한 비교: 성공!");
        }
    }
}`,
  steps: JSON.stringify([
    {
      line: 5,
      title: '리터럴 비밀번호',
      explanation:
        'password는 String Pool의 "secret123"을 가리킵니다.',
    },
    {
      line: 8,
      title: '사용자 입력',
      explanation:
        '사용자 입력(Scanner, 네트워크 등)은 new String()처럼 새 객체를 만듭니다. Pool의 객체가 아닙니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'password', type: 'String', value: 'pool_pw', ref: 'pool_pw' },
              { name: 'input', type: 'String', value: 'str_input', ref: 'str_input', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'pool_pw', type: 'String (Pool)', value: '"secret123"' },
          { id: 'str_input', type: 'String', value: '"secret123"', highlight: true },
        ],
      },
    },
    {
      line: 11,
      title: '== 함정',
      explanation:
        'password와 input은 내용은 같지만 다른 객체입니다. == 비교는 false입니다!',
      keyInsight:
        '실제 프로그램에서 이런 버그가 발생합니다. 문자열 비교는 반드시 equals()를 사용하세요.',
    },
    {
      line: 23,
      title: '안전한 비교',
      explanation:
        '"상수".equals(변수) 패턴은 변수가 null이어도 NullPointerException이 발생하지 않습니다.',
      analogy:
        '== 비교는 "ID카드가 같은가?", equals 비교는 "얼굴이 같은가?"입니다. 쌍둥이는 얼굴은 같지만 ID카드는 다릅니다.',
    },
  ]),
};

const ch3_lesson5 = {
  lessonId: 'j-3-5',
  language: 'java',
  code: `public class StringBuilderUsage {
    public static void main(String[] args) {
        // String 연결의 문제
        String result = "";
        for (int i = 0; i < 5; i++) {
            result = result + i;  // 매번 새 객체 생성!
        }
        System.out.println(result);  // 01234

        // StringBuilder로 해결
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            sb.append(i);  // 같은 객체 수정
        }
        System.out.println(sb.toString());  // 01234

        // StringBuilder 메서드
        sb.append(" - ");
        sb.append("done");
        sb.insert(0, "Result: ");
        System.out.println(sb);  // Result: 01234 - done
    }
}`,
  steps: JSON.stringify([
    {
      line: 5,
      title: 'String 연결의 비효율',
      explanation:
        'String은 불변이므로 result + i는 매번 새 String 객체를 만듭니다. 루프 5번 → 5개 객체 생성!',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'result', type: 'String', value: 'str_5', ref: 'str_5' },
              { name: 'i', type: 'int', value: '5' },
            ],
          },
        ],
        heap: [
          { id: 'str_0', type: 'String', value: '""' },
          { id: 'str_1', type: 'String', value: '"0"' },
          { id: 'str_2', type: 'String', value: '"01"' },
          { id: 'str_3', type: 'String', value: '"012"' },
          { id: 'str_4', type: 'String', value: '"0123"' },
          { id: 'str_5', type: 'String', value: '"01234"', highlight: true },
        ],
      },
      keyInsight:
        '루프에서 String 연결은 매우 비효율적입니다. N번 반복 → N개 객체 생성.',
    },
    {
      line: 11,
      title: 'StringBuilder 사용',
      explanation:
        'StringBuilder는 가변(mutable)입니다. append()는 같은 객체를 수정합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'main',
            variables: [
              { name: 'sb', type: 'StringBuilder', value: 'sb_1', ref: 'sb_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'sb_1', type: 'StringBuilder', value: '"01234"', highlight: true },
        ],
      },
      keyInsight: 'StringBuilder는 내부 버퍼를 수정합니다. 새 객체를 만들지 않아 효율적입니다.',
    },
    {
      line: 17,
      title: 'StringBuilder 메서드들',
      explanation:
        'append()는 끝에 추가, insert()는 원하는 위치에 삽입합니다. 모두 같은 객체를 수정합니다.',
      analogy:
        'String은 "돌에 새긴 글씨", StringBuilder는 "화이트보드"입니다. 화이트보드는 지우고 다시 쓸 수 있습니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedJavaContent3() {
  console.log('☕ Seeding Java LessonContent - Chapter 3 (String)...\n');

  const contents = [
    ch3_lesson1,
    ch3_lesson2,
    ch3_lesson3,
    ch3_lesson4,
    ch3_lesson5,
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

seedJavaContent3()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
