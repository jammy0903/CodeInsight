export interface ChatApiResponse {
  choices?: Array<{
    text?: string;
    message?: { content?: string };
  }>;
}

export function mapAssistantText(response: ChatApiResponse): string {
  return response.choices?.[0]?.message?.content ?? '';
}
