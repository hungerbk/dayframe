import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { DownloadSize } from "@/hooks/usePngDownload";
import { useDropdown } from "@/hooks/useDropdown";
import { DropdownPanel, DropdownItem } from "./Dropdown";
import Icon from "./Icon";

interface Props {
  isDownloading: boolean;
  onDownload: (size: DownloadSize, removeBackground: boolean) => void;
  disabled?: boolean;
}

export default function DownloadButton({ isDownloading, onDownload, disabled }: Props) {
  const { t } = useTranslation();
  const { open, toggle, close, anchorProps } = useDropdown();
  const [removeBackground, setRemoveBackground] = useState(false);

  const SIZE_OPTIONS: { value: DownloadSize; label: string }[] = [
    { value: "square", label: t("download.square") },
    { value: "mobile", label: t("download.mobile") },
  ];

  function handleSelect(size: DownloadSize) {
    close();
    onDownload(size, removeBackground);
  }

  return (
    <div className={`relative ${isDownloading || disabled ? "cursor-not-allowed" : ""}`} {...anchorProps}>
      <button
        type="button"
        onClick={toggle}
        disabled={isDownloading || disabled}
        aria-label={t("download.ariaLabel")}
        aria-expanded={open}
        className={`flex items-center h-full gap-1.5 px-3 rounded-lg border border-border bg-background text-text text-sm font-medium transition-colors disabled:opacity-50 ${isDownloading || disabled ? "pointer-events-none" : "hover:bg-border/30 active:opacity-80"}`}>
        <Icon name="download" width="15" height="15" />
        <span className="hidden lg:inline-block w-10 text-center">PNG</span>
        <Icon name="chevronDown" width="10" height="10" className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <DropdownPanel side="top" align="center" className="min-w-38">
          <DropdownItem onClick={() => setRemoveBackground((v) => !v)} border="bottom">
            <span className={removeBackground ? "text-text" : "text-text/50"}>{t("download.removeBackground")}</span>
            <span className={`text-xs font-medium ${removeBackground ? "text-primary" : "text-text/30"}`}>{removeBackground ? t("download.on") : t("download.off")}</span>
          </DropdownItem>
          {SIZE_OPTIONS.map((option, i) => (
            <DropdownItem key={option.value} onClick={() => handleSelect(option.value)} border={i > 0 ? "top" : undefined}>
              {option.label}
            </DropdownItem>
          ))}
        </DropdownPanel>
      )}
    </div>
  );
}
