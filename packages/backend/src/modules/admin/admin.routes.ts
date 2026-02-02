/**
 * Admin Routes
 *
 * WHY: Admin API 라우트 정의
 * SECURITY: requireAdmin 미들웨어로 모든 라우트 보호
 */

import { Router } from 'express';
import { requireAdmin } from '../../middleware/adminAuth';
import * as adminController from './admin.controller';

const router = Router();

// 모든 admin 라우트는 requireAdmin 미들웨어 필요
router.use(requireAdmin);

// 통계
router.get('/stats', adminController.getStats);

// 사용자 관리
router.get('/users', adminController.getUsers);

// 제출 내역
router.get('/submissions', adminController.getSubmissions);

// 시스템 상태
router.get('/system', adminController.getSystemStatus);

// AI 사용량 통계 (DeepSeek 비용)
router.get('/ai-usage', adminController.getAIUsage);

export default router;
