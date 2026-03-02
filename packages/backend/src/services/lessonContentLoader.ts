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
 * DEV MODE: 파일 변경 감지로 자동 리로드 (HMR 지원)
 * REVISIT: 콘텐츠가 자주 변경되면 DB + Admin UI로 마이그레이션 고려
 */

import * as fs from 'fs/promises';
import { watch, FSWatcher } from 'fs';
import * as path from 'path';
import { LessonContentData } from '../types/lesson-content';
import { expandDeltaSteps } from '../utils/expandDeltaSteps';
import { logger } from '../utils/logger';
import { config } from '../config';

class LessonContentLoader {
  // 캐시: 이미 읽은 파일 내용 (Memory Cache)
  private cache = new Map<string, LessonContentData>();
  // 파일 맵: 레슨ID -> 파일경로 (Lazy Loading용)
  private fileMap = new Map<string, string>();

  private isScanned = false;
  private watchers: FSWatcher[] = [];

  /**
   * 서버 시작 시 파일 경로만 스캔 (Lazy Loading 준비)
   * 내용(JSON)은 읽지 않으므로 매우 빠름
   */
  async scanFilePaths(): Promise<void> {
    // 1. 레슨 파일이 있는 디렉토리 (packages/backend/prisma/content - 최신 데이터 경로)
    const contentDir = path.join(__dirname, '../../prisma/content');

    try {
      // content 디렉토리의 모든 언어 폴더 읽기
      const languages = await fs.readdir(contentDir);
      let totalFiles = 0;

      for (const lang of languages) {
        const lessonsDir = path.join(contentDir, lang, 'lessons');

        try {
          const files = await fs.readdir(lessonsDir);
          // locale 파일(*.en.json 등)은 제외 — getContent()에서 locale 경로를 직접 조합하므로
          const jsonFiles = files.filter((f) => f.endsWith('.json') && !f.match(/\.\w{2}\.json$/));

          for (const file of jsonFiles) {
            const filePath = path.join(lessonsDir, file);
            // 파일명에서 lessonId 추출 (예: 'c-1-1.json' -> 'c-1-1')
            const lessonId = path.basename(file, '.json');

            this.fileMap.set(lessonId, filePath);
            totalFiles++;
          }

          // DEV MODE: 파일 변경 감지
          if (config.server.isDev) {
            this.watchDirectory(lessonsDir);
          }
        } catch (error) {
          // 언어 폴더에 lessons 디렉토리가 없으면 스킵
          logger.debug(`No lessons directory for language: ${lang}`);
        }
      }

      this.isScanned = true;
      logger.info(`${totalFiles} lesson paths scanned (Lazy Loading enabled)`);

      if (config.server.isDev) {
        logger.info(`[DEV] File watching enabled for lesson content`);
      }
    } catch (error) {
      logger.warn('Lesson content directory not found. Lesson content will not be available.', error);
      // Production 환경에서는 에러를 throw하지 않고 경고만 출력
      // 앱이 계속 실행되도록 함
      this.isScanned = true; // 스캔 완료로 표시하여 앱이 계속 실행되도록
    }
  }

  /**
   * 디렉토리 내 JSON 파일 변경 감지 (DEV MODE)
   * 변경 시 캐시를 비워서 다음 요청 때 다시 읽게 함
   */
  private watchDirectory(dir: string): void {
    const watcher = watch(dir, (eventType, filename) => {
      if (!filename || !filename.endsWith('.json')) return;

      // locale 파일 변경 시 base lessonId 기준으로 캐시 무효화
      const baseName = path.basename(filename, '.json');
      const localeMatch = baseName.match(/^(.+)\.\w{2}$/);
      const lessonId = localeMatch ? localeMatch[1] : baseName;

      // locale 버전 캐시도 함께 무효화
      if (localeMatch) {
        const cacheKey = baseName; // e.g., 'js-9-1.en'
        if (this.cache.has(cacheKey)) {
          this.cache.delete(cacheKey);
          logger.info(`[HMR] Cache invalidated: ${cacheKey}`);
        }
      }

      // 캐시 무효화 (Invalidate Cache)
      if (this.cache.has(lessonId)) {
        this.cache.delete(lessonId);
        logger.info(`[HMR] Cache invalidated: ${lessonId}`);
      }

      // 새 파일이 추가되었을 수 있으므로 fileMap 업데이트는 필요할 수 있으나,
      // 간단하게는 다음에 서버 재시작을 유도하거나, 여기서는 캐시 삭제만 처리
    });

    this.watchers.push(watcher);
  }

  /**
   * 파일 감지 정리 (서버 종료 시)
   */
  cleanup(): void {
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];
  }

  /**
   * 레슨 콘텐츠 조회 (Async Lazy Loading)
   * 1. 캐시에 있으면 즉시 반환
   * 2. 없으면 파일 읽어서 캐싱 후 반환
   *
   * locale 지원: locale='en'이면 'c-1-1.en.json'을 먼저 시도, 없으면 기본 파일로 fallback
   */
  async getContent(lessonId: string, locale?: string): Promise<LessonContentData | null> {
    if (!this.isScanned) {
      throw new Error(
        'LessonContentLoader not initialized. Call scanFilePaths() first.'
      );
    }

    // locale-aware cache key
    const cacheKey = locale && locale !== 'ko' ? `${lessonId}.${locale}` : lessonId;

    // 1. Memory Cache Hit
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 2. Try locale-specific file first (e.g., c-1-1.en.json)
    if (locale && locale !== 'ko') {
      const baseFilePath = this.fileMap.get(lessonId);
      if (baseFilePath) {
        const dir = path.dirname(baseFilePath);
        const localeFilePath = path.join(dir, `${lessonId}.${locale}.json`);
        const localeContent = await this.loadFile(localeFilePath, lessonId);
        if (localeContent) {
          this.cache.set(cacheKey, localeContent);
          return localeContent;
        }
      }
    }

    // 3. Fallback to default file
    if (this.cache.has(lessonId)) {
      return this.cache.get(lessonId)!;
    }

    const filePath = this.fileMap.get(lessonId);
    if (!filePath) {
      return null;
    }

    const content = await this.loadFile(filePath, lessonId);
    if (content) {
      this.cache.set(lessonId, content);
    }
    return content;
  }

  /**
   * 파일에서 레슨 콘텐츠를 로드하는 내부 헬퍼
   */
  private async loadFile(filePath: string, lessonId: string): Promise<LessonContentData | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Delta format 확장: delta 형식의 steps를 full state로 확장
      if (data.content?.deltaFormat === true && Array.isArray(data.content.steps)) {
        data.content.steps = expandDeltaSteps(data.content.steps, true);
      }

      const typedData: LessonContentData = data;

      // Validate: JSON 내부 ID와 파일명 ID가 일치하는지 (선택사항)
      if (typedData.lessonId !== lessonId) {
        logger.warn(`Lesson ID mismatch in file ${filePath}: expected ${lessonId}, found ${typedData.lessonId}`);
      }

      return typedData;
    } catch {
      return null;
    }
  }

  /**
   * 서버 시작 시 모든 레슨 JSON을 메모리에 프리로드
   * 첫 요청의 디스크 I/O (~5-20ms) 제거
   */
  async preloadAll(): Promise<void> {
    const entries = Array.from(this.fileMap.entries());
    await Promise.all(
      entries.map(([lessonId]) => this.getContent(lessonId))
    );
    logger.info(`${this.cache.size} lessons preloaded into memory`);
  }

  /**
   * 현재 메모리에 캐시된 레슨 개수
   */
  getCachedCount(): number {
    return this.cache.size;
  }

  /**
   * 레슨 존재 여부 확인 (파일 맵 기준)
   */
  hasContent(lessonId: string): boolean {
    return this.fileMap.has(lessonId);
  }
}

// 싱글톤 인스턴스
export const lessonContentLoader = new LessonContentLoader();
