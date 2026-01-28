import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import koTranslation from './locales/ko/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  ko: {
    translation: koTranslation,
  },
};

i18n
  .use(LanguageDetector) // 브라우저 언어 감지
  .use(initReactI18next) // react-i18next 초기화
  .init({
    resources,
    fallbackLng: 'en', // 지원되지 않는 언어일 경우 영어로 표시
    // lng: 'ko', // 기본 언어 강제 설정이 필요할 경우 사용
    interpolation: {
      escapeValue: false, // React는 이미 XSS 방어 기능이 있으므로 false로 설정
    },
    debug: process.env.NODE_ENV === 'development', // 개발 환경에서만 디버그 로그 출력
  });

export default i18n;
