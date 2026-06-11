import { useTranslation, Trans } from "react-i18next";
import { useDropdown } from "@/hooks/useDropdown";
import { MAX_IMAGE_SIZE_MB } from "@/constants/timetable";
import { DropdownPanel } from "./Dropdown";

const FEEDBACK_URL = "https://forms.gle/ouEKe39UYNK8mxe29";

export default function HelpButton() {
  const { t } = useTranslation();
  const { open, toggle, anchorProps } = useDropdown();

  return (
    <div className="relative" {...anchorProps}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={t("help.ariaLabel")}
        className="flex items-center justify-center w-7 h-7 text-sm font-medium text-text/70 hover:text-text/90 transition-colors rounded-full border border-border bg-background hover:bg-border/30">
        ?
      </button>
      {open && (
        <DropdownPanel side="bottom" align="left" className="w-64 lg:left-auto lg:right-0">
          <div className="px-4 pt-4 pb-3">
            <p className="text-sm font-semibold text-text mb-2">{t("help.title")}</p>
            <p className="text-xs text-text/60 leading-relaxed whitespace-pre-line">
              <Trans i18nKey="help.description" components={{ strong: <strong className="font-medium text-text/80" /> }} values={{ maxMB: MAX_IMAGE_SIZE_MB }} />
            </p>
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
