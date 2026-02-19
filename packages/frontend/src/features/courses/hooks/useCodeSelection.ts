/**
 * useCodeSelection Hook
 * 코드 텍스트 선택 핸들러
 */

import { useCallback } from 'react';
import type { CodeSelection } from '../types';

export function useCodeSelection() {
  const handleSelectionChange = useCallback((newSelection: CodeSelection) => {
    if (!newSelection.text.trim()) return;
    // selection 데이터 수집 포인트 (현재 소비자 없음)
  }, []);

  return {
    setSelection: handleSelectionChange,
  };
}
