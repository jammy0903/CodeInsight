import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'
import { queryClient } from './config/queryClient'
import './index.css'
import { useStore } from './stores/store'
import { auth } from './services/firebase'

// 개발 환경에서 디버깅용으로 window에 노출
if (import.meta.env.DEV) {
  (window as any).useStore = useStore;
  (window as any).auth = auth;
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
