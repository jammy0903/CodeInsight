/**
 * OXQuizPage - OX 퀴즈 페이지
 *
 * DESIGN: 언어 → 챕터 선택 → 10문제 퀴즈
 * URL: /quiz/ox/:lang
 */

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDot, Check, X, RotateCcw, BookOpen, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 언어별 정보
const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  c: { name: 'C', icon: 'C', color: '#0077B6' },
  javascript: { name: 'JavaScript', icon: '⚡', color: '#F59E0B' },
  java: { name: 'Java', icon: '☕', color: '#EC4899' },
  python: { name: 'Python', icon: '🐍', color: '#3776AB' },
};

// 챕터별 퀴즈 데이터 타입
interface OXQuiz {
  id: string;
  question: string;
  answer: boolean;
  explanation: string;
}

interface Chapter {
  id: string;
  title: string;
  quizzes: OXQuiz[];
}

// 언어별 챕터 퀴즈 데이터
const QUIZ_DATA: Record<string, Chapter[]> = {
  c: [
    {
      id: 'c-1',
      title: '변수와 자료형',
      quizzes: [
        { id: '1', question: 'int 자료형은 정수를 저장한다.', answer: true, explanation: 'int는 integer의 약자로 정수를 저장하는 자료형입니다.' },
        { id: '2', question: 'char 자료형은 문자열을 저장한다.', answer: false, explanation: 'char는 단일 문자만 저장합니다. 문자열은 char 배열을 사용합니다.' },
        { id: '3', question: 'float는 double보다 더 정밀하다.', answer: false, explanation: 'double이 float보다 더 높은 정밀도를 가집니다.' },
        { id: '4', question: '변수 선언 시 초기값을 반드시 설정해야 한다.', answer: false, explanation: '초기값 없이 선언할 수 있지만, 쓰레기 값이 들어갈 수 있습니다.' },
        { id: '5', question: 'const 키워드로 선언한 변수는 값을 변경할 수 없다.', answer: true, explanation: 'const는 상수를 선언하며 값 변경이 불가능합니다.' },
        { id: '6', question: 'C에서 변수명은 숫자로 시작할 수 있다.', answer: false, explanation: '변수명은 문자나 밑줄(_)로 시작해야 합니다.' },
        { id: '7', question: 'sizeof 연산자는 변수의 크기를 바이트 단위로 반환한다.', answer: true, explanation: 'sizeof는 메모리 크기를 바이트로 반환합니다.' },
        { id: '8', question: 'unsigned int는 음수를 저장할 수 있다.', answer: false, explanation: 'unsigned는 부호가 없어 양수만 저장 가능합니다.' },
        { id: '9', question: '전역 변수는 프로그램 전체에서 접근 가능하다.', answer: true, explanation: '전역 변수는 모든 함수에서 사용할 수 있습니다.' },
        { id: '10', question: '지역 변수는 함수가 종료되면 메모리에서 해제된다.', answer: true, explanation: '지역 변수는 스택에 저장되어 함수 종료 시 자동 해제됩니다.' },
      ],
    },
    {
      id: 'c-2',
      title: '포인터 기초',
      quizzes: [
        { id: '1', question: '포인터는 메모리 주소를 저장하는 변수이다.', answer: true, explanation: '포인터는 다른 변수의 메모리 주소를 저장합니다.' },
        { id: '2', question: 'int *p; 에서 *p는 포인터 변수의 이름이다.', answer: false, explanation: 'p가 포인터 변수의 이름이고, *는 포인터임을 나타냅니다.' },
        { id: '3', question: '&연산자는 변수의 주소를 반환한다.', answer: true, explanation: '&는 주소 연산자로 변수의 메모리 주소를 반환합니다.' },
        { id: '4', question: '*연산자는 포인터가 가리키는 값에 접근한다.', answer: true, explanation: '*는 역참조 연산자로 포인터가 가리키는 값을 읽습니다.' },
        { id: '5', question: 'NULL 포인터는 아무것도 가리키지 않는 포인터이다.', answer: true, explanation: 'NULL은 유효하지 않은 주소를 나타냅니다.' },
        { id: '6', question: '포인터의 크기는 가리키는 자료형에 따라 다르다.', answer: false, explanation: '포인터 크기는 시스템 아키텍처에 따라 동일합니다 (32비트: 4바이트, 64비트: 8바이트).' },
        { id: '7', question: '포인터 연산에서 p+1은 항상 주소가 1 증가한다.', answer: false, explanation: 'p+1은 가리키는 자료형의 크기만큼 주소가 증가합니다.' },
        { id: '8', question: 'void 포인터는 모든 타입의 주소를 저장할 수 있다.', answer: true, explanation: 'void*는 범용 포인터로 어떤 타입의 주소도 저장 가능합니다.' },
        { id: '9', question: '배열의 이름은 배열의 첫 번째 요소의 주소이다.', answer: true, explanation: '배열 이름은 배열의 시작 주소를 나타냅니다.' },
        { id: '10', question: '포인터를 초기화하지 않으면 NULL을 가리킨다.', answer: false, explanation: '초기화하지 않은 포인터는 쓰레기 값(dangling pointer)을 가집니다.' },
      ],
    },
    {
      id: 'c-3',
      title: '동적 메모리',
      quizzes: [
        { id: '1', question: 'malloc()으로 할당한 메모리는 자동으로 해제된다.', answer: false, explanation: 'malloc()으로 할당한 메모리는 free()로 직접 해제해야 합니다.' },
        { id: '2', question: 'free()는 동적 메모리를 해제하는 함수이다.', answer: true, explanation: 'free()는 malloc/calloc/realloc으로 할당한 메모리를 해제합니다.' },
        { id: '3', question: 'calloc()은 메모리를 0으로 초기화한다.', answer: true, explanation: 'calloc()은 할당된 메모리를 0으로 초기화합니다.' },
        { id: '4', question: 'realloc()은 기존 메모리 크기를 변경할 수 있다.', answer: true, explanation: 'realloc()은 이미 할당된 메모리의 크기를 재조정합니다.' },
        { id: '5', question: '메모리 누수는 할당된 메모리를 해제하지 않을 때 발생한다.', answer: true, explanation: '메모리 누수는 더 이상 사용하지 않는 메모리를 해제하지 않을 때 발생합니다.' },
        { id: '6', question: 'malloc(10)은 10개의 정수를 저장할 공간을 할당한다.', answer: false, explanation: 'malloc(10)은 10바이트를 할당합니다. 정수 10개는 malloc(10 * sizeof(int))가 필요합니다.' },
        { id: '7', question: 'free() 후에도 포인터는 같은 주소를 가리킨다.', answer: true, explanation: 'free() 후 포인터 값은 변하지 않지만, 그 메모리는 유효하지 않습니다 (dangling pointer).' },
        { id: '8', question: 'Heap 메모리는 Stack보다 느리지만 크기 제한이 적다.', answer: true, explanation: 'Heap은 런타임에 동적 할당되어 느리지만, Stack보다 큰 메모리를 사용할 수 있습니다.' },
        { id: '9', question: 'double free는 같은 메모리를 두 번 해제하는 오류이다.', answer: true, explanation: 'double free는 이미 해제된 메모리를 다시 해제하려 할 때 발생하는 심각한 오류입니다.' },
        { id: '10', question: 'malloc()이 실패하면 프로그램이 자동으로 종료된다.', answer: false, explanation: 'malloc() 실패 시 NULL을 반환하므로 반환값을 체크해야 합니다.' },
      ],
    },
  ],
  javascript: [
    {
      id: 'js-1',
      title: '변수와 타입',
      quizzes: [
        { id: '1', question: 'let으로 선언한 변수는 재선언이 가능하다.', answer: false, explanation: 'let은 재선언 불가능하지만 재할당은 가능합니다.' },
        { id: '2', question: 'const로 선언한 객체의 속성은 변경할 수 있다.', answer: true, explanation: 'const는 참조를 고정하지만, 객체 내부 속성은 변경 가능합니다.' },
        { id: '3', question: 'typeof null은 "null"을 반환한다.', answer: false, explanation: 'typeof null은 "object"를 반환합니다. 이것은 JavaScript의 유명한 버그입니다.' },
        { id: '4', question: 'undefined와 null은 같은 값이다.', answer: false, explanation: 'undefined는 값이 할당되지 않음, null은 의도적으로 비어있음을 나타냅니다.' },
        { id: '5', question: 'var는 함수 스코프를 가진다.', answer: true, explanation: 'var는 함수 스코프, let/const는 블록 스코프를 가집니다.' },
        { id: '6', question: 'NaN === NaN은 true이다.', answer: false, explanation: 'NaN은 자기 자신과도 같지 않습니다. isNaN()을 사용해야 합니다.' },
        { id: '7', question: '호이스팅은 변수 선언을 스코프 최상단으로 끌어올린다.', answer: true, explanation: '호이스팅으로 var 선언은 최상단으로 이동하지만, 초기화는 이동하지 않습니다.' },
        { id: '8', question: 'Symbol은 고유한 값을 생성한다.', answer: true, explanation: 'Symbol()은 매번 고유한 값을 생성합니다.' },
        { id: '9', question: '"5" + 3은 8이다.', answer: false, explanation: '문자열과 숫자의 +는 문자열 연결을 수행하여 "53"이 됩니다.' },
        { id: '10', question: 'BigInt는 아주 큰 정수를 다룰 수 있다.', answer: true, explanation: 'BigInt는 Number의 안전한 정수 범위를 넘는 큰 정수를 다룹니다.' },
      ],
    },
    {
      id: 'js-2',
      title: '함수와 스코프',
      quizzes: [
        { id: '1', question: '화살표 함수는 자체 this를 가진다.', answer: false, explanation: '화살표 함수는 자체 this가 없고 외부 스코프의 this를 사용합니다.' },
        { id: '2', question: '클로저는 외부 함수의 변수에 접근할 수 있다.', answer: true, explanation: '클로저는 외부 함수가 종료된 후에도 그 변수에 접근할 수 있습니다.' },
        { id: '3', question: 'IIFE는 즉시 실행되는 함수 표현식이다.', answer: true, explanation: 'IIFE (Immediately Invoked Function Expression)는 정의와 동시에 실행됩니다.' },
        { id: '4', question: 'arguments 객체는 화살표 함수에서도 사용할 수 있다.', answer: false, explanation: '화살표 함수는 arguments 객체가 없습니다. rest 파라미터를 사용하세요.' },
        { id: '5', question: '함수 선언문은 호이스팅된다.', answer: true, explanation: '함수 선언문은 전체가 호이스팅되어 선언 전에 호출할 수 있습니다.' },
        { id: '6', question: 'rest 파라미터는 배열로 전달된다.', answer: true, explanation: 'rest 파라미터 (...args)는 인자들을 배열로 모읍니다.' },
        { id: '7', question: '콜백 함수는 다른 함수의 인자로 전달되는 함수이다.', answer: true, explanation: '콜백은 다른 함수에 전달되어 나중에 호출되는 함수입니다.' },
        { id: '8', question: '기본 파라미터는 undefined일 때만 적용된다.', answer: true, explanation: '기본값은 인자가 undefined일 때 사용됩니다. null은 적용되지 않습니다.' },
        { id: '9', question: 'new 키워드 없이 생성자 함수를 호출하면 에러가 발생한다.', answer: false, explanation: '에러는 발생하지 않지만, this가 전역 객체를 가리켜 예상치 못한 동작을 합니다.' },
        { id: '10', question: '재귀 함수는 자기 자신을 호출하는 함수이다.', answer: true, explanation: '재귀는 함수가 자기 자신을 호출하여 문제를 해결하는 기법입니다.' },
      ],
    },
  ],
  java: [
    {
      id: 'java-1',
      title: '클래스와 객체',
      quizzes: [
        { id: '1', question: 'Java에서 모든 클래스는 Object 클래스를 상속받는다.', answer: true, explanation: '모든 Java 클래스는 암시적으로 Object 클래스를 상속합니다.' },
        { id: '2', question: 'private 멤버는 같은 패키지의 다른 클래스에서 접근할 수 있다.', answer: false, explanation: 'private은 같은 클래스 내에서만 접근 가능합니다.' },
        { id: '3', question: 'static 메서드는 인스턴스 없이 호출할 수 있다.', answer: true, explanation: 'static 메서드는 클래스 이름으로 직접 호출할 수 있습니다.' },
        { id: '4', question: 'final 클래스는 상속할 수 없다.', answer: true, explanation: 'final 키워드가 붙은 클래스는 상속이 불가능합니다.' },
        { id: '5', question: '생성자는 반환 타입을 가진다.', answer: false, explanation: '생성자는 반환 타입이 없습니다. 클래스 이름과 같아야 합니다.' },
        { id: '6', question: 'this 키워드는 현재 객체를 참조한다.', answer: true, explanation: 'this는 메서드가 호출된 현재 인스턴스를 가리킵니다.' },
        { id: '7', question: 'super()는 부모 클래스의 생성자를 호출한다.', answer: true, explanation: 'super()는 부모 클래스의 생성자를 명시적으로 호출합니다.' },
        { id: '8', question: 'abstract 클래스는 인스턴스를 생성할 수 있다.', answer: false, explanation: '추상 클래스는 직접 인스턴스화할 수 없고 상속을 통해서만 사용됩니다.' },
        { id: '9', question: 'Java는 다중 상속을 지원한다.', answer: false, explanation: 'Java는 클래스의 다중 상속을 지원하지 않습니다. 인터페이스로 우회합니다.' },
        { id: '10', question: 'interface의 모든 메서드는 기본적으로 public abstract이다.', answer: true, explanation: '인터페이스 메서드는 명시하지 않아도 public abstract입니다.' },
      ],
    },
    {
      id: 'java-2',
      title: '메모리와 가비지 컬렉션',
      quizzes: [
        { id: '1', question: 'JVM의 Heap 영역에 객체가 저장된다.', answer: true, explanation: '객체와 배열은 Heap 메모리에 동적으로 할당됩니다.' },
        { id: '2', question: '지역 변수는 Stack 메모리에 저장된다.', answer: true, explanation: '지역 변수와 메서드 호출 정보는 Stack에 저장됩니다.' },
        { id: '3', question: 'System.gc()를 호출하면 즉시 가비지 컬렉션이 실행된다.', answer: false, explanation: 'System.gc()는 GC를 요청하지만, 즉시 실행을 보장하지 않습니다.' },
        { id: '4', question: '참조가 없는 객체는 가비지 컬렉션 대상이 된다.', answer: true, explanation: 'GC는 더 이상 참조되지 않는 객체의 메모리를 회수합니다.' },
        { id: '5', question: 'String 리터럴은 String Pool에 저장된다.', answer: true, explanation: 'String 리터럴은 재사용을 위해 String Pool에 저장됩니다.' },
        { id: '6', question: 'Java에서 메모리를 수동으로 해제할 수 있다.', answer: false, explanation: 'Java는 가비지 컬렉터가 자동으로 메모리를 관리합니다.' },
        { id: '7', question: 'OutOfMemoryError는 Heap 메모리가 부족할 때 발생한다.', answer: true, explanation: '더 이상 객체를 할당할 Heap 공간이 없으면 OOM이 발생합니다.' },
        { id: '8', question: 'finalize() 메서드는 객체가 GC되기 전에 호출된다.', answer: true, explanation: 'finalize()는 GC 전에 호출되지만, 사용이 권장되지 않습니다.' },
        { id: '9', question: 'WeakReference는 GC가 언제든 회수할 수 있는 참조이다.', answer: true, explanation: 'WeakReference는 다른 강한 참조가 없으면 GC 대상이 됩니다.' },
        { id: '10', question: 'static 변수는 프로그램 종료까지 메모리에 유지된다.', answer: true, explanation: 'static 변수는 Method Area에 저장되어 프로그램 종료까지 유지됩니다.' },
      ],
    },
  ],
  python: [
    {
      id: 'py-1',
      title: '변수와 객체',
      quizzes: [
        { id: '1', question: 'Python에서 모든 것은 객체이다.', answer: true, explanation: '정수, 문자열, 함수 등 Python의 모든 것은 객체입니다.' },
        { id: '2', question: 'Python 변수는 값을 직접 저장한다.', answer: false, explanation: 'Python 변수는 객체에 대한 참조(이름표)를 저장합니다.' },
        { id: '3', question: 'id() 함수는 객체의 메모리 주소를 반환한다.', answer: true, explanation: 'id()는 객체의 고유 식별자(CPython에서는 메모리 주소)를 반환합니다.' },
        { id: '4', question: 'is 연산자는 값이 같은지 비교한다.', answer: false, explanation: 'is는 동일한 객체인지(id 비교), ==는 값이 같은지 비교합니다.' },
        { id: '5', question: 'Python의 리스트는 mutable이다.', answer: true, explanation: '리스트는 생성 후 요소를 변경할 수 있는 mutable 객체입니다.' },
        { id: '6', question: 'tuple은 생성 후 수정할 수 없다.', answer: true, explanation: 'tuple은 immutable로 한 번 생성되면 변경할 수 없습니다.' },
        { id: '7', question: 'Python에서 변수 타입을 미리 선언해야 한다.', answer: false, explanation: 'Python은 동적 타입 언어로 타입 선언이 필요 없습니다.' },
        { id: '8', question: 'None은 값이 없음을 나타내는 특별한 객체이다.', answer: true, explanation: 'None은 NoneType의 유일한 인스턴스로 "없음"을 나타냅니다.' },
        { id: '9', question: '작은 정수(-5~256)는 Python이 미리 캐싱한다.', answer: true, explanation: '자주 사용되는 작은 정수는 성능을 위해 미리 생성되어 재사용됩니다.' },
        { id: '10', question: 'global 키워드 없이 함수 안에서 전역 변수를 수정할 수 있다.', answer: false, explanation: '전역 변수를 함수 안에서 수정하려면 global 선언이 필요합니다.' },
      ],
    },
    {
      id: 'py-2',
      title: '함수와 스코프',
      quizzes: [
        { id: '1', question: 'Python 함수는 일급 객체이다.', answer: true, explanation: '함수를 변수에 할당하고, 인자로 전달하고, 반환할 수 있습니다.' },
        { id: '2', question: 'def로 정의한 함수는 호이스팅된다.', answer: false, explanation: 'Python에는 호이스팅이 없습니다. 정의 전에 호출하면 에러가 발생합니다.' },
        { id: '3', question: 'lambda는 익명 함수를 생성한다.', answer: true, explanation: 'lambda는 이름 없는 작은 함수를 한 줄로 정의합니다.' },
        { id: '4', question: '*args는 키워드 인자를 딕셔너리로 받는다.', answer: false, explanation: '*args는 위치 인자를 튜플로, **kwargs가 키워드 인자를 딕셔너리로 받습니다.' },
        { id: '5', question: 'Python은 기본적으로 call by object reference 방식이다.', answer: true, explanation: 'Python은 객체의 참조를 전달하여 mutable/immutable에 따라 동작이 다릅니다.' },
        { id: '6', question: '기본 인자 값으로 빈 리스트를 사용하면 문제가 될 수 있다.', answer: true, explanation: '기본 인자는 함수 정의 시 한 번만 평가되어 공유되므로 주의가 필요합니다.' },
        { id: '7', question: 'nonlocal 키워드는 전역 변수를 참조한다.', answer: false, explanation: 'nonlocal은 바로 바깥 함수의 변수를, global은 전역 변수를 참조합니다.' },
        { id: '8', question: '데코레이터는 함수를 감싸는 함수이다.', answer: true, explanation: '데코레이터는 기존 함수를 수정하지 않고 기능을 추가하는 패턴입니다.' },
        { id: '9', question: '제너레이터는 yield를 사용하여 값을 반환한다.', answer: true, explanation: '제너레이터는 yield로 값을 하나씩 생성하여 메모리를 효율적으로 사용합니다.' },
        { id: '10', question: 'closure는 외부 함수의 변수를 기억한다.', answer: true, explanation: '클로저는 외부 함수가 종료된 후에도 그 변수에 접근할 수 있습니다.' },
      ],
    },
  ],
};

type ViewState = 'chapters' | 'quiz' | 'result';

export function OXQuizPage() {
  const { lang } = useParams<{ lang: string }>();
  const langInfo = LANGUAGE_INFO[lang || 'c'] || LANGUAGE_INFO.c;
  const chapters = QUIZ_DATA[lang || 'c'] || QUIZ_DATA.c;

  const [viewState, setViewState] = useState<ViewState>('chapters');
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<'question' | 'correct' | 'incorrect'>('question');
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);

  const currentQuiz = selectedChapter?.quizzes[currentIndex];
  const totalQuizzes = selectedChapter?.quizzes.length || 0;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const handleChapterSelect = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setViewState('quiz');
    setCurrentIndex(0);
    setQuizState('question');
    setScore(0);
    setWrongCount(0);
  };

  const handleAnswer = (userAnswer: boolean) => {
    if (!currentQuiz) return;
    const isCorrect = userAnswer === currentQuiz.answer;

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
    } else {
      setViewState('result');
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setScore(0);
    setWrongCount(0);
    setViewState('quiz');
  };

  const handleBackToChapters = () => {
    setViewState('chapters');
    setSelectedChapter(null);
  };

  // 챕터 목록 화면
  if (viewState === 'chapters') {
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen px-3 py-6">
        <div className="w-full max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center gap-3 mb-8">
            <Link
              to="/quiz"
              className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
            </Link>
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <CircleDot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">OX 퀴즈</h1>
              <p className="text-sm text-[var(--theme-quiz-text-muted)]" style={{ color: langInfo.color }}>
                {langInfo.icon} {langInfo.name}
              </p>
            </div>
          </div>

          {/* 챕터 목록 */}
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
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors"
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
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={handleBackToChapters}
            className="p-2 rounded-lg border border-[var(--theme-quiz-card-border)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
          </button>
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <CircleDot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.title}</h1>
            <p className="text-sm" style={{ color: langInfo.color }}>
              {langInfo.icon} {langInfo.name} OX 퀴즈
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
          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
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
              className={`bg-[var(--theme-quiz-card-bg)] rounded-2xl border-2 p-6 min-h-[200px] flex flex-col shadow-lg ${
                quizState === 'correct'
                  ? 'border-green-400 bg-green-50'
                  : quizState === 'incorrect'
                  ? 'border-red-400 bg-red-50'
                  : 'border-[var(--theme-quiz-card-border)]'
              }`}
            >
              <div className="flex-1 flex items-center justify-center">
                <p className="text-lg text-center text-[var(--theme-quiz-title)] font-medium leading-relaxed">
                  {currentQuiz.question}
                </p>
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

        {/* O/X 버튼 또는 다음 버튼 */}
        <div className="mt-8">
          {quizState === 'question' ? (
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(true)}
                className="flex-1 py-4 rounded-2xl bg-blue-500 text-white text-2xl font-bold shadow-lg hover:bg-blue-600 transition-colors"
              >
                O
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(false)}
                className="flex-1 py-4 rounded-2xl bg-red-500 text-white text-2xl font-bold shadow-lg hover:bg-red-600 transition-colors"
              >
                X
              </motion.button>
            </div>
          ) : (
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-[var(--theme-dashboard-accent)] text-white font-semibold shadow-lg hover:bg-[var(--theme-dashboard-accent-hover)] transition-colors"
            >
              {currentIndex < totalQuizzes - 1 ? '다음 문제' : '결과 보기'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
