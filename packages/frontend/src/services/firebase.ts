/**
 * Firebase Authentication
 *
 * WHY: Firebase를 인증 레이어로만 사용, 사용자 데이터는 백엔드에서 관리
 * FLOW:
 *   1. Firebase 로그인 (Google/GitHub/Kakao)
 *   2. 백엔드에서 등록 여부 확인 (/users/me)
 *   3. 미등록 시 needsRegistration: true → 닉네임 설정 화면으로
 *   4. 등록 완료 시 appUser 설정
 *
 * NATIVE vs WEB:
 *   - Native (Android/iOS): @capacitor-firebase/authentication 플러그인 사용
 *   - Web: Firebase JS SDK의 signInWithPopup 사용
 */
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithCredential,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { config } from '@/config';
import { useStore } from '@/stores/store';
import { getCurrentUser, registerUser, linkOAuthAccount } from './user';
import { getProfile } from './analytics';
import { generateTempNickname } from '@/utils/nickname';
import { logger } from '@/utils/logger';
import { setAuthToken } from './api/tokenManager';

// Firebase 초기화
const app = initializeApp(config.firebase);
export const auth = getAuth(app);

// OAuth Providers
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const kakaoProvider = new OAuthProvider('oidc.kakao');

/**
 * 인증 상태 변경 시 store 업데이트 및 토큰 설정
 * NOTE: 앱 초기화 시 한 번 호출
 */
export function initializeAuthListener(): () => void {
  const store = useStore.getState();
  store.setAuthLoading(true);

  return onAuthStateChanged(auth, async (firebaseUser) => {
    const {
      setFirebaseUser,
      setAppUser,
      setNeedsRegistration,
      setNeedsOnboarding,
      setAuthLoading,
    } = useStore.getState();

    setFirebaseUser(firebaseUser);

    if (firebaseUser) {
      const token = await firebaseUser.getIdToken();
      setAuthToken(token); // PUSH TOKEN

      try {
        // 백엔드에서 등록된 사용자인지 확인
        let appUser = await getCurrentUser();

        if (appUser) {
          // 이미 등록된 사용자
          setAppUser(appUser);
          setNeedsRegistration(false);

          // 온보딩 완료 여부 확인 (백엔드만 사용)
          const profileResult = await getProfile();
          if (profileResult && !profileResult.onboardingCompleted) {
            setNeedsOnboarding(true);
            logger.info('User needs onboarding');
          } else {
            setNeedsOnboarding(false);
          }
        } else {
          // 미등록 사용자 → 자동 OAuth 연동 시도
          logger.info('User not found, attempting to link OAuth...');
          try {
            const linkedUser = await linkOAuthAccount();
            // OAuth 연동 성공 → 기존 계정에 연결됨
            setAppUser(linkedUser);
            setNeedsRegistration(false);
            logger.info('OAuth account linked successfully');

            // 온보딩 완료 여부 확인
            const profileResult = await getProfile();
            if (profileResult && !profileResult.onboardingCompleted) {
              setNeedsOnboarding(true);
            } else {
              setNeedsOnboarding(false);
            }
          } catch (linkError) {
            // OAuth 연동 실패 → 새로운 사용자로 등록 필요
            logger.info('OAuth link failed, needs new registration:', linkError);
            setAppUser(null);
            setNeedsRegistration(true); // 닉네임 등록이 필요
            setNeedsOnboarding(false);
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
      setAuthToken(null); // CLEAR TOKEN
      setAppUser(null);
      setNeedsRegistration(false);
      setNeedsOnboarding(false);
    }

    setAuthLoading(false);
  });
}

/**
 * Google 로그인
 * - Native: Capacitor Firebase Authentication 플러그인 사용 (네이티브 Google Sign-In)
 * - Web: Firebase JS SDK signInWithPopup 사용
 */
export async function loginWithGoogle(): Promise<User> {
  if (Capacitor.isNativePlatform()) {
    // 네이티브: Capacitor 플러그인으로 Google Sign-In
    const result = await FirebaseAuthentication.signInWithGoogle();

    // idToken으로 Firebase Auth credential 생성
    const credential = GoogleAuthProvider.credential(result.credential?.idToken);

    // Firebase JS SDK와 동기화
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } else {
    // 웹: 기존 팝업 방식
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  }
}

/**
 * GitHub 로그인
 * - Native: Capacitor Firebase Authentication 플러그인 사용
 * - Web: Firebase JS SDK signInWithPopup 사용
 */
export async function loginWithGithub(): Promise<User> {
  if (Capacitor.isNativePlatform()) {
    // 네이티브: Capacitor 플러그인으로 GitHub Sign-In
    const result = await FirebaseAuthentication.signInWithGithub();

    // accessToken으로 Firebase Auth credential 생성
    const credential = GithubAuthProvider.credential(result.credential?.accessToken || '');

    // Firebase JS SDK와 동기화
    const userCredential = await signInWithCredential(auth, credential);
    return userCredential.user;
  } else {
    // 웹: 기존 팝업 방식
    const result = await signInWithPopup(auth, githubProvider);
    return result.user;
  }
}

/**
 * Kakao 로그인
 * NOTE: Firebase Console에서 OIDC provider 설정 필요
 * TODO: 네이티브 지원 시 Capacitor 플러그인 연동 필요
 */
export async function loginWithKakao(): Promise<User> {
  const result = await signInWithPopup(auth, kakaoProvider);
  return result.user;
}

/**
 * 로그아웃
 * - Native: Capacitor 플러그인과 Firebase JS SDK 모두 로그아웃
 * - Web: Firebase JS SDK만 로그아웃
 */
export async function logout(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // 네이티브: Capacitor 플러그인 로그아웃
    await FirebaseAuthentication.signOut();
  }
  // 공통: Firebase JS SDK 로그아웃
  await signOut(auth);
  // store 초기화 및 토큰 제거는 onAuthStateChanged에서 처리됨
}
