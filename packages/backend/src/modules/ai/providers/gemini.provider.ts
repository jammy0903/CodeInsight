/**
 * Gemini AI Provider
 */
import { Client } from '@notionhq/client';
import {
  type IAIProvider,
  type ChatRequest,
  type ChatResponse,
  type ProviderType,
} from './types';

// Initialize Notion client (assuming API key is in environment variables)
const notion = new Client({ auth: process.env.NOTION_API_KEY });

export class GeminiProvider implements IAIProvider {
  readonly type: ProviderType = 'gemini';
  readonly name: string = 'Gemini';

  async isAvailable(): Promise<boolean> {
    // Check if Notion API key is present for Notion integration
    return Promise.resolve(!!process.env.NOTION_API_KEY);
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const { message } = request;
    let responseContent: string;

    if (message.toLowerCase().startsWith('notion page:')) {
      const pageId = message.substring('notion page:'.length).trim();
      console.log(`[GeminiProvider] Retrieving Notion page: "${pageId}"`);
      try {
        const page = await notion.pages.retrieve({ page_id: pageId });
        responseContent = `Notion page content for "${pageId}":\n\n${JSON.stringify(page, null, 2)}`;
      } catch (error) {
        console.error('[GeminiProvider] Notion page retrieval failed:', error);
        responseContent = `Sorry, I was unable to retrieve the Notion page "${pageId}". Please check the ID and API key.`;
      }
    } else {
      // Dummy response (Gemini provider는 실제로 사용하지 않음)
      responseContent = `This is a dummy response from the Gemini provider. You said: "${message}"`;
    }

    return {
      content: responseContent,
      provider: this.type,
      model: 'gemini-pro', // Dummy model
      usage: {
        promptTokens: message.length,
        completionTokens: responseContent.length,
        totalTokens: message.length + responseContent.length,
      },
    };
  }
}
