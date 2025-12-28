/**
 * AI 해설자 Routes
 * GET  /api/ai/explain - 자동 해설 (줄 변경 시)
 * POST /api/ai/chat - Q&A 대화
 * GET  /api/ai/providers - 사용 가능한 Provider 목록
 * POST /api/ai/providers/switch - Provider 변경
 */

import { Router } from 'express';
import { z } from 'zod';
import {
  getCurrentProvider,
  getAllProviders,
  setCurrentProvider,
  ProviderType,
} from './providers';
import { getSettings } from './settings';

const router = Router();

// === 스키마 정의 ===

// 자동 해설 요청 스키마
const explainRequestSchema = z.object({
  line: z.coerce.number().min(1),
  code: z.string().min(1),
  topic: z.string().optional(),
});

// Q&A 채팅 요청 스키마
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  context: z.object({
    courseDay: z.number().optional(),
    topic: z.string().optional(),
    code: z.string().optional(),
    currentLine: z.number().optional(),
    quizQuestion: z.string().optional(),
  }).optional(),
});

const switchProviderSchema = z.object({
  provider: z.enum(['deepseek', 'ollama', 'claude-cli']),
});

// === 프롬프트 생성 함수 ===

/**
 * 자동 해설용 시스템 프롬프트 (짧고 빠르게)
 */
function buildExplainPrompt(topic?: string): string {
  return `당신은 코드 실행 원리를 설명하는 해설자입니다.

## 역할
현재 실행 중인 줄이 무엇을 하는지 1-2문장으로 간결하게 설명합니다.

## 스타일
- 한국어
- 1-2문장으로 핵심만
- "이 줄은 ~합니다" 형식
- 흔한 착각이 있으면 "많은 분들이 ~라고 착각해요" 추가

${topic ? `## 현재 학습 주제\n${topic}` : ''}`;
}

/**
 * Q&A 대화용 시스템 프롬프트 (상세하게)
 */
function buildChatPrompt(context?: z.infer<typeof chatRequestSchema>['context']): string {
  let prompt = `당신은 코드 실행 원리를 설명하는 해설자입니다.
사용자는 코드가 "왜" 그렇게 동작하는지 이해하려는 학습자입니다.

## 할 수 있는 것
- 현재 코드의 동작 원리 설명
- 개념 질문 답변 (변수, 포인터, 메모리 등)
- 흔한 착각 포인트 교정
- 비유/예시로 쉽게 설명

## 하면 안 되는 것
- 코드 생성/수정 (절대 금지)
- 학습 범위를 벗어난 고급 내용

## 스타일
- 한국어
- 핵심만 간결하게 (200단어 이내)
- 코드 예시는 \`\`\`c 블록 사용
- "많은 분들이 ~라고 착각해요" 같은 교정 포인트 포함`;

  if (context) {
    if (context.courseDay && context.topic) {
      prompt += `\n\n## 현재 학습 중인 코스\n- Day ${context.courseDay}: ${context.topic}`;
    }

    if (context.code) {
      prompt += `\n\n## 현재 보고 있는 코드\n\`\`\`c\n${context.code}\n\`\`\``;
    }

    if (context.currentLine) {
      prompt += `\n- 현재 실행 중인 줄: ${context.currentLine}번째 줄`;
    }

    // 퀴즈 정답 유출 방지
    if (context.quizQuestion) {
      prompt += `\n\n## 중요: 퀴즈 진행 중
현재 퀴즈 문제: "${context.quizQuestion}"
이 퀴즈의 정답을 직접적으로 알려주지 마세요.
사용자가 정답을 물어보면 "직접 실행해보세요" 또는 "코드를 따라가보세요"라고 안내하세요.`;
    }
  }

  return prompt;
}

// === 자동 해설 엔드포인트 ===
router.get('/explain', async (req, res) => {
  try {
    const parsed = explainRequestSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { line, code, topic } = parsed.data;
    const provider = getCurrentProvider();

    // 코드에서 해당 줄 추출
    const lines = code.split('\n');
    const targetLine = lines[line - 1] || '';

    const response = await provider.chat({
      message: `다음 C 코드의 ${line}번째 줄을 설명해주세요:\n\n전체 코드:\n\`\`\`c\n${code}\n\`\`\`\n\n설명할 줄: \`${targetLine.trim()}\``,
      history: [],
      systemPrompt: buildExplainPrompt(topic),
    });

    res.json({
      line,
      explanation: response.content,
    });
  } catch (error) {
    console.error('AI explain error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Q&A 채팅 엔드포인트 ===
router.post('/chat', async (req, res) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { message, history, context } = parsed.data;
    const provider = getCurrentProvider();

    const response = await provider.chat({
      message,
      history,
      systemPrompt: buildChatPrompt(context),
    });

    res.json(response);
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Health 엔드포인트 ===
router.get('/health', async (req, res) => {
  const provider = getCurrentProvider();
  const available = await provider.isAvailable();

  res.json({
    status: available ? 'ok' : 'degraded',
    provider: provider.type,
    providerName: provider.name,
    available,
  });
});

// === Provider 목록 ===
router.get('/providers', async (req, res) => {
  try {
    const providers = await getAllProviders();
    const settings = getSettings();

    res.json({
      current: settings.currentProvider,
      providers,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get providers',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Provider 변경 ===
router.post('/providers/switch', async (req, res) => {
  try {
    const parsed = switchProviderSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { provider } = parsed.data;
    await setCurrentProvider(provider as ProviderType);

    const currentProvider = getCurrentProvider();
    res.json({
      success: true,
      current: currentProvider.type,
      name: currentProvider.name,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Failed to switch provider',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export const aiRoutes = router;
