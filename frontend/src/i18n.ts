import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import deTranslations from './i18n/de.json';
import enTranslations from './i18n/en.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      de: { translation: deTranslations }
    },
    lng: 'de',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
