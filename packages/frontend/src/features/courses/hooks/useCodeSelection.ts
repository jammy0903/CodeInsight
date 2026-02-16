/**
 * useCodeSelection Hook
 * 코드 텍스트 선택 상태 관리
 */

import { useState, useCallback } from 'react';
import type { CodeSelection } from '../types';

export function useCodeSelection() {
  const [selection, setSelection] = useState<CodeSelection | null>(null);

  /**
   * 선택 변경 핸들러 (빈 텍스트 필터링)
   */
  const handleSelectionChange = useCallback((newSelection: CodeSelection) => {
    if (!newSelection.text.trim()) {
      setSelection(null);
      return;
    }
    setSelection(newSelection);
  }, []);

  /**
   * 선택 초기화
   */
  const clearSelection = useCallback(() => {
    setSelection(null);
  }, []);

  return {
    selection,
    setSelection: handleSelectionChange,
    clearSelection,
  };
}
