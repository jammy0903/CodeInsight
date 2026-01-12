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
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';
import { optionalDbUser } from '../../middleware/auth';

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
  // 분석 리포트용 추가 필드
  lessonId: z.string().optional(),           // 어떤 레슨에서 질문했는지
  contextType: z.enum(['lesson', 'playground', 'general']).optional(), // 질문 맥락
});

const switchProviderSchema = z.object({
  provider: z.enum(['deepseek', 'ollama']),
});

// 시뮬레이션 스텝 기반 설명 요청 스키마
const explainStepSchema = z.object({
  line: z.number(),
  code: z.string(),
  fullCode: z.string(),
  stack: z.array(z.object({
    name: z.string(),
    type: z.string(),
    value: z.string(),
    address: z.string(),
  })).optional().default([]),
  heap: z.array(z.object({
    name: z.string(),
    type: z.string(),
    value: z.string(),
    address: z.string(),
  })).optional().default([]),
  changes: z.array(z.object({
    target: z.string(),
    from: z.string().optional(),
    to: z.string(),
  })).optional().default([]),
});

// === 프롬프트 생성 함수 ===

/**
 * 시뮬레이션 스텝 설명용 프롬프트
 * 초보자가 헷갈리는 개념만 집중 설명, 단순한 코드는 스킵
 */
function buildStepExplainPrompt(): string {
  return `당신은 C 초보자가 **헷갈려하는 개념만** 콕 짚어주는 선생님입니다.

## 핵심 규칙

### 1. 단순한 코드는 "SKIP" 응답
다음은 설명할 필요 없어요. 정확히 "SKIP"이라고만 답해주세요:
- 변수 선언/정의: \`int x = 10;\`, \`char c = 'a';\`
- printf/scanf 호출
- return 0; return 문
- 단순 산술: \`x = a + b;\`
- 중괄호 \`{\` \`}\`
- 함수 시그니처: \`int main()\`

### 2. 헷갈리는 개념만 설명
다음 상황에서만 설명해주세요:

**포인터 관련:**
- \`int *p = &x;\` → 주소 저장 개념
- \`*p = 10;\` → 역참조(dereference)
- \`p + 1\` → 포인터 산술 (바이트가 아닌 타입 크기만큼!)

**배열 관련:**
- 배열 → 포인터 decay (배열 ≠ 포인터!)
- \`arr[i]\` == \`*(arr + i)\`

**메모리 관련:**
- malloc/calloc/realloc → 힙 할당
- free → 메모리 해제, dangling pointer 위험

**함수 호출:**
- 포인터로 값 수정 → C는 항상 pass by value!

## 스타일
- 한국어, 친근한 반말
- **1-2문장**으로 핵심만!
- "💡 ~라고 착각하기 쉬운데..." 형식 선호
- 비유는 한 줄로 직관적으로

## 응답 예시

포인터 선언 시:
"🔗 p에 x의 **주소**를 저장했어! p 자체는 숫자(주소값)일 뿐이야."

포인터 산술 시:
"💡 p+1은 주소+1이 아니야! int가 4바이트니까 실제로는 +4 됨."

배열 전달 시:
"💡 배열을 함수에 넘기면 **포인터로 decay**돼. 그래서 sizeof가 다르게 나와!"

## 절대 하지 말 것
- 모든 줄에 설명 달기 ❌
- 당연한 것 설명하기 ❌ (변수에 값 저장됨 등)
- 길게 설명하기 ❌`;
}

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
  let prompt = `당신은 코드 실행 원리를 설명하는 친절한 해설자입니다.
사용자는 코드가 "왜" 그렇게 동작하는지 이해하려는 학습자입니다.

## 질문 해석 전략 (중요!)
사용자 질문을 받으면 다음 순서로 생각하세요:

**1단계: 코드/프로그래밍 관련으로 해석할 수 있는지 최대한 노력**
- 현재 보고 있는 코드와 연결될 수 있는가?
- 프로그래밍 개념(변수, 메모리, 포인터, 함수 등)과 관련있는가?
- 비유나 추상적 표현인가? (예: "우체부처럼 배달", "화살표 같다", "왜 죽어?/왜 살아?" → 코드 실행/종료 관련?)
- 오타나 줄임말일 수 있는가?

**2단계: 정말 프로그래밍과 무관하다고 확신할 때만 부드럽게 거절**
- 명백히 인생 상담, 날씨, 연예인, 게임, 음식 등 완전 다른 주제일 때만
- 응답 예시: "음... 그건 제 전문 분야가 아니에요! 😅 코드나 프로그래밍 개념에 대해 궁금한 게 있으면 물어봐 주세요~"

**예시:**
- "왜 안돼?" → 코드가 왜 동작 안 하는지 물어보는 것으로 해석
- "이게 뭐야" → 현재 코드/개념이 뭔지 물어보는 것으로 해석
- "살려줘" → 에러 해결 요청으로 해석
- "오늘 날씨 어때?" → 프로그래밍과 무관 → 거절

## 할 수 있는 것
- 현재 코드의 동작 원리 설명
- 개념 질문 답변 (변수, 포인터, 메모리 등)
- 흔한 착각 포인트 교정
- 비유/예시로 쉽게 설명
- 추상적인 프로그래밍 비유 이해하고 설명

## 하면 안 되는 것
- 코드 생성/수정 (절대 금지)
- 학습 범위를 벗어난 고급 내용

## 스타일 (매우 중요!)
- 한국어, 친근한 말투
- **응답 시작은 이해 확인으로**: "아~ ~라는 말씀이시죠?" 한 문장으로 짧게
- **핵심만! 3-5문장 이내** (100단어 이내, 길게 쓰지 마!)
- 비유나 예시는 한 줄로 직관적으로
- 코드 예시 필요하면 최소한만 (\`\`\`c 블록, 3줄 이내)
- 착각 포인트는 "💡 ~라고 착각하기 쉬워요" 한 줄로

## 좋은 응답 예시
"아~ 포인터가 뭔지 궁금하신 거군요!
포인터는 **메모리 주소를 저장하는 변수**예요. 집 주소 적어둔 메모지라고 생각하면 돼요.
💡 많은 분들이 포인터 자체가 값을 갖고 있다고 착각해요. 주소만 갖고 있어요!"

## 나쁜 응답 예시 (이렇게 하지 마!)
- 긴 설명 ❌
- 여러 개념을 한번에 설명 ❌
- 불필요한 배경 설명 ❌`;

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
    logger.error('AI explain error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === 시뮬레이션 스텝 설명 스트리밍 엔드포인트 (SSE) ===
router.post('/explain-step', async (req, res) => {
  try {
    const parsed = explainStepSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { line, code, fullCode, stack, heap, changes } = parsed.data;
    const provider = getCurrentProvider();

    // 메모리 상태를 문자열로 변환
    const stackStr = stack.length > 0
      ? stack.map(v => `  ${v.name}: ${v.value} (${v.type}, ${v.address})`).join('\n')
      : '  (비어있음)';

    const heapStr = heap.length > 0
      ? heap.map(v => `  ${v.name}: ${v.value} (${v.type}, ${v.address})`).join('\n')
      : '  (비어있음)';

    const changesStr = changes.length > 0
      ? changes.map(c => c.from ? `  ${c.target}: ${c.from} → ${c.to}` : `  ${c.target}: ${c.to} (새로 생성)`).join('\n')
      : '  (변경 없음)';

    const userMessage = `## 현재 실행 중인 코드
\`${code.trim()}\` (${line}번째 줄)

## 전체 코드
\`\`\`c
${fullCode}
\`\`\`

## 현재 Stack 메모리
${stackStr}

## 현재 Heap 메모리
${heapStr}

## 이번 스텝에서 변경된 것
${changesStr}

위 상황을 바탕으로 이 줄이 무엇을 하는지 설명해줘!`;

    // 스트리밍 지원 확인
    if (!provider.streamChat) {
      // 스트리밍 미지원 시 일반 응답으로 fallback
      const response = await provider.chat({
        message: userMessage,
        history: [],
        systemPrompt: buildStepExplainPrompt(),
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ content: response.content, done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
      return res.end();
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();  // 헤더 즉시 전송

    // 스트리밍 시작
    await provider.streamChat(
      {
        message: userMessage,
        history: [],
        systemPrompt: buildStepExplainPrompt(),
      },
      (chunk) => {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        // Node.js 스트림은 write 후 자동 flush (compression 미들웨어 없으면)
      }
    );

    res.end();
  } catch (error) {
    logger.error('AI explain-step stream error:', error);

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', done: true })}\n\n`);
      return res.end();
    }

    res.status(500).json({
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === Q&A 채팅 엔드포인트 ===
// optionalDbUser: 로그인 안 해도 사용 가능, 로그인 시 ChatHistory 저장
router.post('/chat', optionalDbUser, async (req, res) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { message, history, context, lessonId, contextType } = parsed.data;
    const provider = getCurrentProvider();

    const response = await provider.chat({
      message,
      history,
      systemPrompt: buildChatPrompt(context),
    });

    // 로그인 사용자인 경우 ChatHistory 저장 (비동기, 실패해도 응답에 영향 없음)
    const userId = req.user?.dbUser?.id;
    if (userId) {
      prisma.chatHistory.create({
        data: {
          userId,
          lessonId: lessonId || null,
          context: contextType || null,
          question: message,
          answer: response.content,
          tokens: response.usage?.totalTokens || null,
        },
      }).catch((err) => {
        logger.error('Failed to save chat history:', err);
      });
    }

    res.json(response);
  } catch (error) {
    logger.error('AI chat error:', error);
    res.status(500).json({
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// === 스트리밍 Q&A 채팅 엔드포인트 (SSE) ===
// optionalDbUser: 로그인 안 해도 사용 가능, 로그인 시 ChatHistory 저장
router.post('/chat/stream', optionalDbUser, async (req, res) => {
  try {
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parsed.error.issues,
      });
    }

    const { message, history, context, lessonId, contextType } = parsed.data;
    const provider = getCurrentProvider();
    const userId = req.user?.dbUser?.id;

    // 스트리밍 응답 수집 (ChatHistory 저장용)
    let fullResponse = '';

    // ChatHistory 저장 헬퍼 (스트리밍 완료 후 호출)
    const saveChatHistory = () => {
      if (userId && fullResponse) {
        prisma.chatHistory.create({
          data: {
            userId,
            lessonId: lessonId || null,
            context: contextType || null,
            question: message,
            answer: fullResponse,
            tokens: null, // 스트리밍에서는 토큰 수 알 수 없음
          },
        }).catch((err) => {
          logger.error('Failed to save chat history:', err);
        });
      }
    };

    // 스트리밍 지원 확인
    if (!provider.streamChat) {
      // 스트리밍 미지원 시 일반 응답으로 fallback
      const response = await provider.chat({
        message,
        history,
        systemPrompt: buildChatPrompt(context),
      });

      fullResponse = response.content;
      saveChatHistory();

      // SSE 형식으로 한 번에 전송
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.write(`data: ${JSON.stringify({ content: response.content, done: false })}\n\n`);
      res.write(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
      return res.end();
    }

    // SSE 헤더 설정
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');  // nginx 버퍼링 비활성화

    // 스트리밍 시작
    await provider.streamChat(
      {
        message,
        history,
        systemPrompt: buildChatPrompt(context),
      },
      (chunk) => {
        // 청크 내용 수집
        if (chunk.content) {
          fullResponse += chunk.content;
        }
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    );

    // 스트리밍 완료 후 ChatHistory 저장
    saveChatHistory();

    res.end();
  } catch (error) {
    logger.error('AI stream error:', error);

    // 이미 스트리밍 시작된 경우 에러 이벤트 전송
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error', done: true })}\n\n`);
      return res.end();
    }

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
