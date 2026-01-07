import { useState } from 'react';
import type { Chapter, Lesson, UserProgress } from '@/types';
import { LessonItem } from './LessonItem';
import { ChevronDown, Star, Target, Lock } from 'lucide-react';

interface ChapterAccordionProps {
  chapter: Chapter;
  lessons: Lesson[];
  progressMap?: Map<string, UserProgress>;
  languageId: string;
  defaultOpen?: boolean;
  isLocked?: boolean;
  isActive?: boolean;
  stageNum?: number;
}

export function ChapterAccordion({
  chapter,
  lessons,
  progressMap,
  languageId,
  defaultOpen = false,
  isLocked = false,
  isActive = false,
  stageNum,
}: ChapterAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // 진행률 계산
  const completedCount = lessons.filter((lesson) => {
    const progress = progressMap?.get(lesson.id);
    return progress?.status === 'completed';
  }).length;

  const totalCount = lessons.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div className={`
      relative rounded-xl transition-all duration-300
      ${isComplete
        ? 'bg-gradient-to-r from-[#1a2e1a] to-[#162e16] border border-[#10B981]/30'
        : isActive
          ? 'bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border border-[#00D9FF]/30 shadow-[0_0_30px_-10px_#00D9FF40]'
          : isLocked
            ? 'bg-[#252535] border border-white/5'
            : 'bg-[#1a1a2e] border border-white/10'
      }
    `}>
      {/* 완료시 반짝이 효과 */}
      {isComplete && (
        <div className="absolute top-2 right-2">
          <Star className="w-5 h-5 text-[#FFD700] fill-[#FFD700] animate-pulse" />
        </div>
      )}


      {/* 챕터 헤더 */}
      <button
        onClick={() => !isLocked && setIsOpen(!isOpen)}
        disabled={isLocked}
        className={`
          w-full flex items-center justify-between gap-4 p-5 text-left
          ${isLocked ? 'cursor-not-allowed' : 'hover:bg-white/5'}
          transition-colors
        `}
      >
        <div className="flex-1 min-w-0">
          {/* 미션 태그 */}
          <div className="flex items-center gap-2 mb-1">
            {isActive && !isComplete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
                <Target className="w-3 h-3" />
                Current Mission
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
          <h3 className={`
            text-lg font-bold
            ${isComplete ? 'text-[#10B981]' : isLocked ? 'text-white/60' : 'text-white'}
          `}>
            {chapter.title}
          </h3>

          {/* 설명 */}
          {chapter.description && (
            <p className={`text-sm mt-1 ${isLocked ? 'text-white/40' : 'text-white/50'}`}>
              {chapter.description}
            </p>
          )}
        </div>

        {/* 우측: 진행률 + 화살표 */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* 진행률 뱃지 */}
          <div className={`
            px-2.5 py-1 rounded-lg font-mono text-xs font-bold whitespace-nowrap
            ${isComplete
              ? 'bg-[#10B981]/20 text-[#10B981]'
              : completedCount > 0
                ? 'bg-[#FFD700]/20 text-[#FFD700]'
                : isLocked
                  ? 'bg-white/10 text-white/50'
                  : 'bg-white/5 text-white/40'
            }
          `}>
            {completedCount}/{totalCount}
          </div>

          {/* 펼치기 화살표 */}
          {!isLocked && (
            <ChevronDown className={`
              w-5 h-5 flex-shrink-0 transition-transform duration-300
              ${isOpen ? 'rotate-180' : ''}
              ${isComplete ? 'text-[#10B981]' : 'text-white/40'}
            `} />
          )}
        </div>
      </button>

      {/* 진행률 바 */}
      <div className="h-1 bg-white/5">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${progressPercent}%`,
            background: isComplete
              ? 'linear-gradient(90deg, #10B981, #059669)'
              : 'linear-gradient(90deg, #00D9FF, #A855F7)',
            boxShadow: isComplete
              ? '0 0 10px #10B98180'
              : '0 0 10px #00D9FF80'
          }}
        />
      </div>

      {/* 레슨 목록 */}
      {isOpen && !isLocked && (
        <div className="mx-4 mb-4 mt-2 p-4 space-y-4 bg-black/20 rounded-lg">
          {lessons.length === 0 ? (
            <p className="text-center text-sm text-white/30 py-4">
              미션 준비 중...
            </p>
          ) : (
            lessons.map((lesson, idx) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                progress={progressMap?.get(lesson.id)}
                languageId={languageId}
                missionNum={idx + 1}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
