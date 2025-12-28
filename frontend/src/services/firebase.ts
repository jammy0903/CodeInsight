/**
 * Firebase Authentication - Google 로그인
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { config } from '@/config';

// Firebase 초기화
const app = initializeApp(config.firebase);
export const auth = getAuth(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Google 로그인
 */
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * 현재 사용자의 ID 토큰 가져오기 (API 요청용)
 */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * 인증 상태 변경 리스너
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
