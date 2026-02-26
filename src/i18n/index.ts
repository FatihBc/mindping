import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './en.json';
import tr from './tr.json';
import de from './de.json';
import it from './it.json';
import fr from './fr.json';
import ar from './ar.json';

const resources = {
  en: { translation: en },
  tr: { translation: tr },
  de: { translation: de },
  it: { translation: it },
  fr: { translation: fr },
  ar: { translation: ar },
};

const LANGUAGE_KEY = 'app_language';

const getStoredLanguage = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LANGUAGE_KEY);
};

export const changeLanguage = async (lang: string) => {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
};

export const getAvailableLanguages = () => [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

const initI18n = async () => {
  const storedLang = await getStoredLanguage();
  const defaultLang = storedLang || 'en';

  i18n.use(initReactI18next).init({
    resources,
    lng: defaultLang,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });
};

initI18n();

export default i18n;
