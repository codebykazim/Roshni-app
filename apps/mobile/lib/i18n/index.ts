import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ur from './ur.json';

export type Language = 'en' | 'ur';

export function detectLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'ur' ? 'ur' : 'en';
}

export function isRtl(language: Language): boolean {
  return language === 'ur';
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ur: { translation: ur } },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

/**
 * Switch the UI language. Layout direction is applied by React Native only after a restart,
 * so the caller should tell the user when `directionChanged` is true.
 */
export function setLanguage(language: Language): { directionChanged: boolean } {
  void i18n.changeLanguage(language);
  const wantRtl = isRtl(language);
  const directionChanged = I18nManager.isRTL !== wantRtl;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(wantRtl);
  return { directionChanged };
}

export default i18n;
