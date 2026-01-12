/**
 * User API Service
 * 사용자 인증 및 프로필 관리
 */

import { api } from './api/axios';
import { handleError } from './api/errors';
import { config } from '@/config';
import type { AppUser } from '@/stores/store';

/**
 * 닉네임 유효성 검사 응답
 */
interface CheckNicknameResponse {
  available: boolean;
  message?: string;
}

/**
 * 사용자 등록 요청
 */
interface RegisterRequest {
  nickname: string;
}

/**
 * 현재 사용자 정보 조회
 * @returns AppUser 또는 null (미등록 시)
 */
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const response = await api.get<AppUser>(`${config.api.endpoints.users}/me`);
    return response.data;
  } catch (err) {
    const error = handleError(err);

    // 404: 미등록 사용자
    if (error.status === 404) {
      return null;
    }

    // 401: 인증 안 됨 (Firebase 토큰 없음)
    if (error.status === 401) {
      return null;
    }

    throw new Error(`사용자 정보를 불러올 수 없습니다: ${error.message}`);
  }
}

/**
 * 닉네임 사용 가능 여부 확인
 */
export async function checkNickname(nickname: string): Promise<CheckNicknameResponse> {
  try {
    const response = await api.get<CheckNicknameResponse>(
      `${config.api.endpoints.users}/check-nickname/${encodeURIComponent(nickname)}`
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);

    // 400: 닉네임 형식 오류
    if (error.status === 400) {
      return { available: false, message: error.message };
    }

    throw new Error(`닉네임 확인 실패: ${error.message}`);
  }
}

/**
 * 신규 사용자 등록 (닉네임 설정)
 */
export async function registerUser(nickname: string): Promise<AppUser> {
  try {
    const response = await api.post<AppUser>(
      `${config.api.endpoints.users}/register`,
      { nickname } as RegisterRequest
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);

    // 400: 닉네임 형식 오류 또는 중복
    if (error.status === 400) {
      throw new Error(error.message);
    }

    // 409: 이미 등록된 사용자
    if (error.status === 409) {
      throw new Error('이미 등록된 사용자입니다');
    }

    throw new Error(`사용자 등록 실패: ${error.message}`);
  }
}

/**
 * OAuth 계정 연동 (추가 로그인 수단 연결)
 *
 * NOTE: 이 기능은 Phase 2에서 구현 예정
 * 현재는 첫 번째 OAuth로 가입 후, 다른 OAuth로 동일 계정에 연결
 */
export async function linkOAuthAccount(): Promise<AppUser> {
  try {
    const response = await api.post<AppUser>(
      `${config.api.endpoints.users}/link-oauth`
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    throw new Error(`계정 연동 실패: ${error.message}`);
  }
}

/**
 * 닉네임 변경
 * @param nickname 새 닉네임 (2~20자)
 */
export async function updateNickname(nickname: string): Promise<AppUser> {
  try {
    const response = await api.patch<AppUser>(
      `${config.api.endpoints.users}/me/nickname`,
      { nickname }
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);

    // 409: 닉네임 중복
    if (error.status === 409) {
      throw new Error('이미 사용 중인 닉네임입니다');
    }

    // 400: 닉네임 형식 오류
    if (error.status === 400) {
      throw new Error(error.message);
    }

    throw new Error(`닉네임 변경 실패: ${error.message}`);
  }
}
