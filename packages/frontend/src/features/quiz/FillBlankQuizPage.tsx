/**
 * FillBlankQuizPage - 빈칸 코드 입력 퀴즈 페이지
 *
 * DESIGN: 언어별 챕터 선택 → 10문제 퀴즈 → 결과
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2, Check, X, RotateCcw, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useThemeStore } from '@/stores/themeStore';
import { codeViewerColors } from '@/config/themes';
import { Timer } from './components/Timer';
import { useStore } from '@/stores/store'; // useStore import 추가
import type { SupportedLanguage } from '@/types'; // SupportedLanguage import 추가

interface Quiz {
  id: string;
  question: string;
  code: string;
  answer: string;
  acceptedAnswers: string[];
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  quizzes: Quiz[];
}

// 언어별 테마
const LANGUAGE_THEMES: Record<string, { color: string; bg: string; name: string; icon: string }> = {
  c: { color: '#0077B6', bg: 'bg-sky-100', name: 'C', icon: 'C' },
  javascript: { color: '#F59E0B', bg: 'bg-amber-100', name: 'JavaScript', icon: '⚡' },
  java: { color: '#EC4899', bg: 'bg-pink-100', name: 'Java', icon: '☕' },
  python: { color: '#3776AB', bg: 'bg-yellow-100', name: 'Python', icon: '🐍' },
};

// 퀴즈 데이터
const QUIZ_DATA: Record<string, Chapter[]> = {
  c: [
    {
      id: 'c-1',
      title: '변수와 자료형',
      quizzes: [
        { id: '1', question: '정수형 변수 x를 선언하세요.', code: '____ x;', answer: 'int', acceptedAnswers: ['int'], explanation: 'int는 정수를 저장하는 자료형입니다.' },
        { id: '2', question: '변수 x에 10을 대입하세요.', code: 'int x;\nx ____ 10;', answer: '=', acceptedAnswers: ['='], explanation: '= 연산자는 오른쪽 값을 왼쪽 변수에 대입합니다.' },
        { id: '3', question: '실수형 변수를 선언하세요.', code: '____ pi = 3.14;', answer: 'float', acceptedAnswers: ['float', 'double'], explanation: 'float와 double은 실수를 저장하는 자료형입니다.' },
        { id: '4', question: '문자형 변수를 선언하세요.', code: '____ c = \'A\';', answer: 'char', acceptedAnswers: ['char'], explanation: 'char는 단일 문자를 저장하는 자료형입니다.' },
        { id: '5', question: 'x의 값을 1 증가시키세요.', code: 'int x = 5;\nx____;', answer: '++', acceptedAnswers: ['++'], explanation: '++ 연산자는 변수의 값을 1 증가시킵니다.' },
        { id: '6', question: '나눗셈의 나머지를 구하세요.', code: 'int r = 10 ____ 3;', answer: '%', acceptedAnswers: ['%'], explanation: '% 연산자는 나눗셈의 나머지를 반환합니다.' },
        { id: '7', question: '두 값이 같은지 비교하세요.', code: 'if (a ____ b)', answer: '==', acceptedAnswers: ['=='], explanation: '== 연산자는 두 값이 같은지 비교합니다.' },
        { id: '8', question: 'const로 상수를 선언하세요.', code: '____ int MAX = 100;', answer: 'const', acceptedAnswers: ['const'], explanation: 'const는 변수를 상수로 만들어 수정할 수 없게 합니다.' },
        { id: '9', question: 'unsigned 정수를 선언하세요.', code: '____ int count = 0;', answer: 'unsigned', acceptedAnswers: ['unsigned'], explanation: 'unsigned는 음수 없이 0 이상의 정수만 저장합니다.' },
        { id: '10', question: '변수의 크기를 바이트로 구하세요.', code: 'int size = ____(int);', answer: 'sizeof', acceptedAnswers: ['sizeof'], explanation: 'sizeof는 자료형이나 변수의 바이트 크기를 반환합니다.' },
      ],
    },
    {
      id: 'c-2',
      title: '포인터 기초',
      quizzes: [
        { id: '1', question: '포인터 p가 변수 x를 가리키도록 하세요.', code: 'int x = 10;\nint *p = ____;', answer: '&x', acceptedAnswers: ['&x', '& x'], explanation: '& 연산자는 변수의 주소를 반환합니다.' },
        { id: '2', question: '포인터가 가리키는 값을 읽으세요.', code: 'int *p = &x;\nint val = ____;', answer: '*p', acceptedAnswers: ['*p', '* p'], explanation: '* 연산자는 포인터가 가리키는 값을 역참조합니다.' },
        { id: '3', question: '정수 포인터를 선언하세요.', code: 'int ____ p;', answer: '*', acceptedAnswers: ['*'], explanation: '*를 붙여 포인터 변수를 선언합니다.' },
        { id: '4', question: 'NULL 포인터를 선언하세요.', code: 'int *p = ____;', answer: 'NULL', acceptedAnswers: ['NULL', '0', 'nullptr'], explanation: 'NULL은 아무것도 가리키지 않는 포인터입니다.' },
        { id: '5', question: '포인터를 통해 값을 변경하세요.', code: 'int x = 5;\nint *p = &x;\n____ = 10;', answer: '*p', acceptedAnswers: ['*p', '* p'], explanation: '*p를 통해 포인터가 가리키는 값을 변경할 수 있습니다.' },
        { id: '6', question: '이중 포인터를 선언하세요.', code: 'int x = 10;\nint *p = &x;\nint ____ pp = &p;', answer: '**', acceptedAnswers: ['**'], explanation: '**은 포인터의 포인터(이중 포인터)를 의미합니다.' },
        { id: '7', question: '배열의 첫 요소 주소를 얻으세요.', code: 'int arr[5];\nint *p = ____;', answer: 'arr', acceptedAnswers: ['arr', '&arr[0]'], explanation: '배열 이름은 첫 번째 요소의 주소를 나타냅니다.' },
        { id: '8', question: '포인터 연산으로 다음 요소로 이동하세요.', code: 'int *p = arr;\np = p ____ 1;', answer: '+', acceptedAnswers: ['+'], explanation: '포인터에 정수를 더하면 그만큼 요소를 이동합니다.' },
        { id: '9', question: '배열 인덱스를 포인터로 표현하세요.', code: 'int arr[5];\nint val = ____(arr + 2);', answer: '*', acceptedAnswers: ['*'], explanation: '*(arr + i)는 arr[i]와 동일합니다.' },
        { id: '10', question: 'void 포인터를 선언하세요.', code: '____ *ptr;', answer: 'void', acceptedAnswers: ['void'], explanation: 'void 포인터는 어떤 타입도 가리킬 수 있습니다.' },
      ],
    },
    {
      id: 'c-3',
      title: '동적 메모리',
      quizzes: [
        { id: '1', question: '동적 메모리를 할당하세요.', code: 'int *p = (int *)____(sizeof(int));', answer: 'malloc', acceptedAnswers: ['malloc'], explanation: 'malloc은 지정된 크기만큼 메모리를 할당합니다.' },
        { id: '2', question: '할당된 메모리를 해제하세요.', code: '____(p);', answer: 'free', acceptedAnswers: ['free'], explanation: 'free는 동적 할당된 메모리를 해제합니다.' },
        { id: '3', question: '5개 정수 배열을 동적 할당하세요.', code: 'int *arr = (int *)malloc(____ * sizeof(int));', answer: '5', acceptedAnswers: ['5'], explanation: '배열 크기 * 요소 크기로 총 바이트를 계산합니다.' },
        { id: '4', question: '0으로 초기화된 메모리를 할당하세요.', code: 'int *p = (int *)____(5, sizeof(int));', answer: 'calloc', acceptedAnswers: ['calloc'], explanation: 'calloc은 메모리를 0으로 초기화하여 할당합니다.' },
        { id: '5', question: '메모리 크기를 재할당하세요.', code: 'p = (int *)____(p, 10 * sizeof(int));', answer: 'realloc', acceptedAnswers: ['realloc'], explanation: 'realloc은 기존 메모리의 크기를 변경합니다.' },
        { id: '6', question: '할당 실패를 확인하세요.', code: 'if (p == ____)', answer: 'NULL', acceptedAnswers: ['NULL', '0'], explanation: '할당 실패 시 NULL이 반환됩니다.' },
        { id: '7', question: '메모리를 특정 값으로 설정하세요.', code: '____(p, 0, sizeof(int) * 5);', answer: 'memset', acceptedAnswers: ['memset'], explanation: 'memset은 메모리를 특정 바이트 값으로 채웁니다.' },
        { id: '8', question: '메모리를 복사하세요.', code: '____(dest, src, sizeof(int) * 5);', answer: 'memcpy', acceptedAnswers: ['memcpy'], explanation: 'memcpy는 메모리 내용을 복사합니다.' },
        { id: '9', question: '해제 후 포인터를 안전하게 처리하세요.', code: 'free(p);\np = ____;', answer: 'NULL', acceptedAnswers: ['NULL', '0'], explanation: '해제 후 NULL로 설정하면 댕글링 포인터를 방지합니다.' },
        { id: '10', question: '구조체를 동적 할당하세요.', code: 'struct Node *n = (struct Node *)malloc(____(struct Node));', answer: 'sizeof', acceptedAnswers: ['sizeof'], explanation: 'sizeof로 구조체 크기를 구해 할당합니다.' },
      ],
    },
  ],
  javascript: [
    {
      id: 'js-1',
      title: '변수와 스코프',
      quizzes: [
        { id: '1', question: '블록 스코프 변수를 선언하세요.', code: '____ x = 10;', answer: 'let', acceptedAnswers: ['let'], explanation: 'let은 블록 스코프를 가지는 변수를 선언합니다.' },
        { id: '2', question: '상수를 선언하세요.', code: '____ PI = 3.14;', answer: 'const', acceptedAnswers: ['const'], explanation: 'const는 재할당이 불가능한 상수를 선언합니다.' },
        { id: '3', question: '템플릿 리터럴을 사용하세요.', code: 'const msg = ____Hello, ${name}!____;', answer: '`', acceptedAnswers: ['`', '\\`'], explanation: '백틱(`)으로 템플릿 리터럴을 만듭니다.' },
        { id: '4', question: '구조분해 할당을 하세요.', code: 'const ____ a, b ____ = [1, 2];', answer: '[', acceptedAnswers: ['['], explanation: '배열 구조분해는 []를 사용합니다.' },
        { id: '5', question: '객체 구조분해를 하세요.', code: 'const ____ name ____ = person;', answer: '{', acceptedAnswers: ['{'], explanation: '객체 구조분해는 {}를 사용합니다.' },
        { id: '6', question: '스프레드 연산자를 사용하세요.', code: 'const arr2 = [____arr1, 4, 5];', answer: '...', acceptedAnswers: ['...'], explanation: '...은 배열을 펼쳐서 복사합니다.' },
        { id: '7', question: 'null 병합 연산자를 사용하세요.', code: 'const val = x ____ "default";', answer: '??', acceptedAnswers: ['??'], explanation: '??는 null이나 undefined일 때 기본값을 반환합니다.' },
        { id: '8', question: '옵셔널 체이닝을 사용하세요.', code: 'const name = user____name;', answer: '?.', acceptedAnswers: ['?.'], explanation: '?.는 속성이 없어도 에러를 발생시키지 않습니다.' },
        { id: '9', question: '화살표 함수를 선언하세요.', code: 'const add = (a, b) ____ a + b;', answer: '=>', acceptedAnswers: ['=>'], explanation: '=>로 화살표 함수를 만듭니다.' },
        { id: '10', question: '기본 매개변수를 설정하세요.', code: 'function greet(name ____ "Guest") {}', answer: '=', acceptedAnswers: ['='], explanation: '매개변수에 =로 기본값을 설정합니다.' },
      ],
    },
    {
      id: 'js-2',
      title: '배열과 객체',
      quizzes: [
        { id: '1', question: '배열 끝에 요소를 추가하세요.', code: 'arr.____(5);', answer: 'push', acceptedAnswers: ['push'], explanation: 'push는 배열 끝에 요소를 추가합니다.' },
        { id: '2', question: '배열 끝 요소를 제거하세요.', code: 'const last = arr.____();', answer: 'pop', acceptedAnswers: ['pop'], explanation: 'pop은 배열 끝 요소를 제거하고 반환합니다.' },
        { id: '3', question: '배열을 순회하세요.', code: 'arr.____(item => console.log(item));', answer: 'forEach', acceptedAnswers: ['forEach'], explanation: 'forEach는 배열의 각 요소에 함수를 실행합니다.' },
        { id: '4', question: '배열을 변환하세요.', code: 'const doubled = arr.____(x => x * 2);', answer: 'map', acceptedAnswers: ['map'], explanation: 'map은 배열의 각 요소를 변환한 새 배열을 반환합니다.' },
        { id: '5', question: '배열을 필터링하세요.', code: 'const evens = arr.____(x => x % 2 === 0);', answer: 'filter', acceptedAnswers: ['filter'], explanation: 'filter는 조건을 만족하는 요소만 모은 배열을 반환합니다.' },
        { id: '6', question: '배열을 하나의 값으로 줄이세요.', code: 'const sum = arr.____((a, b) => a + b, 0);', answer: 'reduce', acceptedAnswers: ['reduce'], explanation: 'reduce는 배열을 누적하여 단일 값으로 만듭니다.' },
        { id: '7', question: '요소를 찾으세요.', code: 'const found = arr.____(x => x > 10);', answer: 'find', acceptedAnswers: ['find'], explanation: 'find는 조건을 만족하는 첫 번째 요소를 반환합니다.' },
        { id: '8', question: '조건을 모두 만족하는지 확인하세요.', code: 'const allPositive = arr.____(x => x > 0);', answer: 'every', acceptedAnswers: ['every'], explanation: 'every는 모든 요소가 조건을 만족하면 true를 반환합니다.' },
        { id: '9', question: '배열을 정렬하세요.', code: 'arr.____(a, b) => a - b);', answer: 'sort((', acceptedAnswers: ['sort(('], explanation: 'sort는 배열을 정렬합니다. 비교 함수가 필요합니다.' },
        { id: '10', question: '배열에 요소가 있는지 확인하세요.', code: 'const has5 = arr.____(5);', answer: 'includes', acceptedAnswers: ['includes'], explanation: 'includes는 배열에 요소가 있으면 true를 반환합니다.' },
      ],
    },
  ],
  java: [
    {
      id: 'java-1',
      title: '클래스와 객체',
      quizzes: [
        { id: '1', question: '클래스를 선언하세요.', code: 'public ____ Person {}', answer: 'class', acceptedAnswers: ['class'], explanation: 'class 키워드로 클래스를 선언합니다.' },
        { id: '2', question: '객체를 생성하세요.', code: 'Person p = ____ Person();', answer: 'new', acceptedAnswers: ['new'], explanation: 'new 키워드로 객체를 생성합니다.' },
        { id: '3', question: '생성자를 정의하세요.', code: 'public ____(String name) { this.name = name; }', answer: 'Person', acceptedAnswers: ['Person'], explanation: '생성자는 클래스 이름과 동일합니다.' },
        { id: '4', question: '현재 객체를 참조하세요.', code: '____.name = name;', answer: 'this', acceptedAnswers: ['this'], explanation: 'this는 현재 객체를 참조합니다.' },
        { id: '5', question: '접근 제어자를 사용하세요.', code: '____ String name;', answer: 'private', acceptedAnswers: ['private'], explanation: 'private은 클래스 내부에서만 접근 가능합니다.' },
        { id: '6', question: 'getter 메서드를 정의하세요.', code: 'public String ____() { return name; }', answer: 'getName', acceptedAnswers: ['getName'], explanation: 'getter는 필드 값을 반환하는 메서드입니다.' },
        { id: '7', question: 'setter 메서드를 정의하세요.', code: 'public void ____(String name) { this.name = name; }', answer: 'setName', acceptedAnswers: ['setName'], explanation: 'setter는 필드 값을 설정하는 메서드입니다.' },
        { id: '8', question: '정적 변수를 선언하세요.', code: 'public ____ int count = 0;', answer: 'static', acceptedAnswers: ['static'], explanation: 'static은 클래스 레벨의 변수를 선언합니다.' },
        { id: '9', question: '상수를 선언하세요.', code: 'public static ____ int MAX = 100;', answer: 'final', acceptedAnswers: ['final'], explanation: 'final은 값을 변경할 수 없는 상수를 만듭니다.' },
        { id: '10', question: '인스턴스 타입을 확인하세요.', code: 'if (obj ____ String)', answer: 'instanceof', acceptedAnswers: ['instanceof'], explanation: 'instanceof는 객체의 타입을 확인합니다.' },
      ],
    },
    {
      id: 'java-2',
      title: '상속과 인터페이스',
      quizzes: [
        { id: '1', question: '클래스를 상속하세요.', code: 'public class Dog ____ Animal {}', answer: 'extends', acceptedAnswers: ['extends'], explanation: 'extends로 클래스를 상속합니다.' },
        { id: '2', question: '인터페이스를 구현하세요.', code: 'public class Cat ____ Runnable {}', answer: 'implements', acceptedAnswers: ['implements'], explanation: 'implements로 인터페이스를 구현합니다.' },
        { id: '3', question: '부모 클래스 생성자를 호출하세요.', code: '____(name);', answer: 'super', acceptedAnswers: ['super'], explanation: 'super()로 부모 클래스 생성자를 호출합니다.' },
        { id: '4', question: '메서드를 오버라이드하세요.', code: '____\npublic void speak() {}', answer: '@Override', acceptedAnswers: ['@Override'], explanation: '@Override 어노테이션은 오버라이드를 명시합니다.' },
        { id: '5', question: '추상 클래스를 선언하세요.', code: 'public ____ class Shape {}', answer: 'abstract', acceptedAnswers: ['abstract'], explanation: 'abstract 클래스는 인스턴스화할 수 없습니다.' },
        { id: '6', question: '추상 메서드를 선언하세요.', code: 'public abstract void ____();', answer: 'draw', acceptedAnswers: ['draw'], explanation: '추상 메서드는 구현 없이 선언만 합니다.' },
        { id: '7', question: '인터페이스를 선언하세요.', code: 'public ____ Drawable {}', answer: 'interface', acceptedAnswers: ['interface'], explanation: 'interface 키워드로 인터페이스를 선언합니다.' },
        { id: '8', question: '다형성을 활용하세요.', code: '____ animal = new Dog();', answer: 'Animal', acceptedAnswers: ['Animal'], explanation: '부모 타입으로 자식 객체를 참조할 수 있습니다.' },
        { id: '9', question: '상속을 방지하세요.', code: 'public ____ class Constants {}', answer: 'final', acceptedAnswers: ['final'], explanation: 'final 클래스는 상속할 수 없습니다.' },
        { id: '10', question: '형변환을 하세요.', code: 'Dog dog = (____) animal;', answer: 'Dog', acceptedAnswers: ['Dog'], explanation: '다운캐스팅 시 명시적 형변환이 필요합니다.' },
      ],
    },
  ],
  python: [
    {
      id: 'py-1',
      title: '기본 문법',
      quizzes: [
        { id: '1', question: '변수에 값을 할당하세요.', code: 'x ____ 10', answer: '=', acceptedAnswers: ['='], explanation: 'Python에서 =는 할당 연산자입니다.' },
        { id: '2', question: '리스트를 생성하세요.', code: 'nums = ____1, 2, 3____', answer: '[', acceptedAnswers: ['['], explanation: '대괄호로 리스트를 생성합니다.' },
        { id: '3', question: '딕셔너리를 생성하세요.', code: 'person = ____"name": "Kim"____', answer: '{', acceptedAnswers: ['{'], explanation: '중괄호로 딕셔너리를 생성합니다.' },
        { id: '4', question: '함수를 정의하세요.', code: '____ greet(name):\n    return f"Hello, {name}"', answer: 'def', acceptedAnswers: ['def'], explanation: 'def 키워드로 함수를 정의합니다.' },
        { id: '5', question: 'if 조건문을 작성하세요.', code: '____ x > 0:\n    print("양수")', answer: 'if', acceptedAnswers: ['if'], explanation: 'if 키워드로 조건문을 시작합니다.' },
        { id: '6', question: 'for 반복문을 작성하세요.', code: '____ i in range(5):\n    print(i)', answer: 'for', acceptedAnswers: ['for'], explanation: 'for 키워드로 반복문을 시작합니다.' },
        { id: '7', question: '범위를 생성하세요.', code: 'for i in ____(10):', answer: 'range', acceptedAnswers: ['range'], explanation: 'range는 숫자 시퀀스를 생성합니다.' },
        { id: '8', question: '리스트 길이를 구하세요.', code: 'size = ____(nums)', answer: 'len', acceptedAnswers: ['len'], explanation: 'len은 컬렉션의 길이를 반환합니다.' },
        { id: '9', question: 'None을 확인하세요.', code: 'if x ____ None:', answer: 'is', acceptedAnswers: ['is'], explanation: 'None 비교에는 is를 사용합니다.' },
        { id: '10', question: '클래스를 정의하세요.', code: '____ Person:\n    pass', answer: 'class', acceptedAnswers: ['class'], explanation: 'class 키워드로 클래스를 정의합니다.' },
      ],
    },
    {
      id: 'py-2',
      title: '리스트와 함수',
      quizzes: [
        { id: '1', question: '리스트에 요소를 추가하세요.', code: 'nums.____(5)', answer: 'append', acceptedAnswers: ['append'], explanation: 'append는 리스트 끝에 요소를 추가합니다.' },
        { id: '2', question: '리스트에서 요소를 제거하세요.', code: 'nums.____(0)', answer: 'pop', acceptedAnswers: ['pop'], explanation: 'pop은 지정된 인덱스의 요소를 제거합니다.' },
        { id: '3', question: '리스트 컴프리헨션을 사용하세요.', code: 'squares = [x**2 ____ x in range(5)]', answer: 'for', acceptedAnswers: ['for'], explanation: '리스트 컴프리헨션의 for 절입니다.' },
        { id: '4', question: '람다 함수를 작성하세요.', code: 'add = ____ a, b: a + b', answer: 'lambda', acceptedAnswers: ['lambda'], explanation: 'lambda로 익명 함수를 만듭니다.' },
        { id: '5', question: 'map 함수를 사용하세요.', code: 'doubled = ____(lambda x: x*2, nums)', answer: 'map', acceptedAnswers: ['map'], explanation: 'map은 함수를 모든 요소에 적용합니다.' },
        { id: '6', question: 'filter 함수를 사용하세요.', code: 'evens = ____(lambda x: x%2==0, nums)', answer: 'filter', acceptedAnswers: ['filter'], explanation: 'filter는 조건을 만족하는 요소만 반환합니다.' },
        { id: '7', question: '슬라이싱을 사용하세요.', code: 'first_three = nums[____]', answer: ':3', acceptedAnswers: [':3', '0:3'], explanation: '[:3]은 처음 3개 요소를 가져옵니다.' },
        { id: '8', question: '리스트를 정렬하세요.', code: 'nums.____() ', answer: 'sort', acceptedAnswers: ['sort'], explanation: 'sort는 리스트를 제자리 정렬합니다.' },
        { id: '9', question: '리스트를 뒤집으세요.', code: 'nums.____() ', answer: 'reverse', acceptedAnswers: ['reverse'], explanation: 'reverse는 리스트를 제자리에서 뒤집습니다.' },
        { id: '10', question: '요소의 인덱스를 찾으세요.', code: 'idx = nums.____(5)', answer: 'index', acceptedAnswers: ['index'], explanation: 'index는 요소의 인덱스를 반환합니다.' },
      ],
    },
  ],
};

type ViewState = 'chapters' | 'quiz' | 'result';
type QuizState = 'question' | 'correct' | 'incorrect';

export function FillBlankQuizPage() {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const currentTheme = useThemeStore((s) => s.theme);
  const colors = codeViewerColors[currentTheme];

  const [viewState, setViewState] = useState<ViewState>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const setPageTitle = useStore((s) => s.setPageTitle);
  const theme = LANGUAGE_THEMES[lang || 'c'] || LANGUAGE_THEMES.c;

  useEffect(() => {
    setPageTitle(
      `${theme.name} 빈칸 퀴즈`,
      '제시된 코드의 빈칸을 채워보세요',
      lang as SupportedLanguage
    );
  }, [setPageTitle, theme.name, lang]);

  const chapters = QUIZ_DATA[lang || 'c'] || QUIZ_DATA.c;

  const currentQuiz = selectedChapter?.quizzes[currentIndex];
  const totalQuizzes = selectedChapter?.quizzes.length || 0;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setCurrentIndex(0);
    setQuizState('question');
    setUserInput('');
    setScore(0);
    setWrongCount(0);
    setViewState('quiz');
  };

  const handleSubmit = () => {
    if (!userInput.trim() || !currentQuiz) return;

    // 공백 제거 + 전각→반각 변환 + 대소문자 정규화
    const normalize = (str: string) =>
      str
        .replace(/\s+/g, '')     // 모든 공백 제거
        .normalize('NFKC')       // 전각 문자를 반각으로 변환
        .toLowerCase();          // 대소문자 통일

    const isCorrect = currentQuiz.acceptedAnswers.some(
      (accepted) => normalize(accepted) === normalize(userInput)
    );

    if (isCorrect) {
      setScore(score + 1);
      setQuizState('correct');
    } else {
      setWrongCount(wrongCount + 1);
      setQuizState('incorrect');
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuizzes - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuizState('question');
      setUserInput('');
    } else {
      setViewState('result');
    }
  };

  const handleTimeout = () => {
    if (!currentQuiz) return;
    setWrongCount(wrongCount + 1);
    setQuizState('incorrect');
    setUserInput(''); // Clear input
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setUserInput('');
    setScore(0);
    setWrongCount(0);
    setViewState('quiz');
  };

  const handleBackToChapters = () => {
    setViewState('chapters');
    setSelectedChapter(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quizState === 'question') {
      handleSubmit();
    }
  };

  // 코드에서 빈칸을 하이라이트
  const renderCode = () => {
    if (!currentQuiz) return null;
    const parts = currentQuiz.code.split('____');

    // 테마별 빈칸 하이라이트 색상
    const blankColors = {
      soft: { bg: '#f3e8ff', text: '#7c3aed' },     // 연보라
      minimal: { bg: '#fef3c7', text: '#92400e' },  // 연갈색
      dark: { bg: '#312e81', text: '#a78bfa' },     // 사이버펑크 보라
    };

    return (
      <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => (
          <span key={index}>
            <span style={{ color: colors.text }}>{part}</span>
            {index < parts.length - 1 && (
              <span className={`px-2 py-0.5 rounded ${
                quizState === 'correct'
                  ? 'bg-green-200 text-green-700'
                  : quizState === 'incorrect'
                  ? 'bg-red-200 text-red-700'
                  : ''
              }`}
                style={quizState === 'question' ? {
                  backgroundColor: blankColors[currentTheme].bg,
                  color: blankColors[currentTheme].text,
                } : undefined}
              >
                {quizState === 'question' ? '____' : currentQuiz.answer}
              </span>
            )}
          </span>
        ))}
      </pre>
    );
  };

  // 챕터 선택 화면
  if (viewState === 'chapters') {
    return (
      <div className="min-h-screen bg-[var(--theme-quiz-page-bg)] p-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate('/quiz')}
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </button>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: theme.color }}
            >
              {theme.icon}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--theme-quiz-title)]">{theme.name} 빈칸 코드</h1>
              <p className="text-sm text-[var(--theme-quiz-text-muted)]">챕터를 선택하세요</p>
            </div>
          </div>

          {/* 챕터 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chapters.map((chapter, idx) => (
              <motion.button
                key={chapter.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChapterSelect(chapter)}
                className="p-6 rounded-2xl border-2 border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] hover:border-purple-300 hover:shadow-lg transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: theme.color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[var(--theme-quiz-title)] text-lg">{chapter.title}</h3>
                    <p className="text-sm text-[var(--theme-quiz-text-muted)]">{chapter.quizzes.length}문제</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 결과 화면
  if (viewState === 'result') {
    const percentage = Math.round((score / totalQuizzes) * 100);
    return (
      <div className="min-h-screen bg-[var(--theme-quiz-page-bg)] p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={handleBackToChapters}
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </button>
            <h1 className="text-xl font-bold text-[var(--theme-quiz-title)]">퀴즈 결과</h1>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border border-[var(--theme-quiz-card-border)] p-8 text-center shadow-lg"
          >
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              percentage >= 80 ? 'bg-green-100' : percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-3xl font-bold ${
                percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {percentage}%
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--theme-quiz-title)] mb-2">
              {percentage >= 80 ? '훌륭해요!' : percentage >= 60 ? '잘했어요!' : '다시 도전해보세요!'}
            </h2>
            <p className="text-[var(--theme-quiz-text-muted)] mb-2">
              {selectedChapter?.title}
            </p>
            <p className="text-lg text-[var(--theme-quiz-title)] mb-6">
              <span className="text-green-600 font-bold">{score}문제</span> 정답 / <span className="text-red-500 font-bold">{wrongCount}문제</span> 오답
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl border border-[var(--theme-quiz-card-border)] text-[var(--theme-quiz-title)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                다시 풀기
              </button>
              <button
                onClick={handleBackToChapters}
                className="flex-1 py-4 rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors"
              >
                챕터 선택
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // 퀴즈 화면
  return (
    <div className="min-h-screen bg-[var(--theme-quiz-page-bg)] p-6">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBackToChapters}
            className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.title}</h1>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-600">맞춤 {score}</span>
              <span className="text-[var(--theme-quiz-text-muted)]">{currentIndex + 1}/{totalQuizzes}</span>
              <span className="text-red-500">틀림 {wrongCount}</span>
            </div>
          </div>
        </div>

        {/* 진행률 */}
        <div className="mb-6">
          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 타이머 */}
        <div className="mb-4 flex justify-center">
          <Timer
            key={currentIndex}
            duration={15}
            onTimeout={handleTimeout}
            isPaused={quizState !== 'question'}
          />
        </div>

        {/* 퀴즈 카드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* 질문 */}
            <div className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border-2 border-[var(--theme-quiz-card-border)] p-6 mb-4 shadow-lg">
              <p className="text-[var(--theme-quiz-title)] font-medium mb-4">
                {currentQuiz?.question}
              </p>

              {/* 코드 블록 */}
              <div className={`p-4 rounded-xl border-2 ${
                quizState === 'correct'
                  ? 'bg-green-50 border-green-300'
                  : quizState === 'incorrect'
                  ? 'bg-red-50 border-red-300'
                  : ''
              }`}
                style={quizState === 'question' ? {
                  backgroundColor: colors.bg,
                  borderColor: colors.lineNumberBorder,
                } : undefined}
              >
                {renderCode()}
              </div>
            </div>

            {/* 입력 필드 */}
            {quizState === 'question' ? (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="빈칸에 들어갈 코드"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-[var(--theme-quiz-card-border)] focus:border-purple-400 focus:outline-none font-mono text-lg"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                  className="px-6 py-3 rounded-xl bg-purple-500 text-white font-semibold shadow-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  확인
                </motion.button>
              </div>
            ) : (
              <>
                {/* 사용자 답변 표시 */}
                <div className={`p-4 rounded-xl border-2 mb-4 ${
                  quizState === 'correct'
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-400 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--theme-quiz-text-muted)]">내 답변:</span>
                    <code className={`px-2 py-1 rounded font-mono text-sm ${
                      quizState === 'correct' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                    }`}>
                      {userInput}
                    </code>
                  </div>
                  {quizState === 'incorrect' && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--theme-quiz-text-muted)]">정답:</span>
                      <code className="px-2 py-1 rounded font-mono text-sm bg-green-200 text-green-700">
                        {currentQuiz?.answer}
                      </code>
                    </div>
                  )}
                </div>

                {/* 해설 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`p-4 rounded-xl ${
                    quizState === 'correct' ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {quizState === 'correct' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      quizState === 'correct' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {quizState === 'correct' ? '정답!' : '오답!'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--theme-quiz-title)]">
                    {currentQuiz?.explanation}
                  </p>
                </motion.div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 다음 버튼 */}
        {quizState !== 'question' && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="w-full mt-6 py-4 rounded-2xl bg-[var(--theme-dashboard-accent)] text-white font-semibold shadow-lg hover:bg-[var(--theme-dashboard-accent-hover)] transition-colors"
          >
            {currentIndex < totalQuizzes - 1 ? '다음 문제' : '결과 보기'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
