interface DropdownPanelProps {
  /** 트리거 버튼 기준으로 드롭다운이 열리는 방향. "top": 위쪽(bottom-full), "bottom": 아래쪽(top-full) */
  side?: "top" | "bottom";
  /** 드롭다운 패널의 수평 정렬. "left": 트리거 왼쪽 끝 기준, "center": 트리거 중앙 기준, "right": 트리거 오른쪽 끝 기준 */
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}

export function DropdownPanel({ side = "bottom", align = "left", children }: DropdownPanelProps) {
  const sideClass = side === "top" ? "bottom-full mb-1.5" : "top-full mt-1";
  const alignClass = align === "center" ? "left-1/2 -translate-x-1/2" : align === "right" ? "right-0" : "left-0";
  return <div className={`absolute ${sideClass} ${alignClass} bg-white border border-border rounded-lg shadow-md overflow-hidden z-20 min-w-30`}>{children}</div>;
}

interface DropdownItemProps {
  onClick: () => void;
  border?: "top" | "bottom";
  active?: boolean;
  children: React.ReactNode;
}

export function DropdownItem({ onClick, border, active, children }: DropdownItemProps) {
  const borderClass = border === "bottom" ? "border-b border-border" : border === "top" ? "border-t border-border" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between hover:bg-border/30 transition-colors ${borderClass} ${active ? "text-primary font-medium" : "text-text"}`}>
      {children}
    </button>
  );
}
