/**
 * SubscriptionPage - 구독 관리 페이지
 *
 * WHY: 구독 플랜 확인, 사용량 조회, 업그레이드
 * FEATURES: 현재 플랜 표시, 사용량 바, 플랜 비교
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Crown, Zap, Sparkles, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/stores/store';
import {
  getPlans,
  getMySubscription,
  getMyUsage,
  type SubscriptionPlan,
  type UserSubscription,
  type UsageInfo,
} from '@/services/subscription';

// 플랜별 아이콘
const PLAN_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  free: Zap,
  basic: Crown,
  premium: Sparkles,
};

// 플랜별 색상
const PLAN_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  free: { bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-600', text: 'text-slate-600 dark:text-slate-300' },
  basic: { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-300 dark:border-blue-600', text: 'text-blue-600 dark:text-blue-400' },
  premium: { bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-300 dark:border-purple-600', text: 'text-purple-600 dark:text-purple-400' },
};

// 기능 설명
const FEATURE_LABELS: Record<string, string> = {
  basic_learning: '기본 학습',
  ai_chat_limited: 'AI 채팅 (제한)',
  ai_chat: 'AI 채팅',
  ai_explain: 'AI 코드 설명',
  chapters_1_2: '챕터 1-2 접근',
  all_chapters: '전체 챕터 접근',
  priority_support: '우선 지원',
};

export function SubscriptionPage() {
  const { appUser } = useStore();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [plansData, subscriptionData, usageData] = await Promise.all([
          getPlans(),
          appUser ? getMySubscription() : Promise.resolve(null),
          appUser ? getMyUsage() : Promise.resolve(null),
        ]);
        setPlans(plansData);
        setSubscription(subscriptionData);
        setUsage(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [appUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--theme-bg)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--theme-bg)' }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-10 border-b px-4 py-3" style={{
        backgroundColor: 'var(--theme-topbar-bg)',
        borderColor: 'var(--theme-border)'
      }}>
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/" className="p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--theme-text)' }} />
          </Link>
          <h1 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
            구독 관리
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* 현재 구독 상태 */}
        {subscription && (
          <section>
            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
              현재 플랜
            </h2>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-xl border-2 ${PLAN_COLORS[subscription.planId]?.border || 'border-gray-300'}`}
              style={{ backgroundColor: 'var(--theme-card-bg)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = PLAN_ICONS[subscription.planId] || Zap;
                  return <Icon className={`w-8 h-8 ${PLAN_COLORS[subscription.planId]?.text || 'text-gray-500'}`} />;
                })()}
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>
                    {subscription.planName}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
                    {subscription.status === 'active' ? '활성' : subscription.status}
                  </p>
                </div>
              </div>

              {/* 사용량 바 */}
              {usage && (
                <div className="space-y-3">
                  {/* 월간 사용량 */}
                  {usage.limits.monthly !== null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--theme-text-secondary)' }}>월간 토큰</span>
                        <span style={{ color: 'var(--theme-text)' }}>
                          {usage.usage.monthly.toLocaleString()} / {usage.limits.monthly.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (usage.usage.monthly / usage.limits.monthly) * 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            usage.usage.monthly / usage.limits.monthly > 0.9
                              ? 'bg-red-500'
                              : usage.usage.monthly / usage.limits.monthly > 0.7
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* 일일 사용량 */}
                  {usage.limits.daily !== null && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--theme-text-secondary)' }}>일일 토큰</span>
                        <span style={{ color: 'var(--theme-text)' }}>
                          {usage.usage.daily.toLocaleString()} / {usage.limits.daily.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (usage.usage.daily / usage.limits.daily) * 100)}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-full rounded-full ${
                            usage.usage.daily / usage.limits.daily > 0.9
                              ? 'bg-red-500'
                              : usage.usage.daily / usage.limits.daily > 0.7
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* 무제한 표시 */}
                  {usage.limits.monthly === null && usage.limits.daily === null && (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      무제한 사용 가능
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          </section>
        )}

        {/* 플랜 비교 */}
        <section>
          <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--theme-text-secondary)' }}>
            플랜 비교
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan, index) => {
              const isCurrentPlan = subscription?.planId === plan.id;
              const Icon = PLAN_ICONS[plan.id] || Zap;
              const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.free;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-5 rounded-xl border-2 ${
                    isCurrentPlan ? colors.border : 'border-gray-200 dark:border-gray-700'
                  }`}
                  style={{ backgroundColor: 'var(--theme-card-bg)' }}
                >
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium rounded-full bg-blue-500 text-white">
                      현재 플랜
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3">
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                    <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>
                      {plan.name}
                    </h3>
                  </div>

                  <div className="mb-4">
                    <span className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
                      {plan.price === 0 ? '무료' : `₩${plan.price.toLocaleString()}`}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>/월</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p style={{ color: 'var(--theme-text-secondary)' }}>
                      월 {plan.monthlyTokenLimit ? `${(plan.monthlyTokenLimit / 1000).toLocaleString()}K` : '무제한'} 토큰
                    </p>
                    <p style={{ color: 'var(--theme-text-secondary)' }}>
                      일 {plan.dailyTokenLimit ? `${(plan.dailyTokenLimit / 1000).toLocaleString()}K` : '무제한'} 토큰
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                        <span style={{ color: 'var(--theme-text)' }}>
                          {FEATURE_LABELS[feature] || feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {!isCurrentPlan && plan.price > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full mt-4 py-2 rounded-lg font-medium text-white ${
                        plan.id === 'basic' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-purple-500 hover:bg-purple-600'
                      }`}
                      onClick={() => {
                        // TODO: 결제 연동
                        alert('결제 기능은 준비 중입니다.');
                      }}
                    >
                      업그레이드
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* 비로그인 안내 */}
        {!appUser && (
          <div className="p-6 rounded-xl border text-center" style={{
            backgroundColor: 'var(--theme-card-bg)',
            borderColor: 'var(--theme-border)'
          }}>
            <p className="text-sm mb-4" style={{ color: 'var(--theme-text-secondary)' }}>
              구독 정보를 확인하려면 로그인하세요.
            </p>
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
            >
              로그인하기
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
