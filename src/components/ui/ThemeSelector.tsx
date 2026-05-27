import { useTranslation } from "react-i18next";
import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";
import Icon from "./Icon";

interface Props {
  currentThemeId: string;
  onSelect: (theme: Theme) => void;
  isSketch: boolean;
  onSketchToggle: () => void;
}

export default function ThemeSelector({ currentThemeId, onSelect, isSketch, onSketchToggle }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-4 flex-wrap justify-center">
      {THEMES.map((theme) => (
        <button key={theme.id} type="button" onClick={() => onSelect(theme)} aria-pressed={currentThemeId === theme.id} className="flex flex-col items-center gap-2 group">
          <div
            className={`w-8 h-8 rounded-full transition-all ${currentThemeId === theme.id ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "opacity-60 group-hover:opacity-100"}`}
            style={{ backgroundColor: theme.blockColors[0] }}
          />
          <span className={`text-xs font-medium transition-colors ${currentThemeId === theme.id ? "text-text group-hover:text-text/70" : "text-slate-500 group-hover:text-slate-800"}`}>
            {theme.name}
          </span>
        </button>
      ))}
      <button
        type="button"
        aria-pressed={isSketch}
        aria-label={t("theme.sketchMode")}
        onClick={onSketchToggle}
        className={`group flex flex-col items-center gap-2 transition-colors ${isSketch ? "text-text" : "text-text/30 hover:text-text/60"}`}>
        <div
          className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isSketch ? "border-border bg-background scale-110 group-hover:bg-border/30" : "border-text/20"}`}>
          <Icon name="pencil" width="18" height="18" />
        </div>
        <span className={`text-xs font-medium transition-colors ${isSketch ? "group-hover:text-text/70" : ""}`}>{t("theme.sketch")}</span>
      </button>
    </div>
  );
}
