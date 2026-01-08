/**
 * LessonCard - 레슨 카드 (Grid용)
 *
 * 클릭 시 해당 레슨 페이지로 이동
 * LessonItem과 다르게 Grid 레이아웃에 최적화
 */

import { useNavigate } from 'react-router-dom';
import type { Lesson, UserProgress } from '@/types';
import { CheckCircle2, PlayCircle, Clock, Zap } from 'lucide-react';

interface LessonCardProps {
  lesson: Lesson;
  progress?: UserProgress;
  languageId: string;
  chapterId: string;
}

export function LessonCard({ lesson, progress, languageId, chapterId }: LessonCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${languageId}/${chapterId}/${lesson.id}`);
  };

  // 난이도 정보
  const getDifficultyInfo = () => {
    switch (lesson.difficulty) {
      case 'basic':
        return { text: 'Easy', color: '#10B981', bg: '#10B981' };
      case 'intermediate':
        return { text: 'Medium', color: '#F59E0B', bg: '#F59E0B' };
      case 'advanced':
        return { text: 'Hard', color: '#EF4444', bg: '#EF4444' };
      default:
        return { text: '', color: '#6B7280', bg: '#6B7280' };
    }
  };

  const difficultyInfo = getDifficultyInfo();
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <button
      onClick={handleClick}
      className={`
        group relative rounded-xl p-5 text-left
        transition-all duration-300 hover:scale-[1.02]
        ${isCompleted
          ? 'bg-gradient-to-br from-[#1a2e1a] to-[#162e16] border border-[#10B981]/30 shadow-lg'
          : isInProgress
            ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#00D9FF]/30 shadow-[0_0_20px_-10px_#00D9FF40]'
            : 'bg-[#1a1a2e] border border-white/10 hover:border-white/20 hover:shadow-xl'
        }
      `}
    >
      {/* 상태 아이콘 (좌상단) */}
      <div className="absolute top-4 right-4">
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
        ) : isInProgress ? (
          <PlayCircle className="w-6 h-6 text-[#00D9FF] animate-pulse" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors" />
        )}
      </div>

      {/* 레슨 번호 뱃지 */}
      {lesson.order !== undefined && (
        <div
          className={`
            inline-flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-bold mb-3
            ${isCompleted
              ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30'
              : isInProgress
                ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30'
                : 'bg-white/10 text-white/60 border border-white/20'
            }
          `}
        >
          {lesson.order}
        </div>
      )}

      {/* 레슨 제목 */}
      <h3
        className={`
          text-lg font-bold mb-2 line-clamp-2
          ${isCompleted
            ? 'text-[#10B981]'
            : isInProgress
              ? 'text-white'
              : 'text-white/80 group-hover:text-white transition-colors'
          }
        `}
      >
        {lesson.title}
      </h3>

      {/* 레슨 설명 */}
      {lesson.description && (
        <p className="text-sm text-white/50 mb-4 line-clamp-2">
          {lesson.description}
        </p>
      )}

      {/* 하단 정보 */}
      <div className="flex items-center justify-between gap-2">
        {/* 예상 시간 */}
        <div className="flex items-center gap-1.5 text-white/40 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.estimatedTime || 5}min</span>
        </div>

        {/* 난이도 뱃지 */}
        {difficultyInfo.text && (
          <div
            className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${difficultyInfo.bg}20`,
              color: difficultyInfo.color,
              border: `1px solid ${difficultyInfo.color}40`
            }}
          >
            {difficultyInfo.text}
          </div>
        )}
      </div>

      {/* 완료시 XP 표시 */}
      {isCompleted && (
        <div className="mt-3 flex items-center gap-1.5 text-[#FFD700] text-xs font-mono">
          <Zap className="w-3.5 h-3.5 fill-[#FFD700]" />
          <span>+10 XP</span>
        </div>
      )}
    </button>
  );
}
