import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { initializeFirebase } from './config/firebase';
import { swaggerSpec } from './config/swagger';
import { rateLimit, authRateLimit, aiRateLimit, executeRateLimit } from './middleware';
import { problemRoutes } from './modules/problems/routes';
import { memoryRoutes } from './modules/memory/routes';
import { submissionRoutes } from './modules/submissions/routes';
import { userRoutes } from './modules/users/routes';
import { cRoutes } from './modules/c/routes';
import { aiRoutes } from './modules/ai/routes';
import { courseRoutes } from './modules/courses/routes';
import adminRoutes from './modules/admin/admin.routes';

// Firebase Admin 초기화
initializeFirebase();

const app = express();

// Middleware
app.use(cors({
  origin: config.server.isDev ? true : config.server.corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: config.server.jsonBodyLimit }));

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
app.use('/api/v1/memory', executeRateLimit, memoryRoutes);
app.use('/api/v1/submissions', rateLimit, submissionRoutes);
app.use('/api/v1/users', authRateLimit, userRoutes);
app.use('/api/v1/c', executeRateLimit, cRoutes);
app.use('/api/v1/ai', aiRateLimit, aiRoutes);
app.use('/api/v1/courses', rateLimit, courseRoutes);
app.use('/api/v1/admin', rateLimit, adminRoutes);

// =============================================
// Legacy Routes (버전 없는 요청 → v1로 리다이렉트)
// =============================================
app.use('/api/problems', (req, res) => {
  res.redirect(301, `/api/v1/problems${req.path === '/' ? '' : req.path}`);
});
app.use('/api/memory', (req, res) => {
  res.redirect(301, `/api/v1/memory${req.path === '/' ? '' : req.path}`);
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
app.use('/api/admin', (req, res) => {
  res.redirect(301, `/api/v1/admin${req.path === '/' ? '' : req.path}`);
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
  console.error('❌ Unhandled error:', err.message);
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: config.server.isDev ? err.message : undefined
  });
});

// Start server
app.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
});

export default app;
