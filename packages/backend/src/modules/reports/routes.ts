/**
 * Report Routes - 사용자 신고/문의 이메일 전송
 *
 * Brevo REST API를 통해 관리자에게 이메일을 전송합니다.
 * 인증 불필요 (비로그인 사용자도 신고 가능)
 */

import { FastifyPluginAsync } from 'fastify';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const ADMIN_EMAIL = 'l89192164@gmail.com';

interface ReportBody {
  type: 'lesson' | 'general';
  category: string;
  message?: string;
  lessonId?: string;
  userAgent?: string;
}

function buildEmailHtml(body: ReportBody): string {
  const typeLabel = body.type === 'lesson' ? '레슨 신고' : '일반 문의';
  const lines = [
    `<h2>CodeInsight ${typeLabel}</h2>`,
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

export const reportRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', {
    schema: {
      tags: ['Reports'],
      summary: '신고/문의 이메일 전송',
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

    if (!env.BREVO_API_KEY) {
      logger.warn('BREVO_API_KEY not configured, skipping email');
      return reply.status(503).send({ error: 'Email service not configured' });
    }

    const subjectPrefix = body.type === 'lesson' ? '레슨 신고' : '일반 문의';
    const subject = `[CodeInsight] ${subjectPrefix}: ${body.category}`;

    try {
      const response = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'api-key': env.BREVO_API_KEY,
        },
        body: JSON.stringify({
          sender: { name: 'CodeInsight Reports', email: ADMIN_EMAIL },
          to: [{ email: ADMIN_EMAIL, name: 'Admin' }],
          subject,
          htmlContent: buildEmailHtml(body),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Brevo API error:', { status: response.status, body: errorText });
        return reply.status(502).send({ error: 'Failed to send email' });
      }

      logger.info('Report email sent', { type: body.type, category: body.category });
      return reply.status(200).send({ success: true });
    } catch (error) {
      logger.error('Report email failed:', error);
      return reply.status(500).send({ error: 'Failed to send email' });
    }
  });
};
