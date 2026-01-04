/**
 * Tailwind CSS Configuration
 * CodeInsight - Playful & Gamified (크림 배경 + 네온 액센트)
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  safelist: [
    'h-3', 'w-3', 'h-6', 'w-6', 'h-8', 'w-8',
  ],

  theme: {
    extend: {
      // ============================================
      // Colors
      // ============================================
      colors: {
        // Background (크림 계열 유지)
        bg: {
          DEFAULT: 'var(--color-bg)',
          elevated: 'var(--color-bg-elevated)',
          tertiary: 'var(--color-bg-tertiary)',
          hover: 'var(--color-bg-hover)',
        },
        // Text
        text: {
          DEFAULT: 'var(--color-text)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          muted: 'var(--color-text-muted)',
        },
        // Primary (골드/옐로우)
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
          muted: 'var(--color-primary-muted)',
        },
        // Border
        border: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border-light)',
          dark: 'var(--color-border-dark)',
        },

        // ============================================
        // 직접 색상 - 배경
        // ============================================
        cream: '#FFF9F0',
        peach: '#FFE8D6',
        'warm-white': '#FFFBF5',
        sand: '#F5EFE7',

        // ============================================
        // 네온 액센트 컬러
        // ============================================
        neon: {
          yellow: '#FFD700',
          cyan: '#00D9FF',
          pink: '#FF6B9D',
          purple: '#A855F7',
          green: '#10B981',
          orange: '#F97316',
          blue: '#3B82F6',
        },

        // ============================================
        // Accent colors (component usage)
        // ============================================
        accent: {
          orange: '#F97316',
          coral: '#FF6B9D',
          red: '#EF4444',
          purple: '#A855F7',
        },

        // ============================================
        // 다크 카드 (코드 에디터용)
        // ============================================
        dark: {
          base: '#1a1a2e',
          elevated: '#16213e',
          border: '#374151',
        },

        // ============================================
        // 메모리 시각화 (네온)
        // ============================================
        stack: {
          bg: 'rgba(0, 217, 255, 0.1)',
          border: '#00D9FF',
          text: '#0891B2',
        },
        heap: {
          bg: 'rgba(249, 115, 22, 0.1)',
          border: '#F97316',
          text: '#C2410C',
        },
        'code-seg': {
          bg: 'rgba(168, 85, 247, 0.1)',
          border: '#A855F7',
          text: '#7C3AED',
        },
        'data-seg': {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: '#10B981',
          text: '#047857',
        },

        // ============================================
        // 퀴즈 피드백
        // ============================================
        quiz: {
          'correct-bg': 'rgba(16, 185, 129, 0.15)',
          'correct-border': '#10B981',
          'correct-text': '#047857',
          'incorrect-bg': 'rgba(239, 68, 68, 0.15)',
          'incorrect-border': '#EF4444',
          'incorrect-text': '#DC2626',
          'hint-bg': 'rgba(255, 215, 0, 0.2)',
          'hint-border': '#FFD700',
          'hint-text': '#B45309',
        },

        // ============================================
        // 게이미피케이션
        // ============================================
        xp: '#FFD700',
        level: '#00D9FF',
        streak: '#F97316',
        badge: {
          bronze: '#CD7F32',
          silver: '#C0C0C0',
          gold: '#FFD700',
          platinum: '#E5E4E2',
        },
      },

      // ============================================
      // Fonts
      // ============================================
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },

      // ============================================
      // Typography
      // ============================================
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },

      // ============================================
      // Shadows (네온 글로우 포함)
      // ============================================
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'focus': '0 0 0 3px rgba(255, 215, 0, 0.3)',
        // 네온 글로우
        'neon-yellow': '0 0 20px rgba(255, 215, 0, 0.4)',
        'neon-cyan': '0 0 20px rgba(0, 217, 255, 0.4)',
        'neon-pink': '0 0 20px rgba(255, 107, 157, 0.4)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.4)',
        'neon-green': '0 0 20px rgba(16, 185, 129, 0.4)',
        'neon-orange': '0 0 20px rgba(249, 115, 22, 0.4)',
      },

      // ============================================
      // Border Radius
      // ============================================
      borderRadius: {
        'sm': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },

      // ============================================
      // Animations
      // ============================================
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.4s ease',
        'bounce-in': 'bounceIn 0.5s ease',
        'shake': 'shake 0.3s ease',
        'pulse-glow': 'pulseGlow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        bounceIn: {
          '0%': { opacity: '0', transform: 'scale(0.3)' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        sparkle: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
}
