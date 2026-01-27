import { useEffect, type RefObject } from 'react';

interface UseEnterKeyOptions {
  onEnter: () => void;
  enabled?: boolean;
  targetRef?: RefObject<HTMLElement>;
}

export function useEnterKey({ onEnter, enabled = true, targetRef }: UseEnterKeyOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const targetElement = targetRef?.current || window;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Type guard for KeyboardEvent
      if (!('key' in e)) return;

      // Ignore if typing in an input/textarea
      const activeElement = document.activeElement;
      const activeTag = activeElement?.tagName;
      if (
        activeTag === 'INPUT' ||
        activeTag === 'TEXTAREA' ||
        (activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }
      
      // Ignore if modifier keys are pressed
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault(); // Prevent default action (e.g., form submission)
        onEnter();
      }
    };

    targetElement.addEventListener('keydown', handleKeyDown);

    // Cleanup the event listener when the component unmounts
    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [onEnter, enabled, targetRef]); // Rerun the effect only if onEnter or enabled changes
}
