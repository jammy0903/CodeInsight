import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';

function ThemeProvider({ children }: { children: ReactNode }) {
  // 초기 테마 구독은 앱 루트에서 1회 설정한다.
  useTheme();
  return <>{children}</>;
}

export function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
