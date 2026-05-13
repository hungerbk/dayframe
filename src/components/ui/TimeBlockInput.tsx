import { useState } from "react";
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
  const [startTime, setStartTime] = useState(editingBlock?.startTime ?? "");
  const [endTime, setEndTime] = useState(editingBlock?.endTime ?? "");
  const [title, setTitle] = useState(editingBlock?.title ?? "");
  const [color, setColor] = useState(editingBlock?.color ?? "");
  const [error, setError] = useState("");

  const isEditMode = editingBlock !== undefined;

  // 시간이 유효할 때만 draft 변경을 부모에 알린다. 타이핑 중간에 잘못된 값이 전달되지 않게 한다.
  function notifyDraftChange(overrides: { startTime?: string; endTime?: string; title?: string; color?: string }) {
    if (!editingBlock || !onDraftChange) return;
    const next = {
      startTime: overrides.startTime ?? startTime,
      endTime: overrides.endTime ?? endTime,
      title: overrides.title ?? title,
      color: overrides.color ?? color,
    };
    if (!isValidTime(next.startTime) || !isValidTime(next.endTime) || !isEndAfterStart(next.startTime, next.endTime)) return;
    onDraftChange({ ...editingBlock, ...next, title: next.title.trim() || undefined });
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();

    if (!startTime || !endTime) {
      setError("시작 시간과 종료 시간을 모두 입력해주세요.");
      return;
    }
    if (!isValidTime(startTime)) {
      setError("시작 시간이 올바르지 않습니다. (00:00~24:00 사이로 입력해주세요.)");
      return;
    }
    if (!isValidTime(endTime)) {
      setError("종료 시간이 올바르지 않습니다. (00:00~24:00 사이로 입력해주세요.)");
      return;
    }
    if (!isEndAfterStart(startTime, endTime)) {
      setError("시작 시간과 종료 시간은 같을 수 없습니다.");
      return;
    }

    if (isEditMode && editingBlock && onUpdate) {
      onUpdate({ ...editingBlock, startTime, endTime, title: title.trim() || undefined, color });
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
      setError("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
      {isEditMode && blockColors && blockColors.length > 0 && (
        <div className="flex-1 flex justify-end gap-3">
          {blockColors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColor(c);
                notifyDraftChange({ color: c });
              }}
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
      )}
      <div className="flex gap-3">
        <Input
          label="시작 시간"
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={startTime}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setStartTime(val);
            setError("");
            notifyDraftChange({ startTime: val });
          }}
        />
        <Input
          label="종료 시간"
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={endTime}
          onChange={(e) => {
            const val = formatTimeInput(e.target.value);
            setEndTime(val);
            setError("");
            notifyDraftChange({ endTime: val });
          }}
        />
      </div>

      <Input
        label="제목 (선택)"
        type="text"
        placeholder="예: 점심시간"
        value={title}
        maxLength={50}
        onChange={(e) => {
          setTitle(e.target.value);
          setError("");
          notifyDraftChange({ title: e.target.value });
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="mt-1">
        {isEditMode ? "수정" : "추가"}
      </Button>
      {isEditMode && (
        <div className="flex gap-2">
          {onCancelEdit && (
            <Button type="button" variant="outline" onClick={onCancelEdit} className="flex-1">
              취소
            </Button>
          )}
          {onDelete && (
            <Button type="button" variant="danger" onClick={onDelete} className="flex-1">
              삭제
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
