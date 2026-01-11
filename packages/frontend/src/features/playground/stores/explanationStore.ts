/**
 * Explanation Prefetch Store
 * 모든 스텝의 AI 설명을 미리 가져오는 큐 시스템
 *
 * 동작 방식:
 * 1. startPrefetch(steps, fullCode) 호출 → 큐에 모든 스텝 추가
 * 2. 순차적으로 스트리밍 요청 (하나씩)
 * 3. 완료된 설명은 캐시에 저장
 * 4. UI는 캐시에서 즉시 표시하거나 스트리밍 상태 표시
 */

import { create } from 'zustand';
import { getStepExplanationStream } from '@/services/ai';
import type { LessonStep } from '@/types';

// 캐시 키 생성
function getCacheKey(line: number, code: string): string {
  return `${line}:${code}`;
}

// fullCode에서 특정 라인의 코드 추출
function getCodeAtLine(fullCode: string, line: number): string {
  const lines = fullCode.split('\n');
  return lines[line - 1] || '';  // line은 1-based
}

// 큐 아이템
interface QueueItem {
  step: LessonStep;
  fullCode: string;
  cacheKey: string;
}

// 스토어 상태
interface ExplanationState {
  // 캐시: cacheKey → 완료된 설명
  cache: Map<string, string>;

  // 현재 스트리밍 중인 설명 (실시간 업데이트)
  streamingKey: string | null;
  streamingContent: string;

  // 큐 상태
  queue: QueueItem[];
  isProcessing: boolean;

  // 액션
  startPrefetch: (steps: LessonStep[], fullCode: string) => void;
  stopPrefetch: () => void;
  getExplanation: (line: number, code: string) => string | null;
  isStreaming: (line: number, code: string) => boolean;
  getStreamingContent: (line: number, code: string) => string | null;
}

export const useExplanationStore = create<ExplanationState>((set, get) => {
  // 내부 상태
  let abortController: AbortController | null = null;

  // 큐 처리 함수
  const processQueue = async () => {
    const state = get();
    if (state.queue.length === 0 || !state.isProcessing) {
      set({ isProcessing: false, streamingKey: null, streamingContent: '' });
      return;
    }

    const [current, ...rest] = state.queue;
    set({ queue: rest, streamingKey: current.cacheKey, streamingContent: '' });

    try {
      const codeAtLine = getCodeAtLine(current.fullCode, current.step.line);
      const result = await getStepExplanationStream(
        {
          line: current.step.line,
          code: codeAtLine,
          fullCode: current.fullCode,
          stack: current.step.stack?.map(v => ({
            name: v.name,
            type: v.type || '',
            value: v.value,
            address: v.address,
          })) || [],
          heap: current.step.heap?.map(v => ({
            name: v.name,
            type: v.type || '',
            value: v.value,
            address: v.address,
          })) || [],
          changes: [],  // LessonStep doesn't have changes field anymore
        },
        // 스트리밍 청크 콜백
        (chunk) => {
          set((s) => ({
            streamingContent: s.streamingContent + chunk,
          }));
        }
      );

      // 완료된 설명 캐시에 저장 (SKIP이면 빈 문자열로)
      const finalResult = result.trim().toUpperCase() === 'SKIP' ? '' : result;
      set((s) => {
        const newCache = new Map(s.cache);
        newCache.set(current.cacheKey, finalResult);
        return { cache: newCache };
      });
    } catch {
      // 에러 시 기본 설명 사용
      set((s) => {
        const newCache = new Map(s.cache);
        newCache.set(current.cacheKey, current.step.explanation || '설명을 불러올 수 없습니다.');
        return { cache: newCache };
      });
    }

    // 다음 아이템 처리
    const nextState = get();
    if (nextState.isProcessing && nextState.queue.length > 0) {
      // 약간의 딜레이로 Ollama 과부하 방지
      setTimeout(() => processQueue(), 100);
    } else {
      set({ isProcessing: false, streamingKey: null, streamingContent: '' });
    }
  };

  return {
    cache: new Map(),
    streamingKey: null,
    streamingContent: '',
    queue: [],
    isProcessing: false,

    startPrefetch: (steps, fullCode) => {
      // 기존 처리 중지
      if (abortController) {
        abortController.abort();
      }
      abortController = new AbortController();

      // 캐시 초기화 및 큐 생성
      const newQueue: QueueItem[] = steps.map((step) => ({
        step,
        fullCode,
        cacheKey: getCacheKey(step.line, getCodeAtLine(fullCode, step.line)),
      }));

      set({
        cache: new Map(),
        queue: newQueue,
        isProcessing: true,
        streamingKey: null,
        streamingContent: '',
      });

      // 큐 처리 시작
      processQueue();
    },

    stopPrefetch: () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
      set({
        queue: [],
        isProcessing: false,
        streamingKey: null,
        streamingContent: '',
      });
    },

    getExplanation: (line, code) => {
      const key = getCacheKey(line, code);
      return get().cache.get(key) || null;
    },

    isStreaming: (line, code) => {
      const key = getCacheKey(line, code);
      return get().streamingKey === key;
    },

    getStreamingContent: (line, code) => {
      const key = getCacheKey(line, code);
      const state = get();
      if (state.streamingKey === key) {
        return state.streamingContent;
      }
      return null;
    },
  };
});

// 셀렉터 - 실제 상태 값을 직접 구독해야 리렌더 발생
export const useExplanation = (line: number, code: string) => {
  const key = getCacheKey(line, code);

  // 각 상태를 개별적으로 구독 (값이 바뀌면 리렌더)
  const streamingKey = useExplanationStore((s) => s.streamingKey);
  const streamingContent = useExplanationStore((s) => s.streamingContent);
  const cache = useExplanationStore((s) => s.cache);

  const isCurrentStreaming = streamingKey === key;

  return {
    explanation: cache.get(key) || null,
    isStreaming: isCurrentStreaming,
    streamingContent: isCurrentStreaming ? streamingContent : null,
  };
};
