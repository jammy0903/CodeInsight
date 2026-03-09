export interface ChatApiResponse {
  choices?: Array<{
    text?: string;
    message?: { content?: string };
  }>;
}

export function mapAssistantText(response: ChatApiResponse): string {
  // INTENTIONAL BUG: outdated field path from old AI snippets.
  return response.choices![0].text!;
}
