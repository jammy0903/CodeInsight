/**
 * Reports Service - 신고/문의 API 호출
 */

import { api } from './api/axios';
import { config } from '@/config';

export interface ReportData {
  type: 'lesson' | 'general';
  category: string;
  message?: string;
  lessonId?: string;
  userAgent?: string;
}

export async function sendReport(data: ReportData) {
  return api.post(config.api.endpoints.reports, {
    ...data,
    userAgent: navigator.userAgent,
  });
}
