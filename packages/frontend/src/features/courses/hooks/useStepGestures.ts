/**
 * useStepGestures - 스텝 네비게이션 제스처 감지 Hook
 *
 * 기능:
 * 1. 키보드 ← → 화살표로 스텝 이동
 * 2. 탭/클릭으로 스텝 이동 (좌측 반 = 이전, 우측 반 = 다음)
 *
 * 충돌 방지:
 * - input/textarea 포커스 시 키보드 비활성화
 * - 버튼/링크 클릭 시 탭 무시
 * - 텍스트 선택 중 탭 무시
 * - 모달 열림 시 비활성화
 */

import { useEffect, useCallback } from 'react';

export interface UseStepGesturesOptions {
  /** 이전 스텝으로 이동 */
  onPrev: () => void;
  /** 다음 스텝으로 이동 */
  onNext: () => void;
  /** 활성화 여부 (기본: true) */
  enabled?: boolean;
  /** 모달이 열려있는지 (열려있으면 비활성화) */
  isModalOpen?: boolean;
  /** 이전 스텝 가능 여부 */
  canGoPrev?: boolean;
  /** 다음 스텝 가능 여부 */
  canGoNext?: boolean;
}

export interface UseStepGesturesReturn {
  /** 탭/클릭 영역에 적용할 핸들러 */
  handleTapArea: (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void;
}

export function useStepGestures(options: UseStepGesturesOptions): UseStepGesturesReturn {
  const {
    onPrev,
    onNext,
    enabled = true,
    isModalOpen = false,
    canGoPrev = true,
    canGoNext = true,
  } = options;

  // 키보드 이벤트 리스너
  useEffect(() => {
    if (!enabled || isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // input, textarea에 포커스가 있으면 무시
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      // contenteditable 요소면 무시
      if ((document.activeElement as HTMLElement)?.isContentEditable) return;

      // 수정 키와 함께 누르면 무시 (Ctrl+←는 단어 이동 등)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isModalOpen, onPrev, onNext, canGoPrev, canGoNext]);

  // 탭/클릭 핸들러
  const handleTapArea = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      if (!enabled || isModalOpen) return;

      // 버튼, 링크, 인풋 클릭은 무시
      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"]')) return;

      // 텍스트 선택 중이면 무시
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      // 클릭/터치 좌표 계산
      const rect = e.currentTarget.getBoundingClientRect();
      let clientX: number;

      if ('touches' in e) {
        // TouchEvent
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
      } else {
        // MouseEvent
        clientX = e.clientX;
      }

      // 좌/우 반 판단
      const relativeX = clientX - rect.left;
      const isLeftHalf = relativeX < rect.width / 2;

      if (isLeftHalf && canGoPrev) {
        onPrev();
      } else if (!isLeftHalf && canGoNext) {
        onNext();
      }
    },
    [enabled, isModalOpen, onPrev, onNext, canGoPrev, canGoNext]
  );

  return { handleTapArea };
}
