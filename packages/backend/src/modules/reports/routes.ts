/**
 * Report Routes - 사용자 신고/문의 (DB 저장 + 이메일 전송)
 *
 * - requireDbUser: 로그인 필수
 * - DB에 Report 레코드 저장 + Brevo 이메일 전송 (병렬)
 * - 이메일 실패해도 DB 저장은 유지됨
 */

import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_EMAIL = 'jammy@inctech.co.kr';
const ADMIN_EMAIL = 'l89192164@gmail.com';

interface ReportBody {
  type: 'lesson' | 'general';
  category: string;
  message?: string;
  lessonId?: string;
  userAgent?: string;
}

/** lessonId prefix → 언어 매핑 */
function extractLanguage(lessonId: string | undefined): string | null {
  if (!lessonId) return null;
  const prefix = lessonId.split('-')[0];
  const map: Record<string, string> = {
    c: 'c',
    py: 'python',
    js: 'javascript',
    java: 'java',
  };
  return map[prefix] ?? null;
}

function buildEmailHtml(body: ReportBody, nickname: string): string {
  const typeLabel = body.type === 'lesson' ? '레슨 신고' : '일반 문의';
  const lines = [
    `<h2>CodeInsight ${typeLabel}</h2>`,
    `<p><strong>신고자:</strong> ${nickname}</p>`,
    `<p><strong>유형:</strong> ${typeLabel}</p>`,
    `<p><strong>카테고리:</strong> ${body.category}</p>`,
  ];

  if (body.lessonId) {
    lines.push(`<p><strong>레슨 ID:</strong> ${body.lessonId}</p>`);
  }
  if (body.message) {
    lines.push(`<p><strong>상세 내용:</strong></p><p>${body.message.replace(/\n/g, '<br>')}</p>`);
  }
  if (body.userAgent) {
    lines.push(`<hr><p style="font-size:12px;color:#888"><strong>User-Agent:</strong> ${body.userAgent}</p>`);
  }

  return lines.join('\n');
}

async function sendEmail(body: ReportBody, nickname: string): Promise<void> {
  if (!env.BREVO_API_KEY) {
    logger.warn('BREVO_API_KEY not configured, skipping email');
    return;
  }

  const subjectPrefix = body.type === 'lesson' ? '레슨 신고' : '일반 문의';
  const subject = `[CodeInsight] ${subjectPrefix}: ${body.category}`;

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'CodeInsight Reports', email: SENDER_EMAIL },
      to: [{ email: ADMIN_EMAIL, name: 'Admin' }],
      subject,
      htmlContent: buildEmailHtml(body, nickname),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API ${response.status}: ${errorText}`);
  }
}

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', {
    preHandler: [fastify.requireDbUser],
    schema: {
      tags: ['Reports'],
      summary: '신고/문의 전송 (DB 저장 + 이메일)',
      body: {
        type: 'object',
        required: ['type', 'category'],
        properties: {
          type: { type: 'string', enum: ['lesson', 'general'] },
          category: { type: 'string', maxLength: 200 },
          message: { type: 'string', maxLength: 2000 },
          lessonId: { type: 'string', maxLength: 100 },
          userAgent: { type: 'string', maxLength: 500 },
        },
      },
    },
  }, async (request, reply) => {
    const body = request.body as ReportBody;
    const userId = request.user!.dbUser!.id;
    const nickname = request.user!.dbUser!.nickname;

    try {
      // 1인당 하루 3건 제한
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayCount = await prisma.report.count({
        where: { userId, createdAt: { gte: todayStart } },
      });
      if (todayCount >= 3) {
        return reply.status(429).send({ error: 'Daily report limit reached (max 3)' });
      }

      // DB 저장과 이메일 전송 병렬 처리
      const [dbResult, emailResult] = await Promise.allSettled([
        prisma.report.create({
          data: {
            userId,
            type: body.type,
            category: body.category,
            message: body.message || null,
            lessonId: body.type === 'lesson' ? (body.lessonId || null) : null,
            language: body.type === 'lesson' ? extractLanguage(body.lessonId) : null,
          },
        }),
        sendEmail(body, nickname),
      ]);

      if (dbResult.status === 'rejected') {
        logger.error('Report DB save failed:', dbResult.reason);
      }
      if (emailResult.status === 'rejected') {
        logger.error('Report email failed:', emailResult.reason);
      }

      // DB 저장이 실패하면 에러 반환
      if (dbResult.status === 'rejected') {
        return reply.status(500).send({ error: 'Failed to save report' });
      }

      logger.info('Report submitted', { type: body.type, category: body.category, nickname });
      return reply.status(200).send({ success: true });
    } catch (error) {
      logger.error('Report submission failed:', error);
      return reply.status(500).send({ error: 'Failed to submit report' });
    }
  });
};
