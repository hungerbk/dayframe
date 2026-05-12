import { useState } from "react";
import type { DownloadSize } from "@/hooks/usePngDownload";

function MenuItem({ onClick, border, children }: { onClick: () => void; border?: "top" | "bottom"; children: React.ReactNode }) {
  const borderClass = border === "bottom" ? "border-b border-border" : border === "top" ? "border-t border-border" : "";
  return (
    <button type="button" onClick={onClick} className={`w-full px-4 py-2 text-sm text-text text-left flex items-center justify-between hover:bg-background transition-colors ${borderClass}`}>
      {children}
    </button>
  );
}

const SIZE_OPTIONS: { value: DownloadSize; label: string }[] = [
  { value: "square", label: "정사각형" },
  { value: "mobile", label: "모바일 (9:16)" },
];

interface Props {
  isDownloading: boolean;
  onDownload: (size: DownloadSize, removeBackground: boolean) => void;
}

export default function DownloadButton({ isDownloading, onDownload }: Props) {
  const [open, setOpen] = useState(false);
  const [removeBackground, setRemoveBackground] = useState(false);

  function handleSelect(size: DownloadSize) {
    setOpen(false);
    onDownload(size, removeBackground);
  }

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}>
      <button
        type="button"
        onClick={() => !isDownloading && setOpen((v) => !v)}
        disabled={isDownloading}
        aria-label="PNG 다운로드"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-background text-text text-sm font-medium hover:bg-border/30 active:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="inline-block w-10 text-center">PNG</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white border border-border rounded-lg shadow-md overflow-hidden z-10 min-w-30">
          <MenuItem onClick={() => setRemoveBackground((v) => !v)} border="bottom">
            <span className={removeBackground ? "text-text" : "text-text/50"}>배경 제거</span>
            <span className={`text-xs font-medium ${removeBackground ? "text-primary" : "text-text/30"}`}>{removeBackground ? "켜짐" : "꺼짐"}</span>
          </MenuItem>
          {SIZE_OPTIONS.map((option, i) => (
            <MenuItem key={option.value} onClick={() => handleSelect(option.value)} border={i > 0 ? "top" : undefined}>
              {option.label}
            </MenuItem>
          ))}
        </div>
      )}
    </div>
  );
}
