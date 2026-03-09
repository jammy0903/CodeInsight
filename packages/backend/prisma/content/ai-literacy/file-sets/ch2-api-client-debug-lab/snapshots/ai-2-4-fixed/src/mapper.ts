export interface ChatApiResponse {
  choices?: Array<{
    text?: string;
    message?: { content?: string };
  }>;
}

export function mapAssistantText(response: ChatApiResponse): string {
  const first = response.choices?.[0];

  if (!first) {
    throw new Error('Invalid response: choices[0] is missing');
  }

  const content = first.message?.content ?? first.text;
  if (!content) {
    throw new Error('Invalid response: assistant text is missing');
  }

  return content;
}
