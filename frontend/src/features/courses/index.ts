/**
 * Courses Feature - Public Exports
 */

// Pages
export { CoursesPage } from './CoursesPage';
export { DayPage } from './DayPage';

// Hooks
export { useCourseProgress } from './hooks/useCourseProgress';
export { useCourseMemory } from './hooks/useCourseMemory';
export { useDayNavigation } from './hooks/useDayNavigation';

// Components (for custom layouts)
export { LanguageTabs } from './components/LanguageTabs';
export { CourseHeader } from './components/CourseHeader';
export { DayGrid } from './components/DayGrid';
export { DayCard, getDayStatus } from './components/DayCard';
export type { DayStatus } from './components/DayCard';

// Day Components
export { DayHeader } from './components/day/DayHeader';
export { CodeViewer } from './components/day/CodeViewer';
export { StepExplanation } from './components/day/StepExplanation';
export { StepControls } from './components/day/StepControls';

// Memory Components
export { CourseMemoryView } from './components/memory/CourseMemoryView';

// Quiz Components
export { QuizCard } from './components/quiz/QuizCard';
export { QuizResult } from './components/quiz/QuizResult';
