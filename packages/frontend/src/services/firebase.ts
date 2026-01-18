/**
 * Firebase Authentication
 *
 * WHY: Firebase를 인증 레이어로만 사용, 사용자 데이터는 백엔드에서 관리
 * FLOW:
 *   1. Firebase 로그인 (Google/GitHub/Kakao)
 *   2. 백엔드에서 등록 여부 확인 (/users/me)
 *   3. 미등록 시 needsRegistration: true → 닉네임 설정 화면으로
 *   4. 등록 완료 시 appUser 설정
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { config } from '@/config';
import { useStore } from '@/stores/store';
import { getCurrentUser, registerUser } from './user';
import { getProfile } from './analytics';
import { generateTempNickname } from '@/utils/nickname';
import { logger } from '@/utils/logger';

// Firebase 초기화
const app = initializeApp(config.firebase);
export const auth = getAuth(app);

// OAuth Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const kakaoProvider = new OAuthProvider('oidc.kakao');

// Auth 초기화 완료를 기다리는 Promise
let authReady: Promise<User | null>;
let authReadyResolve: (user: User | null) => void;

authReady = new Promise((resolve) => {
  authReadyResolve = resolve;
});

// 첫 번째 auth 상태 변경 시 Promise resolve
const unsubscribeInitial = onAuthStateChanged(auth, (user) => {
  authReadyResolve(user);
  unsubscribeInitial(); // 첫 번째 콜백 후 구독 해제
});

/**
 * Auth가 초기화될 때까지 대기
 */
export function waitForAuth(): Promise<User | null> {
  return authReady;
}

/**
 * 인증 상태 변경 시 store 업데이트
 * NOTE: 앱 초기화 시 한 번 호출
 */
export function initializeAuthListener(): () => void {
  const store = useStore.getState();
  store.setAuthLoading(true);

  return onAuthStateChanged(auth, async (firebaseUser) => {
    const { setFirebaseUser, setAppUser, setNeedsRegistration, setNeedsOnboarding, setAuthLoading } =
      useStore.getState();

    setFirebaseUser(firebaseUser);

    if (firebaseUser) {
      try {
        // 백엔드에서 등록된 사용자인지 확인
        let appUser = await getCurrentUser();

        if (appUser) {
          // 이미 등록된 사용자
          setAppUser(appUser);
          setNeedsRegistration(false);

          // 온보딩 완료 여부 확인
          const profileResult = await getProfile();
          if (profileResult && !profileResult.onboardingCompleted) {
            setNeedsOnboarding(true);
            logger.info('User needs onboarding');
          } else {
            setNeedsOnboarding(false);
          }
        } else {
          // 미등록 사용자 → 임시 닉네임으로 자동 생성
          logger.info('New user detected, auto-registering with temp nickname');
          const tempNickname = generateTempNickname();

          try {
            appUser = await registerUser(tempNickname);
            setAppUser(appUser);
            setNeedsRegistration(false);
            setNeedsOnboarding(true); // 신규 사용자는 온보딩 필요
            logger.info('Auto-registration successful:', appUser.nickname);
          } catch (regError) {
            // 등록 실패 시 (닉네임 충돌 등) 다시 시도
            logger.warn('Auto-registration failed, retrying:', regError);
            const retryNickname = generateTempNickname();
            appUser = await registerUser(retryNickname);
            setAppUser(appUser);
            setNeedsRegistration(false);
            setNeedsOnboarding(true); // 신규 사용자는 온보딩 필요
          }
        }
      } catch (error) {
        logger.error('Failed to fetch/register user:', error);
        setAppUser(null);
        setNeedsRegistration(true);
        setNeedsOnboarding(false);
      }
    } else {
      // 로그아웃 상태
      setAppUser(null);
      setNeedsRegistration(false);
      setNeedsOnboarding(false);
    }

    setAuthLoading(false);
  });
}

/**
 * Google 로그인
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * GitHub 로그인
 */
export async function loginWithGithub(): Promise<User> {
  const result = await signInWithPopup(auth, githubProvider);
  return result.user;
}

/**
 * Kakao 로그인
 * NOTE: Firebase Console에서 OIDC provider 설정 필요
 */
export async function loginWithKakao(): Promise<User> {
  const result = await signInWithPopup(auth, kakaoProvider);
  return result.user;
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await signOut(auth);
  // store 초기화는 onAuthStateChanged에서 처리됨
}

/**
 * 현재 사용자의 ID 토큰 가져오기 (API 요청용)
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
