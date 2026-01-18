/**
 * AIInsights - AI 기반 학습 분석 인사이트
 */

import { motion } from 'framer-motion';
import { Sparkles, Bot, RefreshCw } from 'lucide-react';
import type { ReportAnalysisResponse } from '@/services/analytics';

interface AIInsightsProps {
  analysis: ReportAnalysisResponse | null;
  loading: boolean;
  onRequestAnalysis: () => void;
}

export function AIInsights({ analysis, loading, onRequestAnalysis }: AIInsightsProps) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--theme-dashboard-title)]">AI 학습 분석</h3>
            <p className="text-sm text-[var(--theme-dashboard-text-muted)]">개인화된 학습 인사이트</p>
          </div>
        </div>

        {analysis && (
          <button
            onClick={onRequestAnalysis}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        )}
      </div>

      {!analysis && !loading && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-4">
            AI가 학습 패턴을 분석하고 맞춤형 조언을 제공합니다
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRequestAnalysis}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
          >
            <Sparkles className="w-4 h-4 inline-block mr-2" />
            AI 분석 받기
          </motion.button>
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 mx-auto mb-4 rounded-full border-4 border-purple-200 border-t-purple-500"
          />
          <p className="text-[var(--theme-dashboard-text-muted)]">학습 패턴을 분석하고 있어요...</p>
        </div>
      )}

      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* 분석 내용 */}
          <div className="bg-white/70 rounded-lg p-4 prose prose-sm max-w-none">
            {analysis.analysis.split('\n').map((paragraph, index) => {
              if (!paragraph.trim()) return null;

              // 마크다운 스타일 파싱 (간단한 버전)
              const isHeading = paragraph.startsWith('#');
              const isBullet = paragraph.startsWith('-') || paragraph.startsWith('•');

              if (isHeading) {
                return (
                  <h4 key={index} className="text-base font-semibold text-[var(--theme-dashboard-title)] mt-3 mb-2">
                    {paragraph.replace(/^#+\s*/, '')}
                  </h4>
                );
              }

              if (isBullet) {
                return (
                  <p key={index} className="text-[var(--theme-dashboard-title)] ml-4 my-1">
                    • {paragraph.replace(/^[-•]\s*/, '')}
                  </p>
                );
              }

              return (
                <p key={index} className="text-[var(--theme-dashboard-title)] my-2 leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* 제공자 표시 */}
          <p className="text-xs text-[var(--theme-dashboard-text-muted)] text-right">
            Powered by {analysis.provider}
          </p>
        </motion.div>
      )}
    </div>
  );
}
