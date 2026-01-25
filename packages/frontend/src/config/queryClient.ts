/**
 * TanStack Query 설정
 *
 * WHY: API 상태 관리 표준화
 * - isLoading, isError, isSuccess 자동 제공
 * - 캐싱, refetch, stale time 자동 처리
 * - DevTools로 디버깅 용이
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5분간 캐시 유지
      staleTime: 5 * 60 * 1000,
      // 에러 발생 시 자동 재시도 1회
      retry: 1,
      // 윈도우 포커스 시 자동 refetch 비활성화 (필요시 수동 refetch)
      refetchOnWindowFocus: false,
    },
  },
});
