/**
 * AI Provider 토글 컴포넌트
 * DeepSeek ↔ Ollama ↔ Gemini 전환
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { getAIProviders, switchAIProvider } from '@/services/admin';
import type { AIProvider } from '@/services/api/types';

export function AIProviderToggle() {
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [currentProvider, setCurrentProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Provider 목록 조회
  useEffect(() => {
    fetchProviders();
  }, []);

  async function fetchProviders() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAIProviders();
      setProviders(data.providers);
      setCurrentProvider(data.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Provider 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  // Provider 전환
  async function handleSwitch(providerType: 'deepseek' | 'ollama' | 'gemini') {
    try {
      setSwitching(true);
      const result = await switchAIProvider(providerType);
      setCurrentProvider(result.current);

      // Provider 목록 갱신 (사용 가능 여부 변경될 수 있음)
      await fetchProviders();

      // 성공 토스트
      showToast(`${result.name}(으)로 전환되었습니다`, 'success');
    } catch (err) {
      // 실패 토스트
      showToast(err instanceof Error ? err.message : 'Provider 전환 실패', 'error');
    } finally {
      setSwitching(false);
    }
  }

  // 토스트 표시
  function showToast(message: string, type: 'success' | 'error') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Provider 이름 한글화
  function getProviderDisplayName(type: string): string {
    const names: Record<string, string> = {
      deepseek: 'DeepSeek',
      ollama: 'Ollama (Local)',
      gemini: 'Gemini',
    };
    return names[type] || type;
  }

  if (loading) {
    return (
      <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--theme-dashboard-text-muted)]" />
          <span className="ml-3 text-[var(--theme-dashboard-text-muted)]">Provider 목록 로딩 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
        <div className="flex items-center gap-3 text-red-600">
          <XCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border-2 border-[var(--theme-dashboard-card-border)] p-6">
        <h2 className="text-2xl font-bold text-[var(--theme-dashboard-title)] mb-4 flex items-center gap-3">
          <Cpu className="w-6 h-6" />
          AI Provider 설정
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {providers.map((provider) => (
            <ProviderCard
              key={provider.type}
              provider={provider}
              isCurrent={provider.current}
              onSwitch={() => handleSwitch(provider.type)}
              switching={switching}
              displayName={getProviderDisplayName(provider.type)}
            />
          ))}
        </div>

        {/* 현재 Provider 표시 */}
        <div className="mt-6 pt-6 border-t border-[var(--theme-dashboard-card-border)]">
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--theme-dashboard-text-muted)]">현재 사용 중:</span>
            <span className="font-semibold text-[var(--theme-dashboard-title)]">
              {getProviderDisplayName(currentProvider)}
            </span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        </div>
      </div>

      {/* 토스트 메시지 */}
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div
            className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500 text-white'
                : 'bg-red-500 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </>
  );
}

interface ProviderCardProps {
  provider: AIProvider;
  isCurrent: boolean;
  onSwitch: () => void;
  switching: boolean;
  displayName: string;
}

function ProviderCard({ provider, isCurrent, onSwitch, switching, displayName }: ProviderCardProps) {
  const isDisabled = !provider.available || switching;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      onClick={isDisabled ? undefined : onSwitch}
      disabled={isDisabled}
      className={`
        p-4 rounded-lg border-2 transition-all
        ${isCurrent ? 'border-accent-purple bg-purple-50' : 'border-[var(--theme-dashboard-card-border)] bg-[var(--theme-dashboard-card-bg)]'}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-purple cursor-pointer'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-[var(--theme-dashboard-title)]">{displayName}</span>
        {provider.available ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <div
          className={`w-2 h-2 rounded-full ${
            provider.available ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-[var(--theme-dashboard-text-muted)]">
          {provider.available ? '사용 가능' : '사용 불가'}
        </span>
      </div>

      {isCurrent && (
        <div className="mt-3 pt-3 border-t border-purple-200">
          <span className="text-xs font-semibold text-purple-600">현재 사용 중</span>
        </div>
      )}
    </motion.button>
  );
}
