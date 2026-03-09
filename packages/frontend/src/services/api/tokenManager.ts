/**
 * Auth Token Manager
 *
 * 단순한 토큰 캐시 모듈.
 * AuthProvider(firebase.ts)가 onIdTokenChanged에서 setAuthToken()으로 토큰을 설정하고,
 * axios 인터셉터와 기타 서비스가 getAuthToken()으로 동기적으로 읽음.
 *
 * WHY 동기적 설계:
 * - 인증 상태는 상위 컨텍스트(AuthProvider)가 관리
 * - 토큰 소비자(axios, ai.ts)는 캐시만 읽으면 됨
 * - Firebase 비동기 호출이 제거되어 공개 API 즉시 발송 가능
 */

let authToken: string | null = null;

/**
 * 토큰 설정 (AuthProvider에서 호출)
 */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/**
 * 토큰 읽기 (동기적 캐시 조회)
 */
export function getAuthToken(): string | null {
  return authToken;
}
