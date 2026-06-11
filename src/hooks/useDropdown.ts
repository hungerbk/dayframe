import { useState, useRef, useEffect } from "react";

export function useDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    // pointerdown은 iOS Safari 포함 모든 브라우저에서 안정적으로 동작
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return {
    open,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
    containerRef,
  };
}
