/**
 * ReportHeader - PDF report header with logo, title, date
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { Code2 } from 'lucide-react';
import { REPORT_COLORS } from './colors';

interface ReportHeaderProps {
  period?: string;
}

export function ReportHeader({ period = '1y' }: ReportHeaderProps) {
  const periodLabel = {
    '7d': '7일',
    '30d': '30일',
    '90d': '90일',
    '1y': '1년',
  }[period] || '1년';

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      className="keep-together"
      style={{
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: `2px solid ${REPORT_COLORS.border.light}`,
      }}
    >
      {/* Logo and Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div
          style={{
            width: '3rem',
            height: '3rem',
            background: 'linear-gradient(to bottom right, #8b5cf6, #4f46e5)',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Code2 style={{ width: '1.75rem', height: '1.75rem', color: '#ffffff' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: REPORT_COLORS.text.primary }}>
            CodeInsight
          </h1>
          <p style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>
            학습 분석 리포트
          </p>
        </div>
      </div>

      {/* Report Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>생성일:</span>
          <span>{today}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 500 }}>분석 기간:</span>
          <span>최근 {periodLabel}</span>
        </div>
      </div>
    </div>
  );
}
