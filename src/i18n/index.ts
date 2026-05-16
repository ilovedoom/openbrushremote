import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "./locales";

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: "it",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export const LANGS = [
  { code: "it", flag: "🇮🇹", name: "Italiano" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "de", flag: "🇩🇪", name: "Deutsch" },
  { code: "es", flag: "🇪🇸", name: "Español" },
  { code: "ja", flag: "🇯🇵", name: "日本語" },
  { code: "ko", flag: "🇰🇷", name: "한국어" },
  { code: "zh", flag: "🇨🇳", name: "简体中文" },
] as const;

export default i18n;
