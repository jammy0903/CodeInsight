export interface ChatApiResponse {
  choices?: Array<{
    text?: string;
    message?: { content?: string };
  }>;
}

export function mapAssistantText(response: ChatApiResponse): string {
  const first = response.choices?.[0];
  return first?.message?.content ?? first?.text ?? '';
}
