/**
 * QuizPage - 퀴즈 선택 페이지
 *
 * WHY: 3가지 퀴즈 유형 중 선택
 * TYPES: OX, 객관식, 빈칸 코드 입력
 */

import { Link } from 'react-router-dom';
import { FileQuestion, CircleDot, ListChecks, Code2 } from 'lucide-react';

interface QuizTypeButton {
  path: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const QUIZ_TYPES: QuizTypeButton[] = [
  {
    path: '/quiz/ox',
    label: 'OX 퀴즈',
    description: '참/거짓을 판단하세요',
    icon: CircleDot,
    color: 'bg-blue-500',
  },
  {
    path: '/quiz/multiple-choice',
    label: '객관식',
    description: '4개 중 정답을 선택하세요',
    icon: ListChecks,
    color: 'bg-green-500',
  },
  {
    path: '/quiz/fill-blank',
    label: '빈칸 코드 입력',
    description: '코드 빈칸을 채우세요',
    icon: Code2,
    color: 'bg-purple-500',
  },
];

export function QuizPage() {
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
            return (
              <Link
                key={quiz.path}
                to={quiz.path}
                className="flex-1 bg-white rounded-xl border border-[#e5d5c7] p-6 hover:border-[#a08060] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg ${quiz.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-[#6b5a4a] group-hover:text-[#a08060] transition-colors">
                      {quiz.label}
                    </h2>
                    <p className="text-sm text-[#937b5d]">
                      {quiz.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
