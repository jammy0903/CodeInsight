/**
 * ProfilePage - 내 프로필 페이지
 *
 * WHY: 사용자 정보 확인 및 설정
 * TODO: 닉네임 변경, 연결된 OAuth 계정 표시
 */

import { User } from 'lucide-react';
import { useStore } from '@/stores/store';
import { PixelAvatar } from '@/components/PixelAvatar';

export function ProfilePage() {
  const { appUser, firebaseUser } = useStore();

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">프로필</h1>
        </div>

        <div className="bg-white rounded-xl border border-[#e5d5c7] p-8">
          {appUser ? (
            <div className="flex flex-col items-center gap-4">
              <PixelAvatar seed={appUser.nickname} size={80} />
              <div className="text-center">
                <h2 className="text-xl font-bold text-[#6b5a4a]">
                  {appUser.nickname}
                </h2>
                <p className="text-sm text-[#937b5d] mt-1">
                  {appUser.oauthAccounts[0]?.email || firebaseUser?.email}
                </p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-[#a08060]/10 text-[#a08060] rounded-full">
                  {appUser.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-[#e5d5c7]">
                <h3 className="text-sm font-semibold text-[#6b5a4a] mb-3">
                  연결된 계정
                </h3>
                <div className="space-y-2">
                  {appUser.oauthAccounts.map((account) => (
                    <div
                      key={account.provider}
                      className="flex items-center gap-3 p-3 bg-[#fff8f0] rounded-lg"
                    >
                      <span className="text-sm font-medium text-[#6b5a4a] capitalize">
                        {account.provider}
                      </span>
                      <span className="text-sm text-[#937b5d]">
                        {account.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-[#937b5d]">
              프로필 정보를 불러오는 중...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
