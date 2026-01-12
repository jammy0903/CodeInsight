/**
 * PDF Report Color Constants
 *
 * WHY: html2pdf.js (html2canvas) doesn't support oklch() colors.
 * Tailwind v4 uses oklch by default, so we must use explicit RGB hex values
 * for all colors in the PDF export area.
 *
 * USAGE: Use these colors in style props instead of Tailwind color classes.
 */

export const REPORT_COLORS = {
  // Text colors
  text: {
    primary: '#111827',   // gray-900
    secondary: '#1f2937', // gray-800
    muted: '#6b7280',     // gray-500
    light: '#9ca3af',     // gray-400
  },

  // Background colors
  bg: {
    white: '#ffffff',
    light: '#f9fafb',     // gray-50
    muted: '#f3f4f6',     // gray-100
  },

  // Border colors
  border: {
    light: '#e5e7eb',     // gray-200
    muted: '#d1d5db',     // gray-300
  },

  // Accent colors (charts, badges)
  accent: {
    purple: '#8b5cf6',    // purple-500
    purpleLight: '#f3e8ff', // purple-100
    purpleDark: '#7e22ce',  // purple-700
    amber: '#f59e0b',     // amber-500
    amberLight: '#fef3c7', // amber-100
    amberDark: '#b45309',  // amber-700
    green: '#16a34a',     // green-600
    greenLight: '#bbf7d0', // green-200
    red: '#dc2626',       // red-600
    redLight: '#fecaca',  // red-200
  },

  // Chart specific
  chart: {
    active: '#8b5cf6',
    inactive: '#e5e7eb',
  },

  // Calendar grass colors
  grass: {
    empty: '#f3f4f6',
    level1: '#bbf7d0',
    level2: '#4ade80',
    level3: '#16a34a',
  },
} as const;
