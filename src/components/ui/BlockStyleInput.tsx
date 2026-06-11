import { useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { useTranslation } from "react-i18next";

interface Props {
  color: string;
  customColor?: string;
  blockColors: string[];
  onColorChange: (color: string, customColor: string | undefined, paletteIndex?: number) => void;
}

export default function BlockStyleInput({ color, customColor, blockColors, onColorChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isCustomActive = !!customColor && !blockColors.includes(customColor);
  const pickerColor = customColor ?? (color || (blockColors[0] ?? "#000000"));

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div className="flex items-center gap-3">
      <div ref={containerRef} className="relative flex-1 h-7">
        <button
          type="button"
          className="h-7 w-full rounded transition-opacity hover:opacity-80"
          style={isCustomActive ? {
            backgroundColor: customColor,
            outline: "2.5px solid var(--color-primary)",
            outlineOffset: "2px",
          } : {
            background: "linear-gradient(135deg, red, orange, yellow, green, blue, violet)",
            outline: "2.5px solid transparent",
            outlineOffset: "2px",
          }}
          onClick={() => setOpen((v) => !v)}
          aria-label={t("input.customColorLabel")}
        />
        {open && (
          <div className="absolute bottom-full left-0 mb-2 z-50 rounded-xl shadow-lg overflow-hidden">
            <HexColorPicker
              color={pickerColor}
              onChange={(hex) => onColorChange(hex, hex, undefined)}
            />
          </div>
        )}
      </div>
      <div className="w-px h-5 bg-border shrink-0" />
      <div className="flex justify-end gap-3">
        {blockColors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onColorChange(c, undefined, blockColors.indexOf(c))}
            className="w-7 h-7 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              outline: c === color ? "2.5px solid var(--color-primary)" : "2.5px solid transparent",
              outlineOffset: "2px",
            }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );
}
