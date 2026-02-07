/**
 * Admin Routes (Fastify)
 *
 * WHY: Admin API 라우트 정의
 * SECURITY: requireAdmin preHandler로 모든 라우트 보호
 */

import { FastifyPluginAsync } from 'fastify';
import { AdminService } from './admin.service';
import { logger } from '../../utils/logger';

const adminService = new AdminService();

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // 모든 admin 라우트에 requireAdmin preHandler 적용
  fastify.addHook('preHandler', fastify.requireAdmin);

  /**
   * GET /api/admin/stats
   * 전체 통계 조회
   */
  fastify.get('/stats', async (_request, reply) => {
    try {
      const stats = await adminService.getStats();
      return stats;
    } catch (error) {
      logger.error('Get stats error:', error);
      return reply.status(500).send({ error: 'Failed to fetch statistics' });
    }
  });

  /**
   * GET /api/admin/users?page=1&limit=20
   * 사용자 목록 조회
   */
  fastify.get('/users', async (request, reply) => {
    try {
      const query = request.query as { page?: string; limit?: string };
      const page = parseInt(query.page || '1', 10);
      const limit = parseInt(query.limit || '20', 10);

      const result = await adminService.getUsers(page, limit);
      return result;
    } catch (error) {
      logger.error('Get users error:', error);
      return reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  /**
   * GET /api/admin/submissions?limit=50
   * 최근 제출 내역 조회
   */
  fastify.get('/submissions', async (request, reply) => {
    try {
      const query = request.query as { limit?: string };
      const limit = parseInt(query.limit || '50', 10);

      const submissions = await adminService.getRecentSubmissions(limit);
      return submissions;
    } catch (error) {
      logger.error('Get submissions error:', error);
      return reply.status(500).send({ error: 'Failed to fetch submissions' });
    }
  });

  /**
   * GET /api/admin/system
   * 시스템 상태 조회
   */
  fastify.get('/system', async (_request, reply) => {
    try {
      const status = await adminService.getSystemStatus();
      return status;
    } catch (error) {
      logger.error('Get system status error:', error);
      return reply.status(500).send({ error: 'Failed to fetch system status' });
    }
  });

  /**
   * GET /api/admin/ai-usage
   * AI 사용량 통계 (DeepSeek 비용 추정)
   */
  fastify.get('/ai-usage', async (_request, reply) => {
    try {
      const usage = await adminService.getAIUsageStats();
      return usage;
    } catch (error) {
      logger.error('Get AI usage error:', error);
      return reply.status(500).send({ error: 'Failed to fetch AI usage statistics' });
    }
  });

  /**
   * GET /api/admin/reports
   * 신고 통계 + 최근 목록
   */
  fastify.get('/reports', async (_request, reply) => {
    try {
      const reportStats = await adminService.getReportStats();
      return reportStats;
    } catch (error) {
      logger.error('Get report stats error:', error);
      return reply.status(500).send({ error: 'Failed to fetch report statistics' });
    }
  });

  /**
   * PATCH /api/admin/reports/:id/resolve
   * 신고 상태 변경 (open → resolved)
   */
  fastify.patch('/reports/:id/resolve', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      await adminService.resolveReport(id);
      return { success: true };
    } catch (error) {
      logger.error('Resolve report error:', error);
      return reply.status(500).send({ error: 'Failed to resolve report' });
    }
  });
};
