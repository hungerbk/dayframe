import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import type { TimeBlock } from "@/types";
import { pickRandomColor, applyTheme } from "@/utils";
import { THEMES } from "@/constants/palettes";
import type { Theme } from "@/constants/palettes";
import TimeBlockInput from "@/components/ui/TimeBlockInput";
import ToggleGroup from "@/components/ui/ToggleGroup";
import ThemeSelector from "@/components/ui/ThemeSelector";
import { CX, CY, OUTER_R, INNER_R, COLOR_RING_STROKE, COLOR_CIRCLE_BG } from "./svgUtils";
import type { Shape, NumberDisplay } from "./svgUtils";
import { BlockArc, SketchBlockArc } from "./BlockArc";
import { HourTicks, HourLabels, SketchBackground, SketchHourTicks, SketchCircleStroke } from "./TimetableCircle";

function composeMobileCanvas(squareDataUrl: string, bgColor: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = Math.round(w * (16 / 9));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, Math.round((h - w) / 2), w, w);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = squareDataUrl;
  });
}

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
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSizeMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showSizeMenu]);

  async function handleDownload(size: "square" | "mobile") {
    if (!svgContainerRef.current || isDownloading) return;
    setIsDownloading(true);
    setShowSizeMenu(false);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const squareDataUrl = await toPng(svgContainerRef.current, {
        pixelRatio: 2,
        backgroundColor: selectedTheme.ui.page,
        // 외부 CDN 폰트 fetch 시 CORS 우회를 위해 캐시 없이 재요청
        fetchRequestInit: { cache: "no-cache" },
      });
      const finalDataUrl = size === "mobile" ? await composeMobileCanvas(squareDataUrl, selectedTheme.ui.page) : squareDataUrl;
      const link = document.createElement("a");
      link.download = `dayframe-${date}.png`;
      link.href = finalDataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

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
        <div ref={svgContainerRef} className="w-full aspect-square max-w-[75vh]">
          <svg viewBox="0 0 600 600" width="100%" height="100%">
            {isSketch ? <SketchBackground /> : <circle cx={CX} cy={CY} r={OUTER_R} fill={COLOR_CIRCLE_BG} stroke={COLOR_RING_STROKE} strokeWidth={1} />}

            {isSketch ? <SketchHourTicks /> : <HourTicks />}

            {blocks.map((block) => (isSketch ? <SketchBlockArc key={block.id} block={block} innerR={innerR} /> : <BlockArc key={block.id} block={block} innerR={innerR} />))}

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
          <div ref={downloadMenuRef} className="relative">
            <button
              type="button"
              onClick={() => !isDownloading && setShowSizeMenu((v) => !v)}
              disabled={isDownloading}
              aria-label="PNG 다운로드"
              aria-expanded={showSizeMenu}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-text text-sm font-medium hover:bg-border/30 active:opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M12 3v13M7 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 20h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              {isDownloading ? "저장 중" : "PNG"}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden className={`transition-transform ${showSizeMenu ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {showSizeMenu && (
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-white border border-border rounded-lg shadow-md overflow-hidden z-10 min-w-30">
                <button type="button" onClick={() => handleDownload("square")} className="w-full px-4 py-2 text-sm text-text text-left hover:bg-background transition-colors">
                  정사각형
                </button>
                <button type="button" onClick={() => handleDownload("mobile")} className="w-full px-4 py-2 text-sm text-text text-left hover:bg-background transition-colors border-t border-border">
                  모바일 (9:16)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 오른쪽: 테마 선택 + 입력 폼 */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4">
        <ThemeSelector currentThemeId={selectedTheme.id} onSelect={handleThemeSelect} isSketch={isSketch} onSketchToggle={() => setIsSketch((v) => !v)} />
        <TimeBlockInput onAdd={handleAdd} />
      </div>
    </div>
  );
}
