import { useMemo } from "react";
import rough from "roughjs";
import type { TimeBlock } from "@/types";
import { timeToAngle, polar, sectorPath, splitIntoLines, OUTER_R, FONT_SIZE, CHAR_WIDTH, LINE_HEIGHT } from "./svgUtils";

const generator = rough.generator();

interface BlockArcProps {
  block: TimeBlock;
  innerR: number;
}

export function BlockArc({ block, innerR }: BlockArcProps) {
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

export function SketchBlockArc({ block, innerR }: BlockArcProps) {
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

  // rough.js path를 useMemo로 캐싱해 re-render 시 스케치 선이 흔들리지 않게 한다
  const roughPaths = useMemo(() => {
    const pathData = sectorPath(innerR, OUTER_R, startAngle, endAngle);
    const drawable = generator.path(pathData, {
      roughness: 1.5,
      seed: 1,
      bowing: 0.8,
      stroke: block.color,
      strokeWidth: 1.5,
      fill: block.color,
      fillStyle: "hachure",
      hachureGap: 8,
      hachureAngle: 45,
      fillWeight: 1.2,
    });
    return generator.toPaths(drawable);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, block.color, block.startTime, block.endTime, innerR]);

  return (
    <g>
      {roughPaths.map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? "none"} />
      ))}
      {lines.length > 0 && (
        <text textAnchor="middle" dominantBaseline="central" fontSize={FONT_SIZE} fill="#1C1C1C" fontWeight={700} style={{ pointerEvents: "none", userSelect: "none" }}>
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
