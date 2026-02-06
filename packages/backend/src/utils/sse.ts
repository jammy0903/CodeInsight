/**
 * SSE (Server-Sent Events) 유틸리티
 *
 * Fastify에서 SSE 스트리밍 시 CORS 헤더를 자동으로 포함
 * reply.raw.writeHead()는 Fastify CORS 플러그인을 우회하므로
 * 이 유틸리티를 사용해야 CORS가 정상 작동함
 */

import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * SSE 스트리밍 응답 시작
 * CORS 헤더 자동 포함
 */
export function startSSE(request: FastifyRequest, reply: FastifyReply): void {
  const origin = request.headers.origin || '*';

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    // CORS 헤더 (Fastify 플러그인 우회)
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  });
}

/**
 * SSE 데이터 전송
 */
export function sendSSE(reply: FastifyReply, data: unknown): void {
  reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * SSE 스트리밍 종료
 */
export function endSSE(reply: FastifyReply): void {
  reply.raw.end();
}

/**
 * SSE 에러 전송 후 종료
 */
export function sendSSEError(reply: FastifyReply, error: Error | string): void {
  const message = error instanceof Error ? error.message : error;
  sendSSE(reply, { error: message, done: true });
  endSSE(reply);
}
