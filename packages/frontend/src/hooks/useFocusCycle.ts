import { useEffect, RefObject } from 'react';

interface UseFocusCycleOptions {
  // 포커스를 관리할 요소들이 담긴 부모 컨테이너의 ref
  containerRef: RefObject<HTMLElement>;
  // 이 훅의 활성화 여부
  enabled?: boolean;
  // 포커스 이동을 위한 키 설정 (기본값: 모든 화살표 키)
  keyBindings?: {
    next: string[]; // 다음 요소로 가는 키
    prev: string[]; // 이전 요소로 가는 키
  };
}

// 포커스가 가능한 요소들을 찾는 쿼리 셀렉터
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');


export function useFocusCycle({
  containerRef,
  enabled = true,
  keyBindings = {
    next: ['ArrowRight', 'ArrowDown'],
    prev: ['ArrowLeft', 'ArrowUp'],
  },
}: UseFocusCycleOptions): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 지정된 키가 아니면 무시
      if (!keyBindings.next.includes(e.key) && !keyBindings.prev.includes(e.key)) {
        return;
      }

      // 화살표 키의 기본 동작(예: 페이지 스크롤) 방지
      e.preventDefault();

      // 컨테이너 내에서 포커스 가능한 모든 요소 찾기
      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (focusableElements.length === 0) return;

      const currentlyFocusedElement = document.activeElement as HTMLElement;
      const currentIndex = focusableElements.indexOf(currentlyFocusedElement);

      let nextIndex: number;

      if (keyBindings.next.includes(e.key)) {
        // '다음' 키를 눌렀을 때
        nextIndex = currentIndex + 1;
        if (nextIndex >= focusableElements.length) {
          nextIndex = 0; // 마지막 요소면 처음으로
        }
      } else { 
        // '이전' 키를 눌렀을 때
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = focusableElements.length - 1; // 첫 요소면 마지막으로
        }
      }

      // 다음 요소에 포커스
      focusableElements[nextIndex]?.focus();
    };

    // 컨테이너에 키보드 이벤트 리스너 추가
    container.addEventListener('keydown', handleKeyDown);

    // 컴포넌트가 사라질 때 리스너 제거
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, enabled, keyBindings]);
}
