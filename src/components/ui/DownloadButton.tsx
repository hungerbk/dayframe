import { useState } from "react";
import type { DownloadSize } from "@/hooks/usePngDownload";

const SIZE_OPTIONS: { value: DownloadSize; label: string }[] = [
  { value: "square", label: "정사각형" },
  { value: "mobile", label: "모바일 (9:16)" },
];

interface Props {
  isDownloading: boolean;
  onDownload: (size: DownloadSize) => void;
}

export default function DownloadButton({ isDownloading, onDownload }: Props) {
  const [open, setOpen] = useState(false);

  function handleSelect(size: DownloadSize) {
    setOpen(false);
    onDownload(size);
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
        {isDownloading ? "저장 중" : "PNG"}
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white border border-border rounded-lg shadow-md overflow-hidden z-10 min-w-30">
          {SIZE_OPTIONS.map((option, i) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={`w-full px-4 py-2 text-sm text-text text-left hover:bg-background transition-colors ${i > 0 ? "border-t border-border" : ""}`}>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
