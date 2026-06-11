import { useRef, useLayoutEffect, useState } from "react";

interface DropdownPanelProps {
  /** 트리거 버튼 기준으로 드롭다운이 열리는 방향. "top": 위쪽, "bottom": 아래쪽, "auto": 뷰포트 경계 감지 후 자동 결정 */
  side?: "top" | "bottom" | "auto";
  /** 드롭다운 패널의 수평 정렬. "left": 트리거 왼쪽 끝 기준, "center": 트리거 중앙 기준, "right": 트리거 오른쪽 끝 기준 */
  align?: "left" | "center" | "right";
  /** 너비 등 추가 Tailwind 클래스 */
  className?: string;
  children: React.ReactNode;
}

export function DropdownPanel({ side = "bottom", align = "left", className, children }: DropdownPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [resolvedSide, setResolvedSide] = useState<"top" | "bottom">("bottom");

  // 위아래 여유 공간의 기준은 버튼(트리거)이므로 parentRect를 사용. 아래 공간이 패널 높이보다 좁고 위 공간이 더 여유로울 때만 위로 열림
  useLayoutEffect(() => {
    if (side !== "auto") return;
    const panel = panelRef.current;
    if (!panel) return;
    const parent = panel.parentElement;
    if (!parent) return;
    const parentRect = parent.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const spaceBelow = window.innerHeight - parentRect.bottom;
    const spaceAbove = parentRect.top;
    if (spaceBelow < panelRect.height && spaceAbove > spaceBelow) {
      setResolvedSide("top");
    } else {
      setResolvedSide("bottom");
    }
  }, [side]);

  const effectiveSide = side === "auto" ? resolvedSide : side;
  const sideClass = effectiveSide === "top" ? "bottom-full mb-1.5" : "top-full mt-1";
  const alignClass = align === "center" ? "left-1/2 -translate-x-1/2" : align === "right" ? "right-0" : "left-0";
  return <div ref={panelRef} className={`absolute ${sideClass} ${alignClass} bg-white border border-border rounded-lg shadow-md overflow-hidden z-20 min-w-30 ${className ?? ""}`}>{children}</div>;
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
      aria-pressed={active ?? false}
      className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between hover:bg-border/30 transition-colors ${borderClass} ${active ? "text-primary font-medium" : "text-text"}`}>
      {children}
    </button>
  );
}
