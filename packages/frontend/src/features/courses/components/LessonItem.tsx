import { useNavigate } from 'react-router-dom';
import type { Lesson, UserProgress } from '@/types';

interface LessonItemProps {
  lesson: Lesson;
  progress?: UserProgress;
  languageId: string;
  onClick?: () => void;
}

export function LessonItem({ lesson, progress, languageId, onClick }: LessonItemProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // 새 라우팅 구조: /courses/:lang/:chapterId/:lessonId
      navigate(`/courses/${languageId}/${lesson.chapterId}/${lesson.id}`);
    }
  };

  // 진행 상태에 따른 아이콘
  const getStatusIcon = () => {
    if (!progress || progress.status === 'not_started') {
      return <span className="text-gray-400">⬜</span>;
    }
    if (progress.status === 'in_progress') {
      return <span className="text-blue-500">⏸️</span>;
    }
    return <span className="text-green-500">✅</span>;
  };

  // 난이도 배지 색상
  const getDifficultyColor = () => {
    switch (lesson.difficulty) {
      case 'basic':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 난이도 한글 텍스트
  const getDifficultyText = () => {
    switch (lesson.difficulty) {
      case 'basic':
        return '기초';
      case 'intermediate':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return '';
    }
  };

  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';

  return (
    <div
      onClick={handleClick}
      className={`
        flex items-center gap-3 p-4 rounded-lg border cursor-pointer
        transition-all duration-200
        ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
        ${isInProgress ? 'border-l-4 border-l-blue-500' : ''}
        hover:bg-gray-50 hover:shadow-md
      `}
    >
      {/* 상태 아이콘 */}
      <div className="flex-shrink-0 text-xl">{getStatusIcon()}</div>

      {/* 레슨 정보 */}
      <div className="flex-1 min-w-0">
        <h4
          className={`font-medium text-sm ${
            isCompleted ? 'text-gray-500 line-through' : 'text-gray-900'
          }`}
        >
          {lesson.title}
        </h4>
        {lesson.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{lesson.description}</p>
        )}
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* 난이도 배지 */}
        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor()}`}>
          {getDifficultyText()}
        </span>

        {/* 예상 시간 */}
        {lesson.estimatedTime && (
          <span className="text-xs text-gray-500">{lesson.estimatedTime}분</span>
        )}
      </div>
    </div>
  );
}
