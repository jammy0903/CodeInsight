/**
 * Profile Service — 사용자 프로필 (온보딩)
 */

import { api } from '../api/axios';
import { handleError } from '../api/errors';
import { config } from '@/config';
import { logger } from '@/utils/logger';

export interface UserProfile {
  ageGroup?: '10s' | '20s' | '30s' | '40s+';
  occupation?: 'student_middle' | 'student_high' | 'student_univ' | 'job_seeker' | 'worker' | 'other';
  programmingExp?: 'none' | 'less_1y' | '1_3y' | '3y_plus';
  learningGoal?: 'basics' | 'job_prep' | 'skill_up' | 'curiosity';
}

export interface ProfileResponse {
  profile: UserProfile | null;
  onboardingCompleted: boolean;
}

export async function getProfile(): Promise<ProfileResponse | null> {
  try {
    const response = await api.get<ProfileResponse>(
      config.api.endpoints.analyticsProfile
    );
    return response.data;
  } catch (err) {
    const error = handleError(err);
    if (error.status === 401 || error.status === 404) return null;
    logger.error('Failed to get profile:', err);
    return null;
  }
}

export async function updateProfile(data: Partial<UserProfile>): Promise<ProfileResponse | null> {
  try {
    const response = await api.post<ProfileResponse>(
      config.api.endpoints.analyticsProfile,
      data
    );
    return response.data;
  } catch (err) {
    logger.error('Failed to update profile:', err);
    return null;
  }
}
