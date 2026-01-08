/**
 * ChapterCard - 챕터 카드 (Grid용)
 *
 * 클릭 시 해당 챕터의 레슨 목록 페이지로 이동
 */

import { useNavigate } from 'react-router-dom';
import type { Chapter, UserProgress } from '@/types';
import { Star, Target, Lock, ChevronRight, BookOpen } from 'lucide-react';

interface ChapterCardProps {
  chapter: Chapter;
  languageId: string;
  lessonCount: number;
  completedCount: number;
  isLocked?: boolean;
  isActive?: boolean;
}

export function ChapterCard({
  chapter,
  languageId,
  lessonCount,
  completedCount,
  isLocked = false,
  isActive = false,
}: ChapterCardProps) {
  const navigate = useNavigate();

  const progressPercent = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
  const isComplete = completedCount === lessonCount && lessonCount > 0;

  const handleClick = () => {
    if (!isLocked) {
      navigate(`/courses/${languageId}/${chapter.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`
        group relative rounded-xl p-6 text-left
        transition-all duration-300 hover:scale-[1.02]
        ${isComplete
          ? 'bg-gradient-to-br from-[#1a2e1a] to-[#162e16] border border-[#10B981]/30 shadow-lg'
          : isActive
            ? 'bg-gradient-to-br from-[#1a1a2e] to-[#16213e] border border-[#00D9FF]/30 shadow-[0_0_30px_-10px_#00D9FF40]'
            : isLocked
              ? 'bg-[#252535] border border-white/5 opacity-60 cursor-not-allowed'
              : 'bg-[#1a1a2e] border border-white/10 hover:border-white/20 hover:shadow-xl'
        }
      `}
    >
      {/* 완료시 별 */}
      {isComplete && (
        <div className="absolute top-4 right-4">
          <Star className="w-6 h-6 text-[#FFD700] fill-[#FFD700] animate-pulse" />
        </div>
      )}

      {/* 화살표 (호버 시) */}
      {!isLocked && !isComplete && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5 text-white/40" />
        </div>
      )}

      {/* 상태 배지 */}
      <div className="flex items-center gap-2 mb-3">
        {isActive && !isComplete && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
            <Target className="w-3 h-3" />
            Current
          </span>
        )}
        {isComplete && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
            <Star className="w-3 h-3" />
            Completed
          </span>
        )}
        {isLocked && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/50 border border-white/20">
            <Lock className="w-3 h-3" />
            Locked
          </span>
        )}
      </div>

      {/* 챕터 제목 */}
      <h3
        className={`
          text-xl font-bold mb-2
          ${isComplete ? 'text-[#10B981]' : isLocked ? 'text-white/60' : 'text-white'}
        `}
      >
        {chapter.title}
      </h3>

      {/* 챕터 설명 */}
      {chapter.description && (
        <p className="text-sm text-white/60 mb-4 line-clamp-2">
          {chapter.description}
        </p>
      )}

      {/* 진행률 바 */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
          <span>Progress</span>
          <span className="font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isComplete ? 'bg-[#10B981]' : 'bg-[#00D9FF]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* 레슨 카운트 */}
      <div className="flex items-center gap-2 text-sm text-white/50">
        <BookOpen className="w-4 h-4" />
        <span>
          {completedCount} / {lessonCount} Lessons
        </span>
      </div>
    </button>
  );
}
