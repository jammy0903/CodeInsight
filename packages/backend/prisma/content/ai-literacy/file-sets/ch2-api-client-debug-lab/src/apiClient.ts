import { mapAssistantText, type ChatApiResponse } from './mapper';

export interface RequestOptions {
  retries?: number;
}

export async function fetchAssistantText(
  request: () => Promise<ChatApiResponse>,
  options: RequestOptions = {}
): Promise<string> {
  const retries = options.retries ?? 2;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await request();
      return mapAssistantText(response);
    } catch (error) {
      lastError = error;

      // INTENTIONAL BUG: retries every error, including non-retriable 4xx.
      if (attempt === retries) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown client error');
}
