/**
 * FillBlankQuizPage - 빈칸 코드 입력 퀴즈 페이지
 *
 * DESIGN: Speak 앱 + Flashcard 패턴
 * - 코드 카드 (빈칸 포함)
 * - 입력 필드
 * - 상단 진행률 바
 * - 정답/오답 피드백
 *
 * CSS: Tailwind 비율 기반 (고정 px 미사용)
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Check, X, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 임시 퀴즈 데이터
const MOCK_QUIZZES = [
  {
    id: '1',
    question: '포인터 p가 변수 x를 가리키도록 빈칸을 채우세요.',
    code: 'int x = 10;\nint *p = ____;',
    answer: '&x',
    acceptedAnswers: ['&x', '& x', '&(x)'],
    explanation: '&x는 변수 x의 주소를 의미합니다. 포인터에 주소를 저장할 때는 & 연산자를 사용합니다.',
  },
  {
    id: '2',
    question: '포인터 p가 가리키는 값을 출력하도록 빈칸을 채우세요.',
    code: 'int x = 42;\nint *p = &x;\nprintf("%d", ____);',
    answer: '*p',
    acceptedAnswers: ['*p', '* p', '(*p)'],
    explanation: '*p는 포인터 p가 가리키는 메모리의 값을 읽습니다. 이를 역참조(dereference)라고 합니다.',
  },
  {
    id: '3',
    question: '4바이트 정수를 위한 동적 메모리를 할당하세요.',
    code: 'int *p = (int *)____(sizeof(int));',
    answer: 'malloc',
    acceptedAnswers: ['malloc'],
    explanation: 'malloc()은 지정된 크기만큼 힙 메모리를 할당하고 그 주소를 반환합니다.',
  },
  {
    id: '4',
    question: '동적 할당된 메모리를 해제하세요.',
    code: 'int *p = (int *)malloc(sizeof(int));\n// 사용 후\n____(p);',
    answer: 'free',
    acceptedAnswers: ['free'],
    explanation: 'free()는 malloc()으로 할당한 메모리를 해제합니다. 메모리 누수를 방지하려면 반드시 해제해야 합니다.',
  },
  {
    id: '5',
    question: '배열의 세 번째 요소에 접근하는 포인터 연산을 완성하세요.',
    code: 'int arr[5] = {1, 2, 3, 4, 5};\nint *p = arr;\nint third = *(p + ____);',
    answer: '2',
    acceptedAnswers: ['2'],
    explanation: '배열의 인덱스는 0부터 시작하므로, 세 번째 요소는 인덱스 2입니다. *(p + 2)는 arr[2]와 같습니다.',
  },
];

type QuizState = 'question' | 'correct' | 'incorrect';

export function FillBlankQuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<QuizState>('question');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuiz = MOCK_QUIZZES[currentIndex];
  const progress = ((currentIndex + 1) / MOCK_QUIZZES.length) * 100;

  const handleSubmit = () => {
    if (!userInput.trim()) return;

    const normalizedInput = userInput.trim();
    const isCorrect = currentQuiz.acceptedAnswers.some(
      (accepted) => accepted.toLowerCase() === normalizedInput.toLowerCase()
    );

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
      setUserInput('');
    } else {
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setQuizState('question');
    setUserInput('');
    setScore(0);
    setIsFinished(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quizState === 'question') {
      handleSubmit();
    }
  };

  // 코드에서 빈칸을 하이라이트
  // quizState에 따라 배경/텍스트 색상 결정
  const renderCode = () => {
    const parts = currentQuiz.code.split('____');
    // question: 다크 배경 → 밝은 텍스트
    // correct/incorrect: 밝은 배경 → 어두운 텍스트
    const codeTextColor = quizState === 'question' ? 'text-gray-100' : 'text-[#6b5a4a]';

    return (
      <pre className="text-sm font-mono leading-relaxed whitespace-pre-wrap">
        {parts.map((part, index) => (
          <span key={index}>
            <span className={codeTextColor}>{part}</span>
            {index < parts.length - 1 && (
              <span className={`px-2 py-0.5 rounded ${
                quizState === 'question'
                  ? 'bg-purple-200 text-purple-700'
                  : quizState === 'correct'
                  ? 'bg-green-200 text-green-700'
                  : 'bg-red-200 text-red-700'
              }`}>
                {quizState === 'question' ? '____' : currentQuiz.answer}
              </span>
            )}
          </span>
        ))}
      </pre>
    );
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
                className="flex-1 py-[4%] rounded-xl bg-purple-500 text-white font-semibold hover:bg-purple-600 transition-colors flex items-center justify-center"
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
          <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-[#6b5a4a]">빈칸 코드 입력</h1>
        </div>

        {/* 진행률 */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-[#937b5d] mb-2">
            <span>{currentIndex + 1} / {MOCK_QUIZZES.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[#e5d5c7] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500 rounded-full"
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
            {/* 질문 */}
            <div className="bg-white rounded-2xl border-2 border-[#e5d5c7] p-[5%] mb-[4%] shadow-lg">
              <p className="text-[#6b5a4a] font-medium mb-[4%] text-sm sm:text-base">
                {currentQuiz.question}
              </p>

              {/* 코드 블록 */}
              <div className={`p-[4%] rounded-xl border-2 ${
                quizState === 'correct'
                  ? 'bg-green-50 border-green-300'
                  : quizState === 'incorrect'
                  ? 'bg-red-50 border-red-300'
                  : 'bg-[#1e1e1e] border-[#333]'
              }`}>
                {renderCode()}
              </div>
            </div>

            {/* 입력 필드 */}
            {quizState === 'question' ? (
              <div className="flex gap-3 sm:gap-[3%]">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="빈칸에 들어갈 코드"
                  className="flex-1 px-4 sm:px-[4%] py-3 sm:py-[4%] min-h-[48px] rounded-xl border-2 border-[#e5d5c7] focus:border-purple-400 focus:outline-none font-mono text-base sm:text-lg"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmit}
                  disabled={!userInput.trim()}
                  className="px-4 sm:px-[5%] py-3 sm:py-[4%] min-h-[48px] min-w-[64px] rounded-xl bg-purple-500 text-white font-semibold shadow-lg hover:bg-purple-600 active:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation"
                >
                  확인
                </motion.button>
              </div>
            ) : (
              <>
                {/* 사용자 답변 표시 */}
                <div className={`p-[4%] rounded-xl border-2 mb-[4%] ${
                  quizState === 'correct'
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-400 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm text-[#937b5d]">내 답변:</span>
                    <code className={`px-2 py-1 rounded font-mono text-sm ${
                      quizState === 'correct' ? 'bg-green-200 text-green-700' : 'bg-red-200 text-red-700'
                    }`}>
                      {userInput}
                    </code>
                  </div>
                  {quizState === 'incorrect' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-[#937b5d]">정답:</span>
                      <code className="px-2 py-1 rounded font-mono text-sm bg-green-200 text-green-700">
                        {currentQuiz.answer}
                      </code>
                    </div>
                  )}
                </div>

                {/* 해설 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className={`p-[4%] rounded-xl ${
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
            className="w-full mt-8 py-4 min-h-[48px] rounded-2xl bg-[#a08060] text-white font-semibold shadow-lg hover:bg-[#8b6d4f] active:bg-[#7a5f45] transition-colors touch-manipulation"
          >
            {currentIndex < MOCK_QUIZZES.length - 1 ? '다음 문제' : '결과 보기'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
