/**
 * useSlidingPages - 슬라이딩 페이지 공통 훅
 *
 * 2페이지 스와이프 네비게이션을 위한 재사용 가능한 훅
 * 사용처: PythonLessonView, MobileLessonView, 기타 슬라이딩 레이아웃
 */

import { useState, useCallback } from 'react';
import type { PanInfo } from 'framer-motion';

interface UseSlidingPagesOptions {
  /** 총 페이지 수 (기본값: 2) */
  totalPages?: number;
  /** 스와이프 감지 임계값 (픽셀, 기본값: 50) */
  threshold?: number;
  /** 초기 페이지 (기본값: 0) */
  initialPage?: number;
}

interface UseSlidingPagesReturn {
  /** 현재 페이지 인덱스 (0부터 시작) */
  currentPage: number;
  /** 페이지 직접 설정 */
  setCurrentPage: (page: number) => void;
  /** 다음 페이지로 이동 */
  goToNextPage: () => void;
  /** 이전 페이지로 이동 */
  goToPrevPage: () => void;
  /** framer-motion onDragEnd 핸들러 */
  handleDragEnd: (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  /** framer-motion animate x값 (예: 0 또는 '-50%') */
  animateX: number | string;
  /** 첫 페이지인지 */
  isFirstPage: boolean;
  /** 마지막 페이지인지 */
  isLastPage: boolean;
}

export function useSlidingPages(options: UseSlidingPagesOptions = {}): UseSlidingPagesReturn {
  const {
    totalPages = 2,
    threshold = 50,
    initialPage = 0,
  } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // 왼쪽으로 스와이프 (다음 페이지)
      if (info.offset.x < -threshold && currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
      }
      // 오른쪽으로 스와이프 (이전 페이지)
      else if (info.offset.x > threshold && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      }
    },
    [currentPage, totalPages, threshold]
  );

  // 2페이지 기준: 0 → 0 (number), 1 → '-50%' (string)
  // 컨테이너가 width: 200%이므로 각 페이지는 50%씩 차지
  // framer-motion은 페이지 0일 때 숫자 0을 기대
  const animateX: number | string = currentPage === 0 ? 0 : `-${(currentPage / totalPages) * 100}%`;

  return {
    currentPage,
    setCurrentPage,
    goToNextPage,
    goToPrevPage,
    handleDragEnd,
    animateX,
    isFirstPage: currentPage === 0,
    isLastPage: currentPage === totalPages - 1,
  };
}
