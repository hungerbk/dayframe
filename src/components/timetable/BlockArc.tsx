import { useMemo } from "react";
import rough from "roughjs";
import type { TimeBlock } from "@/types";
import { timeToAngle, polar, sectorPath, splitIntoLines, CX, CY, OUTER_R, FONT_SIZE, CHAR_WIDTH, LINE_HEIGHT, MAX_LINES, COLOR_ARC_SEPARATOR, COLOR_BLOCK_TEXT, COLOR_SKETCH_BLOCK_TEXT } from "./svgUtils";
import { TITLE_MAX_LENGTH } from "@/constants/timetable";

const generator = rough.generator();

interface BlockArcProps {
  block: TimeBlock;
  innerR: number;
  sketch?: boolean;
  onClick?: () => void;
  isSelected?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function BlockArc({ block, innerR, sketch = false, onClick, isSelected = false, isHovered = false, onMouseEnter, onMouseLeave }: BlockArcProps) {
  const startAngle = timeToAngle(block.startTime);
  let endAngle = timeToAngle(block.endTime);
  // 자정을 넘는 블록(예: 22:00~07:00): endAngle이 startAngle보다 작으면
  // 2π를 더해 시계 방향으로 이어지게 한다
  if (endAngle <= startAngle) endAngle += 2 * Math.PI;

  const arcAngle = endAngle - startAngle;
  const midAngle = startAngle + arcAngle / 2;

  // 선택/호버 시 outer radius를 키워 블록이 원 밖으로 돌출되게 한다
  const effectiveOuterR = isSelected || isHovered ? OUTER_R + 12 : OUTER_R;

  // 텍스트 위치는 원래 반지름 기준으로 유지해 호버 시 텍스트가 튀지 않게 한다
  const midTextR = (OUTER_R + innerR) / 2;
  const { x: tx, y: ty } = polar(midTextR, midAngle);

  // arcAngle >= π이면 호의 중앙부는 공간이 충분하므로 지름 전체를 사용한다.
  // 작은 호에서는 현(chord) 길이로 가로 여백을 추정한다.
  // 최소 7글자/줄을 보장해 20자 입력이 3줄 내에 합리적으로 나뉘도록 한다.
  const chordWidth = arcAngle >= Math.PI ? 2 * midTextR : 2 * Math.sin(arcAngle / 2) * midTextR;
  const maxCharsPerLine = Math.max(Math.floor(chordWidth / CHAR_WIDTH), Math.ceil(TITLE_MAX_LENGTH / MAX_LINES));
  const showText = !!block.title;

  const titleLines = showText ? splitIntoLines(block.title!, maxCharsPerLine) : [];

  // 여러 줄을 세로 중앙에 맞추기 위해 첫 번째 tspan의 시작 위치를 위로 올린다.
  const textBlockHalfHeight = ((titleLines.length - 1) * LINE_HEIGHT) / 2;

  // rough.js path를 useMemo로 캐싱해 re-render 시 스케치 선이 흔들리지 않게 한다
  // sketch=false일 때는 계산 자체를 건너뛴다
  const roughPaths = useMemo(() => {
    if (!sketch) return [];
    const pathData = sectorPath(innerR, effectiveOuterR, startAngle, endAngle);
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
  }, [sketch, block.color, innerR, startAngle, endAngle, effectiveOuterR]);

  const clipId = `clip-${block.id}`;
  const maskId = `mask-${block.id}`;

  return (
    <g
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: onClick ? "pointer" : undefined, filter: isSelected ? "drop-shadow(0 0 12px color-mix(in srgb, var(--color-primary) 70%, transparent))" : undefined }}>
      <defs>
        {block.imageDataUrl && (
          <clipPath id={clipId}>
            <path d={sectorPath(innerR, effectiveOuterR, startAngle, endAngle)} />
          </clipPath>
        )}
        {/* 스케치 모드: rough.js 경로를 마스크로 사용해 이미지가 해칭 선 위에만 보이게 한다 */}
        {block.imageDataUrl && sketch && (
          <mask id={maskId}>
            {roughPaths.map((p, i) => (
              <path key={i} d={p.d} stroke="white" strokeWidth={(p.strokeWidth ?? 1) * 4} fill={p.fill && p.fill !== "none" ? "white" : "none"} />
            ))}
          </mask>
        )}
      </defs>
      {sketch ? (
        <>
          {/* 클릭/호버 영역을 sector 전체로 확장하는 투명 패스 */}
          <path d={sectorPath(innerR, effectiveOuterR, startAngle, endAngle)} fill="transparent" stroke="none" />
          {roughPaths.map((p, i) => (
            <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? "none"} />
          ))}
        </>
      ) : (
        <path d={sectorPath(innerR, effectiveOuterR, startAngle, endAngle)} fill={block.color} stroke={COLOR_ARC_SEPARATOR} strokeWidth={1} opacity={0.92} />
      )}
      {/* clipPath는 바깥 g에, transform은 안쪽 image에 분리해야 클립 경계가 고정된 채로 이미지 내용만 이동/확대된다 */}
      {block.imageDataUrl && (
        <g clipPath={`url(#${clipId})`} mask={sketch ? `url(#${maskId})` : undefined} style={{ pointerEvents: "none" }}>
          <image
            href={block.imageDataUrl}
            x={CX - OUTER_R}
            y={CY - OUTER_R}
            width={OUTER_R * 2}
            height={OUTER_R * 2}
            preserveAspectRatio="xMidYMid slice"
            transform={`translate(${CX + (block.imageOffsetX ?? 0)}, ${CY + (block.imageOffsetY ?? 0)}) scale(${block.imageScale ?? 1}) translate(${-CX}, ${-CY})`}
          />
        </g>
      )}
      {isSelected && <path d={sectorPath(innerR, effectiveOuterR, startAngle, endAngle)} fill="none" stroke={sketch ? undefined : "white"} strokeWidth={2} style={{ pointerEvents: "none" }} />}
      {titleLines.length > 0 && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={FONT_SIZE}
          fill={sketch ? COLOR_SKETCH_BLOCK_TEXT : COLOR_BLOCK_TEXT}
          fontWeight={sketch ? 700 : 600}
          stroke={sketch ? COLOR_BLOCK_TEXT : block.color}
          strokeWidth={3}
          style={{ pointerEvents: "none", userSelect: "none", paintOrder: "stroke fill" }}>
          {titleLines.map((line, i) => (
            <tspan key={i} x={tx} y={ty - textBlockHalfHeight + i * LINE_HEIGHT}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </g>
  );
}
