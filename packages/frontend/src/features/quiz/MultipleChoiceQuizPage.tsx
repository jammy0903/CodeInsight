/**
 * MultipleChoiceQuizPage - 객관식 퀴즈 페이지
 *
 * DESIGN: Speak 앱 + Flashcard 패턴
 * - 중앙 카드 (질문)
 * - 4지선다 버튼
 * - 상단 진행률 바
 * - 정답/오답 피드백
 *
 * CSS: Tailwind 비율 기반 (고정 px 미사용)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ListChecks, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 임시 퀴즈 데이터
const MOCK_QUIZZES = [
  {
    id: '1',
    question: '다음 중 포인터 선언으로 올바른 것은?',
    options: ['int p;', 'int *p;', 'int &p;', 'pointer p;'],
    answer: 1,
    explanation: '포인터는 자료형 뒤에 *를 붙여 선언합니다. int *p;는 int형 포인터 변수 p를 선언합니다.',
  },
  {
    id: '2',
    question: '변수 x의 주소를 포인터 p에 저장하는 올바른 코드는?',
    options: ['p = x;', 'p = *x;', 'p = &x;', '*p = x;'],
    answer: 2,
    explanation: '&연산자는 변수의 주소를 반환합니다. p = &x;로 x의 주소를 p에 저장합니다.',
  },
  {
    id: '3',
    question: '포인터 p가 가리키는 값을 읽는 방법은?',
    options: ['p', '&p', '*p', '**p'],
    answer: 2,
    explanation: '*연산자(역참조)를 사용하면 포인터가 가리키는 메모리의 값을 읽을 수 있습니다.',
  },
  {
    id: '4',
    question: '동적 메모리 할당에 사용하는 함수는?',
    options: ['alloc()', 'new()', 'malloc()', 'create()'],
    answer: 2,
    explanation: 'malloc()은 C에서 동적 메모리를 할당하는 표준 함수입니다.',
  },
  {
    id: '5',
    question: '다음 중 메모리 해제 함수는?',
    options: ['delete()', 'free()', 'release()', 'dispose()'],
    answer: 1,
    explanation: 'free()는 malloc()으로 할당한 메모리를 해제하는 함수입니다.',
  },
];

type QuizState = 'question' | 'correct' | 'incorrect';

export function MultipleChoiceQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuiz = MOCK_QUIZZES[currentIndex];
  const progress = ((currentIndex + 1) / MOCK_QUIZZES.length) * 100;

  const handleAnswer = (optionIndex: number) => {
    if (quizState !== 'question') return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex === currentQuiz.answer;

    if (isCorrect) {
      setScore(score + 1);
      setQuizState('correct');
    } else {
      setQuizState('incorrect');
    }
  };

  const handleNext = () => {
    if (currentIndex < MOCK_QUIZZES.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setQuizState('question');
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);
  };

  const getOptionStyle = (index: number) => {
    if (quizState === 'question') {
      return 'border-[#e5d5c7] bg-white hover:border-green-400 hover:bg-green-50';
    }

    if (index === currentQuiz.answer) {
      return 'border-green-400 bg-green-50';
    }

    if (index === selectedOption && quizState === 'incorrect') {
      return 'border-red-400 bg-red-50';
    }

    return 'border-[#e5d5c7] bg-white opacity-50';
  };

  // 결과 화면
  if (isFinished) {
    const percentage = Math.round((score / MOCK_QUIZZES.length) * 100);
    return (
      <div className="bg-[#fffbf5] p-4 safe-area-inset">
        <div className="w-full max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-4 sm:mb-[5%]">
            <Link
              to="/quiz"
              className="p-2 sm:p-[2.5%] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg border border-[#e5d5c7] hover:bg-[#fff8f0] active:bg-[#f5ebe0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#937b5d]" />
            </Link>
            <h1 className="text-xl font-bold text-[#6b5a4a]">퀴즈 결과</h1>
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-[#e5d5c7] p-[8%] text-center shadow-lg"
          >
            <div className={`w-[25%] max-w-24 aspect-square mx-auto mb-[5%] rounded-full flex items-center justify-center ${
              percentage >= 80 ? 'bg-green-100' : percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <span className={`text-2xl sm:text-3xl font-bold ${
                percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {percentage}%
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-[#6b5a4a] mb-2">
              {percentage >= 80 ? '훌륭해요!' : percentage >= 60 ? '잘했어요!' : '다시 도전해보세요!'}
            </h2>
            <p className="text-[#937b5d] mb-[5%]">
              {MOCK_QUIZZES.length}문제 중 {score}문제 정답
            </p>

            <div className="flex gap-[3%]">
              <button
                onClick={handleRestart}
                className="flex-1 flex items-center justify-center gap-2 py-[4%] rounded-xl border border-[#e5d5c7] text-[#6b5a4a] hover:bg-[#fff8f0] transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                다시 풀기
              </button>
              <Link
                to="/quiz"
                className="flex-1 py-[4%] rounded-xl bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors flex items-center justify-center"
              >
                목록으로
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fffbf5] px-3 py-6 safe-area-inset">
      <div className="w-full max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            to="/quiz"
            className="p-[2%] rounded-lg border border-[#e5d5c7] hover:bg-[#fff8f0] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#937b5d]" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
            <ListChecks className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#6b5a4a]">객관식</h1>
        </div>

        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[#937b5d] mb-2">
            <span>{currentIndex + 1} / {MOCK_QUIZZES.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[#e5d5c7] rounded-full overflow-hidden">
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
          <motion.div
            key={currentIndex}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* 질문 카드 */}
            <div className="bg-white rounded-2xl border-2 border-[#e5d5c7] p-[5%] mb-[4%] shadow-lg">
              <p className="text-base sm:text-lg text-[#6b5a4a] font-medium leading-relaxed">
                {currentQuiz.question}
              </p>
            </div>

            {/* 선택지 */}
            <div className="space-y-3 sm:space-y-[3%]">
              {currentQuiz.options.map((option, index) => (
                <motion.button
                  key={index}
                  whileHover={quizState === 'question' ? { scale: 1.01 } : {}}
                  whileTap={quizState === 'question' ? { scale: 0.98 } : {}}
                  onClick={() => handleAnswer(index)}
                  disabled={quizState !== 'question'}
                  className={`w-full p-3 sm:p-[4%] min-h-[48px] rounded-xl border-2 text-left transition-all touch-manipulation ${getOptionStyle(index)}`}
                >
                  <div className="flex items-center gap-[3%]">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                      quizState !== 'question' && index === currentQuiz.answer
                        ? 'bg-green-500 text-white'
                        : quizState === 'incorrect' && index === selectedOption
                        ? 'bg-red-500 text-white'
                        : 'bg-[#f5f0eb] text-[#6b5a4a]'
                    }`}>
                      {quizState !== 'question' && index === currentQuiz.answer ? (
                        <Check className="w-4 h-4" />
                      ) : quizState === 'incorrect' && index === selectedOption ? (
                        <X className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span className="text-[#6b5a4a] font-medium text-sm sm:text-base">{option}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* 해설 */}
            {quizState !== 'question' && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`mt-[4%] p-[4%] rounded-xl ${
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
                <p className="text-sm text-[#6b5a4a]">
                  {currentQuiz.explanation}
                </p>
              </motion.div>
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
            className="w-full mt-8 py-4 min-h-[48px] rounded-2xl bg-[#a08060] text-white font-semibold shadow-lg hover:bg-[#8b6d4f] active:bg-[#7a5f45] transition-colors touch-manipulation"
          >
            {currentIndex < MOCK_QUIZZES.length - 1 ? '다음 문제' : '결과 보기'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
