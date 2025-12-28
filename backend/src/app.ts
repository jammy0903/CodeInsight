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

// Rate limiting 적용
app.use('/api/problems', rateLimit, problemRoutes);
app.use('/api/memory', executeRateLimit, memoryRoutes);
app.use('/api/submissions', rateLimit, submissionRoutes);
app.use('/api/users', authRateLimit, userRoutes);
app.use('/api/c', executeRateLimit, cRoutes);
app.use('/api/ai', aiRateLimit, aiRoutes);

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
