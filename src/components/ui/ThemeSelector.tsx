import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";

interface Props {
  currentThemeId: string;
  onSelect: (theme: Theme) => void;
}

export default function ThemeSelector({ currentThemeId, onSelect }: Props) {
  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {THEMES.map((theme) => (
        <button
          key={theme.id}
          type="button"
          onClick={() => onSelect(theme)}
          aria-pressed={currentThemeId === theme.id}
          //   aria-label={theme.name}
          className="flex flex-col items-center gap-1 group">
          <div
            className={`w-8 h-8 rounded-full transition-all ${currentThemeId === theme.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-60 group-hover:opacity-100"}`}
            style={{ backgroundColor: theme.blockColors[0] }}
          />
          <span className="text-xs text-slate-500 font-medium">{theme.name}</span>
        </button>
      ))}
    </div>
  );
}
