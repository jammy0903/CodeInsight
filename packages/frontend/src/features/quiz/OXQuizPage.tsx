/**
 * OXQuizPage - OX 퀴즈 페이지
 *
 * DESIGN: Speak 앱 + Flashcard 패턴
 * - 중앙 카드 (질문)
 * - 하단 O/X 버튼
 * - 상단 진행률 바
 * - 정답/오답 피드백
 *
 * CSS: Tailwind 비율 기반 (고정 px 미사용)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CircleDot, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 임시 퀴즈 데이터
const MOCK_QUIZZES = [
  {
    id: '1',
    question: '포인터는 메모리 주소를 저장하는 변수이다.',
    answer: true,
    explanation: '포인터는 다른 변수의 메모리 주소를 저장하는 변수입니다.',
  },
  {
    id: '2',
    question: 'int *p; 에서 *p는 포인터 변수의 이름이다.',
    answer: false,
    explanation: 'p가 포인터 변수의 이름이고, *는 포인터임을 나타내는 기호입니다.',
  },
  {
    id: '3',
    question: '배열의 이름은 배열의 첫 번째 요소의 주소를 나타낸다.',
    answer: true,
    explanation: '배열 이름은 배열의 시작 주소(첫 번째 요소의 주소)를 가리킵니다.',
  },
  {
    id: '4',
    question: 'malloc()으로 할당한 메모리는 자동으로 해제된다.',
    answer: false,
    explanation: 'malloc()으로 할당한 메모리는 free()로 직접 해제해야 합니다.',
  },
  {
    id: '5',
    question: 'NULL 포인터는 아무것도 가리키지 않는 포인터이다.',
    answer: true,
    explanation: 'NULL은 유효하지 않은 주소를 나타내며, 포인터 초기화에 사용됩니다.',
  },
];

type QuizState = 'question' | 'correct' | 'incorrect';

export function OXQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuiz = MOCK_QUIZZES[currentIndex];
  const progress = ((currentIndex + 1) / MOCK_QUIZZES.length) * 100;

  const handleAnswer = (userAnswer: boolean) => {
    const isCorrect = userAnswer === currentQuiz.answer;

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
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setScore(0);
    setIsFinished(false);
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
                className="flex-1 py-[4%] rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center"
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
        <div className="flex items-center gap-3 mb-12">
          <Link
            to="/quiz"
            className="p-[2%] rounded-lg border border-[#e5d5c7] hover:bg-[#fff8f0] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#937b5d]" />
          </Link>
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <CircleDot className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#6b5a4a]">OX 퀴즈</h1>
        </div>

        {/* 진행률 */}
        <div className="mb-12">
          <div className="flex justify-between text-sm text-[#937b5d] mb-2">
            <span>{currentIndex + 1} / {MOCK_QUIZZES.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[#e5d5c7] rounded-full overflow-hidden">
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
            <motion.div
              key={currentIndex}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`bg-white rounded-2xl border-2 p-6 min-h-[200px] sm:min-h-[250px] flex flex-col shadow-lg ${
                quizState === 'correct'
                  ? 'border-green-400 bg-green-50'
                  : quizState === 'incorrect'
                  ? 'border-red-400 bg-red-50'
                  : 'border-[#e5d5c7]'
              }`}
            >
            {/* 질문 */}
            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg sm:text-xl text-center text-[#6b5a4a] font-medium leading-relaxed">
                {currentQuiz.question}
              </p>
            </div>

            {/* 정답/오답 피드백 */}
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

        {/* O/X 버튼 또는 다음 버튼 */}
        <div className="mt-12">
          {quizState === 'question' ? (
            <div className="flex gap-3 sm:gap-[4%]">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(true)}
                className="flex-1 py-4 sm:py-[5%] min-h-[56px] rounded-2xl bg-blue-500 text-white text-2xl sm:text-3xl font-bold shadow-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
              >
                O
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAnswer(false)}
                className="flex-1 py-4 sm:py-[5%] min-h-[56px] rounded-2xl bg-red-500 text-white text-2xl sm:text-3xl font-bold shadow-lg hover:bg-red-600 active:bg-red-700 transition-colors touch-manipulation"
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
              className="w-full py-4 sm:py-[4%] min-h-[48px] rounded-2xl bg-[#a08060] text-white font-semibold shadow-lg hover:bg-[#8b6d4f] active:bg-[#7a5f45] transition-colors touch-manipulation"
            >
              {currentIndex < MOCK_QUIZZES.length - 1 ? '다음 문제' : '결과 보기'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
