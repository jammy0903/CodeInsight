/**
 * Lesson Content Loader
 *
 * JSON 파일에서 레슨 콘텐츠를 로드하고 메모리에 캐싱하는 서비스
 *
 * WHY: JSON 파일 방식을 선택한 이유
 * - DB 쿼리(5-20ms)보다 메모리 조회(0.1ms)가 10-200배 빠름
 * - Git으로 콘텐츠 버전 관리 가능
 * - 구조(DB)와 내용(JSON) 분리
 *
 * TRADEOFF: 실시간 수정 불가 (서버 재시작 필요)
 * REVISIT: 콘텐츠가 자주 변경되면 DB + Admin UI로 마이그레이션 고려
 */

import fs from 'fs/promises';
import path from 'path';
import { LessonContentData } from '../types/lesson-content';
import { logger } from '../utils/logger';

class LessonContentLoader {
  private cache = new Map<string, LessonContentData>();
  private isLoaded = false;

  /**
   * 서버 시작 시 모든 JSON 파일을 로드하여 캐싱
   * prisma/content/{lang}/lessons/*.json 구조 지원
   */
  async loadAll(): Promise<void> {
    const contentDir = path.join(__dirname, '../../prisma/content');

    try {
      // content 디렉토리의 모든 언어 폴더 읽기
      const languages = await fs.readdir(contentDir);
      let totalLoaded = 0;

      for (const lang of languages) {
        const lessonsDir = path.join(contentDir, lang, 'lessons');

        try {
          const files = await fs.readdir(lessonsDir);
          const jsonFiles = files.filter((f) => f.endsWith('.json'));

          for (const file of jsonFiles) {
            const filePath = path.join(lessonsDir, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const data: LessonContentData = JSON.parse(content);

            this.cache.set(data.lessonId, data);
            totalLoaded++;
          }
        } catch (error) {
          // 언어 폴더에 lessons 디렉토리가 없으면 스킵
          logger.debug(`No lessons directory for language: ${lang}`);
        }
      }

      this.isLoaded = true;
      logger.info(`${totalLoaded} lesson contents cached`);
    } catch (error) {
      logger.error('Failed to load lesson contents:', error);
      throw error;
    }
  }

  /**
   * 특정 레슨의 콘텐츠를 조회 (O(1) 메모리 조회)
   */
  getContent(lessonId: string): LessonContentData | null {
    if (!this.isLoaded) {
      throw new Error(
        'LessonContentLoader not initialized. Call loadAll() first.'
      );
    }

    return this.cache.get(lessonId) || null;
  }

  /**
   * 캐시된 레슨 개수 반환
   */
  getCachedCount(): number {
    return this.cache.size;
  }

  /**
   * 특정 레슨에 콘텐츠가 있는지 확인
   */
  hasContent(lessonId: string): boolean {
    return this.cache.has(lessonId);
  }
}

// 싱글톤 인스턴스
export const lessonContentLoader = new LessonContentLoader();
