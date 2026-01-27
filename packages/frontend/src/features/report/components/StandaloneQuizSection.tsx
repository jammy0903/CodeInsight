/**
 * StandaloneQuizSection - Standalone Quiz 통계 섹션
 *
 * WHY: 독립 퀴즈 시스템의 취약 개념 분석 표시
 * - 언어별 취약 개념 Top 5
 * - 오답률, 시도 횟수, 관련 문제
 * - 해당 퀴즈로 바로 이동 링크
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, TrendingDown, Loader2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getWeakConcepts, type WeakConcept } from '@/services/standalone-quiz';
import { logger } from '@/utils/logger';

const LANGUAGE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  c: { name: 'C', icon: 'C', color: '#0077B6' },
  javascript: { name: 'JavaScript', icon: '⚡', color: '#F59E0B' },
  java: { name: 'Java', icon: '☕', color: '#EC4899' },
  python: { name: 'Python', icon: '🐍', color: '#3776AB' },
};

export function StandaloneQuizSection() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('c');
  const [weakConcepts, setWeakConcepts] = useState<WeakConcept[]>([]);
  const [loading, setLoading] = useState(true);

  const langInfo = LANGUAGE_INFO[selectedLanguage];

  useEffect(() => {
    loadWeakConcepts();
  }, [selectedLanguage]);

  const loadWeakConcepts = async () => {
    try {
      setLoading(true);
      const concepts = await getWeakConcepts(selectedLanguage, 5);
      setWeakConcepts(concepts);
    } catch (error) {
      logger.error('Failed to load weak concepts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-md">
            <TrendingDown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[var(--theme-dashboard-title)]">퀴즈 취약 개념</h3>
            <p className="text-sm text-[var(--theme-dashboard-text-muted)]">오답률이 높은 개념을 다시 학습하세요</p>
          </div>
        </div>
      </div>

      {/* Language Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {Object.entries(LANGUAGE_INFO).map(([lang, info]) => (
          <button
            key={lang}
            onClick={() => setSelectedLanguage(lang)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedLanguage === lang
                ? 'bg-white shadow-md'
                : 'bg-white/50 hover:bg-white/70'
            }`}
            style={{
              borderWidth: '2px',
              borderColor: selectedLanguage === lang ? info.color : 'transparent',
            }}
          >
            <span className="text-lg">{info.icon}</span>
            <span style={{ color: selectedLanguage === lang ? info.color : 'var(--theme-dashboard-text-muted)' }}>
              {info.name}
            </span>
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      )}

      {/* No Data */}
      {!loading && weakConcepts.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-[var(--theme-dashboard-text-muted)] mb-4">
            아직 {langInfo.name} 퀴즈를 풀지 않았어요
          </p>
          <Link
            to={`/quiz/ox/${selectedLanguage}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            퀴즈 풀러 가기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Weak Concepts List */}
      {!loading && weakConcepts.length > 0 && (
        <div className="space-y-4">
          {weakConcepts.map((concept, index) => (
            <motion.div
              key={concept.concept}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-4 shadow-sm"
            >
              {/* Concept Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{getConceptEmoji(index)}</span>
                    <h4 className="font-bold text-lg text-[var(--theme-dashboard-title)]">
                      {concept.concept}
                    </h4>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--theme-dashboard-text-muted)]">
                      총 {concept.totalAttempts}회 시도
                    </span>
                    <span className="text-[var(--theme-dashboard-text-muted)]">•</span>
                    <span className="text-red-600 font-semibold">
                      {concept.wrongAttempts}회 오답
                    </span>
                    <span className="text-[var(--theme-dashboard-text-muted)]">•</span>
                    <span className={`font-bold ${
                      concept.errorRate >= 60 ? 'text-red-600' :
                      concept.errorRate >= 40 ? 'text-orange-600' :
                      'text-yellow-600'
                    }`}>
                      오답률 {concept.errorRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      concept.errorRate >= 60 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                      concept.errorRate >= 40 ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
                      'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    }`}
                    style={{ width: `${concept.errorRate}%` }}
                  />
                </div>
              </div>

              {/* Related Quizzes */}
              {concept.relatedQuizzes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[var(--theme-dashboard-text-muted)] uppercase">
                    최근 오답 문제
                  </p>
                  {concept.relatedQuizzes.map((quiz) => (
                    <div
                      key={quiz.quizId}
                      className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-sm"
                    >
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <p className="text-[var(--theme-dashboard-title)] flex-1">
                        {quiz.question.length > 80 ? `${quiz.question.substring(0, 80)}...` : quiz.question}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  to={`/quiz/ox/${selectedLanguage}`}
                  className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg font-medium transition-all"
                  style={{
                    backgroundColor: `${langInfo.color}15`,
                    color: langInfo.color,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${langInfo.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = `${langInfo.color}15`;
                  }}
                >
                  <span className="text-lg">{langInfo.icon}</span>
                  이 개념 다시 풀기
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}

          {/* Summary */}
          <div className="text-center pt-4">
            <p className="text-sm text-[var(--theme-dashboard-text-muted)]">
              💡 틀린 문제를 다시 풀면 정답률이 향상됩니다
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function getConceptEmoji(index: number): string {
  const emojis = ['🔴', '🟠', '🟡', '🟢', '🔵'];
  return emojis[index] || '⚪';
}
