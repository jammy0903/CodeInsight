import { mapAssistantText, type ChatApiResponse } from './mapper';

export interface RequestOptions {
  retries?: number;
}

interface HttpLikeError extends Error {
  status?: number;
}

function isRetriable(error: unknown): boolean {
  const status = (error as HttpLikeError | undefined)?.status;
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

function normalizeRetries(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return 2;
  return Math.min(5, Math.max(0, Math.floor(value)));
}

export async function fetchAssistantText(
  request: () => Promise<ChatApiResponse>,
  options: RequestOptions = {}
): Promise<string> {
  const retries = normalizeRetries(options.retries);
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await request();
      return mapAssistantText(response);
    } catch (error) {
      lastError = error;

      if (!isRetriable(error) || attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown client error');
}
