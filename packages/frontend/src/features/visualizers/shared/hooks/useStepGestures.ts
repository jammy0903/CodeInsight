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

import { useEffect, useCallback, useRef } from 'react';

export interface UseStepGesturesOptions {
  onPrev: () => void;
  onNext: () => void;
  enabled?: boolean;
  isModalOpen?: boolean;
  canGoPrev?: boolean;
  canGoNext?: boolean;
}

export interface UseStepGesturesReturn {
  handleTapArea: (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => void;
}

export function useStepGestures(options: UseStepGesturesOptions): UseStepGesturesReturn {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options; // 렌더링 이후 최신 props를 ref에 반영
  }, [options]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 이벤트 발생 시, 항상 ref에 저장된 최신 props를 읽어옴
      const {
        enabled = true,
        isModalOpen = false,
        onPrev,
        onNext,
        canGoPrev = true,
        canGoNext = true,
      } = optionsRef.current;

      // input, textarea에 포커스가 있으면 무시
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

      // contenteditable 요소면 무시
      if ((document.activeElement as HTMLElement)?.isContentEditable) return;

      // 수정 키와 함께 누르면 무시 (Ctrl+←는 단어 이동 등)
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;

      // 이전 스텝 (←): 퀴즈 팝업에서도 항상 허용 (이전으로 돌아가기)
      if (e.key === 'ArrowLeft' && canGoPrev) {
        e.preventDefault();
        onPrev();
        return;
      }

      // 다음 스텝 (→): enabled 상태이고 모달이 없을 때만
      if (!enabled || isModalOpen) return;

      if (e.key === 'ArrowRight' && canGoNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // 마운트/언마운트 시에만 리스너를 등록/해제

  const handleTapArea = useCallback(
    (e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
      // 탭 핸들러도 최신 props를 사용하도록 ref를 참조
      const {
        enabled = true,
        isModalOpen = false,
        onPrev,
        onNext,
        canGoPrev = true,
        canGoNext = true,
      } = optionsRef.current;

      if (!enabled || isModalOpen) return;

      const target = e.target as HTMLElement;
      if (target.closest('button, a, input, textarea, [role="button"]')) return;

      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      const rect = e.currentTarget.getBoundingClientRect();
      let clientX: number;

      if ('touches' in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
      } else {
        clientX = e.clientX;
      }

      const isLeftHalf = clientX - rect.left < rect.width / 2;

      if (isLeftHalf && canGoPrev) {
        onPrev();
      } else if (!isLeftHalf && canGoNext) {
        onNext();
      }
    },
    [] // 의존성 배열이 비어있어도, optionsRef를 통해 항상 최신 값에 접근 가능
  );

  return { handleTapArea };
}
