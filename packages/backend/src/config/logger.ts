/**
 * Winston 로깅 설정
 * - 구조화된 로그 (JSON 포맷)
 * - 파일 로테이션 (일별)
 * - 환경별 설정 (dev/prod)
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { config } from './env';

// 로그 디렉토리
const LOG_DIR = path.join(process.cwd(), 'logs');

// 로그 포맷 정의
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console 포맷 (개발용 - 가독성 좋게)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Transport: 에러 로그 (error.log)
const errorFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '14d', // 14일 보관
  format: logFormat,
});

// Transport: 전체 로그 (combined.log)
const combinedFileTransport = new DailyRotateFile({
  filename: path.join(LOG_DIR, 'combined-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat,
});

// Transport: 콘솔 (개발 환경)
const consoleTransport = new winston.transports.Console({
  format: consoleFormat,
});

// Winston Logger 생성
export const logger = winston.createLogger({
  level: config.server.isDev ? 'debug' : 'info',
  format: logFormat,
  transports: [
    errorFileTransport,
    combinedFileTransport,
    ...(config.server.isDev ? [consoleTransport] : []),
  ],
  // Unhandled exception/rejection 처리
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// HTTP 요청 로깅용 헬퍼
export const logRequest = (req: { method: string; url: string; ip?: string }, duration?: number) => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    duration: duration ? `${duration}ms` : undefined,
  });
};

// 에러 로깅용 헬퍼
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error(error.message, {
    stack: error.stack,
    ...context,
  });
};
