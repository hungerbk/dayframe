import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import type { TimeBlock } from "@/types";
import { pickRandomColor, applyTheme } from "@/utils";
import type { Theme } from "@/constants/palettes";
import Button from "@/components/ui/Button";
import { DropdownPanel, DropdownItem } from "@/components/ui/Dropdown";
import TimeBlockInput from "@/components/ui/TimeBlockInput";
import ToggleGroup from "@/components/ui/ToggleGroup";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { CX, CY, OUTER_R, INNER_R, COLOR_RING_STROKE, COLOR_CIRCLE_BG } from "./svgUtils";
import { MAX_BLOCKS } from "@/constants/timetable";
import { BlockArc } from "./BlockArc";
import { HourTicks, HourLabels, SketchBackground, SketchHourTicks, SketchCircleStroke } from "./TimetableCircle";
import { usePngDownload } from "@/hooks/usePngDownload";
import DownloadButton from "@/components/ui/DownloadButton";
import { useTimetableStorage } from "@/hooks/useTimetableStorage";
import Icon from "@/components/ui/Icon";

export default function Timetable() {
  const { t } = useTranslation();
  const { blocks, setBlocks, shape, setShape, isSketch, setIsSketch, selectedTheme, setSelectedTheme, numberDisplay, setNumberDisplay, blockReset, fullReset } = useTimetableStorage();
  const { isDownloading, targetRef, download } = usePngDownload(selectedTheme.ui.page, isSketch);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<TimeBlock | null>(null);
  const [editingSnapshot, setEditingSnapshot] = useState<TimeBlock | null>(null);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const resetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resetOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (resetRef.current && !resetRef.current.contains(e.target as Node)) {
        setResetOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [resetOpen]);

  useLayoutEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme]);

  function handleThemeSelect(theme: Theme) {
    setSelectedTheme(theme);
    setBlocks((prev) =>
      prev.map((block, i) => ({
        ...block,
        // customColor가 있는 블록은 테마 변경 영향을 받지 않는다
        // paletteIndex가 있으면 해당 팔레트 위치 색상, 없으면 블록 순서 기반 색상
        color: block.customColor ?? theme.blockColors[(block.paletteIndex ?? i) % theme.blockColors.length],
      })),
    );
    if (editingDraft) {
      const idx = blocks.findIndex((b) => b.id === editingDraft.id);
      if (idx !== -1) {
        const paletteIdx = editingDraft.paletteIndex ?? idx;
        setEditingDraft({ ...editingDraft, color: editingDraft.customColor ?? theme.blockColors[paletteIdx % theme.blockColors.length] });
        // 편집 중 테마가 바뀌면 스냅샷도 새 테마 기준으로 갱신해야 취소 시 올바른 색상으로 돌아온다
        setEditingSnapshot((prev) => {
          if (!prev) return null;
          const snapshotPaletteIdx = prev.paletteIndex ?? idx;
          return { ...prev, color: prev.customColor ?? theme.blockColors[snapshotPaletteIdx % theme.blockColors.length] };
        });
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

  function clearEditState() {
    setSelectedBlockId(null);
    setEditingDraft(null);
    setEditingSnapshot(null);
  }

  function handleBlockClick(id: string) {
    if (selectedBlockId === id) {
      handleCancelEdit();
    } else {
      if (editingSnapshot) {
        setBlocks((prev) => prev.map((b) => (b.id === editingSnapshot.id ? editingSnapshot : b)));
      }
      const block = blocks.find((b) => b.id === id) ?? null;
      setSelectedBlockId(id);
      setEditingDraft(block);
      setEditingSnapshot(block);
    }
  }

  function handleDraftChange(draft: TimeBlock) {
    setEditingDraft(draft);
  }

  function handleCancelEdit() {
    if (editingSnapshot) {
      setBlocks((prev) => prev.map((b) => (b.id === editingSnapshot.id ? editingSnapshot : b)));
    }
    clearEditState();
  }

  function handleColorCommit(blockId: string, color: string, customColor: string | undefined, paletteIndex?: number) {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, color, customColor, paletteIndex } : b)));
  }

  function handleUpdate(block: TimeBlock) {
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? block : b)));
    clearEditState();
  }

  function handleDelete() {
    if (!selectedBlockId) return;
    setBlocks((prev) => prev.filter((b) => b.id !== selectedBlockId));
    clearEditState();
  }

  const editingBlock = blocks.find((b) => b.id === selectedBlockId);
  const blocksToRender = editingDraft ? blocks.map((b) => (b.id === editingDraft.id ? editingDraft : b)) : blocks;
  // 흰 원 위에 렌더링할 우선 블록: 호버 블록 → 선택 블록 순으로 z-order가 높아진다
  const priorityIds = new Set([hoveredBlockId, selectedBlockId].filter(Boolean) as string[]);
  const otherBlocks = blocksToRender.filter((b) => !priorityIds.has(b.id));
  const hoveredBlock = hoveredBlockId && hoveredBlockId !== selectedBlockId ? (blocksToRender.find((b) => b.id === hoveredBlockId) ?? null) : null;
  const selectedBlock = blocksToRender.find((b) => b.id === selectedBlockId) ?? null;

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-16 p-4 lg:p-8 lg:items-center max-w-5xl mx-auto">
      {/* 왼쪽: 시계 + 컨트롤 */}
      <div className="flex flex-col items-center gap-4 w-full lg:flex-1 min-w-0">
        <div ref={targetRef} className="w-full aspect-square max-w-[75vh]">
          <svg viewBox="0 0 600 600" width="100%" height="100%">
            {isSketch ? <SketchBackground /> : <circle cx={CX} cy={CY} r={OUTER_R} fill={COLOR_CIRCLE_BG} stroke={COLOR_RING_STROKE} strokeWidth={1} data-outer-circle />}

            {isSketch ? <SketchHourTicks /> : <HourTicks />}

            {/* shape 패스: 아크·이미지만 렌더링 */}
            {otherBlocks.map((block) => (
              <BlockArc
                key={block.id}
                block={block}
                innerR={innerR}
                sketch={isSketch}
                layer="shape"
                onClick={() => handleBlockClick(block.id)}
                isSelected={false}
                isHovered={false}
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
              />
            ))}

            {/* 도넛 모드: 블록이 구멍 안쪽을 침범하지 않도록 흰 원으로 덮는다 */}
            {innerR > 0 && <circle cx={CX} cy={CY} r={innerR} fill="var(--color-page)" data-bg-fill stroke={isSketch ? "none" : COLOR_RING_STROKE} strokeWidth={1} />}
            {innerR > 0 && isSketch && <SketchCircleStroke r={innerR} />}

            {/* text 패스: 모든 shape 위에 텍스트를 렌더링해 넘침이 가려지지 않게 한다 */}
            {otherBlocks.map((block) => (
              <BlockArc
                key={block.id}
                block={block}
                innerR={innerR}
                sketch={isSketch}
                layer="text"
              />
            ))}

            {/* 호버/선택된 블록은 흰 원 위에 렌더링해 안쪽으로도 확장되게 한다 */}
            {hoveredBlock && (
              <BlockArc
                key={hoveredBlock.id}
                block={hoveredBlock}
                innerR={Math.max(0, innerR - 12)}
                sketch={isSketch}
                onClick={() => handleBlockClick(hoveredBlock.id)}
                isSelected={false}
                isHovered={true}
                onMouseEnter={() => setHoveredBlockId(hoveredBlock.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
              />
            )}
            {selectedBlock && (
              <BlockArc
                key={selectedBlock.id}
                block={selectedBlock}
                innerR={Math.max(0, innerR - 12)}
                sketch={isSketch}
                onClick={() => handleBlockClick(selectedBlock.id)}
                isSelected={true}
                isHovered={selectedBlock.id === hoveredBlockId}
                onMouseEnter={() => setHoveredBlockId(selectedBlock.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
              />
            )}

            <HourLabels display={numberDisplay} blocks={blocksToRender} isSketch={isSketch} />
          </svg>
        </div>

        {/* 컨트롤 */}
        <div className="flex gap-3 flex-wrap justify-center">
          <ToggleGroup
            options={[
              { value: "donut", label: <Icon name="donut" width="20" height="20" />, ariaLabel: t("controls.shapeDonut") },
              { value: "circle", label: <Icon name="circle" width="20" height="20" />, ariaLabel: t("controls.shapeCircle") },
            ]}
            value={shape}
            onChange={(v) => setShape(v)}
          />
          <ToggleGroup
            options={[
              { value: "all", label: t("controls.displayAll") },
              { value: "block", label: t("controls.displayBlock") },
              { value: "major", label: t("controls.displayMajor") },
              { value: "none", label: t("controls.displayNone") },
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
          onColorCommit={handleColorCommit}
          blockColors={selectedTheme.blockColors}
          isMaxBlocks={blocks.length >= MAX_BLOCKS}
        />
        <div className="flex flex-col gap-4 mt-4">
          <div className="relative" ref={resetRef}>
            <Button variant="outline" onClick={() => setResetOpen((v) => !v)} className="w-full">
              {t("controls.reset")}
            </Button>
            {resetOpen && (
              <DropdownPanel side="bottom" align="left" className="w-full">
                <DropdownItem
                  onClick={() => {
                    blockReset();
                    setResetOpen(false);
                  }}>
                  <span className="flex flex-col gap-0.5">
                    <span>{t("controls.blockReset")}</span>
                    <span className="text-xs font-normal text-text/50">{t("controls.blockResetDesc")}</span>
                  </span>
                </DropdownItem>
                <DropdownItem
                  onClick={() => {
                    fullReset();
                    setResetOpen(false);
                  }}>
                  <span className="flex flex-col gap-0.5">
                    <span>{t("controls.fullReset")}</span>
                    <span className="text-xs font-normal text-text/50">{t("controls.fullResetDesc")}</span>
                  </span>
                </DropdownItem>
              </DropdownPanel>
            )}
          </div>
          <p className="text-xs text-center text-text/50">{t("privacy")}</p>
        </div>
      </div>
    </div>
  );
}
