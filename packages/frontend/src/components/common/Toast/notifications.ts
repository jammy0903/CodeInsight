/**
 * Centralized Toast Notification Module
 *
 * 모든 에러/성공 메시지를 중앙화하여 관리합니다.
 * 사용법: import { notify } from '@/components/common/Toast/notifications';
 */

import { toast } from 'sonner';
import i18n from 'i18next';

// Helper to get translated string
const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options) as string;
let lastUnauthorizedToastAt = 0;
const UNAUTHORIZED_TOAST_COOLDOWN_MS = 15000;

// ============================================
// 타입 정의
// ============================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotifyOptions {
  duration?: number;
  description?: string;
}

// ============================================
// 기본 알림 함수
// ============================================

export const notify = {
  success: (message: string, options?: NotifyOptions) => {
    toast.success(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
    });
  },

  error: (message: string, options?: NotifyOptions) => {
    toast.error(message, {
      duration: options?.duration ?? 5000,
      description: options?.description,
    });
  },

  warning: (message: string, options?: NotifyOptions) => {
    toast.warning(message, {
      duration: options?.duration ?? 4000,
      description: options?.description,
    });
  },

  info: (message: string, options?: NotifyOptions) => {
    toast.info(message, {
      duration: options?.duration ?? 3000,
      description: options?.description,
    });
  },
};

// ============================================
// 시뮬레이터 관련 알림
// ============================================

export const notifySimulator = {
  /** 시뮬레이션 타임아웃 */
  timeout: (language: string) => {
    notify.error(t('toast.simulation_timeout', { lang: language }), {
      description: t('toast.simulation_timeout_desc'),
      duration: 6000,
    });
  },

  /** 컴파일 에러 */
  compileError: (language: string, errorMessage?: string) => {
    notify.error(t('toast.compile_error', { lang: language }), {
      description: errorMessage || t('toast.syntax_error'),
      duration: 6000,
    });
  },

  /** Emscripten 컴파일 에러 (상세 - 여러 에러 표시) */
  compilationErrors: (language: string, errors: string[]) => {
    const errorList = errors.slice(0, 3).map((err) => `• ${err}`).join('\n');
    const moreCount = errors.length > 3 ? `\n\n+${t('toast.more_errors', { count: errors.length - 3 })}` : '';

    toast.error(t('toast.compile_error', { lang: language }), {
      description: errorList + moreCount,
      duration: 8000,
    });
  },

  /** 런타임 에러 */
  runtimeError: (language: string, errorMessage?: string) => {
    notify.error(t('toast.runtime_error', { lang: language }), {
      description: errorMessage || t('toast.runtime_error_desc'),
      duration: 6000,
    });
  },

  /** 시뮬레이션 실패 (일반) */
  simulationFailed: (language: string, errorMessage?: string) => {
    notify.error(t('toast.simulation_failed', { lang: language }), {
      description: errorMessage || t('errors.unknown'),
      duration: 5000,
    });
  },

  /** 위험한 코드 감지 */
  dangerousCode: () => {
    notify.warning(t('toast.dangerous_code'), {
      description: t('toast.dangerous_code_desc'),
      duration: 5000,
    });
  },

  /** 시뮬레이션 성공 */
  simulationSuccess: (language: string) => {
    notify.success(t('toast.simulation_complete', { lang: language }), {
      duration: 2000,
    });
  },
};

// ============================================
// 네트워크/API 관련 알림
// ============================================

export const notifyNetwork = {
  /** 네트워크 연결 끊김 */
  disconnected: () => {
    notify.error(t('toast.network_disconnected'), {
      description: t('toast.check_internet'),
      duration: 6000,
    });
  },

  /** 요청 타임아웃 */
  requestTimeout: () => {
    notify.error(t('toast.request_timeout'), {
      description: t('toast.request_timeout_desc'),
      duration: 5000,
    });
  },

  /** 서버 에러 (500) */
  serverError: () => {
    notify.error(t('toast.server_error'), {
      description: t('toast.server_error_desc'),
      duration: 5000,
    });
  },

  /** 서비스 이용 불가 (503) */
  serviceUnavailable: () => {
    notify.error(t('toast.service_unavailable'), {
      description: t('toast.service_unavailable_desc'),
      duration: 5000,
    });
  },

  /** 인증 실패 (401) */
  unauthorized: () => {
    const now = Date.now();
    if (now - lastUnauthorizedToastAt < UNAUTHORIZED_TOAST_COOLDOWN_MS) return;
    lastUnauthorizedToastAt = now;
    notify.warning(t('toast.auth_expired'), {
      description: t('toast.please_login_again'),
      duration: 4000,
    });
  },

  /** 권한 없음 (403) */
  forbidden: () => {
    notify.warning(t('toast.no_permission'), {
      description: t('toast.no_permission_desc'),
      duration: 4000,
    });
  },

  /** 요청 제한 (429) */
  rateLimited: () => {
    notify.warning(t('toast.rate_limited'), {
      description: t('toast.rate_limited_desc'),
      duration: 5000,
    });
  },
};

// ============================================
// Admin 관련 알림
// ============================================

export const notifyAdmin = {
  /** 설정 저장 성공 */
  settingsSaved: () => {
    notify.success(t('toast.settings_saved'), {
      duration: 2000,
    });
  },

  /** 설정 저장 실패 */
  settingsFailed: (errorMessage?: string) => {
    notify.error(t('toast.settings_failed'), {
      description: errorMessage || t('toast.settings_failed_desc'),
      duration: 5000,
    });
  },

  /** 레슨 로드 실패 */
  lessonLoadFailed: (lessonId: string) => {
    notify.error(t('toast.lesson_load_failed'), {
      description: t('toast.lesson_load_failed_desc', { lessonId }),
      duration: 5000,
    });
  },
};

// ============================================
// 유틸리티: 에러 메시지 파싱 후 알림
// ============================================

/**
 * 시뮬레이터 에러 메시지를 파싱하여 적절한 알림을 표시합니다.
 */
export function handleSimulatorError(language: string, errorMessage: unknown) {
  const upperLang = (language || 'Unknown').toUpperCase();

  // errorMessage가 문자열이 아닐 경우 안전하게 변환
  let messageStr: string;
  if (typeof errorMessage === 'string') {
    messageStr = errorMessage;
  } else if (errorMessage && typeof errorMessage === 'object') {
    // 객체인 경우 message 속성 확인 또는 JSON 문자열화
    const errorWithMessage = errorMessage as { message?: string };
    messageStr = errorWithMessage.message || JSON.stringify(errorMessage);
  } else {
    messageStr = String(errorMessage || 'Unknown error');
  }

  const lowerError = messageStr.toLowerCase();

  if (lowerError.includes('time limit exceeded') || lowerError.includes('timeout')) {
    notifySimulator.timeout(upperLang);
  } else if (lowerError.includes('compilation error') || lowerError.includes('syntax error')) {
    notifySimulator.compileError(upperLang, messageStr);
  } else if (lowerError.includes('runtime error')) {
    notifySimulator.runtimeError(upperLang, messageStr);
  } else if (lowerError.includes('dangerous')) {
    notifySimulator.dangerousCode();
  } else {
    notifySimulator.simulationFailed(upperLang, messageStr);
  }
}

/**
 * API 에러 코드에 따라 적절한 알림을 표시합니다.
 */
export function handleAPIError(status: number, message?: string) {
  switch (status) {
    case 0:
      notifyNetwork.disconnected();
      break;
    case 401:
      notifyNetwork.unauthorized();
      break;
    case 403:
      notifyNetwork.forbidden();
      break;
    case 429:
      notifyNetwork.rateLimited();
      break;
    case 500:
      notifyNetwork.serverError();
      break;
    case 503:
      notifyNetwork.serviceUnavailable();
      break;
    default:
      if (message) {
        notify.error(t('toast.error_occurred'), { description: message });
      } else {
        notify.error(t('errors.unknown'));
      }
  }
}
