import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TimeBlock } from "@/types";
import { isValidTime, isEndAfterStart, formatTimeInput } from "@/utils";
import Input from "./Input";
import Button from "./Button";

interface Props {
  onAdd: (block: Omit<TimeBlock, "color">) => void;
  editingBlock?: TimeBlock;
  onUpdate?: (block: TimeBlock) => void;
  onDelete?: () => void;
  onCancelEdit?: () => void;
  onDraftChange?: (draft: TimeBlock) => void;
  blockColors?: string[];
}

export default function TimeBlockInput({ onAdd, editingBlock, onUpdate, onDelete, onCancelEdit, onDraftChange, blockColors }: Props) {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(editingBlock?.startTime ?? "");
  const [endTime, setEndTime] = useState(editingBlock?.endTime ?? "");
  const [title, setTitle] = useState(editingBlock?.title ?? "");
  const [color, setColor] = useState(editingBlock?.color ?? "");
  const [customColor, setCustomColor] = useState(editingBlock?.customColor);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(editingBlock?.imageDataUrl);
  const [imageOffsetX, setImageOffsetX] = useState(editingBlock?.imageOffsetX ?? 0);
  const [imageOffsetY, setImageOffsetY] = useState(editingBlock?.imageOffsetY ?? 0);
  const [imageScale, setImageScale] = useState(editingBlock?.imageScale ?? 1);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = editingBlock !== undefined;

  // 시간이 유효할 때만 draft 변경을 부모에 알린다. 타이핑 중간에 잘못된 값이 전달되지 않게 한다.
  // imageDataUrl은 현재 상태를 항상 포함해 드래프트와 동기화한다.
  // clearCustomColor=true이면 customColor를 undefined로 초기화한다.
  function notifyDraftChange(overrides: { startTime?: string; endTime?: string; title?: string; color?: string; customColor?: string; clearCustomColor?: boolean }) {
    if (!editingBlock || !onDraftChange) return;
    const next = {
      startTime: overrides.startTime ?? startTime,
      endTime: overrides.endTime ?? endTime,
      title: overrides.title ?? title,
      color: overrides.color ?? color,
    };
    const nextCustomColor = overrides.clearCustomColor ? undefined : (overrides.customColor ?? customColor);
    if (!isValidTime(next.startTime) || !isValidTime(next.endTime) || !isEndAfterStart(next.startTime, next.endTime)) return;
    onDraftChange({ ...editingBlock, ...next, customColor: nextCustomColor, title: next.title.trim() || undefined, imageDataUrl, imageOffsetX, imageOffsetY, imageScale });
  }

  function notifyImageTransform(ox: number, oy: number, sc: number) {
    if (!editingBlock || !onDraftChange) return;
    if (!isValidTime(startTime) || !isValidTime(endTime) || !isEndAfterStart(startTime, endTime)) return;
    onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl, imageOffsetX: ox, imageOffsetY: oy, imageScale: sc });
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editingBlock || !onDraftChange) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageDataUrl(dataUrl);
      setImageOffsetX(0);
      setImageOffsetY(0);
      setImageScale(1);
      if (isValidTime(startTime) && isValidTime(endTime) && isEndAfterStart(startTime, endTime)) {
        onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl: dataUrl, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 });
      }
    };
    reader.readAsDataURL(file);
  }

  function handleImageRemove() {
    setImageDataUrl(undefined);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setImageScale(1);
    if (editingBlock && onDraftChange && isValidTime(startTime) && isValidTime(endTime) && isEndAfterStart(startTime, endTime)) {
      onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl: undefined, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!startTime || !endTime) {
      setErrorKey("input.errorBothRequired");
      return;
    }
    if (!isValidTime(startTime)) {
      setErrorKey("input.errorInvalidStart");
      return;
    }
    if (!isValidTime(endTime)) {
      setErrorKey("input.errorInvalidEnd");
      return;
    }
    if (!isEndAfterStart(startTime, endTime)) {
      setErrorKey("input.errorSameTime");
      return;
    }

    if (isEditMode && editingBlock && onUpdate) {
      onUpdate({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl, imageOffsetX, imageOffsetY, imageScale });
    } else {
      onAdd({
        id: crypto.randomUUID(),
        startTime,
        endTime,
        title: title.trim() || undefined,
      });

      setStartTime("");
      setEndTime("");
      setTitle("");
      setErrorKey(null);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
      {isEditMode && blockColors && blockColors.length > 0 && (
        <div className="flex items-center gap-3">
          {/* 커스텀 색상 피커 */}
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
              aria-label="커스텀 색상 선택"
            />
            <input
              ref={colorInputRef}
              type="color"
              value={customColor ?? "#808080"}
              className="absolute opacity-0 w-px h-px"
              onChange={(e) => {
                const c = e.target.value;
                setColor(c);
                setCustomColor(c);
                notifyDraftChange({ color: c, customColor: c });
              }}
            />
          </div>
          <div className="w-px h-5 bg-border shrink-0" />
          {/* 팔레트 색상 */}
          <div className="flex justify-end gap-3">
            {blockColors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setCustomColor(undefined);
                  notifyDraftChange({ color: c, clearCustomColor: true });
                }}
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
      )}
      <div className="flex gap-3">
        <Input
          label={t("input.startTime")}
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={startTime}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setStartTime(val);
            setErrorKey(null);
            notifyDraftChange({ startTime: val });
          }}
        />
        <Input
          label={t("input.endTime")}
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={endTime}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setEndTime(val);
            setErrorKey(null);
            notifyDraftChange({ endTime: val });
          }}
        />
      </div>

      <Input
        label={t("input.titleLabel")}
        type="text"
        placeholder={t("input.titlePlaceholder")}
        value={title}
        maxLength={50}
        onChange={(e) => {
          setTitle(e.target.value);
          setErrorKey(null);
          notifyDraftChange({ title: e.target.value });
        }}
      />

      {isEditMode && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-text">{t("input.imageLabel")}</span>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imageDataUrl ? (
            <>
              <div className="flex items-center gap-2">
                <img src={imageDataUrl} alt={title} className="w-10 h-10 rounded object-cover shrink-0 border border-border" />
                <Button type="button" variant="outline" onClick={handleImageRemove} className="flex-1 text-sm">
                  {t("input.imageRemove")}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5 mt-1">
                <span className="text-sm font-medium text-text">{t("input.imageAdjust")}</span>
                {([
                  { key: "imageOffsetX", left: "←", right: "→", value: imageOffsetX, setter: setImageOffsetX, min: -230, max: 230, step: 1 },
                  { key: "imageOffsetY", left: "↑", right: "↓", value: imageOffsetY, setter: setImageOffsetY, min: -230, max: 230, step: 1 },
                  { key: "imageScale",   left: "−", right: "+", value: imageScale,   setter: setImageScale,   min: 0.5,  max: 3,   step: 0.05 },
                ] as const).map(({ key, left, right, value, setter, min, max, step }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-base text-text/50 w-5 text-center shrink-0">{left}</span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={value}
                      className="flex-1 accent-primary cursor-pointer"
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setter(v);
                        const nx = key === "imageOffsetX" ? v : imageOffsetX;
                        const ny = key === "imageOffsetY" ? v : imageOffsetY;
                        const ns = key === "imageScale"   ? v : imageScale;
                        notifyImageTransform(nx, ny, ns);
                      }}
                    />
                    <span className="text-base text-text/50 w-5 text-center shrink-0">{right}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full text-sm">
              {t("input.imageUpload")}
            </Button>
          )}
        </div>
      )}

      {errorKey && <p className="text-sm text-red-500">{t(errorKey)}</p>}

      <Button type="submit" className="mt-1">
        {isEditMode ? t("input.update") : t("input.add")}
      </Button>
      {isEditMode && (
        <div className="flex gap-2">
          {onCancelEdit && (
            <Button type="button" variant="outline" onClick={onCancelEdit} className="flex-1">
              {t("input.cancel")}
            </Button>
          )}
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} className="flex-1">
              {t("input.delete")}
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
