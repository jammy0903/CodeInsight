/**
 * 닉네임 관련 유틸리티 함수
 */

/** 임시 닉네임 접두사 */
const TEMP_NICKNAME_PREFIX = 'user_';

/**
 * 임시 닉네임인지 확인
 * @param nickname 닉네임
 * @returns 임시 닉네임 여부
 */
export function isTempNickname(nickname: string): boolean {
  return nickname.startsWith(TEMP_NICKNAME_PREFIX);
}

/**
 * UI에 표시할 닉네임 반환
 * - 임시 닉네임(user_xxx): 'user'만 표시
 * - 사용자 설정 닉네임: 그대로 표시
 *
 * @param nickname DB에 저장된 닉네임
 * @returns UI에 표시할 닉네임
 */
export function getDisplayName(nickname: string): string {
  if (isTempNickname(nickname)) {
    return 'user';
  }
  return nickname;
}

/**
 * 임시 닉네임 생성
 * crypto.randomUUID()로 예측 불가능한 랜덤 ID 생성
 *
 * @returns 임시 닉네임 (예: user_a8f3k2m9)
 */
export function generateTempNickname(): string {
  const randomId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  return `${TEMP_NICKNAME_PREFIX}${randomId}`;
}
