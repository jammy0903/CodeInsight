/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter, redirect } from 'react-router-dom';
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
      {
        path: 'courses',
        element: <CoursesPage />,
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
        loader: async ({ params }) => {
          const lessonId = params.lessonId;
          if (!lessonId) return null;
          throw redirect(`/courses/${lessonId}`);
        },
      },
      {
        path: 'courses/c',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="c" />;
          return { Component };
        }
      },
      {
        path: 'courses/cpp',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="cpp" />;
          return { Component };
        }
      },
      {
        path: 'courses/java',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="java" />;
          return { Component };
        }
      },
      {
        path: 'courses/python',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="python" />;
          return { Component };
        }
      },
      {
        path: 'courses/javascript',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="javascript" />;
          return { Component };
        }
      },
      {
        path: 'courses/python-practical',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="python-practical" />;
          return { Component };
        }
      },
      {
        path: 'courses/ai-literacy',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          const Component = () => <LanguageCoursePage langOverride="ai-literacy" />;
          return { Component };
        }
      },
      {
        path: 'courses/:lessonId',
        lazy: async () => {
          const { LessonPage } = await import('./features/courses/LessonPage');
          return { Component: LessonPage };
        }
      },
      {
        path: 'courses/:lang',
        lazy: async () => {
          const { LanguageCoursePage } = await import('./features/courses/LanguageCoursePage');
          return { Component: LanguageCoursePage };
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
