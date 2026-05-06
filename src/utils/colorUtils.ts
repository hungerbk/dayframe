export function pickRandomColor(colors: string[], prevColor?: string): string {
  if (colors.length === 1) return colors[0];

  const candidates = prevColor
    ? colors.filter((c) => c !== prevColor)
    : colors;

  return candidates[Math.floor(Math.random() * candidates.length)];
}
