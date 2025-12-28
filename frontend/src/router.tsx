/**
 * Router Configuration
 * CodeInsight - 코드 원리 학습 앱
 */

import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { MainLayout } from './layouts';
import { Chat } from './features';
import { CoursesPage, DayPage } from './features/courses';
import { useStore } from './stores/store';
import { onAuthChange } from './services/firebase';
import { useTheme } from './hooks/useTheme';

/**
 * 인증 상태 초기화 컴포넌트
 */
function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setAuthLoading } = useStore();

  // 테마 초기화
  useTheme();

  // 인증 상태 감시
  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setAuthLoading]);

  return <>{children}</>;
}

/**
 * 메인 레이아웃 래퍼
 */
function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AuthProvider>
  );
}

/**
 * 임시 홈 페이지
 */
function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-display mb-4">CodeInsight</h1>
      <p className="text-muted-foreground">코드 실행 원리 학습 플랫폼</p>
    </div>
  );
}

/**
 * 라우터 설정
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'simulator', element: <HomePage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:lang', element: <CoursesPage /> },
      { path: 'courses/:lang/:day', element: <DayPage /> },
      { path: 'chat', element: <Chat /> },
    ],
  },
]);
