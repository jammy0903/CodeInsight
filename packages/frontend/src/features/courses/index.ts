/**
 * Courses Feature - Public Exports
 *
 * API 기반 코스 시스템 (Language → Chapter → Lesson)
 */

// Pages
export { CoursesPage } from './CoursesPage';
export { LanguageCoursePage } from './LanguageCoursePage';
export { ChapterLessonsPage } from './ChapterLessonsPage';
export { LessonPage } from './LessonPage';

// Hooks
export { useLessonNavigation } from './hooks/useLessonNavigation';
export { useLessonVisualization } from './hooks/useLessonVisualization';
export { useCodeSelection } from './hooks/useCodeSelection';

// Components
export { LessonCodeEditor } from './components/day/LessonCodeEditor'; // Monaco 기반 읽기 전용 에디터
export { StepExplanation } from './components/day/StepExplanation';
