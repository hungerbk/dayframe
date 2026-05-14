import { useState } from "react";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  function handleSelect(code: string) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-sm text-text/50 hover:text-text/80 transition-colors px-2 py-1.5 rounded-lg hover:bg-border/20">
        <span>
          {t("language.label")}: {currentLang.label}
        </span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-background border border-border rounded-lg shadow-md overflow-hidden z-20 min-w-30">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleSelect(lang.code)}
              className={`w-full px-4 py-2 text-sm text-left transition-colors hover:bg-border/30 ${lang.code === currentLang.code ? "text-primary font-medium" : "text-text"}`}>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
