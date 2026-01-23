import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { logger } from './config/logger';
import { initializeFirebase } from './config/firebase';
import { swaggerSpec } from './config/swagger';
import { rateLimit, authRateLimit, aiRateLimit, executeRateLimit, requestLogger } from './middleware';
import { problemRoutes } from './modules/problems/routes';
import { cSimulatorRoutes } from './modules/simulators/c/routes';
import { aiRoutes } from './modules/ai/routes';
import { courseRoutes } from './modules/courses/routes';
import { analyticsRoutes } from './modules/analytics/routes';
import { notesRoutes } from './modules/notes/routes';
import { gamificationRoutes } from './modules/gamification';
import adminRoutes from './modules/admin/admin.routes';
import { userRoutes } from './modules/users/routes';
import pythonSimulatorRoutes from './modules/simulators/python/routes';
import { javaSimulatorRoutes } from './modules/simulators/java/routes';
import { lessonContentLoader } from './services/lessonContentLoader';

// Firebase Admin 초기화
initializeFirebase();

// Lesson Content 초기화 (서버 시작 시 JSON 파일 로드)
lessonContentLoader.loadAll().catch((err) => {
  logger.error('Failed to load lesson contents:', err);
  process.exit(1);
});

const app = express();

// Middleware
app.use(cors({
  origin: config.server.isDev ? true : config.server.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: config.server.jsonBodyLimit }));
app.use(requestLogger);

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'CodeInsight Backend API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// =============================================
// API v1 Routes (현재 버전)
// =============================================
app.use('/api/v1/problems', rateLimit, problemRoutes);
app.use('/api/v1/simulators/c', executeRateLimit, cSimulatorRoutes);
app.use('/api/v1/simulators/python', executeRateLimit, pythonSimulatorRoutes);
app.use('/api/v1/simulators/java', executeRateLimit, javaSimulatorRoutes);
app.use('/api/v1/ai', aiRateLimit, aiRoutes);
app.use('/api/v1/courses', rateLimit, courseRoutes);
app.use('/api/v1/analytics', rateLimit, analyticsRoutes);
app.use('/api/v1/notes', rateLimit, notesRoutes);
app.use('/api/v1/gamification', rateLimit, gamificationRoutes);
app.use('/api/v1/admin', rateLimit, adminRoutes);
app.use('/api/v1/users', rateLimit, userRoutes);

// =============================================
// Legacy Routes (버전 없는 요청 → v1로 리다이렉트)
// =============================================
app.use('/api/problems', (req, res) => {
  res.redirect(301, `/api/v1/problems${req.path === '/' ? '' : req.path}`);
});
app.use('/api/memory', (req, res) => {
  res.redirect(301, `/api/v1/simulators/c/trace${req.path === '/' ? '' : req.path}`);
});
app.use('/api/submissions', (req, res) => {
  res.redirect(301, `/api/v1/submissions${req.path === '/' ? '' : req.path}`);
});
app.use('/api/users', (req, res) => {
  res.redirect(301, `/api/v1/users${req.path === '/' ? '' : req.path}`);
});
app.use('/api/c', (req, res) => {
  res.redirect(301, `/api/v1/c${req.path === '/' ? '' : req.path}`);
});
app.use('/api/ai', (req, res) => {
  res.redirect(301, `/api/v1/ai${req.path === '/' ? '' : req.path}`);
});
app.use('/api/courses', (req, res) => {
  res.redirect(301, `/api/v1/courses${req.path === '/' ? '' : req.path}`);
});
app.use('/api/analytics', (req, res) => {
  res.redirect(301, `/api/v1/analytics${req.path === '/' ? '' : req.path}`);
});
app.use('/api/notes', (req, res) => {
  res.redirect(301, `/api/v1/notes${req.path === '/' ? '' : req.path}`);
});
app.use('/api/admin', (req, res) => {
  res.redirect(301, `/api/v1/admin${req.path === '/' ? '' : req.path}`);
});
app.use('/api/gamification', (req, res) => {
  res.redirect(301, `/api/v1/gamification${req.path === '/' ? '' : req.path}`);
});

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'C-OSINE API Docs'
}));

// OpenAPI JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.isDev ? err.message : undefined
  });
});

// Start server
app.listen(config.server.port, () => {
  logger.info(`Server running on http://localhost:${config.server.port}`);
});

export default app;
