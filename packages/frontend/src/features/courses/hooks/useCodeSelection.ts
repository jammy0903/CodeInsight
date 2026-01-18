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
    // DEBUG
    console.log('[useCodeSelection] 받은 선택:', newSelection);

    // 빈 텍스트 무시
    if (!newSelection.text.trim()) {
      console.log('[useCodeSelection] 빈 텍스트 → null');
      setSelection(null);
      return;
    }
    console.log('[useCodeSelection] 선택 설정됨:', newSelection);
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
