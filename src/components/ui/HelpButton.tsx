import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDropdown } from "@/hooks/useDropdown";
import { DropdownPanel } from "./Dropdown";

const FEEDBACK_URL = "https://forms.gle/ouEKe39UYNK8mxe29";

export default function HelpButton() {
  const { t } = useTranslation();
  const { open, toggle, anchorProps } = useDropdown();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [align, setAlign] = useState<"left" | "right">("right");

  useLayoutEffect(() => {
    if (!open || !wrapperRef.current) return;
    const { left } = wrapperRef.current.getBoundingClientRect();
    setAlign(left < window.innerWidth / 2 ? "left" : "right");
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative" {...anchorProps}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t("help.ariaLabel")}
        className="flex items-center justify-center w-7 h-7 text-sm font-medium text-text/50 hover:text-text/80 transition-colors rounded-full border border-border/50 hover:bg-border/20">
        ?
      </button>
      {open && (
        <DropdownPanel side="bottom" align={align} className="w-64">
          <div className="px-4 pt-4 pb-3">
            <p className="text-sm font-semibold text-text mb-2">{t("help.title")}</p>
            <p className="text-xs text-text/60 leading-relaxed whitespace-pre-line">{t("help.description")}</p>
          </div>
          <div className="border-t border-border px-4 py-3">
            <a href={FEEDBACK_URL} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
              {t("help.feedbackLink")}
            </a>
          </div>
        </DropdownPanel>
      )}
    </div>
  );
}
