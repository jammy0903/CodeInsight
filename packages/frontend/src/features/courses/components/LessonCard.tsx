/**
 * LessonCard - 레슨 카드 (Grid용)
 *
 * 클릭 시 해당 레슨 페이지로 이동
 * LessonItem과 다르게 Grid 레이아웃에 최적화
 */

import { useNavigate } from 'react-router-dom';
import type { Lesson, UserProgress } from '@/types';
import { CheckCircle2, PlayCircle, Clock, Zap } from 'lucide-react';

// 언어별 색상 테마 (레슨 카드용 - 밝은 파스텔)
const LANGUAGE_THEMES: Record<string, {
  primary: string;
  primaryLight: string;
  bg: string;
  bgHover: string;
  border: string;
  stitch: string;
}> = {
  c: {
    primary: '#5BA3C0',
    primaryLight: '#87CEEB',
    bg: 'linear-gradient(135deg, #E8F4FA 0%, #D0EBF7 100%)',
    bgHover: 'linear-gradient(135deg, #DCF0F8 0%, #C4E2F3 100%)',
    border: 'rgba(135, 206, 235, 0.5)',
    stitch: 'rgba(135, 206, 235, 0.5)',
  },
  python: {
    primary: '#F57C00',
    primaryLight: '#FFD54F',
    bg: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)',
    bgHover: 'linear-gradient(135deg, #FFF4D6 0%, #FFE699 100%)',
    border: 'rgba(255, 213, 79, 0.5)',
    stitch: 'rgba(255, 213, 79, 0.5)',
  },
  java: {
    primary: '#BE185D',
    primaryLight: '#EC4899',
    bg: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
    bgHover: 'linear-gradient(135deg, #FBEDF5 0%, #F9D5E8 100%)',
    border: 'rgba(244, 114, 182, 0.4)',
    stitch: 'rgba(244, 114, 182, 0.45)',
  },
  javascript: {
    primary: '#2E7D32',
    primaryLight: '#81C784',
    bg: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
    bgHover: 'linear-gradient(135deg, #DCF1DD 0%, #B9DEB9 100%)',
    border: 'rgba(129, 199, 132, 0.5)',
    stitch: 'rgba(129, 199, 132, 0.5)',
  },
  'python-practical': {
    primary: '#424242',
    primaryLight: '#9E9E9E',
    bg: 'linear-gradient(135deg, #F5F5F5 0%, #E0E0E0 100%)',
    bgHover: 'linear-gradient(135deg, #EEEEEE 0%, #D6D6D6 100%)',
    border: 'rgba(158, 158, 158, 0.5)',
    stitch: 'rgba(117, 117, 117, 0.5)',
  },
};

const DEFAULT_THEME = {
  primary: '#616161',
  primaryLight: '#9E9E9E',
  bg: 'linear-gradient(135deg, #FAFAFA 0%, #EEEEEE 100%)',
  bgHover: 'linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%)',
  border: 'rgba(158, 158, 158, 0.4)',
  stitch: 'rgba(158, 158, 158, 0.45)',
};

interface LessonCardProps {
  lesson: Lesson;
  progress?: UserProgress;
  languageId: string;
  chapterId: string;
}

export function LessonCard({ lesson, progress, languageId, chapterId }: LessonCardProps) {
  const navigate = useNavigate();
  const theme = LANGUAGE_THEMES[languageId] || DEFAULT_THEME;

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

  // 스티치 색상 결정 (언어별 + 상태별)
  const stitchColor = isCompleted
    ? 'rgba(16, 185, 129, 0.5)'   // 민트 그린 (완료)
    : isInProgress
      ? `${theme.stitch.replace('0.45', '0.6')}`  // 언어 색상 (진행중, 강조)
      : theme.stitch;  // 언어 색상 (기본)

  return (
    <button
      onClick={handleClick}
      className="group relative rounded-xl text-left transition-all duration-300 hover:scale-[1.02]"
      style={{
        padding: '32px',
        minHeight: '280px',
        background: isCompleted
          ? 'linear-gradient(135deg, #B8E8D4 0%, #9AD8BE 100%)'  // 연한 민트 (완료)
          : theme.bg,
        border: isCompleted
          ? '2px solid rgba(16, 185, 129, 0.5)'
          : isInProgress
            ? `2px solid ${theme.border.replace('0.4', '0.6')}`
            : `2px solid ${theme.border}`,
        boxShadow: isCompleted
          ? '0 10px 25px -5px rgba(16, 185, 129, 0.15)'
          : isInProgress
            ? `0 10px 25px -5px ${theme.border.replace('0.4', '0.2')}`
            : undefined,
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
          <PlayCircle className="w-6 h-6 animate-pulse" style={{ color: theme.primaryLight }} />
        ) : (
          <div
            className="w-6 h-6 rounded-full border-2 transition-colors"
            style={{ borderColor: theme.border.replace('0.4', '0.5') }}
          />
        )}
      </div>

      {/* 레슨 번호 뱃지 */}
      {lesson.order !== undefined && (
        <div
          className="inline-flex items-center justify-center w-10 h-10 rounded-lg font-mono text-sm font-bold"
          style={{
            marginBottom: '12px',
            backgroundColor: isCompleted
              ? 'rgba(16, 185, 129, 0.15)'
              : `${theme.primary}15`,
            color: isCompleted
              ? '#059669'
              : theme.primary,
            border: isCompleted
              ? '1px solid rgba(16, 185, 129, 0.3)'
              : `1px solid ${theme.border}`
          }}
        >
          {lesson.order}
        </div>
      )}

      {/* 레슨 제목 */}
      <h3
        className="text-lg font-bold line-clamp-2 transition-colors"
        style={{
          marginBottom: '12px',
          color: isCompleted
            ? '#059669'
            : isInProgress
              ? theme.primary
              : '#4A4A4A',
        }}
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
        <div className="flex items-center gap-1.5 text-gray-400 text-xs">
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
