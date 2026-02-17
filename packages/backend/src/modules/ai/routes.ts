/**
 * AI Routes (Fastify Plugin)
 *
 * GET  /api/ai/explain        - 자동 해설 (줄 변경 시)
 * POST /api/ai/explain-step   - 시뮬레이션 스텝 설명 (SSE 스트리밍)
 * POST /api/ai/chat           - Q&A 대화
 * POST /api/ai/chat/stream    - Q&A 대화 스트리밍 (SSE)
 * POST /api/ai/analyze-report - 학습 리포트 AI 분석
 * GET  /api/ai/health         - Health 체크
 * GET  /api/ai/providers      - 사용 가능한 Provider 목록
 * POST /api/ai/providers/switch - Provider 변경
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
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
import { startSSE, sendSSE, endSSE, sendSSEError } from '../../utils/sse';
// subscription 시스템 제거됨 - AI 사용량 제한 없음

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
  provider: z.enum(['deepseek']),
});

// 리포트 분석 요청 스키마
const analyzeReportSchema = z.object({
  totalStudyTime: z.number(), // 초 단위
  totalSessions: z.number(),
  quizStats: z.object({
    total: z.number(),
    correct: z.number(),
    accuracy: z.number(),
  }),
  aiQuestions: z.number(),
  weakConcepts: z.record(z.string(), z.number()), // { "포인터": 5, "배열": 3 }
  weekdayActivity: z.array(z.number()).length(7), // 일~토
  hourlyActivity: z.array(z.number()).length(24), // 0~23시
  recentWrongCount: z.number(),
  streakDays: z.number().optional(), // 연속 학습 일수
});

// 시뮬레이션 스텝 기반 설명 요청 스키마 (언어별)
const explainStepSchema = z.discriminatedUnion('language', [
  // C 언어
  z.object({
    language: z.literal('c'),
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
  }),
  // JavaScript
  z.object({
    language: z.literal('javascript'),
    line: z.number(),
    code: z.string(),
    fullCode: z.string(),
    stack: z.array(z.object({
      functionName: z.string(),
      variables: z.record(z.string(), z.unknown()).optional().default({}),
    })).optional().default([]),
    heap: z.array(z.object({
      id: z.string(),
      type: z.string(),
      value: z.unknown(),
    })).optional().default([]),
  }),
  // Python
  z.object({
    language: z.literal('python'),
    line: z.number(),
    code: z.string(),
    fullCode: z.string(),
    names: z.array(z.object({
      name: z.string(),
      pointsTo: z.string(),
    })).optional().default([]),
    objects: z.array(z.object({
      id: z.string(),
      type: z.string(),
      value: z.unknown(),
    })).optional().default([]),
  }),
  // Java
  z.object({
    language: z.literal('java'),
    line: z.number(),
    code: z.string(),
    fullCode: z.string(),
    stack: z.array(z.object({
      name: z.string(),
      type: z.string(),
      value: z.unknown(),
    })).optional().default([]),
    heap: z.array(z.object({
      name: z.string(),
      type: z.string(),
      value: z.unknown(),
    })).optional().default([]),
  }),
]);

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
 * JavaScript 스텝 설명용 프롬프트
 * 클로저, this, 참조 등 JavaScript 초보자가 헷갈리는 개념 집중 설명
 */
function buildJsStepExplainPrompt(): string {
  return `당신은 JavaScript 초보자가 **헷갈려하는 개념만** 콕 짚어주는 선생님입니다.

## 핵심 규칙

### 1. 단순한 코드는 "SKIP" 응답
다음은 설명할 필요 없어요. 정확히 "SKIP"이라고만 답해주세요:
- 변수 선언: \`let x = 10;\`, \`const name = 'hello';\`
- 단순 산술: \`x = a + b;\`
- console.log 호출
- return 문
- 중괄호 \`{\` \`}\`
- 함수 시그니처: \`function add(a, b)\`

### 2. 헷갈리는 개념만 설명
다음 상황에서만 설명해주세요:

**참조 vs 값 복사:**
- \`const obj2 = obj1;\` → 두 변수가 **같은 객체**를 가리킴!
- 원시 타입(number, string)은 값 복사, 객체는 참조 복사
- 배열/객체 수정 시 원본도 변경되는 이유

**클로저(Closure):**
- 함수 안에서 외부 변수 접근
- 함수가 끝나도 변수가 살아있는 이유
- \`function outer() { let x = 1; return function() { return x; } }\`

**this 바인딩:**
- 화살표 함수 vs 일반 함수의 this 차이
- 메서드 호출 시 this는 호출한 객체
- \`.bind()\`, \`.call()\`, \`.apply()\`

**호이스팅(Hoisting):**
- \`var\`는 선언이 위로 끌어올려짐
- \`let\`/\`const\`는 TDZ(Temporal Dead Zone)

**비동기 (선택적):**
- Promise, async/await
- 콜백 함수가 나중에 실행되는 이유

## 스타일
- 한국어, 친근한 반말
- **1-2문장**으로 핵심만!
- "💡 ~라고 착각하기 쉬운데..." 형식 선호
- 비유는 한 줄로 직관적으로

## 응답 예시

참조 복사 시:
"🔗 obj2는 obj1을 **복사한 게 아니라 가리키는 거**야! 둘 다 같은 객체를 봐."

클로저 시:
"💡 inner 함수가 끝난 후에도 x는 **메모리에 살아있어**. inner가 x를 기억하고 있거든!"

this 바인딩 시:
"🎯 화살표 함수의 this는 **만들어질 때** 정해지지만, 일반 함수는 **호출될 때** 정해져!"

## 절대 하지 말 것
- 모든 줄에 설명 달기 ❌
- 당연한 것 설명하기 ❌ (변수에 값 저장됨 등)
- 길게 설명하기 ❌`;
}

/**
 * Python 스텝 설명용 프롬프트
 * Names-Objects 참조 모델, mutable/immutable 등 Python 고유 개념 집중
 */
function buildPyStepExplainPrompt(): string {
  return `당신은 Python 초보자가 **헷갈려하는 개념만** 콕 짚어주는 선생님입니다.

## 핵심 규칙

### 1. 단순한 코드는 "SKIP" 응답
다음은 설명할 필요 없어요. 정확히 "SKIP"이라고만 답해주세요:
- 변수 할당: \`x = 10\`, \`name = 'hello'\`
- 단순 산술: \`x = a + b\`
- print 호출
- return 문
- 콜론 \`:\`
- 함수 시그니처: \`def add(a, b):\`

### 2. 헷갈리는 개념만 설명
다음 상황에서만 설명해주세요:

**Names와 Objects:**
- \`x = [1, 2]\` → x는 리스트를 담은 게 **아니라 가리킴**!
- \`y = x\` → 두 이름이 **같은 객체**를 가리킴
- \`id()\` 함수로 객체 ID 확인

**Mutable vs Immutable:**
- 리스트, 딕셔너리는 수정 가능(mutable)
- 숫자, 문자열, 튜플은 수정 불가(immutable)
- \`x = x + 1\`은 재할당이지 수정이 아님!

**함수 파라미터:**
- Python은 **pass by object reference**
- mutable 객체 전달 시 원본 변경 가능
- immutable 객체는 변경 불가

**리스트 슬라이싱:**
- \`lst[1:3]\`은 **새 리스트** 생성 (복사)
- \`lst.append()\`는 **원본** 수정

## 스타일
- 한국어, 친근한 반말
- **1-2문장**으로 핵심만!
- "💡 ~라고 착각하기 쉬운데..." 형식 선호
- 비유는 한 줄로 직관적으로

## 응답 예시

참조 할당 시:
"🔗 y는 x를 **복사한 게 아니라 가리키는 거**야! 둘 다 같은 리스트를 봐."

Mutable 수정 시:
"💡 리스트는 **수정 가능**해! 그래서 \`lst.append()\` 하면 원본이 바뀌지."

Immutable 재할당 시:
"💡 문자열은 **수정 불가**야! \`s = s + 'a'\`는 새 문자열을 만들어서 s에 다시 할당하는 거야."

## 절대 하지 말 것
- 모든 줄에 설명 달기 ❌
- 당연한 것 설명하기 ❌
- 길게 설명하기 ❌`;
}

/**
 * Java 스텝 설명용 프롬프트
 * 참조 타입, String Pool, 오토박싱 등 Java 초보자가 헷갈리는 개념 집중 설명
 */
function buildJavaStepExplainPrompt(): string {
  return `당신은 Java 초보자가 **헷갈려하는 개념만** 콕 짚어주는 선생님입니다.

## 핵심 규칙

### 1. 단순한 코드는 "SKIP" 응답
다음은 설명할 필요 없어요. 정확히 "SKIP"이라고만 답해주세요:
- 변수 선언: \`int x = 10;\`, \`String name = "hello";\`
- 단순 산술: \`x = a + b;\`
- System.out.println 호출
- return 문
- 중괄호 \`{\` \`}\`
- 메인 메서드 시그니처: \`public static void main(String[] args)\`

### 2. 헷갈리는 개념만 설명
다음 상황에서만 설명해주세요:

**참조 타입 vs 기본 타입:**
- \`int[] arr = new int[5];\` → 힙에 배열 객체 생성
- \`String s1 = s2;\` → 두 변수가 **같은 객체**를 참조!
- \`==\` vs \`.equals()\` 차이

**String Pool:**
- \`String s1 = "hello";\` → String Pool에서 재사용
- \`String s2 = new String("hello");\` → 새 객체 생성 (Pool 무시)
- \`s1 == s2\` vs \`s1.equals(s2)\` 결과 차이

**오토박싱/언박싱:**
- \`Integer x = 10;\` → int → Integer 오토박싱
- \`int y = x;\` → Integer → int 언박싱
- \`Integer.valueOf(127) == Integer.valueOf(127)\` → 캐시 범위!

**객체와 메모리:**
- \`new\` 키워드 → 힙에 새 객체 생성
- 배열은 항상 참조 타입
- 메서드 호출 시 참조 전달 (pass by value of reference)

## 스타일
- 한국어, 친근한 반말
- **1-2문장**으로 핵심만!
- "💡 ~라고 착각하기 쉬운데..." 형식 선호
- 비유는 한 줄로 직관적으로

## 응답 예시

참조 비교 시:
"💡 ==는 주소를 비교하고, .equals()는 내용을 비교해! String은 꼭 .equals()를 써야 해."

배열 전달 시:
"🔗 배열은 참조 타입이라 메서드에 넘기면 **원본이 바뀔 수 있어**!"

## 절대 하지 말 것
- 모든 줄에 설명 달기 ❌
- 당연한 것 설명하기 ❌
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
function buildChatPrompt(
  context?: z.infer<typeof chatRequestSchema>['context'],
  history?: Array<{ role: string; content: string }>
): string {
  let prompt = `규칙 (절대 지켜!):
- 정확히 3문장만 (마침표 3개)
- 친근한 반말 + 이모지 필수
- 코드블록 절대 금지 (백틱 3개 금지)
- 코드는 인라인만: setTimeout은 이렇게 해

예시:
"이벤트 루프 때문이야! 😊 setTimeout은 태스크 큐, Promise는 마이크로태스크 큐에 가. 💡 마이크로태스크가 먼저 실행돼!"

금지:
- 4문장 이상 금지
- 번호 매기기 금지 (1., 2., 3.)
- 코드블록 금지 (\`\`\`)
- 설명하지 말고 간단히만

범위 벗어난 질문 → "지금 배우는 내용 아니야! 😅"`;

  // 5번째 질문부터 이전 대화 요약 추가 (history.length >= 8이면 4쌍 존재)
  if (history && history.length >= 8) {
    const recentHistory = history.slice(-8); // 마지막 4쌍 (8개 메시지)
    let summaryText = '\n\n## 📝 이전 대화 요약 (참고용)\n';

    for (let i = 0; i < recentHistory.length; i += 2) {
      const userMsg = recentHistory[i];
      const assistantMsg = recentHistory[i + 1];

      if (userMsg && assistantMsg) {
        const qNum = Math.floor(i / 2) + 1;
        summaryText += `Q${qNum}: ${userMsg.content}\nA${qNum}: ${assistantMsg.content}\n\n`;
      }
    }

    summaryText += '위 대화를 참고하여 이번 질문에 답변해주세요. (새로운 답변도 3줄 제한 유지!)';
    prompt += summaryText;
  }

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

/**
 * 학습 리포트 분석용 시스템 프롬프트
 * 학생의 학습 데이터를 분석하여 개인화된 피드백 제공
 */
function buildReportAnalysisPrompt(): string {
  return `당신은 프로그래밍 학습 코치입니다. 학생의 학습 데이터를 분석하여 **개인화된 피드백**을 작성합니다.

## 역할
- 학생의 학습 패턴, 강점, 개선점을 분석
- 따뜻하고 격려하는 톤으로 작성
- 구체적인 데이터를 언급하며 신뢰감 형성

## Self-Ask 분석 프로세스 (내부 사고 과정)

분석 시 다음 질문들을 **스스로에게** 물어보고 답변하세요. 최종 응답에는 질문은 생략하고 답변만 자연스러운 줄글로 통합하세요.

### 1단계: 데이터 관찰
**Q1: 가장 눈에 띄는 특징은 무엇인가?**
- 조건: 항상 물어봄
- 예시: "27분/9회 세션 → 세션당 3분 (매우 짧음)"

**Q2: 다른 학습자와 비교했을 때 독특한 점은?**
- 조건: 특이한 패턴이 있을 때 (극단적으로 짧은/긴 시간, 특정 시간대 집중 등)
- 예시: "새벽 3시에만 학습 → 야행성?"

**Q3: 데이터에서 모순되는 점이 있나?**
- 조건: 모순이 있을 때만
- 예시: "AI 질문 30회인데 학습 시간 10분 → 질문만 하고 학습은 안 함?"

### 2단계: 맥락 파악 (핵심!)
**Q4: 왜 이런 패턴이 나타났을까?**
- 조건: 항상 물어봄
- 예시: "짧게 자주 접속 → 바쁜 일상, 틈새 시간 활용형"

**Q5: 이 학습자는 무엇을 중요하게 생각하나?**
- 조건: 노트/AI질문/언어별 시간 데이터가 있을 때
- 예시: "'포인터' 노트 3개 + '역참조가 뭐야?' 질문 → 메모리 관련 주제에 관심"

### 3단계: 예측 & 제안
**Q6: 이대로 가면 어떤 문제가 생길까?**
- 조건: 명확한 문제점이 있을 때
- 예시: "세션당 3분 → 개념이 정착되기 어려움"

**Q7: 이 학습자에게 가장 도움이 될 조언은?**
- 조건: 항상 물어봄
- 예시: "월요일 저녁 패턴 활용 → 10분 이상으로 늘리기"

## 작성 규칙
- **4-10문장** 분량의 줄글 (한 문단)
- 존댓말, 친근한 코치 톤
- Self-Ask 답변을 자연스럽게 통합 (Q1 → Q4 → Q6 → Q7 흐름)
- **구체적인 개념/질문 언급** (노트, AI질문, 틀린 문제가 있다면 반드시!)
- 뻔한 조언 X, 데이터 기반 인사이트 O

## 응답 형식
**중요**: 질문(Q1-Q7)은 최종 응답에 포함하지 마세요. 답변만 자연스러운 줄글로 작성하세요.

## 예시 (구체적 맥락 있는 경우)
"C 언어에 45분, Python에 20분을 투자하셨네요! 특히 '포인터'와 'malloc' 개념을 노트에 저장하신 걸 보니 메모리 관련 주제에 관심이 많으신 것 같아요. AI에게 '역참조가 뭐야?'라고 질문하신 기록도 있는데, 포인터를 제대로 이해하려는 좋은 접근이에요. 다만 '배열과 포인터 관계' 레슨에서 퀴즈를 틀리셨더라고요 - 배열 이름이 포인터로 decay 되는 개념이 헷갈리셨을 수 있어요. 해당 레슨의 시뮬레이션을 다시 천천히 돌려보시면서 메모리 주소 변화를 관찰해보시는 걸 추천드려요!"

## 예시 (기본 통계만 있는 경우)
"이번 달 27분이라는 학습 시간이 짧아 보일 수 있지만, 9번의 세션으로 꾸준히 접속하신 점이 인상적이에요! 특히 월요일과 저녁 시간대에 집중해서 학습하시는 패턴이 보이는데, 이 시간대를 '나만의 코딩 타임'으로 굳히시면 좋겠어요."`;
}

// === AI 사용량 체크 preHandler ===

/**
 * AI 사용량 체크 (Fastify preHandler)
 * - requireDbUser 이후 사용 (DB 사용자 ID 필요)
 * - 구독 시스템 제거됨: 로그인 사용자 무제한 사용
 */
async function checkAIUsage(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  // DB 사용자 체크 (requireDbUser가 먼저 실행되어야 함)
  const userId = request.user?.dbUser?.id;
  if (!userId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'AI 기능을 사용하려면 로그인이 필요합니다.'
    });
  }
  // 구독 시스템 제거 - 모든 로그인 사용자 AI 무제한 사용
}

// === Fastify Plugin ===

const aiRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * @swagger
   * /api/ai/explain:
   *   get:
   *     tags: [AI]
   *     summary: 자동 해설 (줄 변경 시)
   *     parameters:
   *       - in: query
   *         name: line
   *         required: true
   *         schema:
   *           type: integer
   *       - in: query
   *         name: code
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: topic
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 해설 결과
   */
  fastify.get('/explain', { preHandler: [fastify.requireDbUser, checkAIUsage] }, async (request, reply) => {
    try {
      const parsed = explainRequestSchema.safeParse(request.query);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { line, code, topic } = parsed.data;
      const provider = await getCurrentProvider();

      // 코드에서 해당 줄 추출
      const lines = code.split('\n');
      const targetLine = lines[line - 1] || '';

      const response = await provider.chat({
        message: `다음 C 코드의 ${line}번째 줄을 설명해주세요:\n\n전체 코드:\n\`\`\`c\n${code}\n\`\`\`\n\n설명할 줄: \`${targetLine.trim()}\``,
        history: [],
        systemPrompt: buildExplainPrompt(topic),
      });

      return {
        line,
        explanation: response.content,
      };
    } catch (error) {
      logger.error('AI explain error:', error);
      return reply.status(500).send({
        error: 'AI service error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/ai/explain-step:
   *   post:
   *     tags: [AI]
   *     summary: 시뮬레이션 스텝 설명 (SSE 스트리밍)
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: SSE 스트리밍 응답
   */
  fastify.post('/explain-step', { preHandler: [fastify.requireDbUser, checkAIUsage] }, async (request, reply) => {
    try {
      const parsed = explainStepSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const provider = await getCurrentProvider();
      const data = parsed.data;
      let userMessage = '';
      let systemPrompt = '';

      // 언어별 메시지 및 프롬프트 생성
      if (data.language === 'c') {
        // C 언어
        const { line, code, fullCode, stack, heap, changes } = data;

        const stackStr = stack.length > 0
          ? stack.map(v => `  ${v.name}: ${v.value} (${v.type}, ${v.address})`).join('\n')
          : '  (비어있음)';

        const heapStr = heap.length > 0
          ? heap.map(v => `  ${v.name}: ${v.value} (${v.type}, ${v.address})`).join('\n')
          : '  (비어있음)';

        const changesStr = changes.length > 0
          ? changes.map(c => c.from ? `  ${c.target}: ${c.from} → ${c.to}` : `  ${c.target}: ${c.to} (새로 생성)`).join('\n')
          : '  (변경 없음)';

        userMessage = `## 현재 실행 중인 코드
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

        systemPrompt = buildStepExplainPrompt();

      } else if (data.language === 'javascript') {
        // JavaScript
        const { line, code, fullCode, stack, heap } = data;

        const stackStr = stack.length > 0
          ? stack.map(f => `  함수: ${f.functionName}\n${Object.entries(f.variables || {}).map(([k, v]) => `    ${k}: ${JSON.stringify(v)}`).join('\n')}`).join('\n\n')
          : '  (비어있음)';

        const heapStr = heap.length > 0
          ? heap.map(h => `  [${h.id}] ${h.type}: ${JSON.stringify(h.value)}`).join('\n')
          : '  (비어있음)';

        userMessage = `## 현재 실행 중인 코드
\`${code.trim()}\` (${line}번째 줄)

## 전체 코드
\`\`\`javascript
${fullCode}
\`\`\`

## 현재 Call Stack (함수 실행 스택)
${stackStr}

## 현재 Heap 메모리 (객체들)
${heapStr}

위 상황을 바탕으로 이 줄이 무엇을 하는지 설명해줘!`;

        systemPrompt = buildJsStepExplainPrompt();

      } else if (data.language === 'python') {
        // Python
        const { line, code, fullCode, names, objects } = data;

        const namesStr = names.length > 0
          ? names.map(n => `  ${n.name} → ${n.pointsTo}`).join('\n')
          : '  (비어있음)';

        const objectsStr = objects.length > 0
          ? objects.map(o => `  [${o.id}] ${o.type}: ${JSON.stringify(o.value)}`).join('\n')
          : '  (비어있음)';

        userMessage = `## 현재 실행 중인 코드
\`${code.trim()}\` (${line}번째 줄)

## 전체 코드
\`\`\`python
${fullCode}
\`\`\`

## 현재 Names (변수들)
${namesStr}

## 현재 Objects (객체들)
${objectsStr}

위 상황을 바탕으로 이 줄이 무엇을 하는지 설명해줘!`;

        systemPrompt = buildPyStepExplainPrompt();

      } else if (data.language === 'java') {
        // Java
        const { line, code, fullCode, stack, heap } = data;

        const stackStr = stack.length > 0
          ? stack.map(v => `  ${v.name}: ${JSON.stringify(v.value)} (${v.type})`).join('\n')
          : '  (비어있음)';

        const heapStr = heap.length > 0
          ? heap.map(v => `  ${v.name}: ${JSON.stringify(v.value)} (${v.type})`).join('\n')
          : '  (비어있음)';

        userMessage = `## 현재 실행 중인 코드
\`${code.trim()}\` (${line}번째 줄)

## 전체 코드
\`\`\`java
${fullCode}
\`\`\`

## 현재 Stack (지역 변수)
${stackStr}

## 현재 Heap (객체)
${heapStr}

위 상황을 바탕으로 이 줄이 무엇을 하는지 설명해줘!`;

        systemPrompt = buildJavaStepExplainPrompt();

      } else {
        // Fallback (should not happen due to Zod validation)
        throw new Error(`Unsupported language: ${(data as any).language}`);
      }

      // 스트리밍 지원 확인
      if (!provider.streamChat) {
        // 스트리밍 미지원 시 일반 응답으로 fallback
        const response = await provider.chat({
          message: userMessage,
          history: [],
          systemPrompt,
        });

        startSSE(request, reply);
        sendSSE(reply, { content: response.content, done: false });
        sendSSE(reply, { content: '', done: true });
        endSSE(reply);
        return;
      }

      // SSE 스트리밍 시작
      startSSE(request, reply);

      // 스트리밍
      await provider.streamChat(
        {
          message: userMessage,
          history: [],
          systemPrompt,
        },
        (chunk) => {
          sendSSE(reply, chunk);
        }
      );

      endSSE(reply);
    } catch (error) {
      logger.error('AI explain-step stream error:', error);

      if (reply.raw.headersSent) {
        sendSSEError(reply, error instanceof Error ? error : 'Unknown error');
        return;
      }

      return reply.status(500).send({
        error: 'AI service error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/ai/chat:
   *   post:
   *     tags: [AI]
   *     summary: Q&A 대화
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *               history:
   *                 type: array
   *               context:
   *                 type: object
   *     responses:
   *       200:
   *         description: AI 응답
   */
  fastify.post(
    '/chat',
    { preHandler: [fastify.requireDbUser, checkAIUsage] },
    async (request, reply) => {
      try {
        const parsed = chatRequestSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid request',
            details: parsed.error.issues,
          });
        }

        const { message, history, context, lessonId, contextType } = parsed.data;
        const provider = await getCurrentProvider();
        const userId = request.user?.dbUser?.id;

        const response = await provider.chat({
          message,
          history,
          systemPrompt: buildChatPrompt(context, history),
        });

        // ChatHistory 저장 (비동기, 실패해도 응답에 영향 없음)
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

          // AI 사용량 기록 (구독 시스템 제거됨)
        }

        return response;
      } catch (error) {
        logger.error('AI chat error:', error);
        return reply.status(500).send({
          error: 'AI service error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/ai/chat/stream:
   *   post:
   *     tags: [AI]
   *     summary: Q&A 대화 스트리밍 (SSE)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - message
   *             properties:
   *               message:
   *                 type: string
   *               history:
   *                 type: array
   *               context:
   *                 type: object
   *     responses:
   *       200:
   *         description: SSE 스트리밍 응답
   */
  fastify.post(
    '/chat/stream',
    { preHandler: [fastify.requireDbUser, checkAIUsage] },
    async (request, reply) => {
      try {
        const parsed = chatRequestSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid request',
            details: parsed.error.issues,
          });
        }

        const { message, history, context, lessonId, contextType } = parsed.data;
        const provider = await getCurrentProvider();
        const userId = request.user?.dbUser?.id;

        // 스트리밍 응답 수집 (ChatHistory 저장용)
        let fullResponse = '';

        // ChatHistory 저장 및 사용량 기록 헬퍼 (스트리밍 완료 후 호출)
        const saveChatHistoryAndUsage = () => {
          if (userId && fullResponse) {
            // ChatHistory 저장
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

            // AI 사용량 기록 (구독 시스템 제거됨)
          }
        };

        // 스트리밍 지원 확인
        if (!provider.streamChat) {
          // 스트리밍 미지원 시 일반 응답으로 fallback
          const response = await provider.chat({
            message,
            history,
            systemPrompt: buildChatPrompt(context, history),
          });

          fullResponse = response.content;
          saveChatHistoryAndUsage();

          // SSE 형식으로 한 번에 전송
          startSSE(request, reply);
          sendSSE(reply, { content: response.content, done: false });
          sendSSE(reply, { content: '', done: true });
          endSSE(reply);
          return;
        }

        // SSE 스트리밍 시작
        startSSE(request, reply);

        // 스트리밍
        await provider.streamChat(
          {
            message,
            history,
            systemPrompt: buildChatPrompt(context, history),
          },
          (chunk) => {
            // 청크 내용 수집
            if (chunk.content) {
              fullResponse += chunk.content;
            }
            sendSSE(reply, chunk);
          }
        );

        // 스트리밍 완료 후 ChatHistory 저장
        saveChatHistoryAndUsage();

        endSSE(reply);
      } catch (error) {
        logger.error('AI stream error:', error);

        // 이미 스트리밍 시작된 경우 에러 이벤트 전송
        if (reply.raw.headersSent) {
          sendSSEError(reply, error instanceof Error ? error : 'Unknown error');
          return;
        }

        return reply.status(500).send({
          error: 'AI service error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/ai/analyze-report:
   *   post:
   *     tags: [AI]
   *     summary: 학습 리포트 AI 분석
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: AI 분석 결과
   */
  fastify.post(
    '/analyze-report',
    { preHandler: [fastify.requireDbUser, checkAIUsage] },
    async (request, reply) => {
      try {
        const parsed = analyzeReportSchema.safeParse(request.body);
        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid request',
            details: parsed.error.issues,
          });
        }

        const data = parsed.data;
        const userId = request.user?.dbUser?.id;
        const provider = await getCurrentProvider();

        // 데이터를 자연어로 변환
        const studyHours = Math.floor(data.totalStudyTime / 3600);
        const studyMinutes = Math.floor((data.totalStudyTime % 3600) / 60);
        const studyTimeStr = studyHours > 0
          ? `${studyHours}시간 ${studyMinutes}분`
          : `${studyMinutes}분`;

        // 요일별 활동 분석
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const maxWeekdayIdx = data.weekdayActivity.indexOf(Math.max(...data.weekdayActivity));
        const mostActiveDay = weekdays[maxWeekdayIdx];

        // 시간대별 활동 분석
        const timeSlots = ['새벽(0-6시)', '오전(6-12시)', '오후(12-18시)', '저녁(18-24시)'];
        const slotTotals = [
          data.hourlyActivity.slice(0, 6).reduce((a, b) => a + b, 0),
          data.hourlyActivity.slice(6, 12).reduce((a, b) => a + b, 0),
          data.hourlyActivity.slice(12, 18).reduce((a, b) => a + b, 0),
          data.hourlyActivity.slice(18, 24).reduce((a, b) => a + b, 0),
        ];
        const maxSlotIdx = slotTotals.indexOf(Math.max(...slotTotals));
        const mostActiveSlot = timeSlots[maxSlotIdx];

        // 취약 개념 정리
        const weakConceptList = Object.entries(data.weakConcepts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([concept, count]) => `${concept}(${count}회 오답)`)
          .join(', ');

        // === 로그인 사용자용 추가 데이터 수집 ===
        let enrichedContext = '';

        if (userId) {
          // 병렬 쿼리 실행 (N+1 최적화)
          const [recentNotes, recentChats, languageStats, recentWrongs] = await Promise.all([
            // 1. 최근 저장한 노트 (개념 메모)
            prisma.userNote.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 5,
              include: {
                lesson: { select: { title: true } },
              },
            }),

            // 2. 최근 AI 질문들
            prisma.chatHistory.findMany({
              where: { userId },
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: { question: true, context: true },
            }),

            // 3. 언어별 학습 시간 (LessonActivity + Lesson + Chapter + Language)
            prisma.$queryRaw<{ language: string; totalSeconds: bigint }[]>`
              SELECT
                l."language_id" as language,
                SUM(la.duration) as "totalSeconds"
              FROM lesson_activities la
              JOIN lessons le ON la.lesson_id = le.id
              JOIN chapters c ON le.chapter_id = c.id
              JOIN languages l ON c.language_id = l.id
              WHERE la.user_id = ${userId}::uuid
                AND la.duration IS NOT NULL
              GROUP BY l."language_id"
              ORDER BY "totalSeconds" DESC
            `,

            // 4. 최근 틀린 퀴즈 상세
            prisma.quizAttempt.findMany({
              where: { userId, isCorrect: false },
              orderBy: { createdAt: 'desc' },
              take: 3,
              include: {
                quiz: {
                  select: {
                    question: true,
                    lesson: { select: { title: true } },
                  },
                },
              },
            }),
          ]);

          // 컨텍스트 문자열 생성
          if (recentNotes.length > 0) {
            const notesList = recentNotes
              .map((n) => `- "${n.concept}" (${n.lesson.title}${n.isFromWrong ? ', 오답 후 저장' : ''})`)
              .join('\n');
            enrichedContext += `\n### 최근 저장한 개념 노트\n${notesList}\n`;
          }

          if (recentChats.length > 0) {
            const chatsList = recentChats
              .map((c) => `- "${c.question.slice(0, 50)}${c.question.length > 50 ? '...' : ''}"`)
              .join('\n');
            enrichedContext += `\n### 최근 AI에게 한 질문\n${chatsList}\n`;
          }

          if (languageStats.length > 0) {
            const langList = languageStats
              .map((l) => {
                const mins = Math.round(Number(l.totalSeconds) / 60);
                return `- ${l.language.toUpperCase()}: ${mins}분`;
              })
              .join('\n');
            enrichedContext += `\n### 언어별 학습 시간\n${langList}\n`;
          }

          if (recentWrongs.length > 0) {
            const wrongList = recentWrongs
              .map((w) => `- "${w.quiz.question.slice(0, 40)}..." (${w.quiz.lesson.title})`)
              .join('\n');
            enrichedContext += `\n### 최근 틀린 문제\n${wrongList}\n`;
          }
        }

        const userMessage = `## 학생 학습 데이터

### 기본 통계
- 총 학습 시간: ${studyTimeStr}
- 학습 세션 수: ${data.totalSessions}회
- AI 질문 횟수: ${data.aiQuestions}회

### 퀴즈 성과
- 총 퀴즈: ${data.quizStats.total}문제
- 정답: ${data.quizStats.correct}문제
- 정답률: ${data.quizStats.accuracy}%
- 최근 오답 수: ${data.recentWrongCount}개

### 취약 개념 (오답 기준)
${weakConceptList || '(데이터 없음)'}

### 학습 패턴
- 가장 활발한 요일: ${mostActiveDay}요일
- 선호 시간대: ${mostActiveSlot}
${data.streakDays !== undefined ? `- 연속 학습: ${data.streakDays}일` : ''}
${enrichedContext}
위 데이터를 바탕으로 이 학생에게 맞춤형 학습 피드백을 4-8문장의 줄글로 작성해주세요.
${enrichedContext ? '특히 저장한 노트, AI 질문, 최근 틀린 문제를 참고하여 구체적인 조언을 해주세요.' : ''}`;

        const response = await provider.chat({
          message: userMessage,
          history: [],
          systemPrompt: buildReportAnalysisPrompt(),
        });

        // AI 사용량 기록 (구독 시스템 제거됨)

        return {
          analysis: response.content,
          provider: response.provider,
        };
      } catch (error) {
        logger.error('AI analyze-report error:', error);
        return reply.status(500).send({
          error: 'AI service error',
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  );

  /**
   * @swagger
   * /api/ai/health:
   *   get:
   *     tags: [AI]
   *     summary: AI 서비스 상태 체크
   *     responses:
   *       200:
   *         description: 서비스 상태
   */
  fastify.get('/health', async (request, reply) => {
    const provider = await getCurrentProvider();
    const available = await provider.isAvailable();

    return {
      status: available ? 'ok' : 'degraded',
      provider: provider.type,
      providerName: provider.name,
      available,
    };
  });

  /**
   * @swagger
   * /api/ai/providers:
   *   get:
   *     tags: [AI]
   *     summary: 사용 가능한 Provider 목록
   *     responses:
   *       200:
   *         description: Provider 목록
   */
  fastify.get('/providers', async (request, reply) => {
    try {
      const providers = await getAllProviders();
      const settings = getSettings();

      return {
        current: settings.currentProvider,
        providers,
      };
    } catch (error) {
      return reply.status(500).send({
        error: 'Failed to get providers',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  /**
   * @swagger
   * /api/ai/providers/switch:
   *   post:
   *     tags: [AI]
   *     summary: Provider 변경
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - provider
   *             properties:
   *               provider:
   *                 type: string
   *                 enum: [deepseek]
   *     responses:
   *       200:
   *         description: Provider 변경 성공
   */
  fastify.post('/providers/switch', async (request, reply) => {
    try {
      const parsed = switchProviderSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({
          error: 'Invalid request',
          details: parsed.error.issues,
        });
      }

      const { provider } = parsed.data;
      await setCurrentProvider(provider as ProviderType);

      const currentProvider = await getCurrentProvider();
      return {
        success: true,
        current: currentProvider.type,
        name: currentProvider.name,
      };
    } catch (error) {
      return reply.status(400).send({
        error: 'Failed to switch provider',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export { aiRoutes };
