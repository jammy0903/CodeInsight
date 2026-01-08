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
  server: {
    port: 5174,
    strictPort: true, // 포트가 사용 중이면 에러 발생 (다른 포트로 자동 변경 방지)
  },
});
