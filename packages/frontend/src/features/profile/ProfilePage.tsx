/**
 * ProfilePage - 내 프로필 페이지
 *
 * WHY: 사용자 정보 확인 및 설정
 * FEATURES:
 *   - 닉네임 변경
 *   - OAuth 계정 연동 (Google, Kakao, GitHub)
 */

import { useState } from 'react';
import { User, Pencil, Check, X, Link2, Loader2, Mail, ExternalLink } from 'lucide-react';
import { useStore } from '@/stores/store';
import { PixelAvatar } from '@/components/PixelAvatar';
import { updateNickname, linkOAuthAccount } from '@/services/user';
import { loginWithGoogle, loginWithGithub, loginWithKakao } from '@/services/firebase';
import { logger } from '@/utils/logger';

// 고객센터 이메일
const SUPPORT_EMAIL = 'l89192164@gmail.com';

// OAuth 제공자 정보
const OAUTH_PROVIDERS = [
  { id: 'google', name: 'Google', color: 'bg-white border-gray-300 hover:bg-gray-50' },
  { id: 'kakao', name: 'Kakao', color: 'bg-[#FEE500] hover:bg-[#FDD800] text-[#391B1B]' },
  { id: 'github', name: 'GitHub', color: 'bg-[#24292e] hover:bg-[#1a1e22] text-white' },
] as const;

type OAuthProviderId = typeof OAUTH_PROVIDERS[number]['id'];

export function ProfilePage() {
  const { appUser, setAppUser } = useStore();

  // 닉네임 편집 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // OAuth 연동 상태
  const [linkingProvider, setLinkingProvider] = useState<OAuthProviderId | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);

  // 연결된 provider 목록
  const connectedProviders = appUser?.oauthAccounts.map(a => a.provider) || [];

  // 닉네임 편집 시작
  const handleStartEdit = () => {
    setNewNickname(appUser?.nickname || '');
    setNicknameError(null);
    setIsEditingNickname(true);
  };

  // 닉네임 편집 취소
  const handleCancelEdit = () => {
    setIsEditingNickname(false);
    setNewNickname('');
    setNicknameError(null);
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (!newNickname.trim()) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    if (newNickname.trim().length < 2 || newNickname.trim().length > 20) {
      setNicknameError('닉네임은 2~20자여야 합니다');
      return;
    }

    setIsSavingNickname(true);
    setNicknameError(null);

    try {
      const updatedUser = await updateNickname(newNickname.trim());
      setAppUser(updatedUser);
      setIsEditingNickname(false);
      setNewNickname('');
    } catch (error) {
      logger.error('Nickname update failed:', error);
      setNicknameError(error instanceof Error ? error.message : '닉네임 변경 실패');
    } finally {
      setIsSavingNickname(false);
    }
  };

  // OAuth 계정 연동
  const handleLinkOAuth = async (provider: OAuthProviderId) => {
    if (connectedProviders.includes(provider)) {
      return; // 이미 연결됨
    }

    setLinkingProvider(provider);
    setLinkError(null);

    try {
      // 1. Firebase OAuth 로그인 (팝업)
      switch (provider) {
        case 'google':
          await loginWithGoogle();
          break;
        case 'kakao':
          await loginWithKakao();
          break;
        case 'github':
          await loginWithGithub();
          break;
      }

      // 2. 백엔드에 연동 요청
      const updatedUser = await linkOAuthAccount();
      setAppUser(updatedUser);
    } catch (error) {
      logger.error('OAuth link failed:', error);
      setLinkError(error instanceof Error ? error.message : '계정 연동 실패');
    } finally {
      setLinkingProvider(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">프로필</h1>
        </div>

        {appUser ? (
          <div className="space-y-6">
            {/* 프로필 카드 */}
            <div className="bg-white rounded-xl border border-[#e5d5c7] p-8">
              <div className="flex flex-col items-center gap-4">
                <PixelAvatar seed={appUser.nickname} size={80} />

                {/* 닉네임 섹션 */}
                {isEditingNickname ? (
                  <div className="w-full max-w-xs">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        placeholder="새 닉네임"
                        className="flex-1 px-3 py-2 border border-[#e5d5c7] rounded-lg text-center text-[#6b5a4a] focus:outline-none focus:border-[#a08060]"
                        maxLength={20}
                        disabled={isSavingNickname}
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={isSavingNickname}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                      >
                        {isSavingNickname ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Check className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isSavingNickname}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    {nicknameError && (
                      <p className="mt-2 text-sm text-red-500 text-center">{nicknameError}</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <h2 className="text-xl font-bold text-[#6b5a4a]">
                        {appUser.nickname}
                      </h2>
                      <button
                        onClick={handleStartEdit}
                        className="p-1.5 text-[#937b5d] hover:text-[#6b5a4a] hover:bg-[#fff8f0] rounded-lg transition-colors"
                        title="닉네임 변경"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-[#a08060]/10 text-[#a08060] rounded-full">
                      {appUser.role === 'admin' ? '관리자' : '일반 사용자'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* OAuth 연동 카드 */}
            <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Link2 className="w-5 h-5 text-[#a08060]" />
                <h3 className="text-lg font-semibold text-[#6b5a4a]">계정 연동</h3>
              </div>

              <p className="text-sm text-[#937b5d] mb-4">
                여러 계정을 연동하면 어떤 방법으로든 로그인할 수 있습니다.
              </p>

              {linkError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  {linkError}
                </div>
              )}

              <div className="space-y-3">
                {OAUTH_PROVIDERS.map((provider) => {
                  const isConnected = connectedProviders.includes(provider.id);
                  const isLinking = linkingProvider === provider.id;

                  return (
                    <div
                      key={provider.id}
                      className="flex items-center justify-between p-3 bg-[#fff8f0] rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <ProviderIcon provider={provider.id} />
                        <span className="font-medium text-[#6b5a4a]">{provider.name}</span>
                      </div>

                      {isConnected ? (
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          연결됨
                        </span>
                      ) : (
                        <button
                          onClick={() => handleLinkOAuth(provider.id)}
                          disabled={isLinking || linkingProvider !== null}
                          className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${provider.color}`}
                        >
                          {isLinking ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            '연동하기'
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 고객센터 카드 */}
            <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-[#a08060]" />
                <h3 className="text-lg font-semibold text-[#6b5a4a]">고객센터</h3>
              </div>

              <p className="text-sm text-[#937b5d] mb-4">
                문의사항이나 버그 신고가 있으시면 이메일로 연락주세요.
              </p>

              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${SUPPORT_EMAIL}&su=${encodeURIComponent(`[CodeInsight 문의] ${appUser?.nickname || '사용자'}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-[#a08060] hover:bg-[#8b6d4f] text-white font-medium rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                이메일 문의하기
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="mt-3 text-xs text-center text-[#937b5d]">
                {SUPPORT_EMAIL}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#e5d5c7] p-8">
            <div className="text-center text-[#937b5d]">
              프로필 정보를 불러오는 중...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// OAuth Provider 아이콘 컴포넌트
function ProviderIcon({ provider }: { provider: OAuthProviderId }) {
  switch (provider) {
    case 'google':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      );
    case 'kakao':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#391B1B" d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.86 5.31 4.64 6.73-.15.54-.96 3.47-1 3.64 0 .05-.01.1 0 .15.04.13.15.2.28.2.1 0 .19-.04.27-.1l4.17-2.74c.54.05 1.09.12 1.64.12 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
      );
    case 'github':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      );
  }
}
