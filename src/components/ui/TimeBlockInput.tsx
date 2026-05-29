import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TimeBlock } from "@/types";
import { isValidTime, isEndAfterStart, formatTimeInput, padTimeOnBlur } from "@/utils";
import { MAX_BLOCKS } from "@/constants/timetable";
import Input from "./Input";
import Button from "./Button";
import BlockStyleInput from "./BlockStyleInput";
import BlockImageInput from "./BlockImageInput";

interface Props {
  onAdd: (block: Omit<TimeBlock, "color">) => void;
  editingBlock?: TimeBlock;
  onUpdate?: (block: TimeBlock) => void;
  onDelete?: () => void;
  onCancelEdit?: () => void;
  onDraftChange?: (draft: TimeBlock) => void;
  onColorCommit?: (blockId: string, color: string, customColor: string | undefined, paletteIndex?: number) => void;
  blockColors?: string[];
  isMaxBlocks?: boolean;
}

export default function TimeBlockInput({ onAdd, editingBlock, onUpdate, onDelete, onCancelEdit, onDraftChange, onColorCommit, blockColors, isMaxBlocks = false }: Props) {
  const { t } = useTranslation();
  const [startTime, setStartTime] = useState(editingBlock?.startTime ?? "");
  const [endTime, setEndTime] = useState(editingBlock?.endTime ?? "");
  const [title, setTitle] = useState(editingBlock?.title ?? "");
  const [color, setColor] = useState(editingBlock?.color ?? "");
  const [customColor, setCustomColor] = useState(editingBlock?.customColor);
  const [paletteIndex, setPaletteIndex] = useState(editingBlock?.paletteIndex);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(editingBlock?.imageDataUrl);
  const [imageOffsetX, setImageOffsetX] = useState(editingBlock?.imageOffsetX ?? 0);
  const [imageOffsetY, setImageOffsetY] = useState(editingBlock?.imageOffsetY ?? 0);
  const [imageScale, setImageScale] = useState(editingBlock?.imageScale ?? 1);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const isEditMode = editingBlock !== undefined;
  const disabled = !isEditMode && isMaxBlocks;

  function notifyDraftChange(overrides: { startTime?: string; endTime?: string; title?: string }) {
    if (!editingBlock || !onDraftChange) return;
    const next = {
      startTime: overrides.startTime ?? startTime,
      endTime: overrides.endTime ?? endTime,
      title: overrides.title ?? title,
    };
    if (!isValidTime(next.startTime) || !isValidTime(next.endTime) || !isEndAfterStart(next.startTime, next.endTime)) return;
    onDraftChange({ ...editingBlock, ...next, color, customColor, paletteIndex, title: next.title.trim() || undefined, imageDataUrl, imageOffsetX, imageOffsetY, imageScale });
  }

  function handleColorChange(newColor: string, newCustomColor: string | undefined, newPaletteIndex?: number) {
    setColor(newColor);
    setCustomColor(newCustomColor);
    setPaletteIndex(newPaletteIndex);
    if (!editingBlock) return;
    if (onColorCommit) onColorCommit(editingBlock.id, newColor, newCustomColor, newPaletteIndex);
    if (!onDraftChange) return;
    if (!isValidTime(startTime) || !isValidTime(endTime) || !isEndAfterStart(startTime, endTime)) return;
    onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color: newColor, customColor: newCustomColor, paletteIndex: newPaletteIndex, imageDataUrl, imageOffsetX, imageOffsetY, imageScale });
  }

  function handleImageLoad(dataUrl: string) {
    setImageDataUrl(dataUrl);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setImageScale(1);
    if (editingBlock && onDraftChange && isValidTime(startTime) && isValidTime(endTime) && isEndAfterStart(startTime, endTime)) {
      onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl: dataUrl, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 });
    }
  }

  function handleImageRemove() {
    setImageDataUrl(undefined);
    setImageOffsetX(0);
    setImageOffsetY(0);
    setImageScale(1);
    if (editingBlock && onDraftChange && isValidTime(startTime) && isValidTime(endTime) && isEndAfterStart(startTime, endTime)) {
      onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl: undefined, imageOffsetX: 0, imageOffsetY: 0, imageScale: 1 });
    }
  }

  function handleImageTransform(ox: number, oy: number, sc: number) {
    setImageOffsetX(ox);
    setImageOffsetY(oy);
    setImageScale(sc);
    if (editingBlock && onDraftChange && isValidTime(startTime) && isValidTime(endTime) && isEndAfterStart(startTime, endTime)) {
      onDraftChange({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, imageDataUrl, imageOffsetX: ox, imageOffsetY: oy, imageScale: sc });
    }
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
      onUpdate({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color, customColor, paletteIndex, imageDataUrl, imageOffsetX, imageOffsetY, imageScale });
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
      {isEditMode && blockColors && blockColors.length > 0 && <BlockStyleInput color={color} customColor={customColor} blockColors={blockColors} onColorChange={handleColorChange} />}
      <div className="flex gap-3">
        <Input
          label={t("input.startTime")}
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={startTime}
          disabled={disabled}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setStartTime(val);
            setErrorKey(null);
            notifyDraftChange({ startTime: val });
          }}
          onBlur={() => {
            const val = padTimeOnBlur(startTime);
            if (val !== startTime) {
              setStartTime(val);
              notifyDraftChange({ startTime: val });
            }
          }}
        />
        <Input
          label={t("input.endTime")}
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={endTime}
          disabled={disabled}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setEndTime(val);
            setErrorKey(null);
            notifyDraftChange({ endTime: val });
          }}
          onBlur={() => {
            const val = padTimeOnBlur(endTime);
            if (val !== endTime) {
              setEndTime(val);
              notifyDraftChange({ endTime: val });
            }
          }}
        />
      </div>

      <Input
        label={t("input.titleLabel")}
        type="text"
        placeholder={t("input.titlePlaceholder")}
        value={title}
        maxLength={50}
        disabled={disabled}
        onChange={(e) => {
          setTitle(e.target.value);
          setErrorKey(null);
          notifyDraftChange({ title: e.target.value });
        }}
      />

      {isEditMode && (
        <BlockImageInput
          title={title}
          imageDataUrl={imageDataUrl}
          imageOffsetX={imageOffsetX}
          imageOffsetY={imageOffsetY}
          imageScale={imageScale}
          onImageLoad={handleImageLoad}
          onImageRemove={handleImageRemove}
          onImageTransform={handleImageTransform}
        />
      )}

      {errorKey && <p className="text-sm text-red-500">{t(errorKey)}</p>}
      {disabled && <p className="text-sm text-text/60">{t("input.maxBlocksReached", { max: MAX_BLOCKS })}</p>}

      <Button type="submit" disabled={disabled} className="mt-1">
        {isEditMode ? t("input.update") : t("input.add")}
      </Button>
      {isEditMode && <p className="text-xs text-text/40 text-center -mt-1">{t("input.updateHint")}</p>}
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
