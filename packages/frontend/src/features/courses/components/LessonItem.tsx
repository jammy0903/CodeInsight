import { useNavigate } from 'react-router-dom';
import type { Lesson, UserProgress } from '@/types';
import { CheckCircle2, Circle, PlayCircle, Clock } from 'lucide-react';

interface LessonItemProps {
  lesson: Lesson;
  progress?: UserProgress;
  languageId: string;
  onClick?: () => void;
  missionNum?: number;
}

export function LessonItem({ lesson, progress, languageId, onClick, missionNum }: LessonItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/courses/${languageId}/${lesson.chapterId}/${lesson.id}`);
    }
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
        group w-full flex items-center gap-4 px-5 py-4 rounded-xl
        transition-all duration-200
        ${isCompleted
          ? 'bg-[#10B981]/10 hover:bg-[#10B981]/20'
          : isInProgress
            ? 'bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 border-l-2 border-[#00D9FF]'
            : 'bg-white/5 hover:bg-white/10'
        }
      `}
    >
      {/* 미션 번호 */}
      {missionNum && (
        <div className={`
          w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold
          ${isCompleted
            ? 'bg-[#10B981]/20 text-[#10B981]'
            : isInProgress
              ? 'bg-[#00D9FF]/20 text-[#00D9FF]'
              : 'bg-white/10 text-white/40'
          }
        `}>
          {missionNum}
        </div>
      )}

      {/* 상태 아이콘 */}
      <div className="flex-shrink-0">
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
        ) : isInProgress ? (
          <PlayCircle className="w-5 h-5 text-[#00D9FF] animate-pulse" />
        ) : (
          <Circle className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" />
        )}
      </div>

      {/* 레슨 제목 */}
      <span className={`
        flex-1 text-left text-sm font-medium truncate
        ${isCompleted
          ? 'text-[#10B981]/80'
          : isInProgress
            ? 'text-white'
            : 'text-white/70 group-hover:text-white transition-colors'
        }
      `}>
        {lesson.title}
      </span>

      {/* 예상 시간 */}
      {lesson.estimatedTime && (
        <div className="flex items-center gap-1 text-white/30 text-xs">
          <Clock className="w-3 h-3" />
          <span>{lesson.estimatedTime}m</span>
        </div>
      )}

      {/* 난이도 뱃지 */}
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
    </button>
  );
}
