/**
 * QuizPage - 퀴즈 선택 페이지
 *
 * WHY: 3가지 퀴즈 유형 중 선택 → 언어 선택 → 퀴즈 시작
 * TYPES: OX, 객관식, 빈칸 코드 입력
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileQuestion, CircleDot, ListChecks, Code2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores/store';

interface QuizType {
  id: string;
  path: string;
  label: string;
  description: string;
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
    label: 'OX 퀴즈',
    description: '참/거짓을 판단하세요',
    icon: CircleDot,
    color: 'bg-blue-500',
  },
  {
    id: 'multiple-choice',
    path: '/quiz/multiple-choice',
    label: '객관식',
    description: '4개 중 정답을 선택하세요',
    icon: ListChecks,
    color: 'bg-green-500',
  },
  {
    id: 'fill-blank',
    path: '/quiz/fill-blank',
    label: '빈칸 코드 입력',
    description: '코드 빈칸을 채우세요',
    icon: Code2,
    color: 'bg-purple-500',
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
  const { setPageTitle } = useStore();
  const [selectedQuizType, setSelectedQuizType] = useState<string | null>(null);

  // 페이지 제목 설정
  useEffect(() => {
    setPageTitle('퀴즈', '학습한 내용을 확인해보세요');
  }, [setPageTitle]);

  const handleQuizTypeClick = (quizId: string) => {
    setSelectedQuizType(quizId);
  };

  const handleLanguageClick = (langId: string) => {
    if (selectedQuizType) {
      navigate(`/quiz/${selectedQuizType}/${langId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-8">
          <FileQuestion className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">퀴즈</h1>
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
                className={`flex-1 rounded-xl border p-6 transition-all group text-left ${
                  isSelected
                    ? 'border-[#a08060] bg-[#fff8f0] shadow-md'
                    : 'border-[#e5d5c7] bg-white hover:border-[#a08060] hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${quiz.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-lg font-semibold transition-colors ${
                      isSelected ? 'text-[#a08060]' : 'text-[#6b5a4a] group-hover:text-[#a08060]'
                    }`}>
                      {quiz.label}
                    </h2>
                    <p className="text-sm text-[#937b5d]">
                      {quiz.description}
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
              <h3 className="text-lg font-semibold text-[#6b5a4a] mb-4">언어 선택</h3>
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
