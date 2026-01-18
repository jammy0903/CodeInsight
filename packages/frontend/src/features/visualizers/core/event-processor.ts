/**
 * Event Processor
 *
 * VisualizationEvent 배열을 순서대로 적용하여
 * VisualizationState를 구축하는 프로세서
 *
 * 설계 원칙:
 * 1. 이벤트는 immutable하게 처리 (상태 변경 시 새 객체 생성)
 * 2. 각 이벤트 타입별 핸들러 분리
 * 3. 에러 발생 시 이전 상태 유지 (graceful degradation)
 */

import type {
  VisualizationEvent,
  FrameEvent,
  VariableEvent,
  PointerEvent,
  HeapEvent,
  OutputEvent,
  WarningEvent,
  HighlightEvent,
  VisualizationValue,
} from '@codeinsight/shared';

// ============================================
// 프론트엔드용 상태 타입
// ============================================

export interface ProcessedVariable {
  name: string;
  fullName: string; // "frame.name" 형식
  address: string;
  type: string;
  value: VisualizationValue;
  size: number;
  pointsTo?: string;
  isArray?: boolean;
  arraySize?: number;
  elementType?: string;
  highlight?: 'changed' | 'accessed' | 'error' | 'focus';
}

export interface ProcessedFrame {
  name: string;
  variables: Map<string, ProcessedVariable>;
}

export interface ProcessedHeapBlock {
  address: string;
  name: string;
  type: string;
  size: number;
  value: VisualizationValue;
  highlight?: 'changed' | 'accessed' | 'error' | 'focus';
}

export interface ProcessedState {
  frames: ProcessedFrame[];
  heap: ProcessedHeapBlock[];
  output: string;
  warnings: WarningEvent[];
  pointerConnections: Array<{
    from: string; // "frame.varName" or address
    to: string; // target address
    targetFrame?: string;
  }>;
}

// ============================================
// Event Processor Class
// ============================================

export class EventProcessor {
  private state: ProcessedState;

  constructor() {
    this.state = this.createEmptyState();
  }

  /**
   * 빈 상태 생성
   */
  private createEmptyState(): ProcessedState {
    return {
      frames: [],
      heap: [],
      output: '',
      warnings: [],
      pointerConnections: [],
    };
  }

  /**
   * 상태 초기화
   */
  reset(): void {
    this.state = this.createEmptyState();
  }

  /**
   * 이벤트 배열 적용 (0부터 upToIndex까지)
   */
  applyEventsUpTo(
    allStepEvents: VisualizationEvent[][],
    upToStepIndex: number
  ): ProcessedState {
    this.reset();

    for (let i = 0; i <= upToStepIndex && i < allStepEvents.length; i++) {
      const events = allStepEvents[i];
      if (!events) continue;

      // 현재 스텝의 이벤트 적용
      for (const event of events) {
        this.applyEvent(event, i === upToStepIndex);
      }
    }

    return this.getState();
  }

  /**
   * 단일 이벤트 적용
   * @param isCurrentStep 현재 스텝인지 (하이라이트용)
   */
  applyEvent(event: VisualizationEvent, isCurrentStep = false): void {
    switch (event.type) {
      case 'frame':
        this.handleFrameEvent(event);
        break;
      case 'variable':
        this.handleVariableEvent(event, isCurrentStep);
        break;
      case 'pointer':
        this.handlePointerEvent(event);
        break;
      case 'heap':
        this.handleHeapEvent(event, isCurrentStep);
        break;
      case 'output':
        this.handleOutputEvent(event);
        break;
      case 'warning':
        this.handleWarningEvent(event);
        break;
      case 'highlight':
        this.handleHighlightEvent(event);
        break;
    }
  }

  /**
   * 현재 상태 반환
   */
  getState(): ProcessedState {
    return { ...this.state };
  }

  // ============================================
  // 이벤트 핸들러
  // ============================================

  private handleFrameEvent(event: FrameEvent): void {
    if (event.action === 'push') {
      // 새 프레임 추가
      this.state.frames.push({
        name: event.name,
        variables: new Map(),
      });
    } else if (event.action === 'pop') {
      // 프레임 제거 (해당 이름의 프레임 찾아서 제거)
      const index = this.state.frames.findIndex((f) => f.name === event.name);
      if (index !== -1) {
        // 프레임 제거 전 해당 프레임의 포인터 연결 정리
        const frameName = event.name;
        this.state.pointerConnections = this.state.pointerConnections.filter(
          (conn) => !conn.from.startsWith(`${frameName}.`)
        );
        this.state.frames.splice(index, 1);
      }
    }
  }

  private handleVariableEvent(event: VariableEvent, isCurrentStep: boolean): void {
    const frame = this.state.frames.find((f) => f.name === event.frame);
    if (!frame && event.action !== 'destroy') {
      // 프레임이 없으면 자동 생성 (하위 호환성)
      this.state.frames.push({
        name: event.frame,
        variables: new Map(),
      });
    }

    const targetFrame = this.state.frames.find((f) => f.name === event.frame);
    if (!targetFrame) return;

    if (event.action === 'declare') {
      // 새 변수 선언
      const variable: ProcessedVariable = {
        name: event.name,
        fullName: `${event.frame}.${event.name}`,
        address: event.address || '0x0',
        type: event.varType || 'unknown',
        value: event.value ?? 0,
        size: event.size || 4,
        isArray: event.isArray,
        arraySize: event.arraySize,
        elementType: event.elementType,
        highlight: isCurrentStep ? 'changed' : undefined,
      };
      targetFrame.variables.set(event.name, variable);
    } else if (event.action === 'assign') {
      // 값 변경
      const existing = targetFrame.variables.get(event.name);
      if (existing) {
        existing.value = event.value ?? existing.value;
        existing.highlight = isCurrentStep ? 'changed' : undefined;
      }
    } else if (event.action === 'destroy') {
      // 변수 제거
      targetFrame.variables.delete(event.name);
      // 포인터 연결 정리
      const fullName = `${event.frame}.${event.name}`;
      this.state.pointerConnections = this.state.pointerConnections.filter(
        (conn) => conn.from !== fullName
      );
    }
  }

  private handlePointerEvent(event: PointerEvent): void {
    if (event.action === 'assign') {
      // 기존 연결 제거
      this.state.pointerConnections = this.state.pointerConnections.filter(
        (conn) => conn.from !== event.pointer
      );

      // 새 연결 추가
      this.state.pointerConnections.push({
        from: event.pointer,
        to: event.targetAddress,
        targetFrame: event.targetFrame,
      });

      // 변수의 pointsTo 업데이트
      const [frameName, varName] = event.pointer.split('.');
      const frame = this.state.frames.find((f) => f.name === frameName);
      if (frame) {
        const variable = frame.variables.get(varName);
        if (variable) {
          variable.pointsTo = event.targetAddress;
        }
      }
    } else if (event.action === 'deref_write') {
      // 역참조 쓰기 - 타겟 변수 값 업데이트
      if (event.targetFrame && event.targetName && event.value !== undefined) {
        const frame = this.state.frames.find((f) => f.name === event.targetFrame);
        if (frame) {
          const variable = frame.variables.get(event.targetName);
          if (variable) {
            variable.value = event.value;
            variable.highlight = 'changed';
          }
        }
      }
    }
    // deref_read는 시각화에 영향 없음 (읽기만)
  }

  private handleHeapEvent(event: HeapEvent, isCurrentStep: boolean): void {
    if (event.action === 'allocate') {
      // 새 힙 블록 할당
      this.state.heap.push({
        address: event.address,
        name: event.name || `heap_${event.address}`,
        type: event.heapType || 'unknown',
        size: event.size || 0,
        value: event.value ?? 0,
        highlight: isCurrentStep ? 'changed' : undefined,
      });
    } else if (event.action === 'write') {
      // 힙 블록 값 변경
      const block = this.state.heap.find((h) => h.address === event.address);
      if (block) {
        block.value = event.value ?? block.value;
        block.highlight = isCurrentStep ? 'changed' : undefined;
      }
    } else if (event.action === 'free') {
      // 힙 블록 해제
      const index = this.state.heap.findIndex((h) => h.address === event.address);
      if (index !== -1) {
        // 포인터 연결 정리
        const address = event.address;
        this.state.pointerConnections = this.state.pointerConnections.filter(
          (conn) => conn.to !== address
        );
        this.state.heap.splice(index, 1);
      }
    }
    // read는 시각화에 영향 없음
  }

  private handleOutputEvent(event: OutputEvent): void {
    this.state.output += event.text;
  }

  private handleWarningEvent(event: WarningEvent): void {
    this.state.warnings.push(event);
  }

  private handleHighlightEvent(event: HighlightEvent): void {
    if (event.target === 'variable' && event.frame) {
      const frame = this.state.frames.find((f) => f.name === event.frame);
      if (frame) {
        const variable = frame.variables.get(event.name);
        if (variable) {
          variable.highlight = event.style;
        }
      }
    } else if (event.target === 'heap') {
      const block = this.state.heap.find((h) => h.name === event.name || h.address === event.name);
      if (block) {
        block.highlight = event.style;
      }
    }
    // frame, pointer 하이라이트는 별도 UI 처리 필요
  }
}

// ============================================
// 유틸리티: ProcessedState → LessonMemoryState 변환
// ============================================

import type { MemoryBlock } from '@/types';

/**
 * ProcessedState를 기존 LessonMemoryState 형식으로 변환
 * (기존 컴포넌트 호환성을 위해)
 */
export function convertToLessonMemoryState(state: ProcessedState): {
  stack: MemoryBlock[];
  heap: MemoryBlock[];
  frames: Array<{ name: string; variables: Array<{ name: string; value: unknown; type: string }> }>;
} {
  const stack: MemoryBlock[] = [];
  const frames: Array<{ name: string; variables: Array<{ name: string; value: unknown; type: string }> }> = [];

  // 프레임 순서대로 변수 수집
  for (const frame of state.frames) {
    const frameVars: Array<{ name: string; value: unknown; type: string }> = [];

    for (const [, variable] of frame.variables) {
      stack.push({
        name: variable.fullName,
        address: variable.address,
        value: String(variable.value),
        type: variable.type,
        points_to: variable.pointsTo || null,
        highlight: variable.highlight === 'changed',
      });

      frameVars.push({
        name: variable.name,
        value: variable.value,
        type: variable.type,
      });
    }

    frames.push({
      name: frame.name,
      variables: frameVars,
    });
  }

  // 힙 블록 변환
  const heap: MemoryBlock[] = state.heap.map((block) => ({
    name: `*${block.name}`,
    address: block.address,
    value: String(block.value),
    type: block.type,
    points_to: null,
    highlight: block.highlight === 'changed',
  }));

  return { stack, heap, frames };
}

// ============================================
// Singleton instance
// ============================================

export const eventProcessor = new EventProcessor();
