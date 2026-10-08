/**
 * Fastify Swagger 플러그인
 *
 * @fastify/swagger + @fastify/swagger-ui 설정
 * OpenAPI 3.0 스펙 자동 생성
 */

import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { config } from '../config';

const swaggerPlugin: FastifyPluginAsync = async (fastify) => {
  // OpenAPI 스펙 설정
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'C-OSINE API',
        version: '1.0.0',
        description: 'C 프로그래밍 학습 플랫폼 API 문서',
        contact: {
          name: 'jammy0903',
          email: 'fuso3367@kakao.com',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.server.port}`,
          description: 'Development server',
        },
        {
          url: 'https://codeinsight-backend.onrender.com',
          description: 'Production server',
        },
      ],
      tags: [
        { name: 'Courses', description: '강좌 및 레슨 API' },
        { name: 'Simulators', description: '코드 실행/시각화 API' },
      ],
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
          RateLimitError: {
            type: 'object',
            properties: {
              error: { type: 'string', example: 'rate_limit_exceeded' },
              message: { type: 'string' },
              retryAfter: { type: 'integer', description: 'Seconds until retry allowed' },
            },
          },
        },
      },
    },
  });

  // Swagger UI 설정
  await fastify.register(swaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // OpenAPI JSON 엔드포인트 (자동으로 /api-docs/json에 제공됨)
  // 추가로 /api-docs.json 경로도 지원
  fastify.get('/api-docs.json', {
    schema: { hide: true },
  }, async (request, reply) => {
    return fastify.swagger();
  });
};

export default fp(swaggerPlugin, {
  name: 'swagger',
  fastify: '5.x',
});
