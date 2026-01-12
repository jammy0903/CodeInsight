/**
 * useEnterKey - Enter 키 제출 유틸리티 훅
 *
 * 퀴즈, 폼, 모달 등에서 Enter 키로 제출할 때 사용
 *
 * @example
 * useEnterKey({
 *   onEnter: () => handleSubmit(),
 *   enabled: selected !== null && !submitted,
 * });
 */

import { useEffect } from 'react';

interface UseEnterKeyOptions {
  /** Enter 키 눌렀을 때 실행할 콜백 */
  onEnter: () => void;
  /** 활성화 여부 (false면 Enter 키 무시) */
  enabled?: boolean;
  /** Shift+Enter 허용 여부 (기본: false = Shift+Enter 무시) */
  allowShift?: boolean;
  /** Ctrl/Cmd+Enter만 허용 (기본: false) */
  requireModifier?: boolean;
}

export function useEnterKey({
  onEnter,
  enabled = true,
  allowShift = false,
  requireModifier = false,
}: UseEnterKeyOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;

      // Shift+Enter 체크
      if (!allowShift && e.shiftKey) return;

      // Ctrl/Cmd+Enter 필수 체크
      if (requireModifier && !e.ctrlKey && !e.metaKey) return;

      // textarea나 contenteditable에서는 기본 동작 유지
      const target = e.target as HTMLElement;
      const isTextArea = target.tagName === 'TEXTAREA';
      const isContentEditable = target.isContentEditable;

      if (isTextArea || isContentEditable) {
        // textarea에서는 Ctrl/Cmd+Enter로만 제출
        if (!e.ctrlKey && !e.metaKey) return;
      }

      e.preventDefault();
      onEnter();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onEnter, enabled, allowShift, requireModifier]);
}
