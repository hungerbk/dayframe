import { useMemo, memo } from "react";
import rough from "roughjs";
import type { TimeBlock } from "@/types";
import { polar, CX, CY, OUTER_R, LABEL_R, TICK_OUTER, TICK_MINOR_INNER, TICK_MAJOR_INNER } from "./svgUtils";
import type { NumberDisplay } from "./svgUtils";

const generator = rough.generator();

export function HourTicks() {
  return (
    <>
      {Array.from({ length: 24 }, (_, h) => {
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

const HOUR_LABELS: { hour: number; label: string }[] = [
  { hour: 0, label: "0" },
  { hour: 6, label: "6" },
  { hour: 12, label: "12" },
  { hour: 18, label: "18" },
];

// 주요 레이블 시각 — 'all' 모드에서 블록 시각과 중복 표시 방지에 사용
const MAJOR_TIME_SET = new Set(["00:00", "06:00", "12:00", "18:00", "24:00"]);

interface HourLabelsProps {
  display: NumberDisplay;
  blocks: TimeBlock[];
}

export function HourLabels({ display, blocks }: HourLabelsProps) {
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

  const blockTimes = blocks.flatMap((b) => [b.startTime, b.endTime]);

  // 'block' 모드: 블록 시각만, 'all' 모드: 주요 레이블 + 블록 시각(겹치는 시각 제외)
  const uniqueBlockTimes = [...new Set(blockTimes)].filter((t) => display === "block" || !MAJOR_TIME_SET.has(t));

  const blockItems = uniqueBlockTimes.map((time) => {
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
  });

  return (
    <>
      {display === "all" && majorItems}
      {blockItems}
    </>
  );
}

export const SketchBackground = memo(function SketchBackground() {
  const paths = useMemo(() => {
    const drawable = generator.circle(CX, CY, OUTER_R * 2, {
      roughness: 1.8,
      seed: 1,
      stroke: "#8B7355",
      strokeWidth: 1.5,
      fill: "#FEFCF0",
      fillStyle: "solid",
    });
    return generator.toPaths(drawable);
  }, []);
  return (
    <g>
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? "#FEFCF0"} />
      ))}
    </g>
  );
});

export const SketchHourTicks = memo(function SketchHourTicks() {
  const allPaths = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => {
      const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
      const isMajor = h % 6 === 0;
      // 주요 시각은 눈금 시작점을 바깥쪽으로 당겨 더 길게 보이게 한다
      const inner = isMajor ? TICK_MAJOR_INNER : TICK_MINOR_INNER;
      const p1 = polar(inner, angle);
      const p2 = polar(TICK_OUTER, angle);
      const drawable = generator.line(p1.x, p1.y, p2.x, p2.y, {
        roughness: 1.0,
        seed: h + 1,
        stroke: isMajor ? "#94a3b8" : "#cbd5e1",
        strokeWidth: isMajor ? 1.5 : 1,
      });
      return { tickPaths: generator.toPaths(drawable), h };
    });
  }, []);
  return (
    <>
      {allPaths.flatMap(({ tickPaths, h }) =>
        tickPaths.map((p, i) => (
          <path key={`${h}-${i}`} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" />
        )),
      )}
    </>
  );
});

export function SketchCircleStroke({ r }: { r: number }) {
  const paths = useMemo(() => {
    const drawable = generator.circle(CX, CY, r * 2, {
      roughness: 1.8,
      seed: 2,
      stroke: "#8B7355",
      strokeWidth: 1.5,
      fill: "none",
    });
    return generator.toPaths(drawable);
  }, [r]);
  return (
    <>
      {paths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill="none" />
      ))}
    </>
  );
}
