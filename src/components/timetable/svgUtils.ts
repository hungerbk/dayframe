// SVG 뷰박스 중심 좌표 (600×600 기준)
export const CX = 300;
export const CY = 300;
export const OUTER_R = 230; // 바깥 반지름
export const INNER_R = 105; // 도넛 모드의 안쪽 반지름 (구멍)
export const LABEL_R = 258; // 시각 레이블을 원 바깥에 배치할 반지름
export const TICK_OUTER = OUTER_R + 10; // 눈금선 바깥 끝 반지름
export const TICK_MINOR_INNER = OUTER_R + 4; // 일반 눈금선 안쪽 끝 반지름 (짧게)
export const TICK_MAJOR_INNER = OUTER_R + 2; // 주요 눈금선(0, 6, 12, 18시) 안쪽 끝 반지름 (더 길게)
export const FONT_SIZE = 13;
export const CHAR_WIDTH = 12; // 한글/영문 혼합 기준 글자당 평균 px (font-size 13 기준)
export const LINE_HEIGHT = 18; // 줄 간격 px

export type Shape = "donut" | "circle";
export type NumberDisplay = "all" | "block" | "major" | "none";

/**
 * HH:MM 문자열을 SVG 각도(라디안)로 변환한다.
 * SVG 각도 0은 오른쪽(3시 방향)이므로, -π/2를 빼서 12시 방향(00:00)이 기준이 되게 한다.
 * 예) 00:00 → -π/2, 06:00 → 0, 12:00 → π/2, 18:00 → π
 */
export function timeToAngle(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return ((h * 60 + m) / (24 * 60)) * 2 * Math.PI - Math.PI / 2;
}

/**
 * 극좌표(반지름, 각도)를 SVG 직교좌표(x, y)로 변환한다.
 * 중심은 (CX, CY)를 기준으로 한다.
 */
export function polar(r: number, angle: number) {
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
export function sectorPath(innerR: number, outerR: number, startAngle: number, endAngle: number): string {
  const f = (n: number) => n.toFixed(3);
  const arcAngle = endAngle - startAngle;
  const sO = polar(outerR, startAngle);

  // SVG arc는 시작점과 끝점이 같으면 아무것도 그리지 않는다.
  // 24시간 블록(arcAngle ≈ 2π)처럼 완전한 원이 되는 경우, 반호(半弧) 두 개로 나눠 그린다.
  if (arcAngle >= 2 * Math.PI - 0.001) {
    const mO = polar(outerR, startAngle + Math.PI);
    if (innerR === 0) {
      return [`M ${CX} ${CY}`, `L ${f(sO.x)} ${f(sO.y)}`, `A ${outerR} ${outerR} 0 1 1 ${f(mO.x)} ${f(mO.y)}`, `A ${outerR} ${outerR} 0 1 1 ${f(sO.x)} ${f(sO.y)}`, "Z"].join(" ");
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

const MAX_LINES = 3; // 도넛 반지름 공간(125px)을 고려한 최대 줄 수

/**
 * 텍스트를 최대 글자 수 기준으로 줄 배열로 나눈다.
 * 공백이 있으면 단어 단위로 줄을 나누고, 없으면 글자 단위로 자른다.
 * MAX_LINES 초과분은 버린다.
 */
export function splitIntoLines(text: string, maxCharsPerLine: number): string[] {
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
