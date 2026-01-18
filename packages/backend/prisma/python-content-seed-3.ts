/**
 * Python Content Seed Part 3
 * Chapter 5: 스코프와 네임스페이스 (4개)
 * Chapter 6: 클래스와 객체 (6개)
 * Chapter 7: 메모리 관리 (4개)
 *
 * 통일 형식:
 * - stack: [{ name: 'global' | 함수명, variables: [{ name, type, value, ref?, highlight? }] }]
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
// Chapter 5: 스코프와 네임스페이스
// =============================================

const ch5_lesson1 = {
  id: 'p-5-1',
  lessonId: 'p-5-1',
  language: 'python',
  code: `# 지역 변수와 전역 변수
x = 10  # 전역 변수

def my_function():
    x = 20  # 지역 변수 (새로운 x)
    print(f"함수 내부 x: {x}")

my_function()
print(f"함수 외부 x: {x}")

# 지역 변수는 함수 밖에서 접근 불가
def create_local():
    y = 100  # 지역 변수
    print(f"함수 내부 y: {y}")

create_local()
# print(y)  # NameError: y is not defined`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '전역 변수 생성',
      explanation:
        '함수 바깥에서 정의된 x는 전역 변수입니다. 프로그램 어디서든 접근할 수 있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'int', value: 10, highlight: true }] },
        ],
      },
    },
    {
      line: 5,
      title: '지역 변수 생성 (같은 이름!)',
      explanation:
        '함수 안에서 x = 20은 새로운 지역 변수 x를 만듭니다. 전역 x와는 다른 변수입니다!',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'int', value: 10 }] },
          { name: 'my_function', variables: [{ name: 'x', type: 'int', value: 20, highlight: true }] },
        ],
      },
      keyInsight:
        '함수 안에서 변수에 할당하면 자동으로 지역 변수가 됩니다. 전역 변수를 "가리는" 효과가 있습니다.',
    },
    {
      line: 8,
      title: '함수 호출 결과',
      explanation:
        '함수 내부에서는 지역 변수 x(20)를 출력합니다.',
    },
    {
      line: 9,
      title: '함수 외부에서 x',
      explanation:
        '함수가 끝나면 지역 변수는 사라지고, 전역 x(10)가 출력됩니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'int', value: 10 }] },
        ],
      },
      analogy:
        '전역 변수는 "집 전체에서 보이는 것", 지역 변수는 "방 안에서만 보이는 것"입니다. 방을 나가면 방 안의 것은 보이지 않습니다.',
    },
  ]),
};

const ch5_lesson2 = {
  id: 'p-5-2',
  lessonId: 'p-5-2',
  language: 'python',
  code: `# global 키워드
counter = 0  # 전역 변수

def increment():
    global counter  # 전역 변수 사용 선언
    counter += 1
    print(f"함수 내부 counter: {counter}")

print(f"호출 전: {counter}")
increment()
increment()
increment()
print(f"호출 후: {counter}")

# global 없이 수정하면?
def broken_increment():
    # counter += 1  # UnboundLocalError!
    # Python은 할당이 있으면 지역 변수로 간주
    pass`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '전역 counter 생성',
      explanation: '함수 바깥에서 counter = 0을 정의합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'counter', type: 'int', value: 0, highlight: true }] },
        ],
      },
    },
    {
      line: 5,
      title: 'global 선언',
      explanation:
        'global counter는 "이 함수에서 counter는 전역 변수를 가리킨다"고 선언합니다. 새 지역 변수를 만들지 않습니다.',
      keyInsight:
        'global 없이 counter += 1을 하면 Python은 지역 변수로 간주하여 UnboundLocalError가 발생합니다.',
    },
    {
      line: 6,
      title: '전역 변수 수정',
      explanation:
        'global 선언 덕분에 counter += 1이 전역 변수를 직접 수정합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'counter', type: 'int', value: 1, highlight: true }] },
        ],
      },
    },
    {
      line: 10,
      title: '연속 호출',
      explanation:
        '함수를 3번 호출하면 전역 counter가 0 → 1 → 2 → 3으로 증가합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'counter', type: 'int', value: 3 }] },
        ],
      },
      analogy:
        'global은 "이 변수는 내 방의 것이 아니라 거실의 것이야"라고 명시하는 것입니다.',
    },
  ]),
};

const ch5_lesson3 = {
  id: 'p-5-3',
  lessonId: 'p-5-3',
  language: 'python',
  code: `# LEGB 규칙: 변수를 찾는 순서
# L: Local (지역)
# E: Enclosing (감싸는 함수)
# G: Global (전역)
# B: Built-in (내장)

x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"
        print(f"inner에서 x: {x}")  # local

    inner()
    print(f"outer에서 x: {x}")  # enclosing

outer()
print(f"전역에서 x: {x}")  # global

# Built-in 예시
print(f"len 함수: {len}")  # 내장 함수`,
  steps: JSON.stringify([
    {
      line: 7,
      title: 'Global 스코프',
      explanation: '가장 바깥에서 정의된 x = "global"은 전역 스코프에 있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'str', value: '"global"', highlight: true }] },
        ],
      },
    },
    {
      line: 10,
      title: 'Enclosing 스코프',
      explanation:
        'outer 함수 안에서 정의된 x = "enclosing"은 inner 함수 입장에서 Enclosing 스코프입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'str', value: '"global"' }] },
          { name: 'outer', variables: [{ name: 'x', type: 'str', value: '"enclosing"', highlight: true }] },
        ],
      },
    },
    {
      line: 13,
      title: 'Local 스코프',
      explanation:
        'inner 함수 안에서 정의된 x = "local"은 Local 스코프입니다. 변수를 찾을 때 가장 먼저 확인합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'x', type: 'str', value: '"global"' }] },
          { name: 'outer', variables: [{ name: 'x', type: 'str', value: '"enclosing"' }] },
          { name: 'inner', variables: [{ name: 'x', type: 'str', value: '"local"', highlight: true }] },
        ],
      },
      keyInsight:
        'LEGB 순서로 변수를 찾습니다: Local → Enclosing → Global → Built-in. 먼저 찾은 곳에서 멈춥니다.',
    },
    {
      line: 22,
      title: 'Built-in 스코프',
      explanation:
        'len, print, int 등은 Built-in 스코프에 있는 내장 함수입니다. 어디서든 접근 가능합니다.',
      analogy:
        'LEGB는 "물건을 찾는 순서"와 같습니다: 내 책상(L) → 같은 방(E) → 거실(G) → 창고(B) 순으로 찾습니다.',
    },
  ]),
};

const ch5_lesson4 = {
  id: 'p-5-4',
  lessonId: 'p-5-4',
  language: 'python',
  code: `# 클로저 (Closure): 외부 변수를 기억하는 함수
def make_multiplier(n):
    """n을 기억하는 곱셈 함수를 반환"""
    def multiplier(x):
        return x * n  # n은 외부 함수의 변수
    return multiplier

# 클로저 생성
double = make_multiplier(2)
triple = make_multiplier(3)

# 사용
print(f"double(5): {double(5)}")  # 10
print(f"triple(5): {triple(5)}")  # 15

# n은 어디에 저장되어 있을까?
print(f"double의 클로저: {double.__closure__}")
print(f"저장된 값: {double.__closure__[0].cell_contents}")`,
  steps: JSON.stringify([
    {
      line: 2,
      title: 'make_multiplier 정의',
      explanation:
        '이 함수는 다른 함수(multiplier)를 만들어서 반환합니다. 함수를 만드는 함수입니다.',
    },
    {
      line: 4,
      title: '내부 함수 정의',
      explanation:
        'multiplier 함수는 외부 함수의 변수 n을 사용합니다. 이 n은 함수가 반환된 후에도 기억됩니다.',
      keyInsight:
        '클로저는 "함수 + 그 함수가 참조하는 외부 변수"를 함께 묶은 것입니다.',
    },
    {
      line: 9,
      title: '클로저 생성 (n=2)',
      explanation:
        'make_multiplier(2)를 호출하면, n=2를 기억하는 multiplier 함수가 반환됩니다. double은 이 함수를 가리킵니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'double', type: 'ref', value: 'closure_1', ref: 'closure_1', highlight: true }] },
        ],
        heap: [{ id: 'closure_1', type: 'closure', fields: { n: 2 }, highlight: true }],
      },
    },
    {
      line: 10,
      title: '또 다른 클로저 (n=3)',
      explanation:
        'make_multiplier(3)는 n=3을 기억하는 별개의 함수를 반환합니다. double과 triple은 각자 다른 n을 기억합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'double', type: 'ref', value: 'closure_1', ref: 'closure_1' },
              { name: 'triple', type: 'ref', value: 'closure_2', ref: 'closure_2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'closure_1', type: 'closure', fields: { n: 2 } },
          { id: 'closure_2', type: 'closure', fields: { n: 3 }, highlight: true },
        ],
      },
    },
    {
      line: 13,
      title: '클로저 사용',
      explanation:
        'double(5)는 5 * 2 = 10을 반환합니다. make_multiplier는 이미 끝났지만, n=2는 여전히 기억됩니다.',
      analogy:
        '클로저는 "레시피를 기억하는 요리사"와 같습니다. 요리사(함수)가 주방(외부 함수)을 떠나도, 비밀 재료(n)를 기억하고 있습니다.',
    },
  ]),
};

// =============================================
// Chapter 6: 클래스와 객체
// =============================================

const ch6_lesson1 = {
  id: 'p-6-1',
  lessonId: 'p-6-1',
  language: 'python',
  code: `# 클래스 정의: 나만의 타입 만들기
class Dog:
    """강아지를 나타내는 클래스"""
    pass

# 인스턴스(객체) 생성
my_dog = Dog()
your_dog = Dog()

# 각 인스턴스는 별개의 객체
print(f"my_dog의 타입: {type(my_dog)}")
print(f"my_dog is your_dog: {my_dog is your_dog}")
print(f"id(my_dog): {id(my_dog)}")
print(f"id(your_dog): {id(your_dog)}")

# 클래스 = 설계도, 인스턴스 = 실제 제품
# int, str, list도 모두 클래스!
print(f"int는 클래스: {type(int)}")`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '클래스 정의',
      explanation:
        'class 키워드로 새로운 타입 Dog을 정의합니다. 클래스는 객체를 만드는 "설계도"입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'Dog', type: 'ref', value: 'class_Dog', ref: 'class_Dog', highlight: true }] },
        ],
        heap: [{ id: 'class_Dog', type: 'class', fields: { name: 'Dog' }, highlight: true }],
      },
    },
    {
      line: 7,
      title: '인스턴스 생성',
      explanation:
        'Dog()를 호출하면 Dog 클래스의 인스턴스(실제 객체)가 생성됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'Dog', type: 'ref', value: 'class_Dog', ref: 'class_Dog' },
              { name: 'my_dog', type: 'ref', value: 'dog_1', ref: 'dog_1', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'class_Dog', type: 'class', fields: { name: 'Dog' } },
          { id: 'dog_1', type: 'Dog', highlight: true },
        ],
      },
    },
    {
      line: 8,
      title: '별개의 인스턴스',
      explanation:
        'Dog()를 다시 호출하면 또 다른 인스턴스가 생성됩니다. my_dog과 your_dog은 같은 타입이지만 다른 객체입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'my_dog', type: 'ref', value: 'dog_1', ref: 'dog_1' },
              { name: 'your_dog', type: 'ref', value: 'dog_2', ref: 'dog_2', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'dog_1', type: 'Dog' },
          { id: 'dog_2', type: 'Dog', highlight: true },
        ],
      },
      keyInsight:
        '하나의 클래스(설계도)로 여러 개의 인스턴스(제품)를 만들 수 있습니다.',
    },
    {
      line: 17,
      title: 'int도 클래스!',
      explanation:
        'Python의 int, str, list 등도 모두 클래스입니다. 10은 int 클래스의 인스턴스입니다.',
      analogy:
        '클래스는 "붕어빵 틀"이고, 인스턴스는 "붕어빵"입니다. 하나의 틀로 여러 붕어빵을 만들 수 있습니다.',
    },
  ]),
};

const ch6_lesson2 = {
  id: 'p-6-2',
  lessonId: 'p-6-2',
  language: 'python',
  code: `# __init__과 self
class Dog:
    def __init__(self, name, age):
        """객체 초기화 메서드"""
        self.name = name  # 인스턴스 변수
        self.age = age
        print(f"{name} 객체 생성됨!")

# 인스턴스 생성 시 __init__ 자동 호출
buddy = Dog("Buddy", 3)
max_dog = Dog("Max", 5)

print(f"buddy.name: {buddy.name}")
print(f"max_dog.name: {max_dog.name}")

# self는 누구?
# self = 메서드를 호출하는 인스턴스 자신
# buddy.name에서 self는 buddy를 가리킴`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '__init__ 메서드',
      explanation:
        '__init__은 객체가 생성될 때 자동으로 호출되는 특별한 메서드입니다. 초기화(initialization)를 담당합니다.',
    },
    {
      line: 5,
      title: 'self.name = name',
      explanation:
        'self는 생성되는 인스턴스 자신을 가리킵니다. self.name은 "이 인스턴스의 name 속성"을 의미합니다.',
      keyInsight:
        'self.변수명 = 값으로 각 인스턴스마다 독립적인 데이터를 저장합니다.',
    },
    {
      line: 10,
      title: '인스턴스 생성',
      explanation:
        'Dog("Buddy", 3)를 호출하면 Python이 __init__(self, "Buddy", 3)을 실행합니다. self는 새로 만들어지는 객체입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'buddy', type: 'ref', value: 'dog_buddy', ref: 'dog_buddy', highlight: true }] },
        ],
        heap: [{ id: 'dog_buddy', type: 'Dog', fields: { name: 'Buddy', age: 3 }, highlight: true }],
      },
    },
    {
      line: 11,
      title: '또 다른 인스턴스',
      explanation:
        'Dog("Max", 5)는 별개의 객체를 만듭니다. buddy와 max_dog은 각자 다른 name, age를 가집니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'buddy', type: 'ref', value: 'dog_buddy', ref: 'dog_buddy' },
              { name: 'max_dog', type: 'ref', value: 'dog_max', ref: 'dog_max', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'dog_buddy', type: 'Dog', fields: { name: 'Buddy', age: 3 } },
          { id: 'dog_max', type: 'Dog', fields: { name: 'Max', age: 5 }, highlight: true },
        ],
      },
      analogy:
        'self는 "나 자신"을 가리킵니다. buddy.name을 호출하면 self는 buddy가 되고, max_dog.name을 호출하면 self는 max_dog이 됩니다.',
    },
  ]),
};

const ch6_lesson3 = {
  id: 'p-6-3',
  lessonId: 'p-6-3',
  language: 'python',
  code: `# 인스턴스 변수: 각 객체가 독립적으로 가지는 데이터
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner      # 인스턴스 변수
        self.balance = balance  # 인스턴스 변수

# 두 개의 계좌 생성
alice_account = BankAccount("Alice", 1000)
bob_account = BankAccount("Bob", 500)

# 각 계좌는 독립적
alice_account.balance += 100
print(f"Alice 잔액: {alice_account.balance}")  # 1100
print(f"Bob 잔액: {bob_account.balance}")      # 500

# 인스턴스마다 다른 데이터
print(f"alice_account.owner: {alice_account.owner}")
print(f"bob_account.owner: {bob_account.owner}")`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '인스턴스 변수 정의',
      explanation:
        'self.owner와 self.balance는 인스턴스 변수입니다. 각 객체마다 독립적으로 존재합니다.',
    },
    {
      line: 8,
      title: 'Alice 계좌 생성',
      explanation:
        'alice_account는 owner="Alice", balance=1000을 가진 객체입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'alice_account', type: 'ref', value: 'acc_alice', ref: 'acc_alice', highlight: true }] },
        ],
        heap: [{ id: 'acc_alice', type: 'BankAccount', fields: { owner: 'Alice', balance: 1000 }, highlight: true }],
      },
    },
    {
      line: 9,
      title: 'Bob 계좌 생성',
      explanation:
        'bob_account는 완전히 별개의 객체입니다. 자신만의 owner, balance를 가집니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'alice_account', type: 'ref', value: 'acc_alice', ref: 'acc_alice' },
              { name: 'bob_account', type: 'ref', value: 'acc_bob', ref: 'acc_bob', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'acc_alice', type: 'BankAccount', fields: { owner: 'Alice', balance: 1000 } },
          { id: 'acc_bob', type: 'BankAccount', fields: { owner: 'Bob', balance: 500 }, highlight: true },
        ],
      },
    },
    {
      line: 12,
      title: 'Alice 잔액만 변경',
      explanation:
        'alice_account.balance를 수정해도 bob_account.balance는 영향받지 않습니다. 각자 독립적입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'alice_account', type: 'ref', value: 'acc_alice', ref: 'acc_alice' },
              { name: 'bob_account', type: 'ref', value: 'acc_bob', ref: 'acc_bob' },
            ],
          },
        ],
        heap: [
          { id: 'acc_alice', type: 'BankAccount', fields: { owner: 'Alice', balance: 1100 }, highlight: true },
          { id: 'acc_bob', type: 'BankAccount', fields: { owner: 'Bob', balance: 500 } },
        ],
      },
      keyInsight:
        '인스턴스 변수는 각 객체의 "개인 소유물"입니다. 다른 객체에 영향을 주지 않습니다.',
    },
  ]),
};

const ch6_lesson4 = {
  id: 'p-6-4',
  lessonId: 'p-6-4',
  language: 'python',
  code: `# 클래스 변수: 모든 인스턴스가 공유하는 변수
class Dog:
    species = "Canis familiaris"  # 클래스 변수
    count = 0  # 생성된 개 수

    def __init__(self, name):
        self.name = name  # 인스턴스 변수
        Dog.count += 1    # 클래스 변수 수정

buddy = Dog("Buddy")
print(f"Dog.count: {Dog.count}")     # 1
print(f"buddy.species: {buddy.species}")

max_dog = Dog("Max")
print(f"Dog.count: {Dog.count}")     # 2

# 주의: 인스턴스를 통해 클래스 변수 수정?
buddy.species = "Wolf"  # 새 인스턴스 변수 생성!
print(f"buddy.species: {buddy.species}")    # Wolf
print(f"max_dog.species: {max_dog.species}")  # Canis familiaris
print(f"Dog.species: {Dog.species}")  # Canis familiaris`,
  steps: JSON.stringify([
    {
      line: 3,
      title: '클래스 변수 정의',
      explanation:
        'class 바로 아래에 정의된 species와 count는 클래스 변수입니다. 모든 인스턴스가 공유합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'Dog', type: 'ref', value: 'class_Dog', ref: 'class_Dog', highlight: true }] },
        ],
        heap: [{ id: 'class_Dog', type: 'class', fields: { species: 'Canis familiaris', count: 0 }, highlight: true }],
      },
    },
    {
      line: 8,
      title: '클래스 변수 수정',
      explanation:
        'Dog.count += 1은 클래스 변수를 직접 수정합니다. 모든 인스턴스에서 이 변경이 보입니다.',
    },
    {
      line: 10,
      title: '첫 번째 Dog 생성',
      explanation:
        'buddy가 생성되면서 Dog.count가 0에서 1로 증가합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'Dog', type: 'ref', value: 'class_Dog', ref: 'class_Dog' },
              { name: 'buddy', type: 'ref', value: 'dog_buddy', ref: 'dog_buddy', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'class_Dog', type: 'class', fields: { species: 'Canis familiaris', count: 1 } },
          { id: 'dog_buddy', type: 'Dog', fields: { name: 'Buddy' }, highlight: true },
        ],
      },
    },
    {
      line: 17,
      title: '함정: 인스턴스로 클래스 변수 할당',
      explanation:
        'buddy.species = "Wolf"는 클래스 변수를 수정하는 게 아니라, buddy에 새로운 인스턴스 변수를 만듭니다!',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'Dog', type: 'ref', value: 'class_Dog', ref: 'class_Dog' },
              { name: 'buddy', type: 'ref', value: 'dog_buddy', ref: 'dog_buddy' },
              { name: 'max_dog', type: 'ref', value: 'dog_max', ref: 'dog_max' },
            ],
          },
        ],
        heap: [
          { id: 'class_Dog', type: 'class', fields: { species: 'Canis familiaris', count: 2 } },
          { id: 'dog_buddy', type: 'Dog', fields: { name: 'Buddy', species: 'Wolf' }, highlight: true },
          { id: 'dog_max', type: 'Dog', fields: { name: 'Max' } },
        ],
      },
      keyInsight:
        '클래스 변수를 수정하려면 Dog.변수명으로 접근해야 합니다. 인스턴스.변수명 = 값은 새 인스턴스 변수를 만듭니다.',
    },
  ]),
};

const ch6_lesson5 = {
  id: 'p-6-5',
  lessonId: 'p-6-5',
  language: 'python',
  code: `# 메서드: 객체가 할 수 있는 동작
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def bark(self):
        """짖기"""
        print(f"{self.name}: 멍멍!")

    def introduce(self):
        """자기소개"""
        return f"저는 {self.name}이고, {self.age}살입니다."

    def have_birthday(self):
        """생일"""
        self.age += 1
        print(f"{self.name}의 생일! 이제 {self.age}살")

buddy = Dog("Buddy", 3)
buddy.bark()
print(buddy.introduce())
buddy.have_birthday()`,
  steps: JSON.stringify([
    {
      line: 7,
      title: '메서드 정의',
      explanation:
        '메서드는 클래스 안에 정의된 함수입니다. 첫 번째 파라미터로 항상 self를 받습니다.',
    },
    {
      line: 9,
      title: 'self로 인스턴스 데이터 접근',
      explanation:
        'self.name으로 이 인스턴스의 name에 접근합니다. buddy.bark()를 호출하면 self는 buddy가 됩니다.',
    },
    {
      line: 17,
      title: '메서드로 상태 변경',
      explanation:
        'have_birthday()는 self.age를 1 증가시킵니다. 메서드는 인스턴스의 상태를 변경할 수 있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'buddy', type: 'ref', value: 'buddy', ref: 'buddy' }] },
        ],
        heap: [{ id: 'buddy', type: 'Dog', fields: { name: 'Buddy', age: 4 }, highlight: true }],
      },
      keyInsight:
        '메서드는 "객체가 할 수 있는 행동"을 정의합니다. 데이터(속성)와 행동(메서드)을 함께 묶는 것이 객체지향입니다.',
    },
    {
      line: 21,
      title: '메서드 호출',
      explanation:
        'buddy.bark()는 실제로 Dog.bark(buddy)와 같습니다. Python이 자동으로 buddy를 self로 전달합니다.',
      analogy:
        '메서드는 "객체에게 명령을 내리는 것"입니다. buddy.bark()는 "Buddy야, 짖어!"라고 말하는 것과 같습니다.',
    },
  ]),
};

const ch6_lesson6 = {
  lessonId: 'p-6-6',
  language: 'python',
  code: `# 상속: 기존 클래스를 확장
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        print(f"{self.name}이(가) 소리를 냅니다")

class Dog(Animal):  # Animal을 상속
    def speak(self):  # 메서드 오버라이딩
        print(f"{self.name}: 멍멍!")

    def fetch(self):  # Dog만의 메서드
        print(f"{self.name}이(가) 공을 가져옵니다")

class Cat(Animal):
    def speak(self):
        print(f"{self.name}: 야옹~")

# 사용
buddy = Dog("Buddy")
kitty = Cat("Kitty")

buddy.speak()   # 멍멍!
kitty.speak()   # 야옹~
buddy.fetch()   # Dog만 가능`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '부모 클래스 (Animal)',
      explanation:
        'Animal은 기본적인 동물의 속성(name)과 행동(speak)을 정의합니다.',
    },
    {
      line: 9,
      title: '상속 선언',
      explanation:
        'class Dog(Animal)은 Dog이 Animal을 상속한다는 의미입니다. Dog은 Animal의 모든 것을 물려받습니다.',
      keyInsight:
        '상속은 "is-a" 관계입니다. Dog is an Animal. 코드 재사용과 확장이 가능해집니다.',
    },
    {
      line: 10,
      title: '메서드 오버라이딩',
      explanation:
        'Dog에서 speak()를 다시 정의하면, 부모의 speak() 대신 이것이 사용됩니다. 이를 오버라이딩이라 합니다.',
    },
    {
      line: 13,
      title: '자식만의 메서드',
      explanation:
        'fetch()는 Dog에만 있는 메서드입니다. Cat이나 Animal에는 없습니다.',
    },
    {
      line: 24,
      title: '다형성',
      explanation:
        'buddy.speak()는 "멍멍!", kitty.speak()는 "야옹~"을 출력합니다. 같은 메서드 이름이지만 객체에 따라 다르게 동작합니다.',
      analogy:
        '상속은 "유전"과 비슷합니다. 자식은 부모의 특성을 물려받고, 필요하면 자신만의 특성을 추가하거나 변경합니다.',
    },
  ]),
};

// =============================================
// Chapter 7: 메모리 관리
// =============================================

const ch7_lesson1 = {
  lessonId: 'p-7-1',
  language: 'python',
  code: `# 참조 카운팅: 객체를 가리키는 이름표 개수
import sys

a = [1, 2, 3]
print(f"생성 직후 참조 수: {sys.getrefcount(a) - 1}")  # -1은 함수 호출 때문

b = a  # 같은 리스트를 가리킴
print(f"b = a 후 참조 수: {sys.getrefcount(a) - 1}")

c = a  # 또 가리킴
print(f"c = a 후 참조 수: {sys.getrefcount(a) - 1}")

del b  # 참조 하나 제거
print(f"del b 후 참조 수: {sys.getrefcount(a) - 1}")

# 참조가 0이 되면 객체는 삭제됨
del a
del c
# 이제 [1, 2, 3] 객체는 메모리에서 제거됨`,
  steps: JSON.stringify([
    {
      line: 4,
      title: '객체 생성, 참조 1개',
      explanation:
        '[1, 2, 3] 리스트가 생성되고, a가 이를 가리킵니다. 참조 카운트는 1입니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3], refCount: 1 }, highlight: true }],
      },
    },
    {
      line: 7,
      title: '참조 추가',
      explanation:
        'b = a는 같은 리스트를 가리킵니다. 참조 카운트가 2가 됩니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_1', ref: 'list_1' },
              { name: 'b', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3], refCount: 2 } }],
      },
    },
    {
      line: 13,
      title: '참조 제거',
      explanation:
        'del b는 b라는 이름표를 제거합니다. 객체 자체는 아직 a가 가리키므로 살아있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'a', type: 'ref', value: 'list_1', ref: 'list_1' }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3], refCount: 2 } }],
      },
      keyInsight:
        '참조 카운팅은 "이 객체를 가리키는 이름표가 몇 개인가?"를 세는 것입니다.',
    },
    {
      line: 17,
      title: '모든 참조 제거 = 삭제',
      explanation:
        'a와 c 모두 제거되면 참조 카운트가 0이 됩니다. Python이 자동으로 객체를 메모리에서 제거합니다.',
      analogy:
        '참조 카운팅은 "도서관 대출"과 같습니다. 아무도 빌려가지 않은 책(참조 0)은 폐기됩니다.',
    },
  ]),
};

const ch7_lesson2 = {
  lessonId: 'p-7-2',
  language: 'python',
  code: `# del의 진실: 객체가 아닌 이름표를 제거
a = [1, 2, 3]
b = a  # 같은 리스트

print(f"del 전 b: {b}")

del a  # a라는 이름표 제거

# a는 없지만 객체는 살아있음
# print(a)  # NameError!
print(f"del 후 b: {b}")  # [1, 2, 3] - 여전히 접근 가능!

# 객체가 정말 삭제되려면?
del b  # 마지막 참조 제거
# 이제 [1, 2, 3]은 메모리에서 제거됨

# 리스트 안의 요소 삭제는 다름
lst = [1, 2, 3]
del lst[0]  # 첫 번째 요소 삭제
print(f"요소 삭제 후: {lst}")  # [2, 3]`,
  steps: JSON.stringify([
    {
      line: 2,
      title: '두 이름표가 같은 객체',
      explanation:
        'a와 b 모두 같은 [1, 2, 3] 리스트를 가리킵니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true },
              { name: 'b', type: 'ref', value: 'list_1', ref: 'list_1', highlight: true },
            ],
          },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] } }],
      },
    },
    {
      line: 7,
      title: 'del a - 이름표 제거',
      explanation:
        'del a는 a라는 이름만 제거합니다. 객체는 b가 여전히 가리키므로 살아있습니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'b', type: 'ref', value: 'list_1', ref: 'list_1' }] },
        ],
        heap: [{ id: 'list_1', type: 'list', fields: { elements: [1, 2, 3] } }],
      },
      keyInsight:
        'del은 "이름표를 떼는 것"이지 "객체를 삭제하는 것"이 아닙니다.',
    },
    {
      line: 11,
      title: 'b로 여전히 접근 가능',
      explanation:
        'a가 없어도 b를 통해 리스트에 접근할 수 있습니다. 객체는 참조가 하나라도 있으면 살아있습니다.',
    },
    {
      line: 18,
      title: 'del lst[0]은 다름',
      explanation:
        'del lst[0]은 리스트 자체가 아니라, 리스트의 첫 번째 요소를 제거합니다. 리스트는 여전히 존재합니다.',
      memoryChanges: {
        stack: [
          { name: 'global', variables: [{ name: 'lst', type: 'ref', value: 'list_2', ref: 'list_2' }] },
        ],
        heap: [{ id: 'list_2', type: 'list', fields: { elements: [2, 3] }, highlight: true }],
      },
      analogy:
        'del 변수는 "책장에서 라벨을 떼는 것"이고, del lst[0]은 "책에서 한 페이지를 찢는 것"입니다.',
    },
  ]),
};

const ch7_lesson3 = {
  lessonId: 'p-7-3',
  language: 'python',
  code: `# 가비지 컬렉션: 참조 카운팅의 한계 보완
import gc

# 참조 카운팅으로 충분한 경우
a = [1, 2, 3]
del a  # 참조 0 → 즉시 삭제

# 가비지 컬렉터 정보
print(f"GC 활성화: {gc.isenabled()}")
print(f"수집 임계값: {gc.get_threshold()}")

# 수동으로 가비지 컬렉션 실행
collected = gc.collect()
print(f"수집된 객체 수: {collected}")

# 대부분의 경우 GC를 직접 호출할 필요 없음
# Python이 자동으로 관리함

# GC가 필요한 경우: 순환 참조 (다음 레슨에서)`,
  steps: JSON.stringify([
    {
      line: 5,
      title: '참조 카운팅으로 삭제',
      explanation:
        '대부분의 객체는 참조 카운팅만으로 삭제됩니다. del a로 참조가 0이 되면 즉시 메모리에서 제거됩니다.',
    },
    {
      line: 9,
      title: '가비지 컬렉터',
      explanation:
        'Python에는 참조 카운팅 외에 가비지 컬렉터(GC)가 있습니다. 순환 참조 같은 특수한 경우를 처리합니다.',
      keyInsight:
        'Python 메모리 관리 = 참조 카운팅(대부분) + 가비지 컬렉션(순환 참조)',
    },
    {
      line: 10,
      title: 'GC 임계값',
      explanation:
        'get_threshold()는 GC가 실행되는 조건을 보여줍니다. 일정 수의 할당이 일어나면 자동으로 GC가 실행됩니다.',
    },
    {
      line: 13,
      title: '수동 GC',
      explanation:
        'gc.collect()로 수동으로 GC를 실행할 수 있지만, 대부분의 경우 필요 없습니다.',
      analogy:
        '가비지 컬렉터는 "청소 로봇"과 같습니다. 평소에는 자동으로 돌아다니며 청소하고, 필요하면 수동으로 실행할 수도 있습니다.',
    },
  ]),
};

const ch7_lesson4 = {
  lessonId: 'p-7-4',
  language: 'python',
  code: `# 순환 참조: 서로를 가리키는 객체들
import gc

# 순환 참조 만들기
class Node:
    def __init__(self, value):
        self.value = value
        self.next = None

a = Node(1)
b = Node(2)

a.next = b  # a → b
b.next = a  # b → a (순환!)

# 외부 참조 제거
del a
del b

# 참조 카운팅으로는 삭제 불가!
# a는 b.next가 가리킴, b는 a.next가 가리킴
# 둘 다 참조 카운트 > 0

# GC가 순환 참조 감지하고 삭제
collected = gc.collect()
print(f"GC가 수집한 객체: {collected}")`,
  steps: JSON.stringify([
    {
      line: 10,
      title: '두 노드 생성',
      explanation:
        '두 개의 Node 객체 a와 b를 생성합니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'node_a', ref: 'node_a', highlight: true },
              { name: 'b', type: 'ref', value: 'node_b', ref: 'node_b', highlight: true },
            ],
          },
        ],
        heap: [
          { id: 'node_a', type: 'Node', fields: { value: 1, next: null } },
          { id: 'node_b', type: 'Node', fields: { value: 2, next: null } },
        ],
      },
    },
    {
      line: 13,
      title: '순환 참조 형성',
      explanation:
        'a.next = b, b.next = a로 서로를 가리키게 됩니다. 이것이 순환 참조입니다.',
      memoryChanges: {
        stack: [
          {
            name: 'global',
            variables: [
              { name: 'a', type: 'ref', value: 'node_a', ref: 'node_a' },
              { name: 'b', type: 'ref', value: 'node_b', ref: 'node_b' },
            ],
          },
        ],
        heap: [
          { id: 'node_a', type: 'Node', fields: { value: 1, next: '→node_b' }, highlight: true },
          { id: 'node_b', type: 'Node', fields: { value: 2, next: '→node_a' }, highlight: true },
        ],
      },
      keyInsight:
        '순환 참조: A가 B를 가리키고, B가 A를 가리키면, 외부 참조가 없어도 참조 카운트가 0이 되지 않습니다.',
    },
    {
      line: 17,
      title: 'del a - 첫 번째 참조 제거',
      explanation:
        'del a로 a 변수를 제거합니다. 하지만 Node(1) 객체는 b.next가 여전히 가리키고 있어서 삭제되지 않습니다.',
      pythonMemoryState: {
        names: [
          { name: 'b', pointsTo: 'node_b' },
        ],
        objects: [
          { id: 'node_a', type: 'Node', value: '{value: 1, next: →B}', highlight: true },
          { id: 'node_b', type: 'Node', value: '{value: 2, next: →A}' },
        ],
      },
    },
    {
      line: 18,
      title: 'del b - 두 번째 참조 제거',
      explanation:
        'del b로 b 변수도 제거합니다. 이제 외부에서 두 객체에 접근할 방법이 없지만, 서로를 가리키고 있어서 참조 카운트가 0이 아닙니다!',
      pythonMemoryState: {
        names: [],
        objects: [
          { id: 'node_a', type: 'Node', value: '{value: 1, next: →B}', highlight: true },
          { id: 'node_b', type: 'Node', value: '{value: 2, next: →A}', highlight: true },
        ],
      },
      keyInsight: '순환 참조 문제: 외부 참조가 없어도 서로를 가리키면 참조 카운트가 0이 되지 않습니다.',
    },
    {
      line: 24,
      title: 'GC가 순환 참조 처리',
      explanation:
        '가비지 컬렉터는 순환 참조를 감지하고 이런 "고아 객체들"을 삭제합니다.',
      analogy:
        '순환 참조는 "두 사람이 서로의 보증인이 되는 것"과 같습니다. 둘 다 외부 연결이 없어도 서로를 붙잡고 있어서, 특별한 검사(GC)가 필요합니다.',
    },
  ]),
};

// =============================================
// Seed 함수
// =============================================

async function seedPythonContent3() {
  console.log('🐍 Seeding Python LessonContent (Part 3 - Final)...\n');

  const contents = [
    // Chapter 5: 스코프와 네임스페이스
    ch5_lesson1,
    ch5_lesson2,
    ch5_lesson3,
    ch5_lesson4,
    // Chapter 6: 클래스와 객체
    ch6_lesson1,
    ch6_lesson2,
    ch6_lesson3,
    ch6_lesson4,
    ch6_lesson5,
    ch6_lesson6,
    // Chapter 7: 메모리 관리
    ch7_lesson1,
    ch7_lesson2,
    ch7_lesson3,
    ch7_lesson4,
  ];

  for (const content of contents) {
    // 레슨 존재 확인
    const lesson = await prisma.lesson.findUnique({
      where: { id: content.lessonId },
    });

    if (!lesson) {
      console.log(`⏭️ Skipping ${content.lessonId} - Lesson not found (run python-seed.ts first)`);
      continue;
    }

    // upsert로 콘텐츠 생성/업데이트
    await prisma.lessonContent.upsert({
      where: { lessonId: content.lessonId },
      create: {
        id: content.lessonId,
        lessonId: content.lessonId,
        language: content.language,
        code: content.code,
        steps: content.steps,
      },
      update: {
        code: content.code,
        steps: content.steps,
      },
    });

    console.log(`✅ ${lesson.title}`);
  }

  const total = await prisma.lessonContent.count({
    where: { language: 'python' },
  });
  console.log(`\n📊 Total Python LessonContents: ${total}`);
}

seedPythonContent3()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
