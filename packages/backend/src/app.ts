/**
 * Fastify 애플리케이션 진입점
 *
 * Express에서 Fastify로 마이그레이션됨 (2026-02)
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from './config';
import { logger } from './config/logger';
import { initializeFirebase } from './config/firebase';
import { authPlugin, rateLimitPlugin, swaggerPlugin } from './plugins';
import { lessonContentLoader } from './services/lessonContentLoader';

// Route imports
import { problemRoutes } from './modules/problems/routes';
import { cSimulatorRoutes } from './modules/simulators/c/routes';
import { aiRoutes } from './modules/ai/routes';
import { courseRoutes } from './modules/courses/routes';
import { analyticsRoutes } from './modules/analytics/routes';
import { notesRoutes } from './modules/notes/routes';
import { gamificationRoutes } from './modules/gamification';
import { adminRoutes } from './modules/admin/admin.routes';
import { userRoutes } from './modules/users/routes';
import pythonSimulatorRoutes from './modules/simulators/python/routes';
import { javaSimulatorRoutes } from './modules/simulators/java/routes';
import javascriptSimulatorRoutes from './modules/simulators/javascript/routes';
import { standaloneQuizzesRoutes } from './modules/standalone-quizzes/routes';
import { submissionRoutes } from './modules/submissions/routes';
import { reportRoutes } from './modules/reports/routes';

// Firebase Admin 초기화
try {
  initializeFirebase();
  logger.info('Firebase initialized successfully');
} catch (error) {
  logger.error('Firebase initialization failed:', error);
  logger.warn('App will continue without Firebase authentication');
}

// Lesson Content 초기화 (서버 시작 시 파일 경로 스캔)
lessonContentLoader.scanFilePaths().catch((err) => {
  logger.error('Failed to load lesson contents:', err);
  logger.warn('App will continue without pre-loaded lesson contents');
});

// Fastify 인스턴스 생성
const app: FastifyInstance = Fastify({
  logger: false, // 커스텀 로거 사용
  bodyLimit: 10 * 1024 * 1024, // 10MB (config.server.jsonBodyLimit)
  trustProxy: true,
});

// CORS 설정
const capacitorOrigins = ['capacitor://localhost', 'https://localhost', 'http://localhost'];
const allowedOrigins = [...config.server.corsOrigins, ...capacitorOrigins];

app.register(cors, {
  origin: config.server.isDev ? true : (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

// 플러그인 등록
app.register(authPlugin);
app.register(rateLimitPlugin);
app.register(swaggerPlugin);

// Request 로깅 훅
app.addHook('onResponse', (request, reply, done) => {
  logger.info('HTTP Request', {
    method: request.method,
    url: request.url,
    statusCode: reply.statusCode,
    duration: `${Math.round(reply.elapsedTime)}ms`,
    ip: request.ip,
  });
  done();
});

// =============================================
// 기본 라우트
// =============================================
app.get('/', async () => {
  return { status: 'ok', service: 'CodeInsight Backend API' };
});

app.get('/health', async () => {
  return { status: 'healthy' };
});

// =============================================
// API v1 Routes
// =============================================
app.register(problemRoutes, { prefix: '/api/v1/problems' });
app.register(cSimulatorRoutes, { prefix: '/api/v1/simulators/c' });
app.register(pythonSimulatorRoutes, { prefix: '/api/v1/simulators/python' });
app.register(javaSimulatorRoutes, { prefix: '/api/v1/simulators/java' });
app.register(javascriptSimulatorRoutes, { prefix: '/api/v1/simulators/javascript' });
app.register(aiRoutes, { prefix: '/api/v1/ai' });
app.register(courseRoutes, { prefix: '/api/v1/courses' });
app.register(analyticsRoutes, { prefix: '/api/v1/analytics' });
app.register(notesRoutes, { prefix: '/api/v1/notes' });
app.register(gamificationRoutes, { prefix: '/api/v1/gamification' });
app.register(adminRoutes, { prefix: '/api/v1/admin' });
app.register(userRoutes, { prefix: '/api/v1/users' });
app.register(standaloneQuizzesRoutes, { prefix: '/api/v1/standalone-quizzes' });
app.register(submissionRoutes, { prefix: '/api/v1/submissions' });
app.register(reportRoutes, { prefix: '/api/v1/reports' });

// =============================================
// Legacy Routes (버전 없는 요청 → v1로 리다이렉트)
// =============================================
const legacyRedirects: Record<string, string> = {
  '/api/problems': '/api/v1/problems',
  '/api/memory': '/api/v1/simulators/c/trace',
  '/api/submissions': '/api/v1/submissions',
  '/api/users': '/api/v1/users',
  '/api/c': '/api/v1/simulators/c',
  '/api/ai': '/api/v1/ai',
  '/api/courses': '/api/v1/courses',
  '/api/analytics': '/api/v1/analytics',
  '/api/notes': '/api/v1/notes',
  '/api/admin': '/api/v1/admin',
  '/api/gamification': '/api/v1/gamification',
  '/api/standalone-quizzes': '/api/v1/standalone-quizzes',
};

Object.entries(legacyRedirects).forEach(([oldPath, newPath]) => {
  app.all(`${oldPath}/*`, async (request, reply) => {
    const subPath = request.url.replace(oldPath, '');
    return reply.redirect(`${newPath}${subPath}`);
  });
  app.all(oldPath, async (_request, reply) => {
    return reply.redirect(newPath);
  });
});

// =============================================
// Error Handlers
// =============================================

// 404 handler
app.setNotFoundHandler(async (request, reply) => {
  return reply.status(404).send({ error: 'Not found', path: request.url });
});

// Global error handler
app.setErrorHandler(async (error, request, reply) => {
  const err = error as Error & { statusCode?: number };
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: request.url,
    method: request.method,
  });

  const statusCode = err.statusCode || 500;
  return reply.status(statusCode).send({
    error: statusCode === 500 ? 'Internal server error' : err.message,
    message: config.server.isDev ? err.message : undefined,
  });
});

// =============================================
// Server Start
// =============================================
const start = async () => {
  try {
    await app.listen({ port: config.server.port, host: '0.0.0.0' });
    logger.info(`Server running on http://localhost:${config.server.port}`);
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export default app;
