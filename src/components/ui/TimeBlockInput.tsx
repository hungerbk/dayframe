import { useState } from "react";
import type { TimeBlock } from "@/types";
import { isValidTime, isEndAfterStart, formatTimeInput } from "@/utils";
import Input from "./Input";
import Button from "./Button";

interface Props {
  onAdd: (block: Omit<TimeBlock, "color">) => void;
}

export default function TimeBlockInput({ onAdd }: Props) {
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-background">
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
        추가
      </Button>
    </form>
  );
}
