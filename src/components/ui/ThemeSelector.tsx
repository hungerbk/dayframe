import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";

function PencilIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 20h4L18.5 9.5a2.828 2.828 0 0 0-4-4L4 16v4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14.5 5.5l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

interface Props {
  currentThemeId: string;
  onSelect: (theme: Theme) => void;
  isSketch: boolean;
  onSketchToggle: () => void;
}

export default function ThemeSelector({ currentThemeId, onSelect, isSketch, onSketchToggle }: Props) {
  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {THEMES.map((theme) => (
        <button key={theme.id} type="button" onClick={() => onSelect(theme)} aria-pressed={currentThemeId === theme.id} className="flex flex-col items-center gap-2 group">
          <div
            className={`w-8 h-8 rounded-full transition-all ${currentThemeId === theme.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-60 group-hover:opacity-100"}`}
            style={{ backgroundColor: theme.blockColors[0] }}
          />
          <span className="text-xs text-slate-500 font-medium">{theme.name}</span>
        </button>
      ))}
      <button
        type="button"
        aria-pressed={isSketch}
        aria-label="스케치 모드"
        onClick={onSketchToggle}
        className={`flex flex-col items-center gap-2 transition-colors ${isSketch ? "text-text" : "text-text/30 hover:text-text/60"}`}>
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSketch ? "border-border bg-background scale-110" : "border-text/20"}`}>
          <PencilIcon />
        </div>
        <span className="text-xs font-medium">sketch</span>
      </button>
    </div>
  );
}
