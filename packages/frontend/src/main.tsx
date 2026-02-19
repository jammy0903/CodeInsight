console.log('🚀 main.tsx loading...');

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { router } from './router'
import { queryClient } from './config/queryClient'
import './index.css'

console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
import './i18n' // i18n 설정 파일 임포트
import { useStore } from './stores/store'
import { auth } from './services/firebase'
import { initializeAdMob } from './services/admob'

type DebugWindow = Window & {
  useStore?: typeof useStore;
  auth?: typeof auth;
};

// 개발 환경에서 디버깅용으로 window에 노출
if (import.meta.env.DEV) {
  const debugWindow = window as DebugWindow;
  debugWindow.useStore = useStore;
  debugWindow.auth = auth;
  // 환경변수 확인용 로그
  console.log('🔧 Environment:', {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    VITE_API_URL: import.meta.env.VITE_API_URL,
  });
}

// 초기 테마 설정 (localStorage에서 읽어서 HTML에 적용)
const initTheme = () => {
  try {
    const stored = localStorage.getItem('codeinsight-theme');
    // 기본 테마를 'soft'로 설정
    let theme = 'soft';

    if (stored) {
      const { state } = JSON.parse(stored);
      // 저장된 테마가 유효하면 그 값으로 변경
      if (state?.theme) {
        theme = state.theme;
      }
    }
    // 최종적으로 결정된 테마를 HTML에 적용
    document.documentElement.setAttribute('data-theme', theme);
  } catch (error) {
    // 파싱 오류 등 예외 발생 시에도 기본 'soft' 테마를 적용
    console.error('Failed to apply theme, falling back to default:', error);
    document.documentElement.setAttribute('data-theme', 'soft');
  }
};

initTheme();

// Initialize native platform features
if (Capacitor.isNativePlatform()) {
  // AdMob 초기화
  initializeAdMob().catch(console.error);

  // Android 뒤로가기 버튼 핸들러
  // 히스토리가 있으면 뒤로 가기, 없으면 앱 종료
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      // 홈 화면에서 뒤로가기 → 앱 최소화 (종료 대신)
      App.minimizeApp();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'inherit',
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>,
)
