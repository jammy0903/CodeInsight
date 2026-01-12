/**
 * ReportWrongAnswers - PDF report recent wrong answers table
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { XCircle } from 'lucide-react';
import { REPORT_COLORS } from './colors';

interface WrongAnswer {
  quizId: string;
  question?: string;
  userAnswer: string;
  createdAt: string;
}

interface ReportWrongAnswersProps {
  answers: WrongAnswer[];
}

export function ReportWrongAnswers({ answers }: ReportWrongAnswersProps) {
  if (!answers || answers.length === 0) {
    return null;
  }

  // Take latest 10
  const recentAnswers = answers.slice(0, 10);

  const cardStyle = {
    backgroundColor: REPORT_COLORS.bg.light,
    borderRadius: '0.5rem',
    border: `1px solid ${REPORT_COLORS.border.light}`,
    overflow: 'hidden',
  };

  const headerCellStyle = {
    textAlign: 'left' as const,
    padding: '0.5rem 1rem',
    fontWeight: 500,
    color: REPORT_COLORS.text.muted,
    backgroundColor: REPORT_COLORS.bg.muted,
    borderBottom: `1px solid ${REPORT_COLORS.border.light}`,
  };

  const cellStyle = {
    padding: '0.5rem 1rem',
    borderBottom: `1px solid ${REPORT_COLORS.bg.muted}`,
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <XCircle style={{ width: '1.25rem', height: '1.25rem', color: REPORT_COLORS.accent.red }} />
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.secondary }}>최근 오답 기록</h2>
        <span style={{ fontSize: '0.875rem', color: REPORT_COLORS.text.muted }}>({recentAnswers.length}개)</span>
      </div>

      <div style={cardStyle}>
        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={headerCellStyle}>문제</th>
              <th style={headerCellStyle}>내 답변</th>
              <th style={headerCellStyle}>일시</th>
            </tr>
          </thead>
          <tbody>
            {recentAnswers.map((answer, index) => {
              const date = new Date(answer.createdAt);
              const dateStr = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
              });
              const timeStr = date.toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <tr key={`${answer.quizId}-${index}`}>
                  <td style={{ ...cellStyle, color: REPORT_COLORS.text.secondary }}>
                    {answer.question || `Quiz #${answer.quizId.slice(-6)}`}
                  </td>
                  <td style={{ ...cellStyle, color: REPORT_COLORS.accent.red }}>{answer.userAnswer}</td>
                  <td style={{ ...cellStyle, color: REPORT_COLORS.text.muted }}>
                    {dateStr} {timeStr}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted, marginTop: '0.5rem' }}>
        * 오답 문제를 다시 풀어보세요. 같은 실수를 반복하지 않는 것이 중요합니다.
      </p>
    </div>
  );
}
