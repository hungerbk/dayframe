import { useState } from "react";

export function useDropdown() {
  const [open, setOpen] = useState(false);
  return {
    open,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
    anchorProps: {
      onBlur: (e: React.FocusEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      },
    },
  };
}
