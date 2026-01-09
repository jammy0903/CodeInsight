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

  // 스티치 색상 결정 (밝은 네온 컬러)
  const stitchColor = isComplete
    ? 'rgba(0, 245, 212, 0.6)'
    : isActive
      ? 'rgba(0, 187, 249, 0.6)'
      : isLocked
        ? 'rgba(255, 255, 255, 0.1)'
        : 'rgba(155, 93, 229, 0.4)';

  return (
    <button
      onClick={handleClick}
      disabled={isLocked}
      className={`
        group relative rounded-xl text-left
        transition-all duration-300 hover:scale-[1.02]
        ${isComplete
          ? 'border border-[#00F5D4]/50 shadow-lg shadow-[#00F5D4]/20'
          : isActive
            ? 'border border-[#00BBF9]/60 shadow-[0_0_30px_-10px_#00BBF980]'
            : isLocked
              ? 'border border-white/5 opacity-60 cursor-not-allowed'
              : 'border border-[#9B5DE5]/30 hover:border-[#9B5DE5]/60 hover:shadow-xl hover:shadow-[#9B5DE5]/20'
        }
      `}
      style={{
        padding: '32px',
        minHeight: '300px',
        background: isComplete
          ? 'linear-gradient(135deg, #1A3A35 0%, #0D4A42 100%)'
          : isActive
            ? 'linear-gradient(135deg, #1A2A3A 0%, #0D3A4A 100%)'
            : isLocked
              ? '#2A2828'
              : 'linear-gradient(135deg, #2A2535 0%, #352D40 100%)'
      }}
    >
      {/* 바느질 스티치 테두리 */}
      <div
        className="absolute rounded-lg pointer-events-none"
        style={{
          top: '8px',
          left: '8px',
          right: '8px',
          bottom: '8px',
          border: `2px dashed ${stitchColor}`,
          borderRadius: '8px'
        }}
      />
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
      <div className="flex items-center gap-2" style={{ marginBottom: '16px' }}>
        {isActive && !isComplete && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00BBF9]/20 text-[#00BBF9] border border-[#00BBF9]/40">
            <Target className="w-3 h-3" />
            Current
          </span>
        )}
        {isComplete && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00F5D4]/20 text-[#00F5D4] border border-[#00F5D4]/40">
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
          text-xl font-bold
          ${isComplete ? 'text-[#00F5D4]' : isLocked ? 'text-white/60' : 'text-white'}
        `}
        style={{ marginBottom: '12px' }}
      >
        {chapter.title}
      </h3>

      {/* 챕터 설명 */}
      {chapter.description && (
        <p className="text-sm text-white/60 line-clamp-2" style={{ marginBottom: '24px' }}>
          {chapter.description}
        </p>
      )}

      {/* 진행률 바 */}
      <div style={{ marginBottom: '16px' }}>
        <div className="flex items-center justify-between text-xs text-white/50 mb-1">
          <span>Progress</span>
          <span className="font-mono font-bold">{progressPercent}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercent}%`,
              background: isComplete
                ? '#00F5D4'
                : 'linear-gradient(90deg, #00BBF9, #9B5DE5)'
            }}
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
