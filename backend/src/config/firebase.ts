/**
 * Firebase Admin SDK 초기화
 *
 * 환경변수 또는 서비스 계정 파일로 초기화
 * - GOOGLE_APPLICATION_CREDENTIALS: 서비스 계정 JSON 경로
 * - 또는 개별 환경변수로 설정
 */

import admin from 'firebase-admin';
import { env } from './env';

let firebaseApp: admin.app.App | null = null;

export function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  // 이미 초기화된 앱이 있으면 반환
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0]!;
    return firebaseApp;
  }

  // 환경변수로 서비스 계정 설정
  if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        // 환경변수에서 \n을 실제 줄바꿈으로 변환
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    console.log('[Firebase] Initialized with service account');
    return firebaseApp;
  }

  // GOOGLE_APPLICATION_CREDENTIALS 환경변수 사용 (기본)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log('[Firebase] Initialized with application default credentials');
    return firebaseApp;
  }

  // 개발 환경에서는 경고만 출력
  if (env.NODE_ENV === 'development') {
    console.warn('[Firebase] No credentials found. Auth middleware will reject all requests.');
    console.warn('[Firebase] Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    // 초기화 없이 null 반환하면 안됨 - 빈 앱이라도 있어야 함
    firebaseApp = admin.initializeApp();
    return firebaseApp;
  }

  throw new Error('[Firebase] No credentials configured. Set environment variables.');
}

export function getFirebaseAuth(): admin.auth.Auth {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
}

export { admin };
