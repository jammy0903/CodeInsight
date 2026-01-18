import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
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
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.theme) {
        document.documentElement.setAttribute('data-theme', state.theme);
      }
    }
  } catch (error) {
    console.error('Failed to load theme:', error);
  }
};

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
