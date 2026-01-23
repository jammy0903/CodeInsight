/**
 * MultipleChoiceQuizPage - 객관식 퀴즈 페이지
 *
 * DESIGN: 언어 → 챕터 선택 → 10문제 퀴즈
 * URL: /quiz/multiple-choice/:lang
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ListChecks, Check, X, RotateCcw, BookOpen, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Timer } from './components/Timer';
import { useStore } from '@/stores/store'; // useStore import 추가
import type { SupportedLanguage } from '@/types'; // SupportedLanguage import 추가

// 언어별 정보
const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  c: { name: 'C', icon: 'C', color: '#0077B6' },
  javascript: { name: 'JavaScript', icon: '⚡', color: '#F59E0B' },
  java: { name: 'Java', icon: '☕', color: '#EC4899' },
  python: { name: 'Python', icon: '🐍', color: '#3776AB' },
};

// 챕터별 퀴즈 데이터 타입
interface MCQuiz {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  quizzes: MCQuiz[];
}

// 언어별 챕터 퀴즈 데이터
const QUIZ_DATA: Record<string, Chapter[]> = {
  c: [
    {
      id: 'c-1',
      title: '변수와 자료형',
      quizzes: [
        { id: '1', question: '정수를 저장하는 기본 자료형은?', options: ['float', 'char', 'int', 'double'], answer: 2, explanation: 'int는 정수를 저장하는 기본 자료형입니다.' },
        { id: '2', question: '실수를 저장하는 자료형이 아닌 것은?', options: ['float', 'double', 'long double', 'int'], answer: 3, explanation: 'int는 정수형입니다. float, double, long double은 실수형입니다.' },
        { id: '3', question: 'sizeof(char)의 결과는?', options: ['0', '1', '2', '4'], answer: 1, explanation: 'char는 항상 1바이트입니다.' },
        { id: '4', question: '변수명으로 사용할 수 없는 것은?', options: ['_name', 'name1', '1name', 'Name'], answer: 2, explanation: '변수명은 숫자로 시작할 수 없습니다.' },
        { id: '5', question: 'const int x = 5; 에서 x의 특징은?', options: ['수정 가능', '수정 불가능', '선언 후 삭제 가능', '음수 불가'], answer: 1, explanation: 'const는 상수를 선언하며 값을 변경할 수 없습니다.' },
        { id: '6', question: '전역 변수의 기본 초기값은?', options: ['쓰레기 값', '0', '-1', '1'], answer: 1, explanation: '전역 변수는 자동으로 0으로 초기화됩니다.' },
        { id: '7', question: 'unsigned int의 최소값은?', options: ['-1', '0', '1', '-2147483648'], answer: 1, explanation: 'unsigned는 부호가 없어 0부터 시작합니다.' },
        { id: '8', question: 'char 변수에 저장되는 것은?', options: ['문자열', 'ASCII 코드', '실수', '배열'], answer: 1, explanation: 'char는 문자의 ASCII 코드 값(정수)을 저장합니다.' },
        { id: '9', question: '지역 변수가 저장되는 메모리 영역은?', options: ['Heap', 'Stack', 'Data', 'Code'], answer: 1, explanation: '지역 변수는 Stack 메모리에 저장됩니다.' },
        { id: '10', question: 'typedef의 용도는?', options: ['변수 선언', '함수 정의', '타입 별칭', '조건문'], answer: 2, explanation: 'typedef는 기존 타입에 새 이름(별칭)을 부여합니다.' },
      ],
    },
    {
      id: 'c-2',
      title: '포인터 기초',
      quizzes: [
        { id: '1', question: '포인터 선언으로 올바른 것은?', options: ['int p;', 'int *p;', 'int &p;', 'pointer p;'], answer: 1, explanation: '포인터는 자료형 뒤에 *를 붙여 선언합니다.' },
        { id: '2', question: '변수 x의 주소를 얻는 연산자는?', options: ['*', '&', '->', '.'], answer: 1, explanation: '& 연산자는 변수의 메모리 주소를 반환합니다.' },
        { id: '3', question: '포인터 p가 가리키는 값을 읽는 방법은?', options: ['p', '&p', '*p', '**p'], answer: 2, explanation: '* 연산자로 포인터가 가리키는 값에 접근합니다.' },
        { id: '4', question: 'NULL의 값은?', options: ['-1', '0', '1', 'undefined'], answer: 1, explanation: 'NULL은 일반적으로 0으로 정의됩니다.' },
        { id: '5', question: '32비트 시스템에서 int *p의 크기는?', options: ['1 바이트', '2 바이트', '4 바이트', '8 바이트'], answer: 2, explanation: '32비트 시스템에서 모든 포인터는 4바이트입니다.' },
        { id: '6', question: 'int arr[5]; 에서 arr과 같은 것은?', options: ['arr[0]', '&arr[0]', '*arr', 'arr[5]'], answer: 1, explanation: '배열 이름은 첫 번째 요소의 주소와 같습니다.' },
        { id: '7', question: 'void *의 특징은?', options: ['역참조 불가', '산술 연산 가능', '크기가 0', '선언 불가'], answer: 0, explanation: 'void 포인터는 타입 정보가 없어 직접 역참조할 수 없습니다.' },
        { id: '8', question: 'int *p = &x; p++; 하면?', options: ['주소가 1 증가', '주소가 4 증가', '값이 1 증가', '에러 발생'], answer: 1, explanation: 'int 포인터는 sizeof(int) = 4바이트만큼 주소가 증가합니다.' },
        { id: '9', question: '이중 포인터 선언은?', options: ['int *p', 'int **p', 'int *p[]', 'int p**'], answer: 1, explanation: '이중 포인터는 **를 사용하여 선언합니다.' },
        { id: '10', question: '함수에 배열을 전달하면?', options: ['값 복사', '주소 전달', '에러', '불가능'], answer: 1, explanation: '배열은 함수에 전달될 때 첫 번째 요소의 주소가 전달됩니다.' },
      ],
    },
  ],
  javascript: [
    {
      id: 'js-1',
      title: '변수와 타입',
      quizzes: [
        { id: '1', question: '재선언이 가능한 변수 선언 키워드는?', options: ['let', 'const', 'var', 'static'], answer: 2, explanation: 'var는 같은 스코프에서 재선언이 가능합니다.' },
        { id: '2', question: 'typeof null의 결과는?', options: ['"null"', '"undefined"', '"object"', '"boolean"'], answer: 2, explanation: 'JavaScript의 유명한 버그로, typeof null은 "object"를 반환합니다.' },
        { id: '3', question: 'undefined와 null의 비교 결과는?', options: ['undefined == null', 'undefined === null', '둘 다 true', '둘 다 false'], answer: 0, explanation: '== 연산자로는 true, === 연산자로는 false입니다.' },
        { id: '4', question: 'NaN === NaN의 결과는?', options: ['true', 'false', 'undefined', 'error'], answer: 1, explanation: 'NaN은 자기 자신과도 같지 않은 유일한 값입니다.' },
        { id: '5', question: '블록 스코프를 가지는 것은?', options: ['var', 'let', 'function', 'global'], answer: 1, explanation: 'let과 const는 블록 스코프를 가집니다.' },
        { id: '6', question: '"5" + 3의 결과는?', options: ['8', '"53"', 'NaN', 'error'], answer: 1, explanation: '문자열과 숫자의 + 연산은 문자열 연결을 수행합니다.' },
        { id: '7', question: '"5" - 3의 결과는?', options: ['2', '"53"', 'NaN', '"-3"'], answer: 0, explanation: '- 연산자는 문자열을 숫자로 변환하여 계산합니다.' },
        { id: '8', question: 'Symbol의 특징은?', options: ['중복 가능', '항상 고유', '문자열로 변환', '숫자 타입'], answer: 1, explanation: 'Symbol()은 매번 고유한 값을 생성합니다.' },
        { id: '9', question: 'const arr = [1,2,3]; arr.push(4);의 결과는?', options: ['에러', '[1,2,3,4]', '[1,2,3]', 'undefined'], answer: 1, explanation: 'const는 참조를 고정하지만 배열 내용은 수정 가능합니다.' },
        { id: '10', question: 'BigInt를 만드는 방법은?', options: ['BigInt(10)', '10n', 'new BigInt(10)', '모두 가능'], answer: 3, explanation: 'BigInt(10)과 10n 모두 BigInt를 생성합니다.' },
      ],
    },
    {
      id: 'js-2',
      title: '함수와 스코프',
      quizzes: [
        { id: '1', question: '화살표 함수의 특징은?', options: ['자체 this 있음', '자체 this 없음', 'arguments 있음', 'new 가능'], answer: 1, explanation: '화살표 함수는 자체 this가 없고 외부 스코프의 this를 사용합니다.' },
        { id: '2', question: '클로저가 접근할 수 있는 것은?', options: ['전역 변수만', '지역 변수만', '외부 함수 변수', '없음'], answer: 2, explanation: '클로저는 외부 함수의 변수에 접근할 수 있습니다.' },
        { id: '3', question: 'IIFE의 형태는?', options: ['function(){}', '(function(){})()', '() => {}', 'func()'], answer: 1, explanation: 'IIFE는 (function(){})() 형태로 즉시 실행됩니다.' },
        { id: '4', question: 'rest 파라미터의 형태는?', options: ['...args', '*args', 'args[]', '&args'], answer: 0, explanation: 'rest 파라미터는 ...을 사용합니다.' },
        { id: '5', question: '함수 선언문의 호이스팅 범위는?', options: ['선언만', '전체', '초기화만', '호이스팅 안됨'], answer: 1, explanation: '함수 선언문은 전체가 호이스팅됩니다.' },
        { id: '6', question: '콜백 함수란?', options: ['재귀 함수', '전달되는 함수', '즉시 실행 함수', '생성자 함수'], answer: 1, explanation: '콜백은 다른 함수에 인자로 전달되는 함수입니다.' },
        { id: '7', question: '기본 파라미터가 적용되는 경우는?', options: ['null 전달', 'undefined 전달', '0 전달', '항상'], answer: 1, explanation: '기본값은 undefined일 때만 적용됩니다.' },
        { id: '8', question: 'this가 전역 객체를 가리키는 경우는?', options: ['메서드 호출', '생성자 호출', '일반 함수 호출', '화살표 함수'], answer: 2, explanation: '일반 함수로 호출하면 this는 전역 객체입니다.' },
        { id: '9', question: 'bind()의 역할은?', options: ['함수 실행', 'this 고정', '값 복사', '변수 선언'], answer: 1, explanation: 'bind()는 this를 특정 값으로 고정한 새 함수를 반환합니다.' },
        { id: '10', question: '순수 함수의 특징은?', options: ['부수 효과 있음', '부수 효과 없음', '전역 변수 수정', '비동기 실행'], answer: 1, explanation: '순수 함수는 부수 효과가 없고 같은 입력에 같은 출력을 반환합니다.' },
      ],
    },
  ],
  java: [
    {
      id: 'java-1',
      title: '클래스와 객체',
      quizzes: [
        { id: '1', question: '모든 Java 클래스가 상속받는 클래스는?', options: ['Class', 'Object', 'Base', 'Root'], answer: 1, explanation: '모든 클래스는 Object 클래스를 암시적으로 상속합니다.' },
        { id: '2', question: '같은 클래스에서만 접근 가능한 접근 제어자는?', options: ['public', 'protected', 'default', 'private'], answer: 3, explanation: 'private은 같은 클래스 내에서만 접근 가능합니다.' },
        { id: '3', question: '인스턴스 없이 호출 가능한 메서드는?', options: ['public', 'final', 'static', 'abstract'], answer: 2, explanation: 'static 메서드는 클래스 이름으로 직접 호출할 수 있습니다.' },
        { id: '4', question: '상속이 불가능한 클래스를 만드는 키워드는?', options: ['static', 'final', 'abstract', 'const'], answer: 1, explanation: 'final 클래스는 상속할 수 없습니다.' },
        { id: '5', question: '생성자의 특징이 아닌 것은?', options: ['클래스명과 동일', '반환 타입 없음', '오버로딩 가능', '상속 가능'], answer: 3, explanation: '생성자는 상속되지 않습니다. super()로 호출해야 합니다.' },
        { id: '6', question: '현재 객체를 참조하는 키워드는?', options: ['super', 'this', 'self', 'current'], answer: 1, explanation: 'this는 현재 인스턴스를 참조합니다.' },
        { id: '7', question: '부모 클래스를 참조하는 키워드는?', options: ['parent', 'base', 'super', 'extends'], answer: 2, explanation: 'super는 부모 클래스의 멤버에 접근합니다.' },
        { id: '8', question: '인스턴스화할 수 없는 클래스를 만드는 키워드는?', options: ['final', 'static', 'abstract', 'private'], answer: 2, explanation: 'abstract 클래스는 직접 인스턴스화할 수 없습니다.' },
        { id: '9', question: 'Java의 다중 상속 지원은?', options: ['클래스로 가능', '인터페이스로 가능', '둘 다 가능', '둘 다 불가'], answer: 1, explanation: 'Java는 인터페이스를 통해 다중 상속을 지원합니다.' },
        { id: '10', question: 'interface의 변수는 기본적으로?', options: ['private', 'public static', 'protected', 'public static final'], answer: 3, explanation: '인터페이스 변수는 public static final입니다.' },
      ],
    },
    {
      id: 'java-2',
      title: '메모리와 가비지 컬렉션',
      quizzes: [
        { id: '1', question: '객체가 저장되는 메모리 영역은?', options: ['Stack', 'Heap', 'Method Area', 'PC Register'], answer: 1, explanation: '객체는 Heap 메모리에 동적 할당됩니다.' },
        { id: '2', question: '지역 변수가 저장되는 영역은?', options: ['Heap', 'Stack', 'Static', 'Pool'], answer: 1, explanation: '지역 변수와 메서드 호출 정보는 Stack에 저장됩니다.' },
        { id: '3', question: 'GC 실행을 요청하는 메서드는?', options: ['Runtime.gc()', 'System.gc()', '둘 다 가능', 'GC.run()'], answer: 2, explanation: 'System.gc()와 Runtime.gc() 모두 가능합니다.' },
        { id: '4', question: 'GC 대상이 되는 객체는?', options: ['참조 있는 객체', '참조 없는 객체', 'static 객체', 'final 객체'], answer: 1, explanation: '더 이상 참조되지 않는 객체가 GC 대상입니다.' },
        { id: '5', question: 'String 리터럴이 저장되는 곳은?', options: ['Stack', 'Heap', 'String Pool', 'Method Area'], answer: 2, explanation: 'String 리터럴은 String Pool에 저장되어 재사용됩니다.' },
        { id: '6', question: 'Java에서 메모리를 수동 해제하는 방법은?', options: ['free()', 'delete', 'null 할당', '불가능'], answer: 3, explanation: 'Java는 GC가 자동으로 메모리를 관리합니다.' },
        { id: '7', question: 'Heap 공간 부족 시 발생하는 에러는?', options: ['StackOverflowError', 'OutOfMemoryError', 'HeapError', 'MemoryError'], answer: 1, explanation: 'Heap 메모리 부족 시 OutOfMemoryError가 발생합니다.' },
        { id: '8', question: 'WeakReference의 특징은?', options: ['GC 안됨', 'GC 대상 우선', '강한 참조', '순환 참조'], answer: 1, explanation: 'WeakReference는 강한 참조가 없으면 GC 대상입니다.' },
        { id: '9', question: 'static 변수가 저장되는 영역은?', options: ['Stack', 'Heap', 'Method Area', 'Native'], answer: 2, explanation: 'static 변수는 Method Area(Metaspace)에 저장됩니다.' },
        { id: '10', question: 'finalize() 메서드의 호출 시점은?', options: ['객체 생성 시', 'GC 전', 'GC 후', '프로그램 종료 시'], answer: 1, explanation: 'finalize()는 GC 직전에 호출되지만 사용이 권장되지 않습니다.' },
      ],
    },
  ],
  python: [
    {
      id: 'py-1',
      title: '변수와 객체',
      quizzes: [
        { id: '1', question: 'Python에서 변수가 저장하는 것은?', options: ['값', '객체 참조', '메모리 주소', '타입'], answer: 1, explanation: 'Python 변수는 객체에 대한 참조(이름표)를 저장합니다.' },
        { id: '2', question: '객체의 고유 식별자를 반환하는 함수는?', options: ['type()', 'id()', 'hash()', 'ref()'], answer: 1, explanation: 'id()는 객체의 고유 식별자를 반환합니다.' },
        { id: '3', question: '같은 객체인지 비교하는 연산자는?', options: ['==', '===', 'is', 'equals'], answer: 2, explanation: 'is는 동일한 객체인지(id 비교), ==는 값 비교입니다.' },
        { id: '4', question: 'mutable 객체가 아닌 것은?', options: ['list', 'dict', 'tuple', 'set'], answer: 2, explanation: 'tuple은 immutable로 변경할 수 없습니다.' },
        { id: '5', question: 'None의 타입은?', options: ['null', 'void', 'NoneType', 'undefined'], answer: 2, explanation: 'None은 NoneType 클래스의 유일한 인스턴스입니다.' },
        { id: '6', question: 'Python이 캐싱하는 정수 범위는?', options: ['0~100', '-5~256', '-128~127', '모든 정수'], answer: 1, explanation: '자주 사용되는 -5~256 범위의 정수는 미리 캐싱됩니다.' },
        { id: '7', question: '전역 변수를 함수 안에서 수정하려면?', options: ['local 사용', 'global 사용', 'nonlocal 사용', '바로 수정'], answer: 1, explanation: 'global 키워드로 전역 변수임을 명시해야 합니다.' },
        { id: '8', question: 'type() 함수가 반환하는 것은?', options: ['값', '객체', '타입 이름', '클래스'], answer: 3, explanation: 'type()은 객체의 클래스(타입)를 반환합니다.' },
        { id: '9', question: 'a = [1,2,3]; b = a; b.append(4); a의 값은?', options: ['[1,2,3]', '[1,2,3,4]', '[4]', 'error'], answer: 1, explanation: 'a와 b는 같은 리스트 객체를 참조하므로 둘 다 [1,2,3,4]입니다.' },
        { id: '10', question: '깊은 복사를 위한 모듈은?', options: ['copy', 'deep', 'clone', 'duplicate'], answer: 0, explanation: 'copy 모듈의 deepcopy() 함수로 깊은 복사를 수행합니다.' },
      ],
    },
    {
      id: 'py-2',
      title: '함수와 스코프',
      quizzes: [
        { id: '1', question: 'Python 함수가 일급 객체인 이유는?', options: ['빠른 실행', '변수 할당 가능', '타입 체크', '자동 최적화'], answer: 1, explanation: '함수를 변수에 할당하고, 인자로 전달하고, 반환할 수 있습니다.' },
        { id: '2', question: '익명 함수를 만드는 키워드는?', options: ['def', 'func', 'lambda', 'anon'], answer: 2, explanation: 'lambda는 한 줄로 익명 함수를 정의합니다.' },
        { id: '3', question: '*args의 타입은?', options: ['list', 'tuple', 'dict', 'set'], answer: 1, explanation: '*args는 위치 인자들을 tuple로 받습니다.' },
        { id: '4', question: '**kwargs의 타입은?', options: ['list', 'tuple', 'dict', 'set'], answer: 2, explanation: '**kwargs는 키워드 인자들을 dict로 받습니다.' },
        { id: '5', question: '바깥 함수의 변수를 참조하는 키워드는?', options: ['global', 'local', 'nonlocal', 'outer'], answer: 2, explanation: 'nonlocal은 바로 바깥 함수의 변수를 참조합니다.' },
        { id: '6', question: '기본 인자 값의 평가 시점은?', options: ['호출 시', '정의 시', '실행 중', '종료 시'], answer: 1, explanation: '기본 인자는 함수 정의 시점에 한 번만 평가됩니다.' },
        { id: '7', question: '데코레이터의 문법은?', options: ['#decorator', '@decorator', '$decorator', '!decorator'], answer: 1, explanation: '@를 사용하여 데코레이터를 적용합니다.' },
        { id: '8', question: 'generator를 만드는 키워드는?', options: ['return', 'yield', 'generate', 'iter'], answer: 1, explanation: 'yield를 사용하면 제너레이터 함수가 됩니다.' },
        { id: '9', question: '클로저가 기억하는 것은?', options: ['전역 변수', '외부 함수의 환경', '지역 변수만', '없음'], answer: 1, explanation: '클로저는 외부 함수의 변수 환경을 기억합니다.' },
        { id: '10', question: 'docstring을 작성하는 방법은?', options: ['# 주석', '/* */', '"""문자열"""', '// 주석'], answer: 2, explanation: '함수 첫 줄에 """로 감싼 문자열이 docstring입니다.' },
      ],
    },
  ],
};

type ViewState = 'chapters' | 'quiz' | 'result';

export function MultipleChoiceQuizPage() {
  const { lang } = useParams<{ lang: string }>();
  const langInfo = LANGUAGE_INFO[lang || 'c'] || LANGUAGE_INFO.c;
  const chapters = QUIZ_DATA[lang || 'c'] || QUIZ_DATA.c;

  const [viewState, setViewState] = useState<ViewState>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<'question' | 'correct' | 'incorrect'>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const { setPageTitle } = useStore(); // useStore 훅 사용

  useEffect(() => {
    setPageTitle(
      `${langInfo.name} 객관식 퀴즈`,
      '4개 중 정답을 골라보세요',
      lang as SupportedLanguage
    );
  }, [setPageTitle, langInfo.name, lang]);

  const currentQuiz = selectedChapter?.quizzes[currentIndex];
  const totalQuizzes = selectedChapter?.quizzes.length || 0;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setViewState('quiz');
    setCurrentIndex(0);
    setQuizState('question');
    setSelectedOption(null);
    setScore(0);
    setWrongCount(0);
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuiz || quizState !== 'question') return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuiz.answer;

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
      setSelectedOption(null);
    } else {
      setViewState('result');
    }
  };

  const handleTimeout = () => {
    if (!currentQuiz) return;
    setWrongCount(wrongCount + 1);
    setQuizState('incorrect');
    setSelectedOption(-1); // Indicate no option was selected
  }

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setSelectedOption(null);
    setScore(0);
    setWrongCount(0);
    setViewState('quiz');
  };

  const handleBackToChapters = () => {
    setViewState('chapters');
    setSelectedChapter(null);
  };

  const getOptionStyle = (index: number) => {
    if (quizState === 'question') {
      return 'border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] hover:border-green-400 hover:bg-green-50';
    }

    if (index === currentQuiz?.answer) {
      return 'border-green-400 bg-green-50';
    }

    if (index === selectedOption && quizState === 'incorrect') {
      return 'border-red-400 bg-red-50';
    }

    return 'border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] opacity-50';
  };

  // 챕터 목록 화면
  if (viewState === 'chapters') {
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen px-3 py-6">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Link
              to="/quiz"
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </Link>
            <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
              <ListChecks className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">객관식 퀴즈</h1>
              <p className="text-sm" style={{ color: langInfo.color }}>
                {langInfo.icon} {langInfo.name}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {chapters.map((chapter) => (
              <motion.button
                key={chapter.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChapterSelect(chapter)}
                className="w-full p-4 bg-[var(--theme-quiz-card-bg)] rounded-xl border border-[var(--theme-quiz-card-border)] hover:border-[var(--theme-quiz-card-border-hover)] hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${langInfo.color}20` }}>
                      <BookOpen className="w-5 h-5" style={{ color: langInfo.color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--theme-quiz-title)]">{chapter.title}</h3>
                      <p className="text-sm text-[var(--theme-quiz-text-muted)]">{chapter.quizzes.length}문제</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
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
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen p-4">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
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
              {percentage >= 80 ? '훌륭해요! 🎉' : percentage >= 60 ? '잘했어요! 👍' : '다시 도전해보세요! 💪'}
            </h2>
            <p className="text-[var(--theme-quiz-text-muted)] mb-2">{selectedChapter?.title}</p>
            <p className="text-[var(--theme-quiz-text-muted)] mb-6">
              {totalQuizzes}문제 중 <span className="text-green-600 font-bold">{score}문제 정답</span>, <span className="text-red-500 font-bold">{wrongCount}문제 오답</span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--theme-quiz-card-border)] text-[var(--theme-quiz-title)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                다시 풀기
              </button>
              <button
                onClick={handleBackToChapters}
                className="flex-1 py-3 rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
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
    <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen px-3 py-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBackToChapters}
            className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.title}</h1>
            <p className="text-sm" style={{ color: langInfo.color }}>
              {langInfo.icon} {langInfo.name} 객관식
            </p>
          </div>
        </div>

        {/* 진행률 + 점수 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-600">
                맞춤 <span className="font-bold">{score}</span>
              </span>
            </div>
            <div className="text-[var(--theme-quiz-text-muted)] font-mono text-sm">
              {currentIndex + 1} / {totalQuizzes}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-500">
                틀림 <span className="font-bold">{wrongCount}</span>
              </span>
            </div>
          </div>
          {/* 타이머 */}
                      <div className="mb-4 flex justify-center">
                      <Timer
                        key={currentIndex}
                        duration={10}
                        onTimeout={handleTimeout}
                        isPaused={quizState !== 'question'}
                      />
                    </div>          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* 퀴즈 카드 */}
        <AnimatePresence mode="wait">
          {currentQuiz && (
            <motion.div
              key={currentIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border-2 border-[var(--theme-quiz-card-border)] p-6 mb-4 shadow-lg">
                <p className="text-lg text-[var(--theme-quiz-title)] font-medium leading-relaxed">
                  {currentQuiz.question}
                </p>
              </div>

              <div className="space-y-3">
                {currentQuiz.options.map((option, index) => (
                  <motion.button
                    key={index}
                    whileHover={quizState === 'question' ? { scale: 1.01 } : {}}
                    whileTap={quizState === 'question' ? { scale: 0.98 } : {}}
                    onClick={() => handleAnswer(index)}
                    disabled={quizState !== 'question'}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${getOptionStyle(index)}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                        quizState !== 'question' && index === currentQuiz.answer
                          ? 'bg-green-500 text-white'
                          : quizState === 'incorrect' && index === selectedOption
                          ? 'bg-red-500 text-white'
                          : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-quiz-text)]'
                      }`}>
                        {quizState !== 'question' && index === currentQuiz.answer ? (
                          <Check className="w-4 h-4" />
                        ) : quizState === 'incorrect' && index === selectedOption ? (
                          <X className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="text-[var(--theme-quiz-title)] font-medium">{option}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {quizState !== 'question' && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`mt-4 p-4 rounded-xl ${
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
                    {currentQuiz.explanation}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

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
