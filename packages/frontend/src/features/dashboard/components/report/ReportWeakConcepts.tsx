/**
 * ReportWeakConcepts - PDF report weak concepts analysis
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { AlertTriangle } from 'lucide-react';
import { REPORT_COLORS } from './colors';
import { useTranslation } from 'react-i18next';

interface ReportWeakConceptsProps {
  concepts: Record<string, number>;
}

export function ReportWeakConcepts({ concepts }: ReportWeakConceptsProps) {
  const { t } = useTranslation();
  // Sort by wrong count descending, take top 5
  const sortedConcepts = Object.entries(concepts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  if (sortedConcepts.length === 0) {
    return null;
  }

  const maxCount = sortedConcepts[0]?.[1] || 1;

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    padding: '1rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
  };

  const badgeStyle = {
    width: '1.5rem',
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '9999px',
    backgroundColor: REPORT_COLORS.accent.amberLight,
    color: REPORT_COLORS.accent.amberDark,
    fontSize: '0.75rem',
    fontWeight: 500,
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <AlertTriangle style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.accent.amber }} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary }}>{t("dashboard.txt_a377c0")}</h2>
      </div>

      <div style={cardStyle}>
        <p style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted, marginBottom: '1rem' }}>
          오답 기준 상위 {sortedConcepts.length}개 개념입니다. 집중 복습을 권장합니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sortedConcepts.map(([concept, count], index) => {
            const percentage = Math.round((count / maxCount) * 100);
            return (
              <div key={concept} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={badgeStyle}>
                  {index + 1}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: REPORT_COLORS.text.secondary }}>{concept}</span>
                    <span style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted }}>{count}회 오답</span>
                  </div>
                  <div style={{ height: '0.5rem', backgroundColor: REPORT_COLORS.border.light, borderRadius: '9999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: REPORT_COLORS.accent.amber,
                        borderRadius: '9999px',
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
