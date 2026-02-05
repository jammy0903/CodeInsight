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
import { User, ChevronRight, Check, Loader2, Edit2, X, LogOut, AlertTriangle, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '@/stores/store';
import { PixelAvatar } from '@/components/PixelAvatar';
import { getProfile, updateProfile, type UserProfile } from '@/services/analytics';
import { updateNickname, checkNickname, deleteAccount } from '@/services/user';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  PROFILE_QUESTIONS,
  getProfileLabel,
  getProfileEmoji,
  type ProfileQuestionKey,
} from '@/constants/profileQuestions';
import { LanguageSelector } from '@/components/LanguageSelector';

export function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const appUser = useStore((s) => s.appUser);
  const firebaseUser = useStore((s) => s.firebaseUser);
  const setAppUser = useStore((s) => s.setAppUser);
  const setFirebaseUser = useStore((s) => s.setFirebaseUser);

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

  // 회원탈퇴 상태
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

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

  // 회원탈퇴 확인 다이얼로그 열기
  const handleOpenDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  // 회원탈퇴 확인 다이얼로그 닫기
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
  };

  // 회원탈퇴 실행
  const handleConfirmDelete = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();

      // 로그아웃 처리
      setFirebaseUser(null);
      setAppUser(null);

      // 로그인 페이지로 이동
      navigate('/auth', { replace: true });
    } catch (error: any) {
      console.error('Account deletion error:', error);
      alert(error.message || '계정 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsDeletingAccount(false);
      handleCloseDeleteDialog();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--theme-layout-page-bg)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <User className="w-8 h-8 text-[var(--theme-dashboard-accent)]" />
          <h1 className="text-2xl font-bold text-[var(--theme-dashboard-title)]">프로필</h1>
        </div>

        {/* 기본 정보 카드 */}
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] p-8 mb-6">
          {appUser ? (
            <div className="flex flex-col items-center gap-4">
              <PixelAvatar seed={appUser.nickname} size={80} />
              <div className="text-center w-full">
                {/* 닉네임 표시/수정 */}
                {!isEditingNickname ? (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--theme-dashboard-title)]">
                      {appUser.nickname}
                    </h2>
                    <button
                      onClick={handleStartEditNickname}
                      className="p-1.5 rounded-lg hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors text-[var(--theme-dashboard-accent)]"
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
                        className="p-2 rounded-lg hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors text-[var(--theme-dashboard-text-muted)]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {/* 에러/상태 메시지 */}
                    {nicknameError && (
                      <p className="text-xs text-red-500 mt-2">{nicknameError}</p>
                    )}
                    {isCheckingNickname && (
                      <p className="text-xs text-[var(--theme-dashboard-text-muted)] mt-2 flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        확인 중...
                      </p>
                    )}
                    {!nicknameError && !isCheckingNickname && newNickname && newNickname !== appUser.nickname && (
                      <p className="text-xs text-green-600 mt-2">✓ 사용 가능한 닉네임입니다</p>
                    )}
                  </div>
                )}

                <p className="text-sm text-[var(--theme-dashboard-text-muted)] mt-1">
                  {firebaseUser?.email}
                </p>
                <span className="inline-block mt-2 px-3 py-1 text-xs font-medium bg-[var(--theme-dashboard-accent)]/10 text-[var(--theme-dashboard-accent)] rounded-full">
                  {appUser.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </div>

              <div className="w-full mt-6 pt-6 border-t border-[var(--theme-dashboard-card-border)]">
                <h3 className="text-sm font-semibold text-[var(--theme-dashboard-title)] mb-3">
                  연결된 계정
                </h3>
                <div className="space-y-2">
                  {appUser.oauthAccounts.map((account) => (
                    <div
                      key={account.provider}
                      className="flex items-center gap-3 p-3 bg-[var(--theme-dashboard-section-header-bg)] rounded-lg"
                    >
                      <span className="text-sm font-medium text-[var(--theme-dashboard-title)] capitalize">
                        {account.provider}
                      </span>
                      <span className="text-sm text-[var(--theme-dashboard-text-muted)]">
                        {firebaseUser?.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-[var(--theme-dashboard-text-muted)]">
              프로필 정보를 불러오는 중...
            </div>
          )}
        </div>

        {/* 학습 프로필 카드 */}
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] p-6 mb-6">
          {/* ... 기존 학습 프로필 카드 내용 ... */}
        </div>

        {/* 학습 프로필 카드 */}
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] p-6 mb-6">
          <h3 className="text-lg font-bold text-[var(--theme-dashboard-title)] mb-4">
            학습 프로필
          </h3>
          <p className="text-sm text-[var(--theme-dashboard-text-muted)] mb-6">
            맞춤형 학습 경험을 위한 정보입니다. 언제든 수정할 수 있어요.
          </p>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-[var(--theme-dashboard-accent)] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {PROFILE_QUESTIONS.map((question) => {
                const value = profile?.[question.key];
                const isEditing = editingKey === question.key;

                return (
                  <div key={question.key}>
                    {/* 표시 모드 */}
                    {!isEditing && (
                      <motion.button
                        onClick={() => setEditingKey(question.key)}
                        className="w-full flex items-center justify-between p-4 bg-[var(--theme-dashboard-section-header-bg)] hover:bg-[var(--theme-layout-top-bar-button-hover)] rounded-xl border border-[var(--theme-dashboard-card-border)] transition-colors text-left"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        <div>
                          <p className="text-xs text-[var(--theme-dashboard-text-muted)] mb-1">
                            {question.title.replace('?', '')}
                          </p>
                          {value ? (
                            <p className="text-sm font-medium text-[var(--theme-dashboard-title)] flex items-center gap-2">
                              <span>{getProfileEmoji(question.key, value)}</span>
                              <span>{getProfileLabel(question.key, value)}</span>
                            </p>
                          ) : (
                            <p className="text-sm text-[var(--theme-dashboard-text-muted)]">
                              아직 설정하지 않았어요
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--theme-dashboard-accent)]" />
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
                              <p className="text-sm font-semibold text-[var(--theme-dashboard-title)]">
                                {question.title}
                              </p>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="text-xs text-[var(--theme-dashboard-text-muted)] hover:text-[var(--theme-dashboard-title)] transition-colors"
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
                                      : 'border-transparent bg-white bg-opacity-50 hover:bg-white hover:border-orange-200'
                                    }
                                    ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                  whileHover={!isSaving ? { scale: 1.02 } : {}}
                                  whileTap={!isSaving ? { scale: 0.98 } : {}}
                                >
                                  <span className="text-lg">{option.emoji}</span>
                                  <span className="text-sm font-medium text-[var(--theme-dashboard-title)]">
                                    {option.label}
                                  </span>
                                  {value === option.value && (
                                    <Check className="w-4 h-4 text-orange-500 ml-auto" />
                                  )}
                                </motion.button>
                              ))}
                            </div>
                            {isSaving && (
                              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-[var(--theme-dashboard-text-muted)]">
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

        {/* 앱 설정 카드 */}
        <div className="bg-[var(--theme-dashboard-card-bg)] rounded-xl border border-[var(--theme-dashboard-card-border)] p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-[var(--theme-dashboard-accent)]" />
            <h3 className="text-lg font-bold text-[var(--theme-dashboard-title)]">
              {t('settings.title')}
            </h3>
          </div>

          {/* 언어 설정 */}
          <div>
            <p className="text-sm font-medium text-[var(--theme-dashboard-title)] mb-1">
              {t('settings.language')}
            </p>
            <p className="text-xs text-[var(--theme-dashboard-text-muted)] mb-3">
              {t('settings.language_desc')}
            </p>
            <LanguageSelector />
          </div>
        </div>

        {/* 계정 탈퇴 링크 (작게, 맨 밑으로 이동, 가운데 정렬) */}
        <div className="text-center mt-8 mb-6">
          <button
            onClick={handleOpenDeleteDialog}
            className="text-sm text-red-500 hover:underline transition-colors"
          >
            {t('account.delete')}
          </button>
        </div>



        {/* 계정 탈퇴 확인 다이얼로그 */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                계정을 삭제하시겠습니까?
              </DialogTitle>
              <DialogDescription>
                이 작업은 되돌릴 수 없습니다. 계정을 삭제하면:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 text-sm text-[var(--theme-dashboard-text-muted)]">
              <p className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>모든 제출 기록과 드래프트가 삭제됩니다</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>학습 진도 데이터가 모두 제거됩니다</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>같은 이메일로 다시 가입할 수 없습니다</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>계정 정보가 즉시 삭제됩니다</span>
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <motion.button
                onClick={handleCloseDeleteDialog}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg border border-[var(--theme-dashboard-card-border)] text-[var(--theme-dashboard-text-muted)] hover:bg-[var(--theme-layout-top-bar-button-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!isDeletingAccount ? { scale: 1.02 } : {}}
                whileTap={!isDeletingAccount ? { scale: 0.98 } : {}}
              >
                취소
              </motion.button>

              <motion.button
                onClick={handleConfirmDelete}
                disabled={isDeletingAccount}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={!isDeletingAccount ? { scale: 1.02 } : {}}
                whileTap={!isDeletingAccount ? { scale: 0.98 } : {}}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4" />
                    계정 삭제
                  </>
                )}
              </motion.button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
