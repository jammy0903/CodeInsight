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

  // 스티치 색상 결정 (차분한 파스텔)
  const stitchColor = isCompleted
    ? 'rgba(16, 185, 129, 0.5)'   // 민트 그린
    : isInProgress
      ? 'rgba(196, 21, 122, 0.4)' // 로즈 핑크
      : 'rgba(230, 180, 0, 0.45)'; // 머스타드

  return (
    <button
      onClick={handleClick}
      className={`
        group relative rounded-xl text-left
        transition-all duration-300 hover:scale-[1.02]
        ${isCompleted
          ? 'border-2 border-[#10B981]/50 shadow-lg shadow-[#10B981]/15'
          : isInProgress
            ? 'border-2 border-[#C4157A]/50 shadow-lg shadow-[#C4157A]/15'
            : 'border-2 border-[#E6B400]/40 hover:border-[#E6B400]/60 hover:shadow-lg hover:shadow-[#E6B400]/15'
        }
      `}
      style={{
        padding: '32px',
        minHeight: '280px',
        background: isCompleted
          ? 'linear-gradient(135deg, #B8E8D4 0%, #9AD8BE 100%)'  // 연한 민트
          : isInProgress
            ? 'linear-gradient(135deg, #F5C6D6 0%, #E8A8BE 100%)' // 연한 핑크
            : 'linear-gradient(135deg, #FFF2CC 0%, #FFE699 100%)' // 머스타드 옐로우
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
      {/* 상태 아이콘 (우상단) */}
      <div className="absolute top-12 right-12">
        {isCompleted ? (
          <CheckCircle2 className="w-6 h-6 text-[#10B981]" />
        ) : isInProgress ? (
          <PlayCircle className="w-6 h-6 text-[#C4157A] animate-pulse" />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-[#E6B400]/50 group-hover:border-[#E6B400]/80 transition-colors" />
        )}
      </div>

      {/* 레슨 번호 뱃지 */}
      {lesson.order !== undefined && (
        <div
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-bold"
          style={{
            marginBottom: '12px',
            backgroundColor: isCompleted
              ? 'rgba(16, 185, 129, 0.15)'   // 민트 그린
              : isInProgress
                ? 'rgba(233, 30, 140, 0.12)'  // 핑크
                : 'rgba(230, 180, 0, 0.15)',  // 머스타드
            color: isCompleted
              ? '#059669'
              : isInProgress
                ? '#C4157A'
                : '#CC9900',  // 머스타드
            border: isCompleted
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : isInProgress
                ? '1px solid rgba(233, 30, 140, 0.3)'
                : '1px solid rgba(230, 180, 0, 0.4)'
          }}
        >
          {lesson.order}
        </div>
      )}

      {/* 레슨 제목 */}
      <h3
        className={`
          text-lg font-bold line-clamp-2
          ${isCompleted
            ? 'text-[#059669]'
            : isInProgress
              ? 'text-[#C4157A]'
              : 'text-[#4A4A4A] group-hover:text-[#CC9900] transition-colors'
          }
        `}
        style={{ marginBottom: '12px' }}
      >
        {lesson.title}
      </h3>

      {/* 레슨 설명 */}
      {lesson.description && (
        <p className="text-sm text-[#6B6B6B] line-clamp-2" style={{ marginBottom: '20px' }}>
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
        <div className="mt-3 flex items-center gap-1.5 text-[#E6B400] text-xs font-mono">
          <Zap className="w-3.5 h-3.5 fill-[#E6B400]" />
          <span>+10 XP</span>
        </div>
      )}
    </button>
  );
}
