/**
 * QuizPage - 퀴즈 선택 페이지
 *
 * WHY: 3가지 퀴즈 유형 중 선택 → 언어 선택 → 퀴즈 시작
 * TYPES: OX, 객관식, 빈칸 코드 입력
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, CircleDot, ListChecks, Code2, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores/store';

interface QuizType {
  id: string;
  path: string;
  labelKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface LanguageOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
}

const QUIZ_TYPES: QuizType[] = [
  {
    id: 'ox',
    path: '/quiz/ox',
    labelKey: 'quiz.ox_quiz',
    descKey: 'quiz.ox_desc',
    icon: CircleDot,
    color: 'bg-blue-500',
  },
  {
    id: 'multiple-choice',
    path: '/quiz/multiple-choice',
    labelKey: 'quiz.multiple_choice',
    descKey: 'quiz.multiple_desc',
    icon: ListChecks,
    color: 'bg-green-500',
  },
  {
    id: 'fill-blank',
    path: '/quiz/fill-blank',
    labelKey: 'quiz.fill_blank',
    descKey: 'quiz.fill_desc',
    icon: Code2,
    color: 'bg-purple-500',
  },
  {
    id: 'algorithm',
    path: '/quiz/algorithm',
    labelKey: 'quiz.algorithm',
    descKey: 'quiz.algorithm_desc',
    icon: Brain,
    color: 'bg-orange-500',
  },
];

const LANGUAGES: LanguageOption[] = [
  {
    id: 'c',
    name: 'C',
    icon: 'C',
    color: '#0077B6',
    bgColor: 'bg-sky-100',
  },
  {
    id: 'javascript',
    name: 'JS',
    icon: '⚡',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'java',
    name: 'Java',
    icon: '☕',
    color: '#EC4899',
    bgColor: 'bg-pink-100',
  },
  {
    id: 'python',
    name: 'Python',
    icon: '🐍',
    color: '#3776AB',
    bgColor: 'bg-yellow-100',
  },
];

export function QuizPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const setPageTitle = useStore((s) => s.setPageTitle);
  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle(t('quiz.title'), t('quiz.subtitle'));
  }, [setPageTitle, t]);

  const handleQuizTypeClick = (quizId: string) => {
    if (quizId === 'algorithm') {
      navigate('/quiz/algorithm/python');
      return;
    }
    setSelectedQuizType(quizId);
  };

  const handleLanguageClick = (langId: string) => {
    if (selectedQuizType) {
      navigate(`/quiz/${selectedQuizType}/${langId}`);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--theme-quiz-page-bg)' }}>
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <FileQuestion className="w-8 h-8" style={{ color: 'var(--theme-quiz-header-icon)' }} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-quiz-title)' }}>{t('quiz.title')}</h1>
        </div>

        {/* 퀴즈 유형 버튼들 - 모바일: 세로, 데스크톱: 가로 */}
        <div className="flex flex-col md:flex-row gap-4">
          {QUIZ_TYPES.map((quiz) => {
            const Icon = quiz.icon;
            const isSelected = selectedQuizType === quiz.id;
            return (
              <button
                key={quiz.id}
                onClick={() => handleQuizTypeClick(quiz.id)}
                className="flex-1 rounded-xl border p-6 transition-all group text-left hover:shadow-md"
                style={{
                  backgroundColor: isSelected ? 'var(--theme-quiz-card-selected-bg)' : 'var(--theme-quiz-card-bg)',
                  borderColor: isSelected ? 'var(--theme-quiz-card-selected-border)' : 'var(--theme-quiz-card-border)',
                  boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--theme-quiz-card-border-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--theme-quiz-card-border)';
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${quiz.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-lg font-semibold transition-colors"
                      style={{
                        color: isSelected ? 'var(--theme-quiz-text-hover)' : 'var(--theme-quiz-text)',
                      }}
                    >
                      {t(quiz.labelKey)}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--theme-quiz-text-muted)' }}>
                      {t(quiz.descKey)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 언어 선택 버튼 - 퀴즈 유형 선택 후 표시 */}
        <AnimatePresence>
          {selectedQuizType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              className="mt-8"
            >
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--theme-quiz-title)' }}>{t('quiz.select_language')}</h3>
              <div className="flex flex-col md:flex-row gap-4">
                {LANGUAGES.map((lang) => (
                  <motion.button
                    key={lang.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleLanguageClick(lang.id)}
                    className={`flex-1 flex items-center justify-center gap-3 px-5 py-3 rounded-xl border-2 transition-all ${lang.bgColor} hover:shadow-md`}
                    style={{ borderColor: lang.color }}
                  >
                    <span className="text-2xl">{lang.icon}</span>
                    <span className="font-bold text-lg" style={{ color: lang.color }}>
                      {lang.name}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
