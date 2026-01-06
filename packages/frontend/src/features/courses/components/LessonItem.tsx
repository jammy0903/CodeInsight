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
    <button onClick={handleClick} className={`lesson-item ${isCompleted ? 'completed' : isInProgress ? 'in-progress' : ''}`}>
      {/* 상태 indicator */}
      <span className={`lesson-status ${isCompleted ? 'done' : isInProgress ? 'active' : ''}`} />

      {/* 레슨 정보 */}
      <span className={`lesson-title ${isCompleted ? 'done' : ''}`}>
        {lesson.title}
      </span>

      {/* 난이도 뱃지 */}
      <span className={`lesson-difficulty ${lesson.difficulty}`}>
        {getDifficultyText()}
      </span>
    </button>
  );
}
