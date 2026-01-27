/**
 * Centralized Toast Notification Module
 *
 * 모든 에러/성공 메시지를 중앙화하여 관리합니다.
 * 사용법: import { notify } from '@/components/common/Toast/notifications';
 */

import { toast } from 'sonner';

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
// AI Provider 관련 알림
// ============================================

export const notifyAI = {
  /** Ollama 연결 끊김 */
  ollamaDisconnected: () => {
    notify.error('Ollama 연결 끊김', {
      description: '로컬 Ollama 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.',
      duration: 6000,
    });
  },

  /** DeepSeek 연결 실패 */
  deepseekDisconnected: () => {
    notify.error('DeepSeek 연결 실패', {
      description: 'DeepSeek API에 연결할 수 없습니다. 네트워크 상태를 확인하세요.',
      duration: 6000,
    });
  },

  /** Gemini 연결 실패 */
  geminiDisconnected: () => {
    notify.error('Gemini 연결 실패', {
      description: 'Google Gemini API에 연결할 수 없습니다.',
      duration: 6000,
    });
  },

  /** AI Provider 전환 성공 */
  providerSwitched: (providerName: string) => {
    notify.success(`${providerName}로 전환됨`, {
      duration: 2000,
    });
  },

  /** AI Provider 전환 실패 */
  providerSwitchFailed: (providerName: string) => {
    notify.error(`${providerName} 전환 실패`, {
      description: '잠시 후 다시 시도해주세요.',
    });
  },

  /** API 크레딧 부족 */
  creditExhausted: () => {
    notify.warning('API 크레딧 부족', {
      description: 'AI 기능 사용을 위해 크레딧을 충전해주세요.',
      duration: 6000,
    });
  },

  /** 백엔드 서버 연결 실패 */
  backendDisconnected: () => {
    notify.error('서버 연결 실패', {
      description: '백엔드 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
      duration: 6000,
    });
  },
};

// ============================================
// 시뮬레이터 관련 알림
// ============================================

export const notifySimulator = {
  /** 시뮬레이션 타임아웃 */
  timeout: (language: string) => {
    notify.error(`${language} 시뮬레이션 타임아웃`, {
      description: '코드 실행 시간이 10초를 초과했습니다. 무한 루프가 있는지 확인하세요.',
      duration: 6000,
    });
  },

  /** 컴파일 에러 */
  compileError: (language: string, errorMessage?: string) => {
    notify.error(`${language} 컴파일 에러`, {
      description: errorMessage || '코드에 문법 오류가 있습니다.',
      duration: 6000,
    });
  },

  /** Emscripten 컴파일 에러 (상세 - 여러 에러 표시) */
  compilationErrors: (language: string, errors: string[]) => {
    const errorList = errors.slice(0, 3).map((err) => `• ${err}`).join('\n');
    const moreCount = errors.length > 3 ? `\n\n+${errors.length - 3}개 더` : '';

    toast.error(`${language} 컴파일 에러`, {
      description: errorList + moreCount,
      duration: 8000,
    });
  },

  /** 런타임 에러 */
  runtimeError: (language: string, errorMessage?: string) => {
    notify.error(`${language} 런타임 에러`, {
      description: errorMessage || '코드 실행 중 오류가 발생했습니다.',
      duration: 6000,
    });
  },

  /** 시뮬레이션 실패 (일반) */
  simulationFailed: (language: string, errorMessage?: string) => {
    notify.error(`${language} 시뮬레이션 실패`, {
      description: errorMessage || '알 수 없는 오류가 발생했습니다.',
      duration: 5000,
    });
  },

  /** 위험한 코드 감지 */
  dangerousCode: () => {
    notify.warning('위험한 코드 감지', {
      description: '보안상 실행할 수 없는 코드가 포함되어 있습니다.',
      duration: 5000,
    });
  },

  /** 시뮬레이션 성공 */
  simulationSuccess: (language: string) => {
    notify.success(`${language} 시뮬레이션 완료`, {
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
    notify.error('네트워크 연결 끊김', {
      description: '인터넷 연결을 확인해주세요.',
      duration: 6000,
    });
  },

  /** 요청 타임아웃 */
  requestTimeout: () => {
    notify.error('요청 시간 초과', {
      description: '서버 응답이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요.',
      duration: 5000,
    });
  },

  /** 서버 에러 (500) */
  serverError: () => {
    notify.error('서버 오류', {
      description: '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      duration: 5000,
    });
  },

  /** 서비스 이용 불가 (503) */
  serviceUnavailable: () => {
    notify.error('서비스 일시 중단', {
      description: '서비스가 일시적으로 이용 불가합니다. 잠시 후 다시 시도해주세요.',
      duration: 5000,
    });
  },

  /** 인증 실패 (401) */
  unauthorized: () => {
    notify.warning('인증 만료', {
      description: '다시 로그인해주세요.',
      duration: 4000,
    });
  },

  /** 권한 없음 (403) */
  forbidden: () => {
    notify.warning('접근 권한 없음', {
      description: '이 기능에 대한 접근 권한이 없습니다.',
      duration: 4000,
    });
  },

  /** 요청 제한 (429) */
  rateLimited: () => {
    notify.warning('요청 제한', {
      description: '너무 많은 요청을 보냈습니다. 잠시 후 다시 시도해주세요.',
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
    notify.success('설정이 저장되었습니다', {
      duration: 2000,
    });
  },

  /** 설정 저장 실패 */
  settingsFailed: (errorMessage?: string) => {
    notify.error('설정 저장 실패', {
      description: errorMessage || '설정을 저장하는 중 오류가 발생했습니다.',
      duration: 5000,
    });
  },

  /** 레슨 로드 실패 */
  lessonLoadFailed: (lessonId: string) => {
    notify.error('레슨 로드 실패', {
      description: `레슨 "${lessonId}"를 불러올 수 없습니다.`,
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
    messageStr = (errorMessage as any).message || JSON.stringify(errorMessage);
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
    case 402:
      notifyAI.creditExhausted();
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
        notify.error('오류 발생', { description: message });
      } else {
        notify.error('알 수 없는 오류가 발생했습니다');
      }
  }
}
