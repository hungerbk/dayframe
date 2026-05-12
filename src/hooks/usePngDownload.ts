import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";

type DownloadSize = "square" | "mobile";

function composeMobileCanvas(squareDataUrl: string, bgColor: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = Math.round(w * (16 / 9));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, Math.round((h - w) / 2), w, w);
      resolve(canvas.toDataURL("image/png"));
    };
    img.src = squareDataUrl;
  });
}

export function usePngDownload(bgColor: string) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showSizeMenu) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowSizeMenu(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showSizeMenu]);

  async function download(size: DownloadSize) {
    if (!targetRef.current || isDownloading) return;
    setIsDownloading(true);
    setShowSizeMenu(false);
    try {
      const date = new Date().toISOString().slice(0, 10);
      const squareDataUrl = await toPng(targetRef.current, {
        pixelRatio: 2,
        backgroundColor: bgColor,
        // 외부 CDN 폰트 fetch 시 CORS 우회를 위해 캐시 없이 재요청
        fetchRequestInit: { cache: "no-cache" },
      });
      const finalDataUrl =
        size === "mobile" ? await composeMobileCanvas(squareDataUrl, bgColor) : squareDataUrl;
      const link = document.createElement("a");
      link.download = `dayframe-${date}.png`;
      link.href = finalDataUrl;
      link.click();
    } finally {
      setIsDownloading(false);
    }
  }

  return { isDownloading, showSizeMenu, setShowSizeMenu, targetRef, menuRef, download };
}
