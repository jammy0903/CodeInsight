/**
 * Auth Store — 인증 상태 (Firebase + App User + 온보딩)
 *
 * 독립 스토어: 새 코드에서 직접 import 가능
 * 기존 useStore와 동일한 상태를 공유하지 않음 — 점진적 마이그레이션용
 */

import { create } from 'zustand';
import type { User as FirebaseUser } from 'firebase/auth';

export interface OAuthAccountInfo {
  provider: string;
}

export interface AppUser {
  id: string;
  nickname: string;
  role: 'user' | 'admin';
  oauthAccounts: OAuthAccountInfo[];
}

interface AuthState {
  firebaseUser: FirebaseUser | null;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  appUser: AppUser | null;
  setAppUser: (user: AppUser | null) => void;
  needsRegistration: boolean;
  setNeedsRegistration: (needs: boolean) => void;
  needsOnboarding: boolean;
  setNeedsOnboarding: (needs: boolean) => void;
  authLoading: boolean;
  setAuthLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  setFirebaseUser: (user) => set({ firebaseUser: user }),
  appUser: null,
  setAppUser: (user) => set({ appUser: user }),
  needsRegistration: false,
  setNeedsRegistration: (needs) => set({ needsRegistration: needs }),
  needsOnboarding: false,
  setNeedsOnboarding: (needs) => set({ needsOnboarding: needs }),
  authLoading: true,
  setAuthLoading: (loading) => set({ authLoading: loading }),
}));
