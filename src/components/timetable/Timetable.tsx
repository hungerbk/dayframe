import { useState, useEffect } from "react";
import type { TimeBlock } from "@/types";
import { pickRandomColor, applyTheme } from "@/utils";
import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";
import TimeBlockInput from "@/components/ui/TimeBlockInput";
import ToggleGroup from "@/components/ui/ToggleGroup";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { CX, CY, OUTER_R, INNER_R, COLOR_RING_STROKE } from "./svgUtils";
import type { Shape, NumberDisplay } from "./svgUtils";
import { BlockArc, SketchBlockArc } from "./BlockArc";
import { HourTicks, HourLabels, SketchBackground, SketchHourTicks, SketchCircleStroke } from "./TimetableCircle";

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
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [shape, setShape] = useState<Shape>("donut");
  const [numberDisplay, setNumberDisplay] = useState<NumberDisplay>("major");
  const [selectedTheme, setSelectedTheme] = useState<Theme>(THEMES[0]);
  const [isSketch, setIsSketch] = useState(false);

  useEffect(() => {
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
  }

  // 선택된 모양에 따라 실제 렌더링에 쓸 innerR을 결정한다
  const innerR = shape === "donut" ? INNER_R : 0;

  function handleAdd(block: Omit<TimeBlock, "color">) {
    const prevColor = blocks[blocks.length - 1]?.color;
    const color = pickRandomColor(selectedTheme.blockColors, prevColor);
    setBlocks((prev) => [...prev, { ...block, color }]);
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-16 p-4 lg:p-8 lg:items-center max-w-5xl mx-auto">
      {/* 왼쪽: 시계 + 컨트롤 */}
      <div className="flex flex-col items-center gap-4 w-full lg:flex-1 min-w-0">
        <div className="w-full aspect-square max-w-[75vh]">
          <svg viewBox="0 0 600 600" width="100%" height="100%">
            {isSketch ? (
              <SketchBackground />
            ) : (
              <circle cx={CX} cy={CY} r={OUTER_R} fill="#f8fafc" stroke={COLOR_RING_STROKE} strokeWidth={1} />
            )}

            {isSketch ? <SketchHourTicks /> : <HourTicks />}

            {blocks.map((block) =>
              isSketch ? (
                <SketchBlockArc key={block.id} block={block} innerR={innerR} />
              ) : (
                <BlockArc key={block.id} block={block} innerR={innerR} />
              ),
            )}

            {/* 도넛 모드: 블록이 구멍 안쪽을 침범하지 않도록 흰 원으로 덮는다 */}
            {innerR > 0 && <circle cx={CX} cy={CY} r={innerR} fill="var(--color-page)" stroke={isSketch ? "none" : COLOR_RING_STROKE} strokeWidth={1} />}
            {innerR > 0 && isSketch && <SketchCircleStroke r={innerR} />}

            <HourLabels display={numberDisplay} blocks={blocks} isSketch={isSketch} />
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
          <ToggleGroup
            options={[
              { value: "normal", label: "기본" },
              { value: "sketch", label: "스케치" },
            ]}
            value={isSketch ? "sketch" : "normal"}
            onChange={(v) => setIsSketch(v === "sketch")}
          />
        </div>
      </div>

      {/* 오른쪽: 테마 선택 + 입력 폼 */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <ThemeSelector currentThemeId={selectedTheme.id} onSelect={handleThemeSelect} />
        <TimeBlockInput onAdd={handleAdd} />
      </div>
    </div>
  );
}
