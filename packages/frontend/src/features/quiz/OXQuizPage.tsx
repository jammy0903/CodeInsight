/**
 * OXQuizPage - OX 퀴즈 페이지
 *
 * DESIGN: 언어 → 챕터 선택 → 10문제 퀴즈
 * URL: /quiz/ox/:lang
 *
 * WHY: Standalone Quiz API 사용
 * - 챕터별 통계 표시 (시도한 퀴즈 수, 정답률)
 * - API에서 퀴즈 데이터 가져오기
 * - 시도 기록 저장
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleDot, Check, X, RotateCcw, BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer } from './components/Timer';
import {
  getChapterStatistics,
  getQuizzes,
  recordQuizAttempt,
  type ChapterStatistics,
  type StandaloneQuiz,
} from '@/services/standalone-quiz';
import { logger } from '@/utils/logger';
import { useTranslation } from 'react-i18next';

// 언어별 정보
const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  c: { name: 'C', icon: '🧊', color: '#3B82F6' },
  cpp: { name: 'C++', icon: '💠', color: '#2563EB' },
  javascript: { name: 'JavaScript', icon: '⚡', color: '#F59E0B' },
  java: { name: 'Java', icon: '☕', color: '#EC4899' },
  python: { name: 'Python', icon: '🐍', color: '#3776AB' },
};

type ViewState = 'chapters' | 'quiz' | 'result';

export function OXQuizPage() {
  const { t } = useTranslation();
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
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);

  const currentQuiz = quizzes[currentIndex];
  const totalQuizzes = quizzes.length;
  const progress = totalQuizzes > 0 ? ((currentIndex + 1) / totalQuizzes) * 100 : 0;

  const loadChapters = useCallback(async () => {
    try {
      setIsLoadingChapters(true);
      const stats = await getChapterStatistics(lang || 'c', 'ox');
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

      // 해당 챕터의 퀴즈 가져오기
      const quizData = await getQuizzes({
        language: lang || 'c',
        quizType: 'ox',
        chapterId: chapter.chapterId,
      });

      setQuizzes(quizData);
      setViewState('quiz');
      setCurrentIndex(0);
      setQuizState('question');
      setScore(0);
      setWrongCount(0);
      setStartTime(Date.now());
    } catch (error) {
      logger.error('Failed to load quizzes:', error);
    } finally {
      setIsLoadingQuizzes(false);
    }
  };

  const handleAnswer = async (userAnswer: boolean) => {
    if (!currentQuiz) return;

    const isCorrect = userAnswer.toString() === currentQuiz.answer;
    const timeSpent = Date.now() - startTime;

    // 백엔드에 시도 기록
    try {
      await recordQuizAttempt({
        quizId: currentQuiz.id,
        userAnswer: userAnswer.toString(),
        isCorrect,
        timeSpent,
      });
    } catch (error) {
      logger.error('Failed to record quiz attempt:', error);
      // 에러가 나도 사용자 경험에는 영향 없음 (계속 진행)
    }

    // 점수 업데이트
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
      setStartTime(Date.now());
    } else {
      setViewState('result');
    }
  };

  const handleTimeout = async () => {
    if (!currentQuiz) return;

    const timeSpent = Date.now() - startTime;

    // 타임아웃도 오답으로 기록
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
    loadChapters(); // 통계 갱신
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

          {/* 로딩 또는 챕터 목록 */}
          {isLoadingChapters ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : chapters.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[var(--theme-quiz-text-muted)]">{t("quiz.txt_2d76c3")}</p>
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
                              <span className="text-blue-600 font-medium">
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
            <h1 className="text-xl font-bold text-[var(--theme-quiz-title)]">{t("quiz.txt_a3f74a")}</h1>
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

  // 퀴즈 로딩 화면
  if (isLoadingQuizzes) {
    return (
      <div className="bg-[var(--theme-quiz-page-bg)] min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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
            <h1 className="text-lg font-bold text-[var(--theme-quiz-title)]">{selectedChapter?.chapterTitle}</h1>
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
          {/* 타이머 */}
          <div className="mb-4 flex justify-center">
            <Timer
              key={currentIndex}
              duration={30}
              onTimeout={handleTimeout}
              isPaused={quizState !== 'question'}
            />
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
                  {/* 개념 태그 표시 */}
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
