import * as fs from 'fs/promises';
import * as path from 'path';
import { config } from '../../config';

interface LocalizedText {
  title?: string;
  description?: string;
}

interface CourseLocalizationCatalog {
  chapterTextById: Record<string, LocalizedText>;
  lessonTextById: Record<string, LocalizedText>;
}

interface CurriculumLesson {
  id?: string;
  lessonId?: string;
  title?: string;
  description?: string;
}

interface CurriculumChapter {
  id?: string;
  chapterId?: string;
  title?: string;
  description?: string;
  lessons?: Array<CurriculumLesson | string>;
}

interface CurriculumFile {
  chapters?: CurriculumChapter[];
}

interface LessonLocaleFile {
  lessonId?: string;
  title?: string;
  description?: string;
}

const catalogCache = new Map<string, CourseLocalizationCatalog>();

const C_CHAPTER_ZH: Record<string, LocalizedText> = {
  'c-ch0': { title: '控制流与函数', description: '循环与函数的基础语法' },
  'c-ch1': { title: '变量与内存', description: '理解变量如何占用内存' },
  'c-ch2': { title: '指针入门', description: '理解存储内存地址的变量' },
  'c-ch3': { title: '数组与指针', description: '连续内存空间与指针的紧密关系' },
  'c-ch4': { title: '函数与内存模型', description: '值传递、栈帧与指针参数' },
  'c-ch5': { title: '动态内存分配', description: '使用堆进行手动内存管理' },
  'c-ch6': { title: '结构体与字符串', description: '理解复合类型的内存布局' },
  'c-ch7': { title: '高级指针概念', description: '二级指针与复杂数据结构' },
  'c-ch8': { title: '函数指针与回调', description: '像传递数据一样传递代码' },
  'c-ch9': { title: '预处理器与宏', description: '编译前的代码生成与优化' },
  'c-ch10': { title: '文件 I/O 与系统资源', description: '文件输入输出：与操作系统通信' },
  'c-ch11': { title: '条件判断与分支', description: '使用 if-else、switch-case 与三元运算符控制流程' },
  'c-ch12': { title: '递归函数', description: '自调用函数原理与栈帧变化' },
  'c-ch13': { title: '数据类型与类型转换', description: 'C 语言中的多种数据类型与隐式/显式类型转换原理' },
};

function normalizeLocale(locale?: string): 'ko' | 'en' | 'zh' {
  if (!locale) return 'ko';
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('zh')) return 'zh';
  if (normalized.startsWith('en')) return 'en';
  return 'ko';
}

function getCurriculumCandidates(locale: 'ko' | 'en' | 'zh'): string[] {
  if (locale === 'ko') return ['curriculum.json'];
  if (locale === 'en') return ['curriculum.en.json', 'curriculum.json'];
  return ['curriculum.zh.json', 'curriculum.en.json', 'curriculum.json'];
}

async function readJsonFile<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function getChapterKey(chapter: CurriculumChapter): string | null {
  const chapterKey = (chapter as any).id || (chapter as any).chapterId;
  return typeof chapterKey === 'string' ? chapterKey : null;
}

function getLessonKey(lesson: CurriculumLesson): string | null {
  const lessonKey = lesson.id || lesson.lessonId;
  return typeof lessonKey === 'string' ? lessonKey : null;
}

async function applyLessonLocaleOverrides(
  languageId: string,
  localeTag: 'en' | 'zh',
  lessonTextById: Record<string, LocalizedText>
): Promise<void> {
  const lessonsDir = path.join(__dirname, '../../../prisma/content', languageId, 'lessons');
  let files: string[] = [];
  try {
    files = await fs.readdir(lessonsDir);
  } catch {
    return;
  }

  const localeFiles = files.filter((name) => name.endsWith(`.${localeTag}.json`));
  await Promise.all(
    localeFiles.map(async (fileName) => {
      const filePath = path.join(lessonsDir, fileName);
      const lessonData = await readJsonFile<LessonLocaleFile>(filePath);
      if (!lessonData?.lessonId || !lessonData.title) return;

      const prev = lessonTextById[lessonData.lessonId] || {};
      lessonTextById[lessonData.lessonId] = {
        title: lessonData.title,
        description: lessonData.description || prev.description,
      };
    })
  );
}

async function buildCatalog(languageId: string, locale: 'ko' | 'en' | 'zh'): Promise<CourseLocalizationCatalog | null> {
  const contentRoot = path.join(__dirname, '../../../prisma/content', languageId);

  let curriculum: CurriculumFile | null = null;
  for (const fileName of getCurriculumCandidates(locale)) {
    const candidatePath = path.join(contentRoot, fileName);
    curriculum = await readJsonFile<CurriculumFile>(candidatePath);
    if (curriculum) break;
  }

  if (!curriculum?.chapters?.length) {
    return null;
  }

  const chapterTextById: Record<string, LocalizedText> = {};
  const lessonTextById: Record<string, LocalizedText> = {};

  for (const chapter of curriculum.chapters) {
    const chapterKey = getChapterKey(chapter);
    if (!chapterKey) continue;

    chapterTextById[chapterKey] = {
      title: chapter.title,
      description: chapter.description,
    };

    for (const lesson of chapter.lessons || []) {
      if (typeof lesson === 'string') continue;
      const lessonKey = getLessonKey(lesson);
      if (!lessonKey) continue;

      lessonTextById[lessonKey] = {
        title: lesson.title,
        description: lesson.description,
      };
    }
  }

  if (locale === 'en') {
    await applyLessonLocaleOverrides(languageId, 'en', lessonTextById);
  }

  if (locale === 'zh') {
    if (languageId === 'c') {
      for (const [chapterId, text] of Object.entries(C_CHAPTER_ZH)) {
        chapterTextById[chapterId] = {
          title: text.title || chapterTextById[chapterId]?.title,
          description: text.description || chapterTextById[chapterId]?.description,
        };
      }
    }
    await applyLessonLocaleOverrides(languageId, 'zh', lessonTextById);
  }

  return { chapterTextById, lessonTextById };
}

export async function getCourseLocalizationCatalog(
  languageId: string,
  locale?: string
): Promise<CourseLocalizationCatalog | null> {
  const normalizedLocale = normalizeLocale(locale);
  if (normalizedLocale === 'ko') return null;

  if (config.server.isDev) {
    return buildCatalog(languageId, normalizedLocale);
  }

  const cacheKey = `${languageId}:${normalizedLocale}`;
  const cached = catalogCache.get(cacheKey);
  if (cached) return cached;

  const catalog = await buildCatalog(languageId, normalizedLocale);
  if (!catalog) return null;

  catalogCache.set(cacheKey, catalog);
  return catalog;
}
