/**
 * MultipleChoiceQuizPage - 객관식 퀴즈 페이지
 *
 * DESIGN: 언어 → 챕터 선택 → 10문제 퀴즈
 * URL: /quiz/multiple-choice/:lang
 *
 * WHY: Standalone Quiz API 사용
 * - 챕터별 통계 표시 (시도한 퀴즈 수, 정답률)
 * - API에서 퀴즈 데이터 가져오기
 * - 시도 기록 저장
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ListChecks, Check, X, RotateCcw, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Timer } from './components/Timer';
import {
  getChapterStatistics,
  getQuizzes,
  recordQuizAttempt,
  type ChapterStatistics,
  type StandaloneQuiz,
} from '@/services/standalone-quiz';
import { logger } from '@/utils/logger';

// 언어별 정보
const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  c: { name: 'C', icon: '🧊', color: '#3B82F6' },
  cpp: { name: 'C++', icon: '💠', color: '#2563EB' },
  javascript: { name: 'JavaScript', icon: '⚡', color: '#F59E0B' },
  java: { name: 'Java', icon: '☕', color: '#EC4899' },
  python: { name: 'Python', icon: '🐍', color: '#3776AB' },
};

type ViewState = 'chapters' | 'quiz' | 'result';

export function MultipleChoiceQuizPage() {
  const { lang } = useParams<{ lang: string }>();
  const langInfo = LANGUAGE_INFO[lang || 'c'] || LANGUAGE_INFO.c;

  const [viewState, setViewState] = useState<ViewState>('chapters');
  const [chapters, setChapters] = useState<ChapterStatistics[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(true);

  const [selectedChapter, setSelectedChapter] = useState<ChapterStatistics | null>(null);
  const [quizzes, setQuizzes] = useState<StandaloneQuiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizState, setQuizState] = useState<'question' | 'correct' | 'incorrect'>('question');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const currentQuiz = quizzes[currentIndex];
  const totalQuizzes = quizzes.length;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const loadChapters = useCallback(async () => {
    try {
      setIsLoadingChapters(true);
      const stats = await getChapterStatistics(lang || 'c', 'multiple-choice');
      setChapters(stats);
    } catch (error) {
      logger.error('Failed to load chapter statistics:', error);
    } finally {
      setIsLoadingChapters(false);
    }
  }, [lang]);

  // 챕터 목록 로드
  useEffect(() => {
    if (viewState === 'chapters') {
      void loadChapters();
    }
  }, [viewState, loadChapters]);

  const handleChapterSelect = async (chapter: ChapterStatistics) => {
    try {
      setIsLoadingQuizzes(true);
      setSelectedChapter(chapter);

      const quizData = await getQuizzes({
        language: lang || 'c',
        quizType: 'multiple-choice',
        chapterId: chapter.chapterId,
      });

      setQuizzes(quizData);
      setViewState('quiz');
      setCurrentIndex(0);
      setQuizState('question');
      setSelectedOption(null);
      setScore(0);
      setWrongCount(0);
      setStartTime(Date.now());
    } catch (error) {
      logger.error('Failed to load quizzes:', error);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  const handleAnswer = async (optionIndex: number) => {
    if (!currentQuiz || quizState !== 'question') return;

    setSelectedOption(optionIndex);
    const isCorrect = optionIndex.toString() === currentQuiz.answer;
    const timeSpent = Date.now() - startTime;

    // 백엔드에 시도 기록
    try {
      await recordQuizAttempt({
        quizId: currentQuiz.id,
        userAnswer: optionIndex.toString(),
        isCorrect,
        timeSpent,
      });
    } catch (error) {
      logger.error('Failed to record quiz attempt:', error);
    }

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
      setStartTime(Date.now());
    } else {
      setViewState('result');
    }
  };

  const handleTimeout = async () => {
    if (!currentQuiz) return;

    const timeSpent = Date.now() - startTime;

    try {
      await recordQuizAttempt({
        quizId: currentQuiz.id,
        userAnswer: 'timeout',
        isCorrect: false,
        timeSpent,
      });
    } catch (error) {
      logger.error('Failed to record quiz timeout:', error);
    }

    setWrongCount(wrongCount + 1);
    setQuizState('incorrect');
    setSelectedOption(-1);
  };

  const handleRestart = () => {
    if (selectedChapter) {
      handleChapterSelect(selectedChapter);
    }
  };

  const handleBackToChapters = () => {
    setViewState('chapters');
    setSelectedChapter(null);
    setQuizzes([]);
    loadChapters();
  };

  const getCorrectAnswerIndex = (): number => {
    if (!currentQuiz) return -1;
    return parseInt(currentQuiz.answer, 10);
  };

  const getOptionStyle = (index: number) => {
    const correctIndex = getCorrectAnswerIndex();

    if (quizState === 'question') {
      return 'border-[var(--theme-quiz-card-border)] bg-[var(--theme-quiz-card-bg)] hover:border-green-400 hover:bg-green-50';
    }

    if (index === correctIndex) {
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

          {isLoadingChapters ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--theme-quiz-text-muted)]">아직 퀴즈가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chapters.map((chapter) => (
                <motion.button
                  key={chapter.chapterId}
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
                        <h3 className="font-semibold text-[var(--theme-quiz-title)]">{chapter.chapterTitle}</h3>
                        <div className="flex items-center gap-3 text-sm text-[var(--theme-quiz-text-muted)]">
                          <span>{chapter.totalQuizzes}문제</span>
                          {chapter.attemptedQuizzes > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-green-600 font-medium">
                                {chapter.attemptedQuizzes}개 시도
                              </span>
                              <span>•</span>
                              <span className={`font-medium ${
                                chapter.accuracy >= 80 ? 'text-green-600' :
                                chapter.accuracy >= 60 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                정답률 {chapter.accuracy}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[var(--theme-quiz-text-muted)]" />
                  </div>
                </motion.button>
              ))}
            </div>
          )}
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
            <p className="text-[var(--theme-quiz-text-muted)] mb-2">{selectedChapter?.chapterTitle}</p>
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

  // 퀴즈 로딩 화면
  if (isLoadingQuizzes) {
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
      </div>
    );
  }

  const correctIndex = getCorrectAnswerIndex();

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
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.chapterTitle}</h1>
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
          </div>
          <div className="h-2 bg-[var(--theme-dashboard-progress-bg)] rounded-full overflow-hidden">
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
              {/* 이전 시도 기록 표시 */}
              {currentQuiz.lastAttempt && quizState === 'question' && (
                <div className={`mb-3 px-3 py-1.5 rounded-lg text-xs font-medium inline-block ${
                  currentQuiz.lastAttempt.isCorrect
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {currentQuiz.lastAttempt.isCorrect ? '✓ 이전에 맞힌 문제' : '✗ 이전에 틀린 문제'}
                  {currentQuiz.lastAttempt.attemptNumber > 1 && ` (${currentQuiz.lastAttempt.attemptNumber}번째 시도)`}
                </div>
              )}

              <div className="bg-[var(--theme-quiz-card-bg)] rounded-2xl border-2 border-[var(--theme-quiz-card-border)] p-6 mb-4 shadow-lg">
                <p className="text-lg text-[var(--theme-quiz-title)] font-medium leading-relaxed whitespace-pre-line">
                  {currentQuiz.question}
                </p>
              </div>

              <div className="space-y-3">
                {currentQuiz.options?.map((option, index) => (
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
                        quizState !== 'question' && index === correctIndex
                          ? 'bg-green-500 text-white'
                          : quizState === 'incorrect' && index === selectedOption
                          ? 'bg-red-500 text-white'
                          : 'bg-[var(--theme-dashboard-section-header-bg)] text-[var(--theme-quiz-text)]'
                      }`}>
                        {quizState !== 'question' && index === correctIndex ? (
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
                  <p className="text-sm text-[var(--theme-quiz-title)] whitespace-pre-line">
                    {currentQuiz.explanation}
                  </p>
                  {currentQuiz.concepts.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {currentQuiz.concepts.map((concept, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white rounded-md text-xs font-medium text-[var(--theme-quiz-title)]"
                        >
                          #{concept}
                        </span>
                      ))}
                    </div>
                  )}
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
