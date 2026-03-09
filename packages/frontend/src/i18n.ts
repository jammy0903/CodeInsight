import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import koTranslation from './locales/ko/translation.json';
import zhTranslation from './locales/zh/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  ko: {
    translation: koTranslation,
  },
  zh: {
    translation: zhTranslation,
  },
};

i18n
  .use(LanguageDetector) // 브라우저 언어 감지
  .use(initReactI18next) // react-i18next 초기화
  .init({
    resources,
    fallbackLng: 'en', // 지원되지 않는 언어일 경우 영어로 표시
    interpolation: {
      escapeValue: false, // React는 이미 XSS 방어 기능이 있으므로 false로 설정
    },
    detection: {
      order: ['localStorage', 'querystring'], // 브라우저 언어 자동감지 비활성화 → 기본 영어
      caches: ['localStorage'],
    },
    debug: import.meta.env.DEV, // 개발 환경에서만 디버그 로그 출력
  });

export default i18n;
