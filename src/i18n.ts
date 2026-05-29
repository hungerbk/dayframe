import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ko from "./locales/ko.json";
import en from "./locales/en.json";

const LANG_KEY = "dayframe_lang";
const saved = localStorage.getItem(LANG_KEY);
const browser = navigator.language.startsWith("ko") ? "ko" : "en";

const META: Record<string, { description: string; ogLocale: string }> = {
  ko: {
    description: "하루 일정을 원형 시간표로 시각화하는 도구. 블록을 추가하고 PNG로 저장해 다이어리나 굿노트에서 활용하세요.",
    ogLocale: "ko_KR",
  },
  en: {
    description: "Visualize your daily schedule as a circular timetable. Add blocks, save as PNG, and use it in your diary or GoodNotes.",
    ogLocale: "en_US",
  },
};

function applyLangMeta(lng: string) {
  const meta = META[lng] ?? META.ko;
  document.documentElement.lang = lng;
  document.querySelector('meta[name="description"]')?.setAttribute("content", meta.description);
  document.querySelector('meta[property="og:description"]')?.setAttribute("content", meta.description);
  document.querySelector('meta[property="og:locale"]')?.setAttribute("content", meta.ogLocale);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", meta.description);
}

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
  applyLangMeta(lng);
});

applyLangMeta(saved ?? browser);

export default i18n;
