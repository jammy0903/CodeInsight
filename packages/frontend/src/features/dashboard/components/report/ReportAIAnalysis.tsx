/**
 * ReportAIAnalysis - AI-generated personalized learning feedback
 * Uses inline styles with RGB colors for html2pdf.js compatibility
 */

import { useEffect, useState, useMemo } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import type { AnalyticsSummary } from '@/services/analytics';
import { getReportAnalysis } from '@/services/analytics';
import { REPORT_COLORS } from './colors';

interface ReportAIAnalysisProps {
  data: AnalyticsSummary;
}

export function ReportAIAnalysis({ data }: ReportAIAnalysisProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prepare request data from AnalyticsSummary
  const requestData = useMemo(() => ({
    totalStudyTime: data.totalStudyTime,
    totalSessions: data.totalSessions,
    quizStats: {
      total: data.quizStats.total,
      correct: data.quizStats.correct,
      accuracy: data.quizStats.accuracy,
    },
    aiQuestions: data.aiQuestions,
    weakConcepts: data.weakConcepts,
    weekdayActivity: data.weekdayActivity,
    hourlyActivity: data.hourlyActivity,
    recentWrongCount: data.recentWrongAnswers?.length || 0,
  }), [data]);

  const fetchAnalysis = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getReportAnalysis(requestData);
      if (result) {
        setAnalysis(result.analysis);
      } else {
        setError('분석을 가져올 수 없습니다');
      }
    } catch (err) {
      setError('AI 분석 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardStyle = {
    background: 'linear-gradient(135deg, #faf5ff 0%, #eef2ff 50%, #f0fdf4 100%)',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    border: `1px solid ${REPORT_COLORS.accent.purpleLight}`,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  };

  const iconBoxStyle = {
    width: '2.25rem',
    height: '2.25rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
  };

  const textStyle = {
    fontSize: '0.9375rem',
    lineHeight: '1.75',
    color: REPORT_COLORS.text.secondary,
  };

  const loadingStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    padding: '2rem',
    color: REPORT_COLORS.text.muted,
  };

  const errorStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '1.5rem',
    color: REPORT_COLORS.accent.red,
    fontSize: '0.875rem',
  };

  const retryButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    padding: '0.375rem 0.75rem',
    fontSize: '0.75rem',
    color: REPORT_COLORS.accent.purple,
    backgroundColor: REPORT_COLORS.bg.white,
    border: `1px solid ${REPORT_COLORS.accent.purpleLight}`,
    borderRadius: '0.375rem',
    cursor: 'pointer',
  };

  return (
    <div className="keep-together" style={{ marginBottom: '2rem' }}>
      <div style={cardStyle}>
        {/* Decorative gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle at top right, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <Sparkles style={{ width: '1.125rem', height: '1.125rem', color: '#ffffff' }} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: REPORT_COLORS.text.primary }}>
              AI 학습 코치 분석
            </h2>
            <p style={{ fontSize: '0.75rem', color: REPORT_COLORS.text.muted }}>
              학습 데이터 기반 맞춤 피드백
            </p>
          </div>
        </div>

        {isLoading && (
          <div style={loadingStyle}>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>AI가 학습 패턴을 분석하고 있어요...</span>
          </div>
        )}

        {error && !isLoading && (
          <div style={errorStyle}>
            <span>{error}</span>
            <button
              onClick={fetchAnalysis}
              style={retryButtonStyle}
            >
              <RefreshCw style={{ width: '0.75rem', height: '0.75rem' }} />
              다시 시도
            </button>
          </div>
        )}

        {analysis && !isLoading && (
          <p style={textStyle}>{analysis}</p>
        )}
      </div>
    </div>
  );
}
