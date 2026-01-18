/**
 * ProfilePage - 내 프로필 페이지
 *
 * WHY: 사용자 정보 확인 및 설정
 * FEATURES:
 *   - 기본 정보 (닉네임, 이메일, 연결된 계정)
 *   - 온보딩 프로필 (나이대, 직업, 경험, 목표) 표시/수정
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronRight, Check, Loader2, Edit2, X } from 'lucide-react';
import { useStore } from '@/stores/store';
import { PixelAvatar } from '@/components/PixelAvatar';
import { getProfile, updateProfile, type UserProfile } from '@/services/analytics';
import { updateNickname, checkNickname } from '@/services/user';
import {
  PROFILE_QUESTIONS,
  getProfileLabel,
  getProfileEmoji,
  type ProfileQuestionKey,
} from '@/constants/profileQuestions';

export function ProfilePage() {
  const { appUser, firebaseUser, setAppUser } = useStore();

  // 프로필 데이터 상태
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 수정 모드 상태
  const [editingKey, setEditingKey] = useState<ProfileQuestionKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 닉네임 수정 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [isSavingNickname, setIsSavingNickname] = useState(false);

  // 프로필 불러오기
  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const result = await getProfile();
        if (result?.profile) {
          setProfile(result.profile);
        }
      } finally {
        setIsLoading(false);
      }
    }
    if (appUser) {
      fetchProfile();
    }
  }, [appUser]);

  // 프로필 항목 수정
  const handleSelect = async (key: ProfileQuestionKey, value: string) => {
    setIsSaving(true);
    try {
      const updated = { ...profile, [key]: value };
      await updateProfile(updated);
      setProfile(updated);
      setEditingKey(null);
    } finally {
      setIsSaving(false);
    }
  };

  // 닉네임 수정 시작
  const handleStartEditNickname = () => {
    setNewNickname(appUser?.nickname || '');
    setNicknameError('');
    setIsEditingNickname(true);
  };

  // 닉네임 수정 취소
  const handleCancelEditNickname = () => {
    setIsEditingNickname(false);
    setNewNickname('');
    setNicknameError('');
  };

  // 닉네임 입력 변경 (실시간 검증)
  const handleNicknameChange = async (value: string) => {
    setNewNickname(value);
    setNicknameError('');

    // 빈 값
    if (!value.trim()) {
      setNicknameError('닉네임을 입력해주세요');
      return;
    }

    // 현재 닉네임과 같으면 검증 스킵
    if (value.trim().toLowerCase() === appUser?.nickname) {
      return;
    }

    // 길이 검증 (2~20자)
    if (value.length < 2 || value.length > 20) {
      setNicknameError('닉네임은 2~20자여야 합니다');
      return;
    }

    // 형식 검증 (영문, 숫자, 한글, 언더스코어)
    const regex = /^[a-zA-Z0-9가-힣_]+$/;
    if (!regex.test(value)) {
      setNicknameError('영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다');
      return;
    }

    // 중복 체크 (debounce 없이 즉시)
    setIsCheckingNickname(true);
    try {
      const result = await checkNickname(value);
      if (!result.available) {
        setNicknameError(result.message || '이미 사용 중인 닉네임입니다');
      }
    } catch (error) {
      setNicknameError('닉네임 확인 중 오류가 발생했습니다');
    } finally {
      setIsCheckingNickname(false);
    }
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (nicknameError || !newNickname.trim()) {
      return;
    }

    // 현재 닉네임과 같으면 그냥 닫기
    if (newNickname.trim().toLowerCase() === appUser?.nickname) {
      handleCancelEditNickname();
      return;
    }

    setIsSavingNickname(true);
    try {
      const updatedUser = await updateNickname(newNickname);
      setAppUser(updatedUser); // Zustand store 업데이트
      handleCancelEditNickname();
    } catch (error: any) {
      setNicknameError(error.message || '닉네임 변경에 실패했습니다');
    } finally {
      setIsSavingNickname(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffbf5] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[#a08060]" />
          <h1 className="text-2xl font-bold text-[#6b5a4a]">프로필</h1>
        </div>

        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-xl border border-[#e5d5c7] p-8 mb-6">
          {appUser ? (
            <div className="flex flex-col items-center gap-4">
              <PixelAvatar seed={appUser.nickname} size={80} />
              <div className="text-center w-full">
                {/* 닉네임 표시/수정 */}
                {!isEditingNickname ? (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-[#6b5a4a]">
                      {appUser.nickname}
                    </h2>
                    <button
                      onClick={handleStartEditNickname}
                      className="p-1.5 rounded-lg hover:bg-[#fff8f0] transition-colors text-[#a08060]"
                      title="닉네임 변경"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="max-w-sm mx-auto">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => handleNicknameChange(e.target.value)}
                        placeholder="새 닉네임"
                        className="flex-1 px-3 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-400 focus:outline-none text-sm"
                        disabled={isSavingNickname}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveNickname}
                        disabled={isSavingNickname || !!nicknameError || !newNickname.trim()}
                        className="p-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSavingNickname ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={handleCancelEditNickname}
                        disabled={isSavingNickname}
                        className="p-2 rounded-lg hover:bg-[#fff8f0] transition-colors text-[#937b5d]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* 에러/상태 메시지 */}
                    {nicknameError && (
                      <p className="text-xs text-red-500 mt-2">{nicknameError}</p>
                    )}
                    {isCheckingNickname && (
                      <p className="text-xs text-[#937b5d] mt-2 flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        확인 중...
                      </p>
                    )}
                    {!nicknameError && !isCheckingNickname && newNickname && newNickname !== appUser.nickname && (
                      <p className="text-xs text-green-600 mt-2">✓ 사용 가능한 닉네임입니다</p>
                    )}
                  </div>
                )}

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

        {/* 학습 프로필 카드 */}
        <div className="bg-white rounded-xl border border-[#e5d5c7] p-6">
          <h3 className="text-lg font-bold text-[#6b5a4a] mb-4">
            학습 프로필
          </h3>
          <p className="text-sm text-[#937b5d] mb-6">
            맞춤형 학습 경험을 위한 정보입니다. 언제든 수정할 수 있어요.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[#a08060] animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {PROFILE_QUESTIONS.map((question) => {
                const value = profile?.[question.key];
                const isEditing = editingKey === question.key;

                return (
                  <div key={question.key}>
                    {/* 표시 모드 */}
                    {!isEditing && (
                      <motion.button
                        onClick={() => setEditingKey(question.key)}
                        className="w-full flex items-center justify-between p-4 bg-[#fff8f0] hover:bg-[#fff3e6] rounded-xl border border-[#e5d5c7] transition-colors text-left"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div>
                          <p className="text-xs text-[#937b5d] mb-1">
                            {question.title.replace('?', '')}
                          </p>
                          {value ? (
                            <p className="text-sm font-medium text-[#6b5a4a] flex items-center gap-2">
                              <span>{getProfileEmoji(question.key, value)}</span>
                              <span>{getProfileLabel(question.key, value)}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-[#b8a090]">
                              아직 설정하지 않았어요
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#a08060]" />
                      </motion.button>
                    )}

                    {/* 수정 모드 */}
                    <AnimatePresence>
                      {isEditing && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-2 border-orange-200">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-semibold text-[#6b5a4a]">
                                {question.title}
                              </p>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="text-xs text-[#937b5d] hover:text-[#6b5a4a] transition-colors"
                              >
                                취소
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {question.options.map((option) => (
                                <motion.button
                                  key={option.value}
                                  onClick={() => handleSelect(question.key, option.value)}
                                  disabled={isSaving}
                                  className={`
                                    p-3 rounded-lg border-2 text-left transition-all flex items-center gap-2
                                    ${value === option.value
                                      ? 'border-orange-400 bg-white shadow-sm'
                                      : 'border-transparent bg-white/50 hover:bg-white hover:border-orange-200'
                                    }
                                    ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                                >
                                  <span className="text-lg">{option.emoji}</span>
                                  <span className="text-sm font-medium text-[#6b5a4a]">
                                    {option.label}
                                  </span>
                                  {value === option.value && (
                                    <Check className="w-4 h-4 text-orange-500 ml-auto" />
                                  )}
                                </motion.button>
                              ))}
                            </div>
                            {isSaving && (
                              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-[#937b5d]">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                저장 중...
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
