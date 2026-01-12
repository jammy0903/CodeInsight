/**
 * 테마 색상 정의
 *
 * soft: 라벤더-피치 (부드러운 여성적 톤)
 * dark: 남색-차콜 (시크한 남성적 톤)
 * minimal: 브라운-베이지 (중성적 미니멀 톤)
 */

export type ThemeType = 'soft' | 'dark' | 'minimal';

export interface ThemeColors {
  // 설명 패널
  explanation: {
    bgGradient: string;
    headerGradient: string;
    headerBorder: string;
    text: string;
    textMuted: string;
    buttonBg: string;
    buttonBorder: string;
    buttonText: string;
    buttonHover: string;
    counterBg: string;
    quizGradient: string;
    quizHoverGradient: string;
    quizText: string;
  };
  // 메모리 패널 (향후 확장)
  memory: {
    stackBg: string;
    heapBg: string;
    dataBg: string;
    textBg: string;
  };
}

export const themes: Record<ThemeType, ThemeColors> = {
  // 소프트 테마 (라벤더-피치)
  soft: {
    explanation: {
      bgGradient: 'linear-gradient(135deg, #faf8fc 0%, #fdf8f6 100%)',
      headerGradient: 'linear-gradient(90deg, #f3eef8 0%, #fceef0 100%)',
      headerBorder: '#ebe4ed',
      text: '#7c6b8a',
      textMuted: '#a08eb0',
      buttonBg: 'rgba(255,255,255,0.8)',
      buttonBorder: '#e9d5ff',
      buttonText: '#a855f7',
      buttonHover: '#faf5ff',
      counterBg: 'rgba(255,255,255,0.8)',
      quizGradient: 'linear-gradient(to right, #fde68a, #fdba74)',
      quizHoverGradient: 'linear-gradient(to right, #fcd34d, #fb923c)',
      quizText: '#92400e',
    },
    memory: {
      stackBg: '#FFF5F7',
      heapBg: '#e8f5ec',
      dataBg: '#ede9f5',
      textBg: '#e5f0f3',
    },
  },

  // 다크 테마 (남색-차콜)
  dark: {
    explanation: {
      bgGradient: 'linear-gradient(135deg, #1e2433 0%, #252d3d 100%)',
      headerGradient: 'linear-gradient(90deg, #2a3548 0%, #1f2937 100%)',
      headerBorder: '#374151',
      text: '#e5e7eb',
      textMuted: '#9ca3af',
      buttonBg: 'rgba(55, 65, 81, 0.8)',
      buttonBorder: '#4b5563',
      buttonText: '#60a5fa',
      buttonHover: '#374151',
      counterBg: 'rgba(55, 65, 81, 0.8)',
      quizGradient: 'linear-gradient(to right, #3b82f6, #6366f1)',
      quizHoverGradient: 'linear-gradient(to right, #2563eb, #4f46e5)',
      quizText: '#ffffff',
    },
    memory: {
      stackBg: '#1f2937',
      heapBg: '#1a2e1f',
      dataBg: '#1e1b2e',
      textBg: '#1a2530',
    },
  },

  // 미니멀 테마 (브라운-베이지)
  minimal: {
    explanation: {
      bgGradient: 'linear-gradient(135deg, #faf9f7 0%, #f5f3f0 100%)',
      headerGradient: 'linear-gradient(90deg, #ebe8e3 0%, #e8e4de 100%)',
      headerBorder: '#d6d0c7',
      text: '#5c534a',
      textMuted: '#8a8279',
      buttonBg: 'rgba(255,255,255,0.9)',
      buttonBorder: '#c9c2b8',
      buttonText: '#78716c',
      buttonHover: '#f5f5f4',
      counterBg: 'rgba(255,255,255,0.9)',
      quizGradient: 'linear-gradient(to right, #d6d3d1, #a8a29e)',
      quizHoverGradient: 'linear-gradient(to right, #a8a29e, #78716c)',
      quizText: '#44403c',
    },
    memory: {
      stackBg: '#faf8f6',
      heapBg: '#f5f2ee',
      dataBg: '#f0ede8',
      textBg: '#ebe8e3',
    },
  },
};

export const themeLabels: Record<ThemeType, string> = {
  soft: '소프트',
  dark: '다크',
  minimal: '미니멀',
};
