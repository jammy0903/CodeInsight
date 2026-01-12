/**
 * Python Content Seed Part 2
 * Chapter 2 (나머지), Chapter 3 (나머지), Chapter 4 전체
 *
 * 통일 형식:
 * - stack: [{ name: 'global', variables: [{ name, type, value, ref?, highlight? }] }]
 * - heap: [{ id, type, value?, fields?, highlight? }]
 */

import 'dotenv/config';
import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PostgreSQL connection
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// =============================================
// Chapter 2: 불변 객체 (나머지 3개)
// =============================================

const ch2_lesson3 = {
  id: 'p-2-3',
  lessonId: 'p-2-3',
  language: 'python',
  code: `# 문자열 메서드는 새 문자열을 반환한다
s = "hello"
print(f"원본: {s}, id: {id(s)}")

# upper()는 새 문자열 생성
upper_s = s.upper()
print(f"upper(): {upper_s}, id: {id(upper_s)}")

# replace()도 새 문자열 생성
replaced = s.replace("h", "H")
print(f"replace(): {replaced}, id: {id(replaced)}")

# 원본은 그대로
print(f"원본 확인: {s}")`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '문자열 생성',
      explanation: '"hello" 문자열 객체가 메모리에 생성되고, s가 이를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 's', type: 'ref', value: 'str_1', ref: 'str_1', highlight: true }] },
        ],
        heap: [{ id: 'str_1', type: 'str', value: 'hello', highlight: true }],
      },
    },
    {
      line: 6,
      title: 'upper()는 새 객체 생성',
      explanation:
        's.upper()는 s를 수정하는 게 아니라, 새로운 문자열 "HELLO"를 만들어 반환합니다. 문자열은 불변이기 때문입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 's', type: 'ref', value: 'str_1', ref: 'str_1' },
              { name: 'upper_s', type: 'ref', value: 'str_2', ref: 'str_2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'str_1', type: 'str', value: 'hello' },
          { id: 'str_2', type: 'str', value: 'HELLO', highlight: true },
        ],
      },
      analogy:
        '문자열 메서드는 "원본을 수정"하는 게 아니라 "새 복사본을 만들어" 반환합니다. 마치 사진을 편집할 때 원본은 그대로 두고 새 파일을 만드는 것과 같습니다.',
    },
    {
      line: 10,
      title: 'replace()도 새 객체',
      explanation:
        'replace()도 마찬가지로 새로운 문자열을 생성합니다. 원본 s는 여전히 "hello"입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 's', type: 'ref', value: 'str_1', ref: 'str_1' },
              { name: 'upper_s', type: 'ref', value: 'str_2', ref: 'str_2' },
              { name: 'replaced', type: 'ref', value: 'str_3', ref: 'str_3', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'str_1', type: 'str', value: 'hello' },
          { id: 'str_2', type: 'str', value: 'HELLO' },
          { id: 'str_3', type: 'str', value: 'Hello', highlight: true },
        ],
      },
    },
    {
      line: 13,
      title: '원본 불변 확인',
      explanation:
        's는 처음부터 끝까지 "hello"입니다. 어떤 메서드를 호출해도 원본 문자열은 절대 바뀌지 않습니다.',
      keyInsight:
        '문자열 메서드의 결과를 사용하려면 반드시 새 변수에 할당하거나, s = s.upper()처럼 재할당해야 합니다.',
    },
  ]),
};

const ch2_lesson4 = {
  id: 'p-2-4',
  lessonId: 'p-2-4',
  language: 'python',
  code: `# 튜플(tuple): 변경 불가능한 리스트
point = (3, 4)
print(f"좌표: {point}")

# 인덱싱은 가능
print(f"x: {point[0]}, y: {point[1]}")

# 수정은 불가능!
try:
    point[0] = 10  # TypeError 발생
except TypeError as e:
    print(f"에러: {e}")

# 튜플은 언제 쓸까?
# 1. 함수에서 여러 값 반환
def get_position():
    return (10, 20)

x, y = get_position()
print(f"위치: x={x}, y={y}")

# 2. 딕셔너리 키로 사용 (리스트는 불가)
locations = {(0, 0): "원점", (1, 1): "대각선"}
print(locations[(0, 0)])`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '튜플 생성',
      explanation:
        '튜플은 괄호 ()로 만들며, 리스트처럼 여러 값을 담지만 수정이 불가능합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'point', type: 'ref', value: 'tuple_1', ref: 'tuple_1', highlight: true }] },
        ],
        heap: [{ id: 'tuple_1', type: 'tuple', value: '(3, 4)', highlight: true }],
      },
    },
    {
      line: 6,
      title: '인덱싱 가능',
      explanation: '튜플은 읽기는 가능합니다. point[0]으로 첫 번째 요소에 접근할 수 있습니다.',
    },
    {
      line: 10,
      title: '수정 불가!',
      explanation:
        "point[0] = 10은 TypeError를 발생시킵니다. 튜플은 생성 후 변경할 수 없습니다.",
      keyInsight:
        '튜플의 불변성은 "실수로 데이터를 바꾸는 것"을 방지합니다. 좌표처럼 바뀌면 안 되는 데이터에 적합합니다.',
    },
    {
      line: 16,
      title: '함수 반환값',
      explanation:
        'Python 함수가 여러 값을 반환할 때 사실 튜플을 반환합니다. return (10, 20)과 return 10, 20은 같습니다.',
    },
    {
      line: 23,
      title: '딕셔너리 키',
      explanation:
        '튜플은 불변이므로 딕셔너리 키로 사용할 수 있습니다. 리스트는 가변이라 키로 쓸 수 없습니다.',
      analogy:
        '딕셔너리 키는 "변하지 않는 라벨"이어야 합니다. 튜플은 변하지 않으니 라벨로 쓸 수 있고, 리스트는 변할 수 있어서 라벨로 쓸 수 없습니다.',
    },
  ]),
};

const ch2_lesson5 = {
  id: 'p-2-5',
  lessonId: 'p-2-5',
  language: 'python',
  code: `# Python의 정수 캐싱 (Integer Interning)
a = 100
b = 100
print(f"a is b: {a is b}")  # True - 같은 객체!

c = 1000
d = 1000
print(f"c is d: {c is d}")  # False - 다른 객체

# 왜 그럴까?
print(f"id(a): {id(a)}, id(b): {id(b)}")
print(f"id(c): {id(c)}, id(d): {id(d)}")

# Python은 -5 ~ 256 범위의 정수를 미리 만들어둠
small = 256
big = 257
print(f"256 캐싱: {256 is 256}")  # True
print(f"257 캐싱: {id(big) == id(257)}")  # 상황에 따라 다름`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '작은 정수 할당',
      explanation:
        'Python은 자주 사용되는 작은 정수(-5 ~ 256)를 프로그램 시작 시 미리 만들어둡니다. a = 100은 이미 존재하는 100 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'int_100', ref: 'int_100', highlight: true }] },
        ],
        heap: [{ id: 'int_100', type: 'int', value: 100, highlight: true }],
      },
    },
    {
      line: 3,
      title: '같은 객체 재사용',
      explanation:
        'b = 100도 동일한 100 객체를 가리킵니다. 새로운 객체를 만들지 않습니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'int_100', ref: 'int_100' },
              { name: 'b', type: 'ref', value: 'int_100', ref: 'int_100', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'int_100', type: 'int', value: 100 }],
      },
      keyInsight: '작은 정수는 캐싱되므로 a is b는 True입니다. 메모리 효율을 위한 최적화입니다.',
    },
    {
      line: 6,
      title: '큰 정수는 다름',
      explanation: '1000은 캐싱 범위를 벗어나므로, c = 1000은 새로운 객체를 만듭니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'int_100', ref: 'int_100' },
              { name: 'b', type: 'ref', value: 'int_100', ref: 'int_100' },
              { name: 'c', type: 'ref', value: 'int_1000_a', ref: 'int_1000_a', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_100', type: 'int', value: 100 },
          { id: 'int_1000_a', type: 'int', value: 1000, highlight: true },
        ],
      },
    },
    {
      line: 7,
      title: '또 다른 1000 객체',
      explanation: 'd = 1000은 또 다른 1000 객체를 만듭니다. 따라서 c is d는 False입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'c', type: 'ref', value: 'int_1000_a', ref: 'int_1000_a' },
              { name: 'd', type: 'ref', value: 'int_1000_b', ref: 'int_1000_b', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'int_1000_a', type: 'int', value: 1000 },
          { id: 'int_1000_b', type: 'int', value: 1000, highlight: true },
        ],
      },
      analogy:
        '작은 정수 캐싱은 "자주 쓰는 우표를 미리 인쇄해두는 것"과 같습니다. 100원 우표는 미리 만들어두지만, 1000원 우표는 필요할 때 만듭니다.',
    },
  ]),
};

// =============================================
// Chapter 3: 가변 객체 (나머지 4개)
// =============================================

const ch3_lesson3 = {
  id: 'p-3-3',
  lessonId: 'p-3-3',
  language: 'python',
  code: `# 얕은 복사 (Shallow Copy)
import copy

# 1차원 리스트 복사
original = [1, 2, 3]
shallow = original[:]  # 또는 list(original)
shallow[0] = 100
print(f"original: {original}")  # [1, 2, 3] - 안전!
print(f"shallow: {shallow}")    # [100, 2, 3]

# 2차원 리스트의 함정
matrix = [[1, 2], [3, 4]]
matrix_copy = matrix[:]
matrix_copy[0][0] = 999
print(f"\\nmatrix: {matrix}")        # [[999, 2], [3, 4]] - 바뀜!
print(f"matrix_copy: {matrix_copy}")  # [[999, 2], [3, 4]]

# 왜 그럴까?
print(f"\\nmatrix[0] is matrix_copy[0]: {matrix[0] is matrix_copy[0]}")`,
  steps: JSON.stringify([
    {
      line: 5,
      title: '원본 리스트',
      explanation: '[1, 2, 3] 리스트가 생성되고 original이 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'original', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] }, highlight: true }],
      },
    },
    {
      line: 6,
      title: '얕은 복사',
      explanation:
        'original[:]는 새로운 리스트를 만들고, 원본의 요소들을 복사합니다. 1차원 리스트에서는 안전합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'original', type: 'ref', value: 'list_1', ref: 'list_1' },
              { name: 'shallow', type: 'ref', value: 'list_2', ref: 'list_2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] } },
          { id: 'list_2', type: 'list', fields: { elements: [1, 2, 3] }, highlight: true },
        ],
      },
    },
    {
      line: 12,
      title: '2차원 리스트',
      explanation:
        '2차원 리스트는 "리스트 안에 리스트"입니다. 외부 리스트가 내부 리스트들을 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'matrix', type: 'ref', value: 'matrix', ref: 'matrix', highlight: true }] },
        ],
        heap: [
          { id: 'matrix', type: 'list', fields: { elements: ['→inner1', '→inner2'] }, highlight: true },
          { id: 'inner1', type: 'list', fields: { elements: [1, 2] } },
          { id: 'inner2', type: 'list', fields: { elements: [3, 4] } },
        ],
      },
    },
    {
      line: 13,
      title: '얕은 복사의 함정',
      explanation:
        '얕은 복사는 새 외부 리스트를 만들지만, 내부 리스트는 같은 객체를 공유합니다!',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'matrix', type: 'ref', value: 'matrix', ref: 'matrix' },
              { name: 'matrix_copy', type: 'ref', value: 'matrix_copy', ref: 'matrix_copy', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'matrix', type: 'list', fields: { elements: ['→inner1', '→inner2'] } },
          { id: 'matrix_copy', type: 'list', fields: { elements: ['→inner1', '→inner2'] }, highlight: true },
          { id: 'inner1', type: 'list', fields: { elements: [1, 2], note: '공유됨!' } },
          { id: 'inner2', type: 'list', fields: { elements: [3, 4], note: '공유됨!' } },
        ],
      },
      keyInsight:
        '얕은 복사는 1단계만 복사합니다. 중첩된 객체는 여전히 같은 것을 가리킵니다.',
    },
    {
      line: 14,
      title: '내부 수정 = 둘 다 영향',
      explanation:
        'matrix_copy[0][0] = 999는 공유된 inner1을 수정하므로, matrix도 영향을 받습니다.',
      analogy:
        '얕은 복사는 "폴더 바로가기"와 비슷합니다. 새 폴더를 만들었지만, 안의 파일들은 원본을 가리킵니다.',
    },
  ]),
};

const ch3_lesson4 = {
  id: 'p-3-4',
  lessonId: 'p-3-4',
  language: 'python',
  code: `# 깊은 복사 (Deep Copy)
import copy

# 2차원 리스트
matrix = [[1, 2], [3, 4]]

# 깊은 복사
deep_matrix = copy.deepcopy(matrix)

# 내부 리스트는 다른 객체
print(f"matrix[0] is deep_matrix[0]: {matrix[0] is deep_matrix[0]}")

# 수정해도 원본 안전
deep_matrix[0][0] = 999
print(f"matrix: {matrix}")           # [[1, 2], [3, 4]] - 안전!
print(f"deep_matrix: {deep_matrix}")  # [[999, 2], [3, 4]]

# 언제 깊은 복사가 필요할까?
# - 중첩된 구조 (리스트 안 리스트, 딕셔너리 안 딕셔너리)
# - 원본을 보존하면서 수정해야 할 때`,
  steps: JSON.stringify([
    {
      line: 5,
      title: '2차원 리스트 생성',
      explanation: 'matrix는 두 개의 내부 리스트를 가리키는 외부 리스트입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'matrix', type: 'ref', value: 'outer', ref: 'outer', highlight: true }] },
        ],
        heap: [
          { id: 'outer', type: 'list', fields: { elements: ['→inner1', '→inner2'] }, highlight: true },
          { id: 'inner1', type: 'list', fields: { elements: [1, 2] } },
          { id: 'inner2', type: 'list', fields: { elements: [3, 4] } },
        ],
      },
    },
    {
      line: 8,
      title: '깊은 복사 실행',
      explanation:
        'copy.deepcopy()는 모든 중첩된 객체까지 재귀적으로 복사합니다. 완전히 독립된 복사본이 만들어집니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'matrix', type: 'ref', value: 'outer', ref: 'outer' },
              { name: 'deep_matrix', type: 'ref', value: 'deep_outer', ref: 'deep_outer', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'outer', type: 'list', fields: { elements: ['→inner1', '→inner2'] } },
          { id: 'inner1', type: 'list', fields: { elements: [1, 2] } },
          { id: 'inner2', type: 'list', fields: { elements: [3, 4] } },
          { id: 'deep_outer', type: 'list', fields: { elements: ['→deep_inner1', '→deep_inner2'] }, highlight: true },
          { id: 'deep_inner1', type: 'list', fields: { elements: [1, 2] }, highlight: true },
          { id: 'deep_inner2', type: 'list', fields: { elements: [3, 4] }, highlight: true },
        ],
      },
      keyInsight:
        '깊은 복사 후에는 모든 객체가 독립됩니다. 내부 리스트도 새로 만들어집니다.',
    },
    {
      line: 14,
      title: '수정해도 원본 안전',
      explanation:
        'deep_matrix[0][0] = 999는 deep_inner1만 수정합니다. inner1은 그대로이므로 matrix는 영향받지 않습니다.',
      analogy:
        '깊은 복사는 "파일 전체 복사"와 같습니다. 폴더뿐 아니라 안의 모든 파일도 새로 만들어집니다.',
    },
  ]),
};

const ch3_lesson5 = {
  id: 'p-3-5',
  lessonId: 'p-3-5',
  language: 'python',
  code: `# 딕셔너리 기본
person = {"name": "Alice", "age": 25}
print(f"이름: {person['name']}")

# 키로 값 접근
print(f"나이: {person['age']}")

# 존재하지 않는 키
# person['height']  # KeyError!
print(f"키: {person.get('height', '정보 없음')}")

# 딕셔너리의 특징
# 1. 키는 불변이어야 함 (문자열, 숫자, 튜플)
# 2. 값은 아무거나 가능
# 3. 순서가 보장됨 (Python 3.7+)

settings = {
    "volume": 80,
    "brightness": 100,
    "notifications": True
}
print(f"설정: {settings}")`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '딕셔너리 생성',
      explanation:
        '딕셔너리는 키-값 쌍으로 데이터를 저장합니다. {"키": 값} 형태로 만듭니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'person', type: 'ref', value: 'dict_1', ref: 'dict_1', highlight: true }] },
        ],
        heap: [
          {
            id: 'dict_1',
            type: 'dict',
            fields: { name: 'Alice', age: 25 },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 3,
      title: '키로 값 접근',
      explanation:
        "person['name']은 'name' 키에 해당하는 값 'Alice'를 반환합니다.",
    },
    {
      line: 10,
      title: 'get() 메서드',
      explanation:
        'get()은 키가 없을 때 에러 대신 기본값을 반환합니다. 안전한 접근 방법입니다.',
      keyInsight:
        "person['key']는 키가 없으면 에러, person.get('key', 기본값)은 기본값을 반환합니다.",
    },
    {
      line: 17,
      title: '다양한 값 저장',
      explanation:
        '딕셔너리 값으로는 숫자, 문자열, 불린, 리스트, 다른 딕셔너리 등 모든 타입이 가능합니다.',
      analogy:
        '딕셔너리는 "라벨이 붙은 서랍장"과 같습니다. 라벨(키)로 원하는 서랍을 열어 물건(값)을 꺼냅니다.',
    },
  ]),
};

const ch3_lesson6 = {
  id: 'p-3-6',
  lessonId: 'p-3-6',
  language: 'python',
  code: `# 딕셔너리 수정 - 가변 객체
person = {"name": "Alice", "age": 25}
print(f"처음: {person}")

# 값 수정
person["age"] = 26
print(f"나이 수정: {person}")

# 새 키-값 추가
person["city"] = "Seoul"
print(f"도시 추가: {person}")

# 키 삭제
del person["city"]
print(f"도시 삭제: {person}")

# 같은 딕셔너리를 가리키면?
profile = person
profile["name"] = "Bob"
print(f"\\nperson: {person}")   # Bob으로 바뀜!
print(f"profile: {profile}")`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '딕셔너리 생성',
      explanation: 'person이 딕셔너리 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'person', type: 'ref', value: 'dict_1', ref: 'dict_1', highlight: true }] },
        ],
        heap: [
          {
            id: 'dict_1',
            type: 'dict',
            fields: { name: 'Alice', age: 25 },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 6,
      title: '값 수정 (제자리 변경)',
      explanation:
        '딕셔너리는 가변 객체이므로 내용을 직접 수정할 수 있습니다. 새 객체가 만들어지지 않습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'person', type: 'ref', value: 'dict_1', ref: 'dict_1' }] },
        ],
        heap: [
          {
            id: 'dict_1',
            type: 'dict',
            fields: { name: 'Alice', age: 26 },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 10,
      title: '새 키-값 추가',
      explanation:
        '없는 키에 값을 할당하면 새로운 키-값 쌍이 추가됩니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'person', type: 'ref', value: 'dict_1', ref: 'dict_1' }] },
        ],
        heap: [
          {
            id: 'dict_1',
            type: 'dict',
            fields: { name: 'Alice', age: 26, city: 'Seoul' },
            highlight: true,
          },
        ],
      },
    },
    {
      line: 17,
      title: '같은 객체 공유',
      explanation:
        'profile = person은 같은 딕셔너리를 가리킵니다. profile을 수정하면 person도 바뀝니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'person', type: 'ref', value: 'dict_1', ref: 'dict_1' },
              { name: 'profile', type: 'ref', value: 'dict_1', ref: 'dict_1', highlight: true },
            ],
          },
        ],
        heap: [
          {
            id: 'dict_1',
            type: 'dict',
            fields: { name: 'Alice', age: 26 },
          },
        ],
      },
      keyInsight:
        '딕셔너리도 리스트처럼 가변 객체입니다. 같은 딕셔너리를 여러 변수가 가리키면 서로 영향을 받습니다.',
    },
  ]),
};

// =============================================
// Chapter 4: 함수와 인자 전달
// =============================================

const ch4_lesson1 = {
  id: 'p-4-1',
  lessonId: 'p-4-1',
  language: 'python',
  code: `# 함수 정의와 호출
def greet(name):
    """인사하는 함수"""
    return f"안녕, {name}!"

# 함수 호출
message = greet("Alice")
print(message)

# 함수도 객체다!
print(f"greet의 타입: {type(greet)}")
print(f"greet의 id: {id(greet)}")

# 함수를 변수에 할당
say_hello = greet
print(say_hello("Bob"))`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '함수 정의',
      explanation:
        'def로 함수를 정의하면, Python은 함수 객체를 메모리에 만들고 greet이라는 이름을 붙입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'greet', type: 'ref', value: 'func_1', ref: 'func_1', highlight: true }] },
        ],
        heap: [{ id: 'func_1', type: 'function', fields: { name: 'greet' }, highlight: true }],
      },
    },
    {
      line: 7,
      title: '함수 호출',
      explanation:
        'greet("Alice")는 함수를 실행하고 결과를 반환합니다. 반환값이 message 변수에 저장됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'greet', type: 'ref', value: 'func_1', ref: 'func_1' },
              { name: 'message', type: 'ref', value: 'str_1', ref: 'str_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'func_1', type: 'function', fields: { name: 'greet' } },
          { id: 'str_1', type: 'str', value: '안녕, Alice!', highlight: true },
        ],
      },
    },
    {
      line: 11,
      title: '함수도 객체',
      explanation:
        'Python에서 함수도 객체입니다. type()과 id()로 확인할 수 있습니다.',
      keyInsight:
        '함수가 객체라서 변수에 할당하거나, 다른 함수의 인자로 전달할 수 있습니다.',
    },
    {
      line: 15,
      title: '함수를 변수에 할당',
      explanation:
        'say_hello = greet은 같은 함수 객체를 가리키는 새 이름표를 붙입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'greet', type: 'ref', value: 'func_1', ref: 'func_1' },
              { name: 'say_hello', type: 'ref', value: 'func_1', ref: 'func_1', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'func_1', type: 'function', fields: { name: 'greet' } }],
      },
      analogy:
        '함수에 여러 이름을 붙일 수 있는 것은, 한 사람이 여러 별명을 가질 수 있는 것과 같습니다.',
    },
  ]),
};

const ch4_lesson2 = {
  id: 'p-4-2',
  lessonId: 'p-4-2',
  language: 'python',
  code: `# 인자 전달의 진실: Call by Object Reference
def show_id(x):
    print(f"함수 내부 x의 id: {id(x)}")
    return x

a = [1, 2, 3]
print(f"호출 전 a의 id: {id(a)}")

result = show_id(a)
print(f"호출 후 a의 id: {id(a)}")

# 같은 객체인가?
print(f"a is result: {a is result}")  # True!

# Python의 인자 전달 방식:
# 1. 값을 복사하지 않음 (Call by Value 아님)
# 2. 포인터를 전달하지 않음 (Call by Reference 아님)
# 3. 객체에 대한 참조를 전달함 (Call by Object Reference)`,
  steps: JSON.stringify([
    {
      line: 6,
      title: '리스트 생성',
      explanation: '[1, 2, 3] 리스트가 생성되고 a가 이를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] }, highlight: true }],
      },
    },
    {
      line: 9,
      title: '함수 호출 시 참조 전달',
      explanation:
        'show_id(a) 호출 시, a가 가리키는 객체의 참조가 x로 전달됩니다. 복사본이 아니라 같은 객체입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_1', ref: 'list_1' }] },
          { name: 'show_id', variables: [{ name: 'x', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] } }],
      },
      keyInsight:
        '인자 전달 시 새 객체가 만들어지지 않습니다. 함수 내부의 x와 외부의 a는 같은 객체를 가리킵니다.',
    },
    {
      line: 13,
      title: '같은 객체 확인',
      explanation:
        'a is result가 True인 것은 모두 같은 리스트 객체를 가리키기 때문입니다.',
      analogy:
        'Call by Object Reference는 "명함을 건네는 것"과 같습니다. 명함(참조)을 받으면 같은 사람(객체)에게 연락할 수 있습니다.',
    },
  ]),
};

const ch4_lesson3 = {
  lessonId: 'p-4-3',
  language: 'python',
  code: `# 불변 객체를 인자로 전달
def try_modify_number(n):
    print(f"  수정 전 n: {n}, id: {id(n)}")
    n = n + 10  # 새 객체 생성!
    print(f"  수정 후 n: {n}, id: {id(n)}")
    return n

x = 5
print(f"호출 전 x: {x}, id: {id(x)}")

result = try_modify_number(x)

print(f"호출 후 x: {x}, id: {id(x)}")  # x는 여전히 5
print(f"result: {result}")  # 15

# 왜 x는 안 바뀔까?
# n = n + 10은 새 객체(15)를 만들어 n에 할당
# 이때 n은 지역 변수이므로 x에 영향 없음`,
  steps: JSON.stringify([
    {
      line: 8,
      title: 'x에 5 할당',
      explanation: 'x가 정수 객체 5를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'ref', value: 'int_5', ref: 'int_5', highlight: true }] },
        ],
        heap: [{ id: 'int_5', type: 'int', value: 5, highlight: true }],
      },
    },
    {
      line: 11,
      title: '함수 호출',
      explanation:
        'try_modify_number(x) 호출 시, n도 같은 5 객체를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'ref', value: 'int_5', ref: 'int_5' }] },
          { name: 'try_modify_number', variables: [{ name: 'n', type: 'ref', value: 'int_5', ref: 'int_5', highlight: true }] },
        ],
        heap: [{ id: 'int_5', type: 'int', value: 5 }],
      },
    },
    {
      line: 4,
      title: 'n = n + 10 (핵심!)',
      explanation:
        'n + 10은 새로운 정수 객체 15를 만듭니다. n = ...은 n이 이 새 객체를 가리키게 합니다. x는 여전히 5를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'ref', value: 'int_5', ref: 'int_5' }] },
          { name: 'try_modify_number', variables: [{ name: 'n', type: 'ref', value: 'int_15', ref: 'int_15', highlight: true }] },
        ],
        heap: [
          { id: 'int_5', type: 'int', value: 5 },
          { id: 'int_15', type: 'int', value: 15, highlight: true },
        ],
      },
      keyInsight:
        '불변 객체는 수정할 수 없으므로, 연산 결과는 항상 새 객체입니다. 지역 변수 n만 새 객체를 가리키고, 원본 x는 그대로입니다.',
    },
    {
      line: 13,
      title: 'x는 그대로',
      explanation:
        '함수 호출 후에도 x는 여전히 5입니다. 불변 객체를 인자로 전달하면 원본이 보호됩니다.',
      analogy:
        '숫자를 함수에 전달하는 것은 "메모를 보여주는 것"과 같습니다. 함수가 새 메모를 작성해도, 원본 메모는 그대로입니다.',
    },
  ]),
};

const ch4_lesson4 = {
  lessonId: 'p-4-4',
  language: 'python',
  code: `# 가변 객체를 인자로 전달
def add_item(lst):
    print(f"  추가 전: {lst}")
    lst.append(100)  # 원본을 직접 수정!
    print(f"  추가 후: {lst}")

numbers = [1, 2, 3]
print(f"호출 전: {numbers}")

add_item(numbers)

print(f"호출 후: {numbers}")  # [1, 2, 3, 100] - 바뀜!

# 왜 바뀔까?
# lst.append(100)은 lst가 가리키는 객체를 직접 수정
# numbers와 lst가 같은 객체를 가리키므로, 둘 다 영향

# 원본을 보호하려면?
def add_item_safe(lst):
    new_lst = lst.copy()  # 복사본 생성
    new_lst.append(100)
    return new_lst`,
  steps: JSON.stringify([
    {
      line: 7,
      title: '리스트 생성',
      explanation: '[1, 2, 3] 리스트가 생성되고 numbers가 이를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'numbers', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] }, highlight: true }],
      },
    },
    {
      line: 10,
      title: '함수 호출',
      explanation:
        'add_item(numbers) 호출 시, lst도 같은 리스트를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'numbers', type: 'ref', value: 'list_1', ref: 'list_1' }] },
          { name: 'add_item', variables: [{ name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] } }],
      },
    },
    {
      line: 4,
      title: 'lst.append(100) - 원본 수정!',
      explanation:
        'append()는 리스트 자체를 수정합니다(in-place). 새 리스트를 만들지 않습니다. numbers와 lst가 같은 객체이므로 둘 다 바뀝니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'numbers', type: 'ref', value: 'list_1', ref: 'list_1' }] },
          { name: 'add_item', variables: [{ name: 'lst', type: 'ref', value: 'list_1', ref: 'list_1' }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3, 100] }, highlight: true }],
      },
      keyInsight:
        '가변 객체의 메서드(append, extend, pop 등)는 객체를 직접 수정합니다. 함수 안에서 수정하면 원본도 바뀝니다!',
    },
    {
      line: 19,
      title: '안전한 방법',
      explanation:
        '원본을 보호하려면 함수 안에서 복사본을 만들어 작업합니다.',
      analogy:
        '리스트를 함수에 전달하는 것은 "공유 문서의 편집 권한을 주는 것"과 같습니다. 복사본을 만들지 않으면 원본이 수정됩니다.',
    },
  ]),
};

const ch4_lesson5 = {
  lessonId: 'p-4-5',
  language: 'python',
  code: `# 기본값 인자의 함정
def add_to_list(item, lst=[]):
    lst.append(item)
    return lst

# 첫 번째 호출
result1 = add_to_list(1)
print(f"result1: {result1}")  # [1]

# 두 번째 호출 - 문제 발생!
result2 = add_to_list(2)
print(f"result2: {result2}")  # [1, 2] ← 예상: [2]

# 왜 이런 일이?
print(f"result1 is result2: {result1 is result2}")  # True!

# 해결책: None을 기본값으로 사용
def add_to_list_safe(item, lst=None):
    if lst is None:
        lst = []  # 매 호출마다 새 리스트 생성
    lst.append(item)
    return lst

print(f"\\n안전한 버전:")
print(add_to_list_safe(1))  # [1]
print(add_to_list_safe(2))  # [2]`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '함수 정의 시 기본값 생성',
      explanation:
        'Python은 함수가 정의될 때 기본값 객체를 한 번만 만듭니다. lst=[]는 단 하나의 빈 리스트를 만들고, 모든 호출이 이를 공유합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'add_to_list', type: 'ref', value: 'func_1', ref: 'func_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'func_1', type: 'function', fields: { name: 'add_to_list' }, highlight: true },
          { id: 'default_list', type: 'list', fields: { elements: [], note: '함수 정의 시 생성' } },
        ],
      },
      keyInsight:
        '가변 객체를 기본값으로 사용하면 예상치 못한 결과가 발생합니다. 기본값은 함수 정의 시 한 번만 평가됩니다.',
    },
    {
      line: 7,
      title: '첫 번째 호출',
      explanation:
        'add_to_list(1)은 기본값 리스트에 1을 추가합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'result1', type: 'ref', value: 'default_list', ref: 'default_list', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'default_list', type: 'list', fields: { elements: [1] }, highlight: true }],
      },
    },
    {
      line: 11,
      title: '두 번째 호출 - 함정!',
      explanation:
        'add_to_list(2)도 같은 기본값 리스트를 사용합니다. 이미 [1]이 들어있으므로 [1, 2]가 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'result1', type: 'ref', value: 'default_list', ref: 'default_list' },
              { name: 'result2', type: 'ref', value: 'default_list', ref: 'default_list', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'default_list', type: 'list', fields: { elements: [1, 2], note: 'result1, result2 공유!' }, highlight: true }],
      },
    },
    {
      line: 18,
      title: '해결책: None 사용',
      explanation:
        'None은 불변 객체이므로 안전합니다. 함수 안에서 lst = []로 매번 새 리스트를 만듭니다.',
      analogy:
        '가변 기본값은 "공용 노트"와 같습니다. 각자 새 노트를 원한다면 None으로 설정하고 함수 안에서 새로 만들어야 합니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedPythonContent2() {
  console.log('🐍 Seeding Python LessonContent (Part 2)...\n');

  const contents = [
    // Chapter 2 나머지
    ch2_lesson3,
    ch2_lesson4,
    ch2_lesson5,
    // Chapter 3 나머지
    ch3_lesson3,
    ch3_lesson4,
    ch3_lesson5,
    ch3_lesson6,
    // Chapter 4 전체
    ch4_lesson1,
    ch4_lesson2,
    ch4_lesson3,
    ch4_lesson4,
    ch4_lesson5,
  ];

  for (const content of contents) {
    // 기존 콘텐츠 삭제
    await prisma.lessonContent.deleteMany({
      where: { lessonId: content.lessonId },
    });

    // 새 콘텐츠 생성
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
    where: { language: 'python' },
  });
  console.log(`\n📊 Total Python LessonContents: ${total}`);
}

seedPythonContent2()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
