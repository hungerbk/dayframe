import { useTranslation } from "react-i18next";
import { useDropdown } from "@/hooks/useDropdown";
import { DropdownPanel, DropdownItem } from "./Dropdown";

const LANGUAGES = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
];

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const { open, toggle, close, anchorProps } = useDropdown();

  const currentLang = LANGUAGES.find((l) => i18n.language.startsWith(l.code)) ?? LANGUAGES[0];

  function handleSelect(code: string) {
    i18n.changeLanguage(code);
    close();
  }

  return (
    <div className="relative" {...anchorProps}>
      <button
        type="button"
        onClick={toggle}
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
        <DropdownPanel side="bottom" align="right">
          {LANGUAGES.map((lang) => (
            <DropdownItem key={lang.code} onClick={() => handleSelect(lang.code)} active={lang.code === currentLang.code}>
              {lang.label}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}
