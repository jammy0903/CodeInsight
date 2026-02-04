/**
 * EventBus - 중앙 이벤트 허브
 *
 * 실행 엔진이 이벤트를 발행하면, 구독 중인 모듈들이 수신한다.
 * Plain class — React 반응성이 필요 없는 imperative pub/sub 시스템.
 *
 * 규칙:
 * - 모듈은 EventBus를 통해서만 이벤트를 수신한다
 * - 모듈 간 직접 참조 금지
 * - 언어 변경 시 개별 unsubscribe 호출 (clearAll은 최후 수단)
 */

import type { SimulatorEvent, SimulatorEventType } from './types';

type EventHandler = (event: SimulatorEvent) => void;

class EventBusImpl {
  private subscribers = new Map<SimulatorEventType, Set<EventHandler>>();
  private wildcardSubscribers = new Set<EventHandler>();

  /**
   * 특정 이벤트 타입 구독
   * @returns unsubscribe 함수
   */
  subscribe(eventType: SimulatorEventType, handler: EventHandler): () => void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType)!.add(handler);

    return () => {
      this.subscribers.get(eventType)?.delete(handler);
    };
  }

  /**
   * 모든 이벤트 구독 (디버깅, 로깅용)
   * @returns unsubscribe 함수
   */
  subscribeAll(handler: EventHandler): () => void {
    this.wildcardSubscribers.add(handler);

    return () => {
      this.wildcardSubscribers.delete(handler);
    };
  }

  /** 단일 이벤트 발행 */
  emit(event: SimulatorEvent): void {
    // 타입별 구독자 — snapshot으로 순회 (순회 중 mutation 방지)
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      const snapshot = Array.from(handlers);
      for (const handler of snapshot) {
        try {
          handler(event);
        } catch (err) {
          console.error(`[EventBus] Handler error for "${event.type}":`, err);
        }
      }
    }

    // 와일드카드 구독자
    const wildcardSnapshot = Array.from(this.wildcardSubscribers);
    for (const handler of wildcardSnapshot) {
      try {
        handler(event);
      } catch (err) {
        console.error('[EventBus] Wildcard handler error:', err);
      }
    }
  }

  /** 이벤트 배열 일괄 발행 */
  emitBatch(events: SimulatorEvent[]): void {
    for (const event of events) {
      this.emit(event);
    }
  }

  /** 모든 구독 해제 (최후 수단 — 개별 unsubscribe 우선) */
  clearAll(): void {
    this.subscribers.clear();
    this.wildcardSubscribers.clear();
  }

  /** 현재 구독자 수 (디버깅용) */
  getSubscriberCount(): number {
    let count = this.wildcardSubscribers.size;
    for (const handlers of this.subscribers.values()) {
      count += handlers.size;
    }
    return count;
  }
}

/** 싱글턴 EventBus 인스턴스 */
export const eventBus = new EventBusImpl();
