import { useState } from "react";
import type { TimeBlock } from "@/types";
import { pickRandomColor } from "@/utils";
import { CORAL_BLOCK_COLORS } from "@/constants/palettes";
import TimeBlockInput from "@/components/ui/TimeBlockInput";
import ToggleGroup from "@/components/ui/ToggleGroup";

// SVG 뷰박스 중심 좌표 (600×600 기준)
const CX = 300;
const CY = 300;
const OUTER_R = 230; // 바깥 반지름
const INNER_R = 105; // 도넛 모드의 안쪽 반지름 (구멍)
const LABEL_R = 258; // 시각 레이블을 원 바깥에 배치할 반지름
const TICK_OUTER = OUTER_R + 10; // 눈금선 바깥 끝 반지름
const TICK_MINOR_INNER = OUTER_R + 4; // 일반 눈금선 안쪽 끝 반지름 (짧게)
const TICK_MAJOR_INNER = OUTER_R + 2; // 주요 눈금선(0, 6, 12, 18시) 안쪽 끝 반지름 (더 길게)

type Shape = "donut" | "circle";
type NumberDisplay = "all" | "major" | "none";

/**
 * HH:MM 문자열을 SVG 각도(라디안)로 변환한다.
 * SVG 각도 0은 오른쪽(3시 방향)이므로, -π/2를 빼서 12시 방향(00:00)이 기준이 되게 한다.
 * 예) 00:00 → -π/2, 06:00 → 0, 12:00 → π/2, 18:00 → π
 */
function timeToAngle(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / (24 * 60)) * 2 * Math.PI - Math.PI / 2;
}

/**
 * 극좌표(반지름, 각도)를 SVG 직교좌표(x, y)로 변환한다.
 * 중심은 (CX, CY)를 기준으로 한다.
 */
function polar(r: number, angle: number) {
  return { x: CX + r * Math.cos(angle), y: CY + r * Math.sin(angle) };
}

/**
 * 부채꼴 SVG path를 생성한다.
 *
 * innerR > 0 (도넛 모드): 외호 → 직선 → 내호 역방향 → Z 로 닫힌 고리 조각을 만든다.
 * innerR = 0 (원형 모드): 중심 → 외호 시작점 → 외호 → Z 로 파이 조각을 만든다.
 *
 * large-arc-flag: 호의 각도가 π(180°)를 초과하면 1, 아니면 0.
 */
function sectorPath(innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  const f = (n: number) => n.toFixed(3);
  const arcAngle = endAngle - startAngle;
  const sO = polar(outerR, startAngle);

  // SVG arc는 시작점과 끝점이 같으면 아무것도 그리지 않는다.
  // 24시간 블록(arcAngle ≈ 2π)처럼 완전한 원이 되는 경우, 반호(半弧) 두 개로 나눠 그린다.
  if (arcAngle >= 2 * Math.PI - 0.001) {
    const mO = polar(outerR, startAngle + Math.PI);
    if (innerR === 0) {
      return [
        `M ${CX} ${CY}`,
        `L ${f(sO.x)} ${f(sO.y)}`,
        `A ${outerR} ${outerR} 0 1 1 ${f(mO.x)} ${f(mO.y)}`,
        `A ${outerR} ${outerR} 0 1 1 ${f(sO.x)} ${f(sO.y)}`,
        "Z",
      ].join(" ");
    }
    const sI = polar(innerR, startAngle);
    const mI = polar(innerR, startAngle + Math.PI);
    return [
      // 외호: 시계 방향으로 두 반호
      `M ${f(sO.x)} ${f(sO.y)}`,
      `A ${outerR} ${outerR} 0 1 1 ${f(mO.x)} ${f(mO.y)}`,
      `A ${outerR} ${outerR} 0 1 1 ${f(sO.x)} ${f(sO.y)}`,
      // 내호: 반시계 방향으로 두 반호 (구멍 역할)
      `M ${f(sI.x)} ${f(sI.y)}`,
      `A ${innerR} ${innerR} 0 1 0 ${f(mI.x)} ${f(mI.y)}`,
      `A ${innerR} ${innerR} 0 1 0 ${f(sI.x)} ${f(sI.y)}`,
      "Z",
    ].join(" ");
  }

  const large = arcAngle > Math.PI ? 1 : 0;
  const eO = polar(outerR, endAngle);

  if (innerR === 0) {
    // 중심에서 펼쳐지는 파이 조각
    return [`M ${CX} ${CY}`, `L ${f(sO.x)} ${f(sO.y)}`, `A ${outerR} ${outerR} 0 ${large} 1 ${f(eO.x)} ${f(eO.y)}`, "Z"].join(" ");
  }

  // 도넛 고리 조각: 외호(시계) → 내호(반시계)
  const sI = polar(innerR, startAngle);
  const eI = polar(innerR, endAngle);
  return [`M ${f(sO.x)} ${f(sO.y)}`, `A ${outerR} ${outerR} 0 ${large} 1 ${f(eO.x)} ${f(eO.y)}`, `L ${f(eI.x)} ${f(eI.y)}`, `A ${innerR} ${innerR} 0 ${large} 0 ${f(sI.x)} ${f(sI.y)}`, "Z"].join(" ");
}

const HOUR_LABELS: { hour: number; label: string }[] = [
  { hour: 0, label: "0" },
  { hour: 6, label: "6" },
  { hour: 12, label: "12" },
  { hour: 18, label: "18" },
];

function HourTicks() {
  const ticks = Array.from({ length: 24 }, (_, i) => i);
  return (
    <>
      {ticks.map((h) => {
        const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
        const isMajor = h % 6 === 0;
        // 주요 시각은 눈금 시작점을 바깥쪽으로 당겨 더 길게 보이게 한다
        const inner = isMajor ? TICK_MAJOR_INNER : TICK_MINOR_INNER;
        const p1 = polar(inner, angle);
        const p2 = polar(TICK_OUTER, angle);
        return <line key={h} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke={isMajor ? "#94a3b8" : "#cbd5e1"} strokeWidth={isMajor ? 1.5 : 1} />;
      })}
    </>
  );
}

// 'all' 모드에서 블록 시각과 중복 체크할 주요 레이블 시각 목록
const MAJOR_TIME_SET = new Set(["00:00", "06:00", "12:00", "18:00", "24:00"]);

interface HourLabelsProps {
  display: NumberDisplay;
  blocks: TimeBlock[];
}

function HourLabels({ display, blocks }: HourLabelsProps) {
  if (display === "none") return null;

  const majorItems = HOUR_LABELS.map(({ hour, label }) => {
    const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
    const { x, y } = polar(LABEL_R, angle);
    return (
      <text key={`major-${hour}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill="#64748b">
        {label}
      </text>
    );
  });

  if (display === "major") return <>{majorItems}</>;

  // 'all' 모드: 주요 레이블 대신 블록 시작/종료 시각만 표시한다.
  // 주요 시각(0, 6, 12, 18시)과 겹치는 경우 중복을 제거한다.
  const blockTimes = blocks.flatMap((b) => [b.startTime, b.endTime]);
  const uniqueBlockTimes = [...new Set(blockTimes)].filter((t) => !MAJOR_TIME_SET.has(t));

  return (
    <>
      {uniqueBlockTimes.map((time) => {
        const [h, m] = time.split(":").map(Number);
        const angle = ((h * 60 + m) / (24 * 60)) * 2 * Math.PI - Math.PI / 2;
        const { x, y } = polar(LABEL_R, angle);
        // 정각(분=0)이면 시 숫자만, 아니면 H:MM 형식으로 표시한다
        const label = m === 0 ? String(h) : `${h}:${String(m).padStart(2, "0")}`;
        return (
          <text key={`block-${time}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={500} fill="#94a3b8">
            {label}
          </text>
        );
      })}
    </>
  );
}

interface BlockArcProps {
  block: TimeBlock;
  innerR: number;
}

const FONT_SIZE = 13;
const CHAR_WIDTH = 12; // 한글/영문 혼합 기준 글자당 평균 px (font-size 13 기준)
const LINE_HEIGHT = 18; // 줄 간격 px
const MAX_LINES = 3; // 도넛 반지름 공간(125px)을 고려한 최대 줄 수

/**
 * 텍스트를 최대 글자 수 기준으로 줄 배열로 나눈다.
 * 공백이 있으면 단어 단위로 줄을 나누고, 없으면 글자 단위로 자른다.
 * MAX_LINES 초과분은 버린다.
 */
function splitIntoLines(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let remaining = text;

  while (remaining.length > 0 && lines.length < MAX_LINES) {
    if (remaining.length <= maxCharsPerLine) {
      lines.push(remaining);
      break;
    }
    // 최대 길이 이내에서 마지막 공백을 찾아 단어 단위로 줄을 나눈다
    const spaceIdx = remaining.lastIndexOf(" ", maxCharsPerLine);
    const breakAt = spaceIdx > 0 ? spaceIdx : maxCharsPerLine;
    lines.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }

  return lines;
}

function BlockArc({ block, innerR }: BlockArcProps) {
  const startAngle = timeToAngle(block.startTime);
  let endAngle = timeToAngle(block.endTime);
  // 자정을 넘는 블록(예: 22:00~07:00): endAngle이 startAngle보다 작으면
  // 2π를 더해 시계 방향으로 이어지게 한다
  if (endAngle <= startAngle) endAngle += 2 * Math.PI;

  const arcAngle = endAngle - startAngle;
  const midAngle = startAngle + arcAngle / 2;
  // 텍스트 위치는 innerR에 따라 동적으로 계산한다 (원형 모드에서는 중심쪽으로 이동)
  const midTextR = (OUTER_R + innerR) / 2;
  const { x: tx, y: ty } = polar(midTextR, midAngle);

  // 텍스트 표시 최소 호 각도: π/24 ≈ 약 30분에 해당하는 각도
  const minAngleForText = Math.PI / 24;
  // arcAngle >= π이면 호의 중앙부는 공간이 충분하므로 지름 전체를 사용한다.
  // 작은 호에서는 현(chord) 길이로 가로 여백을 추정한다.
  const chordWidth = arcAngle >= Math.PI ? 2 * midTextR : 2 * Math.sin(arcAngle / 2) * midTextR;
  const maxCharsPerLine = Math.floor(chordWidth / CHAR_WIDTH);
  const showText = block.title && arcAngle >= minAngleForText && maxCharsPerLine >= 2;

  const lines = showText ? splitIntoLines(block.title!, maxCharsPerLine) : [];

  // 여러 줄을 세로 중앙에 맞추기 위해 첫 번째 tspan의 시작 위치를 위로 올린다.
  // 전체 텍스트 블록 높이의 절반만큼 ty에서 뺀다.
  const textBlockHalfHeight = ((lines.length - 1) * LINE_HEIGHT) / 2;

  return (
    <g>
      <path d={sectorPath(innerR, OUTER_R, startAngle, endAngle)} fill={block.color} stroke="white" strokeWidth={1} opacity={0.92} />
      {lines.length > 0 && (
        <text textAnchor="middle" dominantBaseline="central" fontSize={FONT_SIZE} fill="white" fontWeight={600} style={{ pointerEvents: "none", userSelect: "none" }}>
          {lines.map((line, i) => (
            <tspan key={i} x={tx} y={ty - textBlockHalfHeight + i * LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
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

export default function TimetableCanvas() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [shape, setShape] = useState<Shape>("donut");
  const [numberDisplay, setNumberDisplay] = useState<NumberDisplay>("major");

  // 선택된 모양에 따라 실제 렌더링에 쓸 innerR을 결정한다
  const innerR = shape === "donut" ? INNER_R : 0;

  // TimeBlockInput이 전달하는 color를 무시하고, 팔레트에서 자동 배정한다.
  // prevColor를 넘겨 같은 색이 연속으로 배정되지 않게 한다.
  function handleAdd(block: TimeBlock) {
    const prevColor = blocks[blocks.length - 1]?.color;
    const color = pickRandomColor(CORAL_BLOCK_COLORS, prevColor);
    setBlocks((prev) => [...prev, { ...block, color }]);
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-16 p-4 lg:p-8 lg:items-center max-w-5xl mx-auto">
      {/* 왼쪽: 시계 + 컨트롤 */}
      <div className="flex flex-col items-center gap-4 w-full lg:flex-1 min-w-0">
        <div className="w-full aspect-square max-w-[75vh]">
          <svg viewBox="0 0 600 600" width="100%" height="100%">
            {/* 배경 원 */}
            <circle cx={CX} cy={CY} r={OUTER_R} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
            <HourTicks />

            {blocks.map((block) => (
              <BlockArc key={block.id} block={block} innerR={innerR} />
            ))}

            {/* 도넛 모드: 블록이 구멍 안쪽을 침범하지 않도록 흰 원으로 덮는다 */}
            {innerR > 0 && <circle cx={CX} cy={CY} r={innerR} fill="white" />}

            <HourLabels display={numberDisplay} blocks={blocks} />
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
              { value: "major", label: "주요" },
              { value: "none", label: "없음" },
            ]}
            value={numberDisplay}
            onChange={(v) => setNumberDisplay(v)}
          />
        </div>
      </div>

      {/* 오른쪽: 입력 폼 */}
      <div className="w-full lg:w-80 shrink-0">
        <TimeBlockInput onAdd={handleAdd} />
      </div>
    </div>
  );
}
