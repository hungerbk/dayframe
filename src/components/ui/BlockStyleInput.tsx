import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  color: string;
  customColor?: string;
  blockColors: string[];
  onColorChange: (color: string, customColor: string | undefined) => void;
}

export default function BlockStyleInput({ color, customColor, blockColors, onColorChange }: Props) {
  const { t } = useTranslation();
  const colorInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1 h-7">
        <button
          type="button"
          className="h-7 w-full rounded transition-opacity hover:opacity-80"
          style={customColor ? {
            backgroundColor: customColor,
            outline: "2.5px solid var(--color-primary)",
            outlineOffset: "2px",
            color: "transparent",
          } : {
            background: "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
            outline: "2.5px solid transparent",
            outlineOffset: "2px",
            color: "transparent",
          }}
          onClick={() => colorInputRef.current?.click()}
          aria-label={t("input.customColorLabel")}
        />
        <input
          ref={colorInputRef}
          type="color"
          value={customColor ?? color}
          className="absolute opacity-0 w-px h-px"
          onChange={(e) => onColorChange(e.target.value, e.target.value)}
        />
      </div>
      <div className="w-px h-5 bg-border shrink-0" />
      <div className="flex justify-end gap-3">
        {blockColors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c, undefined)}
            className="w-7 h-7 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              outline: c === color && !customColor ? "2.5px solid var(--color-primary)" : "2.5px solid transparent",
              outlineOffset: "2px",
            }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}
