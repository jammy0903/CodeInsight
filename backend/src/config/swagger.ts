/**
 * Swagger/OpenAPI Configuration
 */
import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
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
    ],
    tags: [
      { name: 'Problems', description: '문제 관련 API' },
      { name: 'Submissions', description: '제출 기록 API' },
      { name: 'Users', description: '사용자 관리 API' },
      { name: 'C Runner', description: 'C 코드 실행/채점 API' },
      { name: 'Memory', description: '메모리 시뮬레이션 API' },
    ],
    components: {
      schemas: {
        Problem: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'clxyz123' },
            number: { type: 'integer', example: 1000 },
            title: { type: 'string', example: 'A+B' },
            description: { type: 'string' },
            difficulty: { type: 'string', example: 'bronze' },
            tags: { type: 'array', items: { type: 'string' } },
            testCases: { type: 'string', description: 'JSON stringified array' },
          },
        },
        Submission: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            problemId: { type: 'string' },
            code: { type: 'string' },
            verdict: {
              type: 'string',
              enum: ['accepted', 'wrong_answer', 'compile_error', 'runtime_error', 'time_limit']
            },
            executionTime: { type: 'integer', description: 'ms' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            firebaseUid: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        RunRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', description: 'C source code' },
            stdin: { type: 'string', default: '' },
            timeout: { type: 'integer', default: 5, description: 'seconds' },
          },
        },
        RunResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                compiled: { type: 'boolean' },
                executed: { type: 'boolean' },
                stdout: { type: 'string' },
                stderr: { type: 'string' },
                exit_code: { type: 'integer' },
                execution_time_ms: { type: 'integer' },
              },
            },
            error: { type: 'string' },
          },
        },
        JudgeRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string' },
            problemId: { type: 'string' },
            firebaseUid: { type: 'string' },
            testCases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  input: { type: 'string' },
                  output: { type: 'string' },
                },
              },
            },
          },
        },
        JudgeResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                verdict: { type: 'string' },
                passed: { type: 'integer' },
                total: { type: 'integer' },
                execution_time_ms: { type: 'integer' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
        MemoryTraceRequest: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', description: 'C source code to trace' },
            stdin: { type: 'string', default: '' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/modules/*/routes.ts', './src/app.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
