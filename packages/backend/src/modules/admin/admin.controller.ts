/**
 * Admin Controller
 *
 * WHY: Admin API 엔드포인트 처리
 * PATTERN: Service에서 데이터 가져와서 응답만
 */

import { Response } from 'express';
import { AdminRequest } from '../../middleware/adminAuth';
import { AdminService } from './admin.service';
import { logger } from '../../utils/logger';

const adminService = new AdminService();

/**
 * GET /api/admin/stats
 * 전체 통계 조회
 */
export async function getStats(req: AdminRequest, res: Response): Promise<void> {
  try {
    const stats = await adminService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
}

/**
 * GET /api/admin/users?page=1&limit=20
 * 사용자 목록 조회
 */
export async function getUsers(req: AdminRequest, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await adminService.getUsers(page, limit);
    res.json(result);
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
}

/**
 * GET /api/admin/submissions?limit=50
 * 최근 제출 내역 조회
 */
export async function getSubmissions(req: AdminRequest, res: Response): Promise<void> {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    const submissions = await adminService.getRecentSubmissions(limit);
    res.json(submissions);
  } catch (error) {
    logger.error('Get submissions error:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
}

/**
 * GET /api/admin/system
 * 시스템 상태 조회
 */
export async function getSystemStatus(req: AdminRequest, res: Response): Promise<void> {
  try {
    const status = await adminService.getSystemStatus();
    res.json(status);
  } catch (error) {
    logger.error('Get system status error:', error);
    res.status(500).json({ error: 'Failed to fetch system status' });
  }
}
