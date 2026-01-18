/**
 * usePointerConnections Hook
 *
 * 포인터 변수와 타겟 변수 간의 연결 정보를 관리
 * - DOM 요소 위치 추적
 * - 화살표 렌더링에 필요한 좌표 계산
 * - ResizeObserver로 반응형 지원
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MemoryBlock } from '@/types';

// ============================================
// 타입 정의
// ============================================

export interface Position {
  x: number;
  y: number;
}

export interface PointerConnection {
  /** 연결 ID */
  id: string;
  /** 포인터 변수 이름 (예: "main.p") */
  pointerName: string;
  /** 타겟 주소 */
  targetAddress: string;
  /** 포인터 블록 위치 (오른쪽 중앙) */
  from: Position;
  /** 타겟 블록 위치 (왼쪽 중앙) */
  to: Position;
  /** 크로스 프레임 여부 */
  isCrossFrame: boolean;
  /** 현재 스텝에서 활성화됨 */
  isActive: boolean;
}

export interface UsePointerConnectionsResult {
  /** 계산된 연결 정보 배열 */
  connections: PointerConnection[];
  /** 컨테이너 ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** 컨테이너 크기 */
  containerSize: { width: number; height: number };
  /** 블록 요소 등록 함수 */
  registerBlock: (name: string, address: string, element: HTMLElement | null) => void;
}

// ============================================
// Hook 구현
// ============================================

/**
 * 포인터 연결 정보를 관리하는 Hook
 *
 * @param stack - 스택 메모리 블록 배열
 * @param heap - 힙 메모리 블록 배열
 * @param changedBlocks - 현재 스텝에서 변경된 블록 이름들
 */
export function usePointerConnections(
  stack: MemoryBlock[],
  heap: MemoryBlock[],
  changedBlocks: string[] = []
): UsePointerConnectionsResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementMapRef = useRef<Map<string, HTMLElement>>(new Map());
  const addressMapRef = useRef<Map<string, string>>(new Map()); // address → name 매핑

  const [connections, setConnections] = useState<PointerConnection[]>([]);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 블록 요소 등록
  const registerBlock = useCallback(
    (name: string, address: string, element: HTMLElement | null) => {
      if (element) {
        elementMapRef.current.set(name, element);
        addressMapRef.current.set(address, name);
      } else {
        elementMapRef.current.delete(name);
        // address 매핑은 다른 블록이 같은 주소를 가질 수 있으므로 삭제하지 않음
      }
    },
    []
  );

  // 연결 정보 계산
  const calculateConnections = useCallback(() => {
    if (!containerRef.current) return [];

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const allBlocks = [...stack, ...heap];
    const result: PointerConnection[] = [];

    // 포인터 블록 찾기 (points_to가 있는 블록)
    allBlocks.forEach((block) => {
      if (!block.points_to) return;

      const pointerName = block.name;
      const pointerElement = elementMapRef.current.get(pointerName);
      if (!pointerElement) return;

      // 타겟 블록 찾기 (주소로 검색)
      const targetName = addressMapRef.current.get(block.points_to);
      if (!targetName) return;

      const targetElement = elementMapRef.current.get(targetName);
      if (!targetElement) return;

      // 위치 계산
      const pointerRect = pointerElement.getBoundingClientRect();
      const targetRect = targetElement.getBoundingClientRect();

      // from: 포인터 블록의 오른쪽 중앙
      const from: Position = {
        x: pointerRect.right - containerRect.left,
        y: pointerRect.top - containerRect.top + pointerRect.height / 2,
      };

      // to: 타겟 블록의 왼쪽 중앙
      const to: Position = {
        x: targetRect.left - containerRect.left,
        y: targetRect.top - containerRect.top + targetRect.height / 2,
      };

      // 크로스 프레임 감지 (예: "swap.a" → "main.x")
      const pointerFrame = pointerName.includes('.')
        ? pointerName.split('.')[0]
        : 'global';
      const targetFrame = targetName.includes('.')
        ? targetName.split('.')[0]
        : 'global';
      const isCrossFrame = pointerFrame !== targetFrame;

      // 활성화 상태 (현재 스텝에서 변경됨)
      const isActive = changedBlocks.includes(pointerName);

      result.push({
        id: `${pointerName}->${block.points_to}`,
        pointerName,
        targetAddress: block.points_to,
        from,
        to,
        isCrossFrame,
        isActive,
      });
    });

    return result;
  }, [stack, heap, changedBlocks]);

  // 주소 매핑 업데이트
  useEffect(() => {
    const allBlocks = [...stack, ...heap];
    addressMapRef.current.clear();
    allBlocks.forEach((block) => {
      if (block.address) {
        addressMapRef.current.set(block.address, block.name);
      }
    });
  }, [stack, heap]);

  // 위치 업데이트 (ResizeObserver)
  useEffect(() => {
    if (!containerRef.current) return;

    const updateConnections = () => {
      const newConnections = calculateConnections();
      setConnections(newConnections);

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    // 초기 계산 (약간의 딜레이로 DOM 렌더링 대기)
    const timeoutId = setTimeout(updateConnections, 100);

    // ResizeObserver로 크기 변경 감지
    const observer = new ResizeObserver(() => {
      updateConnections();
    });

    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [calculateConnections]);

  // 블록 변경 시 재계산
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newConnections = calculateConnections();
      setConnections(newConnections);
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [stack, heap, changedBlocks, calculateConnections]);

  return {
    connections,
    containerRef,
    containerSize,
    registerBlock,
  };
}

export default usePointerConnections;
