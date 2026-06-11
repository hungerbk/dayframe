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

    const handleFocusOut = (e: FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, [open]);

  return {
    open,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
    containerRef,
  };
}
