/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './layouts/RootLayout';
import { HomePage } from './features/home';
import { AuthPage } from './features/auth';

import { PlaygroundPage } from './features/playground';
import { AdminPage, AdminRoute } from './features/admin';
import { QuizPage, OXQuizPage, MultipleChoiceQuizPage, FillBlankQuizPage, AlgorithmQuizPage } from './features/quiz';
import { ProfilePage } from './features/profile';
import { DashboardPage } from './features/dashboard';
import { ReportPage } from './features/report';
import { ProtectedRoute } from './components/ProtectedRoute';
import { CoursesPage } from './features/courses/CoursesPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * 라우터 설정
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <AuthPage /> },
      { path: 'signup', element: <AuthPage /> },
      {
        path: 'courses',
        element: <CoursesPage />,
      },
      {
        path: 'courses/:lang',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          return { Component: LanguageCoursePage };
        }
      },
      {
        path: 'courses/:lang/:chapterId',
        lazy: async () => {
          const { ChapterLessonsPage } = await import('./features/courses/ChapterLessonsPage');
          return { Component: ChapterLessonsPage };
        }
      },
      {
        path: 'courses/:lang/:chapterId/:lessonId',
        lazy: async () => {
          const { LessonPage } = await import('./features/courses/LessonPage');
          return { Component: LessonPage };
        }
      },
      { path: 'playground', element: <PlaygroundPage /> },
      { path: 'quiz', element: <ProtectedRoute><QuizPage /></ProtectedRoute> },
      { path: 'quiz/ox/:lang', element: <ProtectedRoute><OXQuizPage /></ProtectedRoute> },
      { path: 'quiz/multiple-choice/:lang', element: <ProtectedRoute><MultipleChoiceQuizPage /></ProtectedRoute> },
      { path: 'quiz/fill-blank/:lang', element: <ProtectedRoute><FillBlankQuizPage /></ProtectedRoute> },
      { path: 'quiz/algorithm/:lang', element: <ProtectedRoute><AlgorithmQuizPage /></ProtectedRoute> },
      { path: 'profile', element: <ProtectedRoute><ProfilePage /></ProtectedRoute> },
      { path: 'dashboard', element: <ProtectedRoute><DashboardPage /></ProtectedRoute> },
      { path: 'report', element: <ProtectedRoute><ReportPage /></ProtectedRoute> },
      { path: 'admin', element: <AdminRoute><AdminPage /></AdminRoute> },
      {
        path: 'privacy',
        lazy: async () => {
          const { PrivacyPolicyPage } = await import('./features/legal');
          return { Component: PrivacyPolicyPage };
        }
      },
      {
        path: 'terms',
        lazy: async () => {
          const { TermsPage } = await import('./features/legal');
          return { Component: TermsPage };
        }
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
