import { useState } from "react";
import type { TimeBlock } from "@/types";
import { pickRandomColor } from "@/utils";
import { CORAL_BLOCK_COLORS } from "@/constants/palettes";
import TimeBlockInput from "@/components/ui/TimeBlockInput";

// SVG 뷰박스 중심 좌표 (600×600 기준)
const CX = 300;
const CY = 300;
const OUTER_R = 230; // 도넛 바깥 반지름
const INNER_R = 105; // 도넛 안쪽 반지름 (구멍)
const MID_R = (OUTER_R + INNER_R) / 2; // 블록 텍스트를 배치할 호의 중간 반지름
const LABEL_R = 258; // 시각 레이블(0, 6, 12, 18)을 원 바깥에 배치할 반지름
const TICK_OUTER = OUTER_R + 10; // 눈금선 바깥 끝 반지름
const TICK_MINOR_INNER = OUTER_R + 4; // 일반 눈금선 안쪽 끝 반지름 (짧게)
const TICK_MAJOR_INNER = OUTER_R + 2; // 주요 눈금선(0, 6, 12, 18시) 안쪽 끝 반지름 (더 짧아서 굵어보임)

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
 * 도넛 형태의 부채꼴(annular sector) SVG path를 생성한다.
 *
 * 경로 순서:
 * 1. 외호 시작점으로 이동 (M)
 * 2. 외호를 시계 방향으로 그림 (A, sweep-flag=1)
 * 3. 외호 끝점 → 내호 끝점으로 직선 이동 (L)
 * 4. 내호를 반시계 방향으로 그림 (A, sweep-flag=0) — 외호와 반대 방향이어야 닫힌 도형이 됨
 * 5. 경로 닫기 (Z)
 *
 * large-arc-flag: 호의 각도가 π(180°)를 초과하면 1, 아니면 0.
 * 절반 이상을 차지하는 블록이 짧은 쪽 호로 그려지는 것을 방지하기 위해 필요하다.
 */
function annularSectorPath(
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
): string {
  const sO = polar(outerR, startAngle); // 외호 시작점
  const eO = polar(outerR, endAngle);   // 외호 끝점
  const sI = polar(innerR, startAngle); // 내호 시작점
  const eI = polar(innerR, endAngle);   // 내호 끝점
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const f = (n: number) => n.toFixed(3);
  return [
    `M ${f(sO.x)} ${f(sO.y)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${f(eO.x)} ${f(eO.y)}`,
    `L ${f(eI.x)} ${f(eI.y)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${f(sI.x)} ${f(sI.y)}`,
    "Z",
  ].join(" ");
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
        return (
          <line
            key={h}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={isMajor ? "#94a3b8" : "#cbd5e1"}
            strokeWidth={isMajor ? 1.5 : 1}
          />
        );
      })}
    </>
  );
}

function HourLabels() {
  return (
    <>
      {HOUR_LABELS.map(({ hour, label }) => {
        const angle = (hour / 24) * 2 * Math.PI - Math.PI / 2;
        const { x, y } = polar(LABEL_R, angle);
        return (
          <text
            key={hour}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={600}
            fill="#64748b"
          >
            {label}
          </text>
        );
      })}
    </>
  );
}

interface BlockArcProps {
  block: TimeBlock;
}

const FONT_SIZE = 13;
const CHAR_WIDTH = 8;  // 한글/영문 혼합 기준 글자당 평균 px (font-size 13 기준)
const LINE_HEIGHT = 18; // 줄 간격 px
const MAX_LINES = 3;   // 도넛 반지름 공간(125px)을 고려한 최대 줄 수

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

function BlockArc({ block }: BlockArcProps) {
  const startAngle = timeToAngle(block.startTime);
  let endAngle = timeToAngle(block.endTime);
  // 자정을 넘는 블록(예: 22:00~07:00): endAngle이 startAngle보다 작으면
  // 2π를 더해 시계 방향으로 이어지게 한다
  if (endAngle <= startAngle) endAngle += 2 * Math.PI;
  const arcAngle = endAngle - startAngle;
  const midAngle = startAngle + arcAngle / 2;
  const { x: tx, y: ty } = polar(MID_R, midAngle);

  // 텍스트 표시 최소 호 각도: π/24 ≈ 약 30분에 해당하는 각도
  const minAngleForText = Math.PI / 24;
  // MID_R 위치에서의 현(chord) 길이로 텍스트 가로 여백을 추정한다.
  // 텍스트는 가로 방향(비회전)이므로 호 길이보다 현 길이가 더 적합한 기준이다.
  const chordWidth = 2 * Math.sin(arcAngle / 2) * MID_R;
  const maxCharsPerLine = Math.floor(chordWidth / CHAR_WIDTH);
  const showText =
    block.title && arcAngle >= minAngleForText && maxCharsPerLine >= 2;

  const lines = showText ? splitIntoLines(block.title!, maxCharsPerLine) : [];

  // 여러 줄을 세로 중앙에 맞추기 위해 첫 번째 tspan의 시작 위치를 위로 올린다.
  // 전체 텍스트 블록 높이의 절반만큼 ty에서 뺀다.
  const textBlockHalfHeight = ((lines.length - 1) * LINE_HEIGHT) / 2;

  return (
    <g>
      <path
        d={annularSectorPath(INNER_R, OUTER_R, startAngle, endAngle)}
        fill={block.color}
        stroke="white"
        strokeWidth={1}
        opacity={0.92}
      />
      {lines.length > 0 && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={FONT_SIZE}
          fill="white"
          fontWeight={600}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {lines.map((line, i) => (
            <tspan
              key={i}
              x={tx}
              y={ty - textBlockHalfHeight + i * LINE_HEIGHT}
            >
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}

export default function TimetableCanvas() {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);

  // TimeBlockInput이 전달하는 color를 무시하고, 팔레트에서 자동 배정한다.
  // prevColor를 넘겨 같은 색이 연속으로 배정되지 않게 한다.
  function handleAdd(block: TimeBlock) {
    const prevColor = blocks[blocks.length - 1]?.color;
    const color = pickRandomColor(CORAL_BLOCK_COLORS, prevColor);
    setBlocks((prev) => [...prev, { ...block, color }]);
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="w-full max-w-lg aspect-square">
        <svg viewBox="0 0 600 600" width="100%" height="100%">
          {/* 배경 원 */}
          <circle cx={CX} cy={CY} r={OUTER_R} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1} />
          {/* 초기 내부 구멍: 블록 렌더링 전에 미리 흰색으로 채운다 */}
          <circle cx={CX} cy={CY} r={INNER_R} fill="white" />

          <HourTicks />

          {blocks.map((block) => (
            <BlockArc key={block.id} block={block} />
          ))}

          {/* 블록이 내부 반지름 안쪽을 침범하지 않도록 흰 원으로 덮는다 */}
          <circle cx={CX} cy={CY} r={INNER_R} fill="white" />

          <HourLabels />
        </svg>
      </div>

      <div className="w-full max-w-lg">
        <TimeBlockInput onAdd={handleAdd} />
      </div>
    </div>
  );
}
