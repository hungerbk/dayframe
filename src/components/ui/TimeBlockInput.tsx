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
  blockColors?: string[];
}

export default function TimeBlockInput({ onAdd, editingBlock, onUpdate, onDelete, blockColors }: Props) {
  const [startTime, setStartTime] = useState(editingBlock?.startTime ?? "");
  const [endTime, setEndTime] = useState(editingBlock?.endTime ?? "");
  const [title, setTitle] = useState(editingBlock?.title ?? "");
  const [color, setColor] = useState(editingBlock?.color ?? "");
  const [error, setError] = useState("");

  const isEditMode = editingBlock !== undefined;

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
              onClick={() => setColor(c)}
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
            setStartTime(formatTimeInput(e.target.value));
            setError("");
          }}
        />
        <Input
          label="종료 시간"
          className="flex-1"
          type="text"
          placeholder="00:00"
          value={endTime}
          onChange={(e) => {
            setEndTime(formatTimeInput(e.target.value));
            setError("");
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
        }}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="mt-1">
        {isEditMode ? "수정" : "추가"}
      </Button>
      {isEditMode && onDelete && (
        <Button type="button" variant="danger" onClick={onDelete} className="w-full">
          삭제
        </Button>
      )}
    </form>
  );
}
