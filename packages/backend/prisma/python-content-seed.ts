/**
 * Python LessonContent Seed Script
 * Python 레슨 콘텐츠 추가 (통일 형식)
 *
 * 실행: npx ts-node prisma/python-content-seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// =============================================
// Chapter 1: 변수와 객체
// =============================================

const ch1_lesson1 = {
  id: 'p-1-1',
  lessonId: 'p-1-1',
  language: 'python',
  code: `# 변수는 이름표다

a = 10
b = 10

print(f"a = {a}")
print(f"b = {b}")
print(f"a와 b가 같은 객체인가? {a is b}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = 10의 의미',
      explanation:
        "Python에서 a = 10은 '10이라는 객체를 메모리에 만들고, a라는 이름표를 붙인다'는 의미입니다. C와 달리 변수는 상자가 아니라 이름표입니다!",
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'obj_10', ref: 'obj_10', highlight: true }] },
        ],
        heap: [{ id: 'obj_10', type: 'int', value: 10, highlight: true }],
      },
      analogy:
        "C에서 변수는 '상자'지만, Python에서 변수는 '이름표'입니다. a = 10은 10이라는 물건에 a 스티커를 붙이는 것!",
    },
    {
      line: 4,
      title: 'b = 10도 같은 객체!',
      explanation:
        'Python은 작은 정수(-5~256)를 캐싱합니다. b = 10도 이미 존재하는 10 객체에 b라는 이름표를 추가로 붙입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'obj_10', ref: 'obj_10' },
              { name: 'b', type: 'ref', value: 'obj_10', ref: 'obj_10', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'obj_10', type: 'int', value: 10 }],
      },
      misconception:
        'a와 b는 각각 다른 메모리 공간을 차지한다? ❌ 아닙니다! 같은 객체를 가리킵니다.',
    },
    {
      line: 8,
      title: 'is 연산자',
      explanation:
        "'is'는 두 변수가 같은 객체를 가리키는지 확인합니다. a와 b는 모두 같은 10 객체를 가리키므로 True입니다.",
      output: 'a와 b가 같은 객체인가? True',
      tip: 'is는 주소 비교, ==는 값 비교입니다.',
    },
  ]),
};

const ch1_lesson2 = {
  id: 'p-1-2',
  lessonId: 'p-1-2',
  language: 'python',
  code: `# 모든 것은 객체

num = 42
text = "hello"
lst = [1, 2, 3]

def greet():
    return "Hi!"

print(type(num))      # <class 'int'>
print(type(text))     # <class 'str'>
print(type(lst))      # <class 'list'>
print(type(greet))    # <class 'function'>`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '숫자도 객체',
      explanation:
        "Python에서 42는 단순한 값이 아니라 int 클래스의 인스턴스(객체)입니다. num.bit_length() 같은 메서드를 호출할 수 있습니다.",
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'num', type: 'ref', value: 'int_42', ref: 'int_42', highlight: true }] },
        ],
        heap: [{ id: 'int_42', type: 'int', value: 42, highlight: true }],
      },
    },
    {
      line: 4,
      title: '문자열도 객체',
      explanation:
        "'hello'는 str 클래스의 객체입니다. text.upper(), text.split() 등 다양한 메서드를 가지고 있습니다.",
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'num', type: 'ref', value: 'int_42', ref: 'int_42' },
              { name: 'text', type: 'ref', value: 'str_hello', ref: 'str_hello', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_42', type: 'int', value: 42 },
          { id: 'str_hello', type: 'str', value: 'hello', highlight: true },
        ],
      },
    },
    {
      line: 5,
      title: '리스트도 객체',
      explanation:
        '[1, 2, 3]은 list 클래스의 객체입니다. 내부에 다른 객체들(1, 2, 3)에 대한 참조를 저장합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'num', type: 'ref', value: 'int_42', ref: 'int_42' },
              { name: 'text', type: 'ref', value: 'str_hello', ref: 'str_hello' },
              { name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_42', type: 'int', value: 42 },
          { id: 'str_hello', type: 'str', value: 'hello' },
          { id: 'list_1', type: 'list', fields: { 0: 1, 1: 2, 2: 3 }, highlight: true },
        ],
      },
    },
    {
      line: 7,
      title: '함수도 객체!',
      explanation:
        '함수조차도 function 클래스의 객체입니다. 변수에 할당하거나 다른 함수의 인자로 전달할 수 있습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'num', type: 'ref', value: 'int_42', ref: 'int_42' },
              { name: 'text', type: 'ref', value: 'str_hello', ref: 'str_hello' },
              { name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1' },
              { name: 'greet', type: 'ref', value: 'func_greet', ref: 'func_greet', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_42', type: 'int', value: 42 },
          { id: 'str_hello', type: 'str', value: 'hello' },
          { id: 'list_1', type: 'list', fields: { 0: 1, 1: 2, 2: 3 } },
          { id: 'func_greet', type: 'function', value: 'greet', highlight: true },
        ],
      },
      tip: 'Python에서는 "모든 것이 객체"라는 말을 기억하세요!',
    },
    {
      line: 10,
      title: 'type()으로 확인',
      explanation: 'type() 함수는 객체의 타입(클래스)을 반환합니다.',
      output: "<class 'int'>",
    },
  ]),
};

const ch1_lesson3 = {
  id: 'p-1-3',
  lessonId: 'p-1-3',
  language: 'python',
  code: `# id()로 정체 확인

a = 10
b = 10
c = 1000
d = 1000

print(f"id(a) = {id(a)}")
print(f"id(b) = {id(b)}")
print(f"a와 b 같은 객체? {id(a) == id(b)}")

print(f"id(c) = {id(c)}")
print(f"id(d) = {id(d)}")
print(f"c와 d 같은 객체? {id(c) == id(d)}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = 10',
      explanation: '변수 a가 정수 10 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: '140001', ref: '140001', highlight: true }] },
        ],
        heap: [{ id: '140001', type: 'int', value: 10, highlight: true }],
      },
    },
    {
      line: 4,
      title: 'b = 10 (같은 객체!)',
      explanation:
        '10은 작은 정수라서 Python이 캐싱합니다. b도 a와 같은 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: '140001', ref: '140001' },
              { name: 'b', type: 'ref', value: '140001', ref: '140001', highlight: true },
            ],
          },
        ],
        heap: [{ id: '140001', type: 'int', value: 10 }],
      },
    },
    {
      line: 5,
      title: 'c = 1000',
      explanation:
        '1000은 캐싱 범위(-5~256) 밖이라서 새 객체가 생성됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: '140001', ref: '140001' },
              { name: 'b', type: 'ref', value: '140001', ref: '140001' },
              { name: 'c', type: 'ref', value: '140999', ref: '140999', highlight: true },
            ],
          },
        ],
        heap: [
          { id: '140001', type: 'int', value: 10 },
          { id: '140999', type: 'int', value: 1000, highlight: true },
        ],
      },
    },
    {
      line: 6,
      title: 'd = 1000 (다른 객체!)',
      explanation:
        '같은 1000이지만 캐싱 범위 밖이라서 별도의 객체가 생성됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: '140001', ref: '140001' },
              { name: 'b', type: 'ref', value: '140001', ref: '140001' },
              { name: 'c', type: 'ref', value: '140999', ref: '140999' },
              { name: 'd', type: 'ref', value: '141000', ref: '141000', highlight: true },
            ],
          },
        ],
        heap: [
          { id: '140001', type: 'int', value: 10 },
          { id: '140999', type: 'int', value: 1000 },
          { id: '141000', type: 'int', value: 1000, highlight: true },
        ],
      },
      misconception: '같은 값이면 항상 같은 객체? ❌ 캐싱 범위 밖에서는 다른 객체입니다.',
    },
    {
      line: 10,
      title: '결과: a와 b',
      explanation: 'a와 b는 같은 id를 가집니다 (같은 객체).',
      output: 'a와 b 같은 객체? True',
    },
    {
      line: 14,
      title: '결과: c와 d',
      explanation: 'c와 d는 다른 id를 가집니다 (다른 객체).',
      output: 'c와 d 같은 객체? False',
    },
  ]),
};

const ch1_lesson4 = {
  id: 'p-1-4',
  lessonId: 'p-1-4',
  language: 'python',
  code: `# is vs ==

a = [1, 2, 3]
b = [1, 2, 3]
c = a

print(f"a == b: {a == b}")  # 값 비교
print(f"a is b: {a is b}")  # 객체 비교

print(f"a == c: {a == c}")
print(f"a is c: {a is c}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = [1, 2, 3]',
      explanation: '리스트 객체가 생성되고 a가 이를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_a', ref: 'list_a', highlight: true }] },
        ],
        heap: [{ id: 'list_a', type: 'list', fields: { 0: 1, 1: 2, 2: 3 }, highlight: true }],
      },
    },
    {
      line: 4,
      title: 'b = [1, 2, 3] (새 객체!)',
      explanation: '같은 내용이지만 새로운 리스트 객체가 생성됩니다. a와 b는 다른 객체입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_a', ref: 'list_a' },
              { name: 'b', type: 'ref', value: 'list_b', ref: 'list_b', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'list_a', type: 'list', fields: { 0: 1, 1: 2, 2: 3 } },
          { id: 'list_b', type: 'list', fields: { 0: 1, 1: 2, 2: 3 }, highlight: true },
        ],
      },
    },
    {
      line: 5,
      title: 'c = a (같은 객체!)',
      explanation: 'c는 a와 같은 리스트 객체를 가리킵니다. 새 객체가 생성되지 않습니다!',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_a', ref: 'list_a' },
              { name: 'b', type: 'ref', value: 'list_b', ref: 'list_b' },
              { name: 'c', type: 'ref', value: 'list_a', ref: 'list_a', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'list_a', type: 'list', fields: { 0: 1, 1: 2, 2: 3 } },
          { id: 'list_b', type: 'list', fields: { 0: 1, 1: 2, 2: 3 } },
        ],
      },
      tip: '= 연산자는 객체를 복사하지 않고, 같은 객체에 새 이름표를 붙입니다.',
    },
    {
      line: 7,
      title: 'a == b (값 비교)',
      explanation: '==는 값이 같은지 비교합니다. [1,2,3]과 [1,2,3]은 내용이 같으므로 True.',
      output: 'a == b: True',
    },
    {
      line: 8,
      title: 'a is b (객체 비교)',
      explanation: 'is는 같은 객체인지 비교합니다. a와 b는 다른 객체이므로 False.',
      output: 'a is b: False',
    },
    {
      line: 11,
      title: 'a is c',
      explanation: 'a와 c는 같은 객체를 가리키므로 True.',
      output: 'a is c: True',
      misconception: 'c = a는 복사가 아닙니다! c를 수정하면 a도 바뀝니다.',
    },
  ]),
};

const ch1_lesson5 = {
  id: 'p-1-5',
  lessonId: 'p-1-5',
  language: 'python',
  code: `# 재할당의 진실

a = 10
print(f"처음 a: {a}, id: {id(a)}")

a = 20
print(f"재할당 후 a: {a}, id: {id(a)}")

a = a + 1
print(f"a + 1 후: {a}, id: {id(a)}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = 10',
      explanation: 'a가 정수 10 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'obj_10', ref: 'obj_10', highlight: true }] },
        ],
        heap: [{ id: 'obj_10', type: 'int', value: 10, highlight: true }],
      },
    },
    {
      line: 6,
      title: 'a = 20 (재할당)',
      explanation:
        'a = 20은 10 객체를 20으로 바꾸는 게 아닙니다! 20이라는 새 객체에 a 이름표를 옮겨 붙이는 것입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'obj_20', ref: 'obj_20', highlight: true }] },
        ],
        heap: [
          { id: 'obj_10', type: 'int', value: 10 },
          { id: 'obj_20', type: 'int', value: 20, highlight: true },
        ],
      },
      misconception:
        'a = 20이 10을 20으로 수정한다? ❌ 정수는 불변(immutable)이라 수정 불가능합니다!',
    },
    {
      line: 9,
      title: 'a = a + 1',
      explanation:
        'a + 1은 새로운 21 객체를 만들고, a가 이를 가리키게 합니다. 20 객체는 그대로 있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'obj_21', ref: 'obj_21', highlight: true }] },
        ],
        heap: [
          { id: 'obj_10', type: 'int', value: 10 },
          { id: 'obj_20', type: 'int', value: 20 },
          { id: 'obj_21', type: 'int', value: 21, highlight: true },
        ],
      },
      tip: 'id()가 매번 바뀌는 것은 새 객체가 생성되었다는 증거입니다!',
    },
  ]),
};

// =============================================
// Chapter 2: 불변 객체 (Immutable)
// =============================================

const ch2_lesson1 = {
  id: 'p-2-1',
  lessonId: 'p-2-1',
  language: 'python',
  code: `# 숫자의 불변성

a = 10
print(f"a = {a}, id = {id(a)}")

a += 1  # a = a + 1과 동일
print(f"a += 1 후: a = {a}, id = {id(a)}")

# 10 객체는 변하지 않았다!
b = 10
print(f"b = 10: id = {id(b)}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = 10',
      explanation: 'a가 10 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'int_10', ref: 'int_10', highlight: true }] },
        ],
        heap: [{ id: 'int_10', type: 'int', value: 10, highlight: true }],
      },
    },
    {
      line: 6,
      title: 'a += 1 의 진실',
      explanation:
        'a += 1은 10을 11로 수정하는 게 아닙니다! 11이라는 새 객체를 만들고 a가 이를 가리키게 합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'int_11', ref: 'int_11', highlight: true }] },
        ],
        heap: [
          { id: 'int_10', type: 'int', value: 10 },
          { id: 'int_11', type: 'int', value: 11, highlight: true },
        ],
      },
      misconception: 'a += 1이 원래 객체를 수정한다? ❌ 정수는 불변이므로 새 객체가 생성됩니다!',
    },
    {
      line: 10,
      title: '원래 10 객체는 그대로',
      explanation:
        'b = 10을 하면 a가 처음 가리키던 바로 그 10 객체를 가리킵니다. 10은 변하지 않았습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'int_11', ref: 'int_11' },
              { name: 'b', type: 'ref', value: 'int_10', ref: 'int_10', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_10', type: 'int', value: 10 },
          { id: 'int_11', type: 'int', value: 11 },
        ],
      },
      tip: '불변 객체는 안전합니다. 다른 변수가 같은 객체를 가리켜도 예상치 못한 변경이 없습니다.',
    },
  ]),
};

const ch2_lesson2 = {
  id: 'p-2-2',
  lessonId: 'p-2-2',
  language: 'python',
  code: `# 문자열의 불변성

s = "hello"
print(f"s = {s}, id = {id(s)}")

# 이건 안 됩니다!
# s[0] = "H"  # TypeError!

# 새 문자열을 만들어야 합니다
s = "H" + s[1:]
print(f"수정 후: s = {s}, id = {id(s)}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 's = "hello"',
      explanation: 's가 문자열 "hello" 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 's', type: 'ref', value: 'str_hello', ref: 'str_hello', highlight: true }] },
        ],
        heap: [{ id: 'str_hello', type: 'str', value: 'hello', highlight: true }],
      },
    },
    {
      line: 7,
      title: 's[0] = "H"는 에러!',
      explanation:
        '문자열은 불변이므로 일부를 수정할 수 없습니다. TypeError: \'str\' object does not support item assignment',
      misconception: 's[0] = "H"로 첫 글자를 바꿀 수 있다? ❌ 문자열은 수정 불가능합니다!',
    },
    {
      line: 10,
      title: '새 문자열 생성',
      explanation:
        '"H" + s[1:]은 "H" + "ello" = "Hello"라는 새 문자열 객체를 만듭니다. 원래 "hello"는 그대로입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 's', type: 'ref', value: 'str_Hello', ref: 'str_Hello', highlight: true }] },
        ],
        heap: [
          { id: 'str_hello', type: 'str', value: 'hello' },
          { id: 'str_Hello', type: 'str', value: 'Hello', highlight: true },
        ],
      },
      tip: '문자열을 "수정"하려면 항상 새 문자열을 만들어야 합니다.',
    },
  ]),
};

// =============================================
// Chapter 3: 가변 객체 (Mutable) - 일부
// =============================================

const ch3_lesson1 = {
  id: 'p-3-1',
  lessonId: 'p-3-1',
  language: 'python',
  code: `# 리스트 생성과 수정

lst = [1, 2, 3]
print(f"lst = {lst}, id = {id(lst)}")

lst[0] = 100
print(f"lst[0] = 100 후: {lst}, id = {id(lst)}")

lst.append(4)
print(f"append(4) 후: {lst}, id = {id(lst)}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'lst = [1, 2, 3]',
      explanation: '리스트 객체가 생성됩니다. 리스트는 가변(mutable) 객체입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { 0: 1, 1: 2, 2: 3 }, highlight: true }],
      },
    },
    {
      line: 6,
      title: 'lst[0] = 100 (원본 수정!)',
      explanation:
        '리스트는 가변이므로 직접 수정할 수 있습니다. 새 객체가 생성되지 않고, 원래 리스트가 변경됩니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1' }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { 0: 100, 1: 2, 2: 3 }, highlight: true }],
      },
      tip: 'id가 변하지 않았습니다! 같은 객체입니다.',
    },
    {
      line: 9,
      title: 'append(4)',
      explanation: 'append도 원래 리스트를 직접 수정합니다. 새 리스트를 만들지 않습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1' }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { 0: 100, 1: 2, 2: 3, 3: 4 }, highlight: true }],
      },
      misconception:
        '리스트 수정 시 새 객체 생성? ❌ 리스트는 가변이라 직접 수정됩니다!',
    },
  ]),
};

const ch3_lesson2 = {
  id: 'p-3-2',
  lessonId: 'p-3-2',
  language: 'python',
  code: `# 같은 리스트를 가리키면?

a = [1, 2, 3]
b = a  # 복사가 아님! 같은 객체를 가리킴

print(f"a = {a}")
print(f"b = {b}")
print(f"같은 객체? {a is b}")

b[0] = 999  # b를 수정하면...

print(f"a = {a}")  # a도 바뀜!
print(f"b = {b}")`,
  steps: JSON.stringify([
    {
      line: 3,
      title: 'a = [1, 2, 3]',
      explanation: '리스트 객체가 생성되고 a가 이를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_shared', ref: 'list_shared', highlight: true }] },
        ],
        heap: [{ id: 'list_shared', type: 'list', fields: { 0: 1, 1: 2, 2: 3 }, highlight: true }],
      },
    },
    {
      line: 4,
      title: 'b = a (같은 객체!)',
      explanation:
        '새 리스트가 생성되지 않습니다! b도 a와 같은 리스트 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_shared', ref: 'list_shared' },
              { name: 'b', type: 'ref', value: 'list_shared', ref: 'list_shared', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'list_shared', type: 'list', fields: { 0: 1, 1: 2, 2: 3 } }],
      },
      misconception: 'b = a가 리스트를 복사한다? ❌ 같은 객체에 이름표만 추가합니다!',
    },
    {
      line: 10,
      title: 'b[0] = 999',
      explanation:
        'b가 가리키는 리스트를 수정합니다. a와 b는 같은 객체이므로...',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_shared', ref: 'list_shared' },
              { name: 'b', type: 'ref', value: 'list_shared', ref: 'list_shared' },
            ],
          },
        ],
        heap: [{ id: 'list_shared', type: 'list', fields: { 0: 999, 1: 2, 2: 3 }, highlight: true }],
      },
    },
    {
      line: 12,
      title: 'a도 바뀜!',
      explanation:
        'a와 b는 같은 객체를 가리키므로, b를 통해 수정하면 a로 볼 때도 바뀝니다!',
      output: 'a = [999, 2, 3]',
      tip: '의도치 않은 변경을 피하려면 복사(copy)를 사용하세요.',
    },
  ]),
};

// =============================================
// Seed 실행
// =============================================

async function seedPythonContent() {
  console.log('🐍 Seeding Python LessonContent (통일 형식)...\n');

  const contents = [
    // Chapter 1
    ch1_lesson1,
    ch1_lesson2,
    ch1_lesson3,
    ch1_lesson4,
    ch1_lesson5,
    // Chapter 2
    ch2_lesson1,
    ch2_lesson2,
    // Chapter 3
    ch3_lesson1,
    ch3_lesson2,
  ];

  for (const content of contents) {
    // 기존 콘텐츠가 있으면 삭제
    await prisma.lessonContent.deleteMany({
      where: { lessonId: content.lessonId },
    });

    // 새 콘텐츠 생성
    await prisma.lessonContent.create({
      data: content,
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: content.lessonId },
    });

    console.log(`✅ ${lesson?.title}`);
  }

  // 결과 확인
  const count = await prisma.lessonContent.count({
    where: { language: 'python' },
  });
  console.log(`\n📊 Total Python LessonContents: ${count}`);
}

seedPythonContent()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
