import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MainLayout } from './MainLayout';
import { initializeAuthListener } from '@/services/firebase';
import { useTheme } from '@/hooks/useTheme';

function AuthProvider({ children }: { children: ReactNode }) {
  // 초기 테마/인증 구독은 앱 루트에서 1회 설정한다.
  useTheme();

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, []);

  return <>{children}</>;
}

export function RootLayout() {
  return (
    <AuthProvider>
      <MainLayout>
        <Outlet />
      </MainLayout>
    </AuthProvider>
  );
}
