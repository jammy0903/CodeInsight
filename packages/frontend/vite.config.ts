import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // Monorepo 환경에서 로컬 패키지를 강제로 pre-bundle
    include: ['@codeinsight/shared'],
  },
  build: {
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        dead_code: true,
        conditionals: true,
        evaluate: true,
      },
      mangle: {
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
  },
  server: {
    port: 5174,
    strictPort: true, // 포트가 사용 중이면 에러 발생 (다른 포트로 자동 변경 방지)
    headers: {
      // 개발 모드에서 CSP 완화 (로컬 백엔드 + 외부 API 허용)
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net data:; img-src 'self' data: blob: https:; connect-src 'self' http://localhost:* https: wss: ws:",
    },
  },
});
