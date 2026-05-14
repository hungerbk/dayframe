import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ko from "./locales/ko.json";
import en from "./locales/en.json";

const LANG_KEY = "dayframe_lang";
const saved = localStorage.getItem(LANG_KEY);
const browser = navigator.language.startsWith("ko") ? "ko" : "en";

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: saved ?? browser,
  fallbackLng: "ko",
  interpolation: { escapeValue: false }, // 리액트는 이미 XSS 공격으로부터 안전하므로 false 설정
});

i18n.on("languageChanged", (lng) => {
  localStorage.setItem(LANG_KEY, lng);
});

export default i18n;
