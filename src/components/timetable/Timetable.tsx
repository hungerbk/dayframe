import { useLayoutEffect, useState } from "react";
import type { TimeBlock } from "@/types";
import { pickRandomColor, applyTheme } from "@/utils";
import type { Theme } from "@/constants/palettes";
import Button from "@/components/ui/Button";
import TimeBlockInput from "@/components/ui/TimeBlockInput";
import ToggleGroup from "@/components/ui/ToggleGroup";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { CX, CY, OUTER_R, INNER_R, COLOR_RING_STROKE, COLOR_CIRCLE_BG } from "./svgUtils";
import { BlockArc } from "./BlockArc";
import { HourTicks, HourLabels, SketchBackground, SketchHourTicks, SketchCircleStroke } from "./TimetableCircle";
import { usePngDownload } from "@/hooks/usePngDownload";
import DownloadButton from "@/components/ui/DownloadButton";
import { useTimetableStorage } from "@/hooks/useTimetableStorage";

// 도넛 아이콘: 두꺼운 테두리의 원
function DonutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="4" />
    </svg>
  );
}

// 원형 아이콘: 꽉 찬 원
function CircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <circle cx="10" cy="10" r="9" fill="currentColor" />
    </svg>
  );
}

export default function Timetable() {
  const { blocks, setBlocks, shape, setShape, isSketch, setIsSketch, selectedTheme, setSelectedTheme, numberDisplay, setNumberDisplay, blockReset, fullReset } = useTimetableStorage();
  const { isDownloading, targetRef, download } = usePngDownload(selectedTheme.ui.page, isSketch);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TimeBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  useLayoutEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  function handleThemeSelect(theme: Theme) {
    setSelectedTheme(theme);
    setBlocks((prev) =>
      prev.map((block, i) => ({
        ...block,
        color: theme.blockColors[i % theme.blockColors.length],
      })),
    );
    if (editingDraft) {
      const idx = blocks.findIndex((b) => b.id === editingDraft.id);
      if (idx !== -1) {
        setEditingDraft({ ...editingDraft, color: theme.blockColors[idx % theme.blockColors.length] });
      }
    }
  }

  // 선택된 모양에 따라 실제 렌더링에 쓸 innerR을 결정한다
  const innerR = shape === "donut" ? INNER_R : 0;

  function handleAdd(block: Omit<TimeBlock, "color">) {
    const prevColor = blocks[blocks.length - 1]?.color;
    const color = pickRandomColor(selectedTheme.blockColors, prevColor);
    setBlocks((prev) => [...prev, { ...block, color }]);
  }

  function handleBlockClick(id: string) {
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
      setEditingDraft(null);
    } else {
      setSelectedBlockId(id);
      setEditingDraft(blocks.find((b) => b.id === id) ?? null);
    }
  }

  function handleDraftChange(draft: TimeBlock) {
    setEditingDraft(draft);
  }

  function handleCancelEdit() {
    setSelectedBlockId(null);
    setEditingDraft(null);
  }

  function handleUpdate(block: TimeBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)));
    handleCancelEdit();
  }

  function handleDelete() {
    if (!selectedBlockId) return;
    setBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId));
    handleCancelEdit();
  }

  const editingBlock = blocks.find((b) => b.id === selectedBlockId);
  const blocksToRender = editingDraft ? blocks.map((b) => (b.id === editingDraft.id ? editingDraft : b)) : blocks;
  // 흰 원 위에 렌더링할 우선 블록: 호버 블록 → 선택 블록 순으로 z-order가 높아진다
  const priorityIds = new Set([hoveredBlockId, selectedBlockId].filter(Boolean) as string[]);
  const otherBlocks = blocksToRender.filter((b) => !priorityIds.has(b.id));
  const hoveredBlock = hoveredBlockId && hoveredBlockId !== selectedBlockId
    ? (blocksToRender.find((b) => b.id === hoveredBlockId) ?? null)
    : null;
  const selectedBlock = blocksToRender.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-16 p-4 lg:p-8 lg:items-center max-w-5xl mx-auto">
      {/* 왼쪽: 시계 + 컨트롤 */}
      <div className="flex flex-col items-center gap-4 w-full lg:flex-1 min-w-0">
        <div ref={targetRef} className="w-full aspect-square max-w-[75vh]">
          <svg viewBox="0 0 600 600" width="100%" height="100%">
            {isSketch ? <SketchBackground /> : <circle cx={CX} cy={CY} r={OUTER_R} fill={COLOR_CIRCLE_BG} stroke={COLOR_RING_STROKE} strokeWidth={1} />}

            {isSketch ? <SketchHourTicks /> : <HourTicks />}

            {otherBlocks.map((block) => (
              <BlockArc key={block.id} block={block} innerR={innerR} sketch={isSketch} onClick={() => handleBlockClick(block.id)} isSelected={false} isHovered={false} onMouseEnter={() => setHoveredBlockId(block.id)} onMouseLeave={() => setHoveredBlockId(null)} />
            ))}

            {/* 도넛 모드: 블록이 구멍 안쪽을 침범하지 않도록 흰 원으로 덮는다 */}
            {innerR > 0 && <circle cx={CX} cy={CY} r={innerR} fill="var(--color-page)" data-bg-fill stroke={isSketch ? "none" : COLOR_RING_STROKE} strokeWidth={1} />}
            {innerR > 0 && isSketch && <SketchCircleStroke r={innerR} />}

            {/* 호버/선택된 블록은 흰 원 위에 렌더링해 안쪽으로도 확장되게 한다 */}
            {hoveredBlock && (
              <BlockArc key={hoveredBlock.id} block={hoveredBlock} innerR={Math.max(0, innerR - 12)} sketch={isSketch} onClick={() => handleBlockClick(hoveredBlock.id)} isSelected={false} isHovered={true} onMouseEnter={() => setHoveredBlockId(hoveredBlock.id)} onMouseLeave={() => setHoveredBlockId(null)} />
            )}
            {selectedBlock && (
              <BlockArc key={selectedBlock.id} block={selectedBlock} innerR={Math.max(0, innerR - 12)} sketch={isSketch} onClick={() => handleBlockClick(selectedBlock.id)} isSelected={true} isHovered={selectedBlock.id === hoveredBlockId} onMouseEnter={() => setHoveredBlockId(selectedBlock.id)} onMouseLeave={() => setHoveredBlockId(null)} />
            )}

            <HourLabels display={numberDisplay} blocks={blocksToRender} isSketch={isSketch} />
          </svg>
        </div>

        {/* 컨트롤 */}
        <div className="flex gap-3 flex-wrap justify-center">
          <ToggleGroup
            options={[
              { value: "donut", label: <DonutIcon />, ariaLabel: "도넛 모양" },
              { value: "circle", label: <CircleIcon />, ariaLabel: "원형 모양" },
            ]}
            value={shape}
            onChange={(v) => setShape(v)}
          />
          <ToggleGroup
            options={[
              { value: "all", label: "전체" },
              { value: "block", label: "내 일정" },
              { value: "major", label: "주요 시각" },
              { value: "none", label: "없음" },
            ]}
            value={numberDisplay}
            onChange={(v) => setNumberDisplay(v)}
          />
          <DownloadButton isDownloading={isDownloading} onDownload={download} disabled={!!selectedBlockId} />
        </div>
      </div>

      {/* 오른쪽: 테마 선택 + 입력 폼 */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <ThemeSelector currentThemeId={selectedTheme.id} onSelect={handleThemeSelect} isSketch={isSketch} onSketchToggle={() => setIsSketch((v) => !v)} />
        <TimeBlockInput
          key={selectedBlockId ? `${selectedBlockId}-${selectedTheme.id}` : "new"}
          onAdd={handleAdd}
          editingBlock={editingBlock}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onCancelEdit={handleCancelEdit}
          onDraftChange={handleDraftChange}
          blockColors={selectedTheme.blockColors}
        />
        <div className="flex flex-col gap-4 mt-4">
          <Button variant="outline" onClick={blockReset} className="w-full">
            내용 초기화
          </Button>
          <Button variant="danger" onClick={fullReset} className="w-full">
            전체 초기화
          </Button>
          <p className="text-xs text-center text-text/50">
            이 서비스는 데이터를 서버에 저장하지 않고 사용자의 브라우저에만 보관합니다. 소중한 개인정보 보호를 위해 완료된 일정은 주기적으로 삭제하는 것을 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
